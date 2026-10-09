import { StyleSheet } from 'react-native';

// Night: a midnight sky with stars, frosted cards and warm moonlight accents.
export const sky = ['#060818', '#0E1030', '#1E1645'] as const;

export const colors = {
  bg: sky[0],
  card: '#1C1A45',
  cardSoft: '#14133A',
  nav: 'rgba(6, 8, 24, 0.85)',
  text: '#F2EEFF',
  muted: '#B6B0DA',
  faint: '#8A84B5',
  border: 'rgba(196, 186, 255, 0.18)',
  accent: '#FFE29A', // moonlight
  onAccent: '#1A1433',
  lavender: '#B8A6FF',
  danger: '#FF8A80',
  success: '#A6F0B8',
};

export const fonts = {
  display: 'Baloo2_800ExtraBold',
  displayBold: 'Baloo2_700Bold',
  body: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
};

export type EmotionKey =
  | 'hurt' | 'angry' | 'frustrated' | 'sad' | 'disappointed' | 'anxious' | 'confused' | 'lonely';

export type Emotion = {
  key: EmotionKey;
  label: string;
  emoji: string;
  color: string; // bright: titles, chips, icon circles
  tint: string; // translucent: bubble background
};

// Solid tint: the emotion color blended into the night card, so stars don't show through text.
function tint(hex: string, amount = 0.17) {
  const base = [0x16, 0x14, 0x3c];
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return '#' + c.map((v, i) => Math.round(base[i] + (v - base[i]) * amount).toString(16).padStart(2, '0')).join('');
}

export const EMOTIONS: Emotion[] = [
  { key: 'hurt', label: 'Hurt', emoji: '💔', color: '#FF9ACB', tint: tint('#FF9ACB') },
  { key: 'angry', label: 'Angry', emoji: '😠', color: '#FF8A80', tint: tint('#FF8A80') },
  { key: 'frustrated', label: 'Frustrated', emoji: '😤', color: '#FFB078', tint: tint('#FFB078') },
  { key: 'sad', label: 'Sad', emoji: '😢', color: '#8EC5FF', tint: tint('#8EC5FF') },
  { key: 'disappointed', label: 'Disappointed', emoji: '😞', color: '#C3B1FF', tint: tint('#C3B1FF') },
  { key: 'anxious', label: 'Anxious', emoji: '😰', color: '#FFE29A', tint: tint('#FFE29A') },
  { key: 'confused', label: 'Confused', emoji: '😕', color: '#7FE6D6', tint: tint('#7FE6D6') },
  { key: 'lonely', label: 'Lonely', emoji: '🥺', color: '#A9BCE6', tint: tint('#A9BCE6') },
];

const NO_EMOTION: Emotion = { key: 'sad', label: 'No feeling picked', emoji: '💬', color: colors.lavender, tint: colors.card };

export const emotionFor = (key: string | null | undefined): Emotion =>
  EMOTIONS.find((e) => e.key === key) ?? NO_EMOTION;

export const STRESS = [
  { level: 1, label: 'Calm', color: '#A6F0B8' },
  { level: 2, label: 'Uneasy', color: '#DDF0A0' },
  { level: 3, label: 'Stressed', color: '#FFE29A' },
  { level: 4, label: 'Very stressed', color: '#FFB078' },
  { level: 5, label: 'Overwhelmed', color: '#FF8A80' },
];

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  h1: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: colors.text },
  h2: { fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 26, color: colors.text },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.faint },
  text: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.text },
  muted: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
  input: {
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: colors.onAccent, fontFamily: fonts.bodyHeavy, fontSize: 16 },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { padding: 40, textAlign: 'center', color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 22 },
  error: { color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 14 },
});

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export type EmotionSection<T> = { key: string; label: string; emoji: string; color: string; data: T[] };

// Groups items into one section per emotion, in the picker's order, with
// "no feeling picked" last. Empty emotions are left out.
export function groupByEmotion<T extends { emotion: string | null }>(items: T[]): EmotionSection<T>[] {
  const sections: EmotionSection<T>[] = EMOTIONS.map((e) => ({
    key: e.key, label: e.label, emoji: e.emoji, color: e.color, data: items.filter((i) => i.emotion === e.key),
  }));
  sections.push({
    key: 'none', label: 'No feeling picked yet', emoji: '💬', color: colors.lavender,
    data: items.filter((i) => !EMOTIONS.some((e) => e.key === i.emotion)),
  });
  return sections.filter((s) => s.data.length > 0);
}
