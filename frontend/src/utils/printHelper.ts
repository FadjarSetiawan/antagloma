/**
 * Prints a single document from a top-level print root.
 *
 * Android print services may ignore iframe.print() and capture the parent page
 * instead. Keeping the printable clone as a direct child of <body> lets the
 * print stylesheet hide the React application completely, so the spooler can
 * only discover the requested nota/label.
 */
export async function printElementViaIframe(
  elementId: string,
  pageTitle: string,
  pageSizeCss = 'size: 80mm auto;',
  printableElementCss = '',
): Promise<void> {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    window.alert('Dokumen yang akan dicetak tidak ditemukan. Silakan buka ulang pratinjau.');
    return;
  }

  document.getElementById('antagloma-print-root')?.remove();
  document.getElementById('antagloma-print-style')?.remove();

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach((element) => element.remove());
  clone.querySelectorAll<HTMLElement>('.thermal-print-only, .print-only').forEach((element) => {
    element.style.display = 'block';
  });

  // The nota already contains a dedicated .thermal-print-only representation
  // of this value. Removing the textarea prevents the note from printing twice.
  clone.querySelectorAll('textarea').forEach((textarea) => textarea.remove());

  const printRoot = document.createElement('div');
  printRoot.id = 'antagloma-print-root';
  printRoot.setAttribute('aria-hidden', 'true');
  printRoot.appendChild(clone);

  const resolvedPageSize = resolvePageSize(pageSizeCss, sourceEl);
  const printStyle = document.createElement('style');
  printStyle.id = 'antagloma-print-style';
  printStyle.textContent = `
    @media screen {
      #antagloma-print-root {
        position: fixed !important;
        left: -100000px !important;
        top: 0 !important;
        width: 80mm !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    }

    @media print {
      @page {
        ${resolvedPageSize}
        margin: 0;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        min-height: 0 !important;
        height: auto !important;
        overflow: visible !important;
        background: #ffffff !important;
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
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      #antagloma-print-root .no-print {
        display: none !important;
      }

      #antagloma-print-root .thermal-print-only,
      #antagloma-print-root .print-only {
        display: block !important;
      }

      #antagloma-print-root #${escapeCssIdentifier(elementId)} {
        display: block !important;
        position: static !important;
        visibility: visible !important;
        margin: 0 auto !important;
        max-height: none !important;
        overflow: visible !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        ${printableElementCss}
      }
    }
  `;

  const previousTitle = document.title;
  document.title = pageTitle;
  document.head.appendChild(printStyle);
  document.body.appendChild(printRoot);

  try {
    await document.fonts?.ready;
  } catch {
    // Native/system fonts remain a valid fallback.
  }
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

  try {
    window.print();
  } catch (error) {
    printRoot.remove();
    printStyle.remove();
    document.title = previousTitle;
    console.error('Gagal membuka dialog cetak:', error);
    window.alert('Gagal membuka dialog cetak. Silakan coba kembali.');
    return;
  }

  // Android may fire afterprint before its external service has read the DOM.
  // Keep the isolated document mounted long enough to prevent a dashboard
  // fallback while restoring the visible browser title separately.
  window.setTimeout(() => {
    if (document.title === pageTitle) document.title = previousTitle;
  }, 15000);

  window.setTimeout(() => {
    if (document.getElementById('antagloma-print-root') === printRoot) printRoot.remove();
    if (document.getElementById('antagloma-print-style') === printStyle) printStyle.remove();
    if (document.title === pageTitle) document.title = previousTitle;
  }, 300000);
}

/** Resolve unsupported `80mm auto` into one physical page. */
function resolvePageSize(pageSizeCss: string, sourceEl: HTMLElement): string {
  const rollMatch = pageSizeCss.match(/size\s*:\s*(\d+(?:\.\d+)?)mm\s+auto\s*;?/i);
  if (!rollMatch) return pageSizeCss;

  const widthMm = Number(rollMatch[1]);
  const sourceWidthPx = Math.max(sourceEl.getBoundingClientRect().width, 1);
  const sourceHeightPx = Math.max(sourceEl.scrollHeight, sourceEl.getBoundingClientRect().height, 1);
  const estimatedHeightMm = (sourceHeightPx * widthMm) / sourceWidthPx;
  const pageHeightMm = Math.ceil(Math.min(Math.max(estimatedHeightMm + 4, 100), 240));

  return `size: ${widthMm}mm ${pageHeightMm}mm;`;
}

function escapeCssIdentifier(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}
