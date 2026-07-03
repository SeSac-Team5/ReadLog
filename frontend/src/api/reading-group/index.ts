import client from '../client';
import type {
  ChapterGoal,
  CommentPayload,
  CreateGroupPayload,
  GroupComment,
  GroupInvite,
  GroupMember,
  ReadingGroup,
  ReadingProgress,
  ProgressPayload,
  UpdateGroupPayload,
} from '../../types/reading-group';

const BASE = '/groups';

// ── Groups ────────────────────────────────────────────────────────────────

export const fetchMyGroups = (): Promise<ReadingGroup[]> =>
  client.get(BASE).then(r => r.data);

export const fetchGroup = (groupId: number): Promise<ReadingGroup> =>
  client.get(`${BASE}/${groupId}`).then(r => r.data);

export const createGroup = (data: CreateGroupPayload): Promise<ReadingGroup> =>
  client.post(BASE, data).then(r => r.data);

export const updateGroup = (groupId: number, data: UpdateGroupPayload): Promise<ReadingGroup> =>
  client.patch(`${BASE}/${groupId}/settings`, data).then(r => r.data);

export const deleteGroup = (groupId: number): Promise<void> =>
  client.delete(`${BASE}/${groupId}`);

// ── Members ───────────────────────────────────────────────────────────────

export const fetchMembers = (groupId: number): Promise<GroupMember[]> =>
  client.get(`${BASE}/${groupId}/members`).then(r => r.data);

export const kickMember = (groupId: number, userId: number): Promise<void> =>
  client.delete(`${BASE}/${groupId}/members/${userId}`);

export const delegateOwnership = (groupId: number, userId: number): Promise<void> =>
  client.post(`${BASE}/${groupId}/members/${userId}/delegate`);

export const leaveGroup = (groupId: number): Promise<void> =>
  client.delete(`${BASE}/${groupId}/members/me`);

// ── Invites ───────────────────────────────────────────────────────────────

export const createTempInvite = (groupId: number, expiresHours = 72): Promise<GroupInvite> =>
  client.post(`${BASE}/${groupId}/invite`, { expires_hours: expiresHours }).then(r => r.data);

export const joinGroup = (groupId: number, code: string): Promise<GroupMember> =>
  client.post(`${BASE}/${groupId}/join`, { code }).then(r => r.data);

// ── Chapter Goals ─────────────────────────────────────────────────────────

export const fetchChapterGoals = (groupId: number): Promise<ChapterGoal[]> =>
  client.get(`${BASE}/${groupId}/chapter-goals`).then(r => r.data);

export const addChapterGoal = (groupId: number, chapterName: string, targetDate: string): Promise<ChapterGoal> =>
  client.post(`${BASE}/${groupId}/chapter-goals`, { chapter_name: chapterName, target_date: targetDate }).then(r => r.data);

// ── Progress ──────────────────────────────────────────────────────────────

export const fetchGroupProgress = (groupId: number): Promise<ReadingProgress[]> =>
  client.get(`${BASE}/${groupId}/progress`).then(r => r.data);

export const shareProgress = (groupId: number, data: ProgressPayload): Promise<ReadingProgress> =>
  client.post(`${BASE}/${groupId}/progress`, data).then(r => r.data);

// ── Comments ──────────────────────────────────────────────────────────────

export const fetchComments = (groupId: number): Promise<GroupComment[]> =>
  client.get(`${BASE}/${groupId}/comments`).then(r => r.data);

export const createComment = (groupId: number, data: CommentPayload): Promise<GroupComment> =>
  client.post(`${BASE}/${groupId}/comments`, data).then(r => r.data);

export const deleteComment = (groupId: number, commentId: number): Promise<void> =>
  client.delete(`${BASE}/${groupId}/comments/${commentId}`);

export const toggleReaction = (groupId: number, commentId: number, emoji: string): Promise<{ action: 'added' | 'removed'; emoji: string }> =>
  client.post(`${BASE}/${groupId}/comments/${commentId}/reactions`, { emoji }).then(r => r.data);
