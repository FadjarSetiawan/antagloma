/**
 * Isolated Print Utility for Antagloma Sales Order Management System
 * Creates a truly isolated hidden iframe with its own standalone HTML document.
 * This guarantees that Android Print Service / RawBT / Chrome Mobile prints ONLY
 * the intended document, with zero possibility of the React dashboard or navigation leaking into the print job.
 */

export async function printElementViaIframe(
  elementId: string,
  pageTitle: string,
  pageSizeCss = 'size: 80mm auto;',
  customContainerCss = ''
): Promise<void> {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    window.alert('Dokumen yang akan dicetak tidak ditemukan. Silakan buka ulang pratinjau.');
    return;
  }

  // Clone source element & remove internal <style> blocks that might contain stale @media print rules
  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('style').forEach((s) => s.remove());

  // Remove any elements marked with .no-print in the print clone
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());

  // Make sure elements marked as .thermal-print-only or print-only are visible
  clone.querySelectorAll<HTMLElement>('.thermal-print-only, .print-only').forEach((el) => {
    el.style.display = 'block';
  });

  // Replace textarea with plain text div for clean print rendering
  clone.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((ta) => {
    const textVal = ta.value || ta.textContent || '';
    const textDiv = document.createElement('div');
    textDiv.className = 'text-xs font-medium italic text-black whitespace-pre-wrap leading-tight';
    textDiv.textContent = textVal.trim() ? textVal : '-';
    ta.replaceWith(textDiv);
  });

  // Remove previous print iframe if present
  const oldIframe = document.getElementById('antagloma-print-iframe');
  if (oldIframe) {
    try {
      oldIframe.remove();
    } catch {
      // ignore
    }
  }

  // Create isolated iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'antagloma-print-iframe';
  iframe.setAttribute('title', 'Print Document');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.alert('Gagal membuat dokumen cetak terisolasi. Silakan coba kembali.');
    return;
  }

  // Collect active stylesheets (Tailwind, fonts) from the main document
  const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style:not(#antagloma-print-style)'))
    .map((el) => el.outerHTML)
    .join('\n');

  // Determine width based on paper size
  const is80mm = pageSizeCss.includes('80mm');
  const bodyWidthCss = is80mm ? 'width: 80mm !important; max-width: 80mm !important;' : 'width: 100% !important;';

  const fullHtml = `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    ${headStyles}
    <style>
      @page {
        ${pageSizeCss}
        margin: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        ${bodyWidthCss}
        min-height: 0 !important;
        height: auto !important;
        overflow: visible !important;
        font-family: Arial, Helvetica, sans-serif !important;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .thermal-print-only, .print-only {
        display: block !important;
      }
      #print-isolated-wrapper {
        margin: 0 auto !important;
        padding: 0 !important;
        background: #ffffff !important;
        ${bodyWidthCss}
        ${customContainerCss}
      }
    </style>
  </head>
  <body>
    <div id="print-isolated-wrapper">
      ${clone.outerHTML}
    </div>
  </body>
</html>`;

  iframeDoc.open();
  iframeDoc.write(fullHtml);
  iframeDoc.close();

  // Wait for all <link rel="stylesheet"> elements inside the iframe to finish loading
  try {
    const linkElements = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    if (linkElements.length > 0) {
      await Promise.all(
        linkElements.map(
          (link) =>
            new Promise<void>((resolve) => {
              if (link.sheet) {
                resolve();
                return;
              }
              link.addEventListener('load', () => resolve(), { once: true });
              link.addEventListener('error', () => resolve(), { once: true });
              setTimeout(resolve, 800);
            })
        )
      );
    }
  } catch {
    // ignore stylesheet wait error and proceed
  }

  // Wait for iframe fonts to be fully ready
  try {
    if (iframe.contentWindow?.document?.fonts) {
      await iframe.contentWindow.document.fonts.ready;
    }
  } catch {
    // ignore
  }

  // Allow a short rendering tick for layout computation
  await new Promise((resolve) => setTimeout(resolve, 150));

  try {
    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  } catch (error) {
    console.error('Gagal menjalankan perintah cetak iframe:', error);
    window.alert('Gagal memproses pencetakan. Silakan coba kembali.');
  }

  // Do NOT destroy iframe immediately on afterprint.
  // Keep it around so Android Print Spooler has ample time to read it.
  setTimeout(() => {
    const el = document.getElementById('antagloma-print-iframe');
    if (el === iframe) {
      try {
        el.remove();
      } catch {
        // ignore
      }
    }
  }, 300000);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
