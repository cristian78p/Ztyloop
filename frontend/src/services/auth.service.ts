import { api } from './api';
import type { User } from '@/types';

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// Los services del frontend encapsulan las llamadas HTTP.
// Los componentes y hooks llaman a estos métodos, no a axios directamente.
export const authService = {
  async register(input: RegisterInput): Promise<{ user: User; accessToken: string }> {
    const { data } = await api.post<{ success: true; data: { user: User; accessToken: string } }>(
      '/auth/register',
      input,
    );
    return data.data;
  },

  async login(input: LoginInput): Promise<{ user: User; accessToken: string }> {
    const { data } = await api.post<{ success: true; data: { user: User; accessToken: string } }>(
      '/auth/login',
      input,
    );
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ success: true; data: User }>('/auth/me');
    return data.data;
  },
};
