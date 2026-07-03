import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useReview } from "../../hooks/reading-plan/useReview";
import { useLibrary } from "../../store/reading-plan/libraryStore";
import type { UserLibraryItem } from "../../types/reading-plan/book";

const COLORS = {
  deepGreen: "#2D4A3E",
  beigeLight: "#FDFBF4",
  beigeDark: "#EDE7D8",
  textPrimary: "#1C1A16",
  textMuted: "#9E9E8A",
  border: "rgba(0, 0, 0, 0.08)",
  star: "#FBBF24",
};

const MAX_LENGTH = 100;
const STAR_VALUES = [1, 2, 3, 4, 5];

export default function OneLineReviewScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: { params: { libraryItemId: string } };
}) {
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const { items } = useLibrary();
  const libraryItem = items.find((item) => item.id === route.params.libraryItemId) ?? null;

  if (!libraryItem) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <Text style={styles.notFoundText}>책 정보를 찾을 수 없어요</Text>
      </SafeAreaView>
    );
  }

  return (
    <OneLineReviewScreenView
      libraryItem={libraryItem}
      onBack={() => navigation.goBack()}
      onSaved={() => navigation.goBack()}
    />
  );
}

interface OneLineReviewScreenProps {
  libraryItem: UserLibraryItem;
  onBack: () => void;
  onSaved?: () => void;
}

function OneLineReviewScreenView({ libraryItem, onBack, onSaved }: OneLineReviewScreenProps) {
  const { review, isLoading, error: loadError, save, remove } = useReview(libraryItem.book.id);

  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || isLoading) return;
    setText(review?.review ?? "");
    setRating(review?.rating ?? 0);
    initializedRef.current = true;
  }, [isLoading, review]);

  const handleSave = async () => {
    if (!text.trim() || isSaving) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await save(text.trim(), rating > 0 ? rating : undefined);
      onSaved?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "저장에 실패했어요");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await remove();
      setText("");
      setRating(0);
      onSaved?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "삭제에 실패했어요");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>한줄평</Text>
        <TouchableOpacity onPress={handleSave} disabled={!text.trim() || isSaving}>
          <Text
            style={[styles.headerSaveText, (!text.trim() || isSaving) && styles.headerSaveTextDisabled]}
          >
            저장
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.body}>
          <View style={styles.bookHeader}>
            {libraryItem.book.coverUrl ? (
              <Image
                source={{ uri: libraryItem.book.coverUrl }}
                style={styles.bookCover}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bookCover} />
            )}
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{libraryItem.book.title}</Text>
              <Text style={styles.bookMeta}>
                {libraryItem.book.author}
                {libraryItem.completedAt ? ` · 완독 ${libraryItem.completedAt}` : ""}
              </Text>
              <View style={styles.starRow}>
                {STAR_VALUES.map((value) => (
                  <TouchableOpacity key={value} onPress={() => setRating(value)} hitSlop={4}>
                    <Text style={[styles.star, value <= rating && styles.starFilled]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator color={COLORS.deepGreen} style={styles.loading} />
          ) : (
            <View style={styles.editorSection}>
              <Text style={styles.sectionLabel}>한 줄로 표현하는 이 책의 감상</Text>
              <TextInput
                style={styles.textArea}
                value={text}
                onChangeText={(value) => setText(value.slice(0, MAX_LENGTH))}
                placeholder="이 책에 대한 한 줄 감상을 남겨보세요"
                placeholderTextColor={COLORS.textMuted}
                multiline
                maxLength={MAX_LENGTH}
              />
              <Text style={styles.counterText}>
                {text.length}/{MAX_LENGTH}자
              </Text>
            </View>
          )}

          {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

          <View style={styles.buttonRow}>
            {review ? (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#EF4444" />
                ) : (
                  <Text style={styles.deleteButtonText}>삭제</Text>
                )}
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.saveButton, !text.trim() && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!text.trim() || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.beigeLight} />
              ) : (
                <Text style={styles.saveButtonText}>저장하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.beigeLight,
  },
  notFoundText: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    color: COLORS.textMuted,
    fontSize: 13,
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
  headerSaveText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.deepGreen,
  },
  headerSaveTextDisabled: {
    color: COLORS.textMuted,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  bookHeader: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  bookCover: {
    width: 40,
    height: 56,
    borderRadius: 8,
    backgroundColor: "rgba(45, 74, 62, 0.2)",
  },
  bookInfo: {
    flex: 1,
    justifyContent: "center",
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  bookMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 6,
  },
  star: {
    fontSize: 15,
    color: "#DDD7CB",
  },
  starFilled: {
    color: COLORS.star,
  },
  loading: {
    marginTop: 24,
  },
  editorSection: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A7060",
    marginBottom: 8,
  },
  textArea: {
    flex: 1,
    minHeight: 120,
    backgroundColor: "rgba(237, 231, 216, 0.6)",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    textAlignVertical: "top",
  },
  counterText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "right",
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#B91C1C",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  deleteButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#EF4444",
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.deepGreen,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.beigeLight,
  },
});
