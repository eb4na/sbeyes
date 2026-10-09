import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmotionHeader } from '@/components/emotion-header';
import { StressMeter } from '@/components/feelings';
import { signOut, useAuth } from '@/lib/auth';
import { useReaderName } from '@/lib/reader';
import { supabase, type Note } from '@/lib/supabase';
import { Moon, NightSky } from '@/components/night-sky';
import { colors, emotionFor, fonts, groupByEmotion, styles, timeAgo } from '@/lib/theme';

// The writer's list: every individual thing they want to say.
export default function MyThings() {
  const { session, profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const reader = useReaderName();

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    setNotes(data ?? []);
  }, [session]);

  // Reload whenever we come back from the editor.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Number things in the order they were written, then group them by emotion.
  const sections = useMemo(
    () => groupByEmotion(notes.map((n, i) => ({ ...n, number: i + 1 }))),
    [notes],
  );

  // The reader (admin) gets their own screen.
  if (profile?.is_admin) return <Redirect href="/admin" />;

  async function newThing() {
    const { data, error } = await supabase.from('notes').insert({}).select().single();
    if (!error && data) router.push(`/note/${data.id}`);
  }

  return (
    <NightSky>
    <SafeAreaView style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: 22, paddingBottom: 140 }}
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
                <Text style={styles.h1}>{profile?.name}</Text>
              </View>
              <Pressable onPress={signOut} hitSlop={8}
                style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.card, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted }}>Sign out</Text>
              </Pressable>
            </View>
            <Text style={[styles.muted, { fontSize: 15, lineHeight: 21 }]}>
              Complain about whatever you’re ready to complain about, even if it’s just one thing for now, so at least it’s out there and visible. Put each thing on its own card. It saves as you type and stays hidden until it’s opened on the other side.
            </Text>
            {reader && (
              <View style={{ marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
                height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: 'rgba(255,226,154,0.12)' }}>
                <Text style={{ fontSize: 15 }}>👁</Text>
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.accent }}>
                  Only {reader} can see these
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => router.push('/letter')}
              accessibilityRole="button"
              style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card,
                borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,226,154,0.35)' }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,226,154,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>✉️</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.h2, { fontSize: 18, color: colors.accent }]}>A letter for you</Text>
                <Text style={styles.muted}>Plus how this app works. Tap to read.</Text>
              </View>
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 22, color: colors.accent }}>›</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Nothing yet. Tap “New thing” when you’re ready to write the first one.</Text>
        }
        renderItem={({ item }) => {
          const emotion = emotionFor(item.emotion);
          return (
            <Pressable onPress={() => router.push(`/note/${item.id}`)}
              style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', opacity: item.held ? 0.6 : 1 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: emotion.color, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>{emotion.emoji}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: emotion.tint, borderRadius: 26, borderTopLeftRadius: 8, padding: 16, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={[styles.h2, { color: emotion.color, flex: 1 }]} numberOfLines={1}>
                    {item.title || `Thing #${item.number}`}
                  </Text>
                  {/* Whether the reader has opened it yet (or it's still private). */}
                  <View style={{ height: 24, paddingHorizontal: 10, borderRadius: 12, justifyContent: 'center',
                    backgroundColor: item.held ? colors.card : item.revealed_at ? 'rgba(166,240,184,0.16)' : 'rgba(255,255,255,0.07)' }}>
                    <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12,
                      color: item.held ? colors.muted : item.revealed_at ? colors.success : colors.faint }}>
                      {item.held ? '🔒 Only you' : item.revealed_at ? '✓ Opened' : 'Not opened yet'}
                    </Text>
                  </View>
                </View>
                {!!item.body && (
                  <Text style={[styles.text, { fontSize: 15, opacity: 0.9 }]} numberOfLines={2}>{item.body}</Text>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <StressMeter value={item.stress} compact />
                  <Text style={styles.muted}>{timeAgo(item.updated_at)}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      <View style={{ position: 'absolute', bottom: 34, left: 0, right: 0, alignItems: 'center' }}>
        <Pressable
          onPress={newThing}
          accessibilityLabel="Write a new thing"
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 10, height: 64, paddingHorizontal: 28, borderRadius: 32,
            backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
          }}>
          {/* Drawn plus, so it sits exactly centered (a text "+" rides high in this font on iOS). */}
          <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: 18, height: 3.5, borderRadius: 2, backgroundColor: colors.onAccent }} />
            <View style={{ position: 'absolute', width: 3.5, height: 18, borderRadius: 2, backgroundColor: colors.onAccent }} />
          </View>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 17, color: colors.onAccent }}>New thing</Text>
        </Pressable>
      </View>
    </SafeAreaView>
    </NightSky>
  );
}
