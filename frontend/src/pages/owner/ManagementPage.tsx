import React, { useState } from 'react';
import { MoreVertical, Percent, Tag, X, Wallet, CheckCircle2, Upload, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { managementService, Discount } from '../../services/managementService';

type Props = { section: 'commission' | 'discount' };

interface PayoutSalesTarget {
  id: number;
  name: string;
  email: string;
  commission_rate: number;
  payout_status: 'PAID' | 'UNPAID';
  payout_proof_path: string | null;
  payout_date: string | null;
}

export const ManagementPage: React.FC<Props> = ({ section }) => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id: number; name: string; email: string; rate: string } | null>(null);
  const [payoutTarget, setPayoutTarget] = useState<PayoutSalesTarget | null>(null);
  
  // Payout Form States
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutProofFile, setPayoutProofFile] = useState<File | null>(null);
  const [payoutMonth, setPayoutMonth] = useState(new Date().toISOString().slice(0, 7)); // e.g. "2026-08"

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [menu, setMenu] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<Discount | null>(null);
  const [form, setForm] = useState({ name: '', type: 'percentage' as 'percentage' | 'fixed', value: '', is_active: true });

  // Load monthly active sales list & payout status according to month filter
  const commissionsByMonth = useQuery({
    queryKey: ['owner-commissions-month', payoutMonth],
    queryFn: () => managementService.getCommissionsByMonth(payoutMonth),
    enabled: section === 'commission',
  });

  const discounts = useQuery({
    queryKey: ['owner-discounts'],
    queryFn: managementService.getDiscounts,
    enabled: section === 'discount',
  });

  const feedback = (ok: string, fail: unknown) => {
    setMessage(ok);
    setError(fail instanceof Error ? fail.message : typeof fail === 'string' ? fail : 'Terjadi kesalahan.');
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 4500);
  };

  const saveRate = useMutation({
    mutationFn: (v: { id: number; value: number }) => managementService.updateCommission(v.id, v.value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-commissions-month'] });
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
    mutationFn: (formData: FormData) => managementService.payCommission(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-commissions-month'] });
      setPayoutTarget(null);
      setPayoutAmount('');
      setPayoutNotes('');
      setPayoutProofFile(null);
      feedback('Pembayaran komisi berhasil dicatat.', null);
    },
    onError: (e) => feedback('', e),
  });

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutTarget) return;
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      feedback('', 'Jumlah pembayaran tidak valid.');
      return;
    }
    if (!payoutProofFile) {
      feedback('', 'Bukti transfer wajib diunggah.');
      return;
    }

    const formData = new FormData();
    formData.append('sales_id', String(payoutTarget.id));
    formData.append('month', payoutMonth);
    formData.append('amount', payoutAmount);
    formData.append('payment_proof', payoutProofFile);
    if (payoutNotes) {
      formData.append('notes', payoutNotes);
    }

    recordPayout.mutate(formData);
  };

  const title = section === 'commission' ? 'Komisi & Gaji Sales' : 'Promo & Potongan Harga';
  const monthOptions = [
    { value: '2026-08', label: 'Agustus 2026' },
    { value: '2026-07', label: 'Juli 2026' },
    { value: '2026-06', label: 'Juni 2026' },
    { value: '2026-05', label: 'Mei 2026' },
  ];

  return (
    <main className="w-full max-w-4xl space-y-4 pb-24 overflow-x-hidden">
      <header>
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Management</p>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {section === 'commission' ? 'Atur persentase komisi, pantau omset sales, dan catat pembayaran komisi.' : 'Kelola promo dan potongan harga.'}
        </p>
      </header>

      {(message || error) && (
        <div className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${error ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {error || message}
        </div>
      )}

      {section === 'commission' ? (
        <section className="space-y-4">
          {/* Month Selector Filter Bar */}
          <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs">
            <span className="text-xs font-bold text-slate-600">Periode Komisi:</span>
            <select
              value={payoutMonth}
              onChange={(e) => setPayoutMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {commissionsByMonth.isLoading ? (
              <p className="text-xs text-slate-500">Memuat data komisi sales...</p>
            ) : (
              commissionsByMonth.data?.data?.map((s) => (
                <article key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-black text-slate-900 text-sm truncate">{s.name}</h2>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{s.email}</p>
                      </div>
                      
                      {s.payout_status === 'PAID' ? (
                        <span className="shrink-0 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-[#04593f]">
                          Sudah Dibayar
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                          Belum Dibayar
                        </span>
                      )}
                    </div>

                    <div className="border-t border-slate-100 mt-3 pt-3 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Rate Komisi</p>
                        <p className="text-lg font-black text-[#04593f] mt-0.5">{s.commission_rate}%</p>
                      </div>
                      {s.payout_proof_path && (
                        <div className="text-right">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bukti Transfer</p>
                          <a
                            href={`${import.meta.env.VITE_API_URL}/storage/${s.payout_proof_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-emerald-700 hover:underline mt-1"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Lihat Bukti</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      className="py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold transition-all cursor-pointer"
                      onClick={() => setEditing({ id: s.id, name: s.name, email: s.email, rate: String(s.commission_rate) })}
                    >
                      Ubah Rate
                    </button>

                    {s.payout_status === 'PAID' ? (
                      <button
                        disabled
                        className="py-2 px-2.5 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-bold flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Selesai</span>
                      </button>
                    ) : (
                      <button
                        className="py-2 px-2.5 rounded-xl bg-[#04593f] hover:bg-emerald-950 text-white text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        onClick={() => {
                          setPayoutTarget(s);
                          setPayoutAmount('');
                          setPayoutNotes('');
                          setPayoutProofFile(null);
                        }}
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Bayar Komisi</span>
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <form
            className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim() || form.value === '') {
                setError('Nama promo dan nilai diskon wajib diisi.');
                return;
              }
              if (form.type === 'percentage' && Number(form.value) > 100) {
                setError('Persentase maksimal 100%.');
                return;
              }
              addDiscount.mutate();
            }}
          >
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#04593f]" />
              Buat Diskon
            </h2>
            <label className="block text-xs font-bold text-slate-600">
              Nama Promo
              <input
                className="mt-1.5 min-h-11 w-full border border-slate-200 rounded-xl px-3 text-sm"
                placeholder="Promo Agustus"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Tipe Diskon
              <select
                className="mt-1.5 min-h-11 w-full border border-slate-200 rounded-xl px-3 text-sm bg-white"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })}
              >
                <option value="percentage">Persentase</option>
                <option value="fixed">Nominal Tetap</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Nilai Diskon
              <div className="relative mt-1.5">
                <input
                  className="min-h-11 w-full border border-slate-200 rounded-xl px-3 pr-12 text-sm"
                  type="number"
                  min="0"
                  max={form.type === 'percentage' ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
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
                    <button
                      aria-label="Menu diskon"
                      className="min-h-11 min-w-11 rounded-xl border border-slate-200 flex items-center justify-center"
                      onClick={() => setMenu(menu === d.id ? null : d.id)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menu === d.id && (
                      <div className="absolute right-0 top-12 z-10 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                        <button
                          className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold hover:bg-slate-50"
                          onClick={() => {
                            setMenu(null);
                            setConfirm(d);
                          }}
                        >
                          {d.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50"
                          onClick={() => {
                            setMenu(null);
                            setConfirm(d);
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {/* Editing Rate Modal */}
      {editing && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg">Ubah Komisi</h2>
                <p className="text-xs text-slate-500 mt-1">{editing.name} · {editing.email}</p>
              </div>
              <button className="min-h-11 min-w-11 flex items-center justify-center" onClick={() => setEditing(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block text-xs font-bold text-slate-600">
              Persentase Komisi
              <div className="relative mt-1.5">
                <input
                  autoFocus
                  className="min-h-14 w-full rounded-xl border border-slate-200 px-4 pr-12 text-xl font-black"
                  type="number"
                  min="0"
                  max="100"
                  value={editing.rate}
                  onChange={(e) => setEditing({ ...editing, rate: e.target.value })}
                />
                <span className="absolute right-4 top-4 font-bold text-slate-400">%</span>
              </div>
            </label>
            <p className="text-xs text-slate-500">Masukkan nilai antara 0%–100%.</p>
            {saveRate.isError && <p className="text-xs font-bold text-rose-600">Gagal menyimpan perubahan.</p>}
            <button
              className="min-h-12 w-full rounded-xl bg-[#04593f] text-white font-black text-sm disabled:opacity-50"
              disabled={saveRate.isPending || Number(editing.rate) < 0 || Number(editing.rate) > 100}
              onClick={() => saveRate.mutate({ id: editing.id, value: Number(editing.rate) })}
            >
              {saveRate.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button className="min-h-11 w-full rounded-xl bg-slate-100 text-slate-700 font-bold text-sm" onClick={() => setEditing(null)}>
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Pay Commission Modal (Upload transfer proof form) */}
      {payoutTarget && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 font-sans text-slate-900">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                  <Wallet className="w-5 h-5 text-[#04593f]" />
                  <span>Bayar Komisi Sales</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  Sales: <span className="font-bold text-slate-700">{payoutTarget.name}</span> ({payoutTarget.email})
                </p>
              </div>
              <button
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
                onClick={() => setPayoutTarget(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Periode Bulan Komisi
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={payoutMonth}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Transfer Komisi (Rp) <span className="text-rose-500">*</span>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Upload Bukti Transfer</span>
                  <span className="text-[10px] text-slate-400 font-normal">Format: PNG/JPG (Maks 5MB)</span>
                </label>
                <div className="relative group border border-dashed border-slate-300 hover:border-emerald-700 rounded-xl p-4 flex flex-col items-center justify-center transition-colors cursor-pointer bg-slate-50/50">
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPayoutProofFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                  <span className="text-[11px] font-bold text-slate-600 mt-2 text-center truncate max-w-xs">
                    {payoutProofFile ? payoutProofFile.name : 'Pilih File Bukti Pembayaran...'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tambahkan catatan transfer..."
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-700"
                />
              </div>

              {recordPayout.isPending && (
                <p className="text-[11px] font-bold text-emerald-800 animate-pulse text-center">
                  Memproses pembayaran & mengunggah gambar...
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayoutTarget(null)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={recordPayout.isPending}
                  className="py-2.5 bg-[#04593f] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer text-center"
                >
                  {recordPayout.isPending ? 'Mengirim...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Discount Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white p-5 space-y-4">
            <h2 className="font-black text-lg">Hapus Diskon?</h2>
            <p className="text-sm text-slate-500">Diskon ini akan dihapus dari daftar.</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="min-h-11 rounded-xl bg-slate-100 font-bold" onClick={() => setConfirm(null)}>
                Batal
              </button>
              <button
                className="min-h-11 rounded-xl bg-rose-600 text-white font-black disabled:opacity-50"
                disabled={deactivate.isPending}
                onClick={() => deactivate.mutate(confirm.id)}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
