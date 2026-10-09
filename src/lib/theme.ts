import { StyleSheet, useColorScheme } from 'react-native';

const light = {
  bg: '#f7f7f5',
  card: '#ffffff',
  text: '#1d1d1b',
  muted: '#6b6b66',
  border: '#e2e2dc',
  accent: '#2f6fde',
  danger: '#c23b3b',
};

const dark: typeof light = {
  bg: '#161615',
  card: '#1f1f1d',
  text: '#ececea',
  muted: '#9a9a94',
  border: '#33332f',
  accent: '#6b9cf0',
  danger: '#e06666',
};

export type Colors = typeof light;

export function useTheme() {
  const colors = useColorScheme() === 'dark' ? dark : light;
  return { colors, styles: makeStyles(colors) };
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    input: {
      backgroundColor: c.card,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: c.text,
    },
    button: {
      backgroundColor: c.accent,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    row: {
      backgroundColor: c.card,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomColor: c.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowTitle: { fontSize: 16, fontWeight: '600', color: c.text },
    muted: { fontSize: 13, color: c.muted },
    text: { fontSize: 16, color: c.text },
    empty: { padding: 40, textAlign: 'center', color: c.muted, fontSize: 15 },
    error: { color: c.danger, fontSize: 14 },
  });

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
