import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Props {
  nickname: string;
  progress: number;
  chapter: string;
  updatedAt: string;
}

export default function MemberProgressBar({ nickname, progress, chapter, updatedAt }: Props) {
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
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(100, progress)}%`, backgroundColor: barColor }]} />
      </View>
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
  percent: { fontSize: 12, fontWeight: '500', color: COLORS.deepGreen },
  percentDone: { color: '#16A34A' },
  barBg: { height: 6, backgroundColor: '#EDE7D8', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
});
