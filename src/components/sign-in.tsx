import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Moon, NightSky } from '@/components/night-sky';
import { signIn, signUp } from '@/lib/auth';
import { colors, fonts, styles } from '@/lib/theme';

// Username + password only. "Create account" makes a new user; usernames are unique.
export function SignIn() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = username.trim().length >= 2 && password.length >= 6 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setMessage(null);
    const error = mode === 'sign-up' ? await signUp(username, password) : await signIn(username, password);
    setBusy(false);
    if (error) setMessage(error);
  }

  return (
    <NightSky>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
          <Moon size={44} />
          {/* Two pieces so 남자친구 wraps as a whole word, in a rounded Korean face. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 10 }}>
            <Text style={styles.h1}>Dohyun Kim</Text>
            <Text style={[styles.h1, { fontFamily: fonts.korean, color: colors.accent }]}>남자친구</Text>
          </View>
          <Text style={[styles.muted, { fontSize: 15, lineHeight: 21, marginBottom: 8 }]}>
            {mode === 'sign-in'
              ? 'A place to say what’s on your mind, one thing at a time.'
              : 'Pick a username and a password. Nobody else can use the same username.'}
          </Text>
          <TextInput
            value={username}
            onChangeText={(t) => { setUsername(t); setMessage(null); }}
            placeholder="Username"
            placeholderTextColor={colors.faint}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            autoComplete="username"
            accessibilityLabel="Username"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={(t) => { setPassword(t); setMessage(null); }}
            placeholder="Password (6+ characters)"
            placeholderTextColor={colors.faint}
            secureTextEntry
            textContentType={mode === 'sign-up' ? 'newPassword' : 'password'}
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            onSubmitEditing={submit}
            accessibilityLabel="Password"
            style={styles.input}
          />
          {message && <Text style={styles.error}>{message}</Text>}
          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            style={[styles.button, { backgroundColor: canSubmit ? colors.accent : colors.card }]}>
            <Text style={[styles.buttonText, { color: canSubmit ? colors.onAccent : colors.muted }]}>
              {busy ? 'One moment…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Text>
          </Pressable>
          <Pressable onPress={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setMessage(null); }}>
            <Text style={{ color: colors.accent, textAlign: 'center', padding: 8, fontSize: 15, fontFamily: fonts.bodyBold }}>
              {mode === 'sign-in' ? 'New here? Make an account' : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </NightSky>
  );
}
