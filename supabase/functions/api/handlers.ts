import { createClient } from "npm:@supabase/supabase-js@2";
// Tiny stand-in so the original server-function code below stays unchanged.
const createServerFn = (_o?: unknown) => { const b: any = { inputValidator: () => b, handler: (fn: any) => fn }; return b; };
let _admin: any;

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

async function db() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Server konfiguratsiyasi to‘liq emas");
  _admin ??= createClient(url, key, { auth: { persistSession: false } });
  const supabaseAdmin = _admin;
  return supabaseAdmin as Any;
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSetting(key: string, fallback: Any) {
  const { data } = await (await db()).from("app_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? fallback;
}
async function setSetting(key: string, value: Any) {
  const { error } = await (await db()).from("app_settings").upsert({ key, value });
  if (error) throw new Error(error.message);
}

async function adminCreds() {
  const a = await getSetting("admin", null);
  if (a) return a;

  // Never ship a predictable admin/admin credential in production.
  // Set these as Supabase Edge Function secrets for the first login, then
  // change the credentials in the admin panel to persist them in app_settings.
  const login = Deno.env.get("ADMIN_INITIAL_LOGIN");
  const password = Deno.env.get("ADMIN_INITIAL_PASSWORD");
  if (!login || !password) {
    throw new Error(
      "Admin hali sozlanmagan. Supabase Edge Function secrets ichida ADMIN_INITIAL_LOGIN va kamida  ADMIN_INITIAL_PASSWORD o‘rnating."
    );
  }
  return { login, hash: await sha256("xonqa:" + password) };
}

// Imzolangan sessiya tokeni: "<muddat>.<hmac>". admin_sessions jadvaliga bog'liq emas
// (u yerga yozish xato bersa ham login "muvaffaqiyatli" bo'lib, keyin "Sessiya tugagan" chiqardi).
const SESSION_TTL = 30 * 24 * 3600e3;
async function signSession(exp: number) {
  const a = await adminCreds();
  const secret = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "xonqa") + a.hash;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(String(exp)));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function makeSession() {
  const exp = Date.now() + SESSION_TTL;
  return `${exp}.${await signSession(exp)}`;
}

async function requireAdmin(token: unknown) {
  if (typeof token !== "string" || !token) throw new Error("Avval tizimga kiring");
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (sig && Number.isFinite(exp) && exp > Date.now() && sig === (await signSession(exp))) return;
  // Eski tokenlar bilan moslik
  const { data } = await (await db()).from("admin_sessions").select("token").eq("token", token).maybeSingle();
  if (!data) throw new Error("Sessiya tugagan, qayta kiring");
}

const openNow = (h: Any) => {
  if (!h?.enabled || h.open === h.close) return true;
  const d = new Date(Date.now() + 5 * 3600e3);
  const cur = d.getUTCHours() * 60 + d.getUTCMinutes();
  const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const s = m(h.open), e = m(h.close);
  return s < e ? cur >= s && cur < e : cur >= s || cur < e;
};

function customersOf(orders: Any[]) {
  const map = new Map();
  for (const o of orders) {
    const key = o.phone || o.userId;
    const c = map.get(key) || { userId: key, name: o.userName, username: "", phone: o.phone, count: 0, spent: 0, last: o.createdAt };
    c.count += 1;
    if (["delivered", "picked_up"].includes(o.status)) c.spent += Number(o.total) || 0;
    if (o.createdAt > c.last) c.last = o.createdAt;
    map.set(key, c);
  }
  return [...map.values()];
}

const pass = (d: Any) => d;
const TABLES = { product: "products", category: "categories", } as const;

