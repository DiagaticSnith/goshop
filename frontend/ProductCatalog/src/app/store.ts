import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import favoritesReducer from "../features/products/favoritesSlice";

const persistConfig = {
    key: "root",
    storage
};

const combinedReducers = combineReducers({ favorites: favoritesReducer });
const persistedReducers = persistReducer(persistConfig, combinedReducers);

export const store = configureStore({
    reducer: persistedReducers,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false
    })
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;