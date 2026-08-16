import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * This is only displayed when Android App Links did not intercept the URL.
 * It avoids the old wildcard redirect (which looked like a blank/refresh) and
 * gives Android a direct, package-scoped retry without a chooser.
 */
export const PrintBridgeFallbackPage: React.FC = () => {
  const location = useLocation();
  const [attempted, setAttempted] = useState(false);
  const intentUrl = useMemo(() => {
    const path = location.pathname.replace(/^\//, '');
    const query = location.search.replace(/^\?/, '');
    return `intent://${path}${query ? `?${query}` : ''}#Intent;scheme=https;package=com.antagloma.printbridge;end`;
  }, [location.pathname, location.search]);

  const openBridge = () => {
    setAttempted(true);
    window.location.href = intentUrl;
  };

  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (!isAndroid) return;
    const timer = window.setTimeout(openBridge, 250);
    return () => window.clearTimeout(timer);
  }, [intentUrl]);

  return (
    <main className="min-h-screen bg-[#f7faf8] flex items-center justify-center p-5 text-slate-900">
      <section className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl border border-emerald-100 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006b4f] text-2xl text-white">▣</div>
        <h1 className="text-xl font-extrabold">Membuka Antagloma Print Bridge</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Dokumen cetak sedang dikirim ke aplikasi. Jika aplikasi belum terbuka, tekan tombol di bawah.
        </p>
        <button type="button" onClick={openBridge} className="mt-6 w-full rounded-xl bg-[#006b4f] px-4 py-3 text-sm font-bold text-white active:scale-[.98]">
          {attempted ? 'Mencoba membuka aplikasi…' : 'Buka Antagloma Print Bridge'}
        </button>
        <p className="mt-4 text-xs leading-5 text-slate-500">Pastikan Antagloma Print Bridge versi terbaru sudah terpasang di HP ini.</p>
      </section>
    </main>
  );
};
