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
  Phone,
  ZoomIn,
  Info,
  X,
  Check,
  Building2,
  Wallet,
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

  // Popup Modal States
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [isVerifyChecked, setIsVerifyChecked] = useState(false);

  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [isRejectChecked, setIsRejectChecked] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['orders-verification', search],
    queryFn: () => orderService.getOrders({ status: 'WAITING_PROCESS', search }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => orderService.approveOrder(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders-verification'] });
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['packing-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setVerifiedSuccessNum(res.data.order_number);
      setVerifyingOrder(null);
      setSelectedOrder(null);
      setIsVerifyChecked(false);
      setTimeout(() => setVerifiedSuccessNum(null), 5000);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => orderService.deleteOrder(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders-verification'] });
      queryClient.invalidateQueries({ queryKey: ['orders-list'] });
      queryClient.invalidateQueries({ queryKey: ['packing-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setRejectedSuccessNum(`Pesanan telah berhasil ditolak`);
      setRejectingOrder(null);
      setIsRejectChecked(false);
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
            placeholder="Cari nama customer / no order..."
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs"
          />
        </div>
      </div>

      {/* Verification Success Alert Banner */}
      {verifiedSuccessNum && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-3xl flex items-start justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Pembayaran Berhasil Diverifikasi</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Pesanan <span className="font-extrabold text-emerald-900">{verifiedSuccessNum}</span> otomatis hilang dari antrean ini dan dipindahkan ke kartu <span className="font-extrabold text-emerald-900 font-black">"Belum Diatur Pengiriman" (Packing Queue)</span>.
              </p>
            </div>
          </div>
          <button onClick={() => setVerifiedSuccessNum(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
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
          <button onClick={() => setRejectedSuccessNum(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
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
            <div className="w-16 h-16 bg-emerald-50 rounded-full border-2 border-emerald-200 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
            </div>
            <h3 className="text-base font-black text-slate-900">Semua Pembayaran Terverifikasi</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm">
              Tidak ada antrean pesanan yang menunggu verifikasi saat ini.
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const plantTotalPrice = order.items ? order.items.reduce((s, item) => s + item.price, 0) : 0;
            const totalAmount = plantTotalPrice + (order.buyer_shipping_cost || 0);

            return (
              <div
                key={order.id}
                className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm relative hover:border-emerald-800 transition-all"
              >
                {/* Card Top Details */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-base font-black text-slate-900 block">{order.customer_name}</span>
                    <span className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {order.phone}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-extrabold block">TOTAL PEMBAYARAN</span>
                    <span className="text-sm font-black text-emerald-900">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Bank / Payment Method Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-black block uppercase">Metode</span>
                      <span className="text-slate-900 text-[11px] font-black">{order.payment_method || 'Transfer Bank'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-black block uppercase">Bank Tujuan</span>
                      <span className="text-slate-900 text-[11px] font-black">{order.bank_name || 'BCA'}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Proof Thumbnail */}
                {order.payment_proof_url && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Foto Bukti Transfer</span>
                    <div
                      onClick={() => setZoomProofUrl(order.payment_proof_url || null)}
                      className="relative w-full h-36 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer group"
                    >
                      <img src={order.payment_proof_url} alt="Bukti Pembayaran" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-extrabold text-xs transition-opacity gap-1.5">
                        <ZoomIn className="w-4 h-4" /> Perbesar Bukti
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons: Lihat Detail, Tolak, Verifikasi */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black transition-colors cursor-pointer"
                  >
                    Lihat Detail Pesanan
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setRejectingOrder(order);
                        setIsRejectChecked(false);
                      }}
                      className="py-3 px-3 bg-white border-2 border-rose-200 hover:bg-rose-50 text-rose-800 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" /> Tolak Pembayaran
                    </button>

                    <button
                      onClick={() => {
                        setVerifyingOrder(order);
                        setIsVerifyChecked(false);
                      }}
                      className="py-3 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" /> Verifikasi Pembayaran
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* POPUP MODAL 1: VERIFIKASI PEMBAYARAN */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 w-full h-full overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-[95%] max-w-md my-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-800 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">Verifikasi Pembayaran</h3>
              </div>
              <button onClick={() => setVerifyingOrder(null)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Apakah Anda yakin ingin memverifikasi pembayaran pesanan <span className="font-extrabold text-slate-900">{verifyingOrder.order_number}</span> atas nama <span className="font-extrabold text-slate-900">{verifyingOrder.customer_name}</span>?
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-950">
              ✓ Pesanan yang diverifikasi akan otomatis dipindahkan ke kartu <span className="font-black">"Belum Diatur Pengiriman" (Antrean Packing)</span>.
            </div>

            {/* Checkbox Confirmation */}
            <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer text-xs font-extrabold text-slate-900">
              <input
                type="checkbox"
                checked={isVerifyChecked}
                onChange={(e) => setIsVerifyChecked(e.target.checked)}
                className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700 mt-0.5 cursor-pointer"
              />
              <span>Saya sudah memeriksa bukti transfer dan dana masuk dengan benar.</span>
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyingOrder(null)}
                className="py-3 px-4 bg-white border-2 border-slate-300 text-slate-800 rounded-2xl text-xs font-black cursor-pointer"
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

      {/* POPUP MODAL 2: TOLAK PEMBAYARAN */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6 w-full h-full overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl w-[95%] max-w-md my-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-800 text-white flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900">Tolak Pembayaran</h3>
              </div>
              <button onClick={() => setRejectingOrder(null)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Apakah Anda yakin ingin menolak pembayaran pesanan <span className="font-extrabold text-slate-900">{rejectingOrder.order_number}</span> atas nama <span className="font-extrabold text-slate-900">{rejectingOrder.customer_name}</span>?
            </p>

            {/* Checkbox Confirmation */}
            <label className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl cursor-pointer text-xs font-extrabold text-rose-950">
              <input
                type="checkbox"
                checked={isRejectChecked}
                onChange={(e) => setIsRejectChecked(e.target.checked)}
                className="w-4 h-4 text-rose-800 rounded focus:ring-rose-700 mt-0.5 cursor-pointer"
              />
              <span>Saya yakin bukti pembayaran ini tidak valid / belum masuk.</span>
            </label>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="py-3 px-4 bg-white border-2 border-slate-300 text-slate-800 rounded-2xl text-xs font-black cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!isRejectChecked || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate(rejectingOrder.id)}
                className="py-3 px-4 bg-rose-800 hover:bg-rose-900 disabled:opacity-40 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer"
              >
                {rejectMutation.isPending ? 'Menolak...' : 'Ya, Tolak Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP ZOOM PROOF IMAGE */}
      {zoomProofUrl && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-3 shadow-2xl space-y-3">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-black text-slate-900">Bukti Pembayaran / Transfer</span>
              <button onClick={() => setZoomProofUrl(null)} className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={zoomProofUrl} alt="Zoom Bukti" className="w-full max-h-[80vh] object-contain rounded-2xl border border-slate-200" />
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onApprove={(id) => approveMutation.mutate(id)}
        onDelete={(id) => rejectMutation.mutate(id)}
      />
    </div>
  );
};
