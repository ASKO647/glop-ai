import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  email: string | null;
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

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(!error && data ? (data as Profile) : null);
  };

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    loadProfile(user.id).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
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
