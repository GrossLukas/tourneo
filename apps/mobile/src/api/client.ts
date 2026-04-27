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

// Single-flight refresh promise so multiple concurrent 401s don't each
// fire their own /auth/refresh — they all await the same in-flight call.
let refreshInFlight: Promise<{ access_token: string; refresh_token: string } | null> | null = null;

async function performTokenRefresh(): Promise<{ access_token: string; refresh_token: string } | null> {
  const refreshToken = await SecureStore.getItemAsync('refresh_token');
  if (!refreshToken) return null;
  // Use a bare axios instance so this call does NOT pass through our
  // own interceptor — that prevented the original infinite-loop risk
  // when /auth/refresh itself returned 401.
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    { timeout: 15000 }
  );
  const tokens = response?.data?.data;
  if (!tokens?.access_token || !tokens?.refresh_token) {
    throw new Error('Invalid refresh response');
  }
  await SecureStore.setItemAsync('access_token', tokens.access_token);
  await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
  return tokens;
}

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshCall =
      typeof originalRequest?.url === 'string' && originalRequest.url.includes('/auth/refresh');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshCall
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshInFlight) {
          refreshInFlight = performTokenRefresh().finally(() => {
            refreshInFlight = null;
          });
        }
        const tokens = await refreshInFlight;
        if (tokens) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          return apiClient(originalRequest);
        }
      } catch {
        // Refresh failed - clear tokens so the app drops back to login.
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