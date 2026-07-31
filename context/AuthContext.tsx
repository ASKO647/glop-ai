import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type AuthResult = { error: string | null };
type SignUpResult = AuthResult & { userId: string | null };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** null until known; only meaningful once a session exists. */
  isSubscribed: boolean | null;
  refreshSubscription: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  const loadSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_subscribed')
        .eq('id', userId)
        .single();

      // No readable profile row (missing insert, RLS, no matching row, ...) or a query
      // error — default to unsubscribed. Never leave this true or unresolved just
      // because the profile lookup failed.
      setIsSubscribed(!error && data ? Boolean(data.is_subscribed) : false);
    } catch {
      // Network-level failure (the request itself never completed) — same safe
      // default: refuse access rather than leaving isSubscribed indeterminate.
      setIsSubscribed(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const localSession = sessionData.session;

      if (!localSession) {
        if (!cancelled) {
          setSession(null);
          setIsSubscribed(null);
          setAuthLoading(false);
        }
        return;
      }

      // getSession() only reads the local cache. Validate it against the server so a
      // token left behind after the user was deleted (or otherwise revoked) doesn't
      // grant access — if this fails or comes back empty, sign out and wipe the cache.
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          throw userError ?? new Error('No user returned from getUser()');
        }
        if (!cancelled) {
          setSession(localSession);
          setAuthLoading(false);
          await loadSubscription(localSession.user.id);
        }
      } catch {
        await supabase.auth.signOut();
        if (!cancelled) {
          setSession(null);
          setIsSubscribed(null);
          setAuthLoading(false);
        }
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
      if (newSession?.user) {
        loadSubscription(newSession.user.id);
      } else {
        setIsSubscribed(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const refreshSubscription = async () => {
    if (session?.user) {
      await loadSubscription(session.user.id);
    }
  };

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null, userId: data.user?.id ?? null };
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Once a session exists, keep loading until we know its subscription state too —
  // this is what lets the root layout avoid flashing (tabs) before the paywall gate applies.
  const loading = authLoading || (!!session && isSubscribed === null);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    isSubscribed,
    refreshSubscription,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
