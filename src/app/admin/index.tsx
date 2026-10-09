import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionHeader } from '@/components/emotion-header';
import { StressMeter } from '@/components/feelings';
import { signOut, useAuth } from '@/lib/auth';
import { registerForPushNotifications } from '@/lib/push';
import { supabase, type NoteWithAuthor } from '@/lib/supabase';
import { Moon, NightSky } from '@/components/night-sky';
import { colors, emotionFor, fonts, groupByEmotion, styles, timeAgo, type EmotionSection } from '@/lib/theme';

type Item = NoteWithAuthor & { number: number };

// The reader's view: every thing arrives hidden; tap to reveal it.
export default function Reveal() {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<NoteWithAuthor[]>([]);
  const [writers, setWriters] = useState<{ id: string; name: string }[]>([]);
  const [picked, setPicked] = useState<string | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [pushNote, setPushNote] = useState<string | null>(null);

  // Get a notification on this phone whenever a writer shares something new.
  useEffect(() => {
    if (profile?.is_admin) registerForPushNotifications().then(setPushNote);
  }, [profile?.is_admin]);

  const load = useCallback(async () => {
    const [{ data }, { data: people }] = await Promise.all([
      supabase.from('notes').select('*, profiles(name)').order('created_at', { ascending: true }),
      supabase.from('profiles').select('id, name').eq('is_admin', false).neq('name', '').order('created_at', { ascending: true }),
    ]);
    setNotes((data as NoteWithAuthor[]) ?? []);
    setWriters(people ?? []);
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
  const allItems = useMemo<Item[]>(() => {
    const counts: Record<string, number> = {};
    return notes.map((n) => ({ ...n, number: (counts[n.user_id] = (counts[n.user_id] ?? 0) + 1) }));
  }, [notes]);
  const items = useMemo(() => (picked === 'all' ? allItems : allItems.filter((n) => n.user_id === picked)), [allItems, picked]);

  const hidden = items.filter((n) => !n.revealed_at).length;

  // Everything grouped by emotion. Hidden things show their emotion and stress
  // level; only their words wait until they're revealed.
  const sections = useMemo<EmotionSection<Item>[]>(() => groupByEmotion(items), [items]);

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
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: 22, paddingBottom: 60 }}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderSectionHeader={({ section }) => (
          <EmotionHeader emoji={section.emoji} label={section.label} color={section.color} count={section.data.length} />
        )}
        refreshControl={<RefreshControl tintColor={colors.accent} refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListHeaderComponent={
          <View style={{ gap: 6, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Moon />
                <Text style={styles.h1}>Things to read</Text>
              </View>
              <Pressable onPress={signOut} hitSlop={8}
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
            {pushNote && (
              <Text style={[styles.muted, { marginTop: 6 }]}>🔕 {pushNote}</Text>
            )}
            {writers.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
                {[{ id: 'all', label: 'Everyone', count: allItems.length },
                  ...writers.map((w) => ({ id: w.id, label: w.name, count: allItems.filter((n) => n.user_id === w.id).length }))]
                  .map((chip) => {
                    const on = picked === chip.id;
                    return (
                      <Pressable key={chip.id} onPress={() => setPicked(chip.id)} accessibilityRole="button" accessibilityState={{ selected: on }}
                        style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, justifyContent: 'center', backgroundColor: on ? colors.accent : colors.card }}>
                        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: on ? colors.onAccent : colors.text }}>
                          {chip.label} <Text style={{ color: on ? colors.onAccent : colors.muted }}>({chip.count})</Text>
                        </Text>
                      </Pressable>
                    );
                  })}
              </ScrollView>
            )}
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
  const emotion = emotionFor(item.emotion);
  return (
    <Pressable
      onPress={onReveal}
      accessibilityRole="button"
      accessibilityLabel={`Reveal thing number ${item.number} from ${item.profiles?.name ?? 'someone'}`}
      style={{ backgroundColor: colors.cardSoft, borderRadius: 26, borderWidth: 2, borderStyle: 'dashed', borderColor: emotion.color + '66',
        padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: emotion.color, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 24 }}>{emotion.emoji}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.h2, { fontSize: 18 }]}>Thing #{item.number}</Text>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: emotion.color }}>
          {item.emotion ? `Feeling ${emotion.label.toLowerCase()}` : 'No feeling picked yet'}
        </Text>
        <StressMeter value={item.stress} compact />
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
