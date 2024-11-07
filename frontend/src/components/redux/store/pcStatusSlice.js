import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../../../config/constants";

// PC 상태 가져오기 비동기 Thunk 생성
export const fetchPCStatus = createAsyncThunk(
  "pcStatus/fetchPCStatus",
  async () => {
    const response = await axios.get(`${API_URL}/getPCStatus`);
    return response.data;
  }
);

const pcStatusSlice = createSlice({
  name: "pcStatus",
  initialState: {
    total: 0,
    normal: 0,
    shutdown: 0,
    warning: 0,
    unknown: 0,
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPCStatus.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPCStatus.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.total = action.payload.total;
        state.normal = action.payload.normal;
        state.shutdown = action.payload.shutdown;
        state.warning = action.payload.warning;
        state.unknown = action.payload.unknown;
      })
      .addCase(fetchPCStatus.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default pcStatusSlice.reducer;
