import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

function RootStack() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  const signedIn = !!session;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="index" options={{ title: 'My notes' }} />
        <Stack.Screen name="note/[id]" options={{ title: '' }} />
        <Stack.Screen name="admin/index" options={{ title: 'All notes' }} />
        <Stack.Screen name="admin/[id]" options={{ title: '' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootStack />
    </AuthProvider>
  );
}
