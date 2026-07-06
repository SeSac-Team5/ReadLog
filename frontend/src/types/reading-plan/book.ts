export type LibraryStatus = "WISH" | "READING" | "COMPLETED";

export interface Book {
  id: string;
  isbn13: string;
  title: string;
  author: string;
  publisher: string;
  coverUrl?: string | null;
  pageCount?: number | null;
  description?: string | null;
  publishedDate?: string | null;
}

export interface BookSearchResult {
  isbn13: string;
  title: string;
  author: string | null;
  publisher: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  publishedDate: string | null;
  description: string | null;
}

export interface UserLibraryItem {
  id: string;
  book: Book;
  status: LibraryStatus;
  currentPage: number;
  rating?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface MonthlyGoal {
  yearMonth: string;
  target: number | null;
  completed: number;
}

export interface ProgressLogEntry {
  id: string;
  libraryId: string;
  page: number | null;
  percent: number | null;
  memo: string | null;
  recordedAt: string;
}

export interface LibraryComment {
  id: string;
  libraryId: string;
  book: {
    id: string;
    title: string;
    coverUrl?: string | null;
  };
  memo: string;
  recordedAt: string;
}
