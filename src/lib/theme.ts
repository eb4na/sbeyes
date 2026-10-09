import { StyleSheet } from 'react-native';

// "Bubble glow": always dark, soft and colorful.
export const colors = {
  bg: '#0D1126',
  card: '#1A2042',
  cardSoft: '#141936',
  nav: '#11162F',
  text: '#EEF1FF',
  muted: '#A7AED6',
  faint: '#7C84B3',
  border: '#262D55',
  accent: '#7CE3FF',
  onAccent: '#0D1126',
  danger: '#FF7A6B',
  success: '#9BF07A',
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
  tint: string; // deep: bubble background
};

export const EMOTIONS: Emotion[] = [
  { key: 'hurt', label: 'Hurt', emoji: '💔', color: '#FF8FC8', tint: '#2B1638' },
  { key: 'angry', label: 'Angry', emoji: '😠', color: '#FF7A6B', tint: '#361614' },
  { key: 'frustrated', label: 'Frustrated', emoji: '😤', color: '#FFA45C', tint: '#33200F' },
  { key: 'sad', label: 'Sad', emoji: '😢', color: '#7CB8FF', tint: '#13223D' },
  { key: 'disappointed', label: 'Disappointed', emoji: '😞', color: '#B49CFF', tint: '#221A3D' },
  { key: 'anxious', label: 'Anxious', emoji: '😰', color: '#FFD86B', tint: '#332B0F' },
  { key: 'confused', label: 'Confused', emoji: '😕', color: '#6FE0D0', tint: '#0F2E2B' },
  { key: 'lonely', label: 'Lonely', emoji: '🥺', color: '#9FB4D8', tint: '#1A2232' },
];

const NO_EMOTION: Emotion = { key: 'sad', label: 'No feeling picked', emoji: '💬', color: colors.accent, tint: colors.card };

export const emotionFor = (key: string | null | undefined): Emotion =>
  EMOTIONS.find((e) => e.key === key) ?? NO_EMOTION;

export const STRESS = [
  { level: 1, label: 'Calm', color: '#9BF07A' },
  { level: 2, label: 'Uneasy', color: '#D6F06A' },
  { level: 3, label: 'Stressed', color: '#FFD86B' },
  { level: 4, label: 'Very stressed', color: '#FFA45C' },
  { level: 5, label: 'Overwhelmed', color: '#FF7A6B' },
];

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
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
