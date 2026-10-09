import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StressMeter } from '@/components/feelings';
import { useAuth } from '@/lib/auth';
import { supabase, type NoteWithAuthor } from '@/lib/supabase';
import { Moon, NightSky } from '@/components/night-sky';
import { colors, emotionFor, fonts, styles, timeAgo } from '@/lib/theme';

type Item = NoteWithAuthor & { number: number };

// The reader's view: every thing arrives hidden; tap to reveal it.
export default function Reveal() {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<NoteWithAuthor[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notes')
      .select('*, profiles(name)')
      .order('created_at', { ascending: true });
    setNotes((data as NoteWithAuthor[]) ?? []);
  }, []);

  // Live: new things, edits and deletes show up without refreshing.
  useEffect(() => {
    load();
    const channel = supabase
      .channel('reveal-notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, load)
      .subscribe();
    // A thing the writer holds back stops being visible to us, so no live
    // event arrives for it; refresh now and then to drop it from the list.
    const timer = setInterval(load, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [load]);

  // Number each writer's things in the order they were written.
  const items = useMemo<Item[]>(() => {
    const counts: Record<string, number> = {};
    return notes.map((n) => ({ ...n, number: (counts[n.user_id] = (counts[n.user_id] ?? 0) + 1) }));
  }, [notes]);

  const hidden = items.filter((n) => !n.revealed_at).length;

  async function reveal(id: string) {
    // Flip it right away; the server confirms and the live update reloads.
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, revealed_at: new Date().toISOString() } : n)));
    const { error } = await supabase.rpc('set_note_revealed', { note_id: id, revealed: true });
    if (error) load();
  }

  if (!profile?.is_admin) {
    return <Text style={styles.empty}>Only the reader can open these.</Text>;
  }

  return (
    <NightSky>
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 22, paddingBottom: 60, gap: 14 }}
        refreshControl={<RefreshControl tintColor={colors.accent} refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListHeaderComponent={
          <View style={{ gap: 6, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Moon />
                <Text style={styles.h1}>Things to read</Text>
              </View>
              <Pressable onPress={() => supabase.auth.signOut()} hitSlop={8}
                style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.card, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted }}>Sign out</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(255,226,154,0.14)' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.accent }}>Live</Text>
              </View>
              <Text style={[styles.muted, { fontSize: 14 }]}>
                {hidden} hidden · {items.length - hidden} opened
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Nothing here yet. New things appear here the moment they’re written.</Text>}
        renderItem={({ item }) => (item.revealed_at ? <RevealedCard item={item} /> : <HiddenCard item={item} onReveal={() => reveal(item.id)} />)}
      />
    </SafeAreaView>
    </NightSky>
  );
}

function HiddenCard({ item, onReveal }: { item: Item; onReveal: () => void }) {
  return (
    <Pressable
      onPress={onReveal}
      accessibilityRole="button"
      accessibilityLabel={`Reveal thing number ${item.number} from ${item.profiles?.name ?? 'someone'}`}
      style={{ backgroundColor: colors.cardSoft, borderRadius: 26, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border,
        padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24 }}>🌙</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.h2, { fontSize: 18 }]}>Thing #{item.number}</Text>
        <Text style={styles.muted}>from {item.profiles?.name || 'someone'} · {timeAgo(item.created_at)}</Text>
      </View>
      <View style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.accent, justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.onAccent }}>Reveal</Text>
      </View>
    </Pressable>
  );
}

function RevealedCard({ item }: { item: Item }) {
  const emotion = emotionFor(item.emotion);
  return (
    <Pressable onPress={() => router.push(`/admin/${item.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: emotion.color, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22 }}>{emotion.emoji}</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: emotion.tint, borderRadius: 26, borderTopLeftRadius: 8, padding: 16, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text style={[styles.h2, { color: emotion.color, flex: 1 }]} numberOfLines={1}>
            {item.title || `Thing #${item.number}`}
          </Text>
          <Text style={styles.muted}>{item.profiles?.name}</Text>
        </View>
        {!!item.emotion && (
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: emotion.color }}>Feeling {emotion.label.toLowerCase()}</Text>
        )}
        {!!item.body && <Text style={[styles.text, { fontSize: 15 }]} numberOfLines={3}>{item.body}</Text>}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <StressMeter value={item.stress} compact />
          <Text style={styles.muted}>{timeAgo(item.updated_at)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
