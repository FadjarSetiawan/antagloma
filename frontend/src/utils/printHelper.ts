/**
 * Print one nota/label from the current page without exposing the rest of the
 * application to Android's print service.
 */
export function printElementViaIframe(
  elementId: string,
  pageTitle: string,
  pageSizeCss = 'size: 80mm auto;',
  printableElementCss = ''
): void {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    window.alert('Dokumen yang akan dicetak tidak ditemukan. Silakan buka ulang pratinjau.');
    return;
  }

  document.getElementById('antagloma-print-root')?.remove();
  document.getElementById('antagloma-print-style')?.remove();

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('style').forEach((style) => style.remove());

  const printRoot = document.createElement('div');
  printRoot.id = 'antagloma-print-root';
  printRoot.setAttribute('aria-hidden', 'true');
  printRoot.appendChild(clone);

  const printStyle = document.createElement('style');
  printStyle.id = 'antagloma-print-style';
  printStyle.textContent = `
    @media screen {
      #antagloma-print-root {
        position: fixed !important;
        left: -100000px !important;
        top: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    }

    @media print {
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

      body > *:not(#antagloma-print-root) {
        display: none !important;
      }

      #antagloma-print-root {
        display: block !important;
        position: static !important;
        visibility: visible !important;
        width: 100% !important;
        min-height: 0 !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }

      #antagloma-print-root .no-print {
        display: none !important;
      }

      #antagloma-print-root #${elementId} {
        display: block !important;
        position: static !important;
        visibility: visible !important;
        margin: 0 !important;
        overflow: visible !important;
        max-height: none !important;
        ${printableElementCss}
      }
    }
  `;

  const previousTitle = document.title;
  document.title = pageTitle;
  document.head.appendChild(printStyle);
  document.body.appendChild(printRoot);

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    document.title = previousTitle;
    printRoot.remove();
    printStyle.remove();
  };

  window.addEventListener('afterprint', cleanup, { once: true });

  // Keep the print node mounted while Android's print preview is active.
  window.setTimeout(() => {
    try {
      window.print();
    } catch (error) {
      cleanup();
      console.error('Gagal membuka dialog cetak:', error);
      window.alert('Gagal membuka dialog cetak. Silakan coba kembali.');
    }
  }, 100);

  // Safety cleanup for browsers that never dispatch afterprint.
  window.setTimeout(cleanup, 120000);
}
