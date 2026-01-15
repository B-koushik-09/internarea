import { createSlice } from "@reduxjs/toolkit";

export const userslice = createSlice({
  name: "user",
  initialState: {
    user: null,
    isLoading: true, // Default to loading
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isLoading = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
});
export const { login, logout, setLoading } = userslice.actions;
export const selectuser = (state) => state.user.user;
export const selectLoading = (state) => state.user.isLoading;
export default userslice.reducer;
