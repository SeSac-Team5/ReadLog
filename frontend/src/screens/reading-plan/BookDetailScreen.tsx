import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLibrary } from "../../store/reading-plan/libraryStore";
import type { BookSearchResult, LibraryStatus } from "../../types/reading-plan/book";

const COLORS = {
  deepGreen: "#2D4A3E",
  beigeLight: "#FDFBF4",
  beigeDark: "#EDE7D8",
  textPrimary: "#1C1A16",
  textMuted: "#9E9E8A",
  textSubtle: "#7A7060",
  border: "rgba(0, 0, 0, 0.08)",
};

const STATUS_OPTIONS: { key: LibraryStatus; label: string }[] = [
  { key: "WISH", label: "읽고 싶다" },
  { key: "READING", label: "읽는 중" },
  { key: "COMPLETED", label: "완독" },
];

export default function BookDetailScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: { params: { book: BookSearchResult } };
}) {
  const { book } = route.params;
  const onBack = () => navigation.goBack();
  const onAdded = () => navigation.goBack();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const { items, addToLibrary } = useLibrary();

  const existingEntry = useMemo(
    () => items.find((item) => item.book.isbn13 === book.isbn13) ?? null,
    [items, book.isbn13]
  );

  const [selectedStatus, setSelectedStatus] = useState<LibraryStatus | null>(
    existingEntry?.status ?? null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedStatus || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await addToLibrary(book, selectedStatus);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "내 서재에 추가하지 못했어요");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>책 상세</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.coverWrap}>
          <View style={styles.cover}>
            {book.coverUrl ? (
              <Image
                source={{ uri: book.coverUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.coverTitle} numberOfLines={3}>
                {book.title}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.meta}>
            {[book.author, book.publisher, book.publishedDate?.slice(0, 4), book.pageCount ? `${book.pageCount}p` : null]
              .filter(Boolean)
              .join(" · ")}
          </Text>

          {book.description ? (
            <Text style={styles.description}>{book.description}</Text>
          ) : null}

          <Text style={styles.sectionLabel}>독서 상태 선택</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((option) => {
              const active = selectedStatus === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.statusButton, active && styles.statusButtonActive]}
                  onPress={() => setSelectedStatus(option.key)}
                >
                  <Text
                    style={[styles.statusButtonText, active && styles.statusButtonTextActive]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {existingEntry ? (
            <Text style={styles.alreadyAddedText}>
              이미 내 서재에 있는 책이에요. 상태를 바꾸면 갱신됩니다.
            </Text>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, !selectedStatus && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedStatus || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.beigeLight} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {existingEntry ? "상태 업데이트" : "내 서재에 추가"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 32,
  },
  coverWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    backgroundColor: "rgba(45, 74, 62, 0.1)",
  },
  cover: {
    width: "32%",
    minWidth: 100,
    maxWidth: 160,
    aspectRatio: 2 / 3,
    borderRadius: 12,
    backgroundColor: "rgba(45, 74, 62, 0.35)",
    justifyContent: "flex-end",
    padding: 12,
    overflow: "hidden",
  },
  coverTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(253, 251, 244, 0.9)",
    lineHeight: 15,
  },
  info: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(28, 26, 22, 0.8)",
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSubtle,
    marginTop: 24,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD7CB",
    alignItems: "center",
  },
  statusButtonActive: {
    backgroundColor: COLORS.deepGreen,
    borderColor: COLORS.deepGreen,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  statusButtonTextActive: {
    color: COLORS.beigeLight,
  },
  alreadyAddedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: "#B91C1C",
    marginTop: 10,
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: COLORS.deepGreen,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.beigeLight,
  },
});
