import React, { useEffect } from "react";

import { useLibrary } from "../../store/reading-plan/libraryStore";
import type { UserLibraryItem } from "../../types/reading-plan/book";
import { MyLibraryScreen } from "./MyLibraryScreen";

interface MyLibraryScreenContainerProps {
  onSearchPress: () => void;
  onBookPress: (item: UserLibraryItem) => void;
  onViewDetail: (item: UserLibraryItem) => void;
  onWriteReview: (item: UserLibraryItem) => void;
  onShareStory: (item: UserLibraryItem) => void;
}

export function MyLibraryScreenContainer({
  onSearchPress,
  onBookPress,
  onViewDetail,
  onWriteReview,
  onShareStory,
}: MyLibraryScreenContainerProps) {
  const { items, monthlyGoal, loadLibrary, loadMonthlyGoal, removeFromLibrary, saveMonthlyGoal } =
    useLibrary();

  useEffect(() => {
    loadLibrary();
    loadMonthlyGoal();
  }, [loadLibrary, loadMonthlyGoal]);

  return (
    <MyLibraryScreen
      items={items}
      monthlyGoal={monthlyGoal}
      onSearchPress={onSearchPress}
      onBookPress={onBookPress}
      onViewDetail={onViewDetail}
      onWriteReview={onWriteReview}
      onShareStory={onShareStory}
      onDeleteItems={removeFromLibrary}
      onSaveMonthlyGoal={saveMonthlyGoal}
    />
  );
}
