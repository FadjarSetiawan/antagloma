import { api } from './api';

export interface CommissionItem {
  id: number;
  order_number: string;
  customer_name: string;
  date: string;
  raw_date: string;
  month_key: string;
  date_key: string;
  item_count: number;
  plant_total: number;
  total_discount: number;
  subtotal: number;
  commission: number;
  is_verified: boolean;
  status: string;
  payment_status: string;
}

export interface CommissionResponse {
  success: boolean;
  data: {
    month: string;
    month_label: string;
    commission_rate: number;
    monthly_commission: number;
    monthly_plant_total: number;
    monthly_total_orders: number;
    today_commission: number;
    today_plant_total: number;
    today_total_orders: number;
    payout_status: 'PAID' | 'UNPAID';
    payout_proof_path: string | null;
    all_history: CommissionItem[];
  };
}

export const commissionService = {
  async getCommissionData(month?: string) {
    const res = await api.get<CommissionResponse>('/sales/commission', {
      params: { month },
    });
    return res.data;
  },
};
