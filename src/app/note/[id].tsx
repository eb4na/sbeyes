import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { EmotionPicker, StressMeter } from '@/components/feelings';
import { useReaderName } from '@/lib/reader';
import { supabase } from '@/lib/supabase';
import { NightSky } from '@/components/night-sky';
import { colors, emotionFor, fonts, styles } from '@/lib/theme';

// Save this long after the last change.
const SAVE_DELAY_MS = 800;

type Draft = { title: string; body: string; emotion: string | null; stress: number | null; held: boolean };
type Status = 'loading' | 'saved' | 'unsaved' | 'saving' | 'error';

export default function ThingEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [draft, setDraft] = useState<Draft>({ title: '', body: '', emotion: null, stress: null, held: false });
  const [status, setStatus] = useState<Status>('loading');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const reader = useReaderName() ?? 'the other side';

  const latest = useRef(draft);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.from('notes').select('title, body, emotion, stress, held').eq('id', id).single().then(({ data }) => {
      if (data) {
        setDraft(data);
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

  function edit(next: Partial<Draft>) {
    latest.current = { ...latest.current, ...next };
    setDraft(latest.current);
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

  // Save anything pending right now, then go back to the list.
  async function done() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await save();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function confirmDelete() {
    const remove = async () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      await supabase.from('notes').delete().eq('id', id);
      router.back();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this thing?')) remove();
    } else {
      Alert.alert('Delete this thing?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: remove },
      ]);
    }
  }

  const statusText = {
    loading: 'Loading…',
    unsaved: 'Writing…',
    saving: 'Saving…',
    saved: savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Saved',
    error: 'Offline — will retry',
  }[status];

  const emotion = emotionFor(draft.emotion);

  return (
    <NightSky>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 16,
              backgroundColor: status === 'error' ? 'rgba(255,138,128,0.16)' : 'rgba(166,240,184,0.14)' }}>
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 13, color: status === 'error' ? colors.danger : colors.success }}>
                {statusText}
              </Text>
            </View>
          ),
          headerRight: () => (
            <Pressable onPress={confirmDelete} hitSlop={10} style={{ paddingHorizontal: 4 }}>
              <Text style={{ color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 16 }}>Delete</Text>
            </Pressable>
          ),
        }}
      />
      {status === 'loading' ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 22 }} keyboardShouldPersistTaps="handled">
          <View style={{ backgroundColor: emotion.tint, borderRadius: 30, borderTopLeftRadius: 10, padding: 20, gap: 8 }}>
            <TextInput
              value={draft.title}
              onChangeText={(title) => edit({ title })}
              placeholder="In a few words…"
              placeholderTextColor={colors.faint}
              multiline
              submitBehavior="blurAndSubmit"
              scrollEnabled={false}
              style={{ fontFamily: fonts.display, fontSize: 26, color: emotion.color, paddingVertical: 4 }}
            />
            <TextInput
              value={draft.body}
              onChangeText={(body) => edit({ body })}
              placeholder="Complain about it however it comes out. It doesn’t have to be perfect, it just has to be out there."
              placeholderTextColor={colors.faint}
              multiline
              autoFocus={!draft.title && !draft.body}
              textAlignVertical="top"
              style={[styles.text, { minHeight: 160, fontSize: 17, lineHeight: 25 }]}
            />
          </View>

          <View style={{ gap: 12 }}>
            <Text style={styles.label}>How does this make you feel?</Text>
            <EmotionPicker value={draft.emotion} onChange={(e) => edit({ emotion: e })} />
          </View>

          <View style={{ gap: 12 }}>
            <Text style={styles.label}>How stressed are you about it?</Text>
            <StressMeter value={draft.stress} onChange={(stress) => edit({ stress })} />
          </View>

          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Text style={{ fontSize: 24 }}>{draft.held ? '🔒' : '💬'}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text }}>Keep to myself for now</Text>
              <Text style={[styles.muted, { lineHeight: 18 }]}>
                {draft.held
                  ? `Only you can see this. Turn it off when you’re ready for ${reader} to see it.`
                  : `Shared with ${reader}. It shows up as a hidden card until it’s opened.`}
              </Text>
            </View>
            <Switch
              value={draft.held}
              onValueChange={(held) => edit({ held })}
              accessibilityLabel="Keep to myself for now"
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>

          <Pressable
            onPress={done}
            disabled={status === 'saving'}
            accessibilityRole="button"
            style={[styles.button, { marginTop: 4, shadowColor: colors.accent, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }]}>
            <Text style={[styles.buttonText, { fontSize: 17 }]}>{status === 'saving' ? 'Saving…' : 'Done'}</Text>
          </Pressable>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
    </NightSky>
  );
}
