// Mahsulotlar, kategoriyalar va savdolar — serverdan keladigan barcha ma'lumotlar.
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import * as api from "@/admin/lib/api";
import { localSaleStatuses, normalizeSaleStatus } from "@/admin/lib/sale-status";
import { loggedOut } from "./authSlice";
import { normalizeUnit } from "@/admin/lib/units";

const isSessionError = (message = "") => /sessiya|tizimga kiring/i.test(message);

/** Sessiya tugagan bo'lsa tizimdan chiqaradi. */
function handleError(error, dispatch, fallback) {
  console.error(error);
  toast.error(error.message || fallback);
  if (isSessionError(error.message)) {
    api.writeToken(null);
    dispatch(loggedOut());
  }
}

export const refreshData = createAsyncThunk(
  "data/refresh",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const data = await api.fetchAdminData();
      const local = localSaleStatuses();
      return {
        products: (data.products ?? []).map((product) => ({ ...product, unit: normalizeUnit(product.unit) })),
        categories: data.categories ?? [],
        sales: (data.orders ?? []).map((sale) => ({
          ...sale,
          status: normalizeSaleStatus(sale, local),
        })),
      };
    } catch (error) {
      handleError(error, dispatch, "Ma'lumotlarni yuklab bo'lmadi");
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Har bir saqlash amali uchun umumiy thunk: serverga yozadi, keyin ro'yxatni yangilaydi.
 * Natija: true — muvaffaqiyatli, false — xato.
 */
const mutation = (type, request) =>
  createAsyncThunk(`data/${type}`, async (arg, { dispatch }) => {
    try {
      await request(arg);
      return true;
    } catch (error) {
      handleError(error, dispatch, "Saqlab bo'lmadi");
      return false;
    } finally {
      await dispatch(refreshData());
    }
  });

export const saveProduct = mutation("saveProduct", (product) =>
  api.saveProduct({ ...(product.id ? product : { ...product, id: `custom_${Date.now()}` }), unit: normalizeUnit(product.unit) }),
);
export const deleteProduct = mutation("deleteProduct", api.removeProduct);
export const saveCategory = mutation("saveCategory", api.saveCategory);
export const deleteCategory = mutation("deleteCategory", api.removeCategory);
export const reorderCategories = mutation("reorderCategories", api.reorderCategories);

const MUTATIONS = [saveProduct, deleteProduct, saveCategory, deleteCategory, reorderCategories];

const dataSlice = createSlice({
  name: "data",
  initialState: {
    products: [],
    categories: [],
    sales: [],
    loading: true,
    busy: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(refreshData.fulfilled, (state, { payload }) => {
        Object.assign(state, payload);
        state.loading = false;
      })
      .addCase(refreshData.rejected, (state) => {
        state.loading = false;
      })
      // Tezkor ko'rinish uchun o'zgarishni serverdan oldin qo'llash
      .addCase(saveProduct.pending, (state, { meta }) => {
        state.busy += 1;
        const product = meta.arg;
        const index = state.products.findIndex((p) => p.id === product.id);
        if (index >= 0) state.products[index] = { ...state.products[index], ...product };
      })
      .addCase(deleteProduct.pending, (state, { meta }) => {
        state.busy += 1;
        state.products = state.products.filter((p) => p.id !== meta.arg);
      })
      .addCase(reorderCategories.pending, (state, { meta }) => {
        state.busy += 1;
        state.categories = meta.arg.map((id, sort) => ({
          ...state.categories.find((c) => c.id === id),
          sort,
        }));
      })
      .addCase(loggedOut, (state) => {
        state.products = [];
        state.categories = [];
        state.sales = [];
        state.loading = true;
      });

    for (const thunk of MUTATIONS) {
      if (![saveProduct, deleteProduct, reorderCategories].includes(thunk)) {
        builder.addCase(thunk.pending, (state) => {
          state.busy += 1;
        });
      }
      builder.addCase(thunk.fulfilled, (state) => {
        state.busy = Math.max(0, state.busy - 1);
      });
    }
  },
});

export default dataSlice.reducer;

// --- Selektorlar ---
export const selectProducts = (state) => state.data.products;
export const selectCategories = (state) => state.data.categories;
export const selectSales = (state) => state.data.sales;
export const selectLoading = (state) => state.data.loading;
export const selectBusy = (state) => state.data.busy > 0;

/** Kategoriya nomini emoji bilan qaytaradi. */
export const categoryLabel = (categories, id) => {
  const category = categories.find((c) => c.id === id);
  if (!category) return id;
  return category.emoji ? `${category.emoji} ${category.name}` : category.name;
};
