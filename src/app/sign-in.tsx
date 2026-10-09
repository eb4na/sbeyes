import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signInWithGoogle, webAppUrl } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Moon, NightSky } from '@/components/night-sky';
import { colors, fonts, styles } from '@/lib/theme';

export default function SignIn() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);
    const { data, error } =
      mode === 'sign-up'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { name: name.trim() }, emailRedirectTo: Platform.OS === 'web' ? webAppUrl() : undefined },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMessage(error.message);
    else if (mode === 'sign-up' && !data.session) setMessage('Check your email to confirm your account, then sign in.');
  }

  async function google() {
    setBusy(true);
    setMessage(null);
    const error = await signInWithGoogle();
    setBusy(false);
    if (error) setMessage(error);
  }

  const canSubmit = email && password.length >= 6 && (mode === 'sign-in' || name.trim());

  return (
    <NightSky>
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12, maxWidth: 420, width: '100%', alignSelf: 'center' }}>
        <Moon size={44} />
        <Text style={styles.h1}>
          {mode === 'sign-in' ? 'Hey there' : 'Make your space'}
        </Text>
        <Text style={[styles.muted, { marginBottom: 8, fontSize: 15, lineHeight: 21 }]}>
          A place to say what’s on your mind, one thing at a time. Everything saves as you go.
        </Text>

        <Pressable
          onPress={google}
          disabled={busy}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            backgroundColor: '#fff', borderColor: '#dadce0', borderWidth: 1, borderRadius: 28,
            paddingVertical: 13, opacity: busy ? 0.5 : 1,
          }}>
          <Image source={require('../../assets/google-g.png')} style={{ width: 20, height: 20 }} />
          <Text style={{ color: '#1f1f1f', fontSize: 16, fontFamily: fonts.bodyHeavy }}>Continue with Google</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={styles.muted}>or use email</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        {mode === 'sign-up' && (
          <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={colors.muted}
            value={name} onChangeText={setName} textContentType="name" autoComplete="name" />
        )}
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted}
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
          textContentType="emailAddress" autoComplete="email" />
        <TextInput style={styles.input} placeholder="Password (6+ characters)" placeholderTextColor={colors.muted}
          value={password} onChangeText={setPassword} secureTextEntry
          textContentType={mode === 'sign-up' ? 'newPassword' : 'password'} onSubmitEditing={submit} />

        {message && <Text style={styles.error}>{message}</Text>}

        <Pressable style={[styles.button, (!canSubmit || busy) && { opacity: 0.5 }]}
          disabled={!canSubmit || busy} onPress={submit}>
          <Text style={styles.buttonText}>{busy ? 'One moment…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</Text>
        </Pressable>

        <Pressable onPress={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setMessage(null); }}>
          <Text style={{ color: colors.accent, textAlign: 'center', padding: 8, fontSize: 15, fontFamily: fonts.bodyBold }}>
            {mode === 'sign-in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </NightSky>
  );
}
