import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBookSearch } from "../../hooks/reading-plan/useBookSearch";
import { useLibrary } from "../../store/reading-plan/libraryStore";
import type { BookSearchResult } from "../../types/reading-plan/book";

const COLORS = {
  deepGreen: "#2D4A3E",
  beigeLight: "#FDFBF4",
  beigeDark: "#EDE7D8",
  textPrimary: "#1C1A16",
  textMuted: "#9E9E8A",
  border: "rgba(0, 0, 0, 0.08)",
};

export default function BookSearchScreen({ navigation }: { navigation: any }) {
  const onBookPress = (book: BookSearchResult) => navigation.navigate("BookDetail", { book });
  const { query, setQuery, results, isLoading, error, search, clear, searchedQuery } =
    useBookSearch();
  const { items, addToLibrary } = useLibrary();
  const [addingIsbn, setAddingIsbn] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const addedIsbns = useMemo(
    () => new Set(items.map((item) => item.book.isbn13)),
    [items]
  );

  const handleQuickAdd = async (book: BookSearchResult) => {
    if (addedIsbns.has(book.isbn13) || addingIsbn) return;
    setAddingIsbn(book.isbn13);
    try {
      await addToLibrary(book, "WISH");
    } finally {
      setAddingIsbn(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>책 검색</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="책 제목, 저자로 검색"
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
          autoFocus
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={clear} hitSlop={8}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.searchButton} onPress={search} hitSlop={8}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.stateBlock} color={COLORS.deepGreen} />
      ) : null}

      {error ? (
        <Text style={[styles.stateBlock, styles.errorText]}>{error}</Text>
      ) : null}

      {!isLoading && !error && query.trim().length > 0 && query.trim() !== searchedQuery ? (
        <TouchableOpacity onPress={search}>
          <Text style={styles.stateBlock}>"{query.trim()}"로 검색하기</Text>
        </TouchableOpacity>
      ) : null}

      {!isLoading &&
      !error &&
      searchedQuery !== null &&
      query.trim() === searchedQuery &&
      results.length === 0 ? (
        <Text style={styles.stateBlock}>"{searchedQuery}" 검색 결과가 없어요</Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.isbn13}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isAdded = addedIsbns.has(item.isbn13);
          const isAdding = addingIsbn === item.isbn13;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onBookPress(item)}
            >
              <View style={styles.cover}>
                {item.coverUrl ? (
                  <Image
                    source={{ uri: item.coverUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.coverTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                )}
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {[item.author, item.publisher].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addButton, isAdded && styles.addButtonDone]}
                onPress={() => handleQuickAdd(item)}
                disabled={isAdded || isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color={COLORS.beigeLight} />
                ) : (
                  <Text
                    style={[
                      styles.addButtonText,
                      isAdded && styles.addButtonTextDone,
                    ]}
                  >
                    {isAdded ? "추가됨" : "+ 서재"}
                  </Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.beigeLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
    width: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 24,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.beigeDark,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  clearIcon: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  searchButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.deepGreen,
  },
  searchButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.beigeLight,
  },
  stateBlock: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  errorText: {
    color: "#B91C1C",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  cover: {
    width: 40,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: "rgba(45, 74, 62, 0.18)",
    justifyContent: "flex-end",
    padding: 4,
    overflow: "hidden",
  },
  coverTitle: {
    fontSize: 8,
    fontWeight: "500",
    color: "rgba(28, 26, 22, 0.5)",
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  rowMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.deepGreen,
    minWidth: 64,
    alignItems: "center",
  },
  addButtonDone: {
    backgroundColor: COLORS.beigeDark,
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.beigeLight,
  },
  addButtonTextDone: {
    color: COLORS.textMuted,
  },
});
