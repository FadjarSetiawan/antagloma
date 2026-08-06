import React from 'react';
import { OrderStatus } from '../../types/order';

interface Props {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  WAITING_PROCESS: { label: 'Menunggu Diproses', className: 'bg-amber-600 text-white font-bold shadow-xs' },
  WAITING_PACKING: { label: 'Menunggu Packing', className: 'bg-blue-600 text-white font-bold shadow-xs' },
  PACKING_COMPLETED: { label: 'Packing Selesai', className: 'bg-emerald-800 text-white font-extrabold shadow-xs' },
  COMPLETED: { label: 'Selesai', className: 'bg-emerald-900 text-white font-black shadow-xs' },
  CANCELLED: { label: 'Dibatalkan', className: 'bg-slate-600 text-white font-bold shadow-xs' },
};

export const OrderStatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.WAITING_PROCESS;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
};
