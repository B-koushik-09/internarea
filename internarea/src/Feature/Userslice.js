import { createSlice } from "@reduxjs/toolkit";

// 🔑 PERSISTENT SESSION: Load user from localStorage on initialization
const loadUserFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem("internarea_user");
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error("Error loading user from localStorage:", e);
    }
  }
  return null;
};

// 🔑 PERSISTENT SESSION: Save user to localStorage
const saveUserToStorage = (user) => {
  if (typeof window !== 'undefined') {
    try {
      if (user) {
        localStorage.setItem("internarea_user", JSON.stringify(user));
        if (user.token) {
          localStorage.setItem("token", user.token);
        }
      } else {
        localStorage.removeItem("internarea_user");
        localStorage.removeItem("token");
      }
    } catch (e) {
      console.error("Error saving user to localStorage:", e);
    }
  }
};

export const userslice = createSlice({
  name: "user",
  initialState: {
    user: loadUserFromStorage(),
    isLoading: loadUserFromStorage() ? false : true, // Don't show loading if we have cached user
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      // 🔑 Save to localStorage for persistence
      saveUserToStorage(action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.isLoading = false;
      // 🔑 Clear from localStorage
      saveUserToStorage(null);
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

