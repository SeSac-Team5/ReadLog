import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props { children: React.ReactNode }

export default function Label({ children }: Props) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 0.5 },
});
