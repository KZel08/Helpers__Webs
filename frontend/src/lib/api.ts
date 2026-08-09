// ─── API Client ─────────────────────────────────────────────────────────────
// Uses native fetch with JWT token injection and auto-refresh on 401.

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// Token storage helpers
export const tokenStorage = {
  getAccess: () => localStorage.getItem('access_token'),
  getRefresh: () => localStorage.getItem('refresh_token'),
  setAccess: (t: string) => localStorage.setItem('access_token', t),
  setRefresh: (t: string) => localStorage.setItem('refresh_token', t),
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// ─── Response Envelope Types ──────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  error?: { code: string; details: unknown };
}

// ─── Core Fetch Wrapper ──────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      tokenStorage.clear();
      return null;
    }
    const data: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
    tokenStorage.setAccess(data.data.accessToken);
    tokenStorage.setRefresh(data.data.refreshToken);
    return data.data.accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = tokenStorage.getAccess();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    }
  }

  const json: ApiResponse<T> | ApiError = await res.json();

  if (!res.ok || !json.success) {
    throw new Error((json as ApiError).message ?? 'Request failed');
  }

  return (json as ApiResponse<T>).data;
}

// ─── Auth API ─────────────────────────────────────────────────────────────

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
}

export interface AuthResponse {
  user: UserData;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: (body: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role?: string;
    phone?: string;
  }) => apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  }),

  login: (body: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),

  refresh: (refreshToken: string) =>
    apiFetch<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  getMe: () => apiFetch<UserData>('/auth/me'),
};

// ─── Services API ──────────────────────────────────────────────────────────

export interface ServiceData {
  id: string;
  title: string;
  description?: string;
  price: number;
  priceType: string;
  duration?: number;
  isActive: boolean;
  category: { id: string; name: string };
  helper: {
    id: string;
    rating: number;
    user: { firstName: string; lastName: string; avatarUrl?: string };
  };
}

export const servicesApi = {
  list: (params?: { page?: number; limit?: number; categoryId?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.categoryId) q.set('categoryId', params.categoryId);
    if (params?.search) q.set('search', params.search);
    return apiFetch<{ services: ServiceData[]; total: number }>(`/services?${q.toString()}`);
  },
  get: (id: string) => apiFetch<ServiceData>(`/services/${id}`),
  create: (body: unknown) => apiFetch<ServiceData>('/services', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: unknown) => apiFetch<ServiceData>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<{ message: string }>(`/services/${id}`, { method: 'DELETE' }),
};

// ─── Helpers API ───────────────────────────────────────────────────────────

export const helpersApi = {
  list: (params?: { page?: number; limit?: number; categoryId?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.categoryId) q.set('categoryId', params.categoryId);
    return apiFetch<{ helpers: unknown[]; total: number }>(`/helpers?${q.toString()}`);
  },
  get: (id: string) => apiFetch<unknown>(`/helpers/${id}`),
};

// ─── Bookings API ──────────────────────────────────────────────────────────

export interface BookingData {
  id: string;
  status: string;
  totalAmount: number;
  bookingDate: string;
  notes?: string;
  service: { title: string };
  helper: { user: { firstName: string; lastName: string } };
  payment?: { status: string };
}

export const bookingsApi = {
  list: (role: 'customer' | 'helper' = 'customer') =>
    apiFetch<BookingData[]>(`/bookings?role=${role}`),
  get: (id: string) => apiFetch<BookingData>(`/bookings/${id}`),
  create: (body: unknown) =>
    apiFetch<BookingData>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: unknown) =>
    apiFetch<BookingData>(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  cancel: (id: string) =>
    apiFetch<{ message: string }>(`/bookings/${id}`, { method: 'DELETE' }),
};

// ─── Categories API ────────────────────────────────────────────────────────

export interface CategoryData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export const categoriesApi = {
  list: () => apiFetch<CategoryData[]>('/categories'),
};

// ─── Notifications API ─────────────────────────────────────────────────────

export const notificationsApi = {
  list: () => apiFetch<{ notifications: unknown[]; unreadCount: number }>('/notifications'),
  markRead: () => apiFetch<{ message: string }>('/notifications/read', { method: 'PUT' }),
};

// ─── Reviews API ───────────────────────────────────────────────────────────

export const reviewsApi = {
  getForHelper: (helperId: string) => apiFetch<unknown[]>(`/reviews/${helperId}`),
  create: (body: { bookingId: string; rating: number; comment?: string }) =>
    apiFetch<unknown>('/reviews', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Payments API ──────────────────────────────────────────────────────────

export const paymentsApi = {
  createOrder: (body: { bookingId: string; method: string }) =>
    apiFetch<unknown>('/payments/create', { method: 'POST', body: JSON.stringify(body) }),
  verify: (body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    apiFetch<unknown>('/payments/verify', { method: 'POST', body: JSON.stringify(body) }),
  history: () => apiFetch<unknown[]>('/payments/history'),
};

// ─── Support API ───────────────────────────────────────────────────────────

export const supportApi = {
  create: (body: { title: string; message: string; priority?: string }) =>
    apiFetch<unknown>('/support', { method: 'POST', body: JSON.stringify(body) }),
  list: () => apiFetch<unknown[]>('/support'),
};
