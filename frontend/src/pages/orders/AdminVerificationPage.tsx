import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/orderService';
import { OrderDetailModal } from '../../components/orders/OrderDetailModal';
import { Order } from '../../types/order';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
  Phone,
  ZoomIn,
  ChevronDown,
  Info,
  X,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [zoomProofUrl, setZoomProofUrl] = useState<string | null>(null);
  const [verifiedSuccessNum, setVerifiedSuccessNum] = useState<string | null>(null);
  const [rejectedSuccessNum, setRejectedSuccessNum] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders-verification', search],
    queryFn: () => orderService.getOrders({ status: 'WAITING_PROCESS', search }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => orderService.approveOrder(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders-verification'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setVerifiedSuccessNum(res.data.order_number);
      setTimeout(() => setVerifiedSuccessNum(null), 5000);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => orderService.deleteOrder(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders-verification'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setRejectedSuccessNum(`Pesanan #${variables} telah ditolak`);
      setTimeout(() => setRejectedSuccessNum(null), 4000);
    },
  });

  const orders = data?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">Pesanan Menunggu Verifikasi</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Verifikasi pembayaran dari pelanggan</p>
          </div>
        </div>

        <button className="px-4 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-extrabold text-slate-700 flex items-center gap-1.5 shadow-xs cursor-pointer">
          <Filter className="w-4 h-4 text-emerald-800" /> Filter
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, no, pesanan, atau no. WhatsApp..."
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 shadow-xs"
          />
        </div>
      </div>

      {/* Verified Success Alert Banner */}
      {verifiedSuccessNum && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-3xl flex items-start justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Pembayaran berhasil diverifikasi</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Pesanan <span className="font-extrabold text-emerald-900">{verifiedSuccessNum}</span> dipindahkan ke "Belum Diatur Pengiriman"
              </p>
            </div>
          </div>
          <button onClick={() => setVerifiedSuccessNum(null)} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rejected Alert Banner */}
      {rejectedSuccessNum && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-3xl flex items-start justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <X className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-rose-950 text-xs sm:text-sm">Pembayaran Ditolak</h4>
              <p className="text-xs text-rose-800 font-medium mt-0.5">{rejectedSuccessNum}</p>
            </div>
          </div>
          <button onClick={() => setRejectedSuccessNum(null)} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Queue Instruction Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-xs text-slate-600 font-bold">
        <Info className="w-4 h-4 text-emerald-800 flex-shrink-0" />
        <span>Verifikasi dari atas ke bawah sesuai urutan antrean</span>
      </div>

      {/* Order Verification Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-bold bg-white rounded-3xl border-2 border-slate-200">
            Memuat pesanan menunggu verifikasi...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Semua Pembayaran Terverifikasi</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium max-w-xs mx-auto">
                Tidak ada pesanan baru yang menunggu verifikasi pembayaran saat ini.
              </p>
            </div>
          </div>
        ) : (
          orders.map((order, idx) => {
            const itemCount = order.items?.length || 1;
            const plantTotal = order.items?.reduce((acc, i) => acc + Number(i.quantity) * Number(i.price), 0) || 0;
            const shippingCost = Number(order.buyer_shipping_cost) || 0;
            const grandTotal = plantTotal + shippingCost;
            const proofUrl = order.payment_proof_url
              ? order.payment_proof_url
              : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&q=80';

            return (
              <div key={order.id} className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm relative">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Queue Badge */}
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-black text-xs flex items-center justify-center flex-shrink-0">
                      #{idx + 1}
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-emerald-900">{order.order_number}</span>
                      </div>
                      <h3 className="text-xs font-black text-slate-900">{order.customer_name}</h3>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <a
                          href={`https://wa.me/${order.phone?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-emerald-800 font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Phone className="w-3 h-3 text-emerald-700" />
                          <span>{order.phone}</span>
                        </a>

                        <span className="px-2 py-0.5 bg-purple-100 border border-purple-200 text-purple-900 rounded-md font-extrabold text-[10px] uppercase">
                          {order.payment_method || 'Transfer Bank'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Info: Status & Price */}
                  <div className="text-right space-y-1">
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[10px] font-extrabold inline-block">
                      Menunggu Verifikasi
                    </span>
                    <div className="text-[11px] text-slate-400 font-bold">Total diterima</div>
                    <div className="text-sm sm:text-base font-black text-emerald-800">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">{itemCount} item</div>
                  </div>

                  {/* Payment Proof Thumbnail */}
                  <div
                    onClick={() => setZoomProofUrl(proofUrl)}
                    className="relative w-16 h-20 rounded-2xl border-2 border-slate-200 overflow-hidden cursor-pointer group flex-shrink-0 bg-slate-100"
                  >
                    <img src={proofUrl} alt="Bukti Transfer" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Top Action Button: Lihat Detail Pesanan */}
                <div>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full py-2.5 px-4 bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-800 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Lihat Detail Pesanan</span>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Bottom Row Action Buttons: Tolak (Left) & Verifikasi (Right) */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                  <button
                    disabled={rejectMutation.isPending}
                    onClick={() => {
                      if (confirm(`Apakah Anda yakin ingin menolak pembayaran pesanan ${order.order_number}?`)) {
                        rejectMutation.mutate(order.id);
                      }
                    }}
                    className="py-3 px-4 bg-white border-2 border-rose-300 hover:bg-rose-50 text-rose-800 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Tolak Pembayaran</span>
                  </button>

                  <button
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(order.id)}
                    className="py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Verifikasi Pembayaran</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Zoom Proof */}
      {zoomProofUrl && (
        <div
          onClick={() => setZoomProofUrl(null)}
          className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-3 border-2 border-slate-200 shadow-2xl">
            <img src={zoomProofUrl} alt="Bukti Transfer Zoom" className="w-full max-h-[80vh] object-contain rounded-2xl" />
            <p className="text-center text-xs font-bold text-slate-600 mt-2">Klik di mana saja untuk menutup</p>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onApprove={(id) => approveMutation.mutate(id)}
          onDelete={(id) => rejectMutation.mutate(id)}
          isActionLoading={approveMutation.isPending || rejectMutation.isPending}
        />
      )}
    </div>
  );
};
