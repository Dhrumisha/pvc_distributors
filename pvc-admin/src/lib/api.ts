// src/lib/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single Axios instance used by ALL API calls in the project.
// Change BASE_URL here to point to a different backend.
// ─────────────────────────────────────────────────────────────────────────────
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send/receive the HTTP-only refreshToken cookie
});

// ── Request interceptor: inject Bearer token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get('access_token') || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      try {
        const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = refreshRes.data?.data?.token;
        if (newToken) {
          Cookies.set('access_token', newToken, { expires: 1 });
          if (error.config) {
            error.config.headers = error.config.headers || {};
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return api.request(error.config);
          }
        }
      } catch {
        // Refresh failed — redirect to login
        Cookies.remove('access_token');
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─────────────────────────────────────────────────────────────────────────────
// Helper to extract error message from API response
// ─────────────────────────────────────────────────────────────────────────────
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
}

// ─────────────────────────────────────────────────────────────────────────────
// Type helpers
// ─────────────────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: { page: number; limit: number; total: number };
}
