import React, { useState } from 'react';
import { thermalPrinterService } from '../../utils/thermalPrinter';
import { Bluetooth, Printer, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({ isOpen, onClose }) => {
  const [connectedName, setConnectedName] = useState<string | null>(
    thermalPrinterService.getConnectedDeviceName()
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const isSupported = thermalPrinterService.isSupported();

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    setTestSuccess(false);

    try {
      const name = await thermalPrinterService.connect();
      setConnectedName(name);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyambungkan ke printer Bluetooth.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestPrint = async () => {
    setErrorMsg(null);
    setTestSuccess(false);

    try {
      const testText = `
--------------------------------
     ANTAGLOMA FLORIST
  TEST PRINT BLUETOOTH OK!
--------------------------------
Tgl: ${new Date().toLocaleString('id-ID')}
Status: Terhubung via Web Bluetooth
--------------------------------
`.trim();

      await thermalPrinterService.printEscPosText(testText);
      setTestSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim test cetak.');
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 font-sans text-xs">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#04593f] to-emerald-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Bluetooth className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Printer Bluetooth</h3>
              <p className="text-[10px] text-slate-400 font-normal">Koneksi langsung tanpa dialog print</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isSupported ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-amber-900">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Web Bluetooth Tidak Didukung</span>
            </div>
            <p className="text-[11px] leading-normal font-medium text-amber-800">
              Gunakan browser **Google Chrome** atau **Microsoft Edge** pada Android / Windows / Laptop Anda untuk mengaktifkan fitur ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Status Connection Box */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              connectedName
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  connectedName ? 'bg-[#04593f] text-white shadow-2xs' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block leading-tight">
                    Status Printer
                  </span>
                  <span className="text-xs font-black text-slate-900 block">
                    {connectedName || 'Belum Terhubung'}
                  </span>
                </div>
              </div>

              {connectedName && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-extrabold text-[9.5px]">
                  Aktif
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {testSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-[11px] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#04593f] shrink-0" />
                <span>Test cetak berhasil terkirim ke printer!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                disabled={isConnecting}
                onClick={handleConnect}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#04593f] via-[#04593f] to-emerald-900 hover:from-emerald-800 hover:to-slate-900 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Mencari Bluetooth...</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-4 h-4 text-white" />
                    <span>{connectedName ? 'Sambungkan Printer Lain' : 'Cari & Sambungkan Printer'}</span>
                  </>
                )}
              </button>

              {connectedName && (
                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="w-full py-2.5 px-4 bg-white border border-emerald-600 text-[#04593f] hover:bg-emerald-50 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#04593f]" />
                  <span>Test Cetak Struk</span>
                </button>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer text-center"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
