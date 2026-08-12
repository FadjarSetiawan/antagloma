import { api } from './api';

export interface SalesCommission {
  id: number;
  name: string;
  email: string;
  commission_rate: number;
}

export interface SalesCommissionOwnerView extends SalesCommission {
  pending_commission: number;
  pending_plant_total: number;
  pending_order_count: number;
  last_payout_date: string | null;
  last_payout_period: { start: string; end: string; label: string } | null;
}

export interface PreviewOrder {
  id: number;
  order_number: string;
  customer_name: string;
  date: string;
  raw_date: string;
  plant_total: number;
  commission: number;
  is_verified: boolean;
  item_count: number;
}

export interface PreviewResult {
  order_count: number;
  plant_total: number;
  commission: number;
  commission_rate: number;
  orders: PreviewOrder[];
}

export interface PayoutHistory {
  payout_id: number;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  amount: number;
  plant_total: number;
  commission: number;
  order_count: number;
  payment_proof_path: string | null;
  paid_at: string;
  notes: string | null;
  orders: PreviewOrder[];
}

export interface SalesCommissionHistoryItem {
  id: number;
  order_number: string;
  customer_name: string;
  delivery_method: string;
  date: string;
  raw_date: string;
  plant_total: number;
  commission: number;
  status_key: 'waiting_verification' | 'verified' | 'paid' | 'rejected';
  status_label: string;
  is_paid: boolean;
}

export interface SalesCommissionSummary {
  waiting_verification: number;
  verified: number;
  paid: number;
  rejected: number;
}

export interface SalesCommissionData {
  commission_rate: number;
  summary: SalesCommissionSummary;
  history: SalesCommissionHistoryItem[];
  payout_history: PayoutHistory[];
}

export interface Discount {
  id: number;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  is_active: boolean;
}

export const managementService = {
  // Owner: list all sales with pending commission totals
  getCommissions: async () => {
    const res = await api.get<{ success: boolean; data: SalesCommissionOwnerView[] }>('/commissions');
    return res.data;
  },

  // Update commission rate for a sales person
  updateCommission: async (id: number, commission_rate: number) =>
    (await api.put(`/commissions/${id}`, { commission_rate })).data,

  // Owner: preview which orders & total will be covered before submitting payout
  previewPayoutOrders: async (salesId: number, periodStart: string, periodEnd: string) => {
    const res = await api.get<{ success: boolean; data: PreviewResult }>('/commissions/preview-orders', {
      params: { sales_id: salesId, period_start: periodStart, period_end: periodEnd },
    });
    return res.data;
  },

  // Owner: submit commission payment with proof upload
  payCommission: async (formData: FormData) => {
    const res = await api.post<{ success: boolean; message: string; data: any }>(
      '/commissions/payouts',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  // Sales: get own commission data (pending + history)
  getSalesCommission: async () => {
    const res = await api.get<{ success: boolean; data: SalesCommissionData }>('/commissions');
    return res.data;
  },

  // Discounts
  getDiscounts: async () => (await api.get<{ data: Discount[] }>('/discounts')).data,
  createDiscount: async (data: Omit<Discount, 'id'>) => (await api.post('/discounts', data)).data,
  updateDiscount: async (id: number, data: Partial<Omit<Discount, 'id'>>) =>
    (await api.put(`/discounts/${id}`, data)).data,
  deactivateDiscount: async (id: number) => (await api.delete(`/discounts/${id}`)).data,
};
