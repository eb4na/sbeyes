import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { supabase, type NoteWithAuthor } from '@/lib/supabase';
import { formatDate, useTheme } from '@/lib/theme';

export default function AllNotes() {
  const { colors, styles } = useTheme();
  const { profile } = useAuth();
  const [notes, setNotes] = useState<NoteWithAuthor[]>([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notes')
      .select('*, profiles(name)')
      .order('updated_at', { ascending: false });
    setNotes((data as NoteWithAuthor[]) ?? []);
  }, []);

  // Live: reload whenever any writer creates, edits, or deletes a note.
  useEffect(() => {
    load();
    const channel = supabase
      .channel('admin-notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      [n.title, n.body, n.profiles?.name ?? ''].some((s) => s.toLowerCase().includes(q)));
  }, [notes, query]);

  if (!profile?.is_admin) {
    return <Text style={styles.empty}>Only admins can see everyone’s notes.</Text>;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={{ padding: 12 }}>
        <TextInput style={styles.input} placeholder="Search notes or writers" placeholderTextColor={colors.muted}
          value={query} onChangeText={setQuery} autoCapitalize="none" clearButtonMode="while-editing" />
      </View>
      <FlatList
        data={shown}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No notes yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/admin/${item.id}`)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Text style={[styles.rowTitle, { flex: 1 }]} numberOfLines={1}>{item.title || 'Untitled'}</Text>
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>{item.profiles?.name || 'Unknown'}</Text>
            </View>
            <Text style={styles.muted} numberOfLines={2}>
              {formatDate(item.updated_at)}{item.body ? ` · ${item.body.replace(/\s+/g, ' ')}` : ''}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
