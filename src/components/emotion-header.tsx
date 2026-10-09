import { Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

// Section heading for a group of things: emoji, emotion name, and how many.
export function EmotionHeader({ emoji, label, color, count }: { emoji: string; label: string; color: string; count: number }) {
  return (
    <View accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 12 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 26, color }}>{label}</Text>
      <View style={{ minWidth: 26, height: 24, paddingHorizontal: 8, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.muted }}>{count}</Text>
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}
