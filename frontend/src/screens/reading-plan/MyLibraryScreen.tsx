import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type {
  LibraryStatus,
  MonthlyGoal,
  UserLibraryItem,
} from "../../types/reading-plan/book";

const COLORS = {
  deepGreen: "#2D4A3E",
  beigeLight: "#FDFBF4",
  beigeDark: "#EDE7D8",
  textPrimary: "#1C1A16",
  textMuted: "#9E9E8A",
  textSubtle: "#7A7060",
  completedBadge: "#22C55E",
  readingBadge: "#2D4A3E",
  wishBadge: "#9E9E8A",
  border: "rgba(0, 0, 0, 0.08)",
};

const STATUS_BADGES: Record<LibraryStatus, { icon: string; background: string }> = {
  COMPLETED: { icon: "✓", background: COLORS.completedBadge },
  READING: { icon: "📖", background: COLORS.readingBadge },
  WISH: { icon: "🔖", background: COLORS.wishBadge },
};

type StatusFilter = "ALL" | LibraryStatus;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "READING", label: "읽는 중" },
  { key: "COMPLETED", label: "완독" },
  { key: "WISH", label: "읽고 싶어요" },
];

interface MyLibraryScreenProps {
  items: UserLibraryItem[];
  monthlyGoal?: MonthlyGoal | null;
  onSearchPress: () => void;
  onBookPress: (item: UserLibraryItem) => void;
  onViewDetail: (item: UserLibraryItem) => void;
  onWriteReview: (item: UserLibraryItem) => void;
  onShareStory: (item: UserLibraryItem) => void;
  onDeleteItems: (ids: string[]) => Promise<void>;
  onSaveMonthlyGoal: (target: number) => Promise<MonthlyGoal>;
}

