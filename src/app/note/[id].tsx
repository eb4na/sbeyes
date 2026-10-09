import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

// Save this long after the last keystroke.
const SAVE_DELAY_MS = 800;

type Status = 'loading' | 'saved' | 'unsaved' | 'saving' | 'error';

export default function NoteEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, styles } = useTheme();
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>('loading');
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const latest = useRef({ title, body });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.from('notes').select('title, body').eq('id', id).single().then(({ data }) => {
      if (data) {
        setTitle(data.title);
        setBody(data.body);
        latest.current = data;
      }
      setStatus('saved');
    });
  }, [id]);

  async function save() {
    timer.current = null;
    setStatus('saving');
    const { error } = await supabase.from('notes').update(latest.current).eq('id', id);
    if (error) {
      setStatus('error');
      timer.current = setTimeout(save, 3000);
    } else {
      setStatus((s) => (s === 'saving' ? 'saved' : s));
      setSavedAt(new Date());
    }
  }

  function edit(next: { title?: string; body?: string }) {
    latest.current = { ...latest.current, ...next };
    if (next.title !== undefined) setTitle(next.title);
    if (next.body !== undefined) setBody(next.body);
    setStatus('unsaved');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, SAVE_DELAY_MS);
  }

  // Flush any pending save when leaving the screen.
  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      if (timer.current) {
        clearTimeout(timer.current);
        save();
      }
    });
  });

  function confirmDelete() {
    const remove = async () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      await supabase.from('notes').delete().eq('id', id);
      router.back();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this note?')) remove();
    } else {
      Alert.alert('Delete this note?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: remove },
      ]);
    }
  }

  const statusText = {
    loading: 'Loading…',
    unsaved: 'Editing…',
    saving: 'Saving…',
    saved: savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Saved',
    error: 'Offline — will retry',
  }[status];

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}>
      <Stack.Screen
        options={{
          title: statusText,
          headerTitleStyle: { color: colors.muted, fontSize: 14, fontWeight: '400' },
          headerRight: () => (
            <Pressable onPress={confirmDelete} hitSlop={10}>
              <Text style={{ color: colors.danger, fontSize: 16 }}>Delete</Text>
            </Pressable>
          ),
        }}
      />
      {status === 'loading' ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <View style={{ flex: 1, padding: 16, gap: 8 }}>
          <TextInput
            value={title}
            onChangeText={(t) => edit({ title: t })}
            placeholder="Title"
            placeholderTextColor={colors.muted}
            style={{ fontSize: 26, fontWeight: '700', color: colors.text, paddingVertical: 6 }}
          />
          <TextInput
            value={body}
            onChangeText={(b) => edit({ body: b })}
            placeholder="Start writing…"
            placeholderTextColor={colors.muted}
            multiline
            autoFocus={!title && !body}
            textAlignVertical="top"
            style={[styles.text, { flex: 1, lineHeight: 24 }]}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
