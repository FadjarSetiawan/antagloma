import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { managementService, SalesCommissionData } from '../../services/managementService';
import { CustomDatePickerModal } from '../../components/shared/CustomDatePickerModal';
import {
  ArrowLeft, Clock, ShieldCheck, Wallet, XCircle, ChevronRight, Filter, Calendar as CalendarIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SalesCommissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [selectedMonthDate, setSelectedMonthDate] = useState<string>('2026-08-13');

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
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-28 text-slate-800 font-sans px-1 sm:px-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 sm:p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs shrink-0"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight truncate">Komisi Saya</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-bold mt-0.5 truncate">Ringkasan status komisi & riwayat pesanan Anda</p>
        </div>
      </div>

      {/* Month & Filter Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsDatePickerOpen(true)}
          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-[#04593f] hover:bg-emerald-50/50 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer active:scale-95"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#04593f]" />
          <span>
            {selectedMonthDate
              ? new Date(selectedMonthDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
              : 'Agustus 2026'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-400 shrink-0" />
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === 'ALL' ? 'verified' : 'ALL')}
          className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0"
        >
          <span>Filter Status</span>
          <Filter className="w-3 h-3 text-slate-500" />
        </button>
      </div>

      {/* ── GREEN BANNER CARD: TOTAL KOMISI BULAN INI (PERFECT MOBILE FIT) ── */}
      <div className="bg-gradient-to-br from-[#04593f] via-[#04593f] to-emerald-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg relative overflow-hidden border border-emerald-950 font-sans space-y-3">
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          {/* Header Row */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-white/15 text-emerald-100 flex items-center justify-center shrink-0 shadow-inner">
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[9.5px] sm:text-[10px] font-extrabold text-emerald-200 uppercase tracking-wider">
              TOTAL KOMISI BULAN INI
            </span>
          </div>

          {/* Big Amount */}
          <div className="space-y-0.5">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {isLoading ? '...' : formatRp(payload?.total_commission_this_month ?? (summary.verified + summary.paid))}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-emerald-100/90 font-medium">
              Total komisi yang Anda dapatkan pada Agustus 2026
            </p>
          </div>

          {/* 3 Stats Row (Responsive Flex Wrap) */}
          <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-y-2 gap-x-1 text-xs">
            <div className="pr-1">
              <span className="text-emerald-200/80 text-[9px] sm:text-[10px] font-medium block">Total Tanaman</span>
              <span className="font-extrabold text-white text-[11px] sm:text-xs block">
                {formatRp(payload?.total_plant_total ?? 0)}
              </span>
            </div>

            <div className="px-1 border-x border-white/10 sm:border-none">
              <span className="text-emerald-200/80 text-[9px] sm:text-[10px] font-medium block">Persentase</span>
              <span className="font-extrabold text-white text-[11px] sm:text-xs block">{payload?.commission_rate ?? 5}%</span>
            </div>

            <div className="pl-1">
              <span className="text-emerald-200/80 text-[9px] sm:text-[10px] font-medium block">Pesanan</span>
              <span className="font-extrabold text-white text-[11px] sm:text-xs block">{payload?.total_orders_count ?? 0} order</span>
            </div>
          </div>
        </div>

        {/* Footer Note inside Green Banner */}
        <div className="relative z-10 pt-2 border-t border-emerald-800/80 flex items-start gap-1.5 text-[9.5px] sm:text-[10.5px] text-emerald-100/90 font-medium leading-tight">
          <div className="w-3.5 h-3.5 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[8px] font-bold">i</span>
          </div>
          <span>Komisi {payload?.commission_rate ?? 5}% dihitung otomatis dari Total Harga Tanaman setelah diverifikasi Admin.</span>
        </div>
      </div>

      {/* ── RINGKASAN KOMISI (2x2 GRID RESPONSIVE) ───────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-base font-extrabold text-slate-900">Ringkasan Komisi</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-[11px] sm:text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Selengkapnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2x2 Grid on Mobile, 4-column Grid on Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Card 1: Menunggu Verifikasi */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'waiting_verification' ? 'ALL' : 'waiting_verification')}
            className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'waiting_verification'
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/50'
                : 'bg-amber-50/50 border-amber-200/70 hover:bg-amber-50'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-amber-100/80 text-amber-600 flex items-center justify-center mb-1.5">
              <Clock className="w-3 h-3" />
            </div>
            <p className="text-[9.5px] sm:text-[11px] font-bold text-slate-600 leading-tight truncate">Menunggu Verifikasi</p>
            <p className="text-xs sm:text-lg font-black text-amber-700 mt-0.5 truncate">
              {isLoading ? '...' : formatRp(summary.waiting_verification)}
            </p>
          </div>

          {/* Card 2: Terverifikasi */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'verified' ? 'ALL' : 'verified')}
            className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'verified'
                ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/50'
                : 'bg-emerald-50/50 border-emerald-200/70 hover:bg-emerald-50'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-1.5">
              <ShieldCheck className="w-3 h-3" />
            </div>
            <p className="text-[9.5px] sm:text-[11px] font-bold text-slate-600 leading-tight truncate">Terverifikasi</p>
            <p className="text-xs sm:text-lg font-black text-emerald-800 mt-0.5 truncate">
              {isLoading ? '...' : formatRp(summary.verified)}
            </p>
          </div>

          {/* Card 3: Sudah dibayarkan */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'paid' ? 'ALL' : 'paid')}
            className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'paid'
                ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-400/50'
                : 'bg-blue-50/50 border-blue-200/70 hover:bg-blue-50'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-blue-100/80 text-blue-700 flex items-center justify-center mb-1.5">
              <Wallet className="w-3 h-3" />
            </div>
            <p className="text-[9.5px] sm:text-[11px] font-bold text-slate-600 leading-tight truncate">Sudah dibayarkan</p>
            <p className="text-xs sm:text-lg font-black text-blue-800 mt-0.5 truncate">
              {isLoading ? '...' : formatRp(summary.paid)}
            </p>
          </div>

          {/* Card 4: Pembayaran ditolak */}
          <div
            onClick={() => setFilterStatus(filterStatus === 'rejected' ? 'ALL' : 'rejected')}
            className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/50'
                : 'bg-rose-50/50 border-rose-200/70 hover:bg-rose-50'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-rose-100/80 text-rose-600 flex items-center justify-center mb-1.5">
              <XCircle className="w-3 h-3" />
            </div>
            <p className="text-[9.5px] sm:text-[11px] font-bold text-slate-600 leading-tight truncate">Pembayaran ditolak</p>
            <p className="text-xs sm:text-lg font-black text-rose-700 mt-0.5 truncate">
              {isLoading ? '...' : formatRp(summary.rejected)}
            </p>
          </div>
        </div>
      </div>

      {/* ── RIWAYAT KOMISI LIST (COMPACT & FULLY FITTED) ───────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs sm:text-base font-extrabold text-slate-900 truncate">Riwayat Komisi</h2>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 shrink-0">
            <Filter className="w-3 h-3 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none font-bold text-[11px] focus:outline-none cursor-pointer"
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
          <div className="py-6 text-center text-xs font-bold text-slate-400">Memuat riwayat komisi...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-6 text-center text-xs font-bold text-slate-400">
            Belum ada data riwayat komisi untuk status ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/orders/${item.id}`)}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                {/* Left info */}
                <div className="min-w-0 flex-1 pr-0.5">
                  <p className="text-[11px] sm:text-sm font-black text-slate-900 truncate leading-tight">{item.order_number}</p>
                  <p className="text-[9.5px] sm:text-[11px] font-medium text-slate-400 truncate mt-0.5">
                    {item.customer_name} • {item.delivery_method || 'Kirim Paket'}
                  </p>
                </div>

                {/* Right info: date, badge & commission */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0 text-right">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 shrink-0">
                    {item.date}
                  </span>

                  {item.status_key === 'waiting_verification' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[8.5px] sm:text-[10px] font-extrabold shrink-0">
                      Menunggu
                    </span>
                  )}
                  {item.status_key === 'verified' && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8.5px] sm:text-[10px] font-extrabold shrink-0">
                      Terverifikasi
                    </span>
                  )}
                  {item.status_key === 'paid' && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[8.5px] sm:text-[10px] font-extrabold shrink-0">
                      Dibayar
                    </span>
                  )}
                  {item.status_key === 'rejected' && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[8.5px] sm:text-[10px] font-extrabold shrink-0">
                      Ditolak
                    </span>
                  )}

                  <span className="text-[11px] sm:text-sm font-black text-slate-900 shrink-0">
                    {formatRp(item.commission)}
                  </span>

                  <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Custom Date Picker Modal */}
      <CustomDatePickerModal
        isOpen={isDatePickerOpen}
        value={selectedMonthDate}
        onChange={(val) => {
          if (val) setSelectedMonthDate(val);
        }}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </div>
  );
};
