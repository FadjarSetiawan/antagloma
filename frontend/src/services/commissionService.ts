import { api } from './api';

export interface CommissionItem {
  id: number;
  order_number: string;
  customer_name: string;
  date: string;
  raw_date: string;
  month_key: string;
  item_count: number;
  plant_total: number;
  total_discount: number;
  subtotal: number;
  commission: number;
  status: string;
  payment_status: string;
}

export interface CommissionResponse {
  success: boolean;
  data: {
    month: string;
    month_label: string;
    monthly_commission: number;
    total_orders: number;
    history: CommissionItem[];
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
