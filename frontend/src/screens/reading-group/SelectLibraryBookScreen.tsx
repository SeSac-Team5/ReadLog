import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useLibrary } from '../../store/reading-plan/libraryStore';
import type { UserLibraryItem } from '../../types/reading-plan/book';
import { COLORS } from '../../constants/theme';
import NavBar from '../../components/common/NavBar';

export type SelectedLibraryBook = {
  book_id: number;
  title: string;
  author: string;
  coverUrl?: string | null;
};

type Props = NativeStackScreenProps<any, 'SelectLibraryBook'>;

export default function SelectLibraryBookScreen({ route, navigation }: Props) {
  const { onSelect } = route.params as { onSelect: (book: SelectedLibraryBook) => void };
  const { items, loadLibrary } = useLibrary();
  const [query, setQuery] = useState('');

  // 다른 화면에서 서재에 책을 추가/삭제한 뒤 다시 열어도 최신 목록이 보이도록
  // 마운트 시뿐 아니라 화면에 포커스될 때마다 다시 불러온다.
  useFocusEffect(
    useCallback(() => {
      loadLibrary();
    }, [loadLibrary])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      item.book.title.toLowerCase().includes(q) ||
      item.book.author.toLowerCase().includes(q)
    );
  }, [items, query]);

  function handlePick(item: UserLibraryItem) {
    onSelect({
      book_id: Number(item.book.id),
      title: item.book.title,
      author: item.book.author,
      coverUrl: item.book.coverUrl,
    });
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <NavBar title="진행 도서 선택" onBack={() => navigation.goBack()} />
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="내 서재에서 책 제목, 저자로 검색"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>내 서재에 등록된 책이 없어요.</Text>
          <Text style={styles.emptySubText}>먼저 내 서재에서 책을 추가해주세요.</Text>
        </View>
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>"{query}" 검색 결과가 없어요</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => handlePick(item)}>
              {item.book.coverUrl ? (
                <Image source={{ uri: item.book.coverUrl }} style={styles.cover} resizeMode="cover" />
              ) : (
                <View style={styles.coverPlaceholder} />
              )}
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.book.title}</Text>
                <Text style={styles.rowAuthor} numberOfLines={1}>{item.book.author}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.beigeDark },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.beigeLight,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  clearIcon: { fontSize: 12, color: COLORS.textMuted },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  emptySubText: { fontSize: 12, color: COLORS.textMuted },
  listContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cover: { width: 40, height: 56, borderRadius: 6, backgroundColor: COLORS.beigeDark },
  coverPlaceholder: { width: 40, height: 56, borderRadius: 6, backgroundColor: COLORS.beigeDark },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  rowAuthor: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
