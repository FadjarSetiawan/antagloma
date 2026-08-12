import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, UpdateOrderPayload } from '../../services/orderService';
import { Order, OrderItem, OrderPackage } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { OrderEditModal } from '../../components/orders/OrderEditModal';
import { PackingNotaModal } from '../../components/orders/PackingNotaModal';
import { CompleteShipmentModal } from '../../components/orders/CompleteShipmentModal';
import { CompletePackageShipmentModal } from '../../components/orders/CompletePackageShipmentModal';
import { CustomSelect } from '../../components/shared/CustomSelect';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  Printer,
  PackageCheck,
  Calendar,
  Phone,
  Truck,
  Lightbulb,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const OrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const paramSearch = searchParams.get('search') || searchParams.get('date') || '';
  const paramStatus = searchParams.get('status') || '';
  const paramOrderDate = searchParams.get('order_date') || '';

  const [search, setSearch] = useState(paramSearch);
  const [statusFilter, setStatusFilter] = useState(paramStatus);

  useEffect(() => {
    if (paramSearch) setSearch(paramSearch);
    if (paramStatus) setStatusFilter(paramStatus);
  }, [paramSearch, paramStatus]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [notaOrder, setNotaOrder] = useState<Order | null>(null);
  const [shipmentOrder, setShipmentOrder] = useState<Order | null>(null);
  const [shipmentPackage, setShipmentPackage] = useState<OrderPackage | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [isVerifyChecked, setIsVerifyChecked] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['orders-list', search, statusFilter, paramOrderDate],
    queryFn: async () => {
      // Fetch orders
      const res = await orderService.getOrders({ search, status: statusFilter === 'COMPLETED' ? undefined : statusFilter, order_date: paramOrderDate || undefined, per_page: 200 });
      if (statusFilter === 'COMPLETED') {
        // Filter orders that are fully shipped/completed on client-side to reflect both COMPLETED status and PACKING_COMPLETED with tracked packages
        res.data = res.data.filter((order) => {
          if (order.status === 'COMPLETED') return true;
          if (order.status === 'PACKING_COMPLETED') {
            if (order.packages && order.packages.length > 0) {
              return order.packages.every(pkg => pkg.tracking_number);
            }
            return !!order.tracking_number;
          }
          return false;
        });
      }
      return res;
    },
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

  const packageShipmentMutation = useMutation({
    mutationFn: ({ packageId, payload }: { packageId: number; payload: { shipping_cost: number; tracking_number: string } }) =>
      orderService.completePackageShipment(packageId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders-list'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => orderService.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      setSelectedOrder(null);
      setDeletingOrder(null);
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
    <div className="space-y-4 max-w-7xl pb-24 font-sans text-slate-900">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Daftar Order Penjualan</h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">Kelola dan pantau transaksi order Tanaman Adenium secara real-time.</p>
      </div>

      {/* Action Card: + Buat Order Baru */}
      {(role === 'sales' || role === 'admin') && (
        <div
          onClick={() => navigate('/orders/create')}
          className="p-4 bg-emerald-50/70 border border-dashed border-emerald-300 rounded-2xl text-center flex flex-col items-center justify-center space-y-1 cursor-pointer hover:bg-emerald-100/50 transition-all shadow-2xs group"
        >
          <div className="w-8 h-8 rounded-full bg-[#04593f] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-bold text-xs text-[#04593f] block">Buat Order Baru</span>
          <span className="text-[10px] text-slate-500 font-normal">Tambah order penjualan baru</span>
        </div>
      )}

      {/* Search Input & Custom Filter Dropdown */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-[#04593f] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor order, nama customer, atau WA..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 shadow-2xs"
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
          <div className="p-8 text-center text-xs text-slate-400 font-normal bg-white rounded-2xl border border-slate-200">
            Memuat daftar order...
          </div>
        ) : data?.data?.length === 0 ? (
          /* Empty State Graphic */
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#04593f]">
              <FileText className="w-8 h-8" />
            </div>

            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900">Belum Ada Transaksi Pesanan</h3>
              <p className="text-xs text-slate-500 font-normal max-w-xs mx-auto">
                Belum ada transaksi order penjualan yang tercatat dalam sistem.
              </p>
            </div>

            {(role === 'sales' || role === 'admin') && (
              <button
                onClick={() => navigate('/orders/create')}
                className="mt-1 px-4 py-2 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Order Baru</span>
              </button>
            )}
          </div>
        ) : (
          /* List of Orders */
          data?.data?.map((order: Order) => {
            const itemCount = order.items ? order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0) : 0;
            const plantTotalPrice = order.items ? order.items.reduce((sum: number, item: OrderItem) => sum + item.price, 0) : 0;
            const totalOrderAmount = plantTotalPrice + (order.buyer_shipping_cost || 0);

            // ALLOW EDIT & DELETE FOR SALES ONLY WHEN UNVERIFIED (WAITING_PROCESS). AUTOMATICALLY HIDE WHEN VERIFIED BY ADMIN.
            const isSalesOrderOwner = role === 'sales' && order.created_by === user?.id;
            const canModifySalesOrder = role === 'admin' || role === 'owner';

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 hover:border-[#04593f] transition-all shadow-2xs cursor-pointer relative group"
              >
                {/* Header Row: Order Number & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">{order.order_number}</span>
                    <span className="text-[11px] font-medium text-slate-300">•</span>
                    <span className="text-[10px] font-normal text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {order.order_date}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Body Details: Customer Info & Items Count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-normal text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pemesan</span>
                    <span className="font-bold text-slate-900 text-xs block">{order.customer_name}</span>
                    <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {order.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pengiriman & Item</span>
                    <span className="font-bold text-slate-900 block flex items-center gap-1 text-xs">
                      <Truck className="w-3.5 h-3.5 text-[#04593f]" />
                      {order.delivery_method}
                    </span>
                    <span className="text-slate-500 font-normal text-[11px] block mt-0.5">
                      {itemCount} tanaman • Rp {totalOrderAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Bar inside Order Card */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-amber-500" /> Klik kartu untuk detail
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" /> Detail
                    </button>

                    {(role === 'admin' || role === 'owner') && order.status === 'WAITING_PROCESS' && (
                      <button
                        onClick={() => { setSelectedOrder(null); setVerifyingOrder(order); setIsVerifyChecked(false); }}
                        disabled={approveMutation.isPending}
                        className="px-2.5 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-white" /> Verifikasi
                      </button>
                    )}

                    {(role === 'admin' || role === 'owner') && !order.packages?.length && (order.status === 'WAITING_PACKING' || order.status === 'PACKING_COMPLETED' || order.status === 'COMPLETED') && (
                      <button
                        onClick={() => setNotaOrder(order)}
                        className="px-2.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-white" /> Nota
                      </button>
                    )}

                    {(role === 'admin' || role === 'owner') && order.status === 'PACKING_COMPLETED' && order.packages?.length && (
                      <button
                        onClick={() => setShipmentPackage(order.packages?.find((pkg) => !pkg.tracking_number) || order.packages![0])}
                        className="px-2 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-[10px] font-normal whitespace-nowrap flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-white" /> Resi Package
                      </button>
                    )}

                    {(role === 'admin' || role === 'owner') && order.status === 'PACKING_COMPLETED' && !order.packages?.length && (
                      <button
                        onClick={() => setShipmentOrder(order)}
                        className="px-2.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-white" /> Resi
                      </button>
                    )}

                    {/* EDIT BUTTON (AUTO HIDDEN IF SALES & ORDER IS ALREADY VERIFIED) */}
                    {canModifySalesOrder && (
                      <button
                        onClick={() => setEditingOrder(order)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors"
                        title="Edit order"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* DELETE BUTTON WITH CONFIRMATION POPUP (AUTO HIDDEN IF SALES & ORDER IS ALREADY VERIFIED) */}
                    {canModifySalesOrder && (
                      <button
                        onClick={() => setDeletingOrder(order)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer transition-colors"
                        title="Hapus order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {verifyingOrder && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3"><CheckCircle className="w-6 h-6 text-[#04593f]" /><div><h3 className="text-sm font-black">Verifikasi Pembayaran</h3><p className="text-xs text-slate-500">{verifyingOrder.order_number}</p></div></div>
            <p className="text-xs text-slate-600">Pastikan pembayaran order ini sudah diperiksa sebelum diverifikasi.</p>
            <label className="flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" checked={isVerifyChecked} onChange={(e) => setIsVerifyChecked(e.target.checked)} /> Saya memastikan pembayaran sudah diperiksa.</label>
            <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => { setVerifyingOrder(null); setIsVerifyChecked(false); }} className="py-2.5 bg-slate-100 rounded-xl text-xs font-bold">Batal</button><button type="button" disabled={!isVerifyChecked || approveMutation.isPending} onClick={() => approveMutation.mutate(verifyingOrder.id)} className="py-2.5 bg-[#04593f] text-white rounded-xl text-xs font-bold disabled:opacity-50">{approveMutation.isPending ? 'Memproses...' : 'Ya, Verifikasi'}</button></div>
          </div>
        </div>
      )}
      {/* Delete Order Confirmation Modal Popup */}
      {deletingOrder && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 text-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Hapus Pesanan?</h3>
                <p className="text-xs text-slate-500 font-medium">{deletingOrder.order_number}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Apakah Anda yakin ingin menghapus pesanan ini secara permanen? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingOrder.id)}
                disabled={deleteMutation.isPending}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal View Detail Order */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onApprove={(id) => { const order = data?.data?.find((item: Order) => item.id === id) || selectedOrder; if (order) { setSelectedOrder(null); setVerifyingOrder(order); setIsVerifyChecked(false); } }}
        onOpenShipmentModal={(ord) => ord.packages?.length
          ? setShipmentPackage(ord.packages.find((pkg) => !pkg.tracking_number) || ord.packages[0])
          : setShipmentOrder(ord)}
        onOpenNota={(ord) => setNotaOrder(ord)}
        onEdit={(ord) => setEditingOrder(ord)}
        onDelete={(id) => setDeletingOrder(selectedOrder)}
        isActionLoading={approveMutation.isPending}
      />

      {/* Modal Edit Order */}
      <OrderEditModal
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSubmit={handleUpdateOrder}
      />

      {/* Modal Thermal Packing Nota */}
      <PackingNotaModal
        order={notaOrder}
        onClose={() => setNotaOrder(null)}
      />

      {/* Modal Complete Shipment (Input Resi) */}
      <CompleteShipmentModal
        order={shipmentOrder}
        onClose={() => setShipmentOrder(null)}
        onConfirm={handleConfirmShipment}
      />
      <CompletePackageShipmentModal
        pkg={shipmentPackage}
        onClose={() => setShipmentPackage(null)}
        onConfirm={async (packageId, payload) => {
          await packageShipmentMutation.mutateAsync({ packageId, payload });
          setShipmentPackage(null);
        }}
      />
    </div>
  );
};