// ---------- Promotion pricing (mirrors src/admin/lib/promo-types.js) ----------
const txtOf = (v: Any) => (v && typeof v === "object" ? v.uz ?? v.ru ?? v.en ?? "" : v ?? "");
const promoDate = (value: Any, end = false) => {
  if (!value || typeof value !== "string") return null;
  const stamp = value.length <= 10 ? `${value}T${end ? "23:59:59" : "00:00:00"}+05:00`
    : /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}${value.length === 16 ? ":00" : ""}+05:00`;
  const ms = Date.parse(stamp);
  return Number.isFinite(ms) ? ms : null;
};
const promoLiveNow = (p: Any, now = Date.now()) => {
  const s = promoDate(p.startsAt), e = promoDate(p.endsAt, true);
  return !(s !== null && s > now) && !(e !== null && e <= now);
};
function birthdayInWindow(promo: Any, birthday: Any, now = Date.now()) {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(String(birthday || ""));
  if (!m) return false;
  let s = promoDate(promo.startsAt), e = promoDate(promo.endsAt, true);
  if (s === null && e === null) { s = now; e = now; } else { s = s ?? now; e = e ?? Math.max(now, s); }
  const y0 = new Date(s + 5 * 36e5).getUTCFullYear(), y1 = new Date(e + 5 * 36e5).getUTCFullYear();
  for (let y = y0; y <= y1; y++) {
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const dd = m[1] === "02" && m[2] === "29" && !leap ? "28" : m[2];
    const ds = Date.parse(`${y}-${m[1]}-${dd}T00:00:00+05:00`);
    if (ds <= e && ds + 864e5 > s) return true;
  }
  return false;
}
function promoPrice(promo: Any, products: Any[]) {
  const round = (n: number) => Math.max(0, Math.round(n / 100) * 100);
  const v = Number(promo.value) || 0;
  const items = (promo.items ?? []).map((it: Any) => ({ product: products.find((p: Any) => p.id === it.productId), qty: Math.max(1, Number(it.qty) || 1) })).filter((x: Any) => x.product);
  const price = (p: Any) => Number(p.price) || 0;
  const full = items.reduce((t: number, x: Any) => t + price(x.product) * x.qty, 0);
  let final = full;
  const type = promo.type;
  if (type === "combo") final = Number(promo.setPrice) || full;
  else if (type === "bogo") {
    const buy = Math.max(1, Number(promo.buyQty) || 1), get = Math.max(1, Number(promo.getQty) || 1);
    final = items.reduce((t: number, x: Any) => t + price(x.product) * (x.qty - Math.floor(x.qty / (buy + get)) * get), 0);
  } else if (type === "second") {
    final = items.reduce((t: number, x: Any) => t + price(x.product) * x.qty - round(price(x.product) * (Math.min(v, 100) / 100)) * Math.floor(x.qty / 2), 0);
  } else if (type === "fixed") final = items.reduce((t: number, x: Any) => t + round(price(x.product) - v) * x.qty, 0);
  else if (type !== "gift" && type !== "delivery") final = items.reduce((t: number, x: Any) => t + round(price(x.product) * (1 - Math.min(v, 100) / 100)) * x.qty, 0);
  return { full, final: Math.min(full, final), names: items.map((x: Any) => `${txtOf(x.product.name)} × ${x.qty}`) };
}

// ---------- Public ----------
export const getPublicPromotions = createServerFn({ method: "GET" }).handler(async () => {
  return [];
});

export const getPublicCard = createServerFn({ method: "GET" }).handler(async () => {
  const shop: Any = await getSetting("shop", { cardNumber: "", cardOwner: "" });
  return { cardNumber: String(shop.cardNumber || ""), cardOwner: String(shop.cardOwner || "") };
});

export const getPublicMenu = createServerFn({ method: "GET" }).handler(async () => {
  const s = await db();
  const [p, c] = await Promise.all([
    s.from("products").select("data").order("created_at"),
    s.from("categories").select("data, sort").order("sort"),
  ]);
  const promotions = await getPublicPromotions();
  if (p.error) throw new Error(p.error.message);
  if (c.error) throw new Error(c.error.message);
  return {
    promotions,
    products: (p.data ?? []).map((r: Any) => r.data).filter((x: Any) => x.available !== false),
    categories: (c.data ?? []).map((r: Any) => r.data).filter((x: Any) => x.active !== false),
  };
});

export const placeOrder = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data, req }: Any) => {
  const name = String(data?.name ?? "").trim().slice(0, 100);
  const phone = String(data?.phone ?? "").trim().slice(0, 30);
  const delivery = String(data?.delivery ?? "").trim().slice(0, 300);
  const items = Array.isArray(data?.items) ? data.items : [];
  const pickup = data?.method === "pickup" || /^O[‘’'ʻʼ`]?zim olib ketaman/i.test(String(data?.delivery ?? ""));
  const payment = data?.payment === "card" ? "card" : "cash";
  const note = String(data?.comment ?? "").trim().slice(0, 500);
  const address = String(data?.address ?? "").trim().slice(0, 300);
  const loc = data?.location && Number.isFinite(Number(data.location.lat)) && Number.isFinite(Number(data.location.lng))
    ? { name: String(data.location.name ?? "").slice(0, 300) || "Xaritada ochish", lat: Number(data.location.lat), lng: Number(data.location.lng), mapUrl: `https://maps.google.com/?q=${Number(data.location.lat)},${Number(data.location.lng)}` }
    : null;
  const rd = String(data?.receipt ?? "");
  const isPdf = /^data:application\/pdf;base64,/i.test(rd);
  const imageMatch = rd.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([\s\S]+)$/i);
  const pdfMatch = rd.match(/^data:application\/pdf;base64,([\s\S]+)$/i);
  const receiptInput = isPdf && pdfMatch ? { kind: "pdf", mime: "application/pdf", encoded: pdfMatch[1], ext: "pdf" }
    : imageMatch ? { kind: "image", mime: imageMatch[1].toLowerCase(), encoded: imageMatch[2], ext: /jpe?g/i.test(imageMatch[1]) ? "jpg" : imageMatch[1].split("/")[1] }
    : null;
  if (payment === "card" && (!receiptInput || rd.length >= 12_000_000)) throw new Error("Karta orqali to‘lovda chek (rasm yoki PDF, 9 MB gacha) talab qilinadi");
  if (!name || !phone || items.length === 0) throw new Error("Ma’lumotlar to‘liq emas");
  const s = await db();
  const hours = await getSetting("workHours", { enabled: true, open: "10:00", close: "23:00" });
  if (!openNow(hours)) throw new Error(`Hozir sayt yopiq. Ish vaqtimiz: ${hours.open}–${hours.close} (Toshkent vaqti).`);
  const promoReqs = items.filter((i: Any) => i?.promoId);
  const productReqs = items.filter((i: Any) => !i?.promoId);
  const promoIds = [...new Set(promoReqs.map((i: Any) => String(i.promoId)))];
  const { data: promoRows, error: promoError } = promoIds.length
    ? await s.from("promotions").select("id, data").in("id", promoIds)
    : { data: [], error: null };
  if (promoError) throw new Error(`Aksiyalarni o‘qib bo‘lmadi: ${promoError.message}`);
  const promos = (promoRows ?? []).map((r: Any) => ({ ...r.data, id: r.id }));
  const ids = [...new Set([
    ...productReqs.map((i: Any) => String(i.productId)),
    ...promos.flatMap((p: Any) => (p.items ?? []).map((it: Any) => String(it.productId))),
  ])];
  const { data: rows, error: productsError } = ids.length ? await s.from("products").select("id, data").in("id", ids) : { data: [], error: null };
  if (productsError) throw new Error(`Mahsulotlarni o‘qib bo‘lmadi: ${productsError.message}`);
  const productLines = productReqs.map((i: Any) => {
    const p = rows?.find((r: Any) => r.id === String(i.productId))?.data;
    const q = Number(i.quantity);
    if (!p) throw new Error(`Mahsulot topilmadi: ${i.productId}`);
    if (!Number.isSafeInteger(q) || q < 1) throw new Error("Mahsulot miqdori musbat butun son bo‘lishi kerak");
    return { productId: String(i.productId), name: p.name ?? String(i.productId), price: Number(p.price) || 0, quantity: q };
  });
  let birthday: string | null | undefined;
  const getBirthday = async () => {
    if (birthday !== undefined) return birthday;
    birthday = null;
    const token = (req?.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (token) {
      const { data: u } = await s.auth.getUser(token);
      if (u?.user) birthday = (await s.from("profiles").select("birthday").eq("user_id", u.user.id).maybeSingle()).data?.birthday ?? null;
    }
    return birthday;
  };
  const promoLines: Any[] = [];
  let discount = 0;
  const appliedPromos: Any[] = [];
  for (const i of promoReqs) {
    const promo = promos.find((p: Any) => p.id === String(i.promoId));
    const q = Number(i.quantity);
    if (!promo || promo.active === false || !promoLiveNow(promo)) throw new Error("Aksiya topilmadi yoki tugagan");
    if (!Number.isSafeInteger(q) || q < 1) throw new Error("Aksiya miqdori musbat butun son bo‘lishi kerak");
    if (promo.type === "birthday" && !birthdayInWindow(promo, await getBirthday())) throw new Error("Tug‘ilgan kun aksiyasi faqat tug‘ilgan kuni shu muddatga to‘g‘ri kelgan mijozlar uchun");
    const products = [...(rows ?? []).map((r: Any) => ({ ...r.data, id: r.id })), ...(promo.extraProducts ?? [])];
    const { full, final, names } = promoPrice(promo, products);
    if (!names.length) throw new Error("Aksiya tarkibi bo‘sh");
    const title = txtOf(promo.title) || "Aksiya";
    promoLines.push({ productId: `promo:${promo.id}`, promoId: promo.id, name: `Aksiya: ${title} (${names.join(", ")})`, price: final, fullPrice: full, quantity: q });
    discount += (full - final) * q;
    appliedPromos.push({ id: promo.id, title, quantity: q, saved: (full - final) * q });
  }
  const lines = [...productLines, ...promoLines];
  const subtotal = lines.reduce((t: number, l: Any) => t + l.price * l.quantity, 0);
  const order: Any = {
    userId: phone, userName: name, phone,
    address: pickup ? "Filial: https://maps.app.goo.gl/MFgUmBkDQvGbkkmRA" : (address || delivery),
    location: pickup ? { name: "Filial manzili", mapUrl: "https://maps.app.goo.gl/MFgUmBkDQvGbkkmRA" } : loc,
    deliveryType: pickup ? "pickup" : "delivery", paymentMethod: payment, note,
    receipt: receiptInput ? { kind: receiptInput.kind, fileName: `chek.${receiptInput.ext}`, storagePath: null, uploadedAt: new Date().toISOString() } : null,
    items: lines, subtotal: subtotal + discount, discount, total: subtotal, promotions: appliedPromos, status: "new", createdAt: new Date().toISOString(),
  };
  const { data: ins, error: insertError } = await s.from("orders").insert({ data: order }).select("id").single();
  if (insertError) throw new Error(`Buyurtmani saqlab bo‘lmadi: ${insertError.message}`);
  const orderId = String(ins.id);
  if (receiptInput) {
    const binary = atob(receiptInput.encoded.replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const storagePath = `${orderId}/${crypto.randomUUID()}.${receiptInput.ext}`;
    const { error: uploadError } = await s.storage.from("order-receipts").upload(storagePath, bytes, {
      contentType: receiptInput.mime, upsert: false, cacheControl: "3600",
    });
    if (uploadError) {
      await s.from("orders").delete().eq("id", orderId);
      throw new Error(`Chekni xavfsiz saqlab bo‘lmadi. Supabase Storage’da order-receipts bucket yaratilganini tekshiring: ${uploadError.message}`);
    }
    order.receipt.storagePath = storagePath;
    order.receipt.fileName = `chek-${orderId}.${receiptInput.ext}`;
    const { error: updateError } = await s.from("orders").update({ data: { ...order, id: orderId } }).eq("id", orderId);
    if (updateError) {
      await s.storage.from("order-receipts").remove([storagePath]);
      await s.from("orders").delete().eq("id", orderId);
      throw new Error(`Chek ma’lumotini buyurtmaga bog‘lab bo‘lmadi: ${updateError.message}`);
    }
  } else {
    const { error: updateError } = await s.from("orders").update({ data: { ...order, id: orderId } }).eq("id", orderId);
    if (updateError) throw new Error(`Buyurtma raqamini saqlab bo‘lmadi: ${updateError.message}`);
  }
  return { id: orderId };
});

