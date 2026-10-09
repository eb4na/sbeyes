import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StressMeter } from '@/components/feelings';
import { useAuth } from '@/lib/auth';
import { supabase, type Note } from '@/lib/supabase';
import { Moon, NightSky } from '@/components/night-sky';
import { colors, emotionFor, fonts, styles, timeAgo } from '@/lib/theme';

// The writer's list: every individual thing they want to say.
export default function MyThings() {
  const { session, profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  // The reader (admin) gets their own screen.
  if (profile?.is_admin) return <Redirect href="/admin" />;

  async function newThing() {
    const { data, error } = await supabase.from('notes').insert({}).select().single();
    if (!error && data) router.push(`/note/${data.id}`);
  }

  return (
    <NightSky>
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 22, paddingBottom: 140, gap: 14 }}
        refreshControl={<RefreshControl tintColor={colors.accent} refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListHeaderComponent={
          <View style={{ gap: 6, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Moon />
                <Text style={styles.h1}>Hey {profile?.name || 'there'}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => supabase.auth.signOut()} hitSlop={8}
                  style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.card, justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted }}>Sign out</Text>
                </Pressable>
              </View>
            </View>
            <Text style={[styles.muted, { fontSize: 15, lineHeight: 21 }]}>
              Complain about whatever you’re ready to complain about, even if it’s just one thing for now, so at least it’s out there and visible. Put each thing on its own card. It saves as you type and stays hidden until it’s opened on the other side.
            </Text>
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
        renderItem={({ item, index }) => {
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
                    {item.title || `Thing #${index + 1}`}
                  </Text>
                  {item.held && (
                    <View style={{ height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.card, justifyContent: 'center' }}>
                      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.muted }}>🔒 Only you</Text>
                    </View>
                  )}
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
            flexDirection: 'row', alignItems: 'center', gap: 8, height: 64, paddingHorizontal: 28, borderRadius: 32,
            backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
          }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.onAccent }}>+</Text>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 17, color: colors.onAccent }}>New thing</Text>
        </Pressable>
      </View>
    </SafeAreaView>
    </NightSky>
  );
}
