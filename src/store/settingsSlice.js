// Ko'rinish, bildirishnoma va tovush sozlamalari.
import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_SETTINGS, loadSettings, normalizeSettings } from "@/admin/lib/settings";

const settingsSlice = createSlice({
  name: "settings",
  initialState: loadSettings(),
  reducers: {
    updateSettings: (state, { payload }) => normalizeSettings({ ...state, ...payload }),
    resetSettings: () => ({ ...DEFAULT_SETTINGS }),
  },
});

export const { updateSettings, resetSettings } = settingsSlice.actions;
export const selectSettings = (state) => state.settings;
export default settingsSlice.reducer;
