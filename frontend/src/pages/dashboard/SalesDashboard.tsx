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
  const [showWaitingPacking, setShowWaitingPacking] = useState(false);
  const [showPackingSelesai, setShowPackingSelesai] = useState(false);

  const summaryCards = [
    { title: 'Menunggu Verifikasi', count: waitingVerification.length, detail: 'Semua verifikasi', icon: <Clock className="w-5 h-5" />, action: 'Lihat Order', onClick: () => window.location.assign('/orders?status=WAITING_PROCESS') },
    { title: 'Menunggu Atur Paket', count: waitingConfigure.length, detail: `${waitingConfigure.length} paket siap diatur`, icon: <Package className="w-5 h-5" />, action: 'Cek Status', onClick: () => window.location.assign('/orders?status=WAITING_PACKING') },
    { title: 'Menunggu Packing', count: waitingPackingPackageCount, detail: `${waitingPackingPackageCount} sedang dikemas`, icon: <Package className="w-5 h-5" />, action: showWaitingPacking ? 'Tutup Antrian' : 'Cek Antrian', onClick: () => setShowWaitingPacking(v => !v) },
    { title: 'Packing Selesai', count: completedPackageCount, detail: `${completedPackageCount} foto paket dikirim`, icon: <CheckCircle2 className="w-5 h-5" />, action: showPackingSelesai ? 'Tutup Daftar' : 'Lihat Selesai', onClick: () => setShowPackingSelesai(v => !v) },
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



    {/* ── CONDITIONAL LISTS RENDERED DIRECTLY BELOW THE 2x2 CARD GRID ── */}
    {showWaitingPacking && (
      <div className="space-y-3 mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
          Daftar Antrean Menunggu Packing ({waiting.length} Order)
        </h3>
        <div className="grid grid-cols-2 auto-rows-fr gap-2.5 sm:gap-3">
          {waiting.length === 0
            ? <Empty text="Belum ada order menunggu packing." />
            : waiting.map(o => <article key={o.id} className="h-full bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs"><div className="flex flex-col gap-1.5"><div><b className="text-[11px] break-words">{o.order_number}</b><p className="font-bold text-sm mt-1">{o.customer_name}</p></div><span className="h-fit rounded-full bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-800">Menunggu Packing</span></div><div><p className="text-[10px] font-bold uppercase text-slate-400">Pesanan</p><ul className="mt-1 text-xs text-slate-600 space-y-0.5">{plants(o).map(p => <li key={p}>• {p}</li>)}</ul></div>{o.packages?.length ? <div className="text-xs"><p className="font-bold text-slate-400 mb-1">Jenis Paket</p><div className="space-y-0.5">{o.packages.map(p => <p key={p.id} className="text-slate-700">{packageLabel(o, p)}</p>)}</div></div> : null}<button onClick={() => setDetail(o)} className="self-start min-h-9 px-4 py-1.5 bg-emerald-50 text-[#04593f] rounded-xl text-[10px] font-extrabold inline-flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"><Eye className="inline w-4 h-4 mr-1" />Lihat Detail</button></article>)
          }
        </div>
      </div>
    )}

    {showPackingSelesai && (
      <div className="space-y-3 mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#04593f] inline-block" />
          Daftar Paket Selesai Packing ({completedPackageCount} Paket)
        </h3>
        <div className="grid grid-cols-2 auto-rows-fr gap-2.5 sm:gap-3">
          {completed.length === 0
            ? <Empty text="Belum ada package dengan foto." />
            : completed.map(o => <OrderPackageCard key={o.id} order={o} onPhoto={setPhotos} />)
          }
        </div>
      </div>
    )}

    {/* ── DAFTAR PESANAN RESI TERBIT ── */}
    <section>
      <h2 className="text-sm font-bold mb-2 flex items-center gap-2"><Tag className="w-4 h-4 text-[#04593f]" />Daftar Pesanan Resi Terbit</h2>
      <div className="space-y-3">{ready.length === 0 ? <Empty text="Belum ada resi package." /> : ready.map(o => <article key={o.id} className="h-full bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-2xs"><div><b className="text-xs">{o.order_number}</b><p className="font-bold text-sm">{o.customer_name}</p></div><div className="space-y-2">{o.packages?.map(p => <div key={p.id} className="rounded-lg bg-slate-50 p-3 flex justify-between gap-2"><div><b className="text-xs">{packageLabel(o, p)}</b><div className="text-xs text-slate-600 space-y-0.5">{p.items?.map(item => <p key={item.order_item_id}>• {item.product_name || 'Tanaman'} ×{item.quantity}</p>)}</div><p className="text-xs text-slate-600">{p.tracking_number ? `✓ ${p.tracking_number}` : '○ Belum Resi'}</p></div>{hasPackagePhoto(p) && <button onClick={() => setPhotos(p)} className="min-h-11 shrink-0 text-xs font-bold text-[#04593f]">Lihat Foto Paket</button>}</div>)}</div><p className="text-xs font-bold text-slate-500">{o.packages?.filter(p => p.tracking_number).length || 0}/{o.packages?.length || 0} paket sudah ada resi</p><button disabled={!allTracked(o) || !allPhotos(o) || informed.isPending} onClick={() => setConfirm(o)} className="min-h-11 w-full rounded-xl bg-[#04593f] text-white text-xs font-black disabled:bg-slate-200 disabled:text-slate-400">{allTracked(o) && allPhotos(o) ? '✓ Selesai Diinfokan' : '🔒 Selesai Diinfokan'}</button></article>)}</div>
    </section>
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
