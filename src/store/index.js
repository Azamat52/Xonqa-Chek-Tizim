// Redux store — loyihaning yagona holat manbai.
import { configureStore } from "@reduxjs/toolkit";
import { persistSettings } from "@/admin/lib/settings";
import authReducer from "./authSlice";
import dataReducer from "./dataSlice";
import saleReducer from "./saleSlice";
import settingsReducer from "./settingsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    data: dataReducer,
    sale: saleReducer,
    settings: settingsReducer,
  },
});

// Sozlamalar o'zgarsa localStorage ga yoziladi
let lastSettings = store.getState().settings;
store.subscribe(() => {
  const { settings } = store.getState();
  if (settings !== lastSettings) {
    lastSettings = settings;
    persistSettings(settings);
  }
});
