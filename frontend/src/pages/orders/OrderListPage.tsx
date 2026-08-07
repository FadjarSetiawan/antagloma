import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, UpdateOrderPayload } from '../../services/orderService';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { OrderEditModal } from '../../components/orders/OrderEditModal';
import { PackingNotaModal } from '../../components/orders/PackingNotaModal';
import { CompleteShipmentModal } from '../../components/orders/CompleteShipmentModal';
import { Order, OrderItem } from '../../types/order';
import { CustomSelect } from '../../components/shared/CustomSelect';
import { Search, Eye, Edit3, Printer, CheckCircle, PackageCheck, Plus, Phone, Calendar, Truck, FileText, Lightbulb } from 'lucide-react';
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

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'WAITING_PROCESS', label: 'Menunggu Diproses' },
    { value: 'WAITING_PACKING', label: 'Menunggu Packing' },
    { value: 'PACKING_COMPLETED', label: 'Packing Selesai' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
  ];

  return (
    <div className="space-y-5 max-w-7xl pb-12">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Daftar Order Penjualan</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Kelola dan pantau transaksi order Tanaman Adenium secara real-time.</p>
      </div>

      {/* Action Card: + Buat Order Baru */}
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

      {/* Search Input & Custom Filter Dropdown */}
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

        <CustomSelect
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="-- Pilih Filter Status --"
        />
      </div>

      {/* Orders List Container */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-bold bg-white rounded-3xl border-2 border-slate-200">
            Memuat daftar order...
          </div>
        ) : data?.data?.length === 0 ? (
          /* Empty State Graphic */
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl border-2 border-emerald-200 flex items-center justify-center text-emerald-800 relative">
              <FileText className="w-10 h-10 text-emerald-700" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Belum Ada Transaksi Pesanan</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Belum ada transaksi order penjualan yang tercatat dalam sistem. Klik tombol di bawah untuk membuat order baru.
              </p>
            </div>

            {(role === 'sales' || role === 'admin') && (
              <button
                onClick={() => navigate('/orders/create')}
                className="mt-2 px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Order Baru Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          /* List of Orders */
          data?.data?.map((order: Order) => {
            const itemCount = order.items ? order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0) : 0;
            const plantTotalPrice = order.items ? order.items.reduce((sum: number, item: OrderItem) => sum + (item.quantity * item.price), 0) : 0;
            const totalOrderAmount = plantTotalPrice + (order.buyer_shipping_cost || 0);

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3 hover:border-emerald-800 transition-all shadow-xs cursor-pointer relative group"
              >
                {/* Header Row: Order Number & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{order.order_number}</span>
                    <span className="text-[11px] font-bold text-slate-400">•</span>
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {order.order_date}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Body Details: Customer Info & Items Count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Pemesan</span>
                    <span className="font-extrabold text-slate-900 text-sm block">{order.customer_name}</span>
                    <span className="text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {order.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Pengiriman & Item</span>
                    <span className="font-extrabold text-slate-900 block flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-800" />
                      {order.delivery_method}
                    </span>
                    <span className="text-slate-500 font-bold block mt-0.5">
                      {itemCount} tanaman • Rp {totalOrderAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Bar inside Order Card */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Klik kartu untuk lihat rincian lengkap
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" /> Detail
                    </button>

                    {(role === 'admin' || role === 'owner') && order.status === 'WAITING_PROCESS' && (
                      <button
                        onClick={() => approveMutation.mutate(order.id)}
                        disabled={approveMutation.isPending}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-white" /> Verifikasi
                      </button>
                    )}

                    {(role === 'admin' || role === 'owner') && (order.status === 'WAITING_PACKING' || order.status === 'PACKING_COMPLETED' || order.status === 'COMPLETED') && (
                      <button
                        onClick={() => setNotaOrder(order)}
                        className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-white" /> Cetak Nota
                      </button>
                    )}

                    {(role === 'admin' || role === 'owner') && order.status === 'PACKING_COMPLETED' && (
                      <button
                        onClick={() => setShipmentOrder(order)}
                        className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-white" /> Input Resi
                      </button>
                    )}

                    {(role === 'admin' || role === 'owner' || (role === 'sales' && order.status === 'WAITING_PROCESS')) && (
                      <button
                        onClick={() => setEditingOrder(order)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                        title="Edit order"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onApprove={(id: number) => approveMutation.mutate(id)}
        onDelete={(id: number) => deleteMutation.mutate(id)}
        onOpenNota={(ord: Order) => setNotaOrder(ord)}
        onOpenShipmentModal={(ord: Order) => setShipmentOrder(ord)}
        onEdit={(ord: Order) => setEditingOrder(ord)}
      />

      {/* Order Edit Modal */}
      <OrderEditModal
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSubmit={handleUpdateOrder}
      />

      {/* Packing Nota Thermal Modal */}
      <PackingNotaModal
        order={notaOrder}
        onClose={() => setNotaOrder(null)}
      />

      {/* Complete Shipment Modal */}
      <CompleteShipmentModal
        order={shipmentOrder}
        onClose={() => setShipmentOrder(null)}
        onConfirm={handleConfirmShipment}
      />
    </div>
  );
};
