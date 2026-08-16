import React, { useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { OrderPackage } from '../../types/order';

interface Props {
  pkg: OrderPackage | null;
  onClose: () => void;
  onConfirm: (packageId: number, payload: { shipping_cost: number; tracking_number: string }) => Promise<void>;
}

export const CompletePackageShipmentModal: React.FC<Props> = ({ pkg, onClose, onConfirm }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCost, setShippingCost] = useState('0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<{ tracking_number?: string; order_number?: string; customer?: string } | null>(null);

  useEffect(() => {
    setTrackingNumber(pkg?.tracking_number || '');
    setShippingCost(String(pkg?.shipping_cost || 0));
    setError('');
  }, [pkg]);

  if (!pkg) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trackingNumber.trim()) { setError('Nomor resi wajib diisi.'); return; }
    setSaving(true); setError('');
    try {
      await onConfirm(pkg.id, { tracking_number: trackingNumber.trim(), shipping_cost: Number(shippingCost) || 0 });
      onClose();
    } catch (e: any) {
      if (e?.response?.data?.duplicate) setDuplicate(e.response.data.duplicate);
      else setError(e?.response?.data?.message || 'Gagal menyimpan resi package.');
    } finally { setSaving(false); }
  };

  const isValid = trackingNumber.trim().length > 0 && Number(shippingCost) > 0;
  const scanPhoto = async (file: File) => {
    try {
      const Detector = (window as any).BarcodeDetector;
      if (!Detector) { setError('Browser ini belum mendukung scan otomatis. Gunakan Chrome terbaru atau input resi manual.'); return; }
      const bitmap = await createImageBitmap(file); const codes = await new Detector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13'] }).detect(bitmap);
      const value = codes?.[0]?.rawValue; if (!value) { setError('Barcode tidak terbaca. Coba foto lebih dekat atau input manual.'); return; }
      setTrackingNumber(value); setError('');
    } catch { setError('Gagal membaca barcode. Coba ulangi atau input manual.'); }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 p-4 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div><h2 className="text-base font-extrabold text-slate-900">Input Resi Paket {pkg.letter}</h2><p className="text-xs text-slate-500 font-semibold">{pkg.package_type || 'Package'}</p></div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-600 space-y-1">
          <p className="font-extrabold text-slate-900">Isi package</p>
          {pkg.items?.map((item) => <p key={item.order_item_id} className="font-medium text-slate-700">• {item.product_name || 'Tanaman'} ×{item.quantity}</p>)}
          <p className="pt-1 font-bold text-emerald-800">Foto: {pkg.photo_uploaded ? 'Sudah ada' : 'Belum ada'}</p>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end"><label className="block text-xs font-bold text-slate-800">Nomor Resi *<input placeholder="Masukkan nomor resi..." value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-2xl border border-slate-200 px-3.5 text-xs font-bold focus:outline-none focus:border-emerald-700" /></label><label className="min-h-11 rounded-2xl bg-emerald-50 text-[#04593f] px-3 flex items-center gap-1.5 text-xs font-extrabold cursor-pointer"><Camera className="w-4 h-4"/>Scan<input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && scanPhoto(e.target.files[0])}/></label></div>
        <label className="block text-xs font-bold text-slate-800">Ongkir Ekspedisi (Rp) *
          <input
            type="text"
            placeholder="Masukkan ongkir ekspedisi..."
            value={shippingCost === '0' || shippingCost === '' ? '' : Number(shippingCost).toLocaleString('id-ID')}
            onFocus={(e) => {
              e.target.select();
            }}
            onChange={(e) => {
              const cleanValue = e.target.value.replace(/\./g, '');
              if (cleanValue === '') {
                setShippingCost('');
              } else if (/^\d+$/.test(cleanValue)) {
                setShippingCost(cleanValue);
              }
            }}
            className="mt-1.5 min-h-11 w-full rounded-2xl border border-slate-200 px-3.5 text-xs font-extrabold focus:outline-none focus:border-emerald-700"
          />
        </label>
        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button type="button" onClick={onClose} className="min-h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer">Batal</button>
          <button type="submit" disabled={!isValid || saving} className="min-h-11 rounded-2xl bg-[#04593f] hover:bg-emerald-950 text-white text-xs font-extrabold disabled:opacity-40 transition-all cursor-pointer shadow-2xs">
            {saving ? 'Menyimpan...' : 'Simpan Resi'}
          </button>
        </div>
      </form>
      {duplicate && <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-900/55 p-4"><div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl space-y-3"><div className="text-4xl text-rose-600">!</div><h3 className="font-extrabold text-rose-700">Nomor resi sudah digunakan</h3><b>{duplicate.tracking_number}</b><div className="text-left text-xs text-slate-600 space-y-1"><p>Order</p><b className="text-slate-900">{duplicate.order_number}</b><p className="pt-2">Penerima</p><b className="text-slate-900">{duplicate.customer}</b></div><div className="grid grid-cols-2 gap-2 pt-2"><button onClick={() => { setDuplicate(null); setTrackingNumber(''); }} className="min-h-11 rounded-xl bg-slate-100 font-bold">Scan Lagi</button><button onClick={() => setDuplicate(null)} className="min-h-11 rounded-xl bg-rose-600 text-white font-bold">Tutup</button></div></div></div>}
    </div>
  );
};
