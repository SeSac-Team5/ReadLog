export type MemberRole = 'OWNER' | 'MANAGER' | 'MEMBER';

export interface ReadingGroup {
  id: number;
  owner_id: number;
  book_id: number | null;
  name: string;
  description: string | null;
  max_member: number;
  invite_code: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  member_count: number;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: MemberRole;
  joined_at: string;
  nickname: string | null;
  profile_image: string | null;
}

export interface GroupInvite {
  id: number;
  group_id: number;
  invite_code: string;
  expires_at: string;
  used: boolean;
}

export interface ChapterGoal {
  id: number;
  group_id: number;
  chapter_name: string;
  target_date: string;
}

export interface ReadingProgress {
  id: number;
  group_id: number;
  user_id: number;
  chapter: string | null;
  page: number | null;
  progress: number | null;
  bookmark_title: string | null;
  memo: string | null;
  created_at: string;
  nickname: string | null;
}

export interface GroupComment {
  id: number;
  group_id: number;
  user_id: number;
  progress_id: number | null;
  parent_comment_id: number | null;
  content: string;
  quote: string | null;
  is_spoiler: boolean;
  created_at: string;
  nickname: string | null;
  reactions: CommentReaction[];
}

export interface CommentReaction {
  id: number;
  comment_id: number;
  user_id: number;
  emoji: string;
}

// ── Request payloads ──────────────────────────────────────────────────────

export interface CreateGroupPayload {
  book_id?: number;
  name: string;
  description?: string;
  max_member: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  max_member?: number;
  start_date?: string;
  end_date?: string;
}

export interface ProgressPayload {
  chapter?: string;
  page?: number;
  progress?: number;
  bookmark_title?: string;
  memo?: string;
}

export interface CommentPayload {
  progress_id?: number;
  parent_comment_id?: number;
  content: string;
  quote?: string;
  is_spoiler: boolean;
}
