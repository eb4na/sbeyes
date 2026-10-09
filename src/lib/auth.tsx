import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase, type Profile } from './supabase';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    supabase
      .from('profiles')
      .select('id, name, is_admin')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [userId]);

  return <AuthContext.Provider value={{ session, profile, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
