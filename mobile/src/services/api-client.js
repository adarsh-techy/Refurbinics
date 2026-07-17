import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Set once by store.js after the store is created — kept as an injected ref
// (rather than a top-level import of the store/auth-slice) since auth-slice
// itself imports this file to make its own requests, and a top-level
// circular import is fragile under Metro's module system.
let storeRef = null;
export function injectStore(store) {
  storeRef = store;
}

// If a token expires or is rejected mid-session, drop the stale session so
// the navigator falls back to the login screen instead of leaving a
// half-authenticated UI up.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && storeRef) {
      const { logout } = require('../store/auth-slice');
      storeRef.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default apiClient;
