import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BookMarked, BookOpen, ChevronRight } from 'lucide-react-native';
import { useLibrary } from '../../store/reading-plan/libraryStore';
import { useAuth } from '../../store/auth/AuthContext';
import { useMyGroups, useMyLatestGroupProgress } from '../../hooks/reading-group/useGroups';
import { fetchGroupProgress } from '../../api/reading-group';
import { fetchProgressActivity } from '../../api/reading-plan/progress';
import type { ReadingGroup } from '../../types/reading-group';
import { colors } from '../../constants/theme';

// 연속독서 1일차엔 "연속 1일차!"라고 하면 어색해서 아직 스트릭을 언급하지 않는
// 문구를 쓰고, 2일차부터만 실제 연속 일수를 넣은 문구를 랜덤으로 고른다.
const STREAK_DAY_ONE_MESSAGES = [
  '오늘도 한 걸음! 잘하고 있어요 😊',
  '꾸준함의 시작이에요 🌱',
  '오늘 첫 기록, 좋아요! 📖',
];

const STREAK_MULTI_DAY_MESSAGES = (days: number) => [
  `연속 ${days}일 독서! 대단해요 🔥`,
  `${days}일 연속으로 읽고 있어요 ✨ 멋져요!`,
  `독서 ${days}일 연속, 이 기세로 계속 가봐요 💪`,
  `${days}일째 이어가는 중이에요 📚 최고예요!`,
  `연속 ${days}일차! 습관이 되어가고 있어요 🌟`,
];

