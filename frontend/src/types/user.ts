export type UserRole = 'owner' | 'sales' | 'admin' | 'packing';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  commission_rate?: number;
}
