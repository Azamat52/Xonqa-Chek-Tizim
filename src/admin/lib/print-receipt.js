/**
 * 55 mm termal printer uchun avtomatik chek.
 * Chek balandligi mazmuniga qarab hisoblanadi.
 */
export function printReceipt() {
  const receipt = document.getElementById("pos-receipt");

  if (!receipt) {
    return Promise.reject(
      new Error("Chek oynasi topilmadi"),
    );
  }

  const measureStyle = document.createElement("style");

  measureStyle.textContent = `
    #pos-receipt {
      display: block !important;
      position: static !important;

      width: 55mm !important;
      min-width: 0 !important;
      max-width: 55mm !important;

      box-sizing: border-box !important;
      padding: 2mm !important;
      margin: 0 !important;

      background: #fff !important;
      color: #000 !important;

      font: 7px Arial, sans-serif !important;
      line-height: 1.2 !important;

      word-break: normal !important;
      overflow-wrap: normal !important;
    }

    #pos-receipt .receipt-heading {
      width: 100% !important;
      box-sizing: border-box !important;

      text-align: center !important;
      padding-bottom: 1.5mm !important;
      margin-bottom: 1mm !important;

      border-bottom: 1px dashed #000 !important;
    }

    #pos-receipt h1 {
      max-width: 100% !important;
      margin: 0 0 2mm !important;

      font: bold 13px Arial, sans-serif !important;

      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    #pos-receipt p {
      margin-top: 0;
      margin-bottom: 0;
    }

    #pos-receipt .receipt-heading p {
      margin-bottom: 2mm !important;

      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    #pos-receipt .receipt-id {
      display: block !important;
      width: 100% !important;

      font-size: 7px !important;

      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    #pos-receipt .receipt-info {
      width: 100% !important;
      margin: 1.5mm 0 !important;
    }

    #pos-receipt .receipt-info p {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;

      margin: 0 0 1mm !important;

      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    #pos-receipt .receipt-info b {
      white-space: nowrap !important;
    }

    /* JADVAL */
    #pos-receipt .receipt-table {
      display: table !important;

      width: 100% !important;
      max-width: 100% !important;

      margin: 0 !important;
      padding: 0 !important;

      table-layout: fixed !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;

      font: 6px Arial, sans-serif !important;
    }

    /* USTUNLAR */
    #pos-receipt .receipt-name {
      width: 30% !important;
    }

    #pos-receipt .receipt-qty {
      width: 22% !important;
    }

    #pos-receipt .receipt-price {
      width: 26% !important;
    }

    #pos-receipt .receipt-total-column {
      width: 22% !important;
    }

    /* KATAKLAR */
    #pos-receipt .receipt-table th,
    #pos-receipt .receipt-table td {
      box-sizing: border-box !important;

      min-width: 0 !important;
      max-width: 100% !important;

      padding: 0.7mm 0.3mm !important;
      border: 1px solid #000 !important;

      vertical-align: middle !important;
      text-align: center !important;

      white-space: nowrap !important;
      word-break: normal !important;
      overflow-wrap: normal !important;

      overflow: hidden !important;
      text-overflow: ellipsis !important;

      line-height: 1.2 !important;
    }

    #pos-receipt .receipt-table th {
      font-size: 6px !important;
      font-weight: 700 !important;
    }

    #pos-receipt .receipt-table td {
      font-size: 6px !important;
    }

    #pos-receipt .receipt-table td:first-child {
      text-align: left !important;
    }

    #pos-receipt .receipt-cell-line {
      display: block !important;

      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;

      margin: 0 !important;
      padding: 0 !important;

      box-sizing: border-box !important;

      white-space: nowrap !important;
      word-break: normal !important;
      overflow-wrap: normal !important;

      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /* MIQDOR */
    #pos-receipt .receipt-quantity {
      font-size: 6px !important;
      white-space: nowrap !important;
      text-overflow: ellipsis !important;
    }

    /* BIRLIK NARXI */
    #pos-receipt .receipt-unit-price {
      font-size: 5px !important;
      letter-spacing: -0.2px !important;

      white-space: nowrap !important;
      text-overflow: ellipsis !important;
    }

    /* MAHSULOT JAMI */
    #pos-receipt .receipt-item-total {
      font-size: 6px !important;
      font-weight: 700 !important;

      white-space: nowrap !important;
      text-overflow: ellipsis !important;
    }

    #pos-receipt .receipt-table tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    #pos-receipt .receipt-table thead {
      display: table-header-group !important;
    }

    /* UMUMIY SUMMA */
    #pos-receipt .receipt-total {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;

      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;

      gap: 1mm !important;
      margin-top: 1.5mm !important;

      font-size: 10px !important;

      white-space: nowrap !important;
      overflow: hidden !important;
    }

    #pos-receipt .receipt-total b {
      min-width: 0 !important;

      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    #pos-receipt .receipt-total b:last-child {
      text-align: right !important;
    }

    /* RAHMAT */
    #pos-receipt .receipt-thanks {
      width: 100% !important;
      max-width: 100% !important;

      padding-top: 1.5mm !important;
      margin: 0 !important;

      text-align: center !important;
      white-space: nowrap !important;

      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /* CHEK OXIRI */
    #pos-receipt .receipt-end {
      display: block !important;

      width: 100% !important;
      max-width: 100% !important;

      margin-top: 2mm !important;

      font-size: 7px !important;
      letter-spacing: 0.3px !important;

      text-align: left !important;
      white-space: nowrap !important;

      overflow: hidden !important;
      text-overflow: clip !important;
    }
  `;

  document.head.appendChild(measureStyle);

  const previousStyle = receipt.getAttribute("style");

  Object.assign(receipt.style, {
    display: "block",
    position: "absolute",
    left: "-10000px",
    top: "0",
    width: "55mm",
    minWidth: "0",
    maxWidth: "55mm",
    boxSizing: "border-box",
    padding: "2mm",
    visibility: "hidden",
  });

  let heightMm;

  try {
    const heightPx = receipt.getBoundingClientRect().height;

    heightMm = Math.max(
      45,
      Math.ceil((heightPx * 25.4) / 96 + 3),
    );
  } catch (error) {
    if (previousStyle === null) {
      receipt.removeAttribute("style");
    } else {
      receipt.setAttribute("style", previousStyle);
    }

    measureStyle.remove();

    return Promise.reject(error);
  }

  /* Dastlabki inline uslublarni tiklash */
  if (previousStyle === null) {
    receipt.removeAttribute("style");
  } else {
    receipt.setAttribute("style", previousStyle);
  }

  measureStyle.remove();

  /* Dinamik qog'oz o'lchami */
  let pageStyle = document.getElementById(
    "pos-dynamic-print-page",
  );

  if (!pageStyle) {
    pageStyle = document.createElement("style");
    pageStyle.id = "pos-dynamic-print-page";
    document.head.appendChild(pageStyle);
  }

  pageStyle.textContent = `
    @media print {
      @page {
        size: 55mm ${heightMm}mm;
        margin: 0;
      }
    }
  `;

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      pageStyle.remove();
      window.removeEventListener("afterprint", handleAfterPrint);
    };

    const handleAfterPrint = () => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve();
    };

    window.addEventListener(
      "afterprint",
      handleAfterPrint,
      { once: true },
    );

    try {
      window.print();
    } catch (error) {
      if (!settled) {
        settled = true;
        cleanup();
        reject(error);
      }
    }
  });
}
