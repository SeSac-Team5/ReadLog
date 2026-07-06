import { create } from 'zustand';
import type { GroupComment, GroupMember, ReadingGroup, ReadingProgress } from '../../types/reading-group';
import * as api from '../../api/reading-group';

interface GroupState {
  groups: ReadingGroup[];
  currentGroup: ReadingGroup | null;
  members: GroupMember[];
  progressList: ReadingProgress[];
  comments: GroupComment[];
  loading: boolean;
  error: string | null;

  fetchMyGroups: () => Promise<void>;
  fetchGroup: (groupId: number) => Promise<void>;
  fetchMembers: (groupId: number) => Promise<void>;
  fetchProgress: (groupId: number) => Promise<void>;
  fetchComments: (groupId: number) => Promise<void>;
  shareProgress: (groupId: number, data: Parameters<typeof api.shareProgress>[1]) => Promise<void>;
  updateProgress: (groupId: number, progressId: number, data: Parameters<typeof api.updateProgress>[2]) => Promise<void>;
  deleteProgress: (groupId: number, progressId: number) => Promise<void>;
  dismissProgressNotice: (groupId: number, progressId: number) => Promise<void>;
  createComment: (groupId: number, data: Parameters<typeof api.createComment>[1]) => Promise<void>;
  toggleReaction: (groupId: number, commentId: number, emoji: string) => Promise<void>;
  kickMember: (groupId: number, userId: number) => Promise<void>;
  delegateOwnership: (groupId: number, userId: number) => Promise<void>;
  leaveGroup: (groupId: number) => Promise<void>;
  clearCurrent: () => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  members: [],
  progressList: [],
  comments: [],
  loading: false,
  error: null,

  fetchMyGroups: async () => {
    set({ loading: true, error: null });
    try {
      const groups = await api.fetchMyGroups();
      set({ groups, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchGroup: async (groupId) => {
    set({ loading: true, error: null });
    try {
      const currentGroup = await api.fetchGroup(groupId);
      set({ currentGroup, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchMembers: async (groupId) => {
    const members = await api.fetchMembers(groupId);
    set({ members });
  },

  fetchProgress: async (groupId) => {
    const progressList = await api.fetchGroupProgress(groupId);
    set({ progressList });
  },

  fetchComments: async (groupId) => {
    const comments = await api.fetchComments(groupId);
    set({ comments });
  },

  shareProgress: async (groupId, data) => {
    const record = await api.shareProgress(groupId, data);
    set(s => ({ progressList: [record, ...s.progressList] }));
  },

  updateProgress: async (groupId, progressId, data) => {
    const updated = await api.updateProgress(groupId, progressId, data);
    set(s => ({ progressList: s.progressList.map(p => p.id === progressId ? updated : p) }));
  },

  deleteProgress: async (groupId, progressId) => {
    await api.deleteProgress(groupId, progressId);
    set(s => ({ progressList: s.progressList.filter(p => p.id !== progressId) }));
  },

  dismissProgressNotice: async (groupId, progressId) => {
    await api.dismissProgressNotice(groupId, progressId);
    set(s => ({ progressList: s.progressList.filter(p => p.id !== progressId) }));
  },

  createComment: async (groupId, data) => {
    const comment = await api.createComment(groupId, data);
    set(s => ({ comments: [...s.comments, comment] }));
  },

  toggleReaction: async (groupId, commentId, emoji) => {
    const result = await api.toggleReaction(groupId, commentId, emoji);
    // 낙관적 업데이트: 실패 시 서버 재동기화
    await get().fetchComments(groupId);
  },

  kickMember: async (groupId, userId) => {
    await api.kickMember(groupId, userId);
    set(s => ({ members: s.members.filter(m => m.user_id !== userId) }));
  },

  delegateOwnership: async (groupId, userId) => {
    await api.delegateOwnership(groupId, userId);
    await get().fetchMembers(groupId);
  },

  leaveGroup: async (groupId) => {
    await api.leaveGroup(groupId);
    set(s => ({
      groups: s.groups.filter(g => g.id !== groupId),
      currentGroup: null,
      members: [],
    }));
  },

  clearCurrent: () =>
    set({ currentGroup: null, members: [], progressList: [], comments: [] }),
}));
