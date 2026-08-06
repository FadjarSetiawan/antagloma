import { api } from './api';
import { User } from '../types/user';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get('/me');
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/logout');
    localStorage.removeItem('auth_token');
  },
};
