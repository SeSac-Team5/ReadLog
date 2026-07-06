import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Bell,
  BookOpen,
  ChevronRight,
  Lock,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Trash2,
  User,
  Users,
} from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { useAuth } from '../../store/auth/AuthContext';
import { useLibraryComments } from '../../hooks/reading-plan/useLibraryComments';
import { useLibrary } from '../../store/reading-plan/libraryStore';
import type { LibraryComment, UserLibraryItem } from '../../types/reading-plan/book';

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

type ActivityTabId = 'records' | 'reviews' | 'comments' | 'groups';

const ACTIVITY_TABS: { id: ActivityTabId; label: string; icon: typeof BookOpen; emptyText: string }[] = [
  { id: 'records', label: '독서기록', icon: BookOpen, emptyText: '아직 등록한 독서기록이 없어요.' },
  { id: 'reviews', label: '한줄평', icon: MessageSquareText, emptyText: '작성한 한줄평이 없어요.' },
  { id: 'groups', label: '독서그룹 활동', icon: Users, emptyText: '참여 중인 독서그룹 활동이 없어요.' },
  { id: 'comments', label: '댓글', icon: MessageCircle, emptyText: '작성한 댓글이 없어요.' },
];

export function MyPageScreen({
  onNavigateEditProfile,
  onNavigateChangePassword,
  onNavigateDeleteAccount,
  onNavigateNotificationSettings,
  onOpenReadingRecord,
}: {
  onNavigateEditProfile: () => void;
  onNavigateChangePassword: () => void;
  onNavigateDeleteAccount: () => void;
  onNavigateNotificationSettings: () => void;
  onOpenReadingRecord: (libraryItemId: string) => void;
}) {
  const { user, logout } = useAuth();
  const { items: libraryItems, loadLibrary } = useLibrary();
  const { comments } = useLibraryComments();
  const [activeTab, setActiveTab] = useState<ActivityTabId>('records');

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  if (!user) return null;

  const activeTabInfo = ACTIVITY_TABS.find((t) => t.id === activeTab)!;
  const ActiveTabIcon = activeTabInfo.icon;
  const readingRecords = libraryItems.filter((item) => item.status !== 'WISH');
  const showEmptyState =
    (activeTab === 'records' && readingRecords.length === 0) ||
    (activeTab === 'reviews' && comments.length === 0) ||
    (activeTab !== 'records' && activeTab !== 'reviews');

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <View style={styles.navBarSide} />
        <Text style={styles.navBarTitle}>마이페이지</Text>
        <View style={styles.navBarSide} />
      </View>

      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          {user.profile_image ? (
            <Image source={{ uri: user.profile_image }} style={styles.avatarImage} />
          ) : (
            <User size={28} color={colors.deepGreen} strokeWidth={1.5} />
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>{user.nickname}</Text>
          <Text style={styles.loginId}>@{user.login_id}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={onNavigateEditProfile}>
          <Pencil size={12} color={colors.deepGreen} />
          <Text style={styles.editBtnText}>수정</Text>
        </TouchableOpacity>
      </View>

      {user.introduction ? (
        <Text style={styles.introduction}>{user.introduction}</Text>
      ) : null}

      <Text style={styles.joinedAt}>가입일 {formatDate(user.created_at)}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll}>
        <View style={styles.tabBar}>
          {ACTIVITY_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView style={styles.body}>
        {showEmptyState ? (
          <View style={styles.tabContent}>
            <ActiveTabIcon size={28} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={styles.tabEmptyText}>{activeTabInfo.emptyText}</Text>
          </View>
        ) : activeTab === 'records' ? (
          <View style={styles.recordListWrapper}>
            <ScrollView
              style={styles.recordListScroll}
              contentContainerStyle={styles.recordListContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {readingRecords.map((item) => (
                <ReadingRecordCard
                  key={item.id}
                  item={item}
                  onPress={() => onOpenReadingRecord(item.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.recordListWrapper}>
            <ScrollView
              style={styles.recordListScroll}
              contentContainerStyle={styles.recordListContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {comments.map((comment) => (
                <LibraryCommentCard key={comment.id} comment={comment} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={onNavigateChangePassword}>
            <View style={styles.menuItemLeft}>
              <Lock size={16} color={colors.textMuted} />
              <Text style={styles.menuItemLabel}>비밀번호 변경</Text>
            </View>
            <ChevronRight size={14} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onNavigateNotificationSettings}>
            <View style={styles.menuItemLeft}>
              <Bell size={16} color={colors.textMuted} />
              <Text style={styles.menuItemLabel}>알림 설정</Text>
            </View>
            <ChevronRight size={14} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={onNavigateDeleteAccount}
          >
            <View style={styles.menuItemLeft}>
              <Trash2 size={16} color={colors.danger} />
              <Text style={styles.menuItemLabelDanger}>회원탈퇴</Text>
            </View>
            <ChevronRight size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ReadingRecordCard({
  item,
  onPress,
}: {
  item: UserLibraryItem;
  onPress: () => void;
}) {
  const pageCount = item.book.pageCount ?? null;
  const percent =
    item.status === 'COMPLETED'
      ? 100
      : pageCount
      ? Math.min(100, Math.round((item.currentPage / pageCount) * 100))
      : 0;
  const accentColor = item.status === 'COMPLETED' ? colors.success : colors.deepGreen;
  const pageLabel = pageCount ? `${item.currentPage} / ${pageCount} 페이지` : `${item.currentPage}p 읽음`;

  return (
    <TouchableOpacity style={recordStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={recordStyles.mainRow}>
        {item.book.coverUrl ? (
          <Image source={{ uri: item.book.coverUrl }} style={recordStyles.cover} resizeMode="cover" />
        ) : (
          <View style={recordStyles.coverPlaceholder}>
            <BookOpen size={20} color={colors.beigeLight} strokeWidth={1.5} />
          </View>
        )}

        <View style={recordStyles.contentCol}>
          <View style={recordStyles.titleRow}>
            <View style={recordStyles.titleBlock}>
              <Text style={recordStyles.title} numberOfLines={1}>
                {item.book.title}
              </Text>
              <Text style={recordStyles.author} numberOfLines={1}>
                {item.book.author}
              </Text>
            </View>
            <View style={recordStyles.percentBlock}>
              <Text style={recordStyles.percentLabel}>읽은 페이지</Text>
              <Text style={[recordStyles.percentValue, { color: accentColor }]}>{percent}%</Text>
            </View>
          </View>

          <View style={recordStyles.track}>
            <View style={[recordStyles.fill, { width: `${percent}%`, backgroundColor: accentColor }]} />
          </View>

          <View style={recordStyles.pageRow}>
            <Text style={recordStyles.pageMuted}>0p</Text>
            <Text style={recordStyles.pageMuted}>{pageLabel}</Text>
          </View>

          <View style={recordStyles.statRow}>
            <View style={recordStyles.statBox}>
              <Text style={[recordStyles.statValue, { color: accentColor }]}>{percent}%</Text>
              <Text style={recordStyles.statLabel}>진행률</Text>
            </View>
            <View style={recordStyles.statBox}>
              <Text style={recordStyles.statValue}>{item.currentPage}p</Text>
              <Text style={recordStyles.statLabel}>현재 페이지</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LibraryCommentCard({ comment }: { comment: LibraryComment }) {
  return (
    <View style={commentStyles.card}>
      {comment.book.coverUrl ? (
        <Image source={{ uri: comment.book.coverUrl }} style={commentStyles.cover} resizeMode="cover" />
      ) : (
        <View style={commentStyles.coverPlaceholder}>
          <BookOpen size={18} color={colors.beigeLight} strokeWidth={1.5} />
        </View>
      )}
      <View style={commentStyles.contentCol}>
        <Text style={commentStyles.title} numberOfLines={1}>
          {comment.book.title}
        </Text>
        <Text style={commentStyles.memo}>{comment.memo}</Text>
      </View>
    </View>
  );
}

const commentStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.beigeLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cover: {
    width: 48,
    height: 68,
    borderRadius: 8,
    backgroundColor: colors.beigeDim,
  },
  coverPlaceholder: {
    width: 48,
    height: 68,
    borderRadius: 8,
    backgroundColor: colors.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  memo: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
});

const recordStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.beigeLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  cover: {
    width: 64,
    alignSelf: 'stretch',
    minHeight: 80,
    borderRadius: 8,
    backgroundColor: colors.beigeDim,
  },
  coverPlaceholder: {
    width: 64,
    alignSelf: 'stretch',
    minHeight: 80,
    borderRadius: 8,
    backgroundColor: colors.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  author: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  percentBlock: {
    alignItems: 'flex-end',
  },
  percentLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
  },
  percentValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.beigeDim,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  pageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pageMuted: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.beigeDim,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.beigeLight,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navBarSide: {
    width: 32,
  },
  navBarTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(45,74,62,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(45,74,62,0.4)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnText: {
    fontSize: 12,
    color: colors.deepGreen,
  },
  nickname: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  loginId: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  introduction: {
    fontSize: 13,
    color: colors.textPrimary,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  joinedAt: {
    fontSize: 11,
    color: colors.textMuted,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabBarScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  tabBar: {
    flexDirection: 'row',
  },
  recordListWrapper: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.beigeDim,
    overflow: 'hidden',
  },
  recordListScroll: {
    maxHeight: 300,
  },
  recordListContent: {
    padding: 12,
  },
  body: {
    flex: 1,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.deepGreen,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.deepGreen,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  tabEmptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  menu: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 20,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  menuItemLabelDanger: {
    fontSize: 14,
    color: colors.danger,
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
