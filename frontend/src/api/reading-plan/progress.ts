import type { LibraryComment, ProgressLogEntry, UserLibraryItem } from "../../types/reading-plan/book";
import { requestJson } from "./httpClient";

interface AddProgressInput {
  page?: number;
  percent?: number;
  memo?: string;
}

interface AddProgressResponse {
  log: ProgressLogEntry;
  library: UserLibraryItem;
}

interface ProgressLogListResponse {
  items: ProgressLogEntry[];
}

export async function addProgressLog(
  libraryId: string,
  input: AddProgressInput
): Promise<AddProgressResponse> {
  return requestJson<AddProgressResponse>(`/library/${libraryId}/progress`, {
    method: "POST",
    body: input,
  });
}

export async function fetchProgressLogs(libraryId: string): Promise<ProgressLogEntry[]> {
  const response = await requestJson<ProgressLogListResponse>(
    `/library/${libraryId}/progress-logs`
  );
  return response.items;
}

interface LibraryCommentListResponse {
  items: LibraryComment[];
}

export async function fetchLibraryComments(): Promise<LibraryComment[]> {
  const response = await requestJson<LibraryCommentListResponse>("/library/comments");
  return response.items;
}

interface ProgressActivityEntry {
  recordedAt: string;
}

interface ProgressActivityListResponse {
  items: ProgressActivityEntry[];
}

// 연속독서 계산용 — 진도 입력 시 코멘트를 남긴 날짜 목록(모든 서재 항목 통틀어서).
export async function fetchProgressActivity(): Promise<ProgressActivityEntry[]> {
  const response = await requestJson<ProgressActivityListResponse>("/library/progress-activity");
  return response.items;
}