// ---------- Admin ----------
export const adminLoginFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  const a = await adminCreds();
  if (data?.login !== a.login || (await sha256("xonqa:" + String(data?.password ?? ""))) !== a.hash) {
    throw new Error("Login yoki parol noto‘g‘ri");
  }
  const token = await makeSession();
  return { ok: true, token };
});

export const adminLogoutFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  if (typeof data?.token === "string") await (await db()).from("admin_sessions").delete().eq("token", data.token);
  return { ok: true };
});

export const getReceiptFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const s = await db();
  const { data: row, error } = await s.from("orders").select("data").eq("id", String(data?.id)).maybeSingle();
  if (error) throw new Error(`Buyurtma chekini o‘qib bo‘lmadi: ${error.message}`);
  const rc = row?.data?.receipt;
  if (!rc) throw new Error("Bu buyurtmaga chek yuklanmagan.");
  // Legacy orders may still have a base64 data URL or a directly stored URL.
  const legacySrc = typeof rc === "string" ? rc : (rc.dataUrl || rc.url);
  if (legacySrc) return { dataUrl: legacySrc };
  if (!rc.storagePath) throw new Error("Chek fayli topilmadi. Eski buyurtmada chek saqlanmagan bo‘lishi mumkin.");
  const { data: signed, error: signError } = await s.storage.from("order-receipts").createSignedUrl(rc.storagePath, 60);
  if (signError || !signed?.signedUrl) throw new Error(`Chek fayliga vaqtinchalik havola yaratilmadi: ${signError?.message || "noma’lum xato"}`);
  return { dataUrl: signed.signedUrl };
});

