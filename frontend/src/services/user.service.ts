import { api } from './api';
import type { UserProfile, Post, PaginatedResponse } from '@/types';

export const userService = {
  async getProfile(username: string): Promise<UserProfile> {
    const { data } = await api.get<{ success: true; data: UserProfile }>(`/users/${username}`);
    return data.data;
  },

  async getUserPosts(username: string, page = 1): Promise<PaginatedResponse<Post>> {
    const { data } = await api.get<{ success: true; data: PaginatedResponse<Post> }>(
      `/users/${username}/posts?page=${page}`,
    );
    return data.data;
  },

  async follow(username: string): Promise<{ following: boolean }> {
    const { data } = await api.put<{ success: true; data: { following: boolean } }>(
      `/users/${username}/follow`,
    );
    return data.data;
  },

  async unfollow(username: string): Promise<{ following: boolean }> {
    const { data } = await api.delete<{ success: true; data: { following: boolean } }>(
      `/users/${username}/follow`,
    );
    return data.data;
  },

  async updateProfile(input: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
  }): Promise<UserProfile> {
    const { data } = await api.patch<{ success: true; data: UserProfile }>('/users/me', input);
    return data.data;
  },
};
