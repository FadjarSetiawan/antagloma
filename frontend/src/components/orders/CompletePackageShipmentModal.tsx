import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
      setError(e?.response?.data?.message || 'Gagal menyimpan resi package.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div><h2 className="text-base font-black text-slate-900">Input Resi Paket {pkg.letter}</h2><p className="text-xs text-slate-500">{pkg.package_type || 'Package'}</p></div>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 flex items-center justify-center rounded-xl bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Isi package</p>
          {pkg.items?.map((item) => <p key={item.order_item_id}>• {item.product_name || 'Tanaman'} ×{item.quantity}</p>)}
          <p className="pt-1 font-bold">Foto: {pkg.photo_uploaded ? 'Sudah ada' : 'Belum ada'}</p>
        </div>
        <label className="block text-xs font-bold text-slate-700">Nomor Resi<input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
          <label className="block text-xs font-bold text-slate-700">Ongkir Ekspedisi<input type="number" min="0" value={shippingCost} onFocus={() => { if (shippingCost === '0') setShippingCost(''); }} onChange={(e) => setShippingCost(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>
        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
        <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-slate-100 text-sm font-bold">Batal</button><button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-[#04593f] text-white text-sm font-black disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan Resi'}</button></div>
      </form>
    </div>
  );
};
