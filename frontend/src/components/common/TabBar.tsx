import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

const TABS = [
  { routeName: 'HomeTab',    label: '홈',     icon: '◎' },
  { routeName: 'LibraryTab', label: '내 서재', icon: '▣' },
  { routeName: 'GroupTab',   label: '독서모임', icon: '⊕' },
  { routeName: 'MyPageTab',  label: '마이',    icon: '◉' },
];

const TAB_HEIGHT = 56;

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  // MIUI 등 일부 Android 기기는 inset을 0으로 보고하므로 최솟값 보정
  const safeBottom = Platform.OS === 'android' ? Math.max(bottom, 16) : bottom;

  return (
    <View style={[styles.bar, { paddingBottom: safeBottom }]}>
      {TABS.map((tab, i) => {
        const focused = state.index === i;
        return (
          <TouchableOpacity
            key={tab.routeName}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.routeName as never)}
            accessibilityLabel={tab.label}
          >
            <Text style={[styles.icon, focused && styles.active]}>{tab.icon}</Text>
            <Text style={[styles.label, focused && styles.active]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.beigeLight,
    borderTopWidth: 1, borderTopColor: COLORS.beigeDark,
  },
  tab: { flex: 1, height: TAB_HEIGHT, justifyContent: 'center', alignItems: 'center', gap: 3 },
  icon: { fontSize: 18, color: COLORS.textMuted },
  label: { fontSize: 10, color: COLORS.textMuted },
  active: { color: COLORS.deepGreen, fontWeight: '600' },
});