function pickStreakMessage(streakDays: number | null): string | null {
  if (streakDays === null || streakDays <= 0) return null;
  const pool = streakDays === 1 ? STREAK_DAY_ONE_MESSAGES : STREAK_MULTI_DAY_MESSAGES(streakDays);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Design ported from origin/YSE's MainHomeScreen, rewired onto this branch's
// real data layer (useLibrary()) and navigation (direct navigation.navigate
// across tabs) instead of YSE's manual libraryApi call + callback props.
// The tab bar itself is NOT re-rendered here — MainTabs already supplies one
// global TabBar via Tab.Navigator's `tabBar` prop (see navigation/index.tsx).
export default function HomeScreen({ navigation }: { navigation: any }) {
  const { items, isLoading, error, loadLibrary } = useLibrary();
  const { groups, loading: isGroupsLoading, refresh: refreshGroups } = useMyGroups();
  const { user } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // 모임을 새로 만들거나 참가하고 홈 탭으로 돌아왔을 때 미리보기가 바로 갱신되도록,
  // 마운트 시 1회만 도는 useMyGroups 내부 useEffect와 별개로 화면 포커스마다 재조회한다.
  useFocusEffect(
    useCallback(() => {
      refreshGroups();
    }, [refreshGroups])
  );

  const [streakDays, setStreakDays] = useState<number | null>(null);

  // 연속독서 기록: "그날 진도를 새로 입력/공유했다" = 그날 완료로 치고, 오늘부터
  // 거꾸로 하루씩 내려가며 진도를 남긴 날짜가 끊기지 않고 이어지는 일수를 센다.
  // 두 가지를 다 센다 — (1) 내 서재에서 진도 입력, (2) 모임에서 진도 공유.
  // 그룹별 진도 API만 있어서 내가 속한 모임 수만큼 호출한다.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      fetchProgressActivity().catch(() => []),
      Promise.all(groups.map((g) => fetchGroupProgress(g.id).catch(() => []))),
    ])
      .then(([progressActivity, groupProgressLists]) => {
        if (cancelled) return;
        const myDates = new Set<string>();
        progressActivity.forEach((entry) => {
          myDates.add(new Date(entry.recordedAt).toDateString());
        });
        groupProgressLists.flat().forEach((progress) => {
          if (progress.user_id === user.id) {
            myDates.add(new Date(progress.created_at).toDateString());
          }
        });

        let streak = 0;
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);
        while (myDates.has(cursor.toDateString())) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        }
        setStreakDays(streak);
      })
      .catch(() => {
        if (!cancelled) setStreakDays(null);
      });
    return () => {
      cancelled = true;
    };
  }, [groups, user]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- 스트릭 값이 바뀔 때만 새로 뽑고,
  // 그 사이 리렌더링에서는 같은 문구를 유지한다 (매 렌더마다 바뀌면 깜빡여서 어색함).
  const streakMessage = useMemo(() => pickStreakMessage(streakDays), [streakDays]);

  const completedCount = items.filter((item) => item.status === 'COMPLETED').length;
  const readingItems = items.filter((item) => item.status === 'READING');
  const totalPages = items.reduce((sum, item) => sum + (item.currentPage || 0), 0);
  const recentReadingItems = [...readingItems]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 2);
  const recentGroups = [...groups]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <BookMarked size={12} color={colors.beigeLight} strokeWidth={1.5} />
          </View>
          <Text style={styles.logoText}>READLOG</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>이번 달 독서 현황</Text>
          <View style={styles.statusCountRow}>
            <Text style={styles.statusCount}>{readingItems.length}</Text>
            <Text style={styles.statusCountUnit}>권 읽는 중</Text>
          </View>
          {streakMessage ? (
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>{streakMessage}</Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statItemLabel}>완독</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalPages}</Text>
              <Text style={styles.statItemLabel}>총 페이지</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakDays !== null ? streakDays : '-'}</Text>
              <Text style={styles.statItemLabel}>연속독서</Text>
            </View>
          </View>
        </View>

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 읽은 책</Text>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => navigation.navigate('LibraryTab', { screen: 'MyLibrary' })}
            >
              <Text style={styles.moreBtnTextDark}>더보기</Text>
              <ChevronRight size={12} color={colors.deepGreen} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.deepGreen} style={styles.statusLoading} />
          ) : error ? (
            <Text style={styles.statusErrorTextDark}>{error}</Text>
          ) : recentReadingItems.length > 0 ? (
            <View style={styles.recentList}>
              {recentReadingItems.map((item) => {
                const pageCount = item.book.pageCount ?? null;
                const percent = pageCount
                  ? Math.min(100, Math.round((item.currentPage / pageCount) * 100))
                  : 0;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.readingBookCard}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate('LibraryTab', {
                        screen: 'ReadingProgress',
                        params: { libraryItemId: item.id },
                      })
                    }
                  >
                    <View style={styles.readingBookCover}>
                      {item.book.coverUrl ? (
                        <Image
                          source={{ uri: item.book.coverUrl }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                        />
                      ) : (
                        <BookOpen size={18} color={colors.beigeLight} strokeWidth={1.5} />
                      )}
                    </View>
                    <View style={styles.readingBookContentCol}>
                      <View style={styles.readingBookTop}>
                        <Text style={styles.readingBookTitle} numberOfLines={1}>
                          {item.book.title}
                        </Text>
                        <Text style={styles.readingBookPercent}>{percent}%</Text>
                      </View>
                      <Text style={styles.readingBookAuthor} numberOfLines={1}>
                        {item.book.author}
                      </Text>
                      <View style={styles.readingBookTrack}>
                        <View style={[styles.readingBookFill, { width: `${percent}%` }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.statusEmptyTextDark}>읽고 있는 책이 없어요.</Text>
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

          {isGroupsLoading ? (
            <ActivityIndicator color={colors.deepGreen} style={styles.statusLoading} />
          ) : recentGroups.length > 0 ? (
            <View style={styles.recentList}>
              {recentGroups.map((group) => (
                <GroupPreviewCard
                  key={group.id}
                  group={group}
                  currentUserId={user?.id}
                  onPress={() =>
                    navigation.navigate('GroupTab', { screen: 'GroupHome', params: { groupId: group.id } })
                  }
                />
              ))}
            </View>
          ) : (
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
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GroupPreviewCard({
  group,
  currentUserId,
  onPress,
}: {
  group: ReadingGroup;
  currentUserId: number | undefined;
  onPress: () => void;
}) {
  const myPercent = useMyLatestGroupProgress(group.id, currentUserId);

  const daysLeft = group.end_date
    ? Math.ceil((new Date(group.end_date).getTime() - Date.now()) / 86_400_000)
    : null;
  const percent = myPercent ?? 0;

  return (
    <TouchableOpacity style={styles.groupPreviewCard} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.groupPreviewCoverPlaceholder}>
        <BookOpen size={20} color={colors.beigeLight} strokeWidth={1.5} />
      </View>

      <View style={styles.groupPreviewContentCol}>
        <View style={styles.groupPreviewTop}>
          <Text style={styles.groupPreviewName} numberOfLines={1}>
            {group.name}
          </Text>
          {daysLeft !== null ? (
            <Text style={styles.groupPreviewDday}>
              D{daysLeft >= 0 ? `-${daysLeft}` : `+${Math.abs(daysLeft)}`}
            </Text>
          ) : null}
        </View>
        <View style={styles.groupPreviewMetaRow}>
          <Text style={styles.groupPreviewMembers}>
            멤버 {group.member_count}/{group.max_member}명
          </Text>
          <Text style={styles.groupPreviewPercent}>
            {myPercent !== null ? `내 진도 ${percent}%` : '진도 공유 없음'}
          </Text>
        </View>
        <View style={styles.groupPreviewTrack}>
          <View style={[styles.groupPreviewFill, { width: `${percent}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
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
    paddingTop: 12,
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
  streakBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  streakBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.beigeLight,
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
  statusErrorTextDark: {
    fontSize: 12,
    color: colors.danger,
  },
  statusEmptyTextDark: {
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.beigeLight,
  },
  statItemLabel: {
    fontSize: 11,
    color: 'rgba(253,251,244,0.6)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  recentList: {
    gap: 8,
  },
  readingBookCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    backgroundColor: colors.beigeLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  readingBookCover: {
    width: 56,
    alignSelf: 'stretch',
    minHeight: 64,
    borderRadius: 8,
    backgroundColor: colors.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  readingBookContentCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  readingBookTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  readingBookTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 8,
  },
  readingBookPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.deepGreen,
  },
  readingBookAuthor: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 8,
  },
  readingBookTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.beigeDim,
    overflow: 'hidden',
  },
  readingBookFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.deepGreen,
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
  groupPreviewCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    backgroundColor: colors.beigeLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  groupPreviewCoverPlaceholder: {
    width: 56,
    alignSelf: 'stretch',
    minHeight: 60,
    borderRadius: 8,
    backgroundColor: colors.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupPreviewContentCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  groupPreviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  groupPreviewName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 8,
  },
  groupPreviewDday: {
    fontSize: 10,
    color: colors.textMuted,
  },
  groupPreviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupPreviewMembers: {
    fontSize: 12,
    color: colors.textMuted,
  },
  groupPreviewPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.deepGreen,
  },
  groupPreviewTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.beigeDim,
    overflow: 'hidden',
  },
  groupPreviewFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.deepGreen,
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