export const getAdminDataFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const s = await db();
  const [c, p] = await Promise.all([
    s.from("categories").select("data, sort").order("sort"),
    s.from("products").select("data").order("created_at"),

  ]);
  if (c.error) throw new Error(c.error.message);
  if (p.error) throw new Error(p.error.message);
  const saleRows: Any[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data: batch, error } = await s.from("pos_sales").select("id, total, name, status, started_at, duration_seconds, created_at, pos_sale_items(product_id, name, qty, unit, price)").order("created_at", { ascending: false }).order("id").range(offset, offset + 999);
    if (error) throw new Error(error.message);
    saleRows.push(...(batch ?? []));
    if (!batch || batch.length < 1000) break;
  }
  // Kassada qo‘lda kiritilgan cheklar statistika uchun ishlatiladi.
  const orders = saleRows.map((r: Any) => ({
    id: r.id, name: r.name, startedAt: r.started_at, durationSeconds: r.duration_seconds, status: r.status || "printed", total: Number(r.total), createdAt: r.created_at,
    items: (r.pos_sale_items ?? []).map((i: Any) => ({ productId: i.product_id, name: i.name, quantity: Number(i.qty), unit: i.unit, price: Number(i.price) })),
  }));
  return {
    categories: (c.data ?? []).map((r: Any) => ({ ...r.data, sort: r.sort })),
    products: (p.data ?? []).map((r: Any) => r.data),
    orders,
    promotions: [],
    customers: [],
  };
});

