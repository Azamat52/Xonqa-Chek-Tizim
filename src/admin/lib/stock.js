import { normalizeQty } from "./units.js";

/** Mavjud miqdor noma'lum bo'lsa, mahsulotni sotishga ruxsat bermaydi. */
export function availableStock(product) {
  const stock = Number(product?.stock);
  return Number.isFinite(stock) ? Math.max(0, stock) : 0;
}

/** Savdo tanlovida faqat sotuvdagi va omborda mavjud mahsulotlar ko'rinadi. */
export function isSaleProduct(product) {
  return Boolean(product) && product.available !== false && availableStock(product) > 0;
}

/** Kiritilgan va birlikka moslangan miqdor ikkalasi ham omborga sig'ishi kerak. */
export function canSellQuantity(product, value) {
  const requested = Number(value);
  const qty = normalizeQty(product?.unit, value);
  const stock = availableStock(product);
  return (
    product?.available !== false &&
    Number.isFinite(requested) &&
    requested > 0 &&
    requested <= stock &&
    qty <= stock
  );
}
