import React, { useState } from 'react';
import {
  Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useGroupDetail, useGroupProgress } from '../../hooks/reading-group/useGroups';
import { useGroupStore } from '../../store/reading-group/groupStore';
import { useAuth } from '../../store/auth/AuthContext';
import MemberProgressBar from '../../components/reading-group/MemberProgressBar';
import { COLORS } from '../../constants/theme';

type Props = NativeStackScreenProps<any, 'GroupHome'>;
type Tab = 'progress' | 'comments' | 'settings';

export default function GroupHomeScreen({ navigation, route }: Props) {
  const { groupId, bookAdded } = route.params as { groupId: number; bookAdded?: boolean };
  const { group, members, loading } = useGroupDetail(groupId);
  const { progressList, remove, dismiss } = useGroupProgress(groupId);
  const { fetchGroup, fetchMembers, fetchProgress } = useGroupStore();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('progress');

  const myRole = members.find(m => m.user_id === user?.id)?.role ?? 'MEMBER';
  const isOwner = myRole === 'OWNER';

  // 모임 참가 직후 도서가 서재에 추가됐으면 알림 표시 (1회)
  React.useEffect(() => {
    if (bookAdded) {
      Alert.alert('서재에 추가됨', '내 서재에 모임 도서가 추가되었습니다.');
    }
  }, []);

  // 화면 포커스 시 최신 데이터 재조회 (진도 공유/수정 후 복귀 포함)
  useFocusEffect(
    React.useCallback(() => {
      fetchGroup(groupId);
      fetchMembers(groupId);
      fetchProgress(groupId);
    }, [groupId])
  );

  if (loading || !group) {
    return <View style={styles.container} />;
  }

  const latestByUser = Object.values(
    progressList.reduce<Record<number, typeof progressList[0]>>((acc, p) => {
      if (!acc[p.user_id] || acc[p.user_id].created_at < p.created_at) acc[p.user_id] = p;
      return acc;
    }, {})
  );

  function confirmDelete(progressId: number, nickname: string, isOwnProgress: boolean) {
    const message = isOwnProgress
      ? '본인의 진도를 삭제하시겠습니까?'
      : `${nickname}님의 진도를 삭제하시겠습니까?\n해당 멤버에게 삭제 알림이 표시됩니다.`;
    Alert.alert('진도 삭제', message, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => remove(progressId) },
    ]);
  }

  function confirmDismiss(progressId: number) {
    Alert.alert('알림 지우기', '이 알림을 지우시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '지우기', onPress: () => dismiss(progressId) },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* 모임 헤더 */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {group.book_cover_url ? (
            <Image source={{ uri: group.book_cover_url }} style={styles.bookCover} resizeMode="cover" />
          ) : (
            <View style={styles.bookCover} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.bookTitle}>{group.name}</Text>
            <Text style={styles.bookSub}>{group.description ?? ''}</Text>
            {group.start_date && group.end_date && (
              <Text style={styles.period}>
                {group.start_date.slice(0, 10)} – {group.end_date.slice(0, 10)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.memberRow}>
          <View style={{ flexDirection: 'row' }}>
            {members.slice(0, 5).map(m => (
              <View key={m.id} style={styles.avatar}>
                <Text style={styles.avatarText}>{(m.nickname ?? '?')[0]}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.memberCount}>{group.member_count}/{group.max_member}명</Text>
          <TouchableOpacity
            style={styles.inviteBtn}
            onPress={() => navigation.navigate('Invite', { groupId })}
          >
            <Text style={styles.inviteBtnText}>초대하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabBar}>
        {(['progress', 'comments', 'settings'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabItem, tab === t && styles.tabItemActive]}
            onPress={() => {
              if (t === 'comments') navigation.navigate('Comments', { groupId });
              else if (t === 'settings') navigation.navigate('GroupSettings', { groupId });
              else setTab(t);
            }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'progress' ? '진도 현황' : t === 'comments' ? '댓글' : '설정'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 진도 현황 */}
      <FlatList
        data={latestByUser}
        keyExtractor={item => String(item.user_id)}
        contentContainerStyle={styles.progressList}
        ListHeaderComponent={
          <View style={styles.progressHeader}>
            <Text style={styles.sectionLabel}>멤버별 진도 현황</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProgressShare', { groupId })}>
              <Text style={styles.shareLink}>+ 진도 공유</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const isMyProgress = item.user_id === user?.id;
          const nickname = item.nickname ?? `User ${item.user_id}`;

          return (
            <MemberProgressBar
              nickname={nickname}
              progress={item.progress ?? 0}
              chapter={item.chapter ?? ''}
              updatedAt={item.created_at}
              memo={item.memo}
              deletedByOwner={item.deleted_by_owner}
              // 본인 알림 → 지우기 버튼
              onDismiss={item.deleted_by_owner && isMyProgress
                ? () => confirmDismiss(item.id)
                : undefined}
              // 본인 진도 → 수정 + 삭제
              onEdit={!item.deleted_by_owner && isMyProgress
                ? () => navigation.navigate('ProgressShare', {
                    groupId,
                    progressId: item.id,
                    initialData: {
                      chapter: item.chapter,
                      page: item.page,
                      progress: item.progress,
                      memo: item.memo,
                    },
                  })
                : undefined}
              onDelete={!item.deleted_by_owner && (isMyProgress || isOwner)
                ? () => confirmDelete(item.id, nickname, isMyProgress)
                : undefined}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.beigeDark },
  header: {
    backgroundColor: COLORS.deepGreen,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  bookCover: {
    width: 56, height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  bookTitle: { fontSize: 18, fontWeight: '600', color: COLORS.beigeLight },
  bookSub: { fontSize: 12, color: 'rgba(253,251,244,0.6)', marginTop: 2 },
  period: { fontSize: 10, color: 'rgba(253,251,244,0.5)', marginTop: 6 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 28, height: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
    borderWidth: 2, borderColor: COLORS.deepGreen,
    alignItems: 'center', justifyContent: 'center',
    marginRight: -8,
  },
  avatarText: { fontSize: 10, fontWeight: '700', color: COLORS.beigeLight },
  memberCount: { fontSize: 12, color: 'rgba(253,251,244,0.6)', marginLeft: 12 },
  inviteBtn: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inviteBtnText: { fontSize: 12, color: COLORS.beigeLight },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.beigeLight, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: COLORS.deepGreen },
  tabText: { fontSize: 12, fontWeight: '500', color: '#9E9E8A' },
  tabTextActive: { color: COLORS.deepGreen },
  progressList: { padding: 16, gap: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '500', color: '#7A7060' },
  shareLink: { fontSize: 12, fontWeight: '500', color: COLORS.deepGreen },
});
