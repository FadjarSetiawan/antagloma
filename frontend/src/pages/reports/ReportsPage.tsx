import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { masterService } from '../../services/masterService';
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
  Package,
  X,
} from 'lucide-react';
import { RpIcon } from '../../components/shared/RpIcon';

export const ReportsPage: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'today'>('all');
  const [search, setSearch] = useState('');
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [showGradeReport, setShowGradeReport] = useState(false);
  const [showPlantPerformance, setShowPlantPerformance] = useState(false);
  const [showAllSoldModal, setShowAllSoldModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reports-orders-list'],
    queryFn: () => orderService.getOrders({ per_page: 500 }),
  });

  const allOrders: Order[] = data?.data || [];
  const { data: masterTrees = [] } = useQuery({
    queryKey: ['master-trees-report'],
    queryFn: () => masterService.getTrees(),
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const reportPeriodLabel = periodFilter === 'today' ? 'Hari Ini' : periodFilter === 'month' ? 'Bulan Ini' : 'Semua Waktu';

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
  // Total harga tanaman: price per item × quantity (tidak termasuk ongkir)
  const calculateOrderItemsTotal = (order: Order) => {
    return (order.items || []).reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  };

  const calculateOrderGrandTotal = (order: Order) => {
    const itemsTotal = calculateOrderItemsTotal(order);
    const shipping = Number(order.buyer_shipping_cost) || 0;
    return itemsTotal + shipping;
  };

  // Total Omset Penjualan Tanaman = hanya harga tanaman (tidak termasuk ongkir pembeli)
  const totalPlantOmzet = orders.reduce((sum, order) => sum + calculateOrderItemsTotal(order), 0);

  // Total Paket Dikirim = jumlah paket yang sudah ada foto paketnya (photo_uploaded === true)
  const totalPackagesSent = orders.reduce(
    (sum, order) => sum + (order.packages || []).filter((pkg) => pkg.photo_uploaded).length,
    0
  );

  // Ongkir Dibayar Pembeli
  const totalShippingCost = orders.reduce(
    (sum, order) => sum + (Number(order.buyer_shipping_cost) || 0),
    0
  );

  // Ongkir Ekspedisi (yang dibayarkan ke jasa kirim saat input resi)
  const totalExpeditionShipping = orders.reduce(
    (sum, order) => sum + (order.packages?.length
      ? order.packages.reduce((packageSum, pkg) => packageSum + (Number((pkg as any).shipping_cost) || 0), 0)
      : Number((order as any).shipping_cost) || 0),
    0
  );

  // Selisih Ongkir = ongkir dibayar pembeli - ongkir ekspedisi
  const totalShippingDifference = totalShippingCost - totalExpeditionShipping;

  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'PACKING_COMPLETED').length;
  const completionRate = totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0;

  // Total Tanaman Terjual = jumlah qty semua item
  const totalPlantsCount = orders.reduce(
    (sum, order) => sum + (order.items || []).reduce((iSum, it) => iSum + (Number(it.quantity) || 1), 0),
    0
  );

  const gradeSummary = Object.values(
    orders.reduce<Record<string, { grade: string; quantity: number; omzet: number }>>((summary, order) => {
      (order.items || []).forEach((item) => {
        const grade = item.grade?.trim() || 'Tanpa Grade';
        const quantity = Number(item.quantity) || 0;
        const omzet = (Number(item.price) || 0) * quantity;
        const current = summary[grade] || { grade, quantity: 0, omzet: 0 };
        current.quantity += quantity;
        current.omzet += omzet;
        summary[grade] = current;
      });
      return summary;
    }, {})
  ).sort((a, b) => a.grade.localeCompare(b.grade, 'id'));

  const plantSales = orders.reduce<Record<string, { code: string; name: string; quantity: number; omzet: number }>>((summary, order) => {
    (order.items || []).forEach((item) => {
      const code = item.tree_code || item.product_name;
      if (!code) return;
      const quantity = Number(item.quantity) || 0;
      const current = summary[code] || { code, name: item.tree_name || item.product_name, quantity: 0, omzet: 0 };
      current.quantity += quantity;
      current.omzet += (Number(item.price) || 0) * quantity;
      summary[code] = current;
    });
    return summary;
  }, {});
  const soldPlants = Object.values(plantSales).sort((a, b) => b.quantity - a.quantity || b.omzet - a.omzet);
  const unsoldPlants = masterTrees.filter((tree) => !plantSales[tree.code]);

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
      <div className="bg-gradient-to-br from-[#04593f] via-[#04593f] to-emerald-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg relative overflow-hidden space-y-4 border border-emerald-950 font-sans">
        {/* Background Decorative Accent */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Main Omset Figure */}
        <div className="border-b border-emerald-800/80 pb-4 space-y-2 relative z-10">
          <span className="text-[10px] uppercase font-extrabold text-emerald-200 tracking-wider block">
            TOTAL OMZET PENJUALAN TANAMAN
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {isLoading ? '...' : `Rp ${totalPlantOmzet.toLocaleString('id-ID')}`}
          </h2>
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-xs border border-white/15 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-100 shadow-2xs">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
            <span>{completedOrdersCount} Pesanan Selesai ({completionRate}%)</span>
          </div>
        </div>

        {/* Sub-Metrics 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs relative z-10">
          {/* Total Pesanan */}
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 flex items-center gap-2 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] text-emerald-200/80 font-medium block truncate">Total Pesanan</span>
              <span className="text-xs font-bold text-white block mt-0.5 truncate">{totalOrdersCount} Pesanan</span>
            </div>
          </div>

          {/* Total Tanaman Terjual */}
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 flex items-center gap-2 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] text-emerald-200/80 font-medium block truncate">Tanaman Terjual</span>
              <span className="text-xs font-bold text-white block mt-0.5 truncate">{totalPlantsCount} Pohon</span>
            </div>
          </div>

          {/* Total Paket Dikirim */}
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 flex items-center gap-2 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Package className="w-3.5 h-3.5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] text-emerald-200/80 font-medium block truncate">Paket Dikirim</span>
              <span className="text-xs font-bold text-white block mt-0.5 truncate">{totalPackagesSent} Paket</span>
            </div>
          </div>

          {/* Ongkir Dibayar Pembeli */}
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 flex items-center gap-2 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Truck className="w-3.5 h-3.5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] text-emerald-200/80 font-medium block truncate">Ongkir Pembeli</span>
              <span className="text-xs font-bold text-white block mt-0.5 truncate">Rp {totalShippingCost.toLocaleString('id-ID')}</span>
            </div>
          </div>
          {/* Selisih Ongkir — full width */}
          <div className="col-span-2 bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 flex items-center gap-2.5 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <RpIcon className="w-3.5 h-3.5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] text-emerald-200/80 font-medium block truncate">Selisih Ongkir
                <span className="ml-1 text-emerald-200 font-normal">(Pembeli − Ekspedisi)</span>
              </span>
              <span className={`text-xs font-bold block mt-0.5 truncate ${
                totalShippingDifference >= 0 ? 'text-white' : 'text-rose-200'
              }`}>
                {totalShippingDifference >= 0 ? '+' : '-'}Rp {Math.abs(totalShippingDifference).toLocaleString('id-ID')}
              </span>
            </div>
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

      {/* Plant Performance */}
      <button
        type="button"
        onClick={() => setShowPlantPerformance((visible) => !visible)}
        className="w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between text-left shadow-2xs hover:border-[#04593f] transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-900">Performa ID Tanaman</span>
            <span className="block text-[10px] sm:text-[11px] text-slate-400 mt-0.5">ID tanaman paling laku dan yang belum terjual</span>
          </span>
        </span>
        <span className="text-xl text-slate-400" aria-hidden="true">{showPlantPerformance ? '⌃' : '›'}</span>
      </button>

      {showPlantPerformance && <div className="space-y-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div><h2 className="text-sm font-bold text-[#04593f]">ID Tanaman Paling Laku</h2><p className="text-[10px] text-slate-400 mt-0.5">{soldPlants.length} ID terjual pada periode ini</p></div>
          </div>
          {soldPlants.length === 0 ? (
            <p className="py-5 text-center text-xs text-slate-400">Belum ada ID tanaman terjual.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] sm:text-xs">
                <thead className="bg-emerald-50 text-[#04593f] font-bold">
                  <tr>
                    <th className="px-2 py-2 w-12 text-center">Rank</th>
                    <th className="px-2 py-2 w-16">ID</th>
                    <th className="px-2 py-2">Nama Tanaman</th>
                    <th className="px-2 py-2 text-right">Terjual</th>
                    <th className="px-2 py-2 text-right w-24">Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {soldPlants.slice(0, 5).map((plant, index) => (
                    <tr key={plant.code} className="hover:bg-slate-50/50">
                      <td className="px-2 py-2.5 text-center font-extrabold text-slate-900">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </td>
                      <td className="px-2 py-2.5 font-bold text-slate-900 break-words">{plant.code}</td>
                      <td className="px-2 py-2.5 text-slate-600 font-medium break-words leading-tight">{plant.name}</td>
                      <td className="px-2 py-2.5 text-right font-bold text-[#04593f] whitespace-nowrap">{plant.quantity} Phn</td>
                      <td className="px-2 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">Rp {plant.omzet.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {soldPlants.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllSoldModal(true)}
              className="w-full text-center text-xs font-bold text-[#04593f] hover:underline cursor-pointer mt-2 py-1"
            >
              Lihat {soldPlants.length} ID Terjual
            </button>
          )}
        </div>
        <div className="bg-white border border-orange-200/80 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-orange-700">ID Belum Terjual</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">ID tanaman yang belum ada penjualan pada periode ini.</p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 text-xs font-bold flex-shrink-0">
              {unsoldPlants.length} ID
            </span>
          </div>
          {unsoldPlants.length === 0 ? (
            <p className="text-xs text-slate-400">Semua ID sudah memiliki penjualan.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {unsoldPlants.slice(0, 15).map((tree) => (
                <span key={tree.id} className="px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-100 text-[10px] font-bold text-orange-700">
                  {tree.code}
                </span>
              ))}
              {unsoldPlants.length > 15 && (
                <span className="px-2.5 py-1 text-[10px] font-bold text-orange-500">...</span>
              )}
            </div>
          )}
        </div>
      </div>}

      {/* Grade Sales Summary */}
      <button
        type="button"
        onClick={() => setShowGradeReport((visible) => !visible)}
        className="w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between text-left shadow-2xs hover:border-[#04593f] transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-900">Penjualan Per Grade</span>
            <span className="block text-[10px] sm:text-[11px] text-slate-400 mt-0.5">Ringkasan penjualan berdasarkan grade tanaman</span>
          </span>
        </span>
        <span className="text-xl text-slate-400" aria-hidden="true">{showGradeReport ? '⌃' : '›'}</span>
      </button>

      {showGradeReport && <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">Laporan Penjualan {reportPeriodLabel} – Per Grade</h2>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
            Ringkasan penjualan berdasarkan grade tanaman pada periode yang dipilih.
          </p>
        </div>

        {gradeSummary.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">Belum ada tanaman terjual pada periode ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] sm:text-xs">
              <thead className="bg-emerald-50 text-[#04593f] font-bold">
                <tr>
                  <th className="px-2 py-2 rounded-l-xl">Grade</th>
                  <th className="px-2 py-2 text-right">Terjual</th>
                  <th className="px-2 py-2 text-right">Harga Satuan</th>
                  <th className="px-2 py-2 text-right rounded-r-xl w-24">Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gradeSummary.map((row) => (
                  <tr key={row.grade} className="text-slate-700 hover:bg-slate-50/50">
                    <td className="px-2 py-2.5 font-bold text-slate-900">Grade {row.grade}</td>
                    <td className="px-2 py-2.5 text-right font-semibold text-slate-700">{row.quantity} Phn</td>
                    <td className="px-2 py-2.5 text-right font-medium text-slate-500">Rp {Math.round(row.quantity > 0 ? row.omzet / row.quantity : 0).toLocaleString('id-ID')}</td>
                    <td className="px-2 py-2.5 text-right font-bold text-slate-900">Rp {row.omzet.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-50 font-bold text-[#04593f]">
                <tr>
                  <td className="px-2 py-2 rounded-l-xl">Total</td>
                  <td className="px-2 py-2 text-right">{gradeSummary.reduce((sum, row) => sum + row.quantity, 0)} Phn</td>
                  <td className="px-2 py-2 text-right">-</td>
                  <td className="px-2 py-2 text-right rounded-r-xl">Rp {gradeSummary.reduce((sum, row) => sum + row.omzet, 0).toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>}

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

      {/* Pop-up Modal: Daftar Lengkap ID Tanaman Terjual */}
      {showAllSoldModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 font-sans animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-base font-extrabold text-[#04593f]">Daftar ID Tanaman Terjual</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Total {soldPlants.length} ID tanaman terjual pada periode {reportPeriodLabel.toLowerCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllSoldModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Table (Scrollable) */}
            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50 text-[#04593f] font-bold sticky top-0 shadow-2xs">
                  <tr>
                    <th className="px-3 py-2.5 w-14 text-center rounded-l-xl">Rank</th>
                    <th className="px-3 py-2.5 w-20">ID</th>
                    <th className="px-3 py-2.5">Nama Tanaman</th>
                    <th className="px-3 py-2.5 text-right w-24">Terjual</th>
                    <th className="px-3 py-2.5 text-right w-32 rounded-r-xl">Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {soldPlants.map((plant, index) => (
                    <tr key={plant.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3 text-center font-extrabold text-slate-900">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </td>
                      <td className="px-3 py-3 font-extrabold text-[#04593f]">{plant.code}</td>
                      <td className="px-3 py-3 text-slate-700 font-bold leading-tight">{plant.name}</td>
                      <td className="px-3 py-3 text-right font-extrabold text-[#04593f] whitespace-nowrap">
                        {plant.quantity} Pohon
                      </td>
                      <td className="px-3 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                        Rp {plant.omzet.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllSoldModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