export function MyLibraryScreen({
  items,
  monthlyGoal,
  onSearchPress,
  onBookPress,
  onViewDetail,
  onWriteReview,
  onShareStory,
  onDeleteItems,
  onSaveMonthlyGoal,
}: MyLibraryScreenProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.ALL += 1;
        acc[item.status] += 1;
        return acc;
      },
      { ALL: 0, WISH: 0, READING: 0, COMPLETED: 0 } as Record<
        StatusFilter,
        number
      >
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "ALL") return items;
    return items.filter((item) => item.status === activeFilter);
  }, [items, activeFilter]);

  const enterSelectionMode = () => {
    setSelectedCardId(null);
    setSelectedIds(new Set());
    setIsSelectionMode(true);
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openGoalModal = () => {
    setGoalInput(monthlyGoal?.target ? String(monthlyGoal.target) : "");
    setIsGoalModalVisible(true);
  };

  const handleOpenMenu = () => {
    Alert.alert("내 서재", undefined, [
      { text: "삭제", style: "destructive", onPress: () => enterSelectionMode() },
      { text: "목표 설정", onPress: openGoalModal },
      { text: "취소", style: "cancel" },
    ]);
  };

  const handleConfirmDelete = () => {
    if (selectedIds.size === 0 || isDeleting) return;
    const count = selectedIds.size;
    Alert.alert("선택한 책 삭제", `${count}권을 내 서재에서 삭제할까요? 진도 기록도 함께 삭제돼요.`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            await onDeleteItems(Array.from(selectedIds));
            exitSelectionMode();
          } catch (err) {
            Alert.alert("삭제 실패", err instanceof Error ? err.message : "잠시 후 다시 시도해주세요");
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const handleSaveGoal = async () => {
    const target = parseInt(goalInput, 10);
    if (!Number.isFinite(target) || target < 1) {
      Alert.alert("목표 설정", "1권 이상의 숫자를 입력해주세요");
      return;
    }
    setIsSavingGoal(true);
    try {
      await onSaveMonthlyGoal(target);
      setIsGoalModalVisible(false);
    } catch (err) {
      Alert.alert("저장 실패", err instanceof Error ? err.message : "잠시 후 다시 시도해주세요");
    } finally {
      setIsSavingGoal(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <TouchableOpacity onPress={exitSelectionMode} hitSlop={8}>
              <Text style={styles.headerActionText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedIds.size}개 선택</Text>
            <TouchableOpacity
              onPress={handleConfirmDelete}
              disabled={selectedIds.size === 0 || isDeleting}
              hitSlop={8}
            >
              {isDeleting ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text
                  style={[
                    styles.headerActionText,
                    styles.headerDeleteText,
                    selectedIds.size === 0 && styles.headerActionTextDisabled,
                  ]}
                >
                  삭제
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>내 서재</Text>
            <TouchableOpacity
              onPress={onSearchPress}
              style={styles.searchButton}
              accessibilityRole="button"
              accessibilityLabel="책 검색"
            >
              <Text style={styles.searchButtonIcon}>🔍</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={
          <View>
            <SummaryBanner
              completedCount={counts.COMPLETED}
              monthlyGoal={monthlyGoal}
              onOpenMenu={handleOpenMenu}
            />
            <View style={styles.filterRow}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key)}
                  style={[
                    styles.filterChip,
                    activeFilter === filter.key && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === filter.key &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label} ({counts[filter.key]})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <BookGridCard
            item={item}
            isOverlayOpen={selectedCardId === item.id}
            isSelectionMode={isSelectionMode}
            isChecked={selectedIds.has(item.id)}
            onPress={() => {
              if (isSelectionMode) {
                toggleSelected(item.id);
              } else if (item.status === "COMPLETED") {
                setSelectedCardId((current) => (current === item.id ? null : item.id));
              } else if (item.status === "WISH") {
                onViewDetail(item);
              } else {
                onBookPress(item);
              }
            }}
            onWriteReview={() => {
              setSelectedCardId(null);
              onWriteReview(item);
            }}
            onShareStory={() => {
              setSelectedCardId(null);
              onShareStory(item);
            }}
          />
        )}
        ListEmptyComponent={<EmptyLibraryState onSearchPress={onSearchPress} />}
      />

      <Modal
        visible={isGoalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsGoalModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>이달의 목표</Text>
            <Text style={styles.modalSubtitle}>이번 달에 완독하고 싶은 책 권수를 입력해주세요</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="예: 3"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsGoalModalVisible(false)}
                disabled={isSavingGoal}
              >
                <Text style={styles.modalCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveGoal}
                disabled={isSavingGoal}
              >
                {isSavingGoal ? (
                  <ActivityIndicator color={COLORS.beigeLight} />
                ) : (
                  <Text style={styles.modalSaveButtonText}>저장</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryBanner({
  completedCount,
  monthlyGoal,
  onOpenMenu,
}: {
  completedCount: number;
  monthlyGoal?: MonthlyGoal | null;
  onOpenMenu: () => void;
}) {
  const target = monthlyGoal?.target ?? null;
  const progress = target ? Math.min(monthlyGoal!.completed / target, 1) : 0;

  return (
    <View style={styles.banner}>
      <View style={styles.bannerContent}>
        <View>
          <Text style={styles.bannerCount}>{completedCount}</Text>
          <Text style={styles.bannerCountLabel}>완독한 책</Text>
        </View>
        {monthlyGoal ? (
          <>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerGoal}>
              <Text style={styles.bannerGoalLabel}>이달의 목표</Text>
              {target ? (
                <>
                  <View style={styles.bannerGoalTrack}>
                    <View
                      style={[
                        styles.bannerGoalFill,
                        { width: `${progress * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.bannerGoalText}>
                    {monthlyGoal.completed} / {target}권 완독
                  </Text>
                </>
              ) : (
                <Text style={styles.bannerGoalText}>
                  우측 메뉴에서 목표를 설정해보세요
                </Text>
              )}
            </View>
          </>
        ) : null}
      </View>
      <TouchableOpacity style={styles.bannerMenuButton} onPress={onOpenMenu} hitSlop={8}>
        <View style={styles.hamburgerIcon}>
          <View style={styles.hamburgerBar} />
          <View style={styles.hamburgerBar} />
          <View style={styles.hamburgerBar} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

function BookGridCard({
  item,
  isOverlayOpen,
  isSelectionMode,
  isChecked,
  onPress,
  onWriteReview,
  onShareStory,
}: {
  item: UserLibraryItem;
  isOverlayOpen: boolean;
  isSelectionMode: boolean;
  isChecked: boolean;
  onPress: () => void;
  onWriteReview: () => void;
  onShareStory: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View
        style={[
          styles.cover,
          isSelectionMode && isChecked && styles.coverChecked,
        ]}
      >
        {item.book.coverUrl ? (
          <Image
            source={{ uri: item.book.coverUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.coverTitle} numberOfLines={2}>
            {item.book.title}
          </Text>
        )}
        {isOverlayOpen && item.status === "COMPLETED" ? (
          <View style={styles.coverDimOverlay}>
            <TouchableOpacity style={styles.writeReviewButton} onPress={onWriteReview}>
              <Text style={styles.writeReviewButtonText}>감상 남기기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.writeReviewButton} onPress={onShareStory}>
              <Text style={styles.writeReviewButtonText}>스토리 공유</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      {isSelectionMode ? (
        <View style={[styles.statusBadge, styles.checkBadge, isChecked && styles.checkBadgeChecked]}>
          {isChecked ? <Text style={styles.statusBadgeText}>✓</Text> : null}
        </View>
      ) : (
        <View style={[styles.statusBadge, { backgroundColor: STATUS_BADGES[item.status].background }]}>
          <Text style={styles.statusBadgeText}>{STATUS_BADGES[item.status].icon}</Text>
        </View>
      )}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.book.title}
      </Text>
    </TouchableOpacity>
  );
}

function EmptyLibraryState({ onSearchPress }: { onSearchPress: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>아직 등록한 책이 없어요</Text>
      <Text style={styles.emptyStateSubtitle}>
        책을 검색해서 내 서재에 추가해보세요
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={onSearchPress}
      >
        <Text style={styles.emptyStateButtonText}>책 검색하러 가기</Text>
      </TouchableOpacity>
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  searchButton: {
    padding: 6,
    borderRadius: 999,
  },
  searchButtonIcon: {
    fontSize: 18,
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.deepGreen,
  },
  headerDeleteText: {
    color: "#EF4444",
  },
  headerActionTextDisabled: {
    color: COLORS.textMuted,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  gridRow: {
    justifyContent: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.deepGreen,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  bannerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  bannerCount: {
    fontSize: 32,
    fontWeight: "600",
    color: COLORS.beigeLight,
  },
  bannerCountLabel: {
    fontSize: 10,
    color: "rgba(253, 251, 244, 0.6)",
    marginTop: 2,
  },
  bannerDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  bannerGoal: {
    flex: 1,
  },
  bannerGoalLabel: {
    fontSize: 10,
    color: "rgba(253, 251, 244, 0.6)",
    marginBottom: 6,
  },
  bannerGoalTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 4,
    overflow: "hidden",
  },
  bannerGoalFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.beigeLight,
  },
  bannerGoalText: {
    fontSize: 10,
    color: "rgba(253, 251, 244, 0.7)",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.beigeDark,
  },
  filterChipActive: {
    backgroundColor: COLORS.deepGreen,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSubtle,
  },
  filterChipTextActive: {
    color: COLORS.beigeLight,
  },
  card: {
    flexBasis: "31%",
    minWidth: 90,
    maxWidth: 140,
  },
  cover: {
    aspectRatio: 2 / 3,
    borderRadius: 12,
    backgroundColor: "rgba(45, 74, 62, 0.18)",
    justifyContent: "flex-end",
    padding: 8,
    overflow: "hidden",
  },
  coverChecked: {
    borderWidth: 2,
    borderColor: COLORS.deepGreen,
  },
  coverTitle: {
    fontSize: 8,
    fontWeight: "500",
    color: "rgba(28, 26, 22, 0.5)",
  },
  statusBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    color: COLORS.beigeLight,
    fontWeight: "700",
  },
  checkBadge: {
    backgroundColor: COLORS.beigeLight,
    borderWidth: 1.5,
    borderColor: "#DDD7CB",
  },
  checkBadgeChecked: {
    backgroundColor: COLORS.deepGreen,
    borderColor: COLORS.deepGreen,
  },
  bannerMenuButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  hamburgerIcon: {
    width: 16,
    height: 12,
    justifyContent: "space-between",
  },
  hamburgerBar: {
    width: "100%",
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.beigeLight,
  },
  coverDimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  writeReviewButton: {
    backgroundColor: COLORS.beigeLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  writeReviewButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.deepGreen,
    textAlign: "center",
  },
  cardTitle: {
    fontSize: 11,
    color: COLORS.textPrimary,
    marginTop: 6,
    lineHeight: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
    textAlign: "center",
  },
  emptyStateButton: {
    backgroundColor: COLORS.deepGreen,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyStateButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.beigeLight,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    backgroundColor: COLORS.beigeLight,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: COLORS.beigeDark,
    borderRadius: 12,
    paddingVertical: 12,
    textAlign: "center",
    fontSize: 20,
    color: COLORS.textPrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD7CB",
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSubtle,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.deepGreen,
    alignItems: "center",
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.beigeLight,
  },
});
