// "Yangi savdo" sahifasining joriy savati.
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { completeSale, updatePosSaleStatus } from "@/admin/lib/api";
import { rememberSaleStatus } from "@/admin/lib/sale-status";
import { normalizeQty, normalizeUnit, unitOf } from "@/admin/lib/units";
import { refreshData } from "./dataSlice";
import { availableStock, canSellQuantity } from "@/admin/lib/stock";
import { unitLabel } from "@/admin/lib/units";
import { printReceipt } from "@/admin/lib/print-receipt";

const STATUS_MESSAGES = {
  cancelled: "Savdo bekor qilindi",
  printed: "Savdo chop etildi",
  saved: "Savdo saqlandi",
};

/** Savdoni yakunlash: printed | saved | cancelled. */
export const finishSale = createAsyncThunk(
  "sale/finish",
  async (status, { getState, dispatch, rejectWithValue }) => {
    const { cart, name, startedAt } = getState().sale;
    if (!cart.length) return rejectWithValue("Savdo tayyor emas");
    if (status !== "cancelled") {
      const invalid = cart.find(
        (item) =>
          !canSellQuantity(
            getState().data.products.find((p) => p.id === item.id),
            item.qty,
          ),
      );
      if (invalid) {
        warnStock(
          getState().data.products.find((p) => p.id === invalid.id),
          invalid.name,
        );
        return rejectWithValue("Omborda yetarli mahsulot yo'q");
      }
    }
    const items = cart.map((x) => ({
      product_id: x.id,
      name: x.name,
      qty: x.qty,
      unit: normalizeUnit(x.unit),
      price: x.price,
    }));

    try {
      // Printer oynasini bekor qilish mumkin bo'lgani uchun avval savdoni "saved" sifatida saqlaymiz.
      const initialStatus = status === "printed" ? "saved" : status;
      const data = await completeSale({ items, name: name.trim() || null, startedAt, status: initialStatus });
      rememberSaleStatus(data.id, initialStatus);
      let finalStatus = initialStatus;

      const saleReceipt = {
        id: data.id,
        items: items.map((item) => ({ ...item, quantity: item.qty })),
        total: Number(data.total),
        name: data.name,
        createdAt: data.created_at,
        durationSeconds: data.duration_seconds,
        status: initialStatus,
      };

      if (status === "printed") {
        // Receipt komponenti render bo'lishi uchun uni oldindan Redux'ga joylaymiz.
        dispatch(saleSlice.actions.setReceipt(saleReceipt));
        await new Promise((resolve) => window.setTimeout(resolve, 180));
        await printReceipt();

        // Brauzer afterprint hodisasi bekor qilish va chop etishda bir xil.
        // Shu sababli yakuniy qarorni foydalanuvchining aniq javobidan olamiz.
        const confirmed = window.confirm(
          "Chop etish oynasida 'Печать' tugmasini bosdingizmi va chek chiqarildimi?\n\nOK — chop etilgan deb belgilash.\nCancel — saqlangan holatda qoldirish.",
        );
        if (confirmed) {
          try {
            await updatePosSaleStatus(data.id, "printed");
            finalStatus = "printed";
            rememberSaleStatus(data.id, "printed");
            toast.success("Chek chop etilgan deb belgilandi");
          } catch (error) {
            console.error(error);
            toast.error(
              error.message?.toLowerCase().includes("unknown function")
                ? "Supabase api Edge Function eski. Yangilangan api funksiyasini qayta deploy qiling. Savdo saqlangan holatda qoldi."
                : error.message || "Chop etish holatini saqlab bo'lmadi",
            );
          }
        } else {
          toast.info("Savdo saqlandi. Chop etilgan deb belgilanmadi.");
        }
      } else {
        toast.success(STATUS_MESSAGES[status]);
      }

      dispatch(refreshData());
      return { ...saleReceipt, status: finalStatus };
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Savdoni saqlab bo'lmadi");
      return rejectWithValue(error.message);
    }
  },
);

const saleSlice = createSlice({
  name: "sale",
  initialState: {
    query: "",
    name: "",
    startedAt: null,
    cart: [],
    receipt: null, // chop etish uchun chek
    busy: false,
    busyAction: null,
  },
  reducers: {
    setQuery: (state, { payload }) => {
      state.query = payload;
    },
    setName: (state, { payload }) => {
      state.name = payload;
    },
    addToCartAccepted: (state, { payload: product }) => {
      if (!state.cart.length) state.startedAt = new Date().toISOString();
      const unit = normalizeUnit(product.unit);
      const step = unitOf(unit).step;
      const existing = state.cart.find((x) => x.id === product.id);
      if (existing) {
        existing.qty = normalizeQty(unit, existing.qty + step);
        return;
      }
      state.cart.push({
        id: product.id,
        image: product.image || "",
        name: product.name.uz,
        price: Number(product.price),
        unit,
        qty: normalizeQty(unit, Math.min(step, availableStock(product))),
      });
    },
    setQtyAccepted: (state, { payload: { id, qty } }) => {
      const item = state.cart.find((x) => x.id === id);
      if (item) item.qty = normalizeQty(item.unit, qty);
    },
    removeFromCart: (state, { payload: id }) => {
      state.cart = state.cart.filter((x) => x.id !== id);
    },
    setReceipt: (state, { payload }) => {
      state.receipt = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(finishSale.pending, (state, action) => {
        state.busy = true;
        state.busyAction = action.meta.arg;
      })
      .addCase(finishSale.rejected, (state) => {
        state.busy = false;
        state.busyAction = null;
      })
      .addCase(finishSale.fulfilled, (state, { payload }) => {
        state.busy = false;
        state.busyAction = null;
        state.receipt = payload;
        state.cart = [];
        state.name = "";
        state.startedAt = null;
      });
  },
});

export const { setQuery, setName, removeFromCart, setReceipt } = saleSlice.actions;

function warnStock(product, fallbackName = "Mahsulot") {
  toast.warning(
    `${product?.name?.uz || fallbackName}: omborda ${availableStock(product)} ${unitLabel(product?.unit)} bor. Bundan ko'p sotib bo'lmaydi.`,
  );
}

/** Qidiruvdan qayta qo'shish, + tugmasi va qo'lda kiritish uchun yagona tekshiruv. */
export const addToCart = (selectedProduct) => (dispatch, getState) => {
  const state = getState();
  if (state.sale.busy) return;
  const product = state.data.products.find((p) => p.id === selectedProduct.id);
  const existing = state.sale.cart.find((x) => x.id === selectedProduct.id);
  const step = unitOf(product?.unit).step;
  const qty = existing
    ? normalizeQty(product?.unit, existing.qty + step)
    : Math.min(step, availableStock(product));
  if (!canSellQuantity(product, qty)) return warnStock(product, selectedProduct.name?.uz);
  dispatch(saleSlice.actions.addToCartAccepted(product));
};

export const setQty =
  ({ id, qty }) =>
  (dispatch, getState) => {
    const state = getState();
    if (state.sale.busy) return;
    const item = state.sale.cart.find((x) => x.id === id);
    if (!item) return;
    const product = state.data.products.find((p) => p.id === id);
    if (Number(qty) <= 0) return;
    if (!canSellQuantity(product, qty)) return warnStock(product, item.name);
    dispatch(saleSlice.actions.setQtyAccepted({ id, qty }));
  };

export const selectSale = (state) => state.sale;
export const selectCartTotal = (state) =>
  state.sale.cart.reduce((sum, x) => sum + x.qty * x.price, 0);

export default saleSlice.reducer;
