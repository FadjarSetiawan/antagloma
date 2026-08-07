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

  // Track print status per package locally
  const [printStatus, setPrintStatus] = useState<PrintedStatusMap>({});

  const { data, isLoading } = useQuery({
    queryKey: ['document-printing-orders'],
    queryFn: () => orderService.getOrders({ status: 'PACKING_COMPLETED' }),
  });

  const orders = data?.data || [];

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
    if (orders.length > 0) {
      const firstOrder = orders[0];
      setSelectedLabelOrder({
        order: firstOrder,
        packageInfo: {
          subOrderNumber: `${firstOrder.order_number}-A`,
          packageType: 'Fullset',
          itemsSummary: `${firstOrder.items?.length || 1} tanaman`,
          weightInfo: '4.5 kg',
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
          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-sm font-black"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            Menunggu Cetak Dokumen
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Cetak nota packing & label alamat
          </p>
        </div>
      </div>

      {/* Top Batch Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={handlePrintAllNotas}
          className="py-3 px-3 bg-white border-2 border-purple-600 hover:bg-purple-50 text-purple-700 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4 text-purple-600" />
          <span>Cetak Semua Nota</span>
        </button>

        <button
          onClick={handlePrintAllLabels}
          className="py-3 px-3 bg-white border-2 border-purple-600 hover:bg-purple-50 text-purple-700 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <Tag className="w-4 h-4 text-purple-600" />
          <span>Cetak Semua Label</span>
        </button>
      </div>

      {/* Date Header */}
      <div className="pt-2">
        <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
          HARI INI • {todayFormatted}
        </span>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-normal bg-white rounded-3xl border border-slate-200 shadow-2xs">
          Memuat dokumen siap cetak...
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-700">
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
        <div className="space-y-4">
          {orders.map((order: Order, orderIdx: number) => {
            // Demo package code: ORD-0001-A, ORD-0002-A, etc.
            const pkgCode = `${order.order_number}-A`;
            const isFullset = orderIdx % 2 === 0;
            const pkgType = isFullset ? 'Fullset' : 'Non-fullset';
            
            // Check grade for weight display rule
            const firstGrade = order.items?.[0]?.grade || 'B';
            const isGradeDOrAbove = ['D', 'D+', 'J', 'J+'].includes(firstGrade);

            let weightText = '';
            if (pkgType === 'Non-fullset' || isGradeDOrAbove) {
              weightText = isGradeDOrAbove ? '4.5 kg' : '3.2 kg';
            } else {
              weightText = `Grade ${firstGrade} (tanpa berat)`;
            }

            const plantCountText = `${order.items?.length || 1} tanaman • ${weightText}`;

            const isNotaPrinted = printStatus[pkgCode]?.notaPrinted || false;
            const isLabelPrinted = printStatus[pkgCode]?.labelPrinted || false;

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xs hover:border-purple-300 transition-all"
              >
                {/* Header Package Card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold flex-shrink-0">
                      <PackageIcon className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        {pkgCode}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        dari {order.order_number}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 font-bold text-xs rounded-xl ${
                      isFullset
                        ? 'bg-emerald-50 text-[#04593f] border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {pkgType}
                  </span>
                </div>

                {/* Customer Info & Plant Count */}
                <div className="space-y-1 pt-0.5">
                  <h4 className="text-sm font-extrabold text-slate-900">{order.customer_name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{plantCountText}</p>
                </div>

                {/* Print Status Indicators Row */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs font-bold">
                  <div
                    className={`py-2 px-3 rounded-2xl text-center border ${
                      isNotaPrinted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-dashed border-slate-200'
                    }`}
                  >
                    {isNotaPrinted ? '✓ Nota tercetak' : 'o Nota belum dicetak'}
                  </div>

                  <div
                    className={`py-2 px-3 rounded-2xl text-center border ${
                      isLabelPrinted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-dashed border-slate-200'
                    }`}
                  >
                    {isLabelPrinted ? '✓ Label tercetak' : 'o Label belum dicetak'}
                  </div>
                </div>

                {/* Print Action Buttons (Side-by-Side) */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => handlePrintNota(order, pkgCode)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isNotaPrinted
                        ? 'bg-emerald-50 text-[#04593f] border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-[#04593f] text-white hover:bg-emerald-900 shadow-2xs active:scale-95'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isNotaPrinted ? 'Cetak Ulang Nota' : 'Cetak Nota'}</span>
                  </button>

                  <button
                    onClick={() => handlePrintLabel(order, pkgCode, pkgType, weightText)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isLabelPrinted
                        ? 'bg-white text-purple-700 border border-slate-200 hover:bg-slate-50'
                        : 'bg-white text-purple-700 border-2 border-purple-600 hover:bg-purple-50 shadow-2xs active:scale-95'
                    }`}
                  >
                    <Tag className="w-4 h-4 text-purple-600" />
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
