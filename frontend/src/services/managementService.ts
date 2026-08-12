import { api } from './api';
export interface SalesCommission { id:number; name:string; email:string; commission_rate:number; }
export interface Discount { id:number; name:string; type:'percentage'|'fixed'; value:number; is_active:boolean; }
export const managementService = {
  getCommissions: async () => {
    const res = await api.get<{success: boolean; data: SalesCommission[]}>('/commissions');
    return res.data;
  },
  updateCommission: async (id:number, commission_rate:number) => (await api.put(`/commissions/${id}`, { commission_rate })).data,
  getDiscounts: async () => (await api.get<{data: Discount[]}>('/discounts')).data,
  createDiscount: async (data: Omit<Discount,'id'>) => (await api.post('/discounts', data)).data,
  updateDiscount: async (id:number, data: Partial<Omit<Discount,'id'>>) => (await api.put(`/discounts/${id}`, data)).data,
  deactivateDiscount: async (id:number) => (await api.delete(`/discounts/${id}`)).data,
  
  getCommissionsByMonth: async (month: string) => {
    const res = await api.get<{success: boolean; data: Array<SalesCommission & { payout_status: 'PAID' | 'UNPAID'; payout_proof_path: string | null; payout_date: string | null }>}>('/commissions', { params: { month } });
    return res.data;
  },

  payCommission: async (formData: FormData) => {
    const res = await api.post<{success: boolean; message: string; data: any}>('/commissions/payouts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};
