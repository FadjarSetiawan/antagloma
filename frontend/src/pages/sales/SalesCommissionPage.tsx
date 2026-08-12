import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { commissionService, CommissionItem } from '../../services/commissionService';
import { Wallet, Calendar, ArrowLeft, CheckCircle2, ChevronDown, Award, TrendingUp, Clock, Filter, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SalesCommissionPage: React.FC = () => {
  const navigate = useNavigate();

  const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-08"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [timeTab, setTimeTab] = useState<'MONTH' | 'TODAY'>('MONTH');

  const { data: commissionData, isLoading } = useQuery({
    queryKey: ['sales-commission', selectedMonth],
    queryFn: () => commissionService.getCommissionData(selectedMonth),
  });

  const payload = commissionData?.data;
  const rawHistoryList: CommissionItem[] = payload?.all_history || [];
  const activeRate = payload?.commission_rate ?? 5;

  // Derive Today's Date String in local format Y-m-d
  const todayStr = new Date().toLocaleDateString('sv-SE'); // returns "YYYY-MM-DD"

  // Filter history dynamically based on tabs and dropdowns
  const historyList = rawHistoryList.filter(item => {
    // 1. Time Filter
    if (timeTab === 'TODAY') {
      if (item.date_key !== todayStr) return false;
    } else {
      // Month tab
      if (item.month_key !== selectedMonth) return false;
    }

    // 2. Status Filter
    if (statusFilter === 'PAID') {
      return item.commission > 0 && item.is_verified;
    }
    if (statusFilter === 'UNPAID') {
      return item.commission === 0 || !item.is_verified;
    }

    return true;
  });

  // Calculate stats values depending on selected TimeTab
  const displayCommission = timeTab === 'TODAY' 
    ? (payload?.today_commission ?? 0) 
    : (payload?.monthly_commission ?? 0);

  const displayPlantTotal = timeTab === 'TODAY'
    ? (payload?.today_plant_total ?? 0)
    : (payload?.monthly_plant_total ?? 0);

  const displayOrderCount = timeTab === 'TODAY'
    ? (payload?.today_total_orders ?? 0)
    : (payload?.monthly_total_orders ?? 0);

  // Month choices for dropdown
  const monthOptions = [
    { value: '2026-08', label: 'Agustus 2026' },
    { value: '2026-07', label: 'Juli 2026' },
    { value: '2026-06', label: 'Juni 2026' },
    { value: '2026-05', label: 'Mei 2026' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-28 text-slate-800">
      {/* Top Header */}
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
          <p className="text-xs text-slate-400 font-bold mt-0.5">Ringkasan komisi dan riwayat komisi Anda</p>
        </div>
      </div>

      {/* Switch Filter Tabs: Hari Ini vs Bulan Ini */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setTimeTab('MONTH')}
          className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${timeTab === 'MONTH' ? 'bg-white text-[#04593f] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Komisi Bulan Ini
        </button>
        <button
          onClick={() => setTimeTab('TODAY')}
          className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${timeTab === 'TODAY' ? 'bg-white text-[#04593f] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Komisi Hari Ini ⚡
        </button>
      </div>

      {/* Dropdown Filters Line */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
        {/* Month selector (only visible/active when Month tab is selected) */}
        <div className={`relative ${timeTab === 'TODAY' ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <select
              value={selectedMonth}
              disabled={timeTab === 'TODAY'}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none font-bold text-xs focus:outline-none cursor-pointer appearance-none pr-5 text-slate-700"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-slate-900 bg-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer">
            <Filter className="w-3.5 h-3.5 text-emerald-800" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent border-none font-bold text-xs focus:outline-none cursor-pointer appearance-none pr-5 text-slate-700"
            >
              <option value="ALL">Semua Status</option>
              <option value="PAID">Sudah Dibayarkan</option>
              <option value="UNPAID">Menunggu Verifikasi</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Emerald KPI Card (Replicating Design layout Mockup Exactly) */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden border border-emerald-950">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid gap-6 sm:grid-cols-12 relative z-10 items-center">
          {/* Left panel: big amount */}
          <div className="space-y-4 sm:col-span-7 sm:border-r sm:border-white/10 sm:pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 text-emerald-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-widest block">
                  {timeTab === 'TODAY' ? 'TOTAL KOMISI HARI INI' : 'TOTAL KOMISI BULAN INI'}
                </span>
                <span className="text-xs text-white/80 font-medium block">
                  {timeTab === 'TODAY' ? 'Komisi realtime hari ini' : `Periode ${selectedMonth}`}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                {isLoading ? '...' : `Rp ${displayCommission.toLocaleString('id-ID')}`}
              </h2>
              <p className="text-[10.5px] text-emerald-100/80 font-medium">
                {timeTab === 'TODAY' ? 'Akumulasi komisi khusus hari ini' : 'Total komisi bersih yang Anda dapatkan'}
              </p>
            </div>
          </div>

          {/* Right panel: Details */}
          <div className="sm:col-span-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-emerald-100/70">Dari Harga Tanaman</span>
              <span className="font-extrabold text-white">Rp {displayPlantTotal.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-emerald-100/70">Persentase Komisi</span>
              <span className="font-extrabold text-white">{activeRate}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-emerald-100/70">Jumlah Pesanan</span>
              <span className="font-extrabold text-white">{displayOrderCount} pesanan</span>
            </div>
          </div>
        </div>

        {/* Calculation Info Banner */}
        <div className="relative z-10 pt-4 mt-5 border-t border-emerald-700/60 flex items-center justify-between text-[11px] text-emerald-100/90 font-bold">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            <span>Komisi {activeRate}% dihitung dari Total Harga Tanaman terverifikasi.</span>
          </div>

          {/* Payout Transfer Proof Link (for month tab only) */}
          {timeTab === 'MONTH' && payload?.payout_proof_path && (
            <a
              href={`${import.meta.env.VITE_API_URL}/storage/${payload.payout_proof_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-white/15 border border-white/20 rounded-lg hover:bg-white/25 transition-colors inline-flex items-center gap-1 text-[10px]"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Unduh Bukti Gaji</span>
            </a>
          )}
        </div>
      </div>

      {/* Commission History Section */}
      <div className="space-y-3">
        <h2 className="text-base font-black text-slate-900 flex items-center justify-between">
          <span>Riwayat Komisi</span>
          <span className="text-xs text-slate-400 font-bold">Menampilkan {historyList.length} baris</span>
        </h2>

        {isLoading ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center text-xs font-bold text-slate-500 shadow-2xs">
            Memuat data riwayat komisi...
          </div>
        ) : historyList.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-8 text-center space-y-2 shadow-2xs">
            <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Belum ada riwayat komisi pada periode filter ini.</p>
            <p className="text-[11px] text-slate-400">Buat pesanan baru untuk mendapatkan komisi penjualan.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {historyList.map((item, idx) => (
              <div key={item.id || idx} className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-[#04593f]" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-black text-slate-800 leading-tight">Komisi Penjualan</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{item.date}</p>
                    <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                      {item.order_number} • {item.customer_name} ({item.item_count} pesanan)
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end space-y-1.5">
                  <span className="text-[13px] font-black text-[#04593f]">
                    Rp {item.commission.toLocaleString('id-ID')}
                  </span>
                  
                  {item.commission > 0 ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-[#04593f] border border-emerald-200 rounded-md text-[9px] font-medium leading-none flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                      <span>Sudah Dibayarkan</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[9px] font-medium leading-none flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      <span>Menunggu Verifikasi</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
