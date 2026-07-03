import React, { useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGroupProgress } from '../../hooks/reading-group/useGroups';
import { COLORS } from '../../constants/theme';

type Props = NativeStackScreenProps<any, 'ProgressShare'>;
type InputMode = 'page' | 'chapter' | 'percent';

export default function ProgressShareScreen({ navigation, route }: Props) {
  const { groupId } = route.params as { groupId: number };
  const { share } = useGroupProgress(groupId);

  const [mode, setMode] = useState<InputMode>('page');
  const [page, setPage] = useState('');
  const [chapter, setChapter] = useState('');
  const [percent, setPercent] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  const progressValue = mode === 'percent' ? parseFloat(percent) : undefined;
  const pageValue = mode === 'page' ? parseInt(page, 10) : undefined;
  const displayPercent = progressValue ?? (pageValue ? Math.min(100, (pageValue / 247) * 100) : 0);

  async function handleShare() {
    if (mode === 'page' && !page) { Alert.alert('페이지를 입력해주세요.'); return; }
    if (mode === 'chapter' && !chapter) { Alert.alert('챕터를 입력해주세요.'); return; }
    if (mode === 'percent' && !percent) { Alert.alert('퍼센트를 입력해주세요.'); return; }

    setLoading(true);
    try {
      await share({
        page: pageValue,
        chapter: chapter || undefined,
        progress: progressValue ?? Math.round(displayPercent),
        memo: memo || undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('진도 공유에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>진도 입력 방식</Text>
        <View style={styles.modeRow}>
          {(['page', 'chapter', 'percent'] as InputMode[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.modeChip, mode === m && styles.modeChipActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.modeChipText, mode === m && styles.modeChipTextActive]}>
                {m === 'page' ? '페이지' : m === 'chapter' ? '챕터' : '퍼센트'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {mode === 'page' && (
        <View style={styles.field}>
          <TextInput
            style={styles.bigInput}
            keyboardType="numeric"
            value={page}
            onChangeText={setPage}
            placeholder="0"
            placeholderTextColor="#9E9E8A"
          />
        </View>
      )}
      {mode === 'chapter' && (
        <TextInput
          style={styles.input}
          value={chapter}
          onChangeText={setChapter}
          placeholder="예: Chapter 2 - 몽고반점"
          placeholderTextColor="#9E9E8A"
        />
      )}
      {mode === 'percent' && (
        <View style={styles.field}>
          <TextInput
            style={styles.bigInput}
            keyboardType="numeric"
            value={percent}
            onChangeText={setPercent}
            placeholder="0"
            placeholderTextColor="#9E9E8A"
          />
        </View>
      )}

      {/* 진도 바 */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>진도율</Text>
          <Text style={styles.progressValue}>{Math.round(displayPercent)}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${Math.min(100, displayPercent)}%` }]} />
        </View>
      </View>

      {mode !== 'chapter' && (
        <View style={styles.field}>
          <Text style={styles.label}>현재 챕터 (선택)</Text>
          <TextInput
            style={styles.input}
            value={chapter}
            onChangeText={setChapter}
            placeholder="예: Chapter 2 - 몽고반점"
            placeholderTextColor="#9E9E8A"
          />
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>메모 (선택)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
          value={memo}
          onChangeText={setMemo}
          placeholder="이 부분에서 느낀 점을 기록해보세요..."
          placeholderTextColor="#9E9E8A"
          multiline
          maxLength={300}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
        onPress={handleShare}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>진도 공유하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.beigeDark },
  content: { padding: 20, gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '500', color: '#7A7060' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: {
    flex: 1, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: '#DDD7CB', alignItems: 'center',
  },
  modeChipActive: { backgroundColor: COLORS.deepGreen, borderColor: COLORS.deepGreen },
  modeChipText: { fontSize: 12, fontWeight: '500', color: '#9E9E8A' },
  modeChipTextActive: { color: COLORS.beigeLight },
  bigInput: {
    backgroundColor: COLORS.beigeDark,
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 32, fontFamily: 'serif',
    color: '#1C1A16', textAlign: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  input: {
    backgroundColor: COLORS.beigeDark,
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: '#1C1A16',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  progressSection: { gap: 8 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: '#7A7060' },
  progressValue: { fontSize: 12, fontWeight: '500', color: COLORS.deepGreen },
  progressBg: { height: 12, backgroundColor: COLORS.beigeDark, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 12, backgroundColor: COLORS.deepGreen, borderRadius: 6 },
  primaryBtn: {
    backgroundColor: COLORS.deepGreen,
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '500', color: COLORS.beigeLight },
});
