import { api } from './api';
import { Order, OrderItem, OrderPackage, Region } from '../types/order';
export type { Region } from '../types/order';

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
  plant_photo?: File | null;
  items: Omit<OrderItem, 'id'>[];
}

export interface UpdateOrderPayload {
  customer_name?: string;
  phone?: string;
  delivery_method?: string;
  full_address?: string;
  notes?: string;
  status?: string;
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
  pending_packing: number;
  pending_shipping: number;
  completed_orders: number;
}

export const orderService = {
  getOrders: async (params?: { page?: number; per_page?: number; status?: string; search?: string; order_date?: string; date_from?: string; date_to?: string }): Promise<PaginatedResponse<Order>> => {
    const res = await api.get('/orders', { params });
    return res.data;
  },
  getNextOrderNumber: async (orderDate: string): Promise<string> => {
    const res = await api.get('/orders/next-number', { params: { order_date: orderDate } });
    return res.data.data.order_number;
  },

  getOrderById: async (id: number): Promise<{ success: boolean; data: Order }> => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  createOrder: async (payload: CreateOrderPayload): Promise<{ success: boolean; data: Order }> => {
    const formData = new FormData();
    formData.append('customer_name', payload.customer_name);
    formData.append('phone', payload.phone);
    formData.append('delivery_method', payload.delivery_method);
    formData.append('full_address', payload.full_address);
    formData.append('payment_method', payload.payment_method);

    if (payload.order_date) formData.append('order_date', payload.order_date);
    if (payload.province_id) formData.append('province_id', payload.province_id);
    if (payload.province_name) formData.append('province_name', payload.province_name);
    if (payload.regency_id) formData.append('regency_id', payload.regency_id);
    if (payload.regency_name) formData.append('regency_name', payload.regency_name);
    if (payload.district_id) formData.append('district_id', payload.district_id);
    if (payload.district_name) formData.append('district_name', payload.district_name);
    if (payload.notes) formData.append('notes', payload.notes);
    if (payload.bank_name) formData.append('bank_name', payload.bank_name);
    if (payload.buyer_shipping_cost !== undefined) formData.append('buyer_shipping_cost', String(payload.buyer_shipping_cost));

    if (payload.payment_proof) {
      formData.append('payment_proof', payload.payment_proof);
    }
    if (payload.plant_photo) {
      formData.append('plant_photo', payload.plant_photo);
    }

    formData.append('items', JSON.stringify(payload.items));

    const res = await api.post('/orders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updateOrder: async (id: number, payload: UpdateOrderPayload): Promise<{ success: boolean; data: Order }> => {
    const res = await api.put(`/orders/${id}`, payload);
    return res.data;
  },

  deleteOrder: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/orders/${id}`);
    return res.data;
  },

  approveOrder: async (id: number): Promise<{ success: boolean; data: Order }> => {
    const res = await api.patch(`/orders/${id}/approve`);
    return res.data;
  },

  uploadPackingProof: async (id: number, formData: FormData): Promise<{ success: boolean; data: Order }> => {
    const res = await api.post(`/packing/packages/${id}/upload-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  configurePackages: async (order_id: number, packages: unknown[]) => {
    const res = await api.post('/packing/configure-packages', { order_id, packages });
    return res.data;
  },

  printPackageDocument: async (packageId: number, document: 'nota' | 'label') => {
    const res = await api.post(`/packing/packages/${packageId}/print/${document}`);
    return res.data;
  },

  completeShipment: async (
    id: number,
    payload: { shipping_cost?: number; tracking_number?: string }
  ): Promise<{ success: boolean; data: Order }> => {
    const res = await api.patch(`/orders/${id}/shipment`, payload);
    return res.data;
  },

  getPackingQueue: async (): Promise<PaginatedResponse<Order>> => {
    const res = await api.get('/packing/queue');
    return res.data;
  },

  completePackageShipment: async (
    packageId: number,
    payload: { shipping_cost: number; tracking_number: string }
  ): Promise<{ success: boolean; data: OrderPackage }> => {
    const res = await api.post(`/packing/packages/${packageId}/shipment`, payload);
    return res.data;
  },

  uploadPackageProof: async (packageId: number, file: File, notes?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (notes) formData.append('notes', notes);
    const res = await api.post(`/packing/packages/${packageId}/upload-proof`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  markSalesInformed: async (id: number): Promise<{ success: boolean; message: string; data: Order }> => {
    const res = await api.post(`/orders/${id}/sales-informed`);
    return res.data;
  },
  rejectOrder: async (id: number, reason: string): Promise<{ success: boolean; message: string; data: Order }> => {
    const res = await api.post(`/orders/${id}/reject`, { reason });
    return res.data;
  },
  returnOrder: async (id: number, payload: { package_ids: number[]; reason: string; item_status: 'RETURNED' | 'NOT_RETURNED'; notes?: string }): Promise<{ success: boolean; message: string; data: Order }> => {
    const res = await api.post(`/orders/${id}/return`, payload);
    return res.data;
  },

  getSalesPackingProgress: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<Order>> => {
    const res = await api.get('/sales/packing-progress', { params });
    return res.data;
  },

  getRegions: async (parentCode?: string): Promise<Region[]> => {
    const res = await api.get('/regions', { params: { parent_code: parentCode } });
    return res.data.data;
  },

  getProvinces: async (): Promise<Region[]> => {
    const res = await api.get('/regions/provinces');
    return res.data.data;
  },

  getRegencies: async (provinceId: string): Promise<Region[]> => {
    const res = await api.get(`/regions/regencies/${provinceId}`);
    return res.data.data;
  },

  getDistricts: async (regencyId: string): Promise<Region[]> => {
    const res = await api.get(`/regions/districts/${regencyId}`);
    return res.data.data;
  },
};
