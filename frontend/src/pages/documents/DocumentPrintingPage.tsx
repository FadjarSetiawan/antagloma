import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/order';
import { PackingNotaModal } from '../../components/orders/PackingNotaModal';
import { ShippingLabelModal } from '../../components/orders/ShippingLabelModal';
import { Printer, Tag, Check, Package as PackageIcon, ArrowLeft, FileText, CheckCircle2, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DocumentPrintingPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'unprinted' | 'printed'>('unprinted');

  const [selectedNotaOrder, setSelectedNotaOrder] = useState<Order | null>(null);
  const [selectedLabelOrder, setSelectedLabelOrder] = useState<{
    order: Order;
    packageInfo: {
      subOrderNumber: string;
      packageType: string;
      itemsSummary: string;
      weightInfo: string;
    };
  } | null>(null);

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  // Track printed status and printed timestamp per package subOrderNumber
  const [printedPackages, setPrintedPackages] = useState<Record<string, { printedAt: string }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['document-printing-orders'],
    queryFn: () => orderService.getOrders({ status: 'PACKING_COMPLETED' }),
  });

  const orders = data?.data || [];

  // Dynamically expand orders into individual package cards (Paket A, Paket B, etc.)
  const expandedPackageCards = orders.flatMap((order: Order) => {
    const itemCount = order.items?.length || 1;
    const packagesList = [];

    if (itemCount > 1) {
      // Paket A (Fullset)
      packagesList.push({
        id: `${order.id}-A`,
        order,
        subOrderNumber: `${order.order_number}-A`,
        packageType: 'Fullset' as const,
        plantCount: 1,
        weightInfo: '4.5 Kg',
      });

      // Paket B (Non-fullset)
      packagesList.push({
        id: `${order.id}-B`,
        order,
        subOrderNumber: `${order.order_number}-B`,
        packageType: 'Non-fullset' as const,
        plantCount: itemCount - 1,
        weightInfo: `${(itemCount - 1) * 2.0} Kg`,
      });
    } else {
      // Single package (Paket A)
      const firstGrade = order.items?.[0]?.grade || 'A';
      const isGradeDOrAbove = ['D', 'D+', 'J', 'J+'].includes(firstGrade.toUpperCase());
      const weightText = isGradeDOrAbove ? '3.5 Kg' : `Grade ${firstGrade} (tanpa berat)`;

      packagesList.push({
        id: `${order.id}-A`,
        order,
        subOrderNumber: `${order.order_number}-A`,
        packageType: 'Fullset' as const,
        plantCount: 1,
        weightInfo: weightText,
      });
    }

    return packagesList;
  });

  const unprintedCards = expandedPackageCards.filter((card) => !printedPackages[card.subOrderNumber]);
  const printedCards = expandedPackageCards.filter((card) => Boolean(printedPackages[card.subOrderNumber]));

  const handlePrintResi = (pkgCard: typeof expandedPackageCards[0]) => {
    // Record printed timestamp
    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ` • ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    setPrintedPackages((prev) => ({
      ...prev,
      [pkgCard.subOrderNumber]: { printedAt: nowStr },
    }));

    // Open shipping label modal
    setSelectedLabelOrder({
      order: pkgCard.order,
      packageInfo: {
        subOrderNumber: pkgCard.subOrderNumber,
        packageType: pkgCard.packageType,
        itemsSummary: `${pkgCard.plantCount} tanaman`,
        weightInfo: pkgCard.weightInfo,
      },
    });
  };

  const handlePrintNota = (pkgCard: typeof expandedPackageCards[0]) => {
    // Record printed timestamp
    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ` • ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    setPrintedPackages((prev) => ({
      ...prev,
      [pkgCard.subOrderNumber]: { printedAt: nowStr },
    }));

    setSelectedNotaOrder(pkgCard.order);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-24 font-sans text-slate-900">
      {/* Header Bar */}
      <div className="flex items-center gap-3 pt-1 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-sm font-bold"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Dokumen Pengiriman
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Cetak nota packing & label alamat pengiriman
          </p>
        </div>
      </div>

      {/* Top Batch Action Buttons (Uniform Antagloma Green Palette) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => {
            if (expandedPackageCards.length > 0) setSelectedNotaOrder(expandedPackageCards[0].order);
          }}
          className="py-2.5 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4 text-white" />
          <span>Cetak Semua Nota</span>
        </button>

        <button
          onClick={() => {
            if (expandedPackageCards.length > 0) handlePrintResi(expandedPackageCards[0]);
          }}
          className="py-2.5 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Tag className="w-4 h-4 text-white" />
          <span>Cetak Semua Label</span>
        </button>
      </div>

      {/* Top Navigation Tabs: Belum Dicetak vs Sudah Dicetak */}
      <div className="grid grid-cols-2 bg-white border border-slate-200/80 rounded-2xl p-1 shadow-2xs font-bold text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('unprinted')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'unprinted'
              ? 'bg-emerald-50 text-[#04593f] shadow-2xs border border-emerald-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Belum Dicetak</span>
          <span className="px-2 py-0.5 rounded-full bg-[#04593f] text-white text-[10px] font-black">
            {unprintedCards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('printed')}
          className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'printed'
              ? 'bg-emerald-50 text-[#04593f] shadow-2xs border border-emerald-200'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Sudah Dicetak</span>
          {printedCards.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
              {printedCards.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content Section Header */}
      <div className="pt-1">
        {activeTab === 'unprinted' ? (
          <div>
            <h2 className="text-xs font-bold uppercase text-[#04593f] tracking-wider">
              BELUM DICETAK ({unprintedCards.length})
            </h2>
            <p className="text-[11px] text-slate-400 font-normal">
              Pesanan yang belum dicetak resinya
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xs font-bold uppercase text-[#04593f] tracking-wider">
              SUDAH DICETAK ({printedCards.length})
            </h2>
            <p className="text-[11px] text-slate-400 font-normal">
              Pesanan dengan resi yang sudah dicetak
            </p>
          </div>
        )}
      </div>

      {/* Package Cards List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-normal bg-white rounded-2xl border border-slate-200 shadow-2xs">
          Memuat data dokumen pengiriman...
        </div>
      ) : activeTab === 'unprinted' ? (
        unprintedCards.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#04593f]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tidak Ada Dokumen Belum Dicetak</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-xs mx-auto">
                Semua dokumen resi pengiriman telah selesai dicetak.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {unprintedCards.map((pkgCard) => (
              <div
                key={pkgCard.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-[#04593f] transition-all"
              >
                {/* Header Package Card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
                      <PackageIcon className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                        {pkgCard.subOrderNumber}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        dari {pkgCard.order.order_number}
                      </p>
                    </div>
                  </div>

                  {/* Uniform Soft Blue Badge for both Fullset & Non-fullset */}
                  <span className="px-2.5 py-0.5 font-bold text-[11px] rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    {pkgCard.packageType}
                  </span>
                </div>

                {/* Customer Info & Plant Count */}
                <div className="space-y-0.5 pt-0.5 text-xs">
                  <h4 className="text-sm font-bold text-slate-900">{pkgCard.order.customer_name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {pkgCard.plantCount} tanaman • {pkgCard.weightInfo}
                  </p>
                </div>

                {/* Info Callout Box (Belum Dicetak) */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-[#04593f]">
                    <FileText className="w-4 h-4 text-[#04593f]" />
                    <span>Resi belum dicetak</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium pl-6">
                    Silakan cetak resi untuk proses pengiriman.
                  </p>
                </div>

                {/* Action Buttons Row - Uniform Green Palette */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePrintResi(pkgCard)}
                    className="py-2.5 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Resi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailOrder(pkgCard.order)}
                    className="py-2.5 px-3 bg-white border border-[#04593f] text-[#04593f] hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Detail Pesanan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        printedCards.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Belum Ada Resi yang Dicetak</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-xs mx-auto">
                Resi yang telah selesai dicetak akan otomatis berpindah ke tab ini.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {printedCards.map((pkgCard) => {
              const printInfo = printedPackages[pkgCard.subOrderNumber];

              return (
                <div
                  key={pkgCard.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-[#04593f] transition-all"
                >
                  {/* Header Package Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
                        <PackageIcon className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                          {pkgCard.subOrderNumber}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          dari {pkgCard.order.order_number}
                        </p>
                      </div>
                    </div>

                    {/* Uniform Soft Blue Badge for both Fullset & Non-fullset */}
                    <span className="px-2.5 py-0.5 font-bold text-[11px] rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      {pkgCard.packageType}
                    </span>
                  </div>

                  {/* Customer Info & Plant Count */}
                  <div className="space-y-0.5 pt-0.5 text-xs">
                    <h4 className="text-sm font-bold text-slate-900">{pkgCard.order.customer_name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {pkgCard.plantCount} tanaman • {pkgCard.weightInfo}
                    </p>
                  </div>

                  {/* Info Callout Box (Sudah Dicetak) */}
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#04593f]">
                      <CheckCircle2 className="w-4 h-4 text-[#04593f]" />
                      <span>Resi sudah dicetak</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium pl-6">
                      Dicetak pada {printInfo?.printedAt || 'Baru Saja'}
                    </p>

                    {/* Resi & Courier Sub-box */}
                    <div className="p-2.5 bg-white border border-slate-200/80 rounded-lg flex items-center justify-between font-bold text-xs">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Printer className="w-4 h-4 text-[#04593f]" />
                        <span>{pkgCard.order.delivery_method || 'Kirim Paket'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-medium block">No. Resi</span>
                        <span className="text-slate-900 font-extrabold text-xs">
                          {pkgCard.order.tracking_number || 'Belum Input Resi'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Row - Uniform Green Palette */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePrintResi(pkgCard)}
                      className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#04593f] border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-[#04593f]" />
                      <span>Lihat Resi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDetailOrder(pkgCard.order)}
                      className="py-2.5 px-3 bg-white border border-[#04593f] text-[#04593f] hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Detail Pesanan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Nota Packing Thermal Modal */}
      <PackingNotaModal
        order={selectedNotaOrder}
        onClose={() => setSelectedNotaOrder(null)}
      />

      {/* Shipping Address Label Modal */}
      <ShippingLabelModal
        order={selectedLabelOrder?.order || null}
        packageInfo={selectedLabelOrder?.packageInfo}
        onClose={() => setSelectedLabelOrder(null)}
      />

      {/* Detail Order Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans text-xs">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{detailOrder.order_number}</h3>
                <p className="text-xs text-slate-500">{detailOrder.customer_name} • {detailOrder.phone}</p>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200/80">
                <span className="font-bold text-slate-800 block">Alamat Pengiriman:</span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {[detailOrder.district_name, detailOrder.regency_name, detailOrder.province_name].filter(Boolean).join(', ')}
                </p>
                <p className="text-slate-900 font-bold">{detailOrder.full_address}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200/80">
                <span className="font-bold text-slate-800 block">Daftar Item Tanaman:</span>
                <div className="divide-y divide-slate-200/60">
                  {detailOrder.items?.map((it, idx) => (
                    <div key={idx} className="py-1 flex justify-between font-medium">
                      <span>{it.tree_name || it.product_name} (Grade {it.grade})</span>
                      <span className="font-bold">x{it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setDetailOrder(null)}
              className="w-full py-2.5 bg-[#04593f] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-900 transition-colors"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
