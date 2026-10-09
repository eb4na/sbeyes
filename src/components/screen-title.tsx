import { Text, useWindowDimensions, View } from 'react-native';

import { Moon } from '@/components/night-sky';
import { styles } from '@/lib/theme';

// Moon + big heading. Shrinks on narrow phones so it never pushes the
// button beside it off the screen.
export function ScreenTitle({ children }: { children: string }) {
  const { width } = useWindowDimensions();
  const size = width < 360 ? 26 : width < 400 ? 30 : 34;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
      <Moon size={size < 34 ? 26 : 30} />
      <Text numberOfLines={1} style={[styles.h1, { fontSize: size, lineHeight: size + 6, flexShrink: 1 }]}>{children}</Text>
    </View>
  );
}
