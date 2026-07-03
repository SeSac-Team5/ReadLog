import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Bell,
  BookOpen,
  Bookmark,
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

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

type ActivityTabId = 'records' | 'bookmarks' | 'reviews' | 'comments' | 'groups';

const ACTIVITY_TABS: { id: ActivityTabId; label: string; icon: typeof BookOpen; emptyText: string }[] = [
  { id: 'records', label: '독서기록', icon: BookOpen, emptyText: '아직 등록한 독서기록이 없어요.' },
  { id: 'bookmarks', label: '북마크', icon: Bookmark, emptyText: '저장한 북마크가 없어요.' },
  { id: 'reviews', label: '한줄평', icon: MessageSquareText, emptyText: '작성한 한줄평이 없어요.' },
  { id: 'comments', label: '댓글', icon: MessageCircle, emptyText: '작성한 댓글이 없어요.' },
  { id: 'groups', label: '독서그룹 활동', icon: Users, emptyText: '참여 중인 독서그룹 활동이 없어요.' },
];

export function MyPageScreen({
  onNavigateEditProfile,
  onNavigateChangePassword,
  onNavigateDeleteAccount,
  onNavigateNotificationSettings,
}: {
  onNavigateEditProfile: () => void;
  onNavigateChangePassword: () => void;
  onNavigateDeleteAccount: () => void;
  onNavigateNotificationSettings: () => void;
}) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActivityTabId>('records');
  if (!user) return null;

  const activeTabInfo = ACTIVITY_TABS.find((t) => t.id === activeTab)!;
  const ActiveTabIcon = activeTabInfo.icon;

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <View style={styles.navBarSide} />
        <Text style={styles.navBarTitle}>마이페이지</Text>
        <View style={styles.navBarSide} />
      </View>

      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <User size={28} color={colors.deepGreen} strokeWidth={1.5} />
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
        <View style={styles.tabContent}>
          <ActiveTabIcon size={28} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={styles.tabEmptyText}>{activeTabInfo.emptyText}</Text>
        </View>

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
