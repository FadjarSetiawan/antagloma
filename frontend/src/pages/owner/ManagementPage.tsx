import React, { useState, useEffect } from 'react';
import {
  MoreVertical, Percent, Tag, X, Wallet, CheckCircle2,
  Upload, Image as ImageIcon, CalendarRange, Eye, ShoppingBag,
  TrendingUp, Clock,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  managementService, Discount, SalesCommissionOwnerView, PreviewResult,
} from '../../services/managementService';

type Props = { section: 'commission' | 'discount' };

export const ManagementPage: React.FC<Props> = ({ section }) => {
  const qc = useQueryClient();

  // ── Rate editing ──────────────────────────────────────────────────────────
  const [editing, setEditing] = useState<{ id: number; name: string; email: string; rate: string } | null>(null);

  // ── Payout modal state ────────────────────────────────────────────────────
  const [payoutTarget, setPayoutTarget] = useState<SalesCommissionOwnerView | null>(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutProofFile, setPayoutProofFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // ── Feedback ──────────────────────────────────────────────────────────────
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ── Discount UI state ─────────────────────────────────────────────────────
  const [menu, setMenu] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<Discount | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    is_active: true,
  });

  // ── Data fetching ─────────────────────────────────────────────────────────
  const commissionsQ = useQuery({
    queryKey: ['owner-commissions'],
    queryFn: () => managementService.getCommissions(),
    enabled: section === 'commission',
  });

  const discounts = useQuery({
    queryKey: ['owner-discounts'],
    queryFn: managementService.getDiscounts,
    enabled: section === 'discount',
  });

  // Auto-set default period range (this month 1st → today) when opening modal
  useEffect(() => {
    if (payoutTarget) {
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setPeriodStart(firstOfMonth.toISOString().slice(0, 10));
      setPeriodEnd(today.toISOString().slice(0, 10));
      setPreview(null);
      setPreviewError('');
    }
  }, [payoutTarget]);

  // ── Feedback helper ───────────────────────────────────────────────────────
  const feedback = (ok: string, fail: unknown) => {
    if (ok) setMessage(ok);
    if (fail) setError(fail instanceof Error ? fail.message : typeof fail === 'string' ? fail : 'Terjadi kesalahan.');
    setTimeout(() => { setMessage(''); setError(''); }, 4500);
  };

  // ── Preview orders ────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!payoutTarget || !periodStart || !periodEnd) return;
    setPreviewLoading(true);
    setPreviewError('');
    setPreview(null);
    try {
      const res = await managementService.previewPayoutOrders(payoutTarget.id, periodStart, periodEnd);
      if (res.success) {
        setPreview(res.data);
        // Auto-fill amount with calculated commission
        setPayoutAmount(String(res.data.commission));
      }
    } catch {
      setPreviewError('Gagal memuat preview. Pastikan tanggal sudah benar.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveRate = useMutation({
    mutationFn: (v: { id: number; value: number }) => managementService.updateCommission(v.id, v.value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-commissions'] });
      setEditing(null);
      feedback('Komisi berhasil diperbarui.', null);
    },
    onError: (e) => feedback('', e),
  });

  const addDiscount = useMutation({
    mutationFn: () => managementService.createDiscount({ ...form, value: Number(form.value) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-discounts'] });
      setForm({ name: '', type: 'percentage', value: '', is_active: true });
      feedback('Diskon berhasil ditambahkan.', null);
    },
    onError: (e) => feedback('', e),
  });

  const deactivate = useMutation({
    mutationFn: (id: number) => managementService.deactivateDiscount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-discounts'] });
      setConfirm(null);
      feedback('Diskon dinonaktifkan.', null);
    },
    onError: (e) => feedback('', e),
  });

  const recordPayout = useMutation({
    mutationFn: (fd: FormData) => managementService.payCommission(fd),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['owner-commissions'] });
      setPayoutTarget(null);
      setPayoutAmount('');
      setPayoutNotes('');
      setPayoutProofFile(null);
      setPreview(null);
      feedback(res.message || 'Pembayaran komisi berhasil dicatat.', null);
    },
    onError: (e) => feedback('', e),
  });

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutTarget) return;
    if (!periodStart || !periodEnd) { feedback('', 'Pilih rentang tanggal periode.'); return; }
    if (!payoutAmount || Number(payoutAmount) <= 0) { feedback('', 'Jumlah pembayaran tidak valid.'); return; }
    if (!payoutProofFile) { feedback('', 'Bukti transfer wajib diunggah.'); return; }
    if (!preview || preview.order_count === 0) { feedback('', 'Tidak ada pesanan yang bisa dicatat. Klik "Cek Pesanan" terlebih dahulu.'); return; }

    const fd = new FormData();
    fd.append('sales_id', String(payoutTarget.id));
    fd.append('period_start', periodStart);
    fd.append('period_end', periodEnd);
    fd.append('amount', payoutAmount);
    fd.append('payment_proof', payoutProofFile);
    if (payoutNotes) fd.append('notes', payoutNotes);
    recordPayout.mutate(fd);
  };

  const formatRp = (n: number) => 'Rp' + n.toLocaleString('id-ID');
  const title = section === 'commission' ? 'Komisi & Gaji Sales' : 'Promo & Potongan Harga';

  return (
    <main className="w-full max-w-4xl space-y-4 pb-24 overflow-x-hidden">
      <header>
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Management</p>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {section === 'commission'
            ? 'Pantau komisi pending per sales dan catat pembayaran per periode bebas.'
            : 'Kelola promo dan potongan harga.'}
        </p>
      </header>

      {(message || error) && (
        <div className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${error ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {error || message}
        </div>
      )}

      {/* ── COMMISSION SECTION ─────────────────────────────────────────────── */}
      {section === 'commission' ? (
        <section className="space-y-3">
          {commissionsQ.isLoading ? (
            <p className="text-xs text-slate-500">Memuat data komisi sales...</p>
          ) : commissionsQ.isError ? (
            <p className="text-xs font-bold text-rose-600">Gagal memuat data. Coba refresh halaman.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(commissionsQ.data?.data ?? []).map((s) => (
                <article key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-2xs flex flex-col justify-between">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-black text-slate-900 text-sm truncate">{s.name}</h2>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{s.email}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                      {s.commission_rate}% Komisi
                    </span>
                  </div>

                  {/* Pending Commission KPI */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Komisi Pending (Belum Dibayar)</p>
                    <p className="text-xl font-black text-emerald-800">{formatRp(s.pending_commission)}</p>
                    <div className="flex items-center gap-3 text-[10px] text-emerald-700 font-semibold mt-0.5">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />
                        {s.pending_order_count} pesanan
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {formatRp(s.pending_plant_total)} omset
                      </span>
                    </div>
                  </div>

                  {/* Last payout info */}
                  {s.last_payout_period && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>Terakhir dibayar: <span className="font-bold text-slate-700">{s.last_payout_period.label}</span></span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-all cursor-pointer"
                      onClick={() => setEditing({ id: s.id, name: s.name, email: s.email, rate: String(s.commission_rate) })}
                    >
                      Ubah Rate
                    </button>

                    {s.pending_order_count === 0 ? (
                      <button disabled className="py-2 px-2.5 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Lunas</span>
                      </button>
                    ) : (
                      <button
                        className="py-2 px-2.5 rounded-xl bg-[#04593f] hover:bg-emerald-950 text-white text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        onClick={() => {
                          setPayoutTarget(s);
                          setPayoutAmount('');
                          setPayoutNotes('');
                          setPayoutProofFile(null);
                          setPreview(null);
                        }}
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Bayar Komisi</span>
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* ── DISCOUNT SECTION ──────────────────────────────────────────────── */
        <section className="space-y-4">
          <form
            className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim() || form.value === '') { setError('Nama promo dan nilai diskon wajib diisi.'); return; }
              if (form.type === 'percentage' && Number(form.value) > 100) { setError('Persentase maksimal 100%.'); return; }
              addDiscount.mutate();
            }}
          >
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#04593f]" />
              Buat Diskon
            </h2>
            <label className="block text-xs font-bold text-slate-600">
              Nama Promo
              <input className="mt-1.5 min-h-11 w-full border border-slate-200 rounded-xl px-3 text-sm" placeholder="Promo Agustus" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Tipe Diskon
              <select className="mt-1.5 min-h-11 w-full border border-slate-200 rounded-xl px-3 text-sm bg-white" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })}>
                <option value="percentage">Persentase</option>
                <option value="fixed">Nominal Tetap</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Nilai Diskon
              <div className="relative mt-1.5">
                <input className="min-h-11 w-full border border-slate-200 rounded-xl px-3 pr-12 text-sm" type="number" min="0" max={form.type === 'percentage' ? 100 : undefined} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">{form.type === 'percentage' ? '%' : 'Rp'}</span>
              </div>
            </label>
            <button className="min-h-11 w-full rounded-xl bg-[#04593f] text-white text-xs font-black disabled:opacity-50" disabled={addDiscount.isPending}>
              {addDiscount.isPending ? 'Menyimpan...' : 'Tambah Diskon'}
            </button>
          </form>

          <div className="space-y-2">
            {discounts.isLoading ? (
              <p className="text-xs text-slate-500">Memuat discount...</p>
            ) : (
              discounts.data?.data?.map((d) => (
                <article key={d.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-black text-slate-900 truncate">{d.name}</h2>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${d.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                        {d.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-[#04593f] mt-3">{d.type === 'percentage' ? `${d.value}%` : `Rp${d.value.toLocaleString('id-ID')}`}</p>
                    <p className="text-xs text-slate-500">Potongan harga</p>
                  </div>
                  <div className="relative">
                    <button aria-label="Menu diskon" className="min-h-11 min-w-11 rounded-xl border border-slate-200 flex items-center justify-center" onClick={() => setMenu(menu === d.id ? null : d.id)}>
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menu === d.id && (
                      <div className="absolute right-0 top-12 z-10 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                        <button className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold hover:bg-slate-50" onClick={() => { setMenu(null); setConfirm(d); }}>{d.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                        <button className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50" onClick={() => { setMenu(null); setConfirm(d); }}>Hapus</button>
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {/* ── EDIT RATE MODAL ──────────────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg">Ubah Komisi</h2>
                <p className="text-xs text-slate-500 mt-1">{editing.name} · {editing.email}</p>
              </div>
              <button className="min-h-11 min-w-11 flex items-center justify-center" onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            <label className="block text-xs font-bold text-slate-600">
              Persentase Komisi
              <div className="relative mt-1.5">
                <input autoFocus className="min-h-14 w-full rounded-xl border border-slate-200 px-4 pr-12 text-xl font-black" type="number" min="0" max="100" value={editing.rate} onChange={(e) => setEditing({ ...editing, rate: e.target.value })} />
                <span className="absolute right-4 top-4 font-bold text-slate-400">%</span>
              </div>
            </label>
            <p className="text-xs text-slate-500">Masukkan nilai antara 0%–100%.</p>
            {saveRate.isError && <p className="text-xs font-bold text-rose-600">Gagal menyimpan perubahan.</p>}
            <button className="min-h-12 w-full rounded-xl bg-[#04593f] text-white font-black text-sm disabled:opacity-50" disabled={saveRate.isPending || Number(editing.rate) < 0 || Number(editing.rate) > 100} onClick={() => saveRate.mutate({ id: editing.id, value: Number(editing.rate) })}>
              {saveRate.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button className="min-h-11 w-full rounded-xl bg-slate-100 text-slate-700 font-bold text-sm" onClick={() => setEditing(null)}>Batal</button>
          </div>
        </div>
      )}

      {/* ── PAY COMMISSION MODAL ─────────────────────────────────────────────── */}
      {payoutTarget && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 font-sans text-slate-900">
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-y-auto max-h-[92vh]">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between border-b border-slate-100 px-5 pt-5 pb-3">
              <div>
                <h2 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                  <Wallet className="w-5 h-5 text-[#04593f]" />
                  Bayar Komisi Sales
                </h2>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  Sales: <span className="font-bold text-slate-700">{payoutTarget.name}</span>
                </p>
              </div>
              <button className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer" onClick={() => setPayoutTarget(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-5 space-y-4">
              {/* Date Range Picker */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <CalendarRange className="w-4 h-4 text-[#04593f]" />
                  Pilih Periode Pembayaran
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[10px] font-bold text-slate-500">
                    Dari Tanggal
                    <input
                      type="date"
                      required
                      value={periodStart}
                      onChange={(e) => { setPeriodStart(e.target.value); setPreview(null); }}
                      className="mt-1 w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </label>
                  <label className="block text-[10px] font-bold text-slate-500">
                    Sampai Tanggal
                    <input
                      type="date"
                      required
                      value={periodEnd}
                      min={periodStart}
                      onChange={(e) => { setPeriodEnd(e.target.value); setPreview(null); }}
                      className="mt-1 w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  disabled={!periodStart || !periodEnd || previewLoading}
                  onClick={handlePreview}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-black flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {previewLoading ? 'Memuat...' : 'Cek Pesanan dalam Periode Ini'}
                </button>
              </div>

              {/* Preview Result */}
              {previewError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl px-3 py-2.5">{previewError}</div>
              )}

              {preview && (
                <div className="border border-emerald-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-3.5 py-2.5 flex items-center justify-between">
                    <p className="text-xs font-black text-emerald-800">Preview: {preview.order_count} Pesanan Ditemukan</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-full">
                      Rate {preview.commission_rate}%
                    </span>
                  </div>

                  {preview.order_count === 0 ? (
                    <p className="text-xs text-slate-500 px-3.5 py-3">Tidak ada pesanan selesai yang belum dibayar dalam periode ini.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                        <div className="px-3.5 py-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Omset Tanaman</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">{formatRp(preview.plant_total)}</p>
                        </div>
                        <div className="px-3.5 py-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Komisi Terhitung</p>
                          <p className="text-sm font-black text-emerald-700 mt-0.5">{formatRp(preview.commission)}</p>
                        </div>
                      </div>
                      <div className="max-h-36 overflow-y-auto divide-y divide-slate-50">
                        {preview.orders.map((o) => (
                          <div key={o.id} className="px-3.5 py-2 flex items-center justify-between">
                            <div>
                              <p className="text-[10.5px] font-bold text-slate-800">{o.order_number} — {o.customer_name}</p>
                              <p className="text-[9.5px] text-slate-400">{o.date} · {o.item_count} item</p>
                            </div>
                            <p className="text-[10.5px] font-black text-emerald-700 shrink-0">{formatRp(o.commission)}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Amount input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Transfer Komisi (Rp) <span className="text-rose-500">*</span>
                  {preview && <span className="ml-1 font-normal text-slate-400">(otomatis terisi, bisa disesuaikan)</span>}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Masukkan nominal transfer komisi..."
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-700 bg-white"
                />
              </div>

              {/* Upload proof */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Upload Bukti Transfer</span>
                  <span className="text-[10px] text-slate-400 font-normal">Format: PNG/JPG (Maks 5MB)</span>
                </label>
                <div className="relative group border border-dashed border-slate-300 hover:border-emerald-700 rounded-xl p-4 flex flex-col items-center justify-center transition-colors cursor-pointer bg-slate-50/50">
                  <input type="file" required accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setPayoutProofFile(e.target.files[0]); }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                  <span className="text-[11px] font-bold text-slate-600 mt-2 text-center truncate max-w-xs">
                    {payoutProofFile ? payoutProofFile.name : 'Pilih File Bukti Pembayaran...'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea rows={2} placeholder="Tambahkan catatan transfer..." value={payoutNotes} onChange={(e) => setPayoutNotes(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-700" />
              </div>

              {recordPayout.isPending && (
                <p className="text-[11px] font-bold text-emerald-800 animate-pulse text-center">Memproses pembayaran & mengunggah bukti...</p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setPayoutTarget(null)} className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center">Batal</button>
                <button
                  type="submit"
                  disabled={recordPayout.isPending || !preview || preview.order_count === 0}
                  className="py-2.5 bg-[#04593f] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer text-center disabled:opacity-50"
                >
                  {recordPayout.isPending ? 'Mengirim...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE DISCOUNT CONFIRM ──────────────────────────────────────────── */}
      {confirm && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white p-5 space-y-4">
            <h2 className="font-black text-lg">Hapus Diskon?</h2>
            <p className="text-sm text-slate-500">Diskon ini akan dihapus dari daftar.</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="min-h-11 rounded-xl bg-slate-100 font-bold" onClick={() => setConfirm(null)}>Batal</button>
              <button className="min-h-11 rounded-xl bg-rose-600 text-white font-black disabled:opacity-50" disabled={deactivate.isPending} onClick={() => deactivate.mutate(confirm.id)}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
