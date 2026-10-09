import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Moon, NightSky } from '@/components/night-sky';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, fonts, styles } from '@/lib/theme';

const MAX_LENGTH = 30;

// Shown once per new user: choose a name. Names are unique (the database
// rejects a name someone else already has, ignoring capitalization).
export function PickName() {
  const { session, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const trimmed = name.trim();

  async function save() {
    if (!session || !trimmed) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', session.user.id);
    if (error) {
      setBusy(false);
      setMessage(error.code === '23505' ? `“${trimmed}” is already taken. Try another name.` : error.message);
      return;
    }
    await refreshProfile();
  }

  return (
    <NightSky>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
          <Moon size={44} />
          <Text style={styles.h1}>What should we call you?</Text>
          <Text style={[styles.muted, { fontSize: 15, lineHeight: 21, marginBottom: 8 }]}>
            Pick a name. Nobody else can use the same one.
          </Text>
          <TextInput
            value={name}
            onChangeText={(t) => { setName(t); setMessage(null); }}
            placeholder="Your name"
            placeholderTextColor={colors.faint}
            maxLength={MAX_LENGTH}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={save}
            accessibilityLabel="Your name"
            style={styles.input}
          />
          {message && <Text style={styles.error}>{message}</Text>}
          <Pressable
            onPress={save}
            disabled={!trimmed || busy}
            style={[styles.button, { backgroundColor: !trimmed || busy ? colors.card : colors.accent }]}>
            <Text style={[styles.buttonText, { color: !trimmed || busy ? colors.muted : colors.onAccent }]}>
              {busy ? 'Saving…' : 'Continue'}
            </Text>
          </Pressable>
          <Text style={[styles.muted, { textAlign: 'center', fontFamily: fonts.body }]}>
            This name stays with this device.
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </NightSky>
  );
}
