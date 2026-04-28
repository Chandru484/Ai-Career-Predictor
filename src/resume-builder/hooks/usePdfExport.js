/**
 * usePdfExport — Generates a PDF by triggering the browser's native print API
 * on just the resume paper element.
 *
 * WHY NOT html2canvas?
 * html2canvas crashes with "Failed to execute 'addColorStop' on 'CanvasGradient':
 * The provided double value is non-finite" when it encounters any CSS gradient
 * it cannot fully parse (linear-gradient directions, radial-gradients, backdrop-filter,
 * etc.). The crashes are caused deep inside the library and are not reliably patchable
 * via onclone sanitizers.
 *
 * WHY THE BROWSER PRINT API?
 * The browser renders the page using the SAME engine that produced the preview,
 * so the PDF is guaranteed to be pixel-perfect. No library, no canvas, no crashes.
 * In Chrome/Edge the user selects "Save as PDF" as the printer destination.
 * In Firefox "Save to PDF" is a built-in printer.
 *
 * HOW IT WORKS:
 * 1. Opens a hidden <iframe>
 * 2. Clones the resume paper element into it
 * 3. Copies all stylesheets so fonts / CSS variables resolve correctly
 * 4. Calls iframe.contentWindow.print()
 * 5. Removes the iframe on afterprint
 */
import { useState, useCallback } from 'react';

export function usePdfExport() {
  const [exporting, setExporting] = useState(false);

  const exportPdf = useCallback((elementRef, filename = 'resume') => {
    return new Promise((resolve, reject) => {
      const el = elementRef?.current;
      if (!el) {
        reject(new Error('No element ref provided'));
        return;
      }

      setExporting(true);

      try {
        const a4WidthPx = 794;
        const a4HeightPx = 1123;
        const sourceWidth = Math.max(el.scrollWidth, el.offsetWidth, a4WidthPx);
        const sourceHeight = Math.max(el.scrollHeight, el.offsetHeight, a4HeightPx);
        const fitScale = Math.min(1, a4WidthPx / sourceWidth, a4HeightPx / sourceHeight);

        // ── 1. Create a hidden iframe ──────────────────────────────────
        const iframe = document.createElement('iframe');
        iframe.style.cssText = [
          'position:fixed', 'top:-9999px', 'left:-9999px',
          'width:794px',
          'height:1123px',
          'border:none',
          'visibility:hidden',
        ].join(';');
        document.body.appendChild(iframe);

        const iDoc = iframe.contentDocument || iframe.contentWindow.document;

        // ── 2. Copy all stylesheets from the host page ─────────────────
        const styleLinks = [...document.querySelectorAll('link[rel="stylesheet"]')]
          .map(link => `<link rel="stylesheet" href="${link.href}">`)
          .join('\n');

        const styleBlocks = [...document.querySelectorAll('style')]
          .map(s => `<style>${s.textContent}</style>`)
          .join('\n');

        // ── 3. Build the iframe document ───────────────────────────────
        iDoc.open();
        iDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  ${styleLinks}
  ${styleBlocks}
  <style>
    /* Force A4 page with no margins and only the resume content */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 794px;
      height: 1123px;
      background: white !important;
      overflow: hidden;
    }
    #a4-root {
      width: 794px;
      height: 1123px;
      overflow: hidden;
      background: white;
    }
    #a4-content {
      width: 794px;
      transform-origin: top left;
      transform: scale(${fitScale});
    }
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
        background: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div id="a4-root">
    <div id="a4-content">${el.outerHTML}</div>
  </div>
</body>
</html>`);
        iDoc.close();

        // ── 4. Wait for resources (fonts etc.) then print ──────────────
        const startPrint = () => {
          try {
            iframe.contentWindow.focus();

            // afterprint fires when the print dialog is dismissed (save or cancel)
            iframe.contentWindow.addEventListener('afterprint', () => {
              document.body.removeChild(iframe);
              setExporting(false);
              resolve();
            }, { once: true });

            // Fallback cleanup if afterprint never fires (some browsers)
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              setExporting(false);
              resolve();
            }, 60_000); // 60 s — plenty of time for the user to interact

            iframe.contentWindow.print();
          } catch (err) {
            document.body.removeChild(iframe);
            setExporting(false);
            reject(err);
          }
        };

        if (iDoc.readyState === 'complete') {
          setTimeout(startPrint, 30);
        } else {
          iframe.onload = startPrint;
        }
      } catch (err) {
        setExporting(false);
        reject(err);
      }
    });
  }, []);

  return { exportPdf, exporting };
}
