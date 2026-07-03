export interface ReviewEntry {
  id: string;
  bookId: string;
  rating: number | null;
  review: string;
  createdAt: string;
  updatedAt: string;
}
