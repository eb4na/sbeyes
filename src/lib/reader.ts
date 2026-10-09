import { useEffect, useState } from 'react';

import { supabase } from './supabase';

// The master account's name, so writers can see who reads their things.
let cached: string | null = null;

export function useReaderName() {
  const [name, setName] = useState<string | null>(cached);
  useEffect(() => {
    if (cached) return;
    supabase.rpc('get_reader_name').then(({ data }) => {
      cached = (data as string | null) || null;
      setName(cached);
    });
  }, []);
  return name;
}
