import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, sky } from '@/lib/theme';

// Fixed, pseudo-random star field so it looks the same on every screen.
const STARS = (() => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 46 }, () => ({
    top: `${rand() * 70}%` as const,
    left: `${rand() * 100}%` as const,
    size: rand() < 0.15 ? 3 : rand() < 0.5 ? 2 : 1.5,
    opacity: 0.25 + rand() * 0.6,
  }));
})();

// Background for every screen: gradient night sky with stars.
export function NightSky({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient colors={sky} locations={[0, 0.55, 1]} style={[{ flex: 1 }, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {STARS.map((s, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: s.size,
              backgroundColor: '#FFFFFF',
              opacity: s.opacity,
            }}
          />
        ))}
      </View>
      {children}
    </LinearGradient>
  );
}

// A small glowing crescent moon for headings.
export function Moon({ size = 30 }: { size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accent,
        shadowColor: colors.accent,
        shadowOpacity: 0.7,
        shadowRadius: size / 2,
        shadowOffset: { width: 0, height: 0 },
        overflow: 'hidden',
      }}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: sky[0],
          top: -size * 0.18,
          left: size * 0.32,
        }}
      />
    </View>
  );
}
