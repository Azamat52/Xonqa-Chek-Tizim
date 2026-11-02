export function saleDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}.${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}
export function saleDuration(seconds) {
  if (seconds == null) return "—";
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(value / 60)} daqiqa ${value % 60} soniya`;
}
export const saleMoney = (value) => Number(value || 0).toLocaleString("uz-UZ") + " so'm";
