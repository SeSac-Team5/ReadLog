import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import type { GroupComment } from '../../types/reading-group';

interface Props {
  comment: GroupComment;
  onReact: (emoji: string) => void;
  currentUserId?: number;
}

export const EMOJI_PRESETS = ['🌿', '💭', '❤️', '👏', '😮'];

export default function SpoilerComment({ comment, onReact, currentUserId }: Props) {
  const [revealed, setRevealed] = useState(false);

  const timeLabel = (() => {
    const diff = Date.now() - new Date(comment.created_at).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return '방금 전';
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  })();

  // 이모지별 그룹핑: { emoji -> { count, mine } }
  const reactionMap = comment.reactions.reduce<Record<string, { count: number; mine: boolean }>>(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, mine: false };
      acc[r.emoji].count += 1;
      if (r.user_id === currentUserId) acc[r.emoji].mine = true;
      return acc;
    },
    {}
  );
  const reactionEntries = Object.entries(reactionMap);

  return (
    <View style={[styles.card, comment.is_spoiler && styles.cardSpoiler]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={[styles.avatar, comment.is_spoiler && styles.avatarSpoiler]}>
          <Text style={[styles.avatarText, comment.is_spoiler && styles.avatarTextSpoiler]}>
            {(comment.nickname ?? '?')[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nickname}>{comment.nickname ?? `User ${comment.user_id}`}</Text>
          <Text style={[styles.meta, comment.is_spoiler && styles.metaSpoiler]}>
            {timeLabel}
            {comment.is_spoiler ? ' · 스포일러 포함' : ''}
          </Text>
        </View>
        {comment.is_spoiler && (
          <View style={styles.spoilerBadge}>
            <Text style={styles.spoilerBadgeText}>⚠️ 스포일러</Text>
          </View>
        )}
      </View>

      {/* 인용 */}
      {comment.quote ? (
        <View style={styles.quoteBlock}>
          <Text style={styles.quoteText}>"{comment.quote}"</Text>
        </View>
      ) : null}

      {/* 본문 */}
      <View style={{ position: 'relative' }}>
        <Text
          style={[
            styles.content,
            comment.is_spoiler && !revealed && styles.contentBlurred,
          ]}
        >
          {comment.content}
        </Text>
        {comment.is_spoiler && !revealed && (
          <TouchableOpacity style={styles.revealOverlay} onPress={() => setRevealed(true)}>
            <Text style={styles.revealText}>탭하여 스포일러 보기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 이모지 선택 버튼 */}
      <View style={styles.emojiRow}>
        {EMOJI_PRESETS.map(e => (
          <TouchableOpacity
            key={e}
            style={[styles.emojiBtn, reactionMap[e]?.mine && styles.emojiBtnActive]}
            onPress={() => onReact(e)}
          >
            <Text style={styles.emoji}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 이모지별 카운트 (반응이 있을 때만 표시) */}
      {reactionEntries.length > 0 && (
        <View style={styles.reactionChipRow}>
          {reactionEntries.map(([emoji, { count, mine }]) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.reactionChip, mine && styles.reactionChipActive]}
              onPress={() => onReact(emoji)}
            >
              <Text style={styles.reactionChipEmoji}>{emoji}</Text>
              <Text style={[styles.reactionChipCount, mine && styles.reactionChipCountActive]}>
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    gap: 8,
  },
  cardSpoiler: { borderColor: '#FCD34D' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 28, height: 28,
    backgroundColor: 'rgba(45,74,62,0.15)',
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSpoiler: { backgroundColor: '#FEF3C7' },
  avatarText: { fontSize: 11, fontWeight: '700', color: COLORS.deepGreen },
  avatarTextSpoiler: { color: '#92400E' },
  nickname: { fontSize: 12, fontWeight: '500', color: '#1C1A16' },
  meta: { fontSize: 10, color: '#9E9E8A' },
  metaSpoiler: { color: '#D97706' },
  spoilerBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
  },
  spoilerBadgeText: { fontSize: 10, color: '#92400E' },
  quoteBlock: {
    backgroundColor: 'rgba(237,231,216,0.7)',
    borderLeftWidth: 2, borderLeftColor: '#8B5E3C',
    borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8,
  },
  quoteText: { fontSize: 12, color: '#7A7060', fontStyle: 'italic' },
  content: { fontSize: 12, color: '#1C1A16', lineHeight: 20 },
  contentBlurred: { opacity: 0.15 },
  revealOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  revealText: { fontSize: 12, fontWeight: '500', color: '#D97706' },
  emojiRow: { flexDirection: 'row', gap: 4 },
  emojiBtn: {
    backgroundColor: '#EDE7D8',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: 'transparent',
  },
  emojiBtnActive: {
    backgroundColor: 'rgba(45,74,62,0.12)',
    borderColor: COLORS.deepGreen,
  },
  emoji: { fontSize: 12 },
  reactionChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  reactionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EDE7D8',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'transparent',
  },
  reactionChipActive: {
    backgroundColor: 'rgba(45,74,62,0.12)',
    borderColor: COLORS.deepGreen,
  },
  reactionChipEmoji: { fontSize: 11 },
  reactionChipCount: { fontSize: 10, color: '#7A7060' },
  reactionChipCountActive: { color: COLORS.deepGreen, fontWeight: '600' },
});
