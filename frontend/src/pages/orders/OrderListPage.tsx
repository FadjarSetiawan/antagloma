import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, UpdateOrderPayload } from '../../services/orderService';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { OrderEditModal } from '../../components/orders/OrderEditModal';
import { PackingNotaModal } from '../../components/orders/PackingNotaModal';
import { CompleteShipmentModal } from '../../components/orders/CompleteShipmentModal';
import { Order } from '../../types/order';
import { Search, Eye, Edit3, Printer, CheckCircle, PackageCheck, Plus, Phone, Calendar, Truck, FileText, Filter, Lightbulb, Sprout } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const OrderListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [notaOrder, setNotaOrder] = useState<Order | null>(null);
  const [shipmentOrder, setShipmentOrder] = useState<Order | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['orders-list', search, statusFilter],
    queryFn: () => orderService.getOrders({ search, status: statusFilter }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => orderService.approveOrder(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      if (selectedOrder) setSelectedOrder(res.data);
    },
  });

  const shipmentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { shipping_cost?: number; tracking_number?: string } }) =>
      orderService.completeShipment(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      if (selectedOrder) setSelectedOrder(res.data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => orderService.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      setSelectedOrder(null);
    },
  });

  const handleUpdateOrder = async (id: number, payload: UpdateOrderPayload) => {
    await orderService.updateOrder(id, payload);
    queryClient.invalidateQueries({ queryKey: ['orders-list'] });
  };

  const handleConfirmShipment = async (orderId: number, payload: { shipping_cost: number; tracking_number: string }) => {
    await shipmentMutation.mutateAsync({ id: orderId, payload });
  };

  const role = user?.role;

  return (
    <div className="space-y-5 max-w-7xl pb-12">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Daftar Order Penjualan</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Kelola dan pantau transaksi order Tanaman Adenium secara real-time.</p>
      </div>

      {/* Action Card: + Buat Order Baru (Matches Screenshot 2 Exactly) */}
      {(role === 'sales' || role === 'admin') && (
        <div
          onClick={() => navigate('/orders/create')}
          className="p-5 bg-emerald-50/70 border-2 border-dashed border-emerald-300 rounded-3xl text-center flex flex-col items-center justify-center space-y-1.5 cursor-pointer hover:bg-emerald-100/50 transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-sm text-emerald-900 block">Buat Order Baru</span>
          <span className="text-[11px] text-slate-500 font-medium">Tambah order penjualan baru</span>
        </div>
      )}

      {/* Search Input & Filter Dropdown (Matches Screenshot 2 Exactly) */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-800 absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor order, nama customer, atau WA..."
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 shadow-xs"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 text-emerald-800 absolute left-4 top-3.5 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-11 pr-8 py-3 bg-white border-2 border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 font-extrabold text-slate-900 shadow-xs appearance-none"
          >
            <option value="">Semua Status</option>
            <option value="WAITING_PROCESS">Menunggu Diproses</option>
            <option value="WAITING_PACKING">Menunggu Packing</option>
            <option value="PACKING_COMPLETED">Packing Selesai</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-bold bg-white rounded-3xl border-2 border-slate-200">
            Memuat daftar order...
          </div>
        ) : data?.data?.length === 0 ? (
          /* Empty State Graphic (Matches Screenshot 2 Exactly) */
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl border-2 border-emerald-200 flex items-center justify-center text-emerald-800 relative">
              <FileText className="w-10 h-10 text-emerald-700" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-800 border-2 border-white text-white flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Belum ada order</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium max-w-xs mx-auto">
                Buat order baru atau ubah filter pencarian untuk melihat data.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View: Stacked Cards (Solid Colors) */}
            <div className="md:hidden space-y-3">
              {data?.data?.map((order) => (
                <div key={order.id} className="bg-white border-2 border-slate-200 rounded-3xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="font-extrabold text-sm text-slate-900">{order.order_number}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-900 font-bold">
                      <span>{order.customer_name}</span>
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-800" /> {order.phone}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span className="flex items-center gap-1 text-emerald-800 font-bold">
                        <Truck className="w-3.5 h-3.5" /> {order.delivery_method}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" /> {order.order_date ? new Date(order.order_date).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-800" /> Detail
                      </button>
                      <button
                        onClick={() => setNotaOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-700" /> Nota
                      </button>
                    </div>

                    {(role === 'admin' || role === 'owner') && order.status === 'WAITING_PROCESS' && (
                      <button
                        onClick={() => approveMutation.mutate(order.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}

                    {(role === 'admin' || role === 'owner') && order.status === 'PACKING_COMPLETED' && (
                      <button
                        onClick={() => setShipmentOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <PackageCheck className="w-3.5 h-3.5" /> Dikirim
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden md:block bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 border-b-2 border-slate-200 text-xs uppercase text-slate-600 font-bold">
                  <tr>
                    <th className="px-4 py-3.5">No Order</th>
                    <th className="px-4 py-3.5">Tgl Order</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Metode</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data?.data?.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-extrabold text-slate-900">{order.order_number}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-semibold whitespace-nowrap">
                        {order.order_date ? new Date(order.order_date).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div>{order.customer_name}</div>
                        <div className="text-xs text-slate-500 font-normal">{order.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-800 text-xs font-extrabold">{order.delivery_method}</td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            title="Lihat Detail"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-300 font-bold text-xs flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4 text-emerald-800" /> Detail
                          </button>
                          <button
                            onClick={() => setNotaOrder(order)}
                            title="Nota Packing"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-300 font-bold text-xs flex items-center gap-1"
                          >
                            <Printer className="w-4 h-4 text-amber-700" /> Nota
                          </button>

                          {(role === 'admin' || role === 'owner') && order.status === 'WAITING_PROCESS' && (
                            <button
                              onClick={() => approveMutation.mutate(order.id)}
                              className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                          )}

                          {(role === 'admin' || role === 'owner') && order.status === 'PACKING_COMPLETED' && (
                            <button
                              onClick={() => setShipmentOrder(order)}
                              className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                            >
                              <PackageCheck className="w-4 h-4" /> Dikirim
                            </button>
                          )}

                          {((role === 'admin' || role === 'owner') || (role === 'sales' && order.creator?.id === user?.id && order.status === 'WAITING_PROCESS')) && (
                            <button
                              onClick={() => setEditingOrder(order)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-300 font-bold"
                            >
                              <Edit3 className="w-4 h-4 text-slate-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Tips Lightbulb Banner (Matches Screenshot 2 Exactly) */}
      <div className="p-4 bg-emerald-50/60 border-2 border-emerald-200 rounded-3xl flex items-start gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-2xl bg-emerald-200 text-emerald-900 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h4 className="font-extrabold text-slate-900">Tips</h4>
          <p className="text-slate-600 font-medium mt-0.5">
            Gunakan filter status untuk menemukan order dengan lebih cepat.
          </p>
        </div>
      </div>

      {/* Modals */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onApprove={(id) => approveMutation.mutate(id)}
        onOpenShipmentModal={(ord) => setShipmentOrder(ord)}
        onOpenNota={(ord) => setNotaOrder(ord)}
        onEdit={(ord) => setEditingOrder(ord)}
        onDelete={(id) => deleteMutation.mutate(id)}
        isActionLoading={approveMutation.isPending || shipmentMutation.isPending}
      />

      <OrderEditModal
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSubmit={handleUpdateOrder}
      />

      <PackingNotaModal
        order={notaOrder}
        onClose={() => setNotaOrder(null)}
      />

      <CompleteShipmentModal
        order={shipmentOrder}
        onClose={() => setShipmentOrder(null)}
        onConfirm={handleConfirmShipment}
      />
    </div>
  );
};
