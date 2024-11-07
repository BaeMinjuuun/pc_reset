import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  path: [],
};

const pathSlice = createSlice({
  name: "path",
  initialState,
  reducers: {
    setPath: (state, action) => {
      state.path = action.payload;
    },
    resetPath: (state) => {
      state.path = [{ name: "사업장", id: 1 }]; // 그룹 ID 1을 기본 값으로 설정
    },
  },
});

export const { setPath, resetPath } = pathSlice.actions;
export default pathSlice.reducer;
