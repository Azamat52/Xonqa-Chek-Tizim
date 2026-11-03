
/**
 * Chekni faqat o'zini alohida hujjatda 50 mm termal printerga chiqaradi.
 * Asosiy sahifadagi boshqa elementlar chop etish oqimiga kirmaydi.
 */
export function printReceipt() {
  const receipt = document.getElementById("pos-receipt");

  if (!receipt) {
    return Promise.reject(new Error("Chek oynasi topilmadi"));
  }

  // Chekni alohida iframe ichida chop etamiz.
  const frame = document.createElement("iframe");
  frame.setAttribute("title", "Chekni chop etish");
  frame.setAttribute("aria-hidden", "true");

  Object.assign(frame.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden",
  });

  document.body.appendChild(frame);

  const printDocument = frame.contentDocument;

  if (!printDocument) {
    frame.remove();
    return Promise.reject(
      new Error("Chop etish hujjatini yaratib bo'lmadi")
    );
  }

  const receiptMarkup = receipt.outerHTML;

  printDocument.open();

  printDocument.write(`<!doctype html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chek</title>

  <style>
    @page {
      size: 50mm 200mm;
      margin: 0;
    }

    * {
      box-sizing: border-box !important;
    }

    html, body {
      width: 50mm !important;
      min-width: 50mm !important;
      max-width: 50mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #000 !important;
      font-family: Arial, sans-serif !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    #pos-receipt {
      display: block !important;
      position: static !important;
      width: 50mm !important;
      min-width: 50mm !important;
      max-width: 50mm !important;
      height: auto !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 2mm !important;
      overflow: visible !important;
      background: #fff !important;
      color: #000 !important;
      font: 8px/1.25 Arial, sans-serif !important;
      word-break: normal !important;
      overflow-wrap: anywhere !important;
    }

    #pos-receipt .receipt-heading {
      width: 100% !important;
      margin: 0 0 1.5mm !important;
      padding: 0 0 1.5mm !important;
      text-align: center !important;
      border-bottom: 1px dashed #000 !important;
    }

    #pos-receipt h1 {
      max-width: 100% !important;
      margin: 0 0 1.5mm !important;
      font: bold 14px/1.2 Arial, sans-serif !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    #pos-receipt p {
      margin: 0 !important;
    }

    #pos-receipt .receipt-heading p,
    #pos-receipt .receipt-id {
      display: block !important;
      margin: 0 0 1mm !important;
      font-size: 8px !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    #pos-receipt .receipt-info {
      width: 100% !important;
      margin: 1.5mm 0 !important;
    }

    #pos-receipt .receipt-info p {
      margin: 0 0 1mm !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    #pos-receipt .receipt-info b {
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    #pos-receipt .receipt-table {
      display: table !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      table-layout: fixed !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;
      font: 7px/1.2 Arial, sans-serif !important;
    }

    #pos-receipt .receipt-name {
      width: 31% !important;
    }

    #pos-receipt .receipt-qty {
      width: 20% !important;
    }

    #pos-receipt .receipt-price {
      width: 27% !important;
    }

    #pos-receipt .receipt-total-column {
      width: 22% !important;
    }

    #pos-receipt .receipt-table th,
    #pos-receipt .receipt-table td {
      min-width: 0 !important;
      padding: 1mm 0.4mm !important;
      border: 1px solid #000 !important;
      text-align: center !important;
      vertical-align: middle !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
      line-height: 1.2 !important;
    }

    #pos-receipt .receipt-table th {
      font-size: 7px !important;
      font-weight: 700 !important;
    }

    #pos-receipt .receipt-table td:first-child {
      text-align: left !important;
    }

    #pos-receipt .receipt-cell-line {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
    }

    #pos-receipt .receipt-quantity,
    #pos-receipt .receipt-item-total {
      font-size: 7px !important;
    }

    #pos-receipt .receipt-unit-price {
      font-size: 6.5px !important;
      letter-spacing: -0.1px !important;
    }

    #pos-receipt .receipt-table tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    #pos-receipt .receipt-total {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 1mm !important;
      width: 100% !important;
      margin-top: 2mm !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      white-space: normal !important;
    }

    #pos-receipt .receipt-total b {
      min-width: 0 !important;
      overflow-wrap: anywhere !important;
    }

    #pos-receipt .receipt-thanks {
      width: 100% !important;
      margin-top: 2mm !important;
      text-align: center !important;
      font-size: 8px !important;
      white-space: normal !important;
    }

    #pos-receipt .receipt-end {
      display: none !important;
    }

    @media print {
      html, body {
        width: 50mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      #pos-receipt {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>

<body>
  ${receiptMarkup}
</body>
</html>`);

  printDocument.close();

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      frame.contentWindow?.removeEventListener(
        "afterprint",
        handleAfterPrint
      );

      window.removeEventListener("afterprint", handleAfterPrint);
      frame.remove();
    };

    const finish = () => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve();
    };

    const handleAfterPrint = () => finish();

    frame.onload = async () => {
      try {
        const frameWindow = frame.contentWindow;
        const frameDocument = frame.contentDocument;

        if (!frameWindow || !frameDocument) {
          throw new Error("Chop etish oynasiga ulanib bo'lmadi");
        }

        if (frameDocument.fonts?.ready) {
          await frameDocument.fonts.ready;
        }

        const printedReceipt =
          frameDocument.getElementById("pos-receipt");

        if (!printedReceipt) {
          throw new Error(
            "Chek chop etish hujjatida topilmadi"
          );
        }

        // Chek balandligini mazmuniga qarab hisoblash.
        const heightPx = Math.max(
          printedReceipt.scrollHeight,
          printedReceipt.getBoundingClientRect().height
        );

        const heightMm = Math.max(
          35,
          Math.ceil((heightPx * 25.4) / 96) + 3
        );

        const pageStyle = frameDocument.createElement("style");

        pageStyle.textContent = `
          @page {
            size: 50mm ${heightMm}mm;
            margin: 0;
          }

          html, body {
            min-height: 0 !important;
            height: auto !important;
          }
        `;

        frameDocument.head.appendChild(pageStyle);

        frameWindow.addEventListener(
          "afterprint",
          handleAfterPrint,
          { once: true }
        );

        window.addEventListener(
          "afterprint",
          handleAfterPrint,
          { once: true }
        );

        frameWindow.focus();
        frameWindow.print();

      } catch (error) {
        if (!settled) {
          settled = true;
          cleanup();
          reject(error);
        }
      }
    };

    // Ayrim brauzerlarda document.write dan keyin
    // load hodisasi kechikishi mumkin.
    if (frame.contentDocument?.readyState === "complete") {
      frame.onload?.(new Event("load"));
    }
  });
}
