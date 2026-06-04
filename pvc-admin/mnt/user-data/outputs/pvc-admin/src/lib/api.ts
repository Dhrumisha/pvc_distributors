// src/lib/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Axios instance for all API calls.
//
// TOKEN LIFECYCLE FIX:
//   - Access token lives 15 minutes (JWT expiry)
//   - Cookie lives 1 day
//   - On every request, if token expires within 2 minutes → proactively refresh
//   - On 401 → attempt refresh once, then redirect to login
//   - Token stored in BOTH cookie (for middleware) AND memory (for speed)
// ─────────────────────────────────────────────────────────────────────────────
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// In-memory token — faster than cookie reads on every request
let _accessToken: string | null = null;
let _refreshPromise: Promise<string | null> | null = null; // prevents concurrent refresh races

// ── Token helpers ─────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (_accessToken) return _accessToken;
  const fromCookie = Cookies.get('access_token');
  if (fromCookie) { _accessToken = fromCookie; return fromCookie; }
  return null;
}

export function setToken(token: string) {
  _accessToken = token;
  // Cookie: 1 day, accessible by JS (needed by middleware.ts to read it server-side)
  Cookies.set('access_token', token, {
    expires:  1,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

export function clearToken() {
  _accessToken = null;
  Cookies.remove('access_token');
}

// ── Check if JWT is expired or expiring within `bufferSeconds` ────────────────
function isTokenExpiredOrExpiring(token: string, bufferSeconds = 120): boolean {
  try {
    // Decode payload (middle part of JWT)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // ms
    return Date.now() >= expiresAt - bufferSeconds * 1000;
  } catch {
    return true; // if we can't decode, treat as expired
  }
}

// ── Refresh access token using the HTTP-only refresh cookie ──────────────────
async function doRefresh(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true } // sends the httpOnly refreshToken cookie
    );
    const newToken = res.data?.data?.token;
    if (newToken) {
      setToken(newToken);
      return newToken;
    }
    return null;
  } catch {
    clearToken();
    return null;
  }
}

// Deduplicate concurrent refresh calls — only one refresh at a time
function refreshOnce(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = doRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL:         BASE_URL,
  timeout:         30_000,
  withCredentials: true, // always send cookies (needed for refresh token)
  headers:         { 'Content-Type': 'application/json' },
});

// ── Request interceptor — inject token, proactively refresh if near expiry ───
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  let token = getToken();

  // If token is about to expire, refresh it before the request goes out
  if (token && isTokenExpiredOrExpiring(token)) {
    const refreshed = await refreshOnce();
    token = refreshed ?? token; // use refreshed or fall back to old (let server reject)
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response interceptor — on 401 try refresh once, then redirect ─────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError & { _retried?: boolean }) => {
    if (error.response?.status === 401 && !error.config?._retried) {
      // Mark as retried to prevent infinite loop
      if (error.config) (error.config as any)._retried = true;

      const newToken = await refreshOnce();

      if (newToken && error.config) {
        // Retry original request with new token
        (error.config as any).headers = (error.config as any).headers || {};
        (error.config as any).headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      }

      // Refresh failed — clear session and go to login
      clearToken();
      if (typeof window !== 'undefined') {
        const current = window.location.pathname;
        window.location.href = current !== '/auth/login'
          ? `/auth/login?from=${encodeURIComponent(current)}`
          : '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─────────────────────────────────────────────────────────────────────────────
// Helper — extract readable error message from API response
// ─────────────────────────────────────────────────────────────────────────────
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error   ||
      error.message                 ||
      'An unexpected error occurred'
    );
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message?: string;
  meta?:   { page: number; limit: number; total: number };
}
