import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

import { tulipApi } from "./services/api";

export interface TulipFilterState {
  filterTags: string[];
}

const initialState: TulipFilterState = {
  filterTags: [],
};

const filterSlice = createSlice({
  name: "filter",
  initialState,
  reducers: {
    toggleFilterTag: (state, action: PayloadAction<string>) => {
      state.filterTags = state.filterTags.includes(action.payload)
        ? state.filterTags.filter((t) => t !== action.payload)
        : [...state.filterTags, action.payload];
    },
  },
});

export const store = configureStore({
  reducer: {
    [tulipApi.reducerPath]: tulipApi.reducer,
    filter: filterSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tulipApi.middleware),
});

setupListeners(store.dispatch);

export const { toggleFilterTag } = filterSlice.actions;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => typeof store.dispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<
  ReturnType<typeof store.getState>
> = useSelector;
