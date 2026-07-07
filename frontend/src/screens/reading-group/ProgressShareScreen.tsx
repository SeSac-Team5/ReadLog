import React, { useCallback, useState } from 'react';
import {
  Alert, Image, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useGroupProgress } from '../../hooks/reading-group/useGroups';
import { useGroupStore } from '../../store/reading-group/groupStore';
import { COLORS } from '../../constants/theme';
import NavBar from '../../components/common/NavBar';
import type { ProgressPayload } from '../../types/reading-group';

type Props = NativeStackScreenProps<any, 'ProgressShare'>;
type InputMode = 'page' | 'chapter' | 'percent';

interface InitialData {
  chapter?: string | null;
  page?: number | null;
  progress?: number | null;
  memo?: string | null;
}

export default function ProgressShareScreen({ navigation, route }: Props) {
  const { groupId, progressId, initialData } = route.params as {
    groupId: number;
    progressId?: number;
    initialData?: InitialData;
  };
  const isEditMode = !!progressId;
  const { share, update } = useGroupProgress(groupId);
  const { currentGroup, fetchGroup } = useGroupStore();
  const bookCoverUrl = currentGroup?.book_cover_url ?? null;
  const totalPages = currentGroup?.book_page_count ?? null;

  // currentGroup은 GroupHomeScreen 등에서 미리 채워둔 값을 그대로 쓰므로,
  // 그 사이 도서 정보가 바뀌었을 수 있어 화면 진입 시마다 새로 받아온다.
  useFocusEffect(
    useCallback(() => {
      fetchGroup(groupId);
    }, [groupId, fetchGroup])
  );

  const initMode = (): InputMode => {
    if (!initialData) return 'page';
    if (initialData.page != null) return 'page';
    if (initialData.chapter != null) return 'chapter';
    return 'percent';
  };

  const [mode, setMode] = useState<InputMode>(initMode);
  const [page, setPage] = useState(initialData?.page != null ? String(initialData.page) : '');
  const [chapter, setChapter] = useState(initialData?.chapter ?? '');
  const [percent, setPercent] = useState(initialData?.progress != null ? String(Math.round(initialData.progress)) : '');
  const [memo, setMemo] = useState(initialData?.memo ?? '');
  const [loading, setLoading] = useState(false);

  const progressValue = mode === 'percent' ? parseFloat(percent) : undefined;
  const pageValue = mode === 'page' ? parseInt(page, 10) : undefined;
  const displayPercent = progressValue ?? (
    pageValue != null && totalPages != null && totalPages > 0
      ? Math.min(100, (pageValue / totalPages) * 100)
      : 0
  );

  async function handleSubmit() {
    if (mode === 'page' && !page) { Alert.alert('페이지를 입력해주세요.'); return; }
    if (mode === 'chapter' && !chapter) { Alert.alert('챕터를 입력해주세요.'); return; }
    if (mode === 'percent' && !percent) { Alert.alert('퍼센트를 입력해주세요.'); return; }

    const payload: ProgressPayload = {
      page: pageValue,
      chapter: chapter || undefined,
      progress: progressValue ?? Math.round(displayPercent),
      memo: memo || undefined,
    };

    setLoading(true);
    try {
      if (isEditMode) {
        await update(progressId, payload);
      } else {
        await share(payload);
      }
      navigation.goBack();
    } catch {
      Alert.alert(isEditMode ? '진도 수정에 실패했습니다.' : '진도 공유에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <NavBar title={isEditMode ? '진도 수정' : '진도 공유'} onBack={() => navigation.goBack()} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 모임 도서 헤더 */}
      {(bookCoverUrl || currentGroup?.name) && (
        <View style={styles.bookHeader}>
          {bookCoverUrl ? (
            <Image source={{ uri: bookCoverUrl }} style={styles.bookCover} resizeMode="cover" />
          ) : (
            <View style={styles.bookCoverPlaceholder} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.bookName} numberOfLines={2}>{currentGroup?.name ?? ''}</Text>
            {totalPages != null && (
              <Text style={styles.bookPages}>전체 {totalPages}p</Text>
            )}
          </View>
        </View>
      )}

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
          {totalPages != null && (
            <Text style={styles.pageHint}>/ {totalPages} 페이지</Text>
          )}
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
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>{isEditMode ? '진도 수정하기' : '진도 공유하기'}</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.beigeDark },
  container: { flex: 1, backgroundColor: COLORS.beigeDark },
  content: { padding: 20, gap: 20 },
  bookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  bookCover: { width: 44, height: 62, borderRadius: 4 },
  bookCoverPlaceholder: {
    width: 44, height: 62, borderRadius: 4,
    backgroundColor: 'rgba(45,74,62,0.08)',
  },
  bookName: { fontSize: 13, fontWeight: '600', color: '#1C1A16' },
  bookPages: { fontSize: 11, color: '#9E9E8A', marginTop: 4 },
  pageHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9E9E8A',
    marginTop: 4,
  },
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
