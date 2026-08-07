import React from 'react';
import { OrderStatus } from '../../types/order';

interface Props {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  WAITING_PROCESS: { label: 'Menunggu Diproses', className: 'bg-amber-600 text-white font-bold shadow-2xs' },
  WAITING_PACKING: { label: 'Belum Diatur', className: 'bg-blue-600 text-white font-bold shadow-2xs' },
  PACKING_COMPLETED: { label: 'Packing Selesai', className: 'bg-[#04593f] text-white font-extrabold shadow-2xs' },
  COMPLETED: { label: 'Selesai', className: 'bg-emerald-900 text-white font-black shadow-2xs' },
  CANCELLED: { label: 'Dibatalkan', className: 'bg-slate-600 text-white font-bold shadow-2xs' },
};

export const OrderStatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.WAITING_PROCESS;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
};
