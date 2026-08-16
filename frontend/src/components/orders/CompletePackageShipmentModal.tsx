import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Upload, X } from 'lucide-react';
import { recognize } from 'tesseract.js';
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
  const [scanMessage, setScanMessage] = useState('');
  const [scanSucceeded, setScanSucceeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<{ tracking_number?: string; order_number?: string; customer?: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setTrackingNumber(pkg?.tracking_number || '');
    setShippingCost(String(pkg?.shipping_cost || 0));
    setError('');
    setScanMessage('');
    setScanSucceeded(false);
  }, [pkg]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

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
  const preprocess = async (source: Blob) => {
    const bitmap = await createImageBitmap(source); const ratio = Math.min(1.8, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
    const ctx = canvas.getContext('2d')!; ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height); const pixels = image.data;
    for (let i = 0; i < pixels.length; i += 4) { const gray = Math.max(0, Math.min(255, ((pixels[i] * .299 + pixels[i + 1] * .587 + pixels[i + 2] * .114) - 128) * 1.45 + 128)); pixels[i] = pixels[i + 1] = pixels[i + 2] = gray; }
    ctx.putImageData(image, 0, 0); return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Gagal memproses gambar')), 'image/jpeg', .92));
  };
  const extractTrackingFromOcr = (text: string) => {
    const normalized = text.toUpperCase().replace(/[|]/g, 'I').replace(/\s*-\s*/g, '-');
    const labelled = normalized.match(/(?:NO\.?\s*RESI|NOMOR\s*RESI|TRACKING(?:\s*NUMBER)?)\s*[:#-]?\s*([A-Z0-9-]{8,})/);
    if (labelled?.[1]) return labelled[1];

    // Common Indonesian courier patterns, including J&T (JD...) and route-style
    // codes such as 410-SRG11-03B. Phone numbers do not match these patterns.
    const candidates = normalized.match(/\b(?:[A-Z]{1,4}\d{7,}[A-Z0-9-]*|\d{3}-[A-Z]{2,8}\d{1,}-\d{2,}[A-Z]?)\b/g) || [];
    return candidates.find((value) => !value.startsWith('IDR') && !value.startsWith('RP')) || '';
  };

  const scanPhoto = async (file: File) => {
    setScanning(true); setError(''); setScanSucceeded(false); setScanMessage('Membaca barcode dan nominal ongkir dari foto…');
    try {
      const Detector = (window as any).BarcodeDetector;
      const barcodeTask = Detector
        ? createImageBitmap(file).then((bitmap) => new Detector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13'] }).detect(bitmap)).then((codes: any[]) => codes?.[0]?.rawValue || '')
        : Promise.resolve('');
      // OCR stays on the device/browser. It is deliberately only a suggested
      // value: admin can correct it before saving.
      const processed = await preprocess(file); const ocrTask = recognize(processed, 'eng').then(({ data }) => data.text);
      const [barcodeResult, ocrResult] = await Promise.all([barcodeTask, ocrTask]);
      const detectedTracking = String(barcodeResult || extractTrackingFromOcr(String(ocrResult))).trim();
      if (detectedTracking) setTrackingNumber(detectedTracking);
      const money = String(ocrResult).match(/(?:IDR|RP\.?)[\s:]*([0-9][0-9.,\s]*)/i);
      if (money) {
        const amount = money[1].replace(/\D/g, '');
        if (amount) setShippingCost(amount);
      }
      if (detectedTracking && money) { setScanSucceeded(true); setScanMessage('Nomor resi dan ongkir terdeteksi. Periksa hasil sebelum menyimpan.'); }
      else if (detectedTracking) setScanMessage('Nomor resi terdeteksi. Nominal ongkir belum terbaca, silakan isi atau foto ulang.');
      else if (money) setScanMessage('Ongkir terdeteksi. Nomor resi belum terbaca, silakan isi atau foto ulang.');
      else setError('Belum terbaca. Pastikan label terang, tidak blur, dan barcode terlihat penuh.');
    } catch { setScanMessage(''); setError('Gagal membaca foto. Coba foto lebih dekat dengan pencahayaan yang cukup.'); }
    finally { setScanning(false); }
  };
  const openCamera = async () => {
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); streamRef.current = stream; setCameraOpen(true); setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 0); }
    catch { setScanMessage(''); setError('Kamera tidak dapat dibuka. Pastikan izin kamera diberikan atau gunakan Ambil Foto / Pilih Gambar.'); }
  };
  const closeCamera = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setCameraOpen(false); };
  const captureCamera = async () => { const video = videoRef.current; if (!video || !video.videoWidth) return; const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext('2d')!.drawImage(video, 0, 0); const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(), 'image/jpeg', .95)); closeCamera(); await scanPhoto(new File([blob], 'scan-resi.jpg', { type: 'image/jpeg' })); };

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
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">Nomor Resi *
            <input placeholder="Masukkan nomor resi..." value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-2xl border border-slate-200 px-3.5 text-xs font-bold focus:outline-none focus:border-emerald-700" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" disabled={scanning} onClick={openCamera} className="min-h-11 rounded-2xl bg-[#04593f] text-white px-2 text-[11px] font-extrabold disabled:opacity-50">Webcam</button>
            <label className="min-h-11 rounded-2xl bg-emerald-50 text-[#04593f] px-2 flex items-center justify-center gap-1 text-[11px] font-extrabold cursor-pointer disabled:opacity-50">
              <Camera className="w-3.5 h-3.5" />{scanning ? 'Membaca…' : 'Ambil Foto'}
              <input disabled={scanning} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) scanPhoto(file); e.currentTarget.value = ''; }} />
            </label>
            <label className="min-h-11 rounded-2xl border border-emerald-100 bg-white text-[#04593f] px-2 flex items-center justify-center gap-1 text-[11px] font-extrabold cursor-pointer disabled:opacity-50">
              <ImagePlus className="w-3.5 h-3.5" />Pilih Gambar
              <input disabled={scanning} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) scanPhoto(file); e.currentTarget.value = ''; }} />
            </label>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-500"><Upload className="mr-1 inline h-3 w-3" />Pilih Gambar membuka galeri/file. Webcam untuk kamera komputer; Ambil Foto untuk kamera HP.</p>
        </div>
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
        {scanMessage && <p className={`text-xs font-bold ${scanSucceeded ? 'text-emerald-700' : 'text-amber-700'}`}>{scanMessage}</p>}
        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button type="button" onClick={onClose} className="min-h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer">Batal</button>
          <button type="submit" disabled={!isValid || saving} className="min-h-11 rounded-2xl bg-[#04593f] hover:bg-emerald-950 text-white text-xs font-extrabold disabled:opacity-40 transition-all cursor-pointer shadow-2xs">
            {saving ? 'Menyimpan...' : 'Simpan Resi'}
          </button>
        </div>
      </form>
      {cameraOpen && <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/80 p-4"><div className="w-full max-w-lg rounded-3xl bg-white p-4 space-y-3"><video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl bg-black"/><p className="text-xs text-slate-600">Arahkan barcode dan nominal ongkir ke kamera, lalu ambil foto.</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={closeCamera} className="min-h-11 rounded-xl bg-slate-100 font-bold">Batal</button><button type="button" onClick={captureCamera} className="min-h-11 rounded-xl bg-[#04593f] text-white font-bold">Ambil & Baca</button></div></div></div>}
      {duplicate && <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-900/55 p-4"><div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl space-y-3"><div className="text-4xl text-rose-600">!</div><h3 className="font-extrabold text-rose-700">Nomor resi sudah digunakan</h3><b>{duplicate.tracking_number}</b><div className="text-left text-xs text-slate-600 space-y-1"><p>Order</p><b className="text-slate-900">{duplicate.order_number}</b><p className="pt-2">Penerima</p><b className="text-slate-900">{duplicate.customer}</b></div><div className="grid grid-cols-2 gap-2 pt-2"><button onClick={() => { setDuplicate(null); setTrackingNumber(''); }} className="min-h-11 rounded-xl bg-slate-100 font-bold">Scan Lagi</button><button onClick={() => setDuplicate(null)} className="min-h-11 rounded-xl bg-rose-600 text-white font-bold">Tutup</button></div></div></div>}
    </div>
  );
};
