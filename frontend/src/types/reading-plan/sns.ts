export type StickerType =
  | "emoji"
  | "comment"
  | "book_cover"
  | "progress_ring"
  | "progress_bar"
  | "progress_badge";

export type CommentStickerBackground = "white" | "gray" | "transparent" | "dark";

export interface Sticker {
  id: string;
  type: StickerType;
  emoji?: string | null;
  content?: string | null;
  backgroundColor?: CommentStickerBackground | null;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  visible: boolean;
}

export interface SnsPost {
  id: string;
  bookId: string | null;
  imageUrl: string | null;
  content: string | null;
  createdAt: string;
  stickers: Sticker[];
}
