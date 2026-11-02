// Kassir sessiyasi (token localStorage da saqlanadi).
import { createSlice } from "@reduxjs/toolkit";
import { readToken } from "@/admin/lib/api";

const authSlice = createSlice({
  name: "auth",
  initialState: { token: readToken() },
  reducers: {
    loggedIn: (state, { payload }) => {
      state.token = payload;
    },
    loggedOut: (state) => {
      state.token = null;
    },
  },
});

export const { loggedIn, loggedOut } = authSlice.actions;
export const selectIsAuthed = (state) => Boolean(state.auth.token);
export default authSlice.reducer;
