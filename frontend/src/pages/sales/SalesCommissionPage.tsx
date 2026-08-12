import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { managementService, SalesCommissionData, PayoutHistory } from '../../services/managementService';
import {
  Wallet, ArrowLeft, CheckCircle2, Award, TrendingUp, Clock,
  History, ShoppingBag, ChevronDown, Image as ImageIcon, CalendarRange,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SalesCommissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'PENDING' | 'TODAY' | 'HISTORY'>('PENDING');
  const [expandedPayout, setExpandedPayout] = useState<number | null>(null);

  const { data: commissionRes, isLoading } = useQuery({
    queryKey: ['sales-commission'],
    queryFn: () => managementService.getSalesCommission(),
    refetchInterval: 30000,
  });

  const payload: SalesCommissionData | undefined = commissionRes?.data;
  const rate = payload?.commission_rate ?? 5;
  const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  // KPI values for current tab
  const kpiCommission = tab === 'TODAY'
    ? (payload?.today_commission ?? 0)
    : (payload?.pending_commission ?? 0);
  const kpiPlantTotal = tab === 'TODAY'
    ? (payload?.today_plant_total ?? 0)
    : (payload?.pending_plant_total ?? 0);
  const kpiOrderCount = tab === 'TODAY'
    ? (payload?.today_order_count ?? 0)
    : (payload?.pending_order_count ?? 0);

  const kpiLabel = tab === 'TODAY' ? 'Komisi Hari Ini' : 'Komisi Pending (Belum Dibayar)';
  const kpiSub = tab === 'TODAY'
    ? 'Komisi dari pesanan terverifikasi hari ini'
    : 'Akumulasi semua pesanan yang belum dibayar';

  const pendingOrders = payload?.pending_orders ?? [];
  const payoutHistory: PayoutHistory[] = payload?.payout_history ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-28 text-slate-800">
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
          <p className="text-xs text-slate-400 font-bold mt-0.5">Komisi pending dan riwayat pembayaran dari owner</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        {([
          { key: 'PENDING', label: 'Komisi Pending' },
          { key: 'TODAY',   label: 'Hari Ini ⚡' },
          { key: 'HISTORY', label: 'Riwayat Bayar' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer text-center ${tab === key ? 'bg-white text-[#04593f] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── KPI CARD (Pending / Today) ─────────────────────────────────────── */}
      {tab !== 'HISTORY' && (
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden border border-emerald-950">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid gap-6 sm:grid-cols-12 relative z-10 items-center">
            {/* Left */}
            <div className="space-y-4 sm:col-span-7 sm:border-r sm:border-white/10 sm:pr-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 text-emerald-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-200 uppercase tracking-widest block">{kpiLabel}</span>
                  <span className="text-xs text-white/80 font-medium block">{kpiSub}</span>
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                  {isLoading ? '...' : formatRp(kpiCommission)}
                </h2>
                <p className="text-[10.5px] text-emerald-100/80 font-medium">
                  {tab === 'PENDING'
                    ? 'Terus terakumulasi hingga owner membayar'
                    : 'Dari pesanan yang diverifikasi hari ini'}
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="sm:col-span-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-emerald-100/70">Dari Harga Tanaman</span>
                <span className="font-extrabold text-white">{formatRp(kpiPlantTotal)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-emerald-100/70">Persentase Komisi</span>
                <span className="font-extrabold text-white">{rate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-100/70">Jumlah Pesanan</span>
                <span className="font-extrabold text-white">{kpiOrderCount} pesanan</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-5 border-t border-emerald-700/60 flex items-center gap-1.5 text-[11px] text-emerald-100/90 font-bold">
            <Award className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            <span>Komisi {rate}% dihitung dari Total Harga Tanaman yang sudah terverifikasi.</span>
          </div>
        </div>
      )}

      {/* ── PENDING ORDERS LIST ───────────────────────────────────────────── */}
      {tab === 'PENDING' && (
        <div className="space-y-3">
          <h2 className="text-base font-black text-slate-900 flex items-center justify-between">
            <span>Pesanan Belum Dibayar</span>
            <span className="text-xs text-slate-400 font-bold">{pendingOrders.length} pesanan</span>
          </h2>

          {isLoading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs font-bold text-slate-500">Memuat...</div>
          ) : pendingOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Semua komisi sudah dibayar! 🎉</p>
              <p className="text-[11px] text-slate-400">Pesanan baru yang terverifikasi akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingOrders.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[12px] font-black text-slate-800 leading-tight">{item.order_number}</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{item.date} · {item.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-black text-amber-700">{formatRp(item.commission)}</p>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[9px] font-bold">
                      Menunggu Bayar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TODAY'S ORDERS ────────────────────────────────────────────────── */}
      {tab === 'TODAY' && (
        <div className="space-y-3">
          <h2 className="text-base font-black text-slate-900">Pesanan Hari Ini</h2>
          {isLoading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs font-bold text-slate-500">Memuat...</div>
          ) : (
            (() => {
              const todayStr = new Date().toLocaleDateString('sv-SE');
              const todayItems = pendingOrders.filter(o => o.raw_date?.startsWith(todayStr));
              return todayItems.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center space-y-2">
                  <TrendingUp className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">Belum ada pesanan hari ini.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-5 h-5 text-[#04593f]" />
                        </div>
                        <div>
                          <h3 className="text-[12px] font-black text-slate-800 leading-tight">{item.order_number}</h3>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{item.customer_name}</p>
                        </div>
                      </div>
                      <p className="text-[13px] font-black text-[#04593f]">{formatRp(item.commission)}</p>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ── PAYOUT HISTORY ────────────────────────────────────────────────── */}
      {tab === 'HISTORY' && (
        <div className="space-y-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#04593f]" />
            Riwayat Pembayaran
          </h2>

          {isLoading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs font-bold text-slate-500">Memuat...</div>
          ) : payoutHistory.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Belum ada riwayat pembayaran komisi.</p>
              <p className="text-[11px] text-slate-400">Pembayaran dari owner akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payoutHistory.map((payout) => (
                <div key={payout.payout_id} className="bg-white rounded-2xl overflow-hidden shadow-2xs">
                  {/* Payout Header */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedPayout(expandedPayout === payout.payout_id ? null : payout.payout_id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-[#04593f]" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] font-black text-slate-800">Dibayar: {formatRp(payout.amount)}</p>
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold">LUNAS</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 font-semibold">
                          <CalendarRange className="w-3 h-3" />
                          <span>{payout.period_label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-[11px] font-black text-[#04593f]">{formatRp(payout.commission)}</p>
                        <p className="text-[9px] text-slate-400">{payout.order_count} pesanan</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedPayout === payout.payout_id ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded: order list + proof */}
                  {expandedPayout === payout.payout_id && (
                    <div className="border-t border-slate-100">
                      {/* Proof + notes */}
                      <div className="px-4 py-3 bg-slate-50 flex items-center justify-between gap-3">
                        <div>
                          {payout.notes && <p className="text-[10.5px] text-slate-500 italic">"{payout.notes}"</p>}
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Dari Omset: {formatRp(payout.plant_total)} · Rate {(payout.commission / Math.max(payout.plant_total, 1) * 100).toFixed(1)}%
                          </p>
                        </div>
                        {payout.payment_proof_path && (
                          <a
                            href={`${import.meta.env.VITE_API_URL}/storage/${payout.payment_proof_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Bukti Transfer
                          </a>
                        )}
                      </div>
                      {/* Orders breakdown */}
                      <div className="divide-y divide-slate-50">
                        {payout.orders.map((o) => (
                          <div key={o.id} className="px-4 py-2.5 flex items-center justify-between">
                            <div>
                              <p className="text-[10.5px] font-bold text-slate-700">{o.order_number} — {o.customer_name}</p>
                              <p className="text-[9.5px] text-slate-400">{o.date}</p>
                            </div>
                            <p className="text-[10.5px] font-black text-[#04593f]">{formatRp(o.commission)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
