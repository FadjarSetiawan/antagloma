import { api } from './api';
import { MasterTree, MasterGrade } from '../types/order';

export const masterService = {
  async getTrees() {
    const res = await api.get<{ success: boolean; data: MasterTree[] }>('/master/trees');
    return res.data.data;
  },

  async getGrades() {
    const res = await api.get<{ success: boolean; data: MasterGrade[] }>('/master/grades');
    return res.data.data;
  },

  async createTree(data: { code: string; name: string }) {
    const res = await api.post<{ success: boolean; message: string; data: MasterTree }>('/master/trees', data);
    return res.data;
  },

  async updateTree(id: number, data: { code: string; name: string }) {
    const res = await api.put<{ success: boolean; message: string; data: MasterTree }>(`/master/trees/${id}`, data);
    return res.data;
  },

  async deleteTree(id: number) {
    const res = await api.delete<{ success: boolean; message: string }>(`/master/trees/${id}`);
    return res.data;
  },

  async updateGrade(id: number, standard_price: number) {
    const res = await api.put<{ success: boolean; message: string; data: MasterGrade }>(`/master/grades/${id}`, { standard_price });
    return res.data;
  },
};
