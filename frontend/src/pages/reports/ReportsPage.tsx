import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import {
  TrendingUp,
  ShoppingBag,
  CheckCircle,
  Calendar,
  Download,
  Wallet,
  FileText,
  Phone,
  Truck,
  ArrowUpRight,
  Filter,
  Search,
  Eye,
  PieChart,
  DollarSign,
  Package,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'today'>('all');
  const [search, setSearch] = useState('');
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reports-orders-list'],
    queryFn: () => orderService.getOrders({ per_page: 500 }),
  });

  const allOrders: Order[] = data?.data || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Filter orders by period
  const orders = allOrders.filter((o) => {
    // Period filter
    if (periodFilter === 'today' && o.order_date !== todayStr) return false;
    if (periodFilter === 'month' && !o.order_date?.startsWith(currentMonthStr)) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNumber = o.order_number?.toLowerCase().includes(q);
      const matchCustomer = o.customer_name?.toLowerCase().includes(q);
      const matchPhone = o.phone?.toLowerCase().includes(q);
      return matchNumber || matchCustomer || matchPhone;
    }

    return true;
  });

  // Financial Calculations
  const calculateOrderGrandTotal = (order: Order) => {
    const itemsTotal = (order.items || []).reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0
    );
    const shipping = order.delivery_method === 'Kirim Paket' ? Number(order.buyer_shipping_cost) || 0 : 0;
    return itemsTotal + shipping;
  };

  const calculateOrderItemsTotal = (order: Order) => {
    return (order.items || []).reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
      0
    );
  };

  const totalOmzet = orders.reduce((sum, order) => sum + calculateOrderGrandTotal(order), 0);
  const totalPlantOmzet = orders.reduce((sum, order) => sum + calculateOrderItemsTotal(order), 0);
  const totalShippingCost = orders.reduce(
    (sum, order) => sum + (order.delivery_method === 'Kirim Paket' ? Number(order.buyer_shipping_cost) || 0 : 0),
    0
  );

  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'PACKING_COMPLETED').length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalOmzet / totalOrdersCount) : 0;
  const completionRate = totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0;

  const totalPlantsCount = orders.reduce(
    (sum, order) => sum + (order.items || []).reduce((iSum, it) => iSum + (Number(it.quantity) || 1), 0),
    0
  );

  // Payment Breakdown
  const bcaOmzet = orders
    .filter((o) => o.bank_name === 'BCA')
    .reduce((sum, o) => sum + calculateOrderGrandTotal(o), 0);
  const briOmzet = orders
    .filter((o) => o.bank_name === 'BRI')
    .reduce((sum, o) => sum + calculateOrderGrandTotal(o), 0);

  // CSV Export Function
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('Tidak ada data transaksi order untuk diexport.');
      return;
    }

    const headers = [
      'No Order',
      'Tanggal Order',
      'Nama Customer',
      'No Telepon',
      'Metode Pengiriman',
      'Total Harga Tanaman (Rp)',
      'Ongkir Pembeli (Rp)',
      'Grand Total (Rp)',
      'Metode Pembayaran',
      'Bank Tujuan',
      'Status Order',
      'Sales Pembuat',
    ];

    const rows = orders.map((o) => {
      const itemsTotal = calculateOrderItemsTotal(o);
      const shipping = o.delivery_method === 'Kirim Paket' ? Number(o.buyer_shipping_cost) || 0 : 0;
      const grandTotal = itemsTotal + shipping;
      const statusLabel =
        o.status === 'WAITING_PROCESS'
          ? 'Menunggu Diproses'
          : o.status === 'WAITING_PACKING'
          ? 'Menunggu Packing'
          : o.status === 'PACKING_COMPLETED'
          ? 'Packing Selesai'
          : o.status === 'COMPLETED'
          ? 'Selesai'
          : 'Dibatalkan';

      return [
        `"${o.order_number}"`,
        `"${o.order_date || ''}"`,
        `"${(o.customer_name || '').replace(/"/g, '""')}"`,
        `"${(o.phone || '').replace(/"/g, '""')}"`,
        `"${o.delivery_method || ''}"`,
        itemsTotal,
        shipping,
        grandTotal,
        `"${o.payment_method || ''}"`,
        `"${o.bank_name || ''}"`,
        `"${statusLabel}"`,
        `"${(o.creator?.name || 'Sales Staff').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateToday = new Date().toISOString().split('T')[0];

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Penjualan_Antagloma_Florist_${dateToday}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl pb-24 font-sans text-slate-900 px-1 sm:px-0">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Laporan Penjualan</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Analisis performa omset, transaksi tanaman, dan arus keuangan toko.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="w-full sm:w-auto px-4 py-2 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Export CSV Laporan</span>
        </button>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-2xl p-1 shadow-2xs w-full sm:w-auto self-start text-xs font-bold">
        <button
          onClick={() => setPeriodFilter('all')}
          className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            periodFilter === 'all'
              ? 'bg-[#04593f] text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Semua Waktu
        </button>
        <button
          onClick={() => setPeriodFilter('month')}
          className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            periodFilter === 'month'
              ? 'bg-[#04593f] text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Bulan Ini
        </button>
        <button
          onClick={() => setPeriodFilter('today')}
          className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
            periodFilter === 'today'
              ? 'bg-[#04593f] text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Hari Ini
        </button>
      </div>

      {/* Executive Financial Summary Hero Card */}
      <div className="bg-[#04593f] text-white rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden space-y-4">
        {/* Background Decorative Accent */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-700/60 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider block">
              TOTAL OMZET PENJUALAN
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">
              {isLoading ? '...' : `Rp ${totalOmzet.toLocaleString('id-ID')}`}
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-emerald-900/60 border border-emerald-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-100">
            <TrendingUp className="w-4 h-4 text-emerald-300" />
            <span>{completedOrdersCount} Pesanan Selesai ({completionRate}%)</span>
          </div>
        </div>

        {/* Quick Sub-Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-0.5">
          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
            <span className="text-[10px] text-emerald-200/80 font-medium block">Total Order</span>
            <span className="text-base font-bold text-white block mt-0.5">{totalOrdersCount} Transaksi</span>
          </div>

          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
            <span className="text-[10px] text-emerald-200/80 font-medium block">Total Tanaman</span>
            <span className="text-base font-bold text-white block mt-0.5">{totalPlantsCount} Pohon</span>
          </div>

          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
            <span className="text-[10px] text-emerald-200/80 font-medium block">Rata-rata Order (AOV)</span>
            <span className="text-base font-bold text-white block mt-0.5">
              Rp {avgOrderValue.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
            <span className="text-[10px] text-emerald-200/80 font-medium block">Pendapatan Tanaman</span>
            <span className="text-base font-bold text-white block mt-0.5">
              Rp {totalPlantOmzet.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Breakdown Section (Bank Breakdown & Shipping) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Transfer BCA</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-lg font-extrabold text-slate-900 block">
            Rp {bcaOmzet.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-slate-400 font-normal block">Pembayaran via Bank BCA</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Transfer BRI</span>
            <Wallet className="w-4 h-4 text-blue-800" />
          </div>
          <span className="text-lg font-extrabold text-slate-900 block">
            Rp {briOmzet.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-slate-400 font-normal block">Pembayaran via Bank BRI</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Ongkos Kirim</span>
            <Truck className="w-4 h-4 text-[#04593f]" />
          </div>
          <span className="text-lg font-extrabold text-slate-900 block">
            Rp {totalShippingCost.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-slate-400 font-normal block">Ongkir dibayar pembeli</span>
        </div>
      </div>

      {/* Transactions List Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#04593f]" />
              <span>Rincian Transaksi Penjualan</span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal mt-0.5">
              Daftar transaksi order beserta rincian nominal omset
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari order / customer..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700 text-slate-900"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs font-normal text-slate-400">
            Memuat transaksi penjualan...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-xs font-bold text-slate-700">Belum Ada Transaksi Penjualan</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Transaksi order penjualan akan tercatat otomatis di sini.</p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW (< md screens): Compact Responsive Cards */}
            <div className="space-y-2.5 md:hidden">
              {orders.map((order) => {
                const itemsTotal = calculateOrderItemsTotal(order);
                const shipping = order.delivery_method === 'Kirim Paket' ? Number(order.buyer_shipping_cost) || 0 : 0;
                const grandTotal = itemsTotal + shipping;

                return (
                  <div key={order.id} className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{order.order_number}</span>
                        <span className="text-[10px] text-slate-400">{order.order_date}</span>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer:</span>
                        <span className="font-bold text-slate-900">{order.customer_name} ({order.phone})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Metode & Bayar:</span>
                        <span className="font-medium text-slate-800">
                          {order.delivery_method} • {order.payment_method} {order.bank_name ? `(${order.bank_name})` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Grand Total Omzet</span>
                        <span className="text-sm font-extrabold text-[#04593f]">
                          Rp {grandTotal.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedDetailOrder(order)}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Detail</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW (>= md screens): Full Data Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">No Order</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Metode Pengiriman</th>
                    <th className="py-2.5 px-3">Pembayaran</th>
                    <th className="py-2.5 px-3 text-right">Total Tanaman</th>
                    <th className="py-2.5 px-3 text-right">Ongkir Pembeli</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {orders.map((order) => {
                    const itemsTotal = calculateOrderItemsTotal(order);
                    const shipping = order.delivery_method === 'Kirim Paket' ? Number(order.buyer_shipping_cost) || 0 : 0;
                    const grandTotal = itemsTotal + shipping;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900">{order.order_number}</td>
                        <td className="py-3 px-3 text-slate-500 font-normal whitespace-nowrap">{order.order_date}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{order.customer_name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{order.phone}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">{order.delivery_method}</td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {order.payment_method} {order.bank_name ? `(${order.bank_name})` : ''}
                        </td>
                        <td className="py-3 px-3 text-right font-medium">
                          Rp {itemsTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-500">
                          Rp {shipping.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-[#04593f]">
                          Rp {grandTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailOrder(order)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
      />
    </div>
  );
};
