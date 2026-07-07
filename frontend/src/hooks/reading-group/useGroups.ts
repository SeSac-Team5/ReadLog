import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useGroupStore } from '../../store/reading-group/groupStore';
import { fetchGroupProgress } from '../../api/reading-group';

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
  const { progressList, fetchProgress, shareProgress, updateProgress, deleteProgress, dismissProgressNotice } = useGroupStore();

  useEffect(() => {
    fetchProgress(groupId);
  }, [groupId]);

  return {
    progressList,
    share: (data: Parameters<typeof shareProgress>[1]) => shareProgress(groupId, data),
    update: (progressId: number, data: Parameters<typeof updateProgress>[2]) => updateProgress(groupId, progressId, data),
    remove: (progressId: number) => deleteProgress(groupId, progressId),
    dismiss: (progressId: number) => dismissProgressNotice(groupId, progressId),
  };
}

// 여러 모임을 동시에 보여주는 화면(홈/마이페이지)에서 카드별로 쓰는 훅.
// useGroupProgress는 전역 스토어의 progressList 하나를 공유해서 여러 모임을
// 동시에 조회하면 서로 덮어써지므로, 카드 하나당 로컬 state로 독립 조회한다.
export function useMyLatestGroupProgress(groupId: number, userId: number | undefined) {
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGroupProgress(groupId)
      .then((list) => {
        if (cancelled) return;
        const mine = list
          .filter((p) => p.user_id === userId && p.progress !== null)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPercent(mine[0]?.progress ?? null);
      })
      .catch(() => {
        if (!cancelled) setPercent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, userId]);

  return percent;
}

export function useGroupComments(groupId: number) {
  const { comments, fetchComments, createComment, toggleReaction } = useGroupStore();

  // 다른 멤버가 그 사이 남긴 댓글이 보이도록 마운트뿐 아니라 화면 포커스마다 재조회.
  useFocusEffect(
    useCallback(() => {
      fetchComments(groupId);
    }, [groupId, fetchComments])
  );

  return {
    comments,
    post: (data: Parameters<typeof createComment>[1]) => createComment(groupId, data),
    react: (commentId: number, emoji: string) => toggleReaction(groupId, commentId, emoji),
  };
}
