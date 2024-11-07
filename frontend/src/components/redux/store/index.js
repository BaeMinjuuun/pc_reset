// store/index.js
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";
import { combineReducers } from "redux";
import authReducer from "./authSlice";
import pathReducer from "./pathSlice";
import pcStatusReducer from "./pcStatusSlice";

const persistConfig = {
  key: "root", // 최상위 키
  storage: storageSession, // sessionStorage 엔진 사용
  whitelist: ["path"], // 영속화할 리듀서
};

const rootReducer = combineReducers({
  path: pathReducer,
  auth: authReducer,
  // pcStatus: pcStatusReducer,
});

// Persist 리듀서 생성
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist 관련 경고 무시
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export const persistor = persistStore(store);

export default store;
