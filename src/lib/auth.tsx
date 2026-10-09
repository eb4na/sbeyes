import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase, type Profile } from './supabase';

// No login: the first launch on a device creates an anonymous user, and the
// device keeps that session. Every new device or browser is a new user, who
// then picks a unique name. The reader is whichever user has profiles.is_admin.

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null, profile: null, loading: true, error: null, refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setSession(data.session);
        return;
      }
      const { data: created, error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) setError(signInError.message);
      else setSession(created.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (next) setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, is_admin')
      .eq('id', userId)
      .single();
    if (profileError) setError(profileError.message);
    setProfile(data);
  }, [userId]);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  const loading = !error && (!session || !profile);
  return (
    <AuthContext.Provider value={{ session, profile, loading, error, refreshProfile }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
