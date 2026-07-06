import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props {
  nickname: string;
  progress: number;
  chapter: string;
  updatedAt: string;
  memo?: string | null;
  deletedByOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDismiss?: () => void;
}

export default function MemberProgressBar({
  nickname, progress, chapter, updatedAt,
  memo,
  deletedByOwner = false,
  onEdit, onDelete, onDismiss,
}: Props) {
  const isCompleted = progress >= 100;
  const barColor = isCompleted ? '#22C55E' : COLORS.deepGreen;

  const timeLabel = (() => {
    const diff = Date.now() - new Date(updatedAt).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return '방금 전';
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    return `${d}일 전`;
  })();

  if (deletedByOwner) {
    return (
      <View style={[styles.card, styles.deletedCard]}>
        <View style={styles.top}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{nickname[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{nickname}</Text>
            <Text style={styles.deletedText}>방장이 삭제했습니다.</Text>
          </View>
          {onDismiss && (
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissBtnText}>지우기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{nickname[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{nickname}</Text>
          <Text style={styles.sub}>{chapter ? `${chapter} · ` : ''}{timeLabel}</Text>
        </View>
        <Text style={[styles.percent, isCompleted && styles.percentDone]}>
          {Math.round(progress)}%
        </Text>
        {(onEdit || onDelete) && (
          <View style={styles.actionRow}>
            {onEdit && (
              <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
                <Text style={styles.actionBtnText}>수정</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
                <Text style={styles.deleteBtnText}>삭제</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(100, progress)}%`, backgroundColor: barColor }]} />
      </View>
      {!!memo && <Text style={styles.memo}>{memo}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: 8,
  },
  deletedCard: {
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: '#FFF5F5',
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarWrap: {
    width: 28, height: 28,
    backgroundColor: 'rgba(45,74,62,0.15)',
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: COLORS.deepGreen },
  name: { fontSize: 12, fontWeight: '500', color: '#1C1A16' },
  sub: { fontSize: 10, color: '#9E9E8A' },
  deletedText: { fontSize: 10, color: '#EF4444', marginTop: 2 },
  percent: { fontSize: 12, fontWeight: '500', color: COLORS.deepGreen },
  percentDone: { color: '#16A34A' },
  barBg: { height: 6, backgroundColor: '#EDE7D8', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  memo: { fontSize: 11, color: '#7A7060', lineHeight: 16 },
  actionRow: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(45,74,62,0.3)',
  },
  actionBtnText: { fontSize: 10, color: COLORS.deepGreen },
  deleteBtn: { borderColor: 'rgba(239,68,68,0.3)' },
  deleteBtnText: { fontSize: 10, color: '#EF4444' },
  dismissBtn: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  dismissBtnText: { fontSize: 10, color: '#EF4444' },
});
