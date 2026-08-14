import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../../types/order';
import { Tag, Printer, X, Phone } from 'lucide-react';
import { printElementViaIframe } from '../../utils/printHelper';
import { thermalPrinterService } from '../../utils/thermalPrinter';

interface ShippingLabelModalProps {
  order: Order | null;
  packageInfo?: {
    subOrderNumber: string;
    packageType: string;
    itemsSummary: string;
    weightInfo: string;
  } | null;
  onClose: () => void;
}

const createSingleImagePdf = async (canvas: HTMLCanvasElement): Promise<Blob> => {
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Gagal membuat gambar untuk PDF label.'));
    }, 'image/jpeg', 0.95);
  });

  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let byteLength = 0;

  const appendText = (value: string) => {
    const bytes = encoder.encode(value);
    chunks.push(bytes);
    byteLength += bytes.length;
  };
  const appendBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    byteLength += bytes.length;
  };
  const startObject = (objectNumber: number) => {
    offsets[objectNumber] = byteLength;
    appendText(`${objectNumber} 0 obj\n`);
  };

  // Use the exact standard 4x6-inch MediaBox. 4BarCode recognizes this preset
  // reliably, while a 100x150 mm custom page can be remembered as 4x8 inches
  // and shrink the label into the upper half of the physical sticker.
  const pageWidth = '288';
  const pageHeight = '432';
  const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;

  appendText('%PDF-1.4\n');
  startObject(1);
  appendText('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  startObject(2);
  appendText('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  startObject(3);
  appendText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
  startObject(4);
  appendText(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  appendBytes(jpegBytes);
  appendText('\nendstream\nendobj\n');
  startObject(5);
  appendText(`<< /Length ${encoder.encode(contentStream).length} >>\nstream\n${contentStream}endstream\nendobj\n`);

  const xrefOffset = byteLength;
  appendText('xref\n0 6\n0000000000 65535 f \n');
  for (let objectNumber = 1; objectNumber <= 5; objectNumber += 1) {
    appendText(`${String(offsets[objectNumber]).padStart(10, '0')} 00000 n \n`);
  }
  appendText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const pdfBuffer = new ArrayBuffer(byteLength);
  const pdfBytes = new Uint8Array(pdfBuffer);
  let writeOffset = 0;
  chunks.forEach((chunk) => {
    pdfBytes.set(chunk, writeOffset);
    writeOffset += chunk.length;
  });

  return new Blob([pdfBuffer], { type: 'application/pdf' });
};

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({ order, packageInfo, onClose }) => {
  const [labelFile, setLabelFile] = useState<File | null>(null);
  const [isPreparingLabel, setIsPreparingLabel] = useState(false);
  const [isSharingLabel, setIsSharingLabel] = useState(false);

  const subOrderNum = packageInfo?.subOrderNumber || `${order?.order_number || 'label'}-A`;

  useEffect(() => {
    if (!order) return;

    let cancelled = false;
    const prepareLabelFile = async () => {
      setIsPreparingLabel(true);
      setLabelFile(null);

      try {
        // Wait until the portal content has been painted before rendering it.
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const printableEl = document.getElementById('shipping-label-printable');
        if (!printableEl) return;

        // Render at 1200px width (300 DPI for 4x6 inch thermal sticker)
        const { canvas: renderedCanvas } = await thermalPrinterService.renderToThermalCanvas(printableEl, 1200);
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 1200;
        labelCanvas.height = 1800;

        const context = labelCanvas.getContext('2d');
        if (!context) throw new Error('Gagal menyiapkan gambar label.');

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, labelCanvas.width, labelCanvas.height);

        // Scale to fill full width and draw strictly from the top (offsetY = 0)
        const scale = labelCanvas.width / renderedCanvas.width;
        const outputWidth = labelCanvas.width;
        const outputHeight = Math.min(Math.round(renderedCanvas.height * scale), labelCanvas.height);

        context.drawImage(renderedCanvas, 0, 0, outputWidth, outputHeight);

        const blob = await createSingleImagePdf(labelCanvas);

        if (!cancelled) {
          const cleanSubOrder = subOrderNum.replace(/[^a-zA-Z0-9-]/g, '_');
          setLabelFile(new File([blob], `Label_Pengiriman_${cleanSubOrder}.pdf`, { type: 'application/pdf' }));
        }
      } catch (error) {
        console.error('Gagal menyiapkan label untuk 4BarCode:', error);
      } finally {
        if (!cancelled) setIsPreparingLabel(false);
      }
    };

    void prepareLabelFile();
    return () => {
      cancelled = true;
    };
  }, [order, packageInfo, subOrderNum]);

  if (!order) return null;

  const handlePrint = async () => {
    const cleanSubOrder = (subOrderNum || 'label').replace(/[^a-zA-Z0-9-]/g, '_');
    const title = `Label_Pengiriman_${cleanSubOrder}`;
    
    // Blur active button focus to prevent Chrome Android touch event cancellation flicker
    if (document.activeElement && 'blur' in document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }

    // Android must receive the 4x6 PDF through its app chooser so the Admin
    // can explicitly select 4BarCode/XP-420B. Sending it to window.print()
    // first makes Android route the label to the default RawBT print service,
    // which belongs to the separate 80 mm nota printer.
    const canShareLabel = Boolean(
      labelFile
      && typeof navigator.share === 'function'
      && (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [labelFile] })),
    );

    if (canShareLabel && labelFile) {
      setIsSharingLabel(true);
      try {
        await navigator.share({
          files: [labelFile],
          title,
          text: 'Buka PDF ini dengan 4BarCode untuk mencetak ke printer XP-420B.',
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Gagal membuka 4BarCode melalui menu bagikan:', error);
        window.alert('Gagal membuka menu aplikasi. Silakan coba kembali.');
      } finally {
        setIsSharingLabel(false);
      }
      return;
    }

    // Desktop browsers generally do not support sharing a generated file.
    // Keep the high-quality isolated iframe browser print preview as their fallback.
    if (typeof window.print === 'function') {
      void printElementViaIframe(
        'shipping-label-printable',
        title,
        'size: 100mm 150mm;',
        'width: 100mm !important; height: 150mm !important; min-height: 150mm !important; padding: 2mm !important; overflow: hidden !important; box-sizing: border-box !important;',
      );
      return;
    }

    if (labelFile) {
      const downloadUrl = URL.createObjectURL(labelFile);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = labelFile.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      window.alert('PDF label sudah diunduh. Buka file tersebut dari folder Download, lalu pilih 4BarCode.');
      return;
    }

    window.alert('Browser tidak menyediakan fitur cetak dan PDF label belum siap. Silakan coba kembali.');
  };

  const rawPkgType = packageInfo?.packageType || order.delivery_method || 'Fullset';
  const normalizedPkgType = rawPkgType.trim().toLowerCase();
  const isWoodPacking = order.delivery_method === 'Packing Kayu' || normalizedPkgType === 'packing kayu';
  const pkgType = isWoodPacking
    ? 'Packing Kayu'
    : normalizedPkgType === 'fullset'
      ? 'Fullset'
      : ['non-fullset', 'non fullset', 'non_fullset'].includes(normalizedPkgType)
        ? 'Non Fullset'
        : rawPkgType;

  const modalContent = (
    <div id="shipping-label-modal-container" className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-5 w-full h-full overflow-y-auto font-sans text-slate-900">
      <div className="bg-white rounded-2xl border border-slate-200 w-[95%] max-w-sm sm:max-w-md shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans">
        {/* Header Modal Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#04593f] text-white flex items-center justify-center font-bold shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                Pratinjau Label Alamat Pengiriman
              </h3>
              <p className="text-[10px] text-slate-500 font-normal">
                Format stiker 10x15 cm (4x6 inch)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-600 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Shipping Label Body Container */}
        <div id="shipping-label-printable" className="p-3 sm:p-4 overflow-y-auto print-area text-slate-900 font-sans text-xs flex-1">
          {/* Label Container Box (Proportional high-clarity layout for 10x15cm / 4x6 inch thermal paper) */}
          <div className="p-3 space-y-4 font-sans bg-white text-black">
            {/* Header Store & Order ID */}
            <div className="flex items-start justify-between border-b-[3px] border-black pb-3 pt-0.5 gap-2">
              <div className="space-y-0.5 min-w-0 flex-1">
                <h1 className="font-black text-2xl tracking-tight text-black uppercase leading-tight">
                  ANTAGLOMA FLORIST
                </h1>
                <p className="text-sm font-bold text-black leading-tight">
                  Spesialis Adenium Bunga Tumpuk
                </p>
                <p className="text-xs font-semibold text-black leading-tight">
                  WA: 0858-9450-3333 / 0857-3333-1889
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="border-2 border-black px-2.5 py-0.5 text-xs font-black text-black uppercase inline-block mb-1 tracking-wider leading-normal text-center">
                  STIKER RESI
                </div>
                <p className="font-black text-xl text-black leading-tight tracking-tight whitespace-nowrap">{subOrderNum}</p>
                <span className="font-black text-sm text-black uppercase block mt-0.5">
                  [ {pkgType} ]
                </span>
              </div>
            </div>

            {/* Customer Recipient Section */}
            <div className="border-b-[3px] border-black pb-3 space-y-0.5">
              <span className="text-xs font-black uppercase text-slate-800 block tracking-wider">
                PENERIMA / CUSTOMER:
              </span>
              <h2 className="text-3xl font-black text-black block leading-tight break-words pt-1">{order.customer_name}</h2>
              <p className="text-xl font-black text-black flex items-center gap-2 pt-1">
                <Phone className="w-5 h-5 text-black shrink-0" /> {order.phone}
              </p>
            </div>

            {/* Destination Address Block */}
            <div className="border-b-[3px] border-black pb-3 space-y-1">
              <span className="text-xs font-black uppercase text-slate-800 block tracking-wider">
                ALAMAT PENGIRIMAN:
              </span>
              <p className="font-black text-xl text-black leading-snug break-words pt-1">
                {[order.district_name ? `Kec. ${order.district_name}` : null, order.regency_name, order.province_name].filter(Boolean).join(', ')}
              </p>
              <p className="text-base font-bold text-black leading-relaxed break-words pt-1">
                {order.full_address}
              </p>
            </div>

            {/* Package Summary Box */}
            <div className="border-[2.5px] border-black rounded-xl p-3.5 text-lg font-black text-black flex items-center justify-between bg-slate-50/80 mt-1">
              <span>Isi Paket: {packageInfo?.itemsSummary || 'Tanaman'}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0 no-print">
          <button type="button" onClick={() => void handlePrint()} disabled={isPreparingLabel || isSharingLabel} className="py-2.5 px-5 bg-[#04593f] hover:bg-emerald-900 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-wait text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer flex-1">
            <Printer className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">
              {isPreparingLabel ? 'Menyiapkan Label...' : isSharingLabel ? 'Membuka Aplikasi...' : 'Cetak Label'}
            </span>
          </button>
          <button type="button" onClick={onClose} className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center shrink-0">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
