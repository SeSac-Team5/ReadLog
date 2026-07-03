// TEMPORARY dev-only entry point for on-device smoke testing.
// Delete/replace once the real navigation stack (App.tsx + react-navigation) lands.
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { BookDetailScreen } from "./src/screens/reading-plan/BookDetailScreen";
import { BookSearchScreen } from "./src/screens/reading-plan/BookSearchScreen";
import { MyLibraryScreenContainer } from "./src/screens/reading-plan/MyLibraryScreenContainer";
import { OneLineReviewScreen } from "./src/screens/reading-plan/OneLineReviewScreen";
import { ReadingProgressScreen } from "./src/screens/reading-plan/ReadingProgressScreen";
import { SNSShareScreen } from "./src/screens/reading-plan/SNSShareScreen";
import { LibraryProvider, useLibrary } from "./src/store/reading-plan/libraryStore";
import type { Book, BookSearchResult } from "./src/types/reading-plan/book";

function toSearchResult(book: Book): BookSearchResult {
  return {
    isbn13: book.isbn13,
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    coverUrl: book.coverUrl ?? null,
    pageCount: book.pageCount ?? null,
    publishedDate: book.publishedDate ?? null,
    description: book.description ?? null,
  };
}

const SAMPLE_BOOK: BookSearchResult = {
  isbn13: "9788936434120",
  title: "채식주의자",
  author: "한강",
  publisher: "창비",
  coverUrl: null,
  pageCount: 247,
  publishedDate: "2007-10-30",
  description: "테스트용 샘플 도서",
};

type DevScreen = "library" | "search" | "detail" | "progress" | "review" | "sns";

const DEV_TABS: DevScreen[] = ["library", "search", "progress", "review", "sns"];

function NeedsLibrarySelection({ onGoToLibrary }: { onGoToLibrary: () => void }) {
  return (
    <View style={styles.needsSelection}>
      <Text style={styles.needsSelectionText}>
        먼저 "내 서재"에서 책을 하나 선택해주세요 (검색 → 서재 추가 → 서재에서 탭)
      </Text>
      <TouchableOpacity style={styles.needsSelectionButton} onPress={onGoToLibrary}>
        <Text style={styles.needsSelectionButtonText}>내 서재로 이동</Text>
      </TouchableOpacity>
    </View>
  );
}

function DevScreenSwitcher() {
  const { items } = useLibrary();
  const [screen, setScreen] = useState<DevScreen>("library");
  const [selectedBook, setSelectedBook] = useState<BookSearchResult>(SAMPLE_BOOK);
  const [selectedLibraryItemId, setSelectedLibraryItemId] = useState<string | null>(null);
  const [detailReturnScreen, setDetailReturnScreen] = useState<DevScreen>("search");

  // Look this up live from the store (instead of holding a frozen copy) so that
  // switching tabs and coming back always reflects the latest saved progress/status.
  const selectedLibraryItem = selectedLibraryItemId
    ? items.find((item) => item.id === selectedLibraryItemId) ?? null
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.screenArea}>
        {screen === "library" && (
          <MyLibraryScreenContainer
            onSearchPress={() => setScreen("search")}
            onBookPress={(item) => {
              setSelectedLibraryItemId(item.id);
              setScreen("progress");
            }}
            onWriteReview={(item) => {
              setSelectedLibraryItemId(item.id);
              setScreen("review");
            }}
            onShareStory={(item) => {
              setSelectedLibraryItemId(item.id);
              setScreen("sns");
            }}
            onViewDetail={(item) => {
              setSelectedBook(toSearchResult(item.book));
              setDetailReturnScreen("library");
              setScreen("detail");
            }}
          />
        )}
        {screen === "search" && (
          <BookSearchScreen
            onBookPress={(book) => {
              setSelectedBook(book);
              setDetailReturnScreen("search");
              setScreen("detail");
            }}
          />
        )}
        {screen === "detail" && (
          <BookDetailScreen
            book={selectedBook}
            onBack={() => setScreen(detailReturnScreen)}
            onAdded={() => setScreen("library")}
          />
        )}
        {screen === "progress" &&
          (selectedLibraryItem ? (
            <ReadingProgressScreen
              libraryItem={selectedLibraryItem}
              onBack={() => setScreen("library")}
              onSharePress={() => setScreen("sns")}
            />
          ) : (
            <NeedsLibrarySelection onGoToLibrary={() => setScreen("library")} />
          ))}
        {screen === "review" &&
          (selectedLibraryItem ? (
            <OneLineReviewScreen
              libraryItem={selectedLibraryItem}
              onBack={() => setScreen("library")}
            />
          ) : (
            <NeedsLibrarySelection onGoToLibrary={() => setScreen("library")} />
          ))}
        {screen === "sns" &&
          (selectedLibraryItem ? (
            <SNSShareScreen libraryItem={selectedLibraryItem} onBack={() => setScreen("library")} />
          ) : (
            <NeedsLibrarySelection onGoToLibrary={() => setScreen("library")} />
          ))}
      </View>
      <SafeAreaView style={styles.devBar} edges={["bottom"]}>
        {DEV_TABS.map((tab) => (
          <TouchableOpacity key={tab} style={styles.devButton} onPress={() => setScreen(tab)}>
            <Text style={[styles.devButtonText, screen === tab && styles.devButtonTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LibraryProvider>
        <DevScreenSwitcher />
      </LibraryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenArea: {
    flex: 1,
  },
  devBar: {
    flexDirection: "row",
    backgroundColor: "#1C1A16",
  },
  devButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  devButtonText: {
    color: "rgba(253, 251, 244, 0.5)",
    fontSize: 11,
  },
  devButtonTextActive: {
    color: "#FDFBF4",
    fontWeight: "600",
  },
  needsSelection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: "#FDFBF4",
  },
  needsSelectionText: {
    fontSize: 13,
    color: "#7A7060",
    textAlign: "center",
  },
  needsSelectionButton: {
    backgroundColor: "#2D4A3E",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  needsSelectionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FDFBF4",
  },
});
