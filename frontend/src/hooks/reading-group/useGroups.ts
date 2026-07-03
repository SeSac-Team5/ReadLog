import { useEffect } from 'react';
import { useGroupStore } from '../../store/reading-group/groupStore';

export function useMyGroups() {
  const { groups, loading, error, fetchMyGroups } = useGroupStore();

  useEffect(() => {
    fetchMyGroups();
  }, []);

  return { groups, loading, error, refresh: fetchMyGroups };
}

export function useGroupDetail(groupId: number) {
  const { currentGroup, members, loading, error, fetchGroup, fetchMembers, clearCurrent } =
    useGroupStore();

  useEffect(() => {
    fetchGroup(groupId);
    fetchMembers(groupId);
    return () => clearCurrent();
  }, [groupId]);

  return { group: currentGroup, members, loading, error };
}

export function useGroupProgress(groupId: number) {
  const { progressList, fetchProgress, shareProgress } = useGroupStore();

  useEffect(() => {
    fetchProgress(groupId);
  }, [groupId]);

  return { progressList, share: (data: Parameters<typeof shareProgress>[1]) => shareProgress(groupId, data) };
}

export function useGroupComments(groupId: number) {
  const { comments, fetchComments, createComment, toggleReaction } = useGroupStore();

  useEffect(() => {
    fetchComments(groupId);
  }, [groupId]);

  return {
    comments,
    post: (data: Parameters<typeof createComment>[1]) => createComment(groupId, data),
    react: (commentId: number, emoji: string) => toggleReaction(groupId, commentId, emoji),
  };
}
