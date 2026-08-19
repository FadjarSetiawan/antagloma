import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { masterService } from '../../services/masterService';
import { managementService } from '../../services/managementService';
import { Order } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { CustomDatePickerModal } from '../../components/shared/CustomDatePickerModal';
import { CustomSelect } from '../../components/shared/CustomSelect';
import {
  TrendingUp,
  ShoppingBag,
  CheckCircle,
  Download,
  Wallet,
  FileText,
  Phone,
  Truck,
  ArrowUpRight,
  Filter,
  Calendar as CalendarIcon,
  Search,
  Eye,
  PieChart,
  Package,
  UserRound,
  Percent,
  X,
} from 'lucide-react';
import { RpIcon } from '../../components/shared/RpIcon';

export const ReportsPage: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'date' | 'month' | 'year'>('month');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [selectedSalesId, setSelectedSalesId] = useState('all');
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [showGradeReport, setShowGradeReport] = useState(false);
  const [showPlantPerformance, setShowPlantPerformance] = useState(false);
  const [showAllSoldModal, setShowAllSoldModal] = useState(false);

  const reportParams = useMemo(() => {
    if (periodFilter === 'date') return { order_date: selectedDate };
    if (periodFilter === 'month') {
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const month = String(selectedMonth).padStart(2, '0');
      return { date_from: `${selectedYear}-${month}-01`, date_to: `${selectedYear}-${month}-${lastDay}` };
    }
    if (periodFilter === 'year') return { date_from: `${selectedYear}-01-01`, date_to: `${selectedYear}-12-31` };
    return {};
  }, [periodFilter, selectedDate, selectedMonth, selectedYear]);

  const { data, isLoading } = useQuery({
    queryKey: ['reports-orders-list', reportParams],
    queryFn: () => orderService.getOrders({ per_page: 500, ...reportParams }),
  });

  const allOrders: Order[] = data?.data || [];
  const { data: masterTrees = [] } = useQuery({
    queryKey: ['master-trees-report'],
    queryFn: () => masterService.getTrees(),
  });
  const { data: salesResponse } = useQuery({
    queryKey: ['reports-sales-list'],
    queryFn: () => managementService.getCommissions(),
  });
  const salesList = salesResponse?.data || [];

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const reportPeriodLabel = periodFilter === 'date'
    ? new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : periodFilter === 'month'
      ? `${monthNames[selectedMonth - 1]} ${selectedYear}`
      : periodFilter === 'year'
        ? `Tahun ${selectedYear}`
        : 'Semua Waktu';

  // The API already applies the selected period. Keep this unfiltered set for
  // the sales-percentage denominator, so selecting one sales person does not
  // incorrectly make their share read 100%.
  const periodOrders = allOrders;

  // Filter the visible report by sales person and search text.
  const orders = allOrders.filter((o) => {
    if (selectedSalesId !== 'all' && String(o.creator?.id) !== selectedSalesId) return false;
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
    const gross = (order.items || []).reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
    return Math.max(0, gross - (Number(order.return_total) || 0));
  };

  const calculateOrderReturnTotal = (order: Order) => Number(order.return_total) || 0;

  const calculateOrderGrandTotal = (order: Order) => {
    const itemsTotal = calculateOrderItemsTotal(order);
    const shipping = Number(order.buyer_shipping_cost) || 0;
    return itemsTotal + shipping;
  };

  // Total Omset Penjualan Tanaman = hanya harga tanaman (tidak termasuk ongkir pembeli)
  const totalPeriodPlantOmzet = periodOrders.reduce((sum, order) => sum + calculateOrderItemsTotal(order), 0);
  const totalPlantOmzet = orders.reduce((sum, order) => sum + calculateOrderItemsTotal(order), 0);

  const calculateOrderCommission = (order: Order) => {
    const fromApi = Number((order as Order & { sales_commission?: number }).sales_commission);
    if (Number.isFinite(fromApi) && fromApi >= 0) return fromApi;
    const isVerified = order.status !== 'WAITING_PROCESS' && order.status !== 'CANCELLED';
    return isVerified
      ? Math.round(calculateOrderItemsTotal(order) * (Number(order.creator?.commission_rate) || 5) / 100)
      : 0;
  };
  const totalSalesCommission = orders.reduce((sum, order) => sum + calculateOrderCommission(order), 0);

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
  const totalReturnAmount = orders.reduce((sum, order) => sum + calculateOrderReturnTotal(order), 0);
  const estimatedNetProfit = totalPlantOmzet + totalShippingDifference - totalSalesCommission;

  const totalOrdersCount = orders.filter((o) => o.status !== 'RETURNED').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'PACKING_COMPLETED' || o.status === 'RETURNED_PARTIAL').length;
  const completionRate = totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0;

  // Total Tanaman Terjual = jumlah qty semua item
  const totalPlantsCount = orders.reduce(
    (sum, order) => sum + (order.items || []).reduce((iSum, it) => iSum + (Number(it.quantity) || 1), 0) - (Number(order.returned_item_count) || 0),
    0
  );

  const salesPerformance = useMemo(() => {
    const rows = new Map<string, { id: number | string; name: string; orderCount: number; omzet: number; commission: number; returnCount: number; returnAmount: number }>();
    (salesList || []).forEach((sales) => rows.set(String(sales.id), {
      id: sales.id,
      name: sales.name,
      orderCount: 0,
      omzet: 0,
      commission: 0,
      returnCount: 0,
      returnAmount: 0,
    }));
    periodOrders.forEach((order) => {
      const id = order.creator?.id ?? order.created_by;
      const key = String(id);
      const current = rows.get(key) || { id, name: order.creator?.name || 'Sales Staff', orderCount: 0, omzet: 0, commission: 0, returnCount: 0, returnAmount: 0 };
      current.orderCount += 1;
      current.omzet += calculateOrderItemsTotal(order);
      current.commission += calculateOrderCommission(order);
      current.returnCount += Number(order.returned_package_count) || 0;
      current.returnAmount += Number(order.return_total) || 0;
      rows.set(key, current);
    });
    return [...rows.values()]
      .filter((row) => selectedSalesId === 'all' || String(row.id) === selectedSalesId)
      .sort((a, b) => b.omzet - a.omzet)
      .map((row) => ({ ...row, percentage: totalPeriodPlantOmzet > 0 ? (row.omzet / totalPeriodPlantOmzet) * 100 : 0 }));
  }, [periodOrders, salesList, selectedSalesId, totalPeriodPlantOmzet]);

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

      {/* Period filter — the same controls used on Komisi Sales. */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-2.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0">Periode Laporan:</span>
          <div className="flex items-center gap-1 shrink-0">
            {([
              ['date', 'Harian'],
              ['month', 'Bulanan'],
              ['year', 'Tahunan'],
              ['all', 'Semua'],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => { setPeriodFilter(value); if (value === 'date') setIsDatePickerOpen(true); }} className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${periodFilter === value ? 'bg-[#04593f] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {periodFilter === 'date' && <button type="button" onClick={() => setIsDatePickerOpen(true)} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl px-3 py-2 text-xs font-extrabold text-[#04593f] cursor-pointer"><CalendarIcon className="w-4 h-4" />{reportPeriodLabel}</button>}
          {periodFilter === 'month' && <><div className="w-36"><CustomSelect options={monthNames.map((label, index) => ({ value: String(index + 1), label }))} value={String(selectedMonth)} onChange={(value) => setSelectedMonth(Number(value))} /></div><div className="w-28"><CustomSelect options={[2024, 2025, 2026, 2027, 2028].map((year) => ({ value: String(year), label: String(year) }))} value={String(selectedYear)} onChange={(value) => setSelectedYear(Number(value))} /></div></>}
          {periodFilter === 'year' && <div className="w-36"><CustomSelect options={[2024, 2025, 2026, 2027, 2028].map((year) => ({ value: String(year), label: `Tahun ${year}` }))} value={String(selectedYear)} onChange={(value) => setSelectedYear(Number(value))} /></div>}
          {periodFilter === 'all' && <span className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Semua transaksi penjualan</span>}
          <div className="w-full sm:w-48">
            <CustomSelect
              options={[{ value: 'all', label: 'Semua Sales' }, ...(salesList || []).map((sales) => ({ value: String(sales.id), label: sales.name }))]}
              value={selectedSalesId}
              onChange={setSelectedSalesId}
            />
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">Menampilkan: <b className="text-slate-700">{reportPeriodLabel}</b></span>
          <span className="text-[11px] text-slate-400 font-semibold">• <b className="text-slate-700">{selectedSalesId === 'all' ? 'Semua Sales' : (salesList || []).find((sales) => String(sales.id) === selectedSalesId)?.name || 'Sales'}</b></span>
        </div>
      </section>

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

        <div className="bg-emerald-900/70 border border-emerald-300/30 rounded-2xl p-3.5 relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-extrabold text-emerald-200 tracking-wider block">ESTIMASI LABA BERSIH</span>
              <span className="text-xl sm:text-2xl font-black text-white block mt-0.5 truncate">Rp {estimatedNetProfit.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-emerald-200/80 block">Omzet + selisih ongkir − komisi sales</span>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-emerald-200 flex-shrink-0" />
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

          {/* Komisi Sales */}
          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/15 flex items-center gap-2 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Percent className="w-3.5 h-3.5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] text-emerald-200/80 font-medium block truncate">Komisi Sales</span>
              <span className="text-xs font-bold text-white block mt-0.5 truncate">Rp {totalSalesCommission.toLocaleString('id-ID')}</span>
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

      {/* Sales performance uses omzet sales / total omzet for the active period. */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center">
              <UserRound className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Performa Sales</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Persentase = omzet sales ÷ total omzet × 100%</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{salesPerformance.length} Sales</span>
        </div>
        {salesPerformance.length === 0 ? (
          <p className="py-5 text-center text-xs text-slate-400">Belum ada data penjualan sales pada periode ini.</p>
        ) : (
          <div className="space-y-3">
            {salesPerformance.map((sales, index) => (
              <div key={String(sales.id)} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-emerald-50 text-[#04593f] flex items-center justify-center text-xs font-black">{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-900 truncate">{sales.name}</span>
                      <span className="block text-[10px] text-slate-400">{sales.orderCount} pesanan</span>
                      <span className={`block text-[10px] ${sales.returnCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Retur: {sales.returnCount > 0 ? `${sales.returnCount} paket · Rp ${sales.returnAmount.toLocaleString('id-ID')}` : 'Tidak ada'}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 whitespace-nowrap">Rp {sales.omzet.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-[#04593f] rounded-full" style={{ width: `${Math.min(100, Math.max(0, sales.percentage))}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-[#04593f] w-12 text-right">{sales.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}
      </section>

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
      <CustomDatePickerModal isOpen={isDatePickerOpen} value={selectedDate} onChange={setSelectedDate} onClose={() => setIsDatePickerOpen(false)} />
    </div>
  );
};
