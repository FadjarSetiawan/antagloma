/**
 * Dedicated Print Utility for Antagloma Sales Order Management System
 * Solves Android Chrome & Mobile Web iframe print flickering issues permanently.
 */

export function printElementViaIframe(
  elementId: string,
  pageTitle: string,
  pageSizeCss = 'size: 80mm auto;'
): void {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    window.print();
    return;
  }

  // Clone target element and remove internal modal <style> tags that might contain display:none or body selectors
  const clone = sourceEl.cloneNode(true) as HTMLElement;
  const internalStyles = clone.querySelectorAll('style');
  internalStyles.forEach((s) => s.remove());

  // Remove any stale print iframe from DOM
  const existingIframe = document.getElementById('antagloma-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  // Create isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'antagloma-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '-9999px';
  // Keep a real print surface in the render tree. A 0x0 or display:none
  // iframe makes Android Chrome open and immediately close the print UI.
  iframe.style.width = '100mm';
  iframe.style.height = '1200px';
  iframe.style.border = '0';
  iframe.style.visibility = 'visible';
  iframe.style.opacity = '0';

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  // Extract external stylesheets & font links (exclude inline styles with body selectors)
  const styleElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <title>${pageTitle}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${styleElements}
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
            width: 100% !important;
            height: auto !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; padding: 0; margin: 0; display: block !important; visibility: visible !important;">
          ${clone.outerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // Trigger print after iframe renders styles
  setTimeout(async () => {
    try {
      if (iframe.contentWindow) {
        if (iframe.contentWindow.document.fonts?.ready) {
          await iframe.contentWindow.document.fonts.ready;
        }
        iframe.contentWindow.focus();
        iframe.contentWindow.addEventListener('afterprint', () => iframe.remove(), { once: true });
        iframe.contentWindow.print();
      } else {
        window.print();
      }
    } catch (e) {
      console.warn('Iframe print fallback to window.print:', e);
      window.print();
    }
  }, 500);
}
