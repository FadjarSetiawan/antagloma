import { api } from './api';

export interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'sales' | 'packing';
  created_at: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'owner' | 'admin' | 'sales' | 'packing';
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'sales' | 'packing';
  password?: string;
}

export const userService = {
  async getUsers() {
    const res = await api.get<{ success: boolean; data: UserAccount[] }>('/users');
    return res.data;
  },

  async createUser(payload: CreateUserPayload) {
    const res = await api.post<{ success: boolean; message: string; data: UserAccount }>('/users', payload);
    return res.data;
  },

  async updateUser(id: number, payload: UpdateUserPayload) {
    const res = await api.put<{ success: boolean; message: string; data: UserAccount }>(`/users/${id}`, payload);
    return res.data;
  },

  async deleteUser(id: number) {
    const res = await api.delete<{ success: boolean; message: string }>(`/users/${id}`);
    return res.data;
  },
};