export const saveItemFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const table = TABLES[data?.kind as keyof typeof TABLES];
  if (!table || !data?.item) throw new Error("Noto‘g‘ri so‘rov");
  const item = { ...data.item, id: String(data.item.id || `${data.kind}_${Date.now()}`) };
  const row: Any = { id: item.id, data: item };
  if (table === "categories") {
    row.sort = Number.isFinite(item.sort) ? item.sort : 999;
  }
  const { error } = await (await db()).from(table).upsert(row);
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const removeItemFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const table = TABLES[data?.kind as keyof typeof TABLES];
  if (!table) throw new Error("Noto‘g‘ri so‘rov");
  const { error } = await (await db()).from(table).delete().eq("id", String(data.id));
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const reorderCategoriesFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const s = await db();
  const ids: string[] = Array.isArray(data?.ids) ? data.ids : [];
  await Promise.all(ids.map((id, i) => s.from("categories").update({ sort: i }).eq("id", id)));
  return { ok: true };
});

export const updateOrderStatusFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const s = await db();
  const { data: row } = await s.from("orders").select("data").eq("id", String(data.id)).maybeSingle();
  if (!row) throw new Error("Buyurtma topilmadi");
  const next = { ...row.data, status: data.status, ...(data.reason ? { cancelReason: data.reason } : {}) };
  const { error } = await s.from("orders").update({ data: next }).eq("id", String(data.id));
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const getWorkHoursFn = createServerFn({ method: "GET" }).handler(async () => {
  const workHours = await getSetting("workHours", { enabled: true, open: "10:00", close: "23:00" });
  return { workHours, openNow: openNow(workHours) };
});

