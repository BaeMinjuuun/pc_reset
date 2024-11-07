// store/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isLoggedIn: false,
    userName: "",
    user_id: "",
    assigned_group: "",
  },
  reducers: {
    login(state, action) {
      state.isLoggedIn = true;
      state.userName = action.payload.userName;
      state.user_id = action.payload.user_id;
      state.assigned_group = action.payload.assigned_group;
    },
    logout(state) {
      state.isLoggedIn = false;
      state.userName = "";
      state.user_id = "";
      state.assigned_group = "";
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
