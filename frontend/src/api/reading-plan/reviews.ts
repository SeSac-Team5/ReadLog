import type { ReviewEntry } from "../../types/reading-plan/review";
import { requestJson } from "./httpClient";

interface ReviewGetResponse {
  review: ReviewEntry | null;
}

export async function fetchReview(bookId: string): Promise<ReviewEntry | null> {
  const response = await requestJson<ReviewGetResponse>(`/reviews/${bookId}`);
  return response.review;
}

export async function saveReview(
  bookId: string,
  input: { review: string; rating?: number }
): Promise<ReviewEntry> {
  return requestJson<ReviewEntry>(`/reviews/${bookId}`, { method: "PUT", body: input });
}

export async function deleteReview(bookId: string): Promise<void> {
  await requestJson<void>(`/reviews/${bookId}`, { method: "DELETE" });
}
