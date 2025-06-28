import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import reportsReducer from './slices/reportsSlice';
import locationsReducer from './slices/locationsSlice';
import ocrReducer from './slices/ocrSlice';
import syncReducer from './slices/syncSlice';
import settingsReducer from './slices/settingsSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'reports', 'locations', 'ocr', 'settings'], // Only persist these reducers
  blacklist: ['sync'], // Don't persist sync state
};

const rootReducer = combineReducers({
  auth: authReducer,
  reports: reportsReducer,
  locations: locationsReducer,
  ocr: ocrReducer,
  sync: syncReducer,
  settings: settingsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
        ],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 