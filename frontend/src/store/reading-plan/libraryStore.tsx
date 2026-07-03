import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";

import {
  addBookToLibrary,
  deleteLibraryItem,
  fetchLibrary,
  fetchMonthlyGoal,
  updateMonthlyGoal,
} from "../../api/reading-plan/library";
import { addProgressLog } from "../../api/reading-plan/progress";
import type {
  BookSearchResult,
  LibraryStatus,
  MonthlyGoal,
  ProgressLogEntry,
  UserLibraryItem,
} from "../../types/reading-plan/book";

interface LibraryState {
  items: UserLibraryItem[];
  isLoading: boolean;
  error: string | null;
  monthlyGoal: MonthlyGoal | null;
}

type LibraryAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; items: UserLibraryItem[] }
  | { type: "LOAD_ERROR"; message: string }
  | { type: "UPSERT_ITEM"; item: UserLibraryItem }
  | { type: "REMOVE_ITEMS"; ids: string[] }
  | { type: "GOAL_LOADED"; goal: MonthlyGoal };

function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, isLoading: true, error: null };
    case "LOAD_SUCCESS":
      return { ...state, isLoading: false, items: action.items };
    case "LOAD_ERROR":
      return { ...state, isLoading: false, error: action.message };
    case "UPSERT_ITEM": {
      const exists = state.items.some((item) => item.id === action.item.id);
      const items = exists
        ? state.items.map((item) => (item.id === action.item.id ? action.item : item))
        : [action.item, ...state.items];
      return { ...state, items };
    }
    case "REMOVE_ITEMS": {
      const idSet = new Set(action.ids);
      return { ...state, items: state.items.filter((item) => !idSet.has(item.id)) };
    }
    case "GOAL_LOADED":
      return { ...state, monthlyGoal: action.goal };
    default:
      return state;
  }
}

interface LibraryContextValue extends LibraryState {
  loadLibrary: () => Promise<void>;
  addToLibrary: (book: BookSearchResult, status: LibraryStatus) => Promise<UserLibraryItem>;
  recordProgress: (
    libraryId: string,
    input: { page?: number; percent?: number; memo?: string }
  ) => Promise<ProgressLogEntry>;
  removeFromLibrary: (ids: string[]) => Promise<void>;
  loadMonthlyGoal: () => Promise<void>;
  saveMonthlyGoal: (target: number) => Promise<MonthlyGoal>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(libraryReducer, {
    items: [],
    isLoading: false,
    error: null,
    monthlyGoal: null,
  });

  const loadLibrary = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const items = await fetchLibrary();
      dispatch({ type: "LOAD_SUCCESS", items });
    } catch (error) {
      dispatch({
        type: "LOAD_ERROR",
        message: error instanceof Error ? error.message : "내 서재를 불러오지 못했어요",
      });
    }
  }, []);

  const addToLibrary = useCallback(
    async (book: BookSearchResult, status: LibraryStatus) => {
      const item = await addBookToLibrary(book, status);
      dispatch({ type: "UPSERT_ITEM", item });
      return item;
    },
    []
  );

  const recordProgress = useCallback(
    async (libraryId: string, input: { page?: number; percent?: number; memo?: string }) => {
      const { log, library } = await addProgressLog(libraryId, input);
      dispatch({ type: "UPSERT_ITEM", item: library });
      return log;
    },
    []
  );

  const removeFromLibrary = useCallback(async (ids: string[]) => {
    await Promise.all(ids.map((id) => deleteLibraryItem(id)));
    dispatch({ type: "REMOVE_ITEMS", ids });
    fetchMonthlyGoal()
      .then((goal) => dispatch({ type: "GOAL_LOADED", goal }))
      .catch(() => {
        // best-effort refresh; goal banner just keeps its last known value if this fails
      });
  }, []);

  const loadMonthlyGoal = useCallback(async () => {
    try {
      const goal = await fetchMonthlyGoal();
      dispatch({ type: "GOAL_LOADED", goal });
    } catch {
      // best-effort; goal banner just won't show if this fails
    }
  }, []);

  const saveMonthlyGoal = useCallback(async (target: number) => {
    const goal = await updateMonthlyGoal(target);
    dispatch({ type: "GOAL_LOADED", goal });
    return goal;
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      loadLibrary,
      addToLibrary,
      recordProgress,
      removeFromLibrary,
      loadMonthlyGoal,
      saveMonthlyGoal,
    }),
    [
      state,
      loadLibrary,
      addToLibrary,
      recordProgress,
      removeFromLibrary,
      loadMonthlyGoal,
      saveMonthlyGoal,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
