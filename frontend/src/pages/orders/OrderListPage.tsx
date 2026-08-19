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
import { ReturnOrderModal } from '../../components/orders/ReturnOrderModal';
import { CustomSelect } from '../../components/shared/CustomSelect';
import { CustomDatePickerModal } from '../../components/shared/CustomDatePickerModal';
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
  User,
  Truck,
  Lightbulb,
  FileText,
  AlertTriangle,
  XCircle,
  Info,
  RotateCcw,
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
  const [orderDateFilter, setOrderDateFilter] = useState(paramOrderDate);

  useEffect(() => {
    setSearch(paramSearch);
    setStatusFilter(paramStatus);
    setOrderDateFilter(paramOrderDate);
  }, [paramSearch, paramStatus, paramOrderDate]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [notaOrder, setNotaOrder] = useState<Order | null>(null);
  const [shipmentOrder, setShipmentOrder] = useState<Order | null>(null);
  const [shipmentPackage, setShipmentPackage] = useState<OrderPackage | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [isVerifyChecked, setIsVerifyChecked] = useState(false);
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);
  const role = user?.role;

  const { data, isLoading } = useQuery({
    queryKey: ['orders-list', search, statusFilter, orderDateFilter, role],
    queryFn: async () => {
      // Fetch orders
      const isAdminProgressFilter = ['ADMIN_NOT_CONFIGURED', 'ADMIN_PARTIALLY_CONFIGURED', 'ADMIN_WAITING_PHOTO'].includes(statusFilter);
      const res = await orderService.getOrders({ search, status: (statusFilter === 'COMPLETED' || isAdminProgressFilter) ? undefined : statusFilter, order_date: orderDateFilter || undefined, per_page: 200 });
      if (statusFilter === 'COMPLETED') {
        res.data = res.data.filter((order) => {
          if (role === 'admin') {
            // Admin: pesanan yang sudah diinput Resinya (baik status COMPLETED maupun PACKING_COMPLETED yang semua resinya terisi)
            if (order.status === 'COMPLETED') return true;
            if (order.status === 'PACKING_COMPLETED') {
              if (order.packages && order.packages.length > 0) {
                return order.packages.every(pkg => pkg.tracking_number && pkg.tracking_number.trim() !== '');
              }
              return !!order.tracking_number && order.tracking_number.trim() !== '';
            }
            return false;
          } else if (role === 'sales') {
            // Sales: pesanan yang sudah diklik "Sudah di infokan" (memiliki sales_informed_at)
            return !!order.sales_informed_at;
          }
          // Default for owner or other roles: completed status
          return order.status === 'COMPLETED' || !!order.sales_informed_at;
        });
      }
      if (role === 'admin' && isAdminProgressFilter) {
        res.data = res.data.filter((order) => {
          if (order.status !== 'WAITING_PACKING') return false;
          const totalPlants = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
          const configuredPlants = (order.packages || []).reduce((sum, pkg) => sum + (pkg.items || []).reduce((packageSum, item) => packageSum + (Number(item.quantity) || 0), 0), 0);

          if (statusFilter === 'ADMIN_NOT_CONFIGURED') return configuredPlants === 0;
          if (statusFilter === 'ADMIN_PARTIALLY_CONFIGURED') return configuredPlants > 0 && configuredPlants < totalPlants;
          return totalPlants > 0 && configuredPlants >= totalPlants;
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

  const statusOptions = role === 'admin'
    ? [
      { value: '', label: 'Semua Status' },
      { value: 'WAITING_PROCESS', label: 'Menunggu Verifikasi' },
      { value: 'ADMIN_NOT_CONFIGURED', label: 'Belum Diatur' },
      { value: 'ADMIN_PARTIALLY_CONFIGURED', label: 'Sedang Diatur' },
      { value: 'ADMIN_WAITING_PHOTO', label: 'Menunggu Packing' },
      { value: 'PACKING_COMPLETED', label: 'Packing Selesai' },
      { value: 'COMPLETED', label: 'Selesai' },
      { value: 'CANCELLED', label: 'Dibatalkan' },
      { value: 'RETURNED_PARTIAL', label: 'Retur Sebagian' },
      { value: 'RETURNED', label: 'Retur Selesai' },
    ]
    : [
      { value: '', label: 'Semua Status' },
      { value: 'WAITING_PROCESS', label: 'Menunggu Diproses' },
      { value: 'WAITING_PACKING', label: 'Menunggu Packing' },
      { value: 'PACKING_COMPLETED', label: 'Packing Selesai' },
      { value: 'COMPLETED', label: 'Selesai' },
      { value: 'CANCELLED', label: 'Dibatalkan' },
    ];

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-800 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor order, nama customer, atau WA..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 shadow-2xs"
          />
        </div>

        {/* Filters Row: Status Dropdown & Custom Styled Date Picker */}
        <div className="flex gap-2 items-center w-full">
          <div className="flex-1 min-w-0">
            <CustomSelect
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Semua Status"
            />
          </div>

          <div className="relative flex-shrink-0">
            {/* Custom Styled Calendar Button */}
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              className={`flex items-center justify-center w-11 h-11 bg-white border rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95 ${
                orderDateFilter ? 'border-[#04593f] ring-2 ring-emerald-600/20 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title="Pilih Tanggal"
            >
              <Calendar className={`w-4 h-4 ${orderDateFilter ? 'text-[#04593f]' : 'text-slate-500'}`} />
            </button>

            {/* Active Date Badge / Clear Indicator */}
            {orderDateFilter && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-lg text-[10px] flex items-center gap-1.5 whitespace-nowrap z-50 animate-in fade-in duration-100">
                <span className="font-bold text-[#04593f]">
                  {new Date(orderDateFilter).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
                <button
                  type="button"
                  onClick={() => setOrderDateFilter('')}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
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
                <span>Buat Order Baru</span>
              </button>
            )}
          </div>
        ) : (
          /* List of Orders */
          data?.data?.map((order: Order) => {
            const itemCount = order.items ? order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0) : 0;
            const plantTotalPrice = order.items ? order.items.reduce((sum: number, item: OrderItem) => sum + item.price, 0) : 0;
            const totalOrderAmount = plantTotalPrice + (order.buyer_shipping_cost || 0);
            const configuredPlantCount = (order.packages || []).reduce((sum, pkg) => sum + (pkg.items || []).reduce((packageSum, item) => packageSum + (Number(item.quantity) || 0), 0), 0);
            const remainingPlantCount = Math.max(0, itemCount - configuredPlantCount);
            // Sales should also see that an order is being arranged in stages,
            // but only Admin gets the operational allocation breakdown.
            const isPartiallyConfigured =
              (role === 'admin' || role === 'sales') &&
              order.status === 'WAITING_PACKING' &&
              configuredPlantCount > 0 &&
              remainingPlantCount > 0;
            const isNotConfigured = role === 'admin' && order.status === 'WAITING_PACKING' && configuredPlantCount === 0;
            const isWaitingPackingPhoto = role === 'admin' && order.status === 'WAITING_PACKING' && itemCount > 0 && configuredPlantCount >= itemCount;
            const hasPackages = Boolean(order.packages?.length);
            const allPackageTrackingCompleted = hasPackages && order.packages!.every((pkg) => Boolean(pkg.tracking_number?.trim()));
            const orderTrackingCompleted = !hasPackages && Boolean(order.tracking_number?.trim());
            const hasCompletedTracking = allPackageTrackingCompleted || orderTrackingCompleted;
            const canViewTracking = (order.status === 'PACKING_COMPLETED' || order.status === 'COMPLETED') && hasCompletedTracking;
            const canInputTracking = order.status === 'PACKING_COMPLETED' && !hasCompletedTracking;

            // Admin/owner may make corrections only until the package is waiting
            // for a photo. Once packing is complete or delivery is complete,
            // the order must remain immutable and the pencil is hidden.
            const canModifySalesOrder =
              (role === 'admin' || role === 'owner') &&
              ['WAITING_PROCESS', 'WAITING_PACKING'].includes(order.status);
            const canDeleteOrder = role === 'owner';

            if (order.status === 'CANCELLED') {
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white border-2 border-rose-200 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm hover:border-rose-300 transition-all cursor-pointer relative font-sans"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base block">{order.order_number}</span>
                      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {order.order_date}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shrink-0">
                      Pembayaran Ditolak
                    </span>
                  </div>

                  {/* Customer & Delivery */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Customer:</span>
                      <span className="font-bold text-slate-900">{order.customer_name} ({order.phone})</span>
                    </div>
                    {(role === 'admin' || role === 'owner') && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Sales:</span>
                        <span className="font-bold text-[#04593f]">{order.creator?.name || 'Tidak diketahui'}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Metode Pengiriman:</span>
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-emerald-800" />
                        {order.delivery_method}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Alert Box */}
                  <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-100/90 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-800 font-medium flex-1">
                      <p className="font-bold text-rose-900 text-xs sm:text-sm">Pembayaran ditolak oleh Admin</p>
                      <p className="text-slate-700 font-medium">
                        <span className="font-bold">Alasan:</span> {order.rejection_reason || 'Nominal transfer tidak sesuai'}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                        Pesanan dibatalkan. Jika ingin melanjutkan pembelian, pelanggan harus membuat pesanan baru.
                      </p>
                    </div>
                  </div>

                  {/* Items Breakdown Box */}
                  {order.items && order.items.length > 0 && (
                    <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        RINCIAN BARANG RANGKAIAN ({order.items.length} ITEM):
                      </p>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>• {item.product_name} {item.variant ? `(${item.variant})` : ''}</span>
                            <span className="text-slate-600 font-semibold">— {item.quantity} Qty</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold text-slate-800">Total Pesanan</span>
                      <span className="font-black text-emerald-900">Rp {totalOrderAmount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold text-slate-800">Komisi Anda</span>
                      <span className="font-black text-rose-600">Rp 0</span>
                    </div>
                  </div>

                  {/* Notice Footer */}
                  <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl flex items-center gap-2 text-[11px] font-medium text-rose-900">
                    <Info className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Pesanan ini dibatalkan karena pembayaran ditolak.</span>
                  </div>
                </div>
              );
            }

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
                  {isPartiallyConfigured ? (
                    <div className="rounded-xl bg-amber-100 border border-amber-300 px-2.5 py-1 text-right leading-tight shrink-0">
                      <span className="block text-[10px] font-black text-amber-950">Sedang Diatur ({configuredPlantCount}/{itemCount})</span>
                      {role === 'admin' && <span className="block text-[9px] font-semibold text-amber-800 mt-0.5">{configuredPlantCount} tanaman siap cetak nota</span>}
                    </div>
                  ) : isNotConfigured ? (
                    <span className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">Belum Diatur</span>
                  ) : isWaitingPackingPhoto ? (
                    <span className="rounded-xl bg-amber-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">Menunggu Packing</span>
                  ) : <OrderStatusBadge status={order.status} />}
                </div>

                {isPartiallyConfigured && role === 'admin' && (
                  <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-[10px]">
                    <div className="flex items-center gap-1.5 text-amber-950 min-w-0"><PackageCheck className="w-4 h-4 text-[#04593f] shrink-0" /><div><p className="font-extrabold">Progress Pengaturan</p><p className="font-medium text-amber-800">{configuredPlantCount} dari {itemCount} tanaman diatur</p></div></div>
                    <div className="border-l border-amber-200 pl-2"><p className="font-extrabold text-[#04593f]">✓ Sudah Diatur</p><p className="font-semibold text-slate-600 mt-0.5">{configuredPlantCount} tanaman</p></div>
                    <div className="border-l border-amber-200 pl-2"><p className="font-extrabold text-amber-800">◷ Belum Diatur</p><p className="font-semibold text-slate-600 mt-0.5">{remainingPlantCount} tanaman</p></div>
                  </div>
                )}

                {/* Body Details: Customer Info & Items Count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-normal text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pemesan</span>
                    <span className="font-bold text-slate-900 text-xs block">{order.customer_name}</span>
                    <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {order.phone}
                    </span>
                    {(role === 'admin' || role === 'owner') && (
                      <span className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-[#04593f]">
                        <User className="h-3 w-3" /> Sales: {order.creator?.name || 'Tidak diketahui'}
                      </span>
                    )}
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

                    {(role === 'admin' || role === 'owner' || role === 'sales') && canViewTracking && (
                      <button
                        onClick={() => setTrackingOrder(order)}
                        className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-white" /> Lihat Resi
                      </button>
                    )}

                    {(role === 'admin' || role === 'owner') && order.status === 'COMPLETED' && (
                      <button type="button" onClick={() => setReturningOrder(order)} className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <RotateCcw className="w-3.5 h-3.5" /> Retur
                      </button>
                    )}

                    {(role === 'admin' || role === 'owner') && canInputTracking && order.packages?.length && (
                      <button
                        onClick={() => setShipmentPackage(order.packages!.find((pkg) => !pkg.tracking_number?.trim()) || order.packages![0])}
                        className="px-2.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-white" /> Input Resi
                      </button>
                    )}

                    {(role === 'admin' || role === 'owner') && canInputTracking && !order.packages?.length && (
                      <button
                        onClick={() => setShipmentOrder(order)}
                        className="px-2.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-white" /> Input Resi
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
                    {canDeleteOrder && (
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
        onDelete={role === 'owner' ? (() => setDeletingOrder(selectedOrder)) : undefined}
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
      <ReturnOrderModal order={returningOrder} onClose={() => setReturningOrder(null)} onConfirm={async (payload) => {
        await orderService.returnOrder(returningOrder!.id, payload);
        queryClient.invalidateQueries({ queryKey: ['orders-list'] });
        setReturningOrder(null);
      }} />

      {trackingOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" onClick={() => setTrackingOrder(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Resi Pengiriman</p>
                <h3 className="mt-0.5 text-base font-extrabold text-slate-900">{trackingOrder.order_number}</h3>
              </div>
              <button type="button" onClick={() => setTrackingOrder(null)} className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200">
                Tutup
              </button>
            </div>

            <div className="space-y-2.5">
              {trackingOrder.packages?.length ? trackingOrder.packages.map((pkg) => (
                <div key={pkg.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-700">Paket {pkg.letter}</span>
                    <span className="text-sm font-extrabold tracking-wide text-emerald-800">{pkg.tracking_number || '-'}</span>
                  </div>
                  {pkg.shipping_cost != null && <p className="mt-1 text-xs text-slate-500">Ongkir: Rp{Number(pkg.shipping_cost).toLocaleString('id-ID')}</p>}
                </div>
              )) : (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                  <p className="text-sm font-extrabold tracking-wide text-emerald-800">{trackingOrder.tracking_number || '-'}</p>
                  {trackingOrder.shipping_cost != null && <p className="mt-1 text-xs text-slate-500">Ongkir: Rp{Number(trackingOrder.shipping_cost).toLocaleString('id-ID')}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Date Picker Modal */}
      <CustomDatePickerModal
        isOpen={isDatePickerOpen}
        value={orderDateFilter}
        onChange={(val) => setOrderDateFilter(val)}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </div>
  );
};
