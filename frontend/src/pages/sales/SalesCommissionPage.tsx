import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { commissionService, CommissionItem } from '../../services/commissionService';
import { Wallet, Calendar, ArrowLeft, CheckCircle2, ChevronDown, Award, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SalesCommissionPage: React.FC = () => {
  const navigate = useNavigate();

  const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-08"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);

  const { data: commissionData, isLoading } = useQuery({
    queryKey: ['sales-commission', selectedMonth],
    queryFn: () => commissionService.getCommissionData(selectedMonth),
  });

  const payload = commissionData?.data;
  const historyList: CommissionItem[] = payload?.history || [];
  const monthlyCommission = payload?.monthly_commission || 0;

  // Month choices for dropdown
  const monthOptions = [
    { value: '2026-08', label: 'Agustus 2026' },
    { value: '2026-07', label: 'Juli 2026' },
    { value: '2026-06', label: 'Juni 2026' },
    { value: '2026-05', label: 'Mei 2026' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Komisi Saya</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Ringkasan komisi dan riwayat komisi Anda</p>
        </div>
      </div>

      {/* Main Emerald KPI Card (Replicating Mobile Screenshot Exactly) */}
      <div className="bg-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6 border border-emerald-900">
        {/* Background Subtle Gradient Overlay */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/30 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="flex items-start justify-between relative z-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-emerald-200 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-emerald-100 uppercase tracking-wider block">Komisi Saya</span>
              <span className="text-sm font-extrabold text-white block">Bulan Ini</span>
            </div>
          </div>

          {/* Month Selector Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-extrabold text-white cursor-pointer transition-colors">
              <Calendar className="w-4 h-4 text-emerald-200" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-white font-extrabold text-xs focus:outline-none cursor-pointer appearance-none pr-5"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-slate-900 font-bold bg-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-emerald-200 absolute right-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Large Amount Display */}
        <div className="relative z-10 space-y-1">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            {isLoading ? '...' : `Rp ${monthlyCommission.toLocaleString('id-ID')}`}
          </h2>
          <p className="text-xs text-emerald-100 font-medium">Total komisi yang Anda dapatkan bulan ini</p>
        </div>

        {/* Calculation Info Banner */}
        <div className="relative z-10 pt-2 border-t border-emerald-700/60 flex items-center gap-2 text-[11px] text-emerald-200 font-bold">
          <Award className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span>Komisi 5% dihitung otomatis dari Total Harga Tanaman setelah diverifikasi Admin.</span>
        </div>
      </div>

      {/* Commission History Section */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-slate-900">Riwayat Komisi</h2>

        {isLoading ? (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center text-xs font-bold text-slate-500">
            Memuat data riwayat komisi...
          </div>
        ) : historyList.length === 0 ? (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 text-center space-y-2 shadow-xs">
            <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Belum ada riwayat komisi pada bulan ini.</p>
            <p className="text-[11px] text-slate-400">Buat pesanan baru untuk mendapatkan komisi penjualan 5%.</p>
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 divide-y divide-slate-100">
            {historyList.map((item, idx) => (
              <div key={item.id || idx} className={`${idx > 0 ? 'pt-4' : ''} flex items-center justify-between gap-3`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">Komisi Penjualan</h3>
                    <p className="text-xs font-extrabold text-slate-600 mt-0.5">{item.date}</p>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                      {item.order_number} • {item.customer_name} ({item.item_count} pesanan)
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end space-y-1">
                  <span className="text-sm sm:text-base font-black text-emerald-800">
                    Rp {item.commission.toLocaleString('id-ID')}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>Sudah Dibayarkan</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
