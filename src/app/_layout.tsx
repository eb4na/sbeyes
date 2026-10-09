import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';

import { NightSky } from '@/components/night-sky';
import { PickName } from '@/components/pick-name';
import { AuthProvider, useAuth } from '@/lib/auth';
import { colors, fonts, sky, styles } from '@/lib/theme';

function RootStack() {
  const { loading, error, profile } = useAuth();
  const [fontsLoaded] = useFonts({
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (error) {
    return (
      <NightSky style={{ justifyContent: 'center', padding: 28 }}>
        <Text style={[styles.h2, { textAlign: 'center' }]}>Couldn’t start the app</Text>
        <Text style={[styles.muted, { textAlign: 'center', marginTop: 8, fontSize: 15, lineHeight: 21 }]}>{error}</Text>
      </NightSky>
    );
  }

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // First launch on this device: choose a name before anything else.
  if (!profile?.name.trim()) return <PickName />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: sky[0] },
        headerShadowVisible: false,
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text, fontFamily: fonts.bodyHeavy },
        contentStyle: { backgroundColor: sky[0] },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="letter" options={{ headerShown: false }} />
      <Stack.Screen name="note/[id]" options={{ title: '' }} />
      <Stack.Screen name="admin/index" options={{ headerShown: false }} />
      <Stack.Screen name="admin/[id]" options={{ title: '' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootStack />
    </AuthProvider>
  );
}
