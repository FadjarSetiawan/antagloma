/**
 * Print one nota/label in an isolated browser window.
 *
 * Android Chrome may route iframe printing back to the parent document. That
 * caused the complete application page to be split into several print pages.
 */
export function printElementViaIframe(
  elementId: string,
  pageTitle: string,
  pageSizeCss = 'size: 80mm auto;'
): void {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    window.alert('Dokumen yang akan dicetak tidak ditemukan. Silakan buka ulang pratinjau.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.alert('Browser memblokir halaman cetak. Izinkan pop-up untuk situs ini lalu coba kembali.');
    return;
  }

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('style').forEach((style) => style.remove());

  const sharedStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((element) => element.outerHTML)
    .join('\n');

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <base href="${document.baseURI}">
        <title>${pageTitle}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${sharedStyles}
        <style>
          @page {
            ${pageSizeCss}
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
            color: #000 !important;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          .no-print {
            display: none !important;
          }
          #${elementId} {
            display: block !important;
            position: static !important;
            margin: 0 !important;
            overflow: visible !important;
            max-height: none !important;
          }
        </style>
      </head>
      <body>${clone.outerHTML}</body>
    </html>
  `);
  printWindow.document.close();

  let printStarted = false;
  const printDocument = async () => {
    if (printStarted || printWindow.closed) return;
    printStarted = true;

    try {
      await printWindow.document.fonts?.ready;
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error('Gagal membuka dialog cetak:', error);
      printWindow.alert('Gagal membuka dialog cetak. Silakan tutup halaman ini dan coba kembali.');
    }
  };

  printWindow.addEventListener('load', () => {
    window.setTimeout(() => void printDocument(), 350);
  }, { once: true });

  if (printWindow.document.readyState === 'complete') {
    window.setTimeout(() => void printDocument(), 350);
  }
}
