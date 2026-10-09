import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { supabase, type NoteWithAuthor, type Revision } from '@/lib/supabase';
import { formatDate, useTheme } from '@/lib/theme';

export default function AdminNote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, styles } = useTheme();
  const [note, setNote] = useState<NoteWithAuthor | null>(null);
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    const [{ data: n }, { data: r }] = await Promise.all([
      supabase.from('notes').select('*, profiles(name)').eq('id', id).maybeSingle(),
      supabase.from('note_revisions').select('*').eq('note_id', id).order('saved_at', { ascending: false }),
    ]);
    setNote(n as NoteWithAuthor | null);
    setRevisions(r ?? []);
  }, [id]);

  // Follow this note live while the writer is typing.
  useEffect(() => {
    load();
    const channel = supabase
      .channel(`admin-note-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, load]);

  if (revisions && !note) return <Text style={styles.empty}>This note was deleted.</Text>;
  if (!note) return null;

  const card = { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 14 };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: note.profiles?.name ?? '' }} />
      <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text }}>{note.title || 'Untitled'}</Text>
      <Text style={styles.muted}>
        By {note.profiles?.name || 'Unknown'} · started {formatDate(note.created_at)} · last saved {formatDate(note.updated_at)}
      </Text>
      <View style={card}>
        <Text style={[styles.text, { lineHeight: 24 }]} selectable>{note.body || '(empty)'}</Text>
      </View>

      <Pressable onPress={() => setShowHistory(!showHistory)}>
        <Text style={{ color: colors.accent, fontSize: 16, paddingVertical: 6 }}>
          {showHistory ? 'Hide saved versions' : `Show saved versions (${revisions?.length ?? 0})`}
        </Text>
      </Pressable>

      {showHistory && revisions?.map((r) => (
        <View key={r.id} style={{ gap: 6 }}>
          <Text style={styles.muted}>{formatDate(r.saved_at)} — {r.title || 'Untitled'}</Text>
          <View style={card}>
            <Text style={[styles.text, { lineHeight: 24 }]} selectable>{r.body || '(empty)'}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
