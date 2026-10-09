import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

// Show notifications even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ask for permission and save this phone's push token, so the database can
// notify the reader when a writer shares something new. Returns a reason when
// it can't (web, Simulator, permission denied, or no EAS project ID yet).
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return 'Notifications need the phone app.';
  if (!Device.isDevice) return 'Notifications only work on a real phone, not the Simulator.';

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'New things',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return 'Notifications are turned off for this app in Settings.';

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return 'Run "npx eas-cli init" once to turn on notifications.';

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', { p_token: token });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not set up notifications.';
  }
}
