import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in .env (see .env.example).');
}

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On web the OAuth redirect lands back on the page with ?code=...; let the
    // client pick it up. Native apps exchange the code themselves (see auth.tsx).
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

// Only refresh the session while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export type Note = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  emotion: string | null;
  stress: number | null;
  revealed_at: string | null;
  held: boolean;
  created_at: string;
  updated_at: string;
};

export type NoteWithAuthor = Note & { profiles: { name: string } | null };

export type Revision = {
  id: number;
  note_id: string;
  title: string;
  body: string;
  emotion: string | null;
  stress: number | null;
  saved_at: string;
};

export type Profile = { id: string; name: string; is_admin: boolean };
