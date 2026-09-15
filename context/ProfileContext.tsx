import type { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createProfileFromOAuthUser } from '../lib/oauthProfile';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  email: string | null;
  prenom: string | null;
  nom: string | null;
  username: string | null;
  objectif: string | null;
  sexe: string | null;
  age: number | null;
  taille: number | null;
  poids_actuel: number | null;
  poids_objectif: number | null;
  vitesse: string | null;
  niveau_activite: string | null;
  frequence_entrainement: string | null;
  lieu_entrainement: string | null;
  alimentation: string | null;
  sommeil: string | null;
  blocage: string | null;
  restrictions: string[] | null;
  engagement: string | null;
  is_subscribed: boolean;
  created_at: string | null;
  code_parrainage: string | null;
  parraine_par: string | null;
  avatar_path: string | null;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (currentUser: User) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (!error && data) {
      setProfile(data as Profile);
      return;
    }

    // No row yet. Classic email sign-up always inserts its own (fuller) row synchronously
    // right after `supabase.auth.signUp()`, so this only happens for a first-time OAuth
    // sign-in (Google) — create a minimal profile from whatever the provider handed back.
    if (currentUser.app_metadata?.provider !== 'email') {
      setProfile(await createProfileFromOAuthUser(currentUser));
      return;
    }

    setProfile(null);
  };

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    loadProfile(user).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile }}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
