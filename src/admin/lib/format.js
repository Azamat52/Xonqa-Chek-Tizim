// Pul, sana va savdo hisob-kitob yordamchilari.
import { SALE_STATUSES } from "@/admin/lib/sale-status";

export const STATUS_LABELS = {
  printed: "Chop etilgan",
  saved: "Saqlangan",
  cancelled: "Bekor qilingan",
};

export { SALE_STATUSES };

/** Tushum hisoblanadigan savdolar: chop etilgan va saqlangan. */
export const isCompleted = (sale) => sale.status === "printed" || sale.status === "saved";
export const isSaved = (sale) => sale.status === "saved";
export const isCancelled = (sale) => sale.status === "cancelled";

export const orderSum = (list) => list.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

/** Foizdagi o'zgarish. Oldingi davr 0 bo'lsa: 100% yoki 0%. */
export const pctChange = (current, previous) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;

export const fmtSum = (n) => `${Number(n || 0).toLocaleString("ru-RU")} so'm`;

export const fmtDate = (iso) =>
  new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
