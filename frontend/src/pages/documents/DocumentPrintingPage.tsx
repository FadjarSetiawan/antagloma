import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order, OrderPackage } from '../../types/order';
import { PackingNotaModal } from '../../components/orders/PackingNotaModal';
import { ShippingLabelModal } from '../../components/orders/ShippingLabelModal';
import { Printer, Tag, Check, Package as PackageIcon, ArrowLeft, FileText, CheckCircle2, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DocumentPrintingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'unprinted' | 'printed'>('unprinted');

  const [selectedNotaOrder, setSelectedNotaOrder] = useState<Order | null>(null);
  const [selectedNotaPackage, setSelectedNotaPackage] = useState<OrderPackage | null>(null);
  const [selectedLabelOrder, setSelectedLabelOrder] = useState<{
    order: Order;
    packageInfo: {
      id: number;
      subOrderNumber: string;
      packageType: string;
      itemsSummary: string;
      itemLines: string[];
      weightInfo: string;
    };
  } | null>(null);

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [bulkPrintQueue, setBulkPrintQueue] = useState<{ document: 'nota' | 'label'; cards: typeof expandedPackageCards; index: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['document-printing-orders'],
    queryFn: () => orderService.getOrders({ per_page: 100 }),
  });

  const orders = data?.data || [];

  // Backend package records are the source of truth for both identity and print state.
  // Packages that already have a tracking number automatically disappear from this list.
  const expandedPackageCards = orders
    .filter((order) => order.status === 'PACKING_COMPLETED' || order.status === 'WAITING_PACKING')
    .sort((a, b) => a.id - b.id)
    .flatMap((order) =>
      (order.packages || [])
        .filter((pkg) => !pkg.tracking_number)
        .map((pkg) => {
          const pkgTypeStr = (pkg.package_type || '').toLowerCase();
          const isFullset = pkgTypeStr.includes('fullset') && !pkgTypeStr.includes('non');
          const plantCount = (pkg.items || []).reduce((sum, item) => sum + item.quantity, 0);

          let weightVal: number | null = pkg.weight != null && !isNaN(Number(pkg.weight)) ? Number(pkg.weight) : null;
          if (weightVal === null || weightVal <= 0) {
            let totalComputedWeight = 0;
            (pkg.items || []).forEach((pkgItem) => {
              const matchingOrderItem = (order.items || []).find((oi) => oi.id === pkgItem.order_item_id);
              const grade = (matchingOrderItem?.grade || 'A').trim().toUpperCase();
              let unitWeight = 0;
              if (isFullset) {
                if (['D', 'D+'].includes(grade)) unitWeight = 6.0;
                else if (grade === 'J') unitWeight = 8.0;
                else if (grade === 'J+') unitWeight = 10.0;
                else unitWeight = 0;
              } else {
                if (grade === 'A') unitWeight = 0.2;
                else if (grade === 'B') unitWeight = 0.4;
                else if (grade === 'B+') unitWeight = 0.5;
                else if (grade === 'C') unitWeight = 0.6;
                else if (['C+', 'C+'].includes(grade)) unitWeight = 1.0;
                else if (['D', 'D+'].includes(grade)) unitWeight = 2.0;
                else if (grade === 'J') unitWeight = 4.0;
                else if (grade === 'J+') unitWeight = 5.0;
                else unitWeight = 2.0;
              }
              totalComputedWeight += unitWeight * (pkgItem.quantity || 1);
            });
            if (totalComputedWeight > 0) {
              weightVal = totalComputedWeight;
            }
          }

          const weightInfo = weightVal && weightVal > 0 ? `${Number(weightVal.toFixed(2))} kg` : '';

          return {
            id: pkg.id,
            packageId: pkg.id,
            order,
            subOrderNumber: `${order.order_number}-${pkg.letter}`,
            packageType: pkg.package_type || 'Paket',
            plantCount,
            itemLines: (pkg.items || []).map((item) => item.product_name || 'Tanaman'),
            weightInfo,
            printedNota: pkg.nota_printed,
            printedLabel: pkg.label_printed,
            photoUploaded: pkg.photo_uploaded,
            trackingNumber: pkg.tracking_number,
          };
        })
    );

  const getCardPrintStatus = (card: typeof expandedPackageCards[number]) => ({
    printedNota: card.printedNota,
    printedLabel: card.printedLabel,
    isBothPrinted: Boolean(card.printedNota && card.printedLabel),
    printedAt: 'Tersimpan di server',
  });

  const unprintedCards = expandedPackageCards.filter((card) => !getCardPrintStatus(card).isBothPrinted);
  const printedCards = expandedPackageCards.filter((card) => getCardPrintStatus(card).isBothPrinted);
  const handlePrintNota = (order: Order, packageId?: number) => {
    if (packageId) {
      setSelectedNotaPackage(order.packages?.find((pkg) => pkg.id === packageId) || null);
    } else {
      setSelectedNotaPackage(null);
    }
    setSelectedNotaOrder(order);
  };

  const handlePrintLabel = (pkgCard: typeof expandedPackageCards[0]) => {
    setSelectedLabelOrder({
      order: pkgCard.order,
      packageInfo: {
        id: pkgCard.packageId,
        subOrderNumber: pkgCard.subOrderNumber,
        packageType: pkgCard.packageType,
        itemsSummary: `${pkgCard.plantCount} tanaman`,
        itemLines: pkgCard.itemLines,
        weightInfo: pkgCard.weightInfo,
      },
    });
  };

  const startBulkPrint = (document: 'nota' | 'label', cards: typeof expandedPackageCards) => {
    if (!cards.length) return;
    setBulkPrintQueue({ document, cards, index: 0 });
    if (document === 'nota') handlePrintNota(cards[0].order, cards[0].packageId);
    else handlePrintLabel(cards[0]);
  };

  const closeBulkPreview = () => {
    if (!bulkPrintQueue) {
      setSelectedNotaOrder(null);
      setSelectedLabelOrder(null);
      return;
    }
    const nextIndex = bulkPrintQueue.index + 1;
    if (nextIndex < bulkPrintQueue.cards.length) {
      const next = bulkPrintQueue.cards[nextIndex];
      setBulkPrintQueue({ ...bulkPrintQueue, index: nextIndex });
      if (bulkPrintQueue.document === 'nota') handlePrintNota(next.order, next.packageId);
      else handlePrintLabel(next);
      return;
    }
    setBulkPrintQueue(null);
    setSelectedNotaOrder(null);
    setSelectedLabelOrder(null);
  };
  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-24 font-sans text-slate-900">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 pt-1 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-sm font-bold"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-950 leading-tight">
              Dokumen Pengiriman
            </h1>
            <p className="text-sm text-slate-600 font-normal mt-1">
              Cetak nota packing & label alamat pengiriman
            </p>
          </div>
        </div>
      </div>

      {/* Top Batch Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          disabled={bulkPrintQueue !== null || unprintedCards.every((card) => card.printedNota)}
          onClick={() => startBulkPrint('nota', unprintedCards.filter((card) => !card.printedNota))}
          className="min-h-11 py-2.5 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95 leading-normal"
        >
          <Printer className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="truncate">{bulkPrintQueue ? 'Mencetak...' : 'Cetak Semua Nota'}</span>
        </button>

        <button
          disabled={bulkPrintQueue !== null || unprintedCards.every((card) => card.printedLabel)}
          onClick={() => startBulkPrint('label', unprintedCards.filter((card) => !card.printedLabel))}
          className="min-h-11 py-2.5 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95 leading-normal"
        >
          <Tag className="w-3.5 h-3.5 text-white shrink-0" />
          <span className="truncate">{bulkPrintQueue ? 'Mencetak...' : 'Cetak Semua Label'}</span>
        </button>
      </div>

      {/* Top Navigation Tabs: Belum Dicetak vs Sudah Dicetak */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('unprinted')}
            className={`min-h-11 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'unprinted'
              ? 'bg-[#04593f] text-white shadow-sm font-bold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
          }`}
        >
          <FileText className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'unprinted' ? 'text-white' : 'text-slate-500'}`} />
          <span className="text-sm">Belum Dicetak</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
            activeTab === 'unprinted' ? 'bg-white/20 text-white border border-white/30' : 'bg-slate-200 text-slate-700'
          }`}>
            {unprintedCards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('printed')}
            className={`min-h-11 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'printed'
              ? 'bg-[#04593f] text-white shadow-sm font-bold'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
          }`}
        >
          <Printer className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'printed' ? 'text-white' : 'text-slate-500'}`} />
          <span className="text-sm">Sudah Dicetak</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
            activeTab === 'printed' ? 'bg-white/20 text-white border border-white/30' : 'bg-slate-200 text-slate-700'
          }`}>
            {printedCards.length}
          </span>
        </button>
      </div>

      {/* Tab Content Section Header */}
      <div className="pt-0.5">
        {activeTab === 'unprinted' ? (
          <div>
            <h2 className="text-sm font-bold uppercase text-[#04593f] tracking-wide">
              BELUM DICETAK ({unprintedCards.length})
            </h2>
            <p className="text-sm text-slate-600 font-normal mt-1">
              Pesanan yang belum lengkap cetak nota & label resinya
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-bold uppercase text-[#04593f] tracking-wide">
              SUDAH DICETAK ({printedCards.length})
            </h2>
            <p className="text-sm text-slate-600 font-normal mt-1">
              Pesanan yang telah lengkap dicetak nota & resinya
            </p>
          </div>
        )}
      </div>

      {/* Package Cards List */}
      {isLoading ? (
        <div className="p-10 text-center text-sm text-slate-600 font-normal bg-white rounded-2xl border border-slate-200 shadow-sm">
          Memuat data dokumen pengiriman...
        </div>
      ) : activeTab === 'unprinted' ? (
        unprintedCards.length === 0 ? (
          <div className="py-14 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100/80 rounded-2xl flex items-center justify-center text-[#04593f]">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {unprintedCards.map((pkgCard) => {
              const printedStatus = getCardPrintStatus(pkgCard);

              return (
                <div
                  key={pkgCard.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm hover:border-[#04593f] transition-all"
                >
                  {/* Header Package Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
                        <PackageIcon className="w-3.5 h-3.5 text-amber-700" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-950 leading-tight">
                          {pkgCard.subOrderNumber}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          dari {pkgCard.order.order_number}
                        </p>
                      </div>
                    </div>

                      <span className="px-2.5 py-1 font-semibold text-xs rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                      {pkgCard.packageType}
                    </span>
                  </div>

                  {/* Customer Info & Plant Count */}
                  <div className="space-y-1 text-sm">
                    <h4 className="text-sm font-bold text-slate-950">{pkgCard.order.customer_name}</h4>
                    <p className="text-sm text-slate-600 font-normal">
                      {pkgCard.plantCount} tanaman{pkgCard.weightInfo ? ` • ${pkgCard.weightInfo}` : ''}
                    </p>
                  </div>

                  {/* Info Callout Box (Belum Dicetak) */}
                  <div className="py-2.5 border-y border-emerald-200 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between font-semibold text-[#04593f]">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#04593f]" />
                        <span className="text-sm">Status Cetak:</span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-right">
                        {printedStatus.printedNota
                          ? '✓ Nota (Belum Label)'
                          : printedStatus.printedLabel
                          ? '✓ Label (Belum Nota)'
                          : 'Belum Nota & Label'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-normal pl-5">
                      Cetak kedua dokumen (Nota & Label) agar berpindah ke tab Sudah Dicetak.
                    </p>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handlePrintNota(pkgCard.order, pkgCard.packageId)}
                      className={`min-h-10 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                        printedStatus.printedNota
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                          : 'bg-[#04593f] hover:bg-emerald-900 text-white'
                      }`}
                    >
                      {printedStatus.printedNota ? <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" /> : <Printer className="w-3.5 h-3.5 text-white shrink-0" />}
                      <span className="truncate">{printedStatus.printedNota ? 'Cetak Ulang Nota' : 'Cetak Nota'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintLabel(pkgCard)}
                      className={`min-h-10 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                        printedStatus.printedLabel
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                          : 'bg-[#04593f] hover:bg-emerald-900 text-white'
                      }`}
                    >
                      {printedStatus.printedLabel ? <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" /> : <Tag className="w-3.5 h-3.5 text-white shrink-0" />}
                      <span className="truncate">{printedStatus.printedLabel ? 'Cetak Ulang Label' : 'Cetak Label'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        printedCards.length === 0 ? (
          <div className="py-14 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {printedCards.map((pkgCard) => {
              return (
                <div
                  key={pkgCard.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm hover:border-[#04593f] transition-all"
                >
                  {/* Header Package Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
                        <PackageIcon className="w-3.5 h-3.5 text-amber-700" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-950 leading-tight">
                          {pkgCard.subOrderNumber}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          dari {pkgCard.order.order_number}
                        </p>
                      </div>
                    </div>

                      <span className="px-2.5 py-1 font-semibold text-xs rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                      {pkgCard.packageType}
                    </span>
                  </div>

                  {/* Customer Info & Plant Count */}
                  <div className="space-y-1 text-sm">
                    <h4 className="text-sm font-bold text-slate-950">{pkgCard.order.customer_name}</h4>
                    <p className="text-sm text-slate-600 font-normal">
                      {pkgCard.plantCount} tanaman • {pkgCard.weightInfo}
                    </p>
                  </div>

                  {/* Info Callout Box (Sudah Dicetak) */}
                  <div className="py-2.5 border-y border-emerald-200 space-y-1.5 text-sm">
                    <div className="flex items-center gap-1.5 font-semibold text-[#04593f]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#04593f] shrink-0" />
                      <span className="text-sm">Nota & Label sudah lengkap dicetak</span>
                    </div>
                    <p className="text-xs text-slate-600 font-normal pl-5">
                      Dicetak pada status tersimpan di server
                    </p>

                    {/* Resi & Courier Sub-box */}
                    <div className="pt-2 flex items-center justify-between text-sm border-t border-emerald-200">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-sm">
                        <Printer className="w-3.5 h-3.5 text-[#04593f] shrink-0" />
                        <span>{pkgCard.order.delivery_method || 'Kirim Paket'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9.5px] text-slate-400 font-normal block">Status Foto</span>
                        <span className="text-[#04593f] font-bold text-xs">
                          Menunggu Foto Kebun
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handlePrintNota(pkgCard.order, pkgCard.packageId)}
                      className="min-h-10 py-2 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-white shrink-0" />
                      <span className="truncate">Cetak Ulang Nota</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintLabel(pkgCard)}
                      className="min-h-10 py-2 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5 text-white shrink-0" />
                      <span className="truncate">Cetak Ulang Label</span>
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
        packageInfo={selectedNotaPackage}
        onClose={() => { closeBulkPreview(); setSelectedNotaPackage(null); }}
      />

      {/* Shipping Address Label Modal */}
      <ShippingLabelModal
        order={selectedLabelOrder?.order || null}
        packageInfo={selectedLabelOrder?.packageInfo}
        onClose={closeBulkPreview}
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
