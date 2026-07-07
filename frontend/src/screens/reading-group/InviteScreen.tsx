import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Clipboard, Share, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as api from '../../api/reading-group';
import { useGroupDetail } from '../../hooks/reading-group/useGroups';
import { useGroupStore } from '../../store/reading-group/groupStore';
import { COLORS } from '../../constants/theme';
import NavBar from '../../components/common/NavBar';
import type { GroupInvite } from '../../types/reading-group';

type Props = NativeStackScreenProps<any, 'Invite'>;

export default function InviteScreen({ navigation, route }: Props) {
  const { groupId } = route.params as { groupId: number };
  const { group } = useGroupDetail(groupId);
  const { fetchGroup } = useGroupStore();
  const [tempInvite, setTempInvite] = useState<GroupInvite | null>(null);

  useEffect(() => {
    api.createTempInvite(groupId, 24).then(setTempInvite).catch(() => {});
  }, [groupId]);

  // 다른 멤버가 그 사이 참가해서 인원수가 바뀌었을 수 있으니 화면에
  // 다시 포커스될 때마다 모임 정보를 새로 받아온다.
  useFocusEffect(
    useCallback(() => {
      fetchGroup(groupId);
    }, [groupId, fetchGroup])
  );

  const staticCode = group?.invite_code ?? '';
  const tempCode = tempInvite?.invite_code ?? '';
  const inviteLink = `readlog.app/invite/${tempCode || staticCode}`;

  function copyLink() {
    Clipboard.setString(inviteLink);
    Alert.alert('링크가 복사되었습니다.');
  }

  function shareLink() {
    Share.share({ message: `ReadLog 독서모임에 초대합니다!\n${inviteLink}` });
  }

  if (!group) return null;

  return (
    <View style={styles.screen}>
      <NavBar title="멤버 초대" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
      <Text style={styles.groupName}>{group.name}</Text>
      <Text style={styles.memberCount}>{group.member_count}/{group.max_member}명 참여 중</Text>

      {/* 상시 초대 코드 */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>고정 초대 코드</Text>
        <Text style={styles.code}>{staticCode}</Text>
        <Text style={styles.codeHint}>만료 없음 — 모임당 1개</Text>
      </View>

      {/* 임시 초대 링크 */}
      {tempInvite && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>임시 초대 링크 (24시간)</Text>
          <Text style={styles.code} numberOfLines={1}>{tempCode}</Text>
          <Text style={styles.codeHint}>
            만료: {new Date(tempInvite.expires_at).toLocaleString('ko-KR')}
          </Text>
        </View>
      )}

      {/* 링크 표시 */}
      <View style={styles.linkRow}>
        <Text style={styles.linkText} numberOfLines={1}>{inviteLink}</Text>
        <TouchableOpacity onPress={copyLink}><Text style={styles.copyIcon}>📋</Text></TouchableOpacity>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.outlineBtn} onPress={copyLink}>
          <Text style={styles.outlineBtnText}>링크 복사</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={shareLink}>
          <Text style={styles.primaryBtnText}>공유하기</Text>
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.beigeDark },
  container: {
    flex: 1, backgroundColor: COLORS.beigeDark,
    paddingHorizontal: 24, paddingTop: 24,
  },
  groupName: { fontFamily: 'serif', fontSize: 16, color: '#1C1A16', textAlign: 'center' },
  memberCount: { fontSize: 12, color: '#9E9E8A', textAlign: 'center', marginBottom: 20 },
  card: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardLabel: { fontSize: 10, color: '#9E9E8A' },
  code: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.deepGreen,
    letterSpacing: 4,
  },
  codeHint: { fontSize: 10, color: '#9E9E8A' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(237,231,216,0.6)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 16, gap: 8,
  },
  linkText: { flex: 1, fontSize: 12, color: '#9E9E8A' },
  copyIcon: { fontSize: 16 },
  btnRow: { flexDirection: 'row', gap: 8 },
  outlineBtn: {
    flex: 1,
    borderWidth: 1, borderColor: '#DDD7CB',
    borderRadius: 12, paddingVertical: 12,
    alignItems: 'center',
  },
  outlineBtnText: { fontSize: 14, fontWeight: '500', color: '#7A7060' },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.deepGreen,
    borderRadius: 12, paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '500', color: COLORS.beigeLight },
});
