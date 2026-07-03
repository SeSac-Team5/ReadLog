export type LoginUser = {
  id: number;
  nickname: string;
  profile_image: string | null;
};

export type MeResponse = {
  id: number;
  login_id: string;
  nickname: string;
  profile_image: string | null;
  introduction: string | null;
  role: string;
  created_at: string;
};

export type ApiError = {
  detail: string;
};

export const GENRE_CHOICES = [
  '소설', '시/에세이', '인문학', '자기계발', '경제/경영',
  '과학', '역사', '예술', '여행', '건강', '기타',
] as const;

export type Genre = (typeof GENRE_CHOICES)[number];
