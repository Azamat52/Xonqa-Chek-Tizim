// Ilova va Supabase bazasida ishlatiladigan yagona o'lchov birliklari.
export const UNITS = {
  piece: { label: "dona", step: 1, fractional: false },
  kg: { label: "kg", step: 0.1, fractional: true },
  g: { label: "gramm", step: 50, fractional: false },
  l: { label: "litr", step: 0.1, fractional: true },
  m: { label: "metr", step: 0.1, fractional: true },
  pack: { label: "qadoq", step: 1, fractional: false },
};

const UNIT_ALIASES = {
  piece: "piece", pieces: "piece", pcs: "piece", pc: "piece", dona: "piece", don: "piece", шт: "piece", штука: "piece", штуки: "piece",
  kg: "kg", kilogram: "kg", kilograms: "kg", kilogramm: "kg", килограмм: "kg", кг: "kg",
  g: "g", gr: "g", gram: "g", grams: "g", gramm: "g", gramm: "g", грамм: "g", гр: "g",
  l: "l", lt: "l", liter: "l", litre: "l", litr: "l", litр: "l", литр: "l",
  m: "m", meter: "m", metre: "m", metr: "m", метр: "m",
  pack: "pack", package: "pack", paket: "pack", qadoq: "pack", пачка: "pack",
};

/** Har qanday eski/mahalliy yozilishni DB qabul qiladigan kalitga aylantiradi. */
export function normalizeUnit(value) {
  const key = String(value ?? "").trim().toLocaleLowerCase();
  return UNIT_ALIASES[key] ?? "piece";
}

export const UNIT_KEYS = Object.keys(UNITS);
export const unitOf = (key) => UNITS[normalizeUnit(key)];
export const unitLabel = (key) => unitOf(key).label;

/** Miqdorni birlikka moslab to'g'rilaydi. */
export function normalizeQty(key, value) {
  const unit = unitOf(key);
  const number = Number(value) || 0;
  if (unit.fractional) return Math.max(0.01, Math.round(number * 100) / 100);
  return Math.max(1, Math.round(number));
}