export const saveWorkHoursFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  await setSetting("workHours", data.hours);
  return { ok: true };
});

export const getShopSettingsFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const shop = await getSetting("shop", { cardNumber: "", cardOwner: "" });
  return { ...shop, adminLogin: (await adminCreds()).login };
});

export const saveShopSettingsFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const cur = await getSetting("shop", {});
  const settings = { ...cur, cardNumber: String(data.cardNumber ?? ""), cardOwner: String(data.cardOwner ?? "") };
  await setSetting("shop", settings);
  return { ok: true, settings };
});

export const saveAdminCredsFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const a = await adminCreds();
  if ((await sha256("xonqa:" + String(data.currentPassword ?? ""))) !== a.hash) throw new Error("Joriy parol noto‘g‘ri");
  const next = {
    login: String(data.adminLogin || a.login),
    hash: data.adminPassword ? await sha256("xonqa:" + String(data.adminPassword)) : a.hash,
  };
  await setSetting("admin", next);
  return { ok: true };
});

// Mijoz o'z buyurtmasi holatini ko'radi (id + telefon bilan tekshiriladi)
export const getMyOrderStatusFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  const { data: row } = await (await db()).from("orders").select("data").eq("id", String(data?.id ?? "")).maybeSingle();
  if (!row || String(row.data?.phone ?? "").trim() !== String(data?.phone ?? "").trim()) throw new Error("Buyurtma topilmadi");
  return { id: String(data.id), status: row.data?.status || "new", cancelReason: row.data?.cancelReason || "" };
});

// Mijoz faqat qabul qilinmagan ("new") buyurtmani bekor qila oladi
export const cancelMyOrderFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  const s = await db();
  const { data: row } = await s.from("orders").select("data").eq("id", String(data?.id ?? "")).maybeSingle();
  if (!row || String(row.data?.phone ?? "").trim() !== String(data?.phone ?? "").trim()) throw new Error("Buyurtma topilmadi");
  if ((row.data?.status || "new") !== "new") throw new Error("Buyurtma qabul qilingan — uni endi bekor qilib bo‘lmaydi.");
  const next = { ...row.data, status: "cancelled", cancelReason: "Mijozning o‘zi bekor qildi" };
  const { error } = await s.from("orders").update({ data: next }).eq("id", String(data.id));
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const completePosSaleFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const name = data?.name == null ? null : String(data.name).trim();
  if (name && name.length > 100) throw new Error("Nom 100 belgidan oshmasin");
  if (!Array.isArray(data?.items) || !data.items.length || data.items.length > 500) throw new Error("Savdo mahsulotlari noto‘g‘ri");
  const { data: rows, error } = await (await db()).rpc("complete_pos_sale", { p_items: data.items, p_name: name || null, p_started_at: data.startedAt || new Date().toISOString(), p_status: ["printed","saved","cancelled"].includes(data?.status) ? data.status : "printed" });
  if (error) throw new Error(error.message);
  const sale = Array.isArray(rows) ? rows[0] : rows;
  if (!sale?.id) throw new Error("Savdo saqlanmadi");
  return sale;
});


// POS savdo holatini admin tasdig'idan keyin yangilash.
export const updatePosSaleStatusFn = createServerFn({ method: "POST" }).inputValidator(pass).handler(async ({ data }: Any) => {
  await requireAdmin(data?.token);
  const id = String(data?.id ?? "");
  const status = String(data?.status ?? "");
  if (!id) throw new Error("Savdo ID si ko'rsatilmagan");
  if (!["printed", "saved"].includes(status)) throw new Error("Savdo holati noto'g'ri");
  const { data: row, error } = await (await db())
    .from("pos_sales")
    .update({ status })
    .eq("id", id)
    .select("id,status")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Savdo topilmadi");
  return row;
});
