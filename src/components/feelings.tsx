import Slider from '@react-native-community/slider';
import { Pressable, Text, View } from 'react-native';

import { colors, EMOTIONS, fonts, STRESS_MAX, STRESS_ZONES, stressZone, type EmotionKey } from '@/lib/theme';

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

// Stress out of 10. With onChange it's a slider (for writing); without, it
// shows a small bar plus "6/10 · Overwhelmed".
export function StressMeter({
  value,
  onChange,
  compact = false,
}: {
  value: number | null;
  onChange?: (level: number) => void;
  compact?: boolean;
}) {
  const zone = value ? stressZone(value) : null;

  if (onChange) {
    return (
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: zone?.color ?? colors.faint }}>
            {value ?? '–'}<Text style={{ fontSize: 18, color: colors.faint }}>/{STRESS_MAX}</Text>
          </Text>
          <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 16, color: zone?.color ?? colors.muted }}>
            {zone ? zone.label : 'Slide to pick'}
          </Text>
        </View>
        <Slider
          value={value ?? 1}
          minimumValue={1}
          maximumValue={STRESS_MAX}
          step={1}
          onValueChange={(v) => onChange(Math.round(v))}
          minimumTrackTintColor={zone?.color ?? colors.faint}
          maximumTrackTintColor="rgba(255,255,255,0.15)"
          thumbTintColor={zone?.color ?? colors.text}
          accessibilityLabel="Stress level out of 10"
          style={{ height: 44 }}
        />
        <View style={{ flexDirection: 'row' }}>
          {STRESS_ZONES.map((z) => (
            <Text key={z.label}
              style={{ flex: z.to - z.from + 1, textAlign: z.from === 1 ? 'left' : z.to === STRESS_MAX ? 'right' : 'center',
                fontFamily: fonts.bodyBold, fontSize: 13, color: zone === z ? z.color : colors.faint }}>
              {z.label}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  const width = compact ? 56 : 160;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4 }}
      accessibilityLabel={value ? `Stress ${value} of ${STRESS_MAX}, ${zone!.label}` : 'No stress level picked'}>
      <View style={{ width, height: compact ? 6 : 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        {value != null && (
          <View style={{ width: `${(value / STRESS_MAX) * 100}%`, height: '100%', borderRadius: 5, backgroundColor: zone!.color }} />
        )}
      </View>
      {zone && (
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyHeavy, fontSize: compact ? 12 : 15, color: zone.color }}>
          {value}/{STRESS_MAX} · {zone.label}
        </Text>
      )}
    </View>
  );
}
