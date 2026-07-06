import { useCallback, useEffect, useState } from "react";

import { fetchLibraryComments } from "../../api/reading-plan/progress";
import type { LibraryComment } from "../../types/reading-plan/book";

export function useLibraryComments() {
  const [comments, setComments] = useState<LibraryComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchLibraryComments();
      setComments(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "코멘트를 불러오지 못했어요");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { comments, isLoading, error, refetch };
}
