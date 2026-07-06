import React, { useEffect, useLayoutEffect } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, BookMarked, ChevronRight } from 'lucide-react-native';
import { useLibrary } from '../../store/reading-plan/libraryStore';
import { colors } from '../../constants/theme';

// Design ported from origin/YSE's MainHomeScreen, rewired onto this branch's
// real data layer (useLibrary()) and navigation (direct navigation.navigate
// across tabs) instead of YSE's manual libraryApi call + callback props.
// The tab bar itself is NOT re-rendered here — MainTabs already supplies one
// global TabBar via Tab.Navigator's `tabBar` prop (see navigation/index.tsx).
export default function HomeScreen({ navigation }: { navigation: any }) {
  const { items, isLoading, error, loadLibrary } = useLibrary();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const completedCount = items.filter((item) => item.status === 'COMPLETED').length;
  const readingItem = items.find((item) => item.status === 'READING') ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <BookMarked size={12} color={colors.beigeLight} strokeWidth={1.5} />
          </View>
          <Text style={styles.logoText}>READLOG</Text>
        </View>
        <Bell size={20} color={colors.textMuted} strokeWidth={1.5} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.statusCard}>
          <View style={styles.statusCardTop}>
            <View>
              <Text style={styles.statusLabel}>독서 현황</Text>
              <View style={styles.statusCountRow}>
                <Text style={styles.statusCount}>{completedCount}</Text>
                <Text style={styles.statusCountUnit}>권 완독</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => navigation.navigate('LibraryTab')}
            >
              <Text style={styles.moreBtnTextLight}>더보기</Text>
              <ChevronRight size={12} color="rgba(253,251,244,0.6)" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.beigeLight} style={styles.statusLoading} />
          ) : error ? (
            <Text style={styles.statusErrorText}>{error}</Text>
          ) : readingItem ? (
            <View style={styles.readingItem}>
              <View style={styles.readingItemCover}>
                {readingItem.book.coverUrl ? (
                  <Image
                    source={{ uri: readingItem.book.coverUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : null}
              </View>
              <View style={styles.readingItemInfo}>
                <Text style={styles.readingItemTitle} numberOfLines={1}>
                  {readingItem.book.title}
                </Text>
                <Text style={styles.readingItemMeta}>{readingItem.book.author} · 읽는 중</Text>
                <Text style={styles.readingItemPage}>{readingItem.currentPage}p 읽음</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.statusEmptyText}>읽고 있는 책이 없어요.</Text>
          )}
        </View>

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>모임 진도 미리보기</Text>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => navigation.navigate('GroupTab')}
            >
              <Text style={styles.moreBtnTextDark}>더보기</Text>
              <ChevronRight size={12} color={colors.deepGreen} />
            </TouchableOpacity>
          </View>

          <View style={styles.groupEmptyCard}>
            <Text style={styles.groupEmptyEmoji}>📚</Text>
            <Text style={styles.groupEmptyTitle}>참여 중인 모임이 없어요</Text>
            <Text style={styles.groupEmptyDesc}>
              독서 모임을 만들거나 참가해서{'\n'}함께 책을 읽어보세요.
            </Text>
            <TouchableOpacity
              style={styles.groupEmptyBtn}
              onPress={() => navigation.navigate('GroupTab')}
            >
              <Text style={styles.groupEmptyBtnText}>모임 찾아보기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.beigeDim,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.beigeLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.textPrimary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    gap: 16,
  },
  statusCard: {
    backgroundColor: colors.deepGreen,
    borderRadius: 16,
    padding: 20,
  },
  statusCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 12,
    color: 'rgba(253,251,244,0.6)',
    marginBottom: 4,
  },
  statusCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  statusCount: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.beigeLight,
  },
  statusCountUnit: {
    fontSize: 13,
    color: 'rgba(253,251,244,0.7)',
  },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  moreBtnTextLight: {
    fontSize: 12,
    color: 'rgba(253,251,244,0.6)',
  },
  moreBtnTextDark: {
    fontSize: 12,
    color: colors.deepGreen,
  },
  statusLoading: {
    paddingVertical: 12,
  },
  statusErrorText: {
    fontSize: 12,
    color: colors.danger,
  },
  statusEmptyText: {
    fontSize: 12,
    color: 'rgba(253,251,244,0.6)',
    paddingVertical: 8,
  },
  readingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  readingItemCover: {
    width: 40,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  readingItemInfo: {
    flex: 1,
  },
  readingItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.beigeLight,
  },
  readingItemMeta: {
    fontSize: 12,
    color: 'rgba(253,251,244,0.6)',
    marginBottom: 6,
  },
  readingItemPage: {
    fontSize: 10,
    color: 'rgba(253,251,244,0.5)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  groupEmptyCard: {
    backgroundColor: colors.beigeLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
  },
  groupEmptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  groupEmptyTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  groupEmptyDesc: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  groupEmptyBtn: {
    backgroundColor: colors.deepGreen,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  groupEmptyBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.beigeLight,
  },
});
