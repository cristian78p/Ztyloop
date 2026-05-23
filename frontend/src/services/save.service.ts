import { api } from './api';
import type { PaginatedResponse, Post } from '@/types';

export const saveService = {
  async save(postId: string): Promise<{ saved: boolean }> {
    const { data } = await api.put<{ success: true; data: { saved: boolean } }>(
      `/posts/${postId}/save`,
    );
    return data.data;
  },

  async unsave(postId: string): Promise<{ saved: boolean }> {
    const { data } = await api.delete<{ success: true; data: { saved: boolean } }>(
      `/posts/${postId}/save`,
    );
    return data.data;
  },

  async getSaved(page = 1): Promise<PaginatedResponse<Post>> {
    const { data } = await api.get<{ success: true; data: PaginatedResponse<Post> }>(
      `/users/me/saved?page=${page}`,
    );
    return data.data;
  },
};
