import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Package, Tag, X, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { Order, OrderPackage } from '../../types/order';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { resolveImageUrl } from '../../utils/imageUrl';

const packageType = (order: Order, pkg: OrderPackage): string => {
  const value = (pkg.package_type || '').trim().toLowerCase();
  if (value === 'fullset') return 'Fullset';
  if (value === 'non-fullset' || value === 'non fullset' || value === 'non_fullset') return 'Non Fullset';
  if (value === 'packing kayu') return 'Packing Kayu';
  return pkg.package_type || (order.delivery_method === 'Packing Kayu' ? 'Packing Kayu' : 'Menunggu konfigurasi Admin');
};

const hasPackagePhoto = (pkg: OrderPackage): boolean => Boolean(pkg.photo_uploaded && pkg.packing_images?.length);

const packageLabel = (order: Order, pkg: OrderPackage): string => {
  const typeStr = packageType(order, pkg);
  const itemsList = pkg.items?.map(i => i.product_name || 'Tanaman').join(', ');
  return itemsList 
    ? `Paket ${pkg.letter} — ${typeStr} — ${itemsList}`
    : `Paket ${pkg.letter} — ${typeStr}`;
};

export const SalesDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.hash === '#riwayat-pesanan') {
      window.requestAnimationFrame(() => {
        document.getElementById('riwayat-pesanan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [location.hash]);

  const qc = useQueryClient();
  const [detail, setDetail] = useState<Order | null>(null);
  const [photos, setPhotos] = useState<OrderPackage | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [confirm, setConfirm] = useState<Order | null>(null);
  const [error, setError] = useState<string>('');

  const ordersQuery = useQuery({
    queryKey: ['sales-orders-lifecycle'],
    queryFn: () => orderService.getOrders({ per_page: 100 }),
    refetchInterval: 5000,
  });

  const progressQuery = useQuery({
    queryKey: ['sales-packing-progress'],
    queryFn: () => orderService.getSalesPackingProgress({ per_page: 100 }),
    refetchInterval: 5000,
  });

  const informed = useMutation({
    mutationFn: (id: number) => orderService.markSalesInformed(id),
    onSuccess: () => {
      setError('');
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ['sales-orders-lifecycle'] });
      qc.invalidateQueries({ queryKey: ['sales-packing-progress'] });
    },
    onError: (e: any) => setError(e?.response?.data?.message || 'Gagal menandai pesanan.'),
  });

  const orders: Order[] = (ordersQuery.data?.data as Order[]) || [];
  const progress: Order[] = (progressQuery.data?.data as Order[]) || [];

  const allTracked = (o: Order): boolean => !!o.packages?.length && o.packages.every(p => !!p.tracking_number);
  const allPhotos = (o: Order): boolean => !!o.packages?.length && o.packages.every(hasPackagePhoto);

  const waiting: Order[] = orders.filter((o: Order) => o.status === 'WAITING_PACKING');
  const completed: Order[] = progress.filter((o: Order) => o.status === 'PACKING_COMPLETED' && !!o.packages?.length && o.packages.every(hasPackagePhoto) && !(o.packages || []).some(p => p.tracking_number));
  const ready: Order[] = progress.filter((o: Order) => o.status === 'PACKING_COMPLETED' && (o.packages || []).some(p => p.tracking_number) && !o.sales_informed_at);
  const history: Order[] = orders.filter((o: Order) => !!o.sales_informed_at);

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const todayCount = orders.filter((o: Order) => o.order_date === today).length;
  const waitingVerification: Order[] = orders.filter((o: Order) => o.status === 'WAITING_PROCESS');

  const waitingConfigure: Order[] = orders.filter((order: Order) => {
    if (order.status !== 'WAITING_PACKING') return false;
    const orderedQuantity = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const allocatedQuantity = (order.packages || []).reduce(
      (sum, pkg) => sum + (pkg.items || []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0),
      0,
    );
    return allocatedQuantity < orderedQuantity;
  });

  const waitingPackingOrders: Order[] = orders.filter((o: Order) => o.status === 'WAITING_PACKING' && !!o.packages?.length);
  const waitingPackingPackageCount = waitingPackingOrders.reduce((sum, order) => sum + (order.packages?.length || 0), 0);
  const completedPackageCount = completed.reduce((sum, order) => sum + (order.packages?.length || 0), 0);

  const [showWaitingPacking, setShowWaitingPacking] = useState(false);
  const [showPackingSelesai, setShowPackingSelesai] = useState(false);

  const summaryCards = [
    {
      title: 'Menunggu Verifikasi',
      count: waitingVerification.length,
      detail: 'Semua verifikasi',
      icon: <Clock className="w-5 h-5" />,
      action: 'Lihat Order',
      onClick: () => navigate('/orders?status=WAITING_PROCESS'),
    },
    {
      title: 'Menunggu Atur Paket',
      count: waitingConfigure.length,
      detail: waitingConfigure.length ? `${waitingConfigure.length} order belum selesai diatur` : 'Semua paket sudah diatur',
      icon: <Package className="w-5 h-5" />,
      action: 'Cek Status',
      onClick: () => navigate('/orders?status=WAITING_PACKING'),
    },
    {
      title: 'Menunggu Packing',
      count: waitingPackingPackageCount,
      detail: `${waitingPackingPackageCount} sedang dikemas`,
      icon: <Package className="w-5 h-5" />,
      action: showWaitingPacking ? 'Tutup Antrian' : 'Cek Antrian',
      onClick: () => setShowWaitingPacking(v => !v),
    },
    {
      title: 'Packing Selesai',
      count: completedPackageCount,
      detail: `${completedPackageCount} foto paket dikirim`,
      icon: <CheckCircle2 className="w-5 h-5" />,
      action: showPackingSelesai ? 'Tutup Daftar' : 'Lihat Selesai',
      onClick: () => setShowPackingSelesai(v => !v),
    },
  ];

  const plants = (o: Order): string[] => o.items?.map(i => `${i.product_name} ×${i.quantity}`) || [];

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl pb-24 font-sans text-slate-900 px-1 sm:px-0">
      <header>
        <h1 className="font-heading text-lg sm:text-xl font-black text-slate-900 leading-tight">Sales Dashboard</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Pantau pesanan, packing, foto, dan resi milik Anda.</p>
      </header>

      {/* Pesanan Hari Ini Banner */}
      <button
        type="button"
        onClick={() => navigate(`/orders?order_date=${today}`)}
        className="w-full text-left bg-[#04593f] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-800 font-sans transition-all hover:bg-emerald-900 active:scale-[0.99] cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="font-heading text-sm sm:text-base font-extrabold text-white block">
              Pesanan Dibuat Hari Ini · {todayCount} Order
            </span>
            <span className="block text-xs text-emerald-200 font-medium mt-1">{today}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </button>

      {/* 2x2 Summary Metric Cards */}
      <section aria-label="Ringkasan status pesanan" className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {summaryCards.map(card => (
          <article
            key={card.title}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-[#04593f] hover:shadow-xs transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center shrink-0">
                {card.icon}
              </span>
              <strong className="font-heading text-xl sm:text-2xl font-black leading-none text-slate-950">
                {card.count}
              </strong>
            </div>
            <div>
              <h2 className="font-heading text-xs sm:text-sm font-bold text-slate-800 leading-tight block">{card.title}</h2>
              <p className="mt-1 flex items-center text-xs text-slate-500 leading-none truncate">{card.detail}</p>
            </div>
            <button
              type="button"
              onClick={card.onClick}
              className="w-full py-2 px-2.5 bg-emerald-50 group-hover:bg-[#04593f] text-[#04593f] group-hover:text-white rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
            >
              <span>{card.action}</span>
              <span aria-hidden="true">›</span>
            </button>
          </article>
        ))}
      </section>

      {/* Conditional: Antrean Menunggu Packing */}
      {showWaitingPacking && (
        <div className="space-y-3 mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-heading font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
            Daftar Antrean Menunggu Packing ({waiting.length} Order)
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
            {waiting.length === 0 ? (
              <Empty text="Belum ada order menunggu packing." />
            ) : (
              waiting.map(o => (
                <article key={o.id} className="h-full bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex flex-col gap-1.5">
                    <div>
                      <b className="text-xs font-bold text-slate-900 break-words">{o.order_number}</b>
                      <p className="font-heading font-bold text-sm text-slate-900 mt-0.5">{o.customer_name}</p>
                    </div>
                    <span className="h-fit rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800 self-start">
                      Menunggu Packing
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Pesanan</p>
                    <ul className="mt-1 text-xs text-slate-600 space-y-0.5 font-medium">
                      {plants(o).map(p => <li key={p}>• {p}</li>)}
                    </ul>
                  </div>
                  {o.packages?.length ? (
                    <div className="text-xs">
                      <p className="font-bold text-slate-400 mb-1">Jenis Paket</p>
                      <div className="space-y-0.5">
                        {o.packages.map(p => <p key={p.id} className="text-slate-700 font-medium">{packageLabel(o, p)}</p>)}
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setDetail(o)}
                    className="self-start min-h-9 px-4 py-1.5 bg-emerald-50 text-[#04593f] hover:bg-emerald-100 rounded-xl text-xs font-heading font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat Detail</span>
                  </button>
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {/* Conditional: Daftar Paket Selesai Packing */}
      {showPackingSelesai && (
        <div className="space-y-3 mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-heading font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#04593f] inline-block" />
            Daftar Paket Selesai Packing ({completedPackageCount} Paket)
          </h3>
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
            {completed.length === 0 ? (
              <Empty text="Belum ada package dengan foto." />
            ) : (
              completed.map(o => <OrderPackageCard key={o.id} order={o} onPhoto={setPhotos} />)
            )}
          </div>
        </div>
      )}

      {/* Daftar Pesanan Resi Terbit */}
      <section>
        <h2 className="font-heading text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#04593f]" />
          <span>Daftar Pesanan Resi Terbit</span>
        </h2>
        <div className="space-y-3">
          {ready.length === 0 ? (
            <Empty text="Belum ada resi package." />
          ) : (
            ready.map(o => (
              <article key={o.id} className="h-full bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div>
                  <b className="text-xs text-slate-500 font-bold">{o.order_number}</b>
                  <p className="font-heading font-bold text-sm text-slate-900 mt-0.5">{o.customer_name}</p>
                </div>
                <div className="space-y-2">
                  {o.packages?.map(p => (
                    <div key={p.id} className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 flex justify-between items-center gap-2">
                      <div>
                        <b className="text-xs font-bold text-slate-800">{packageLabel(o, p)}</b>
                        <div className="text-xs text-slate-600 space-y-0.5 font-medium mt-0.5">
                          {p.items?.map(item => (
                            <p key={item.order_item_id}>• {item.product_name || 'Tanaman'} ×{item.quantity}</p>
                          ))}
                        </div>
                        <p className="text-xs font-semibold text-emerald-800 mt-1">
                          {p.tracking_number ? `✓ Resi: ${p.tracking_number}` : '○ Belum Resi'}
                        </p>
                      </div>
                      {hasPackagePhoto(p) && (
                        <button
                          type="button"
                          onClick={() => setPhotos(p)}
                          className="min-h-10 shrink-0 px-3 py-1.5 rounded-xl bg-emerald-50 text-[#04593f] hover:bg-emerald-100 text-xs font-heading font-bold transition-colors cursor-pointer"
                        >
                          Lihat Foto
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs font-bold text-slate-500">
                    {o.packages?.filter(p => p.tracking_number).length || 0}/{o.packages?.length || 0} paket sudah ada resi
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!allTracked(o) || !allPhotos(o) || informed.isPending}
                  onClick={() => setConfirm(o)}
                  className="min-h-11 w-full rounded-xl bg-[#04593f] hover:bg-emerald-900 text-white text-xs font-heading font-bold disabled:bg-slate-200 disabled:text-slate-400 transition-all cursor-pointer"
                >
                  {allTracked(o) && allPhotos(o) ? '✓ Selesai Diinfokan' : '🔒 Selesai Diinfokan'}
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Riwayat Pesanan Section (Conditional by Hash) */}
      {location.hash === '#riwayat-pesanan' && (
        <section id="riwayat-pesanan">
          <h2 className="font-heading text-sm font-bold mb-2.5 text-slate-900">Riwayat Pesanan</h2>
          <div className="space-y-2.5">
            {history.length === 0 ? (
              <Empty text="Belum ada pesanan di riwayat." />
            ) : (
              history.map(o => (
                <HistoryOrderCard
                  key={o.id}
                  order={o}
                  onPhoto={setPhotos}
                  onTracking={setTrackingOrder}
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* Modals */}
      <OrderDetailModal order={detail} onClose={() => setDetail(null)} />
      {photos && <PhotoModal pkg={photos} onClose={() => setPhotos(null)} />}
      {trackingOrder && <TrackingViewModal order={trackingOrder} onClose={() => setTrackingOrder(null)} />}
      {confirm && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl">
            <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 leading-tight">
              Semua resi & foto sudah diinformasikan ke pembeli?
            </h2>
            <div className="p-3 bg-emerald-50 rounded-2xl text-xs text-emerald-950 font-medium space-y-1">
              <p>✓ Nomor resi sudah tersedia</p>
              <p>✓ Foto paket sudah tersedia</p>
            </div>
            <p className="text-xs text-slate-500">Setelah dikonfirmasi, pesanan akan masuk ke Riwayat Pesanan.</p>
            {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => { setConfirm(null); setError(''); }}
                className="min-h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-heading font-bold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => informed.mutate(confirm.id)}
                disabled={informed.isPending}
                className="min-h-11 rounded-2xl bg-[#04593f] hover:bg-emerald-900 text-white text-xs font-heading font-bold disabled:opacity-50 cursor-pointer transition-all shadow-xs"
              >
                {informed.isPending ? 'Menyimpan...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs text-xs sm:text-sm text-slate-400 font-medium text-center">
    {text}
  </div>
);

const OrderPackageCard: React.FC<{ order: Order; onPhoto: (pkg: OrderPackage) => void }> = ({ order, onPhoto }) => (
  <article className="h-full bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
    <div>
      <b className="text-xs text-slate-400 font-bold">{order.order_number}</b>
      <p className="font-heading font-bold text-sm text-slate-900 mt-0.5">{order.customer_name}</p>
    </div>
    {order.packages?.filter(hasPackagePhoto).map(p => (
      <div key={p.id} className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <b className="text-xs font-bold text-slate-800">{packageLabel(order, p)}</b>
            <div className="text-xs text-slate-600 space-y-0.5 font-medium mt-0.5">
              {p.items?.map(item => (
                <p key={item.order_item_id}>• {item.product_name || 'Tanaman'} ×{item.quantity}</p>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onPhoto(p)}
            className="min-h-10 shrink-0 rounded-xl bg-[#04593f] hover:bg-emerald-900 px-3 py-1.5 text-white text-xs font-heading font-bold transition-colors cursor-pointer"
          >
            Lihat Foto
          </button>
        </div>
      </div>
    ))}
  </article>
);

const HistoryOrderCard: React.FC<{ order: Order; onPhoto: (pkg: OrderPackage) => void; onTracking: (order: Order) => void }> = ({ order, onPhoto, onTracking }) => (
  <article className="h-full bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
    <div>
      <b className="text-xs text-slate-400 font-bold">{order.order_number}</b>
      <p className="font-heading font-bold text-sm text-slate-900 mt-0.5">{order.customer_name}</p>
    </div>
    {order.packages?.length ? (
      <div className="space-y-2">
        {order.packages.map(p => (
          <div key={p.id} className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <b className="text-xs font-bold text-slate-800">{packageLabel(order, p)}</b>
              {hasPackagePhoto(p) && (
                <button
                  type="button"
                  onClick={() => onPhoto(p)}
                  className="min-h-9 shrink-0 text-xs font-heading font-bold text-[#04593f] hover:underline cursor-pointer"
                >
                  Lihat Foto
                </button>
              )}
            </div>
            <div className="text-xs text-slate-600 space-y-0.5 font-medium">
              {p.items?.map(item => (
                <p key={item.order_item_id}>• {item.product_name || 'Tanaman'} ×{item.quantity}</p>
              ))}
            </div>
            <p className="text-xs font-semibold text-emerald-800">{p.tracking_number ? `✓ Resi: ${p.tracking_number}` : '○ Belum Resi'}</p>
          </div>
        ))}
      </div>
    ) : (
      <div>
        <p className="text-xs font-bold uppercase text-slate-400">Pesanan</p>
        <ul className="mt-1 text-xs text-slate-600 space-y-0.5 font-medium">
          {order.items?.map(item => <li key={item.id}>• {item.product_name} ×{item.quantity}</li>)}
        </ul>
      </div>
    )}
    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
      <div>
        <p className="text-xs text-emerald-800 font-bold">✓ Selesai Diinfokan</p>
        <p className="text-xs text-slate-400 font-medium">{order.sales_informed_at}</p>
      </div>
      {(order.packages || []).some(p => p.tracking_number?.trim()) || order.tracking_number?.trim() ? (
        <button
          type="button"
          onClick={() => onTracking(order)}
          className="min-h-10 shrink-0 rounded-xl bg-slate-800 hover:bg-slate-900 px-3.5 py-1.5 text-xs font-heading font-bold text-white transition-colors cursor-pointer"
        >
          Lihat Resi
        </button>
      ) : null}
    </div>
  </article>
);

const TrackingViewModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" onClick={onClose}>
    <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl space-y-4" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <p className="text-xs font-heading font-bold uppercase tracking-wide text-emerald-800">Resi Pengiriman</p>
          <h3 className="font-heading font-extrabold text-base text-slate-900 mt-0.5">{order.order_number}</h3>
        </div>
        <button type="button" onClick={onClose} className="min-h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-heading font-bold text-slate-700 transition-colors cursor-pointer">
          Tutup
        </button>
      </div>
      <div className="space-y-2.5">
        {order.packages?.length ? (
          order.packages.map(pkg => (
            <div key={pkg.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800">Paket {pkg.letter}</span>
                <span className="font-heading text-sm font-extrabold tracking-wide text-emerald-900">{pkg.tracking_number || '-'}</span>
              </div>
              {pkg.shipping_cost != null && (
                <p className="mt-1 text-xs text-slate-600 font-medium">Ongkir: Rp {Number(pkg.shipping_cost).toLocaleString('id-ID')}</p>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
            <p className="font-heading text-sm font-extrabold tracking-wide text-emerald-900">{order.tracking_number || '-'}</p>
            {order.shipping_cost != null && (
              <p className="mt-1 text-xs text-slate-600 font-medium">Ongkir: Rp {Number(order.shipping_cost).toLocaleString('id-ID')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

const PhotoModal: React.FC<{ pkg: OrderPackage; onClose: () => void }> = ({ pkg, onClose }) => (
  <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3" onClick={onClose}>
    <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h2 className="font-heading font-black text-base text-slate-900">Foto Paket {pkg.letter}</h2>
        <button type="button" onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="grid gap-3">
        {pkg.packing_images?.map(img => (
          <img key={img.id} src={resolveImageUrl(img.image_url)} alt={`Foto Paket ${pkg.letter}`} className="w-full rounded-2xl object-contain max-h-[60vh] border border-slate-200" />
        ))}
      </div>
    </div>
  </div>
);
