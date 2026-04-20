import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEV_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api/v1'   // Android emulator loopback
    : 'http://localhost:3000/api/v1';   // iOS simulator

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL
  || (__DEV__ ? DEV_URL : 'https://api.tourneo.de/api/v1');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const tokens = response?.data?.data;
          if (!tokens?.access_token || !tokens?.refresh_token) {
            throw new Error('Invalid refresh response');
          }
          await SecureStore.setItemAsync('access_token', tokens.access_token);
          await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Refresh failed - clear tokens
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    // Report unexpected server errors (5xx) to crash reporter; 4xx is user/app flow
    const status = error?.response?.status;
    if (typeof status === 'number' && status >= 500) {
      try {
        // Lazy import to avoid circular deps at module load time
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { captureError } = require('../utils/crashReport');
        captureError(error, {
          tags: { kind: 'api', status: String(status) },
          extra: { url: error?.config?.url, method: error?.config?.method },
        });
      } catch {
        // ignore — reporter is optional
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };