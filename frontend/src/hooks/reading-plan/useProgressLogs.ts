import { useCallback, useEffect, useState } from "react";

import { fetchProgressLogs } from "../../api/reading-plan/progress";
import type { ProgressLogEntry } from "../../types/reading-plan/book";

export function useProgressLogs(libraryId: string) {
  const [logs, setLogs] = useState<ProgressLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchProgressLogs(libraryId);
      setLogs(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "진도 기록을 불러오지 못했어요");
    } finally {
      setIsLoading(false);
    }
  }, [libraryId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { logs, isLoading, error, refetch };
}
