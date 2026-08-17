import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order, OrderPackage } from '../../types/order';
import { OrderStatusBadge } from '../../components/shared/OrderStatusBadge';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { CompleteShipmentModal } from '../../components/orders/CompleteShipmentModal';
import { CompletePackageShipmentModal } from '../../components/orders/CompletePackageShipmentModal';
import { Clock, Truck, FileText, Camera, ChevronRight, Plus, ArrowRight, PackageCheck, Eye, CheckCircle2, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const packageTypeLabel = (value?: string) => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'fullset') return 'Fullset';
  if (['non-fullset', 'non fullset', 'non_fullset'].includes(normalized)) return 'Non Fullset';
  if (normalized === 'packing kayu') return 'Packing Kayu';
  return value || 'Package';
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [selectedShipmentOrder, setSelectedShipmentOrder] = useState<Order | null>(null);
  const [selectedShipmentPackage, setSelectedShipmentPackage] = useState<OrderPackage | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [isVerifyChecked, setIsVerifyChecked] = useState(false);
  const [showPhotoQueue, setShowPhotoQueue] = useState(false);
  const showAdminHistory = location.hash === '#riwayat-pesanan';

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => orderService.getOrders({ per_page: 100 }),
  });

  const orders: Order[] = dashboardData?.data || [];
  // `price` is the saved total selling price for each line item (not the unit
  // price), so do not multiply it by quantity here.
  const totalItems = orders.reduce(
    (sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0),
    0,
  );
  const totalSales = orders.reduce(
    (sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + (Number(item.price) || 0), 0),
    0,
  );

  const waitingVerification = orders.filter((o: Order) => o.status === 'WAITING_PROCESS').length;
  // Keep the shipping-setup notification visible until every ordered plant has
  // been allocated to a package. This includes orders that already have one
  // completed package but still have plants waiting to be configured.
  const pendingShipping = orders.filter((order: Order) => {
    if (order.status !== 'WAITING_PACKING') return false;

    const orderedPlantCount = (order.items || []).reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0,
    );
    const configuredPlantCount = (order.packages || []).reduce(
      (sum, pkg) => sum + (pkg.items || []).reduce(
        (packageSum, item) => packageSum + (Number(item.quantity) || 0),
        0,
      ),
      0,
    );

    return !order.packages?.length || configuredPlantCount < orderedPlantCount;
  }).length;
  // Card 3: keep the dashboard count aligned with DocumentPrintingPage's
  // "Belum Dicetak" source of truth: one count per eligible package whose
  // Nota and Label are not both printed yet.
  const totalDocumentPackagesCount = orders
    .filter((order: Order) =>
      order.status === 'PACKING_COMPLETED' || order.status === 'WAITING_PACKING'
    )
    .reduce((sum, order) => sum + (order.packages || []).filter((pkg) => !(pkg.nota_printed && pkg.label_printed)).length, 0);

  // A package may be photographed only after BOTH print documents have been
  // confirmed by Print Bridge. This keeps unprinted packages out of the photo
  // queue and prevents the admin from uploading evidence too early.
  const isReadyForPhoto = (pkg: OrderPackage) =>
    Boolean(pkg.nota_printed && pkg.label_printed && !pkg.photo_uploaded);

  // Card 4: count only packages that have entered the reprint/printed column.
  const pendingPhotoUpload = orders
    .filter((order: Order) => order.status === 'WAITING_PACKING')
    .reduce((sum, order) => sum + (order.packages || []).filter(isReadyForPhoto).length, 0);

  // Table at bottom: Orders that have photo uploaded (PACKING_COMPLETED) waiting for resi input
  const waitingResiOrders = orders.filter(
    (o: Order) =>
      o.status === 'PACKING_COMPLETED' &&
      (o.packages?.length
        ? o.packages.every((pkg) => pkg.photo_uploaded) && o.packages.some((pkg) => !pkg.tracking_number)
        : !!o.packing_images?.length && (!o.tracking_number || o.tracking_number.trim() === ''))
  );
  const waitingPackagePhotos = orders.filter(
    (order) => order.status === 'WAITING_PACKING' && order.packages?.some(isReadyForPhoto)
  );
  const adminHistoryOrders = orders.filter((order) =>
    order.packages?.length
      ? order.status === 'PACKING_COMPLETED' && order.packages.every((pkg) => Boolean(pkg.tracking_number))
      : order.status === 'COMPLETED'
  );

  const approveMutation = useMutation({
    mutationFn: (id: number) => orderService.approveOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['orders-verification'] });
      queryClient.invalidateQueries({ queryKey: ['packing-queue'] });
      setSelectedDetailOrder(null);
      setVerifyingOrder(null);
      setIsVerifyChecked(false);
    },
  });

  const shipmentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { shipping_cost?: number; tracking_number?: string } }) =>
      orderService.completeShipment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setSelectedShipmentOrder(null);
    },
  });

  const handleConfirmShipment = async (orderId: number, payload: { shipping_cost: number; tracking_number: string }) => {
    await shipmentMutation.mutateAsync({ id: orderId, payload });
  };

  const packageShipmentMutation = useMutation({
    mutationFn: ({ packageId, payload }: { packageId: number; payload: { shipping_cost: number; tracking_number: string } }) =>
      orderService.completePackageShipment(packageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      setSelectedShipmentPackage(null);
    },
  });

  const packagePhotoMutation = useMutation({
    mutationFn: ({ packageId, file }: { packageId: number; file: File }) => orderService.uploadPackageProof(packageId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
    },
  });

  const openShipment = (order: Order) => {
    if (order.packages?.length) {
      setSelectedShipmentPackage(order.packages.find((pkg) => !pkg.tracking_number) || order.packages[0]);
    } else {
      setSelectedShipmentOrder(order);
    }
  };

  const statCards = [
    {
      title: 'Menunggu Verifikasi Pembayaran',
      value: isLoading ? '...' : waitingVerification,
      caption: waitingVerification > 0 ? `${waitingVerification} order perlu verifikasi` : 'Semua terverifikasi',
      hasNotification: waitingVerification > 0,
      buttonText: 'Lakukan Verifikasi',
      icon: Clock,
      link: '/orders/verification',
    },
    {
      title: 'Belum Diatur Pengiriman',
      value: isLoading ? '...' : pendingShipping,
      caption: pendingShipping > 0 ? `${pendingShipping} order perlu diatur` : 'Semua teratur',
      hasNotification: pendingShipping > 0,
      buttonText: 'Atur Pengiriman',
      icon: Truck,
      link: '/packing',
    },
    {
      title: 'Dokumen Pengiriman',
      value: isLoading ? '...' : totalDocumentPackagesCount,
      caption: totalDocumentPackagesCount > 0 ? `${totalDocumentPackagesCount} Paket Dokumen baru` : 'Semua dokumen dicetak',
      hasNotification: totalDocumentPackagesCount > 0,
      buttonText: 'Cetak Dokumen',
      icon: FileText,
      link: '/documents/print',
    },
    {
      title: 'Menunggu Foto Paket',
      value: isLoading ? '...' : pendingPhotoUpload,
      caption: pendingPhotoUpload > 0 ? `${pendingPhotoUpload} paket perlu difoto` : 'Semua paket difoto',
      hasNotification: pendingPhotoUpload > 0,
      buttonText: 'Input Foto Paket',
      icon: Camera,
      link: '/packing',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl pb-24 font-sans text-slate-900 px-1 sm:px-0">
      {/* Header Banner - Streamlined & Clean */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">Pantau dan kelola operasional toko secara real-time.</p>
        </div>

        {/* Desktop-only action button */}
        <button
          onClick={() => navigate('/orders/create')}
          className="hidden sm:flex px-4 py-2 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Buat Order
        </button>
      </div>

      {/* Operational sales summary: available to Admin for all shop orders. */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3.5" aria-label="Ringkasan item dan penjualan">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-800">Total Item</p>
          <p className="mt-1 text-xl font-black text-slate-950">{isLoading ? '...' : totalItems.toLocaleString('id-ID')}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Tanaman dari order yang terlihat</p>
        </div>
        <div className="rounded-2xl border border-emerald-900 bg-gradient-to-br from-[#04593f] to-emerald-950 p-3.5 shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-200">Total Penjualan</p>
          <p className="mt-1 text-base font-black text-white sm:text-xl">{isLoading ? '...' : `Rp ${totalSales.toLocaleString('id-ID')}`}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-emerald-200/90">Harga tanaman, di luar ongkir</p>
        </div>
      </section>

      {/* Sleek Compact 2x2 Grid Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => card.title === 'Menunggu Foto Paket' ? setShowPhotoQueue(true) : navigate(card.link)}
              className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between space-y-2 shadow-2xs hover:border-[#04593f] hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-[#04593f] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#04593f]" />
                </div>
                <span className="text-lg sm:text-2xl font-black text-slate-900">{card.value}</span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-800 leading-tight block truncate">
                  {card.title}
                </h3>

                <div className="mt-1 flex items-center max-w-full">
                  {card.hasNotification ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/90 text-[9px] sm:text-[10px] font-bold shadow-2xs max-w-full truncate">
                      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                      </span>
                      <span className="truncate">{card.caption}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal leading-none truncate">{card.caption}</span>
                  )}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  className="w-full py-1.5 px-2 bg-emerald-50 group-hover:bg-[#04593f] text-[#04593f] group-hover:text-white rounded-xl text-[10px] sm:text-xs font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <span>{card.buttonText}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showPhotoQueue && <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3 shadow-2xs"><div className="flex items-center justify-between border-b border-slate-100 pb-2.5"><div><h2 className="text-xs sm:text-sm font-bold">Menunggu Foto Paket</h2><p className="text-[10px] text-slate-400 mt-0.5">Hanya package dengan nota dan label yang sudah tercetak dapat diunggah fotonya.</p></div><button type="button" onClick={() => setShowPhotoQueue(false)} className="min-h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">Kembali</button></div>{waitingPackagePhotos.length === 0 ? <div className="py-8 text-center text-xs text-slate-400">Tidak ada package yang siap diunggah fotonya.</div> : waitingPackagePhotos.map((order) => <div key={order.id} className="rounded-xl border border-slate-200 p-3 space-y-2"><div className="text-xs"><b>{order.order_number}</b></div><div className="grid gap-2 sm:grid-cols-2">{order.packages?.filter(isReadyForPhoto).map((pkg) => <div key={pkg.id} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-2"><div className="flex items-start justify-between gap-2"><div><b className="block">Paket {pkg.letter}</b><span className="text-[10px] text-slate-500">Customer: {order.customer_name}</span></div><span className="shrink-0 rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">Menunggu Foto</span></div><p className="text-[11px] font-bold text-slate-700">Jenis: {packageTypeLabel(pkg.package_type)}</p><div className="text-[10px] text-slate-600 space-y-0.5">{pkg.items?.map((item) => <p key={item.order_item_id}>• {item.product_name || 'Tanaman'} ×{item.quantity}</p>)}</div><label className={`min-h-11 rounded-xl px-3 flex items-center justify-center text-xs font-black transition-colors ${packagePhotoMutation.isPending ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#04593f] hover:bg-emerald-900 text-white cursor-pointer'}`}><Camera className="w-4 h-4 mr-1.5" />Input Foto Paket<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={packagePhotoMutation.isPending} onChange={(e) => { const file = e.target.files?.[0]; if (file) packagePhotoMutation.mutate({ packageId: pkg.id, file }); e.currentTarget.value = ''; }} /></label></div>)}</div></div>)}</div>}

      {/* Dedicated Section: Daftar Pesanan Menunggu Input Resi (Mobile Responsive Cards & Desktop Table) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-[#04593f]" />
              <span>Daftar Pesanan Menunggu Input Resi</span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal mt-0.5">
              Pesanan yang sudah diunggah foto bukti packing-nya dan siap diinputkan nomor resinya
            </p>
          </div>

          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[10px] sm:text-xs font-bold flex-shrink-0">
            {waitingResiOrders.length} Order
          </span>
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-xs font-normal text-slate-400">
            Memuat daftar pesanan menunggu resi...
          </div>
        ) : waitingResiOrders.length === 0 ? (
          <div className="py-6 text-center space-y-1">
            <p className="text-xs font-bold text-slate-700">Tidak Ada Pesanan Menunggu Resi</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400">Pesanan yang telah diunggah foto packing-nya akan muncul di sini untuk diinputkan resi.</p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW (< md screens): Responsive Cards with NO horizontal table scroll */}
            <div className="space-y-2.5 md:hidden">
              {waitingResiOrders.map((order: Order) => (
                <div key={order.id} className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{order.order_number}</span>
                      <span className="text-[10px] text-slate-400">{order.order_date}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold rounded-md">
                      Belum Input Resi
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200/60 pt-2">
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{order.customer_name}</span>
                      <span className="text-slate-500 font-medium text-[10px]">{order.phone} • {order.delivery_method}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-md">
                      ✓ Foto Ada ({order.packing_images?.length || 1})
                    </span>
                  </div>

                  {order.packages?.length ? <div className="space-y-1.5 border-t border-slate-200/60 pt-2">{order.packages.map((pkg) => <div key={pkg.id} className="rounded-lg bg-white border border-slate-200 p-2"><div className="flex justify-between text-[11px]"><b>Paket {pkg.letter}</b><span>{pkg.tracking_number ? 'Resi Ada' : 'Belum Resi'}</span></div><p className="text-[10px] text-slate-500">{pkg.package_type || 'Package'} · Foto {pkg.photo_uploaded ? 'Ada' : 'Belum'}</p>{pkg.items?.map((item) => <p key={item.order_item_id} className="text-[10px] text-slate-600">• {item.product_name || 'Tanaman'} ×{item.quantity}</p>)}</div>)}</div> : null}

                  <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => openShipment(order)}
                      className="px-3 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>{order.packages?.length ? 'Input Resi Package' : 'Input Resi'}</span>
                    </button>
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
              ))}
            </div>

            {/* DESKTOP VIEW (>= md screens): Full Data Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">No. Order & Tgl</th>
                    <th className="py-2.5 px-3">Customer / Pemesan</th>
                    <th className="py-2.5 px-3">Metode Pengiriman</th>
                    <th className="py-2.5 px-3 text-center">Foto Packing</th>
                    <th className="py-2.5 px-3 text-center">Status Resi</th>
                    <th className="py-2.5 px-3">Package</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {waitingResiOrders.map((order: Order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{order.order_number}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{order.order_date}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{order.customer_name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{order.phone}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-[#04593f]" />
                          {order.delivery_method}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded">
                          ✓ Foto Ada ({order.packing_images?.length || 1})
                        </span>
                      </td>
                      <td className="py-3 px-3"><div className="space-y-1">{order.packages?.map((pkg) => <div key={pkg.id} className="text-[10px]"><b>Paket {pkg.letter}</b> · {pkg.package_type || 'Package'}<div className="text-slate-500">{pkg.items?.map((item) => `${item.product_name || 'Tanaman'} ×${item.quantity}`).join(', ')}</div></div>)}</div></td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold rounded">
                          Belum Input Resi
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openShipment(order)}
                            className="px-2.5 py-1.5 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>{order.packages?.length ? 'Input Resi Package' : 'Input Resi'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDetailOrder(order)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Detail</span>
                          </button>
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

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
        onApprove={(id) => {
          const order = orders.find((item) => item.id === id) || selectedDetailOrder;
          if (order) {
            setVerifyingOrder(order);
            setIsVerifyChecked(false);
          }
        }}
        isActionLoading={approveMutation.isPending}
      />

      {/* Payment Verification Confirmation Modal */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 w-full h-full overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-[95%] max-w-md my-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-800 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">Verifikasi Pembayaran</h3>
              </div>
              <button onClick={() => setVerifyingOrder(null)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Tutup">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Apakah Anda yakin ingin memverifikasi pembayaran pesanan <span className="font-extrabold text-slate-900">{verifyingOrder.order_number}</span> atas nama <span className="font-extrabold text-slate-900">{verifyingOrder.customer_name}</span>?
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-950">
              ✓ Pesanan yang diverifikasi akan masuk ke antrean pengaturan paket.
            </div>

            <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer text-xs font-extrabold text-slate-900">
              <input
                type="checkbox"
                checked={isVerifyChecked}
                onChange={(event) => setIsVerifyChecked(event.target.checked)}
                className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700 mt-0.5 cursor-pointer"
              />
              <span>Saya sudah memeriksa bukti transfer dan dana masuk dengan benar.</span>
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyingOrder(null)}
                disabled={approveMutation.isPending}
                className="py-3 px-4 bg-white border-2 border-slate-300 text-slate-800 rounded-2xl text-xs font-black cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!isVerifyChecked || approveMutation.isPending}
                onClick={() => approveMutation.mutate(verifyingOrder.id)}
                className="py-3 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer"
              >
                {approveMutation.isPending ? 'Proses...' : 'Ya, Verifikasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Shipment (Input Resi) Modal */}
      <CompleteShipmentModal
        order={selectedShipmentOrder}
        onClose={() => setSelectedShipmentOrder(null)}
        onConfirm={handleConfirmShipment}
      />
      <CompletePackageShipmentModal
        pkg={selectedShipmentPackage}
        onClose={() => setSelectedShipmentPackage(null)}
        onConfirm={async (packageId, payload) => {
          await packageShipmentMutation.mutateAsync({ packageId, payload });
        }}
      />
    </div>
  );
};
