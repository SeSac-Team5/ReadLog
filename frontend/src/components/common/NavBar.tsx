import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function NavBar({ title, onBack, rightAction }: Props) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.side} onPress={onBack} disabled={!onBack}>
        {onBack && <Text style={styles.backIcon}>‹</Text>}
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{title ?? ''}</Text>
      <View style={styles.side}>{rightAction}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4, backgroundColor: COLORS.beigeLight,
    borderBottomWidth: 1, borderBottomColor: COLORS.beigeDark,
  },
  side: { width: 44, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 30, color: COLORS.deepGreen, lineHeight: 36 },
  title: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
});
