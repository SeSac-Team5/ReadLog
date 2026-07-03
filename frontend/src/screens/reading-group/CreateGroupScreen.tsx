import React, { useState } from 'react';
import {
  Alert, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as api from '../../api/reading-group';
import { COLORS } from '../../constants/theme';

type Props = NativeStackScreenProps<any, 'CreateGroup'>;

const MAX_MEMBERS = [4, 6, 8, 10, 12];

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

type PickedBook = { book_id: number; title: string; author: string };

export default function CreateGroupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMember, setMaxMember] = useState(8);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [selectedBook, setSelectedBook] = useState<PickedBook | null>(null);
  const [loading, setLoading] = useState(false);

  function openBookSearch() {
    navigation.navigate('BookSearch', {
      pickerMode: true,
      onBookSelect: (book: PickedBook) => setSelectedBook(book),
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
        <View style={styles.chipRow}>
          {MAX_MEMBERS.map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, maxMember === n && styles.chipActive]}
              onPress={() => setMaxMember(n)}
            >
              <Text style={[styles.chipText, maxMember === n && styles.chipTextActive]}>
                {n}명
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>진행 도서 (선택)</Text>
        {selectedBook ? (
          <View style={styles.bookCard}>
            <View style={styles.bookCover} />
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
            <Text style={styles.bookAddText}>도서 검색 및 선택</Text>
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
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD7CB',
    alignItems: 'center',
  },
  chipActive: { backgroundColor: COLORS.deepGreen, borderColor: COLORS.deepGreen },
  chipText: { fontSize: 12, fontWeight: '500', color: '#9E9E8A' },
  chipTextActive: { color: COLORS.beigeLight },
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
