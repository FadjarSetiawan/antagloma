import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, ImagePlus, Upload, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { recognize } from 'tesseract.js';
import { OrderPackage } from '../../types/order';

interface Props {
  pkg: OrderPackage | null;
  onClose: () => void;
  onConfirm: (packageId: number, payload: { shipping_cost: number; tracking_number: string }) => Promise<void>;
}

type ScanStatus = 'idle' | 'opening_camera' | 'reading_barcode' | 'reading_text' | 'extracting_tracking' | 'extracting_shipping' | 'ready_for_review';
type ConfidenceLevel = 'high' | 'medium' | 'low' | null;

export const CompletePackageShipmentModal: React.FC<Props> = ({ pkg, onClose, onConfirm }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCost, setShippingCost] = useState('0');
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [confidence, setConfidence] = useState<ConfidenceLevel>(null);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<{ tracking_number?: string; order_number?: string; customer?: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setTrackingNumber(pkg?.tracking_number || '');
    setShippingCost(String(pkg?.shipping_cost || 0));
    setError('');
    setScanStatus('idle');
    setScanMessage('');
    setConfidence(null);
    setShowSaveConfirmation(false);
    setDuplicate(null);
  }, [pkg]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  if (!pkg) return null;

  const requestSaveConfirmation = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanTracking = trackingNumber.trim();
    if (!cleanTracking) {
      setError('Nomor resi wajib diisi.');
      return;
    }
    if (!Number(shippingCost) || Number(shippingCost) <= 0) {
      setError('Ongkir ekspedisi wajib diisi.');
      return;
    }
    setError('');
    setShowSaveConfirmation(true);
  };

  const submit = async () => {
    setShowSaveConfirmation(false);
    setSaving(true);
    setError('');
    try {
      await onConfirm(pkg.id, {
        tracking_number: trackingNumber.trim(),
        shipping_cost: Number(shippingCost) || 0,
      });
      onClose();
    } catch (e: any) {
      if (e?.response?.data?.duplicate) {
        setDuplicate(e.response.data.duplicate);
      } else {
        setError(e?.response?.data?.message || 'Gagal menyimpan resi package.');
      }
    } finally {
      setSaving(false);
    }
  };

  const isValid = trackingNumber.trim().length > 0 && Number(shippingCost) > 0;

  /**
   * Adaptive Image Preprocessing for Thermal & Printed Indonesian Shipping Labels
   * Resizes, converts to grayscale, applies contrast boost (1.45x) and normalizes brightness.
   */
  const preprocessImage = async (source: Blob): Promise<Blob> => {
    const bitmap = await createImageBitmap(source);
    // Ideal width between 1400px - 1800px for optimal OCR recognition
    const maxDimension = Math.max(bitmap.width, bitmap.height);
    const ratio = Math.min(2.0, 1800 / maxDimension);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Convert to grayscale with high-contrast thresholding for thermal labels
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      // Luminance
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      // Contrast stretch
      const contrastAdjusted = Math.max(0, Math.min(255, (gray - 128) * 1.45 + 128));
      pixels[i] = contrastAdjusted;
      pixels[i + 1] = contrastAdjusted;
      pixels[i + 2] = contrastAdjusted;
    }

    ctx.putImageData(imageData, 0, 0);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Gagal memproses gambar'))),
        'image/jpeg',
        0.92
      );
    });
  };

  /**
   * Extract tracking numbers tailored for Indonesian couriers:
   * J&T (JD..., JX..., JP...), JNE (01..., SOC..., CGK..., 16-digit numeric),
   * SiCepat (00..., 01...), Shopee Xpress (SPXID...), Ninja (NINJA..., NVID...), Pos, Lion Parcel, TiKi,
   * as well as route/cluster patterns (e.g. 410-SRG11-03B).
   */
  const extractTrackingFromOcr = (text: string): string => {
    const normalized = text.toUpperCase().replace(/[|]/g, 'I').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ');

    // 1. Explicitly labelled tracking keywords
    const labelled = normalized.match(/(?:NO\.?\s*RESI|NOMOR\s*RESI|NO\.?\s*CONNOTE|CONNOTE|AIRWAY\s*BILL|AWB|TRACKING(?:\s*NUMBER)?)\s*[:#-]?\s*([A-Z0-9-]{8,24})/i);
    if (labelled?.[1]) {
      const candidate = labelled[1].trim();
      if (!isInvalidTracking(candidate)) return candidate;
    }

    // 2. Specific Indonesian courier prefixes
    const courierMatches = normalized.match(/\b(?:JD\d{10,14}|JX\d{10,14}|JP\d{10,14}|SPXID\d{10,14}|NLID\d{10,14}|NVID\d{10,14}|SOC\d{8,14}|CGK\d{8,14}|SUB\d{8,14}|BDG\d{8,14}|[A-Z]{2,4}\d{8,16})\b/g) || [];
    for (const candidate of courierMatches) {
      if (!isInvalidTracking(candidate)) return candidate;
    }

    // 3. Route-style cluster codes (e.g. 410-SRG11-03B)
    const routeMatches = normalized.match(/\b\d{3}-[A-Z]{2,8}\d{1,}-\d{2,}[A-Z]?\b/g) || [];
    if (routeMatches[0] && !isInvalidTracking(routeMatches[0])) return routeMatches[0];

    // 4. General candidate patterns (10-18 digits or alphanumeric)
    const generalCandidates = normalized.match(/\b[A-Z0-9-]{10,20}\b/g) || [];
    for (const candidate of generalCandidates) {
      if (!isInvalidTracking(candidate)) return candidate;
    }

    return '';
  };

  const isInvalidTracking = (candidate: string): boolean => {
    const upper = candidate.toUpperCase();
    if (upper.startsWith('IDR') || upper.startsWith('RP')) return true;
    if (upper.startsWith('08') && candidate.length <= 13 && /^\d+$/.test(candidate)) return true; // Phone number
    if (upper.startsWith('62') && candidate.length <= 14 && /^\d+$/.test(candidate)) return true; // Phone number
    if (upper.includes('ANTAGLOMA') || upper.includes('FLORIST')) return true;
    return false;
  };

  /**
   * Extract shipping cost prioritizing keywords:
   * ONGKIR, BIAYA KIRIM, BIAYA PENGIRIMAN, SHIPPING COST, TOTAL ONGKIR, TARIF
   */
  const extractShippingCost = (text: string): string => {
    const normalized = text.toUpperCase().replace(/\s+/g, ' ');

    // Match keywords close to nominal
    const labelled = normalized.match(/(?:TOTAL\s*ONGKIR|ONGKIR|BIAYA\s*(?:KIRIM|PENGIRIMAN)|SHIPPING\s*COST|TARIF|NILAI\s*ONGKIR)\s*[:=]?\s*(?:IDR|RP\.?)?[\s]*([0-9][0-9.,\s]{2,12})/i);
    if (labelled?.[1]) {
      const digits = labelled[1].replace(/\D/g, '');
      if (digits && Number(digits) >= 1000 && Number(digits) <= 5000000) {
        return digits;
      }
    }

    // Secondary currency match
    const currencyMatches = normalized.match(/(?:IDR|RP\.?)\s*([0-9][0-9.,\s]{2,12})/gi) || [];
    for (const match of currencyMatches) {
      const digits = match.replace(/\D/g, '');
      if (digits && Number(digits) >= 1000 && Number(digits) <= 5000000) {
        return digits;
      }
    }

    return '';
  };

  /**
   * Native BarcodeDetector API for Code128, Code39, QR, EAN13
   */
  const detectBarcode = async (file: File): Promise<string> => {
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) return '';
    const bitmap = await createImageBitmap(file);
    try {
      let detector: any;
      try {
        const supported = typeof Detector.getSupportedFormats === 'function' ? await Detector.getSupportedFormats() : [];
        const preferred = ['code_128', 'code_39', 'qr_code', 'ean_13', 'itf', 'data_matrix'].filter(
          (format) => !supported.length || supported.includes(format)
        );
        detector = new Detector(preferred.length ? { formats: preferred } : undefined);
      } catch {
        detector = new Detector();
      }
      const codes = await detector.detect(bitmap);
      return String(codes?.[0]?.rawValue || '').trim();
    } finally {
      bitmap.close?.();
    }
  };

  const scanPhoto = async (file: File) => {
    setScanning(true);
    setError('');
    setConfidence(null);

    try {
      // Step 1: Barcode Scan
      setScanStatus('reading_barcode');
      setScanMessage('Membaca barcode label pengiriman…');
      let barcodeResult = '';
      try {
        barcodeResult = await detectBarcode(file);
      } catch {
        barcodeResult = '';
      }

      // Step 2: OCR Image Preprocessing & Text Extraction
      setScanStatus('reading_text');
      setScanMessage('Memproses gambar & membaca teks label…');
      const processedBlob = await preprocessImage(file);

      // Note: Tesseract 'eng' is used on-device for speed and English/Number/Latin label compatibility.
      const ocrResult = await recognize(processedBlob, 'eng');
      const ocrText = ocrResult?.data?.text || '';

      // Step 3: Extract tracking number
      setScanStatus('extracting_tracking');
      setScanMessage('Mengekstrak nomor resi…');
      const detectedTracking = String(barcodeResult || extractTrackingFromOcr(ocrText)).trim();
      if (detectedTracking) {
        setTrackingNumber(detectedTracking);
      }

      // Step 4: Extract shipping cost
      setScanStatus('extracting_shipping');
      setScanMessage('Mengekstrak ongkir ekspedisi…');
      const amount = extractShippingCost(ocrText);
      if (amount) {
        setShippingCost(amount);
      }

      // Step 5: Ready for Admin Review
      setScanStatus('ready_for_review');

      if (detectedTracking && amount) {
        setConfidence('high');
        setScanMessage('Nomor resi dan ongkir terdeteksi. Silakan periksa hasil sebelum menyimpan.');
      } else if (detectedTracking) {
        setConfidence('medium');
        setScanMessage('Nomor resi terdeteksi. Nominal ongkir belum terbaca, silakan isi nominal secara manual.');
      } else if (amount) {
        setConfidence('medium');
        setScanMessage('Ongkir terdeteksi. Nomor resi belum terbaca, silakan isi nomor resi secara manual.');
      } else {
        setConfidence('low');
        setError('Label belum terbaca optimal. Pastikan label terang, tidak blur, dan barcode terlihat penuh.');
      }
    } catch (err: any) {
      setScanStatus('idle');
      setConfidence('low');
      setError('Gagal memproses foto label. Silakan foto lebih dekat dengan pencahayaan yang cukup.');
    } finally {
      setScanning(false);
    }
  };

  const openCamera = async () => {
    setScanStatus('opening_camera');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 0);
    } catch {
      setScanStatus('idle');
      setError('Kamera tidak dapat dibuka. Pastikan izin kamera diberikan pada browser, atau gunakan Ambil Foto / Pilih Gambar.');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const captureCamera = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    closeCamera();

    if (blob) {
      await scanPhoto(new File([blob], 'scan-resi-camera.jpg', { type: 'image/jpeg' }));
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 font-sans text-slate-900">
      <form onSubmit={requestSaveConfirmation} className="w-full max-w-sm sm:max-w-md rounded-3xl bg-white p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Input Resi Paket {pkg.letter}</h2>
            <p className="text-xs text-slate-500 font-semibold">{pkg.package_type || 'Package'}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Package Info Card */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-600 space-y-1">
          <p className="font-extrabold text-slate-900">Isi Package</p>
          {pkg.items?.map((item) => (
            <p key={item.order_item_id} className="font-medium text-slate-700">
              • {item.product_name || 'Tanaman'} ×{item.quantity}
            </p>
          ))}
          <p className="pt-1 font-bold text-[#04593f]">
            Foto Packing: {pkg.photo_uploaded ? '✓ Sudah ada' : '✕ Belum ada'}
          </p>
        </div>

        {/* Input Nomor Resi & Scan Actions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800">
              Nomor Resi <span className="text-rose-600">*</span>
            </label>
            {confidence && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                confidence === 'high' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                confidence === 'medium' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {confidence === 'high' && <CheckCircle className="w-3 h-3 text-[#04593f]" />}
                {confidence === 'medium' && <AlertCircle className="w-3 h-3 text-amber-700" />}
                {confidence === 'high' ? 'Terdeteksi dengan baik' : confidence === 'medium' ? 'Perlu diperiksa' : 'Tidak terbaca'}
              </span>
            )}
          </div>

          <input
            placeholder="Masukkan nomor resi..."
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="min-h-11 w-full rounded-2xl border border-slate-200 px-3.5 text-xs font-bold focus:outline-none focus:border-emerald-700 text-slate-900"
          />

          {/* Action Buttons: Webcam, Ambil Foto, Pilih Gambar */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              disabled={scanning}
              onClick={openCamera}
              className="min-h-11 rounded-2xl bg-[#04593f] hover:bg-emerald-950 text-white px-2 text-[11px] font-extrabold disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Webcam</span>
            </button>

            <label className="min-h-11 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-[#04593f] px-2 flex items-center justify-center gap-1 text-[11px] font-extrabold cursor-pointer disabled:opacity-50 transition-all border border-emerald-200">
              <Camera className="w-3.5 h-3.5" />
              <span>{scanning ? 'Membaca…' : 'Ambil Foto'}</span>
              <input
                disabled={scanning}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) scanPhoto(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>

            <label className="min-h-11 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-white text-slate-700 hover:text-[#04593f] px-2 flex items-center justify-center gap-1 text-[11px] font-extrabold cursor-pointer disabled:opacity-50 transition-all shadow-2xs">
              <ImagePlus className="w-3.5 h-3.5" />
              <span>Pilih Gambar</span>
              <input
                disabled={scanning}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) scanPhoto(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>
          </div>

          <p className="text-[10px] leading-relaxed text-slate-500 font-normal">
            <Upload className="mr-1 inline h-3 w-3 text-slate-400" />
            Hasil scan otomatis mengisi nomor resi & ongkir. Anda tetap dapat mengoreksi sebelum menyimpan.
          </p>
        </div>

        {/* Input Ongkir Ekspedisi */}
        <label className="block text-xs font-bold text-slate-800">
          Ongkir Ekspedisi (Rp) <span className="text-rose-600">*</span>
          <input
            type="text"
            placeholder="Masukkan ongkir ekspedisi..."
            value={shippingCost === '0' || shippingCost === '' ? '' : Number(shippingCost).toLocaleString('id-ID')}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const cleanValue = e.target.value.replace(/\./g, '');
              if (cleanValue === '') {
                setShippingCost('');
              } else if (/^\d+$/.test(cleanValue)) {
                setShippingCost(cleanValue);
              }
            }}
            className="mt-1.5 min-h-11 w-full rounded-2xl border border-slate-200 px-3.5 text-xs font-extrabold focus:outline-none focus:border-emerald-700 text-slate-900"
          />
        </label>

        {/* Scan Status & Message Feedback */}
        {scanning && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-[#04593f] animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-[#04593f]" />
            <span>{scanMessage || 'Sedang memproses...'}</span>
          </div>
        )}

        {!scanning && scanMessage && (
          <p className={`text-xs font-bold ${confidence === 'high' ? 'text-[#04593f]' : 'text-amber-800'}`}>
            {scanMessage}
          </p>
        )}

        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

        {/* Footer Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!isValid || saving || scanning}
            className="min-h-11 rounded-2xl bg-[#04593f] hover:bg-emerald-950 text-white text-xs font-extrabold disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
          >
            {saving ? 'Menyimpan...' : 'Simpan Resi'}
          </button>
        </div>
      </form>

      {/* Camera Live Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-extrabold text-slate-900">Kamera Scanner Resi</h3>
              <button type="button" onClick={closeCamera} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl bg-black max-h-[50vh] object-cover" />
            <p className="text-xs text-slate-600 font-medium text-center">
              Arahkan barcode dan teks nominal ongkir ke dalam kamera, lalu klik <span className="font-bold text-[#04593f]">Ambil & Baca</span>.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button type="button" onClick={closeCamera} className="min-h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700">
                Batal
              </button>
              <button type="button" onClick={captureCamera} className="min-h-11 rounded-xl bg-[#04593f] hover:bg-emerald-900 text-white text-xs font-extrabold shadow-sm">
                Ambil & Baca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Before Save */}
      {showSaveConfirmation && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl space-y-4 border border-slate-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-amber-300 bg-amber-50 text-amber-500">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">Konfirmasi Simpan</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Setelah disimpan, nomor resi dan ongkir <span className="font-extrabold text-rose-600">tidak dapat diubah</span>. Lanjutkan?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowSaveConfirmation(false)}
                className="min-h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-sm font-extrabold text-slate-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="min-h-12 rounded-2xl bg-[#04593f] hover:bg-emerald-900 text-sm font-extrabold text-white shadow-sm disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Ya, Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Resi Modal Popup */}
      {duplicate && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl space-y-3 border border-slate-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-rose-700 text-base">Nomor Resi Sudah Digunakan</h3>
            <p className="text-xs font-mono font-bold text-slate-900 bg-slate-50 py-1.5 px-2 rounded-lg border border-slate-200">
              {duplicate.tracking_number}
            </p>
            <div className="text-left text-xs text-slate-600 space-y-1 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <p className="text-slate-400 text-[10px] uppercase font-bold">Pesanan</p>
              <p className="font-bold text-slate-900">{duplicate.order_number || '-'}</p>
              <p className="text-slate-400 text-[10px] uppercase font-bold pt-1.5">Penerima</p>
              <p className="font-bold text-slate-900">{duplicate.customer || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDuplicate(null);
                  setTrackingNumber('');
                }}
                className="min-h-11 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700"
              >
                Scan Lagi
              </button>
              <button
                type="button"
                onClick={() => setDuplicate(null)}
                className="min-h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
