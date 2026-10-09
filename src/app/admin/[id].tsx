import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { StressMeter } from '@/components/feelings';
import { supabase, type NoteWithAuthor, type Revision } from '@/lib/supabase';
import { colors, emotionFor, fonts, formatDate, styles } from '@/lib/theme';

export default function ReadThing() {
  const { id } = useLocalSearchParams<{ id: string }>();
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

  // Follow this thing live while it's still being written.
  useEffect(() => {
    load();
    const channel = supabase
      .channel(`read-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, load]);

  async function setRevealed(revealed: boolean) {
    await supabase.rpc('set_note_revealed', { note_id: id, revealed });
    if (revealed) load();
    else router.back();
  }

  if (revisions && !note) return <Text style={styles.empty}>This isn’t available right now.</Text>;
  if (!note) return null;

  if (!note.revealed_at) {
    return (
      <View style={[styles.screen, { padding: 24, justifyContent: 'center', gap: 16 }]}>
        <Text style={[styles.h1, { textAlign: 'center' }]}>Still hidden</Text>
        <Pressable style={styles.button} onPress={() => setRevealed(true)}>
          <Text style={styles.buttonText}>Reveal it</Text>
        </Pressable>
      </View>
    );
  }

  const emotion = emotionFor(note.emotion);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 18 }}>
      <Stack.Screen
        options={{
          title: note.profiles?.name ?? '',
          headerRight: () => (
            <Pressable onPress={() => setRevealed(false)} hitSlop={10}>
              <Text style={{ color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 15 }}>Hide again</Text>
            </Pressable>
          ),
        }}
      />

      <View style={{ backgroundColor: emotion.tint, borderRadius: 30, borderTopLeftRadius: 10, padding: 22, gap: 10 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: emotion.color }}>
          {note.title || 'Untitled'}
        </Text>
        <Text style={[styles.text, { fontSize: 17, lineHeight: 26 }]} selectable>{note.body || '(nothing written yet)'}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 24, padding: 16, gap: 8 }}>
          <Text style={styles.label}>Feeling</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 26 }}>{emotion.emoji}</Text>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 19, color: emotion.color }}>
              {note.emotion ? emotion.label : 'Not picked'}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 16, gap: 12 }}>
        <Text style={styles.label}>Stress level</Text>
        {note.stress ? <StressMeter value={note.stress} /> : <Text style={styles.muted}>Not picked</Text>}
      </View>

      <Text style={styles.muted}>
        Written {formatDate(note.created_at)} · last changed {formatDate(note.updated_at)} · opened {formatDate(note.revealed_at)}
      </Text>

      <Pressable onPress={() => setShowHistory(!showHistory)}>
        <Text style={{ color: colors.accent, fontFamily: fonts.bodyHeavy, fontSize: 16, paddingVertical: 6 }}>
          {showHistory ? 'Hide earlier versions' : `Show earlier versions (${revisions?.length ?? 0})`}
        </Text>
      </Pressable>

      {showHistory && revisions?.map((r) => {
        const e = emotionFor(r.emotion);
        return (
          <View key={r.id} style={{ gap: 6 }}>
            <Text style={styles.muted}>
              {formatDate(r.saved_at)}{r.emotion ? ` · ${e.emoji} ${e.label}` : ''}{r.stress ? ` · stress ${r.stress}/5` : ''}
            </Text>
            <View style={{ backgroundColor: colors.cardSoft, borderRadius: 20, padding: 14, gap: 4 }}>
              {!!r.title && <Text style={[styles.h2, { fontSize: 17 }]}>{r.title}</Text>}
              <Text style={styles.text} selectable>{r.body || '(empty)'}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
