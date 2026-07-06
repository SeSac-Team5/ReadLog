import React, { useRef, useState } from 'react';
import {
  Alert, FlatList, Image, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as api from '../../api/reading-group';
import { COLORS } from '../../constants/theme';
import type { SelectedLibraryBook } from './SelectLibraryBookScreen';

type Props = NativeStackScreenProps<any, 'CreateGroup'>;

const MIN_MEMBER = 2;
const MAX_MEMBER = 20;
const MEMBER_OPTIONS = Array.from({ length: MAX_MEMBER - MIN_MEMBER + 1 }, (_, i) => i + MIN_MEMBER);

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CreateGroupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMember, setMaxMember] = useState(8);
  const [maxMemberText, setMaxMemberText] = useState('8');
  const memberListRef = useRef<FlatList>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [selectedBook, setSelectedBook] = useState<SelectedLibraryBook | null>(null);
  const [loading, setLoading] = useState(false);

  function selectMember(n: number) {
    setMaxMember(n);
    setMaxMemberText(String(n));
    const idx = MEMBER_OPTIONS.indexOf(n);
    if (idx !== -1) {
      memberListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  }

  function onMemberTextChange(text: string) {
    setMaxMemberText(text);
    const n = parseInt(text, 10);
    if (!isNaN(n) && n >= MIN_MEMBER && n <= MAX_MEMBER) {
      setMaxMember(n);
      const idx = MEMBER_OPTIONS.indexOf(n);
      if (idx !== -1) {
        memberListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      }
    }
  }

  function onMemberTextBlur() {
    const n = parseInt(maxMemberText, 10);
    if (isNaN(n) || n < MIN_MEMBER) {
      setMaxMember(MIN_MEMBER);
      setMaxMemberText(String(MIN_MEMBER));
    } else if (n > MAX_MEMBER) {
      setMaxMember(MAX_MEMBER);
      setMaxMemberText(String(MAX_MEMBER));
    } else {
      setMaxMember(n);
      setMaxMemberText(String(n));
    }
  }

  function openBookSearch() {
    navigation.navigate('SelectLibraryBook', {
      onSelect: (book: SelectedLibraryBook) => setSelectedBook(book),
    });
  }

  function openPicker(target: 'start' | 'end') {
    setPickerTarget(target);
  }

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    // Android: 닫기 버튼 또는 바깥 터치 시 type === 'dismissed'
    if (event.type === 'dismissed' || !selected) {
      setPickerTarget(null);
      return;
    }
    if (pickerTarget === 'start') {
      const s = toDateString(selected);
      setStartDate(s);
      // 시작일이 종료일보다 늦어지면 종료일 초기화
      if (endDate && s > endDate) setEndDate('');
    } else {
      setEndDate(toDateString(selected));
    }
    setPickerTarget(null);
  }

  const pickerValue =
    pickerTarget === 'start' && startDate ? new Date(startDate) :
    pickerTarget === 'end'   && endDate   ? new Date(endDate)   :
    new Date();

  const pickerMinDate =
    pickerTarget === 'end' && startDate
      ? new Date(startDate)
      : todayMidnight();

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('모임명을 입력해주세요.');
      return;
    }
    if (startDate && new Date(startDate) < todayMidnight()) {
      Alert.alert('시작일은 오늘 이후여야 합니다.');
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      Alert.alert('종료일은 시작일 이후여야 합니다.');
      return;
    }
    setLoading(true);
    try {
      const group = await api.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        max_member: maxMember,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        book_id: selectedBook?.book_id,
      });
      navigation.replace('GroupHome', { groupId: group.id });
    } catch {
      Alert.alert('모임 개설에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>모임명</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 한강 읽기 모임"
          placeholderTextColor="#9E9E8A"
          value={name}
          onChangeText={setName}
          maxLength={100}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>설명 (선택)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
          placeholder="모임을 소개해주세요"
          placeholderTextColor="#9E9E8A"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>최대 인원</Text>
        <FlatList
          ref={memberListRef}
          data={MEMBER_OPTIONS}
          horizontal
          keyExtractor={item => String(item)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberScrollContent}
          getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.memberChip, maxMember === item && styles.memberChipActive]}
              onPress={() => selectMember(item)}
            >
              <Text style={[styles.memberChipText, maxMember === item && styles.memberChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
        <View style={styles.memberInputRow}>
          <TextInput
            style={styles.memberInput}
            value={maxMemberText}
            onChangeText={onMemberTextChange}
            onBlur={onMemberTextBlur}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
          />
          <Text style={styles.memberInputUnit}>명 (최대 {MAX_MEMBER}명)</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>진행 도서 (선택)</Text>
        {selectedBook ? (
          <View style={styles.bookCard}>
            {selectedBook.coverUrl ? (
              <Image source={{ uri: selectedBook.coverUrl }} style={styles.bookCover} resizeMode="cover" />
            ) : (
              <View style={styles.bookCover} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle} numberOfLines={1}>{selectedBook.title}</Text>
              <Text style={styles.bookAuthor} numberOfLines={1}>{selectedBook.author}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedBook(null)} style={styles.bookRemove}>
              <Text style={styles.bookRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.bookAddBtn} onPress={openBookSearch}>
            <Text style={styles.bookAddIcon}>＋</Text>
            <Text style={styles.bookAddText}>내 서재에서 선택</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>독서 기간</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[styles.dateBtn, pickerTarget === 'start' && styles.dateBtnActive]}
            onPress={() => openPicker('start')}
          >
            <Text style={[styles.dateBtnText, !startDate && styles.datePlaceholder]}>
              {startDate || '시작일'}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: '#9E9E8A' }}>~</Text>
          <TouchableOpacity
            style={[styles.dateBtn, pickerTarget === 'end' && styles.dateBtnActive]}
            onPress={() => openPicker('end')}
          >
            <Text style={[styles.dateBtnText, !endDate && styles.datePlaceholder]}>
              {endDate || '종료일'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {pickerTarget !== null && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={pickerMinDate}
          onChange={onPickerChange}
        />
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>모임 개설하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.beigeDark },
  content: { padding: 20, gap: 20 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '500', color: '#7A7060' },
  input: {
    backgroundColor: COLORS.beigeDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1C1A16',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  dateBtn: {
    flex: 1,
    backgroundColor: COLORS.beigeDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  dateBtnActive: {
    borderColor: COLORS.deepGreen,
  },
  dateBtnText: { fontSize: 14, color: '#1C1A16' },
  datePlaceholder: { color: '#9E9E8A' },
  memberScrollContent: { paddingVertical: 4, gap: 8 },
  memberChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD7CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberChipActive: { backgroundColor: COLORS.deepGreen, borderColor: COLORS.deepGreen },
  memberChipText: { fontSize: 13, fontWeight: '500', color: '#9E9E8A' },
  memberChipTextActive: { color: COLORS.beigeLight },
  memberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  memberInput: {
    width: 64,
    backgroundColor: COLORS.beigeDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1A16',
    borderWidth: 1,
    borderColor: COLORS.deepGreen,
    textAlign: 'center',
  },
  memberInputUnit: { fontSize: 13, color: '#7A7060' },
  bookAddBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#DDD7CB',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bookAddIcon: { fontSize: 15, color: '#9E9E8A' },
  bookAddText: { fontSize: 14, color: '#9E9E8A' },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  bookCover: {
    width: 40, height: 56,
    backgroundColor: COLORS.beigeDark,
    borderRadius: 4,
  },
  bookTitle: { fontSize: 14, fontWeight: '600', color: '#1C1A16' },
  bookAuthor: { fontSize: 12, color: '#9E9E8A', marginTop: 2 },
  bookRemove: { padding: 4 },
  bookRemoveText: { fontSize: 14, color: '#9E9E8A' },
  primaryBtn: {
    backgroundColor: COLORS.deepGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '500', color: COLORS.beigeLight },
});
