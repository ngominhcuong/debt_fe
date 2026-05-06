function injectPrintToolbar(html: string): string {
  const toolbarHtml = `
    <div class="__print_toolbar">
      <button type="button" onclick="triggerPrint()">Save as PDF / Print</button>
      <span>Neu hop thoai in khong tu mo, bam nut nay.</span>
    </div>
    <style>
      .__print_toolbar {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid #d0d0d0;
        background: #ffffff;
        font-family: Arial, sans-serif;
        font-size: 12px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
      }
      .__print_toolbar button {
        border: 1px solid #1976d2;
        background: #1976d2;
        color: #fff;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }
      @media print {
        .__print_toolbar { display: none !important; }
      }
    </style>
    <script>
      function triggerPrint() {
        window.focus();
        window.print();
      }
      window.addEventListener('load', function () {
        setTimeout(triggerPrint, 250);
      });
    </script>
  `;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${toolbarHtml}</body>`);
  }

  return `${html}${toolbarHtml}`;
}

export function openPrintPreviewWindow(html: string, title: string): boolean {
  const win = globalThis.open("", "_blank");
  if (!win) return false;

  const preparedHtml = injectPrintToolbar(html).replace(
    /<title>.*<\/title>/,
    `<title>${title}</title>`,
  );

  const blob = new Blob([preparedHtml], { type: "text/html;charset=utf-8" });
  const url = globalThis.URL.createObjectURL(blob);
  win.location.href = url;

  // Trigger print from opener as well (some browsers ignore timer in child tab).
  const tryPrint = () => {
    try {
      win.focus();
      win.print();
    } catch {
      // Child page still contains fallback print button.
    }
  };
  win.addEventListener("load", () => {
    globalThis.setTimeout(tryPrint, 250);
  });

  globalThis.setTimeout(() => globalThis.URL.revokeObjectURL(url), 30_000);
  return true;
}
