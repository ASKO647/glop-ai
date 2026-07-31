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
    const { data, error } = await supabase
      .from('profiles')
      .select('is_subscribed')
      .eq('id', userId)
      .single();

    // No readable profile row (missing insert, RLS, network hiccup, ...) — default to
    // unsubscribed, the same safe default the `is_subscribed` column itself has.
    setIsSubscribed(error ? false : Boolean(data?.is_subscribed));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
      if (data.session?.user) {
        loadSubscription(data.session.user.id);
      } else {
        setIsSubscribed(null);
      }
    });

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

    return () => subscription.unsubscribe();
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
