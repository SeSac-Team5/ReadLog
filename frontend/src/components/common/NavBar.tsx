import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

interface Props {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

const BAR_HEIGHT = 52;

export default function NavBar({ title, onBack, rightAction }: Props) {
  const { top } = useSafeAreaInsets();
  // Android는 inset을 0으로 보고하는 기기가 있으므로 최솟값 보정
  const safeTop = Platform.OS === 'android' ? Math.max(top, 24) : top;

  return (
    <View style={[styles.bar, { paddingTop: safeTop, height: BAR_HEIGHT + safeTop }]}>
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
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 4, paddingBottom: 0,
    backgroundColor: COLORS.beigeLight,
    borderBottomWidth: 1, borderBottomColor: COLORS.beigeDark,
  },
  side: { width: 44, height: BAR_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 30, color: COLORS.deepGreen, lineHeight: 36 },
  title: { flex: 1, height: BAR_HEIGHT, textAlignVertical: 'center', textAlign: 'center', fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
});
