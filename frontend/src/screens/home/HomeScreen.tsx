import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Bell, BookMarked, BookOpen, ChevronRight } from 'lucide-react-native';
import { useLibrary } from '../../store/reading-plan/libraryStore';
import { useAuth } from '../../store/auth/AuthContext';
import { useMyGroups, useMyLatestGroupProgress } from '../../hooks/reading-group/useGroups';
import { fetchComments } from '../../api/reading-group';
import type { ReadingGroup } from '../../types/reading-group';
import { colors } from '../../constants/theme';

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

  // 연속독서 기록: "그날 읽은 곳에 댓글을 달았다" = 그날 완료로 치고, 오늘부터
  // 거꾸로 하루씩 내려가며 댓글을 단 날짜(내 그룹 댓글 기준)가 끊기지 않고
  // 이어지는 일수를 센다. 그룹별 댓글 API만 있어서 내가 속한 모임 수만큼 호출한다.
  useEffect(() => {
    if (!user) return;
    if (groups.length === 0) {
      setStreakDays(0);
      return;
    }
    let cancelled = false;
    Promise.all(groups.map((g) => fetchComments(g.id).catch(() => [])))
      .then((commentLists) => {
        if (cancelled) return;
        const myDates = new Set<string>();
        commentLists.flat().forEach((comment) => {
          if (comment.user_id === user.id) {
            myDates.add(new Date(comment.created_at).toDateString());
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
          <Text style={styles.statusLabel}>이번 달 독서 현황</Text>
          <View style={styles.statusCountRow}>
            <Text style={styles.statusCount}>{readingItems.length}</Text>
            <Text style={styles.statusCountUnit}>권 읽는 중</Text>
          </View>

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
    </View>
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
