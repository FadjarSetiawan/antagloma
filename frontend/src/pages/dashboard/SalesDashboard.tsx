import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Package, Tag, X, CheckCircle2, Clock, ChevronDown, ChevronUp, PieChart, TrendingUp, BarChart2, Trophy } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { masterService } from '../../services/masterService';
import { Order, OrderPackage } from '../../types/order';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';

const packageType = (order: Order, pkg: OrderPackage) => {
  const value = (pkg.package_type || '').trim().toLowerCase();
  if (value === 'fullset') return 'Fullset';
  if (value === 'non-fullset' || value === 'non fullset' || value === 'non_fullset') return 'Non Fullset';
  if (value === 'packing kayu') return 'Packing Kayu';
  return pkg.package_type || (order.delivery_method === 'Packing Kayu' ? 'Packing Kayu' : 'Menunggu konfigurasi Admin');
};

const hasPackagePhoto = (pkg: OrderPackage) => Boolean(pkg.photo_uploaded && pkg.packing_images?.length);
const packageLabel = (order: Order, pkg: OrderPackage) => `Paket ${pkg.letter} — ${packageType(order, pkg)}`;

export const SalesDashboard: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.hash === '#riwayat-pesanan') {
      window.requestAnimationFrame(() => document.getElementById('riwayat-pesanan')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, [location.hash]);

  const qc = useQueryClient(); const [detail, setDetail] = useState<Order | null>(null); const [photos, setPhotos] = useState<OrderPackage | null>(null); const [confirm, setConfirm] = useState<Order | null>(null); const [error, setError] = useState('');
  const ordersQuery = useQuery({ queryKey: ['sales-orders-lifecycle'], queryFn: () => orderService.getOrders({ per_page: 100 }), refetchInterval: 5000 });
  const progressQuery = useQuery({ queryKey: ['sales-packing-progress'], queryFn: () => orderService.getSalesPackingProgress({ per_page: 100 }), refetchInterval: 5000 });
  const informed = useMutation({ mutationFn: (id: number) => orderService.markSalesInformed(id), onSuccess: () => { setError(''); setConfirm(null); qc.invalidateQueries({ queryKey: ['sales-orders-lifecycle'] }); qc.invalidateQueries({ queryKey: ['sales-packing-progress'] }); }, onError: (e: any) => setError(e?.response?.data?.message || 'Gagal menandai pesanan.') });
  const orders = ordersQuery.data?.data || []; const progress = progressQuery.data?.data || [];
  const allTracked = (o: Order) => !!o.packages?.length && o.packages.every(p => !!p.tracking_number);
  const allPhotos = (o: Order) => !!o.packages?.length && o.packages.every(hasPackagePhoto);
  const waiting = orders.filter(o => o.status === 'WAITING_PACKING');
  const completed = progress.filter(o => o.status === 'PACKING_COMPLETED' && !!o.packages?.length && o.packages.every(hasPackagePhoto) && !(o.packages || []).some(p => p.tracking_number));
  const ready = progress.filter(o => o.status === 'PACKING_COMPLETED' && (o.packages || []).some(p => p.tracking_number) && !o.sales_informed_at);
  const history = orders.filter(o => o.sales_informed_at);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const todayCount = orders.filter(o => o.order_date === today).length;
  const waitingVerification = orders.filter(o => o.status === 'WAITING_PROCESS');
  const waitingConfigure = orders.filter(o => o.status === 'WAITING_PACKING' && !o.packages?.length);
  const waitingPackingOrders = orders.filter(o => o.status === 'WAITING_PACKING' && !!o.packages?.length);
  const waitingPackingPackageCount = waitingPackingOrders.reduce((sum, order) => sum + (order.packages?.length || 0), 0);
  const completedPackageCount = completed.reduce((sum, order) => sum + (order.packages?.length || 0), 0);
  const summaryCards = [
    { title: 'Menunggu Verifikasi', count: waitingVerification.length, detail: 'Semua verifikasi', icon: <Clock className="w-5 h-5" />, action: 'Lihat Order', onClick: () => window.location.assign('/orders?status=WAITING_PROCESS') },
    { title: 'Menunggu Atur Paket', count: waitingConfigure.length, detail: `${waitingConfigure.length} paket siap diatur`, icon: <Package className="w-5 h-5" />, action: 'Cek Status', onClick: () => window.location.assign('/orders?status=WAITING_PACKING') },
    { title: 'Menunggu Packing', count: waitingPackingPackageCount, detail: `${waitingPackingPackageCount} sedang dikemas`, icon: <Package className="w-5 h-5" />, action: 'Cek Antrian', onClick: () => document.getElementById('waiting-packing')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
    { title: 'Packing Selesai', count: completedPackageCount, detail: `${completedPackageCount} foto paket dikirim`, icon: <CheckCircle2 className="w-5 h-5" />, action: 'Lihat Selesai', onClick: () => document.getElementById('packing-selesai')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
  ];  const plants = (o: Order) => o.items?.map(i => `${i.product_name} ×${i.quantity}`) || [];

  // ── Grade & Plant Performance Report ──
  const [showGradeReport, setShowGradeReport] = useState(false);
  const [showPlantPerf, setShowPlantPerf] = useState(false);
  const [showAllSold, setShowAllSold] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'all' | 'month' | 'today'>('today');

  const { data: masterTrees = [] } = useQuery({
    queryKey: ['master-trees-sales'],
    queryFn: () => masterService.getTrees(),
  });

  const todayStrReport = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const reportOrders = useMemo(() => {
    return orders.filter(o => {
      if (reportPeriod === 'today') return o.order_date === todayStrReport;
      if (reportPeriod === 'month') return o.order_date?.startsWith(currentMonthStr);
      return true;
    });
  }, [orders, reportPeriod, todayStrReport, currentMonthStr]);

  const reportPeriodLabel = reportPeriod === 'today' ? 'Hari Ini' : reportPeriod === 'month' ? 'Bulan Ini' : 'Semua Waktu';

  const gradeSummary = useMemo(() => Object.values(
    reportOrders.reduce<Record<string, { grade: string; quantity: number; omzet: number }>>((acc, order) => {
      (order.items || []).forEach(item => {
        const grade = item.grade?.trim() || 'Tanpa Grade';
        const qty = Number(item.quantity) || 1;
        const price = (Number(item.price) || 0) * qty;
        const cur = acc[grade] || { grade, quantity: 0, omzet: 0 };
        cur.quantity += qty;
        cur.omzet += price;
        acc[grade] = cur;
      });
      return acc;
    }, {})
  ).sort((a, b) => a.grade.localeCompare(b.grade, 'id')), [reportOrders]);

  const plantSalesMap = useMemo(() => reportOrders.reduce<Record<string, { code: string; name: string; quantity: number; omzet: number }>>((acc, order) => {
    (order.items || []).forEach(item => {
      const code = item.tree_code || item.product_name || '';
      if (!code) return;
      const cur = acc[code] || { code, name: item.tree_name || item.product_name || code, quantity: 0, omzet: 0 };
      cur.quantity += Number(item.quantity) || 1;
      cur.omzet += (Number(item.price) || 0) * (Number(item.quantity) || 1);
      acc[code] = cur;
    });
    return acc;
  }, {}), [reportOrders]);

  const soldPlants = useMemo(() => Object.values(plantSalesMap).sort((a, b) => b.quantity - a.quantity || b.omzet - a.omzet), [plantSalesMap]);
  const unsoldPlants = useMemo(() => masterTrees.filter(t => !plantSalesMap[t.code]), [masterTrees, plantSalesMap]);

  return <div className="space-y-4 sm:space-y-5 max-w-5xl pb-24 font-sans text-slate-900 px-1 sm:px-0">
    <header><h1 className="text-lg sm:text-xl font-bold">Sales Dashboard</h1><p className="text-xs text-slate-500 mt-0.5">Pantau pesanan, packing, foto, dan resi milik Anda.</p></header>
    <button onClick={() => window.location.assign(`/orders?order_date=${today}`)} className="w-full text-left bg-[#04593f] text-white rounded-2xl p-3.5 shadow-2xs"><span className="text-xs font-bold">Pesanan Dibuat Hari Ini · {todayCount} Order</span><span className="block text-[10px] text-emerald-100 mt-1">{today}</span></button>
    <section aria-label="Ringkasan status pesanan" className="grid grid-cols-2 gap-2.5 sm:gap-3.5">{summaryCards.map(card => <article key={card.title} className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col justify-between space-y-2.5 shadow-2xs hover:border-[#04593f] hover:shadow-xs transition-all group"><div className="flex items-start justify-between gap-2"><span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center shrink-0">{card.icon}</span><strong className="text-xl sm:text-2xl leading-none text-slate-950">{card.count}</strong></div><div><h2 className="text-xs font-bold text-slate-800 leading-tight block">{card.title}</h2><p className="mt-1 flex items-center text-[10px] text-slate-400 leading-none truncate">{card.detail}</p></div><button onClick={card.onClick} className="w-full py-1.5 px-2 bg-emerald-50 group-hover:bg-[#04593f] text-[#04593f] group-hover:text-white rounded-xl text-[10px] sm:text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"><span>{card.action}</span><span aria-hidden="true">›</span></button></article>)}</section>

    {/* ── PERIOD FILTER PILL TABS ── */}
    <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-2xl p-1 shadow-2xs w-full text-xs font-bold">
      {(['today', 'month', 'all'] as const).map(p => (
        <button key={p} onClick={() => setReportPeriod(p)}
          className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
            reportPeriod === p ? 'bg-[#04593f] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
          }`}>
          {p === 'today' ? 'Hari Ini' : p === 'month' ? 'Bulan Ini' : 'Semua Waktu'}
        </button>
      ))}
    </div>

    {/* ── PENJUALAN PER GRADE ── */}
    <button type="button" onClick={() => setShowGradeReport(v => !v)}
      className="w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between text-left shadow-2xs hover:border-[#04593f] transition-colors cursor-pointer">
      <span className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center">
          <PieChart className="w-4 h-4" />
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-900">Penjualan Per Grade</span>
          <span className="block text-[10px] text-slate-400 mt-0.5">Ringkasan penjualan berdasarkan grade tanaman</span>
        </span>
      </span>
      {showGradeReport ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
    </button>

    {showGradeReport && (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-3">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">Laporan Penjualan {reportPeriodLabel} – Per Grade</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Ringkasan penjualan berdasarkan grade tanaman {reportPeriodLabel.toLowerCase()}.</p>
        </div>
        {gradeSummary.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">Belum ada tanaman terjual pada periode ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-emerald-50 text-[#04593f] font-bold">
                  <th className="px-3 py-2.5 rounded-l-xl">Grade</th>
                  <th className="px-3 py-2.5">Jumlah Terjual</th>
                  <th className="px-3 py-2.5">Harga Jual Satuan</th>
                  <th className="px-3 py-2.5 text-right rounded-r-xl">Total Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gradeSummary.map(row => (
                  <tr key={row.grade} className="text-slate-700">
                    <td className="px-3 py-3 font-bold text-slate-900">Grade {row.grade}</td>
                    <td className="px-3 py-3">{row.quantity.toLocaleString('id-ID')} Pohon</td>
                    <td className="px-3 py-3">Rp {(row.quantity > 0 ? Math.round(row.omzet / row.quantity) : 0).toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 text-right font-bold text-slate-900">Rp {row.omzet.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-50 font-bold text-[#04593f]">
                <tr>
                  <td className="px-3 py-3 rounded-l-xl">Total</td>
                  <td className="px-3 py-3">{gradeSummary.reduce((s, r) => s + r.quantity, 0).toLocaleString('id-ID')} Pohon</td>
                  <td className="px-3 py-3">–</td>
                  <td className="px-3 py-3 text-right rounded-r-xl">Rp {gradeSummary.reduce((s, r) => s + r.omzet, 0).toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    )}

    {/* ── PERFORMA ID TANAMAN ── */}
    <button type="button" onClick={() => setShowPlantPerf(v => !v)}
      className="w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between text-left shadow-2xs hover:border-[#04593f] transition-colors cursor-pointer">
      <span className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center">
          <TrendingUp className="w-4 h-4" />
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-900">Performa ID Tanaman</span>
          <span className="block text-[10px] text-slate-400 mt-0.5">ID tanaman paling laku dan yang belum terjual</span>
        </span>
      </span>
      {showPlantPerf ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
    </button>

    {showPlantPerf && (
      <div className="space-y-3">
        {/* Top 5 Ranking */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">ID TANAMAN PALING LAKU</h3>
                <p className="text-[10px] text-slate-400">Peringkat berdasarkan jumlah tanaman terjual.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-[#04593f] text-[10px] font-bold rounded-xl">
              {soldPlants.length} dari {masterTrees.length} ID<br/>
              <span className="font-normal">terjual pd periode ini</span>
            </span>
          </div>
          {soldPlants.length === 0 ? (
            <p className="py-5 text-center text-xs text-slate-400">Belum ada ID tanaman terjual.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-50 text-[#04593f] font-bold">
                    <th className="px-3 py-2 rounded-l-xl">Rank</th>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Nama Tanaman</th>
                    <th className="px-3 py-2 text-[#04593f]">Terjual (Pohon)</th>
                    <th className="px-3 py-2 text-right rounded-r-xl">Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {soldPlants.slice(0, 5).map((plant, idx) => (
                    <tr key={plant.code} className="text-slate-700">
                      <td className="px-3 py-3">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="font-bold text-slate-500">{idx + 1}</span>}
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-900">{plant.code}</td>
                      <td className="px-3 py-3">{plant.name}</td>
                      <td className="px-3 py-3 font-bold text-[#04593f]">{plant.quantity} Pohon</td>
                      <td className="px-3 py-3 text-right font-bold">Rp {plant.omzet.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {soldPlants.length > 5 && (
            <button onClick={() => setShowAllSold(v => !v)}
              className="w-full py-2 text-xs font-bold text-[#04593f] hover:underline flex items-center justify-center gap-1 cursor-pointer">
              {showAllSold ? 'Sembunyikan' : `Lihat ${soldPlants.length} ID Terjual`} ›
            </button>
          )}
        </div>

        {/* All Sold Plants */}
        {showAllSold && soldPlants.length > 5 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  ID TERJUAL
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-[#04593f] text-[10px] font-bold rounded">{soldPlants.length} ID</span>
                </h3>
                <p className="text-[10px] text-slate-400">Semua ID yang terjual pada periode ini.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-50 text-[#04593f] font-bold">
                    <th className="px-3 py-2 rounded-l-xl">ID</th>
                    <th className="px-3 py-2">Nama Tanaman</th>
                    <th className="px-3 py-2 text-[#04593f]">Terjual (Pohon)</th>
                    <th className="px-3 py-2 text-right rounded-r-xl">Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {soldPlants.map(plant => (
                    <tr key={plant.code} className="text-slate-700">
                      <td className="px-3 py-3 font-bold text-slate-900">{plant.code}</td>
                      <td className="px-3 py-3">{plant.name}</td>
                      <td className="px-3 py-3 font-bold text-[#04593f]">{plant.quantity} Pohon</td>
                      <td className="px-3 py-3 text-right font-bold">Rp {plant.omzet.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Unsold Plants */}
        <div className="bg-white border border-orange-200/80 rounded-2xl p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-orange-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-black">✕</span>
              <div>
                <h3 className="text-xs font-bold text-orange-700 flex items-center gap-2">
                  ID BELUM TERJUAL
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">{unsoldPlants.length} ID</span>
                </h3>
                <p className="text-[10px] text-slate-400">ID tanaman yang belum ada penjualan pada periode ini.</p>
              </div>
            </div>
          </div>
          {unsoldPlants.length === 0 ? (
            <p className="text-xs text-slate-400">Semua ID sudah memiliki penjualan! 🎉</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {unsoldPlants.map(tree => (
                <span key={tree.id} className="px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200 text-[10px] font-bold text-orange-700">
                  {tree.code}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-400 font-medium">Total ID Belum Terjual: {unsoldPlants.length} ID</p>
          {unsoldPlants.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <span className="text-sm">💡</span>
              <p className="text-[10px] text-amber-800 font-medium">Fokus stok dan promosi pada ID yang paling laku untuk meningkatkan penjualan.</p>
            </div>
          )}
        </div>
      </div>
    )}
    <section id="waiting-packing"><h2 className="text-sm font-bold mb-2">Menunggu Packing</h2><div className="grid grid-cols-2 auto-rows-fr gap-2.5 sm:gap-3">{waiting.length === 0 ? <Empty text="Belum ada order menunggu packing." /> : waiting.map(o => <article key={o.id} className="h-full bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs"><div className="flex flex-col gap-1.5"><div><b className="text-[11px] break-words">{o.order_number}</b><p className="font-bold text-sm mt-1">{o.customer_name}</p></div><span className="h-fit rounded-full bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-800">Menunggu Packing</span></div><div><p className="text-[10px] font-bold uppercase text-slate-400">Pesanan</p><ul className="mt-1 text-xs text-slate-600 space-y-0.5">{plants(o).map(p => <li key={p}>• {p}</li>)}</ul></div>{o.packages?.length ? <div className="text-xs"><p className="font-bold text-slate-400 mb-1">Jenis Paket</p><div className="space-y-0.5">{o.packages.map(p => <p key={p.id} className="text-slate-700">{packageLabel(o, p)}</p>)}</div></div> : null}<button onClick={() => setDetail(o)} className="self-start min-h-9 px-4 py-1.5 bg-emerald-50 text-[#04593f] rounded-xl text-[10px] font-extrabold inline-flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"><Eye className="inline w-4 h-4 mr-1" />Lihat Detail</button></article>)}</div></section>
    <section id="packing-selesai"><h2 className="text-sm font-bold mb-2">Packing Selesai</h2><div className="grid grid-cols-2 auto-rows-fr gap-2.5 sm:gap-3">{completed.length === 0 ? <Empty text="Belum ada package dengan foto." /> : completed.map(o => <OrderPackageCard key={o.id} order={o} onPhoto={setPhotos} />)}</div></section>
    <section><h2 className="text-sm font-bold mb-2 flex items-center gap-2"><Tag className="w-4 h-4 text-[#04593f]" />Daftar Pesanan Resi Terbit</h2><div className="space-y-3">{ready.length === 0 ? <Empty text="Belum ada resi package." /> : ready.map(o => <article key={o.id} className="h-full bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-2xs"><div><b className="text-xs">{o.order_number}</b><p className="font-bold text-sm">{o.customer_name}</p></div><div className="space-y-2">{o.packages?.map(p => <div key={p.id} className="rounded-lg bg-slate-50 p-3 flex justify-between gap-2"><div><b className="text-xs">{packageLabel(o, p)}</b><div className="text-xs text-slate-600 space-y-0.5">{p.items?.map(item => <p key={item.order_item_id}>• {item.product_name || 'Tanaman'} ×{item.quantity}</p>)}</div><p className="text-xs text-slate-600">{p.tracking_number ? `✓ ${p.tracking_number}` : '○ Belum Resi'}</p></div>{hasPackagePhoto(p) && <button onClick={() => setPhotos(p)} className="min-h-11 shrink-0 text-xs font-bold text-[#04593f]">Lihat Foto Paket</button>}</div>)}</div><p className="text-xs font-bold text-slate-500">{o.packages?.filter(p => p.tracking_number).length || 0}/{o.packages?.length || 0} paket sudah ada resi</p><button disabled={!allTracked(o) || !allPhotos(o) || informed.isPending} onClick={() => setConfirm(o)} className="min-h-11 w-full rounded-xl bg-[#04593f] text-white text-xs font-black disabled:bg-slate-200 disabled:text-slate-400">{allTracked(o) && allPhotos(o) ? '✓ Selesai Diinfokan' : '🔒 Selesai Diinfokan'}</button></article>)}</div></section>
    {location.hash === '#riwayat-pesanan' && <section id="riwayat-pesanan"><h2 className="text-sm font-bold mb-2">Riwayat Pesanan</h2><div className="space-y-2">{history.length === 0 ? <Empty text="Belum ada pesanan di riwayat." /> : history.map(o => <HistoryOrderCard key={o.id} order={o} onPhoto={setPhotos} />)}</div></section>}
    <OrderDetailModal order={detail} onClose={() => setDetail(null)} />
    {photos && <PhotoModal pkg={photos} onClose={() => setPhotos(null)} />}
    {confirm && <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 p-3"><div className="w-full max-w-sm bg-white rounded-2xl p-5 space-y-4"><h2 className="font-black text-lg">Semua resi & foto sudah diinformasikan ke pembeli?</h2><p className="text-xs text-slate-600">✓ Nomor resi sudah tersedia<br/>✓ Foto paket sudah tersedia</p><p className="text-xs text-slate-500">Setelah dikonfirmasi, pesanan akan masuk ke Riwayat Pesanan.</p>{error && <p className="text-xs text-rose-600 font-bold">{error}</p>}<div className="grid grid-cols-2 gap-2"><button onClick={() => {setConfirm(null);setError('')}} className="min-h-11 rounded-xl bg-slate-100 font-bold">Batal</button><button onClick={() => informed.mutate(confirm.id)} disabled={informed.isPending} className="min-h-11 rounded-xl bg-[#04593f] text-white font-black disabled:opacity-50">{informed.isPending ? 'Menyimpan...' : 'Konfirmasi'}</button></div></div></div>}
  </div>;
};

const Empty: React.FC<{ text: string }> = ({ text }) => <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs text-xs text-slate-400">{text}</div>;
const OrderPackageCard: React.FC<{ order: Order; onPhoto: (pkg: OrderPackage) => void }> = ({ order, onPhoto }) => <article className="h-full bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-2xs"><b className="text-xs">{order.order_number}</b><p className="font-bold text-sm">{order.customer_name}</p>{order.packages?.filter(hasPackagePhoto).map(p => <div key={p.id} className="rounded-lg bg-slate-50 p-3 space-y-2"><div className="flex items-center justify-between gap-2"><div><b className="text-xs">{packageLabel(order, p)}</b><div className="text-xs text-slate-600 space-y-0.5">{p.items?.map(item => <p key={item.order_item_id}>• {item.product_name || 'Tanaman'} ×{item.quantity}</p>)}</div></div><button onClick={() => onPhoto(p)} className="min-h-11 shrink-0 rounded-xl bg-[#04593f] px-3 text-white text-xs font-bold">Lihat Foto Paket</button></div></div>)}</article>;
const HistoryOrderCard: React.FC<{ order: Order; onPhoto: (pkg: OrderPackage) => void }> = ({ order, onPhoto }) => <article className="h-full bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-2xs"><div><b className="text-xs">{order.order_number}</b><p className="font-bold text-sm mt-1">{order.customer_name}</p></div>{order.packages?.length ? <div className="space-y-2">{order.packages.map(p => <div key={p.id} className="rounded-lg bg-slate-50 p-3 space-y-2"><div className="flex items-center justify-between gap-2"><b className="text-xs">{packageLabel(order, p)}</b>{hasPackagePhoto(p) && <button onClick={() => onPhoto(p)} className="min-h-11 shrink-0 text-xs font-bold text-[#04593f]">Lihat Foto Paket</button>}</div><div className="text-xs text-slate-600 space-y-0.5">{p.items?.map(item => <p key={item.order_item_id}>• {item.product_name || 'Tanaman'} ×{item.quantity}</p>)}</div><p className="text-xs text-slate-600">{p.tracking_number ? `✓ ${p.tracking_number}` : '○ Belum Resi'}</p></div>)}</div> : <div><p className="text-[10px] font-bold uppercase text-slate-400">Pesanan</p><ul className="mt-1 text-xs text-slate-600 space-y-0.5">{order.items?.map(item => <li key={item.id}>• {item.product_name} ×{item.quantity}</li>)}</ul></div>}<p className="text-xs text-emerald-700 font-bold">✓ Selesai Diinfokan</p><p className="text-[10px] text-slate-400">{order.sales_informed_at}</p></article>;
const PhotoModal: React.FC<{ pkg: OrderPackage; onClose: () => void }> = ({ pkg, onClose }) => <div className="fixed inset-0 z-[9999] bg-slate-900/60 flex items-end sm:items-center justify-center p-3"><div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4"><div className="flex justify-between items-center mb-3"><h2 className="font-black">Foto Paket {pkg.letter}</h2><button onClick={onClose} className="min-h-11 min-w-11 flex items-center justify-center"><X /></button></div><div className="grid gap-3">{pkg.packing_images?.map(img => <img key={img.id} src={img.image_url} alt={`Foto Paket ${pkg.letter}`} className="w-full rounded-xl object-contain max-h-[60vh]" />)}</div></div></div>;
