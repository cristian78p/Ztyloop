import { api } from './api';

export const voteService = {
  async castPostVote(postId: string, value: 1 | -1) {
    const { data } = await api.put<{
      success: true;
      data: { finalValue: number; upvotes: number; downvotes: number; score: number };
    }>(`/posts/${postId}/vote`, { value });
    return data.data;
  },

  async castCommentVote(postId: string, commentId: string, value: 1 | -1) {
    const { data } = await api.put<{
      success: true;
      data: { finalValue: number; upvotes: number; downvotes: number; score: number };
    }>(`/posts/${postId}/comments/${commentId}/vote`, { value });
    return data.data;
  },
};
