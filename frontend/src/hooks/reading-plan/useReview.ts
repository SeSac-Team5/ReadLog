import { useCallback, useEffect, useState } from "react";

import { deleteReview, fetchReview, saveReview } from "../../api/reading-plan/reviews";
import type { ReviewEntry } from "../../types/reading-plan/review";

export function useReview(bookId: string) {
  const [review, setReview] = useState<ReviewEntry | null>(null);
  // Starts true (not false) because a fetch always kicks off on mount — this closes a
  // race where the screen's "seed the editor once loading finishes" effect would run
  // on the very first render (isLoading still false, review still null) and lock in
  // an empty draft before the real saved review ever arrived.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchReview(bookId);
      setReview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "한줄평을 불러오지 못했어요");
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = useCallback(
    async (text: string, rating?: number) => {
      const result = await saveReview(bookId, { review: text, rating });
      setReview(result);
      return result;
    },
    [bookId]
  );

  const remove = useCallback(async () => {
    await deleteReview(bookId);
    setReview(null);
  }, [bookId]);

  return { review, isLoading, error, save, remove };
}
