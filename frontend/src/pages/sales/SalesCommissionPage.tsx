import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { managementService, SalesCommissionData } from '../../services/managementService';
import {
  ArrowLeft, Clock, ShieldCheck, Wallet, XCircle, ChevronRight, Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SalesCommissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const { data: commissionRes, isLoading } = useQuery({
    queryKey: ['sales-commission'],
    queryFn: () => managementService.getSalesCommission(),
    refetchInterval: 30000,
  });

  const payload: SalesCommissionData | undefined = commissionRes?.data;
  const summary = payload?.summary ?? {
    waiting_verification: 0,
    verified: 0,
    paid: 0,
    rejected: 0,
  };
  const history = payload?.history ?? [];
  const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  const filteredHistory = history.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.status_key === filterStatus;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 text-slate-800 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">Komisi Saya</h1>
          <p className="text-xs text-slate-400 font-bold mt-0.5">Ringkasan status komisi & riwayat pesanan Anda</p>
        </div>
      </div>

      {/* ── RINGKASAN KOMISI (4 CARD GRID MATCHING MOCKUP) ────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">Ringkasan Komisi</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Selengkapnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: Menunggu Verifikasi */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'waiting_verification' ? 'ALL' : 'waiting_verification')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'waiting_verification'
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/50'
                : 'bg-amber-50/50 border-amber-200/70 hover:bg-amber-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-600 leading-tight">Menunggu Verifikasi</p>
            <p className="text-base sm:text-lg font-black text-amber-700 mt-1">
              {isLoading ? '...' : formatRp(summary.waiting_verification)}
            </p>
          </div>

          {/* Card 2: Terverifikasi */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'verified' ? 'ALL' : 'verified')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'verified'
                ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/50'
                : 'bg-emerald-50/50 border-emerald-200/70 hover:bg-emerald-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-600 leading-tight">Terverifikasi</p>
            <p className="text-base sm:text-lg font-black text-emerald-800 mt-1">
              {isLoading ? '...' : formatRp(summary.verified)}
            </p>
          </div>

          {/* Card 3: Sudah dibayarkan */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'paid' ? 'ALL' : 'paid')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'paid'
                ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-400/50'
                : 'bg-blue-50/50 border-blue-200/70 hover:bg-blue-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-100/80 text-blue-700 flex items-center justify-center mb-3">
              <Wallet className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-600 leading-tight">Sudah dibayarkan</p>
            <p className="text-base sm:text-lg font-black text-blue-800 mt-1">
              {isLoading ? '...' : formatRp(summary.paid)}
            </p>
          </div>

          {/* Card 4: Pembayaran ditolak */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'rejected' ? 'ALL' : 'rejected')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/50'
                : 'bg-rose-50/50 border-rose-200/70 hover:bg-rose-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-rose-100/80 text-rose-600 flex items-center justify-center mb-3">
              <XCircle className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-600 leading-tight">Pembayaran ditolak</p>
            <p className="text-base sm:text-lg font-black text-rose-700 mt-1">
              {isLoading ? '...' : formatRp(summary.rejected)}
            </p>
          </div>
        </div>
      </div>

      {/* ── RIWAYAT KOMISI LIST (MATCHING MOCKUP) ───────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">Riwayat Komisi</h2>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="waiting_verification">Menunggu Verifikasi</option>
              <option value="verified">Terverifikasi</option>
              <option value="paid">Sudah Dibayarkan</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs font-bold text-slate-400">Memuat riwayat komisi...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-slate-400">
            Belum ada data riwayat komisi untuk status ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/orders/${item.id}`)}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-1 transition-colors cursor-pointer"
              >
                {/* Left info */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{item.order_number}</p>
                  <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                    {item.customer_name} • {item.delivery_method || 'Kirim Paket'}
                  </p>
                </div>

                {/* Middle date */}
                <span className="text-[11px] font-bold text-slate-400 shrink-0 hidden sm:inline">
                  {item.date}
                </span>

                {/* Right status badge + amount */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <span className="text-[10px] font-bold text-slate-400 sm:hidden block">{item.date}</span>

                  {/* Badges */}
                  {item.status_key === 'waiting_verification' && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      Menunggu Verifikasi
                    </span>
                  )}
                  {item.status_key === 'verified' && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Terverifikasi
                    </span>
                  )}
                  {item.status_key === 'paid' && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                      Sudah Dibayarkan
                    </span>
                  )}
                  {item.status_key === 'rejected' && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                      Pembayaran Ditolak
                    </span>
                  )}

                  <span className="text-xs sm:text-sm font-black text-slate-900 min-w-[70px]">
                    {formatRp(item.commission)}
                  </span>

                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
