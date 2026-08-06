import { api } from './api';
import { Order, OrderItem, Region } from '../types/order';

export interface CreateOrderPayload {
  order_date?: string;
  customer_name: string;
  phone: string;
  delivery_method: string;
  province_id?: string;
  province_name?: string;
  regency_id?: string;
  regency_name?: string;
  district_id?: string;
  district_name?: string;
  full_address: string;
  notes?: string;
  payment_method: string;
  bank_name?: string;
  buyer_shipping_cost?: number;
  payment_proof?: File | null;
  items: Omit<OrderItem, 'id'>[];
}

export interface UpdateOrderPayload {
  customer_name?: string;
  phone?: string;
  delivery_method?: string;
  full_address?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export interface DashboardMetrics {
  today_orders: number;
  waiting_process: number;
  waiting_packing: number;
  completed_orders: number;
  recent_activities: Order[];
}

export const orderService = {
  async getOrders(params?: { status?: string; search?: string; per_page?: number }) {
    const res = await api.get<PaginatedResponse<Order>>('/orders', { params });
    return res.data;
  },

  async getOrderById(id: number) {
    const res = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
    return res.data;
  },

  async createOrder(data: CreateOrderPayload) {
    const formData = new FormData();
    if (data.order_date) formData.append('order_date', data.order_date);
    formData.append('customer_name', data.customer_name);
    formData.append('phone', data.phone);
    formData.append('delivery_method', data.delivery_method);
    if (data.province_id) formData.append('province_id', data.province_id);
    if (data.province_name) formData.append('province_name', data.province_name);
    if (data.regency_id) formData.append('regency_id', data.regency_id);
    if (data.regency_name) formData.append('regency_name', data.regency_name);
    if (data.district_id) formData.append('district_id', data.district_id);
    if (data.district_name) formData.append('district_name', data.district_name);
    formData.append('full_address', data.full_address);
    if (data.notes) formData.append('notes', data.notes);
    formData.append('payment_method', data.payment_method);
    if (data.bank_name) formData.append('bank_name', data.bank_name);
    if (data.buyer_shipping_cost !== undefined) formData.append('buyer_shipping_cost', String(data.buyer_shipping_cost));
    if (data.payment_proof) formData.append('payment_proof', data.payment_proof);

    formData.append('items', JSON.stringify(data.items));
    data.items.forEach((item, idx) => {
      if (item.tree_code) formData.append(`items[${idx}][tree_code]`, item.tree_code);
      if (item.tree_name) formData.append(`items[${idx}][tree_name]`, item.tree_name);
      if (item.grade) formData.append(`items[${idx}][grade]`, item.grade);
      formData.append(`items[${idx}][product_name]`, item.product_name || item.tree_name || 'Adenium');
      formData.append(`items[${idx}][quantity]`, String(item.quantity));
      formData.append(`items[${idx}][price]`, String(item.price));
      if (item.standard_price !== undefined) formData.append(`items[${idx}][standard_price]`, String(item.standard_price));
      if (item.discount !== undefined) formData.append(`items[${idx}][discount]`, String(item.discount));
      if (item.notes) formData.append(`items[${idx}][notes]`, item.notes);
    });

    const res = await api.post<{ success: boolean; message: string; data: Order }>('/orders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async updateOrder(id: number, data: UpdateOrderPayload) {
    const res = await api.put<{ success: boolean; message: string; data: Order }>(`/orders/${id}`, data);
    return res.data;
  },

  async deleteOrder(id: number) {
    const res = await api.delete<{ success: boolean; message: string }>(`/orders/${id}`);
    return res.data;
  },

  async approveOrder(id: number) {
    const res = await api.post<{ success: boolean; message: string; data: Order }>(`/orders/${id}/approve`);
    return res.data;
  },

  async completeShipment(id: number, payload: { shipping_cost?: number; tracking_number?: string }) {
    const res = await api.post<{ success: boolean; message: string; data: Order }>(`/orders/${id}/complete-shipment`, payload);
    return res.data;
  },

  async getPackingQueue() {
    const res = await api.get<PaginatedResponse<Order>>('/packing/queue');
    return res.data;
  },

  async uploadPackingProof(id: number, formData: FormData) {
    const res = await api.post<{ success: boolean; message: string; data: any }>(`/orders/${id}/packing-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getReportSummary() {
    const res = await api.get<{ success: boolean; data: { total_orders: number; monthly_orders: number; completed_orders: number } }>('/reports/summary');
    return res.data;
  },

  async getProvinces() {
    const res = await api.get<{ success: boolean; data: Region[] }>('/regions/provinces');
    return res.data.data;
  },

  async getRegencies(provinceId: string) {
    const res = await api.get<{ success: boolean; data: Region[] }>(`/regions/regencies/${provinceId}`);
    return res.data.data;
  },

  async getDistricts(regencyId: string) {
    const res = await api.get<{ success: boolean; data: Region[] }>(`/regions/districts/${regencyId}`);
    return res.data.data;
  },
};
