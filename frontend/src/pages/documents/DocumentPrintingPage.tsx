import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order, OrderPackage } from '../../types/order';
import { PackingNotaModal } from '../../components/orders/PackingNotaModal';
import { ShippingLabelModal } from '../../components/orders/ShippingLabelModal';
import { Printer, Tag, Check, Package as PackageIcon, ArrowLeft, FileText, CheckCircle2, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DocumentPrintingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'unprinted' | 'printed'>('unprinted');

  const [selectedNotaOrder, setSelectedNotaOrder] = useState<Order | null>(null);
  const [selectedNotaPackage, setSelectedNotaPackage] = useState<OrderPackage | null>(null);
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
  const pendingCompletionPackageIds = useRef(new Set<number>());
  const [printToast, setPrintToast] = useState<{ title: string; description: string } | null>(null);
  const [bulkPrintQueue, setBulkPrintQueue] = useState<{ document: 'nota' | 'label'; cards: typeof expandedPackageCards; index: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['document-printing-orders'],
    queryFn: () => orderService.getOrders({ per_page: 100 }),
  });

  const printMutation = useMutation({
    mutationFn: ({ packageId, document }: { packageId: number; document: 'nota' | 'label' }) =>
      orderService.printPackageDocument(packageId, document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-printing-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (_error, variables) => {
      pendingCompletionPackageIds.current.delete(variables.packageId);
    },
  });

  const orders = data?.data || [];

  // Backend package records are the source of truth for both identity and print state.
  const expandedPackageCards = orders
    .filter((order) => order.status === 'PACKING_COMPLETED' || order.status === 'WAITING_PACKING')
    .sort((a, b) => a.id - b.id)
    .flatMap((order) => (order.packages || []).map((pkg) => ({
      id: pkg.id,
      packageId: pkg.id,
      order,
      subOrderNumber: `${order.order_number}-${pkg.letter}`,
      packageType: pkg.package_type || 'Paket',
      plantCount: (pkg.items || []).reduce((sum, item) => sum + item.quantity, 0),
      weightInfo: 'Berat mengikuti konfigurasi paket',
      printedNota: pkg.nota_printed,
      printedLabel: pkg.label_printed,
      photoUploaded: pkg.photo_uploaded,
    })));

  const getCardPrintStatus = (card: typeof expandedPackageCards[number]) => ({
    printedNota: card.printedNota,
    printedLabel: card.printedLabel,
    isBothPrinted: Boolean(card.printedNota && card.printedLabel),
    printedAt: 'Tersimpan di server',
  });

  const unprintedCards = expandedPackageCards.filter((card) => !getCardPrintStatus(card).isBothPrinted);
  const printedCards = expandedPackageCards.filter((card) => getCardPrintStatus(card).isBothPrinted);
  useEffect(() => {
    if (!data || pendingCompletionPackageIds.current.size === 0) return;

    const completedPackageIds = new Set(
      expandedPackageCards
        .filter((card) => card.printedNota && card.printedLabel)
        .map((card) => card.packageId)
    );
    const newlyCompleted = [...pendingCompletionPackageIds.current].filter((id) => completedPackageIds.has(id));

    if (newlyCompleted.length > 0) {
      newlyCompleted.forEach((id) => pendingCompletionPackageIds.current.delete(id));
      setPrintToast({
        title: 'Nota & Label sudah dicetak semua',
        description: 'Paket dipindahkan ke Sudah Dicetak',
      });
      window.setTimeout(() => setPrintToast(null), 3500);
    }
  }, [data, expandedPackageCards]);

  const markPendingCompletion = (packageId: number, printedNota: boolean, printedLabel: boolean) => {
    if (!(printedNota && printedLabel)) pendingCompletionPackageIds.current.add(packageId);
  };

  const handlePrintNota = (order: Order, packageId?: number) => {
    if (packageId) {
      const card = expandedPackageCards.find((item) => item.packageId === packageId);
      if (card) markPendingCompletion(packageId, card.printedNota, card.printedLabel);
      setSelectedNotaPackage(order.packages?.find((pkg) => pkg.id === packageId) || null);
      printMutation.mutate({ packageId, document: 'nota' });
    } else {
      setSelectedNotaPackage(null);
    }
    setSelectedNotaOrder(order);
  };

  const handlePrintLabel = (pkgCard: typeof expandedPackageCards[0]) => {
    markPendingCompletion(pkgCard.packageId, pkgCard.printedNota, pkgCard.printedLabel);
    printMutation.mutate({ packageId: pkgCard.packageId, document: 'label' });

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
    <div className="space-y-4 max-w-xl mx-auto pb-24 font-sans text-slate-900">
      {printToast && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-80 z-[10000] rounded-2xl border border-emerald-200 bg-emerald-50 p-3 shadow-lg" role="status">
          <p className="text-xs font-black text-[#04593f]">{printToast.title}</p>
          <p className="text-[11px] text-emerald-800 mt-0.5">{printToast.description}</p>
        </div>
      )}
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

      {/* Top Batch Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          disabled={bulkPrintQueue !== null || unprintedCards.every((card) => card.printedNota)}
          onClick={() => startBulkPrint('nota', unprintedCards.filter((card) => !card.printedNota))}
          className="py-2.5 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-4 h-4 text-white" />
          <span>{bulkPrintQueue ? 'Mencetak...' : 'Cetak Semua Nota'}</span>
        </button>

        <button
          disabled={bulkPrintQueue !== null || unprintedCards.every((card) => card.printedLabel)}
          onClick={() => startBulkPrint('label', unprintedCards.filter((card) => !card.printedLabel))}
          className="py-2.5 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Tag className="w-4 h-4 text-white" />
          <span>{bulkPrintQueue ? 'Mencetak...' : 'Cetak Semua Label'}</span>
        </button>
      </div>

      {/* Top Navigation Tabs: Belum Dicetak vs Sudah Dicetak (Dual Button Box Layout) */}
      <div className="grid grid-cols-2 gap-2.5 font-bold text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('unprinted')}
          className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'unprinted'
              ? 'bg-emerald-50 text-[#04593f] border-2 border-emerald-300 shadow-xs font-black scale-[1.01]'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'unprinted' ? 'text-[#04593f]' : 'text-slate-500'}`} />
          <span>Belum Dicetak</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'unprinted' ? 'bg-[#04593f] text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {unprintedCards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('printed')}
          className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'printed'
              ? 'bg-emerald-50 text-[#04593f] border-2 border-emerald-300 shadow-xs font-black scale-[1.01]'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Printer className={`w-4 h-4 ${activeTab === 'printed' ? 'text-[#04593f]' : 'text-slate-500'}`} />
          <span>Sudah Dicetak</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'printed' ? 'bg-[#04593f] text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {printedCards.length}
          </span>
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
              Pesanan yang belum lengkap cetak nota & label resinya
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xs font-bold uppercase text-[#04593f] tracking-wider">
              SUDAH DICETAK ({printedCards.length})
            </h2>
            <p className="text-[11px] text-slate-400 font-normal">
              Pesanan yang telah lengkap dicetak nota & resinya
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
            {unprintedCards.map((pkgCard) => {
              const printedStatus = getCardPrintStatus(pkgCard);

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
                    <div className="flex items-center justify-between font-bold text-[#04593f]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#04593f]" />
                        <span>Status Cetak:</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                        {printedStatus.printedNota
                          ? '✓ Nota (Belum Label)'
                          : printedStatus.printedLabel
                          ? '✓ Label (Belum Nota)'
                          : 'Belum Nota & Label'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium pl-6">
                      Cetak kedua dokumen (Nota & Label) agar berpindah ke tab Sudah Dicetak.
                    </p>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePrintNota(pkgCard.order, pkgCard.packageId)}
                      className={`min-h-[38px] py-1.5 px-2 rounded-xl text-[10.5px] font-medium flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer ${printedStatus.printedNota ? 'bg-emerald-50 hover:bg-emerald-100 text-[#04593f] border border-emerald-300' : 'bg-[#04593f] hover:bg-emerald-900 text-white'}`}
                    >
                      {printedStatus.printedNota ? <CheckCircle2 className="w-3.5 h-3.5 text-[#04593f]" /> : <Printer className="w-3.5 h-3.5 text-white" />}
                      <span>{printedStatus.printedNota ? 'Cetak Ulang Nota' : 'Cetak Nota'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintLabel(pkgCard)}
                      className={`min-h-[38px] py-1.5 px-2 rounded-xl text-[10.5px] font-medium flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer ${printedStatus.printedLabel ? 'bg-emerald-50 hover:bg-emerald-100 text-[#04593f] border border-emerald-300' : 'bg-[#04593f] hover:bg-emerald-900 text-white'}`}
                    >
                      {printedStatus.printedLabel ? <CheckCircle2 className="w-3.5 h-3.5 text-[#04593f]" /> : <Tag className="w-3.5 h-3.5 text-white" />}
                      <span>{printedStatus.printedLabel ? 'Cetak Ulang Label' : 'Cetak Label'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
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
                      <span>Nota & Label sudah lengkap dicetak</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium pl-6">
                      Dicetak pada status tersimpan di server
                    </p>

                    {/* Resi & Courier Sub-box */}
                    <div className="p-2.5 bg-white border border-slate-200/80 rounded-lg flex items-center justify-between font-bold text-xs">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Printer className="w-4 h-4 text-[#04593f]" />
                        <span>{pkgCard.order.delivery_method || 'Kirim Paket'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-medium block">Status Foto</span>
                        <span className="text-[#04593f] font-extrabold text-xs">
                          Menunggu Foto Kebun
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Row - Soft Light Green Mint Buttons Matching Screenshot */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePrintNota(pkgCard.order, pkgCard.packageId)}
                      className="min-h-[38px] py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#04593f] border border-emerald-300 rounded-xl text-[10.5px] font-medium flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#04593f]" />
                      <span>Cetak Ulang Nota</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintLabel(pkgCard)}
                      className="min-h-[38px] py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#04593f] border border-emerald-300 rounded-xl text-[10.5px] font-medium flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5 text-[#04593f]" />
                      <span>Cetak Ulang Label</span>
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
