import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/order';
import { PackingNotaModal } from '../../components/orders/PackingNotaModal';
import { ShippingLabelModal } from '../../components/orders/ShippingLabelModal';
import { Printer, Tag, Check, Package as PackageIcon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrintedStatusMap {
  [pkgCode: string]: {
    notaPrinted: boolean;
    labelPrinted: boolean;
  };
}

export const DocumentPrintingPage: React.FC = () => {
  const navigate = useNavigate();

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

  // Track print status per package code locally
  const [printStatus, setPrintStatus] = useState<PrintedStatusMap>({});

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
        weightInfo: '4.5 kg',
      });

      // Paket B (Non-fullset)
      packagesList.push({
        id: `${order.id}-B`,
        order,
        subOrderNumber: `${order.order_number}-B`,
        packageType: 'Non-fullset' as const,
        plantCount: itemCount - 1,
        weightInfo: `${(itemCount - 1) * 2.0} kg`,
      });
    } else {
      // Single package (Paket A)
      const firstGrade = order.items?.[0]?.grade || 'A';
      const isGradeDOrAbove = ['D', 'D+', 'J', 'J+'].includes(firstGrade.toUpperCase());
      const weightText = isGradeDOrAbove ? '3.5 kg' : `Grade ${firstGrade} (tanpa berat)`;

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

  const handlePrintNota = (order: Order, pkgCode: string) => {
    setSelectedNotaOrder(order);
    setPrintStatus((prev) => ({
      ...prev,
      [pkgCode]: { ...prev[pkgCode], notaPrinted: true },
    }));
  };

  const handlePrintLabel = (order: Order, pkgCode: string, pkgType: string, weightInfo: string) => {
    setSelectedLabelOrder({
      order,
      packageInfo: {
        subOrderNumber: pkgCode,
        packageType: pkgType,
        itemsSummary: `${order.items?.length || 1} tanaman`,
        weightInfo,
      },
    });
    setPrintStatus((prev) => ({
      ...prev,
      [pkgCode]: { ...prev[pkgCode], labelPrinted: true },
    }));
  };

  const handlePrintAllNotas = () => {
    if (orders.length > 0) {
      setSelectedNotaOrder(orders[0]);
    }
  };

  const handlePrintAllLabels = () => {
    if (expandedPackageCards.length > 0) {
      const firstPkg = expandedPackageCards[0];
      setSelectedLabelOrder({
        order: firstPkg.order,
        packageInfo: {
          subOrderNumber: firstPkg.subOrderNumber,
          packageType: firstPkg.packageType,
          itemsSummary: `${firstPkg.plantCount} tanaman`,
          weightInfo: firstPkg.weightInfo,
        },
      });
    }
  };

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

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
            Menunggu Cetak Dokumen
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Cetak nota packing & label alamat pengiriman
          </p>
        </div>
      </div>

      {/* Top Batch Action Buttons (Antagloma Green Color Palette - No Purple!) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={handlePrintAllNotas}
          className="py-2.5 px-3 bg-[#04593f] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4 text-white" />
          <span>Cetak Semua Nota</span>
        </button>

        <button
          onClick={handlePrintAllLabels}
          className="py-2.5 px-3 bg-white border border-[#04593f] hover:bg-emerald-50 text-[#04593f] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Tag className="w-4 h-4 text-[#04593f]" />
          <span>Cetak Semua Label</span>
        </button>
      </div>

      {/* Date Header */}
      <div className="pt-2">
        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block">
          HARI INI • {todayFormatted}
        </span>
      </div>

      {/* Package Cards List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-normal bg-white rounded-2xl border border-slate-200 shadow-2xs">
          Memuat dokumen siap cetak...
        </div>
      ) : expandedPackageCards.length === 0 ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#04593f]">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Semua Dokumen Sudah Dicetak</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-xs mx-auto">
              Belum ada order baru yang menunggu cetak nota atau label alamat.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {expandedPackageCards.map((pkgCard) => {
            const { id, order, subOrderNumber, packageType, plantCount, weightInfo } = pkgCard;
            const isFullset = packageType === 'Fullset';

            const plantCountText = `${plantCount} tanaman • ${weightInfo}`;

            const isNotaPrinted = printStatus[subOrderNumber]?.notaPrinted || false;
            const isLabelPrinted = printStatus[subOrderNumber]?.labelPrinted || false;

            return (
              <div
                key={id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-4.5 space-y-3 shadow-2xs hover:border-[#04593f] transition-all"
              >
                {/* Header Package Card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
                      <PackageIcon className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                        {subOrderNumber}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        dari {order.order_number}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 font-bold text-[11px] rounded-lg ${
                      isFullset
                        ? 'bg-emerald-50 text-[#04593f] border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {packageType}
                  </span>
                </div>

                {/* Customer Info & Plant Count */}
                <div className="space-y-0.5 pt-0.5 text-xs">
                  <h4 className="text-sm font-bold text-slate-900">{order.customer_name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{plantCountText}</p>
                </div>

                {/* Print Status Indicators Row */}
                <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs font-semibold">
                  <div
                    className={`py-1.5 px-2.5 rounded-xl text-center text-[11px] border ${
                      isNotaPrinted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                        : 'bg-slate-50 text-slate-400 border-dashed border-slate-200'
                    }`}
                  >
                    {isNotaPrinted ? '✓ Nota tercetak' : 'o Nota belum dicetak'}
                  </div>

                  <div
                    className={`py-1.5 px-2.5 rounded-xl text-center text-[11px] border ${
                      isLabelPrinted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                        : 'bg-slate-50 text-slate-400 border-dashed border-slate-200'
                    }`}
                  >
                    {isLabelPrinted ? '✓ Label tercetak' : 'o Label belum dicetak'}
                  </div>
                </div>

                {/* Print Action Buttons (Side-by-Side - Antagloma Green Palette) */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={() => handlePrintNota(order, subOrderNumber)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isNotaPrinted
                        ? 'bg-emerald-50 text-[#04593f] border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-[#04593f] text-white hover:bg-emerald-900 shadow-2xs active:scale-95'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isNotaPrinted ? 'Cetak Ulang Nota' : 'Cetak Nota'}</span>
                  </button>

                  <button
                    onClick={() => handlePrintLabel(order, subOrderNumber, packageType, weightInfo)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isLabelPrinted
                        ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        : 'bg-white text-[#04593f] border border-[#04593f] hover:bg-emerald-50 shadow-2xs active:scale-95'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 text-[#04593f]" />
                    <span>{isLabelPrinted ? 'Cetak Ulang Label' : 'Cetak Label'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
    </div>
  );
};
