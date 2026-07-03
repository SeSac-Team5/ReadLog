import type { BookSearchResult } from "../../types/reading-plan/book";
import { requestJson } from "./httpClient";

interface BookSearchResponse {
  items: BookSearchResult[];
  totalCount: number;
}

export async function searchBooks(
  query: string,
  page: number = 1
): Promise<BookSearchResponse> {
  const params = new URLSearchParams({ query, page: String(page) });
  return requestJson<BookSearchResponse>(`/books/search?${params.toString()}`);
}
