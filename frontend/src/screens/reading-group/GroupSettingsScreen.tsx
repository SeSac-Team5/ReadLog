import React, { useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Switch, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as api from '../../api/reading-group';
import { useGroupStore } from '../../store/reading-group/groupStore';
import { useAuth } from '../../store/auth/AuthContext';
import { COLORS } from '../../constants/theme';
import type { MemberRole } from '../../types/reading-group';

type Props = NativeStackScreenProps<any, 'GroupSettings'>;

const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: '방장', MANAGER: '매니저', MEMBER: '멤버',
};

export default function GroupSettingsScreen({ navigation, route }: Props) {
  const { groupId } = route.params as { groupId: number };

  // useGroupDetail 대신 스토어 직접 접근 — unmount 시 clearCurrent 호출 없음
  const { currentGroup: group, members, kickMember, delegateOwnership, leaveGroup } = useGroupStore();
  const { user } = useAuth();

  const myRole = members.find(m => m.user_id === user?.id)?.role ?? 'MEMBER';
  const isOwner = myRole === 'OWNER';

  const [name, setName] = useState(group?.name ?? '');
  const [isPublic, setIsPublic] = useState(group?.is_public ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('모임명을 입력해주세요.'); return; }
    setSaving(true);
    try {
      await api.updateGroup(groupId, { name: name.trim(), is_public: isPublic });
      Alert.alert('저장되었습니다.');
    } catch {
      Alert.alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  function confirmKick(userId: number, nickname: string | null) {
    const name = nickname ?? `User ${userId}`;
    Alert.alert('멤버 강퇴', `${name}님을 강퇴하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '강퇴', style: 'destructive', onPress: () => kickMember(groupId, userId) },
    ]);
  }

  function confirmDelegate(userId: number, nickname: string | null) {
    const name = nickname ?? `User ${userId}`;
    Alert.alert('소유권 위임', `${name}님에게 모임장을 위임하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '위임', onPress: () => delegateOwnership(groupId, userId) },
    ]);
  }

  function confirmLeave() {
    Alert.alert('모임 탈퇴', '모임에서 탈퇴하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴', style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup(groupId);
            navigation.popToTop();
          } catch (e: any) {
            Alert.alert(e?.response?.data?.detail ?? '탈퇴에 실패했습니다.');
          }
        },
      },
    ]);
  }

  function confirmDeleteGroup() {
    Alert.alert('모임 삭제', '모임을 삭제하면 복구할 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          await api.deleteGroup(groupId);
          navigation.popToTop();
        },
      },
    ]);
  }

  if (!group) return null;

  // ── MEMBER 전용 화면 ──────────────────────────────────────────────────────
  if (!isOwner) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>멤버 목록</Text>
        <View style={styles.card}>
          {members.map((m, i) => (
            <View
              key={m.id}
              style={[styles.memberRow, i === members.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{(m.nickname ?? '?')[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.nickname ?? `User ${m.user_id}`}</Text>
                <Text style={styles.memberRole}>{ROLE_LABEL[m.role]}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.leaveBtn} onPress={confirmLeave}>
          <Text style={styles.leaveBtnText}>모임 탈퇴</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── OWNER 전용 화면 ───────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 기본 정보 */}
      <Text style={styles.sectionLabel}>기본 정보</Text>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.rowLabel}>모임명</Text>
          <TextInput
            style={styles.rowInput}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
        </View>
        <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
          <View>
            <Text style={styles.rowLabel}>공개 여부</Text>
            <Text style={styles.rowSub}>{isPublic ? '공개' : '비공개'}</Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            thumbColor={COLORS.beigeLight}
            trackColor={{ true: COLORS.deepGreen, false: '#DDD7CB' }}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>설정 저장</Text>
      </TouchableOpacity>

      {/* 멤버 관리 */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>멤버 관리</Text>
      <View style={styles.card}>
        {members.map((m, i) => (
          <View
            key={m.id}
            style={[styles.memberRow, i === members.length - 1 && { borderBottomWidth: 0 }]}
          >
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>{(m.nickname ?? '?')[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{m.nickname ?? `User ${m.user_id}`}</Text>
              <Text style={styles.memberRole}>{ROLE_LABEL[m.role]}</Text>
            </View>
            {m.role !== 'OWNER' && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={styles.delegateBtn}
                  onPress={() => confirmDelegate(m.user_id, m.nickname)}
                >
                  <Text style={styles.delegateBtnText}>위임</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.kickBtn}
                  onPress={() => confirmKick(m.user_id, m.nickname)}
                >
                  <Text style={styles.kickBtnText}>강퇴</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* 모임 삭제 */}
      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeleteGroup}>
        <Text style={styles.deleteBtnText}>모임 삭제</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.beigeDark },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700',
    color: '#9E9E8A', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowLabel: { fontSize: 14, color: '#1C1A16' },
  rowSub: { fontSize: 12, color: '#9E9E8A', marginTop: 2 },
  rowInput: {
    fontSize: 14, color: '#1C1A16', textAlign: 'right',
    flex: 1, marginLeft: 12,
  },
  saveBtn: {
    backgroundColor: COLORS.deepGreen,
    borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', marginTop: 12,
  },
  saveBtnText: { fontSize: 14, fontWeight: '500', color: COLORS.beigeLight },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  memberAvatar: {
    width: 32, height: 32,
    backgroundColor: 'rgba(45,74,62,0.1)',
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 12, fontWeight: '700', color: COLORS.deepGreen },
  memberName: { fontSize: 14, color: '#1C1A16' },
  memberRole: { fontSize: 10, color: '#9E9E8A' },
  delegateBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(45,74,62,0.3)',
    borderRadius: 8,
  },
  delegateBtnText: { fontSize: 11, color: COLORS.deepGreen },
  kickBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FCA5A5',
    borderRadius: 8,
  },
  kickBtnText: { fontSize: 11, color: '#EF4444' },
  leaveBtn: {
    marginTop: 32,
    borderWidth: 1, borderColor: '#FCA5A5',
    borderRadius: 12, paddingVertical: 12,
    alignItems: 'center',
  },
  leaveBtnText: { fontSize: 14, fontWeight: '500', color: '#EF4444' },
  deleteBtn: {
    marginTop: 32,
    borderWidth: 1, borderColor: '#FCA5A5',
    borderRadius: 12, paddingVertical: 12,
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '500', color: '#EF4444' },
});
