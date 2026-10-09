import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Moon, NightSky } from '@/components/night-sky';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, styles } from '@/lib/theme';
import { welcomeSeenKey } from '@/lib/welcome';

const HOW_IT_WORKS = [
  { icon: '📝', text: 'Write each thing on its own card. One thing at a time, however it comes out.' },
  { icon: '💭', text: 'Pick how it makes you feel and how stressed you are about it.' },
  { icon: '💾', text: 'It saves as you type. Come back and add to it whenever you want.' },
  { icon: '🌙', text: 'Every card arrives hidden on the other side and gets opened one at a time.' },
  { icon: '🔒', text: 'Not ready yet? Turn on “Keep to myself for now” and it stays private until you share it.' },
];

// The letter Dohyun sees first, plus a short explanation of how the app works.
// The letter's text comes from the database, not this file.
export default function Welcome() {
  const { session } = useAuth();
  const [letter, setLetter] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc('get_welcome_letter').then(({ data }) => setLetter((data as string | null) ?? ''));
  }, []);

  async function start() {
    if (session) {
      try { await AsyncStorage.setItem(welcomeSeenKey(session.user.id), '1'); } catch {}
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <NightSky>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 48, gap: 22 }}>
          <View style={{ alignItems: 'center', gap: 12, marginTop: 12 }}>
            <Moon size={52} />
            <Text style={[styles.h1, { textAlign: 'center' }]}>Before you start</Text>
          </View>

          <View style={{ backgroundColor: colors.card, borderRadius: 30, borderTopLeftRadius: 10, padding: 22 }}>
            {letter === null ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={[styles.text, { fontSize: 17, lineHeight: 27 }]} selectable>{letter}</Text>
            )}
          </View>

          <View style={{ gap: 12 }}>
            <Text style={styles.label}>How this works</Text>
            {HOW_IT_WORKS.map((step) => (
              <View key={step.icon} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.cardSoft, borderRadius: 22, padding: 14 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{step.icon}</Text>
                </View>
                <Text style={[styles.text, { flex: 1, fontSize: 15, lineHeight: 21 }]}>{step.text}</Text>
              </View>
            ))}
          </View>

          <Pressable style={[styles.button, { shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } }]} onPress={start}>
            <Text style={[styles.buttonText, { fontSize: 17 }]}>Start writing</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </NightSky>
  );
}
