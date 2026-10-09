import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { supabase, type Note } from '@/lib/supabase';
import { formatDate, useTheme } from '@/lib/theme';

export default function MyNotes() {
  const { colors, styles } = useTheme();
  const { session, profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });
    setNotes(data ?? []);
  }, [session]);

  // Reload whenever we come back from the editor.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function newNote() {
    const { data, error } = await supabase.from('notes').insert({}).select().single();
    if (!error && data) router.push(`/note/${data.id}`);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: profile?.name ? `${profile.name}'s notes` : 'My notes',
          headerLeft: () => (
            <Pressable onPress={() => supabase.auth.signOut()} hitSlop={10}>
              <Text style={{ color: colors.accent, fontSize: 16 }}>Sign out</Text>
            </Pressable>
          ),
          headerRight: () =>
            profile?.is_admin ? (
              <Pressable onPress={() => router.push('/admin')} hitSlop={10}>
                <Text style={{ color: colors.accent, fontSize: 16 }}>All notes</Text>
              </Pressable>
            ) : null,
        }}
      />
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No notes yet. Tap “New note” to start.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/note/${item.id}`)}>
            <Text style={styles.rowTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
            <Text style={styles.muted} numberOfLines={1}>
              {formatDate(item.updated_at)}{item.body ? ` · ${item.body.replace(/\s+/g, ' ')}` : ''}
            </Text>
          </Pressable>
        )}
      />
      <View style={{ padding: 16 }}>
        <Pressable style={styles.button} onPress={newNote}>
          <Text style={styles.buttonText}>New note</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
