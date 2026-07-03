import type { Sticker, SnsPost } from "../../types/reading-plan/sns";
import { requestJson } from "./httpClient";

interface CreatePostInput {
  bookId?: string;
  imageUrl: string;
  content?: string;
}

export async function createSnsPost(input: CreatePostInput): Promise<SnsPost> {
  return requestJson<SnsPost>("/sns-posts", { method: "POST", body: input });
}

export async function addStickers(
  postId: string,
  stickers: Omit<Sticker, "id">[]
): Promise<SnsPost> {
  return requestJson<SnsPost>(`/sns-posts/${postId}/stickers`, {
    method: "POST",
    body: { stickers },
  });
}
