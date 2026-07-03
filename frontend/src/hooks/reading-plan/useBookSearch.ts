import { useCallback, useRef, useState } from "react";

import { searchBooks } from "../../api/reading-plan/books";
import type { BookSearchResult } from "../../types/reading-plan/book";

export function useBookSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The exact string the last completed search ran for — lets the screen tell
  // "haven't searched this text yet" apart from "searched it, found nothing".
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const search = useCallback(() => {
    const trimmed = query.trim();
    const requestId = ++requestIdRef.current;

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      setSearchedQuery(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    searchBooks(trimmed)
      .then((response) => {
        if (requestIdRef.current === requestId) {
          setResults(response.items);
          setIsLoading(false);
          setSearchedQuery(trimmed);
        }
      })
      .catch((err) => {
        if (requestIdRef.current === requestId) {
          setError(err instanceof Error ? err.message : "검색에 실패했어요");
          setIsLoading(false);
        }
      });
  }, [query]);

  const clear = useCallback(() => {
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setIsLoading(false);
    setError(null);
    setSearchedQuery(null);
  }, []);

  return { query, setQuery, results, isLoading, error, search, clear, searchedQuery };
}
