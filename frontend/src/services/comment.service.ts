import { api } from './api';
import type { Comment } from '@/types';

export const commentService = {
  async getByPost(postId: string): Promise<Comment[]> {
    const { data } = await api.get<{ success: true; data: Comment[] }>(`/posts/${postId}/comments`);
    return data.data;
  },

  async create(postId: string, content: string, parentId?: string): Promise<Comment> {
    const { data } = await api.post<{ success: true; data: Comment }>(
      `/posts/${postId}/comments`,
      { content, parentId },
    );
    return data.data;
  },

  async delete(postId: string, commentId: string): Promise<void> {
    await api.delete(`/posts/${postId}/comments/${commentId}`);
  },
};
