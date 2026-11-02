// Kassa (POS) backend chaqiruvlari — "api" edge funksiyasi orqali.
import { supabase } from "@/integrations/supabase/client";

export const AUTH_KEY = "xonqa-pos-auth";

/** localStorage dan sessiya tokenini o'qish. */
export function readToken() {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(AUTH_KEY) ?? "null");
    return typeof value?.token === "string" ? value.token : null;
  } catch {
    return null;
  }
}

export function writeToken(token) {
  if (token) localStorage.setItem(AUTH_KEY, JSON.stringify({ token }));
  else localStorage.removeItem(AUTH_KEY);
}

/** Edge funksiyani chaqiradi va server xatosini tushunarli xabarga aylantiradi. */
async function call(fn, data) {
  const { data: res, error } = await supabase.functions.invoke("api", {
    body: { fn, data },
  });

  if (error) {
    let message = error.message;
    try {
      const body = await error.context?.json?.();
      if (body?.error) message = body.error;
    } catch {
      // javob JSON emas
    }
    throw new Error(message);
  }

  if (res?.error) throw new Error(res.error);
  return res?.result;
}

const withToken = (data = {}) => ({ ...data, token: readToken() ?? "" });

// --- Kirish ---
export const login = (loginName, password) => call("adminLoginFn", { login: loginName, password });

export const logout = () => call("adminLogoutFn", withToken()).catch(() => null);

// --- Ma'lumotlar ---
export const fetchAdminData = () => call("getAdminDataFn", withToken());

export const saveProduct = (product) =>
  call("saveItemFn", withToken({ kind: "product", item: product }));

export const removeProduct = (id) => call("removeItemFn", withToken({ kind: "product", id }));

export const saveCategory = (category) =>
  call("saveItemFn", withToken({ kind: "category", item: category }));

export const removeCategory = (id) => call("removeItemFn", withToken({ kind: "category", id }));

export const reorderCategories = (ids) => call("reorderCategoriesFn", withToken({ ids }));

// --- Savdo ---
export const completeSale = (sale) => call("completePosSaleFn", withToken(sale));
export const updatePosSaleStatus = (id, status) =>
  call("updatePosSaleStatusFn", withToken({ id, status }));

// --- Sozlamalar ---
export const fetchShopSettings = () => call("getShopSettingsFn", withToken());

export const saveAdminCredentials = (creds) => call("saveAdminCredsFn", withToken(creds));
