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
      {/* Month & Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs">
          <span>Agustus 2026</span>
          <ChevronRight className="w-4 h-4 rotate-90 text-slate-400" />
        </div>

        <button
          onClick={() => setFilterStatus(filterStatus === 'ALL' ? 'verified' : 'ALL')}
          className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 cursor-pointer"
        >
          <span>Filter Status</span>
          <Filter className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      {/* ── GREEN BANNER CARD: TOTAL KOMISI BULAN INI ──────────────────────────── */}
      <div className="bg-gradient-to-r from-[#04593f] to-emerald-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden border border-emerald-950 font-sans space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid gap-6 sm:grid-cols-12 relative z-10 items-center">
          {/* Left Side */}
          <div className="space-y-4 sm:col-span-7 sm:border-r sm:border-white/10 sm:pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 text-emerald-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-widest block">
                  TOTAL KOMISI BULAN INI
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                {isLoading ? '...' : formatRp(payload?.total_commission_this_month ?? (summary.verified + summary.paid))}
              </h2>
              <p className="text-[11px] text-emerald-100/80 font-medium">
                Total komisi yang Anda dapatkan pada Agustus 2026
              </p>
            </div>
          </div>

          {/* Right Side */}
          <div className="sm:col-span-5 space-y-3.5 text-xs">
            <div className="space-y-0.5">
              <span className="text-emerald-200/80 text-[11px] font-medium block">Dari Total Harga Tanaman</span>
              <span className="font-extrabold text-white text-sm block">
                {formatRp(payload?.total_plant_total ?? 0)}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-emerald-200/80 text-[11px] font-medium block">Persentase Komisi</span>
              <span className="font-extrabold text-white text-sm block">{payload?.commission_rate ?? 5}%</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-emerald-200/80 text-[11px] font-medium block">Jumlah Pesanan</span>
              <span className="font-extrabold text-white text-sm block">{payload?.total_orders_count ?? 0} pesanan</span>
            </div>
          </div>
        </div>

        {/* Footer Note inside Green Banner */}
        <div className="relative z-10 pt-3 border-t border-emerald-700/60 flex items-center gap-2 text-[11px] text-emerald-100/90 font-medium">
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold">i</span>
          </div>
          <span>Komisi {payload?.commission_rate ?? 5}% dihitung otomatis dari Total Harga Tanaman setelah diverifikasi Admin.</span>
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
