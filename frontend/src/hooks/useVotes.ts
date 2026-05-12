import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voteService } from '@/services/vote.service';

export function usePostVote(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: 1 | -1) => voteService.castPostVote(postId, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
}

export function useCommentVote(commentId: string, postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: 1 | -1) => voteService.castCommentVote(commentId, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', postId] }),
  });
}
