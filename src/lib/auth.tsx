import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase, type Profile } from './supabase';

// Username + password accounts (no email). register() in the database creates
// the account; signing in uses the username's placeholder address. The reader
// is whichever user has profiles.is_admin.

const usernameEmail = (username: string) => `${username.trim().toLowerCase()}@users.sbeyes.example`;

export async function signIn(username: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: usernameEmail(username), password });
  if (!error) return null;
  return error.message.toLowerCase().includes('invalid') ? 'Wrong username or password.' : error.message;
}

export async function signUp(username: string, password: string): Promise<string | null> {
  const { error } = await supabase.rpc('register', { p_username: username.trim(), p_password: password });
  if (error) return error.message;
  return signIn(username, password);
}

export const signOut = () => supabase.auth.signOut();

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
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setProfile(null);
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

  const loading = !error && (!checked || (!!session && !profile));
  return (
    <AuthContext.Provider value={{ session, profile, loading, error, refreshProfile }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
