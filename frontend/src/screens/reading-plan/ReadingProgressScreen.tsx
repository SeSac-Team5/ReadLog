import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProgressLogs } from "../../hooks/reading-plan/useProgressLogs";
import { useLibrary } from "../../store/reading-plan/libraryStore";
import type { UserLibraryItem } from "../../types/reading-plan/book";

const COLORS = {
  deepGreen: "#2D4A3E",
  beigeLight: "#FDFBF4",
  beigeDark: "#EDE7D8",
  textPrimary: "#1C1A16",
  textMuted: "#9E9E8A",
  textSubtle: "#7A7060",
  border: "rgba(0, 0, 0, 0.08)",
};

type InputMethod = "page" | "percent";

interface ReadingProgressScreenProps {
  libraryItem: UserLibraryItem;
  onBack: () => void;
  onSharePress?: () => void;
}

export function ReadingProgressScreen({
  libraryItem,
  onBack,
  onSharePress,
}: ReadingProgressScreenProps) {
  const totalPages = libraryItem.book.pageCount ?? 0;
  const { recordProgress } = useLibrary();
  const { logs, isLoading: isHistoryLoading, refetch } = useProgressLogs(libraryItem.id);

  const [method, setMethod] = useState<InputMethod>("page");
  const [pageValue, setPageValue] = useState(libraryItem.currentPage);
  const [percentValue, setPercentValue] = useState(
    totalPages ? Math.round((libraryItem.currentPage / totalPages) * 100) : 0
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minPercent = totalPages
    ? Math.round((libraryItem.currentPage / totalPages) * 100)
    : 0;

  const handlePageChange = (text: string) => {
    const parsed = parseInt(text, 10);
    const clamped = Number.isNaN(parsed)
      ? 0
      : Math.max(0, totalPages ? Math.min(parsed, totalPages) : parsed);
    setPageValue(clamped);
    if (totalPages) {
      setPercentValue(Math.min(100, Math.round((clamped / totalPages) * 100)));
    }
  };

  const handlePercentChange = (value: number) => {
    setPercentValue(value);
    if (totalPages) {
      setPageValue(Math.min(totalPages, Math.round((value / 100) * totalPages)));
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    const submittingPage =
      method === "page"
        ? pageValue
        : totalPages
        ? Math.round((percentValue / 100) * totalPages)
        : null;

    if (submittingPage !== null && submittingPage < libraryItem.currentPage) {
      setError(`현재 진도(p.${libraryItem.currentPage})보다 낮은 값으로는 저장할 수 없어요`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      if (method === "page") {
        await recordProgress(libraryItem.id, { page: pageValue });
      } else {
        await recordProgress(libraryItem.id, { percent: percentValue });
      }
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "진도 저장에 실패했어요");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>독서 진도 입력</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
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
            <Text style={styles.bookTitle} numberOfLines={2}>
              {libraryItem.book.title}
            </Text>
            <Text style={styles.bookMeta} numberOfLines={1}>
              {libraryItem.book.author}
              {totalPages ? ` · 총 ${totalPages}페이지` : ""}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>진도 입력 방식</Text>
        <View style={styles.methodRow}>
          {(["page", "percent"] as const).map((option) => {
            const active = method === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.methodButton, active && styles.methodButtonActive]}
                onPress={() => setMethod(option)}
              >
                <Text style={[styles.methodButtonText, active && styles.methodButtonTextActive]}>
                  {option === "page" ? "페이지 입력" : "퍼센트(%)"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.currentProgressHint}>
          현재 기록: p.{libraryItem.currentPage} ({minPercent}%) — 이보다 낮은 값은 저장할 수 없어요
        </Text>

        {method === "page" ? (
          <View style={styles.pageInputRow}>
            <TextInput
              style={styles.pageInput}
              keyboardType="number-pad"
              value={String(pageValue)}
              onChangeText={handlePageChange}
            />
            <Text style={styles.pageInputSuffix}>
              / {totalPages || "?"} 페이지
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.percentValueText}>{percentValue}%</Text>
            <Slider
              minimumValue={minPercent}
              maximumValue={100}
              step={1}
              value={percentValue}
              onValueChange={handlePercentChange}
              minimumTrackTintColor={COLORS.deepGreen}
              maximumTrackTintColor={COLORS.beigeDark}
              thumbTintColor={COLORS.deepGreen}
            />
          </View>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>진도율</Text>
            <Text style={styles.progressPercent}>{percentValue}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(percentValue > 0 ? 2 : 0, percentValue)}%` },
              ]}
            />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator color={COLORS.beigeLight} />
            ) : (
              <Text style={styles.saveButtonText}>저장하기</Text>
            )}
          </TouchableOpacity>
          {onSharePress ? (
            <TouchableOpacity style={styles.shareButton} onPress={onSharePress}>
              <Text style={styles.shareButtonText}>공유하기</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>이전 기록</Text>
        {isHistoryLoading ? (
          <ActivityIndicator color={COLORS.deepGreen} style={styles.historyLoading} />
        ) : logs.length === 0 ? (
          <Text style={styles.emptyHistoryText}>아직 저장된 진도 기록이 없어요</Text>
        ) : (
          <View style={styles.historyList}>
            {logs.map((log) => (
              <View key={log.id} style={styles.historyRow}>
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>{log.percent ?? "-"}%</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyPage}>
                    p.{log.page ?? "-"}
                    {totalPages ? ` / ${totalPages}` : ""}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(log.recordedAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoiding: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  bookHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  bookInfo: {
    flex: 1,
    minWidth: 0,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  shareButton: {
    flex: 0.55,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.deepGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.deepGreen,
  },
  bookCover: {
    width: 40,
    height: 56,
    borderRadius: 8,
    backgroundColor: "rgba(45, 74, 62, 0.2)",
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSubtle,
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  currentProgressHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD7CB",
    alignItems: "center",
  },
  methodButtonActive: {
    backgroundColor: COLORS.deepGreen,
    borderColor: COLORS.deepGreen,
  },
  methodButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textMuted,
  },
  methodButtonTextActive: {
    color: COLORS.beigeLight,
  },
  pageInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pageInput: {
    flex: 1,
    backgroundColor: COLORS.beigeDark,
    borderRadius: 12,
    paddingVertical: 12,
    textAlign: "center",
    fontSize: 22,
    color: COLORS.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  pageInputSuffix: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  percentValueText: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.deepGreen,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: COLORS.beigeDark,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.deepGreen,
  },
  historyLoading: {
    marginVertical: 8,
  },
  emptyHistoryText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  historyList: {
    gap: 8,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.beigeLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  historyBadge: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(45, 74, 62, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.deepGreen,
  },
  historyInfo: {
    flex: 1,
  },
  historyPage: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  historyDate: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: "#B91C1C",
  },
  saveButton: {
    flex: 1.45,
    backgroundColor: COLORS.deepGreen,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.beigeLight,
  },
});
