import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Home, User, Users } from 'lucide-react-native';
import { colors } from '../../constants/theme';

// Visual design from origin/YSE's TabBar (lucide icons), rewired onto
// BottomTabBarProps (state/navigation) instead of YSE's manual
// { active, onChangeTab } state — this is the prop shape React Navigation's
// <Tab.Navigator tabBar={...}> actually passes in on this branch.
const TABS: { routeName: string; label: string; Icon: typeof Home }[] = [
  { routeName: 'HomeTab', label: '홈', Icon: Home },
  { routeName: 'LibraryTab', label: '내 서재', Icon: BookOpen },
  { routeName: 'GroupTab', label: '독서모임', Icon: Users },
  { routeName: 'MyPageTab', label: '마이', Icon: User },
];

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  // MIUI 등 일부 Android 기기는 inset을 0으로 보고하므로 최솟값 보정
  const safeBottom = Platform.OS === 'android' ? Math.max(bottom, 16) : bottom;

  return (
    <View style={[styles.container, { paddingBottom: safeBottom || 16 }]}>
      {TABS.map(({ routeName, label, Icon }, i) => {
        const isActive = state.index === i;
        const color = isActive ? colors.deepGreen : colors.textMuted;
        return (
          <TouchableOpacity
            key={routeName}
            style={styles.tab}
            onPress={() => navigation.navigate(routeName as never)}
            accessibilityLabel={label}
          >
            <Icon size={22} color={color} strokeWidth={isActive ? 2 : 1.5} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.beigeLight,
  },
  tab: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
  },
});
