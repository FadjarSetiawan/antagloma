import { User } from './user';

export type OrderStatus =
  | 'WAITING_PROCESS'
  | 'WAITING_PACKING'
  | 'PACKING_COMPLETED'
  | 'COMPLETED'
  | 'CANCELLED';

export type DeliveryMethod =
  | 'Kirim Paket'
  | 'Packing Kayu'
  | 'Ambil di Tempat'
  | 'Antar ke Rumah';

export interface OrderItem {
  id?: number;
  tree_code?: string;
  tree_name?: string;
  grade?: string;
  product_name: string;
  variant?: string;
  quantity: number;
  price: number;
  standard_price?: number;
  discount?: number;
  notes?: string;
}

export interface MasterTree {
  id: number;
  code: string;
  name: string;
}

export interface MasterGrade {
  id: number;
  grade: string;
  standard_price: number;
}

export interface PackingImage {
  id: number;
  image_url: string;
  original_name: string;
  notes?: string;
  uploader?: User;
  created_at: string;
}

export interface OrderPackage {
  id: number;
  letter: string;
  package_type?: string;
  status: string;
  configured_at?: string;
  nota_printed: boolean;
  label_printed: boolean;
  photo_uploaded: boolean;
  tracking_number?: string;
  shipping_cost?: number;
  weight?: number;
  packing_images?: PackingImage[];
  items?: { order_item_id: number; quantity: number; product_name?: string }[];
}

export interface Order {
  id: number;
  created_by: number;
  order_number: string;
  order_date: string;
  customer_name: string;
  phone: string;
  delivery_method: DeliveryMethod;
  province_id?: string;
  province_name?: string;
  regency_id?: string;
  regency_name?: string;
  district_id?: string;
  district_name?: string;
  full_address: string;
  notes?: string;
  status: OrderStatus;
  rejection_reason?: string;
  payment_method?: 'Transfer Bank' | 'QRIS' | 'Tunai' | 'Marketplace';
  bank_name?: 'BCA' | 'BRI';
  buyer_shipping_cost?: number;
  payment_proof_url?: string;
  payment_status?: string;
  shipping_cost?: number;
  tracking_number?: string;
  creator: User;
  verifier?: User;
  items?: OrderItem[];
  packing_images?: PackingImage[];
  created_at: string;
  verified_at?: string;
  shipped_at?: string;
  completed_at?: string;
  sales_informed_at?: string;
  sales_commission?: number;
  packages?: OrderPackage[];
}

export interface Region {
  id: string;
  name: string;
}
