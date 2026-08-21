import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Printer,
  Smartphone,
  Monitor,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const PrintBridgeFallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();

  const [copied, setCopied] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const fullUrl = typeof window !== 'undefined' ? window.location.href : '';
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const token = searchParams.get('token') || '';

  const isAndroid = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
  }, []);

  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (typeof window !== 'undefined' && window.innerWidth <= 768 && 'ontouchstart' in window);
  }, []);

  const intentUrl = useMemo(() => {
    const path = location.pathname.replace(/^\//, '');
    const query = location.search.replace(/^\?/, '');
    return `intent://${path}${query ? `?${query}` : ''}#Intent;scheme=https;package=com.antagloma.printbridge;end`;
  }, [location.pathname, location.search]);

  const windowsProtocolUri = useMemo(() => {
    const cleanJobId = jobId || location.pathname.split('/').pop() || '';
    return `antaglomaprint://print-jobs/${encodeURIComponent(cleanJobId)}?token=${encodeURIComponent(token)}`;
  }, [jobId, location.pathname, token]);

  const handleOpenMobileApp = () => {
    setAttempted(true);
    window.location.href = intentUrl;
  };

  const handleOpenWindowsApp = () => {
    setAttempted(true);
    window.location.href = windowsProtocolUri;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Auto-attempt handoff and clipboard copy upon landing
  useEffect(() => {
    if (isAndroid) {
      const timer = window.setTimeout(() => {
        handleOpenMobileApp();
      }, 300);
      return () => window.clearTimeout(timer);
    } else {
      // Auto-copy URL to clipboard on desktop for instant paste
      if (navigator.clipboard && fullUrl) {
        navigator.clipboard.writeText(fullUrl).catch(() => {});
      }
      // On PC / Windows: Try triggering protocol automatically
      const timer = window.setTimeout(() => {
        window.location.href = windowsProtocolUri;
      }, 400);
      return () => window.clearTimeout(timer);
    }
  }, [isAndroid, windowsProtocolUri, intentUrl, fullUrl]);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-900 font-sans">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-xl border border-slate-200 text-center space-y-5 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[#04593f]" />

        {/* Icon & Title */}
        <div className="space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#04593f] border border-emerald-200 shadow-sm">
            {isMobile ? <Smartphone className="w-8 h-8" /> : <Monitor className="w-8 h-8" />}
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-heading font-extrabold text-slate-900">
              {isMobile ? 'Antagloma Print Mobile' : 'Antagloma Print (PC Windows)'}
            </h1>
            <p className="mt-1 text-xs text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
              {isMobile
                ? 'Dokumen cetak sedang dikirim ke aplikasi print di HP Anda.'
                : 'Dokumen cetak sedang dikirim ke aplikasi Antagloma Print di PC Anda.'}
            </p>
          </div>
        </div>

        {/* Action Buttons based on Platform */}
        <div className="space-y-2.5 font-heading">
          {isMobile ? (
            <button
              type="button"
              onClick={handleOpenMobileApp}
              className="w-full rounded-2xl bg-[#04593f] hover:bg-emerald-950 px-4 py-3 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>{attempted ? 'Mencoba Buka Aplikasi HP…' : 'Buka Antagloma Print Mobile'}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleOpenWindowsApp}
                className="w-full rounded-2xl bg-[#04593f] hover:bg-emerald-950 px-4 py-3 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Buka Aplikasi Antagloma Print (PC)</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copied ? 'Link Berhasil Disalin!' : 'Salin URL Job / Link Print'}</span>
          </button>
        </div>

        {/* URL Box for PC manual paste */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>URL Print Job:</span>
            <span className="text-[10px] text-slate-400">Token aktif 5 menit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={fullUrl}
              onFocus={(e) => e.target.select()}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-[11px] font-mono text-slate-700 select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-emerald-900 cursor-pointer"
              title="Salin URL"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* User Guidance Instructions */}
        <div className="text-left text-xs text-slate-600 space-y-1.5 pt-1 border-t border-slate-100">
          <span className="font-heading font-extrabold text-slate-800 block text-xs">Petunjuk Penggunaan:</span>
          {isMobile ? (
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 font-medium">
              <li>Pastikan aplikasi <b>Antagloma Print Mobile</b> sudah terpasang di HP.</li>
              <li>Jika tidak terbuka otomatis, klik tombol hijau di atas.</li>
            </ol>
          ) : (
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 font-medium">
              <li>Pastikan Anda telah menjalankan aplikasi <b>AntaglomaPrint.exe</b> setidaknya satu kali di PC ini agar protokol terdaftar.</li>
              <li>Jika aplikasi tidak otomatis terbuka, klik tombol <b>Buka Aplikasi Antagloma Print (PC)</b> di atas.</li>
              <li>Atau salin URL di atas, buka aplikasi PC dan klik <b>Ambil Job Web</b>.</li>
            </ol>
          )}
        </div>

        {/* Back Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>
        </div>
      </section>
    </main>
  );
};

