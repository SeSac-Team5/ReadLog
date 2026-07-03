import type {
  BookSearchResult,
  LibraryStatus,
  MonthlyGoal,
  UserLibraryItem,
} from "../../types/reading-plan/book";
import { requestJson } from "./httpClient";

interface LibraryListResponse {
  items: UserLibraryItem[];
}

export async function fetchLibrary(): Promise<UserLibraryItem[]> {
  const response = await requestJson<LibraryListResponse>("/library");
  return response.items;
}

export async function addBookToLibrary(
  book: BookSearchResult,
  status: LibraryStatus
): Promise<UserLibraryItem> {
  return requestJson<UserLibraryItem>("/library", {
    method: "POST",
    body: { book, status },
  });
}

export async function deleteLibraryItem(id: string): Promise<void> {
  await requestJson<void>(`/library/${id}`, { method: "DELETE" });
}

export async function fetchMonthlyGoal(): Promise<MonthlyGoal> {
  return requestJson<MonthlyGoal>("/goals/current");
}

export async function updateMonthlyGoal(target: number): Promise<MonthlyGoal> {
  return requestJson<MonthlyGoal>("/goals/current", {
    method: "PUT",
    body: { target },
  });
}
