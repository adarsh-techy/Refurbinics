import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth-slice';
import { injectStore } from '../services/api-client';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

injectStore(store);
