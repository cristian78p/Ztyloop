import { api } from './api';
import type { Post, PaginatedResponse, PostCategory, ItemType } from '@/types';

// ─── Upload de imágenes ──────────────────────────────
export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const { data } = await api.post<{ success: true; data: { urls: string[] } }>(
    '/uploads',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data.urls;
}

export interface OutfitItemInput {
  x: number;
  y: number;
  imageIndex?: number;
  itemType: ItemType;
  customLabel?: string;
  customLink?: string;
  brand?: string;
  price?: number;
}

export interface CreatePostInput {
  media: string[];
  type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  caption?: string;
  category?: PostCategory;
  visibility?: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
  hashtags?: string[];
  outfitItems?: OutfitItemInput[];
}

export interface UpdatePostInput {
  media?: string[];
  caption?: string | null;
  category?: PostCategory | null;
  visibility?: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
  hashtags?: string[];
  outfitItems?: OutfitItemInput[];
}

export const postService = {
  async getFeed(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const { data } = await api.get<{ success: true; data: PaginatedResponse<Post> }>(
      `/posts?page=${page}&limit=${limit}`,
    );
    return data.data;
  },

  async getFollowingFeed(page = 1, limit = 20): Promise<PaginatedResponse<Post>> {
    const { data } = await api.get<{ success: true; data: PaginatedResponse<Post> }>(
      `/posts/following?page=${page}&limit=${limit}`,
    );
    return data.data;
  },

  async getById(id: string): Promise<Post> {
    const { data } = await api.get<{ success: true; data: Post }>(`/posts/${id}`);
    return data.data;
  },

  async create(input: CreatePostInput): Promise<Post> {
    const { data } = await api.post<{ success: true; data: Post }>('/posts', input);
    return data.data;
  },

  async update(id: string, input: UpdatePostInput): Promise<Post> {
    const { data } = await api.patch<{ success: true; data: Post }>(`/posts/${id}`, input);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/posts/${id}`);
  },
};
