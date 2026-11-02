// Kassa savdosi holatlari: faqat shu uchtasi bo'ladi.
export const SALE_STATUSES = ["printed", "saved", "cancelled"];
const LOCAL_KEY = "xonqa-sale-status";

export const isSaleStatus = (s) => SALE_STATUSES.includes(s);

// Shu qurilmada yaratilgan savdolar holatini eslab qolish (server eski bo'lsa ham to'g'ri ko'rsatish uchun)
export function rememberSaleStatus(id, status) {
  if (typeof window === "undefined" || !id || !isSaleStatus(status)) return;
  try {
    const map = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
    map[id] = status;
    const keys = Object.keys(map);
    if (keys.length > 2000) keys.slice(0, keys.length - 2000).forEach((k) => delete map[k]);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
  } catch {
    /* ixtiyoriy */
  }
}
export function localSaleStatuses() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

/** Serverdan kelgan holat noto'g'ri bo'lsa (masalan eski "delivered"), shu qurilmadagi yoki "printed" holat olinadi. */
export function normalizeSaleStatus(sale, local = {}) {
  const s = String(sale?.status ?? "")
    .trim()
    .toLowerCase();
  if (isSaleStatus(s)) return s;
  return isSaleStatus(local[sale?.id]) ? local[sale.id] : "printed";
}

/** Yangi savdo bildirishnomasi: sarlavha, turi va tovush chalinadimi. */
export function saleNotice(status) {
  if (status === "cancelled")
    return { title: "❌ Savdo bekor qilindi", kind: "error", sound: false };
  if (status === "saved") return { title: "💾 Yangi savdo saqlandi", kind: "success", sound: true };
  return { title: "🖨️ Yangi savdo chop etildi", kind: "success", sound: true };
}

export const salesLink = (status) => `/sales?status=${isSaleStatus(status) ? status : "all"}`;
