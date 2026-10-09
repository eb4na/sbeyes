import { Pressable, Text, View } from 'react-native';

import { colors, EMOTIONS, fonts, STRESS, type EmotionKey } from '@/lib/theme';

export function EmotionPicker({ value, onChange }: { value: string | null; onChange: (key: EmotionKey) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {EMOTIONS.map((e) => {
        const selected = e.key === value;
        return (
          <Pressable
            key={e.key}
            onPress={() => onChange(e.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={e.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              height: 46,
              paddingHorizontal: 16,
              borderRadius: 23,
              backgroundColor: selected ? e.color : e.tint,
              borderWidth: 2,
              borderColor: selected ? e.color : 'transparent',
            }}>
            <Text style={{ fontSize: 18 }}>{e.emoji}</Text>
            <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 15, color: selected ? colors.onAccent : e.color }}>
              {e.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Five bubbles that fill up from calm (green) to overwhelmed (red).
// Pass onChange to make it tappable; leave it out to just display a level.
export function StressMeter({
  value,
  onChange,
  compact = false,
}: {
  value: number | null;
  onChange?: (level: number) => void;
  compact?: boolean;
}) {
  const current = STRESS.find((s) => s.level === value);
  const size = compact ? 10 : 50;

  return (
    <View style={{ gap: compact ? 0 : 10, flexDirection: compact ? 'row' : 'column', alignItems: compact ? 'center' : 'stretch' }}>
      <View style={{ flexDirection: 'row', gap: compact ? 4 : 10, justifyContent: compact ? 'flex-start' : 'space-between' }}>
        {STRESS.map((s) => {
          const filled = value != null && s.level <= value;
          const bubble = (
            <View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: filled ? current!.color : 'rgba(255,255,255,0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {!compact && (
                <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 17, color: filled ? colors.onAccent : colors.faint }}>
                  {s.level}
                </Text>
              )}
            </View>
          );
          return onChange ? (
            <Pressable
              key={s.level}
              onPress={() => onChange(s.level)}
              accessibilityRole="radio"
              accessibilityState={{ selected: s.level === value }}
              accessibilityLabel={`Stress ${s.level} of 5, ${s.label}`}
              hitSlop={4}>
              {bubble}
            </Pressable>
          ) : (
            <View key={s.level}>{bubble}</View>
          );
        })}
      </View>
      {compact ? (
        current && (
          <Text style={{ marginLeft: 8, fontFamily: fonts.bodyHeavy, fontSize: 12, color: current.color }}>{current.label}</Text>
        )
      ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.faint }}>Calm</Text>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 14, color: current?.color ?? colors.muted }}>
            {current ? current.label : 'Tap a bubble'}
          </Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.faint }}>Overwhelmed</Text>
        </View>
      )}
    </View>
  );
}
