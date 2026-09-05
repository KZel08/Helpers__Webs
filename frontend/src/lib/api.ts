// ─── API Client ─────────────────────────────────────────────────────────────
// Uses native fetch with JWT token injection and auto-refresh on 401.

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

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
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
  avatarUrl?: string | null;
  phone?: string | null;
  addresses?: AddressData[];
}

// ─── User / Address Types ───────────────────────────────────────────────────

export interface AddressData {
  id: string;
  userId: string;
  label?: string | null;
  houseNo: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  label?: string;
  houseNo: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export type UpdateAddressRequest = Partial<CreateAddressRequest>;

export interface RegisterResponse {
  user: UserData;
  message: string;
  demoOtp?: string;
}

export interface VerifyEmailResponse {
  user: UserData;
  accessToken: string;
  refreshToken: string;
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
    phone?: string;
  }) => apiFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  }),

  verifyEmail: (email: string, otp: string) =>
    apiFetch<VerifyEmailResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
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

// ─── Users API ─────────────────────────────────────────────────────────────

export const usersApi = {
  getMe: () => apiFetch<UserData>('/users/me'),
  updateProfile: (body: unknown) => apiFetch<UserData>('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccount: () => apiFetch<{ message: string }>('/users', { method: 'DELETE' }),

  // Addresses
  listAddresses: () => apiFetch<AddressData[]>('/users/addresses'),
  getAddress: (id: string) => apiFetch<AddressData>(`/users/addresses/${id}`),
  createAddress: (body: CreateAddressRequest) => apiFetch<AddressData>('/users/addresses', { method: 'POST', body: JSON.stringify(body) }),
  updateAddress: (id: string, body: UpdateAddressRequest) => apiFetch<AddressData>(`/users/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAddress: (id: string) => apiFetch<{ message: string }>(`/users/addresses/${id}`, { method: 'DELETE' }),
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
  media?: Array<{ id: string; url: string; type: string }>;
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

// ─── Bookings API ──────────────────────────────────────────────────────────

/** Matches backend CreateBookingDto exactly. Do NOT add helperId or totalAmount. */
export interface CreateBookingRequest {
  serviceId: string;
  addressId: string;
  /** ISO date string, e.g. "2026-08-01T10:00:00.000Z" */
  bookingDate: string;
  /** ISO date string (optional) */
  scheduledAt?: string;
  notes?: string;
}

export interface BookingData {
  id: string;
  status: string;
  totalAmount: number;
  bookingDate: string;
  scheduledAt?: string | null;
  notes?: string;
  service: { title: string };
  helper: { user: { firstName: string; lastName: string } };
  payment?: { status: string };
}

export const bookingsApi = {
  list: (role: 'customer' | 'helper' = 'customer') =>
    apiFetch<BookingData[]>(`/bookings?role=${role}`),
  get: (id: string) => apiFetch<BookingData>(`/bookings/${id}`),
  create: (body: CreateBookingRequest) =>
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
  get: (id: string) => apiFetch<CategoryData>(`/categories/${id}`),
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

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  provider: string | null;
  transactionId: string | null;
}

export interface CreatePaymentOrderRequest {
  bookingId: string;
  method: PaymentMethod;
}

export interface CreatePaymentOrderResponse {
  payment: PaymentRecord;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  message: string;
  payment: PaymentRecord;
}

export const paymentsApi = {
  createOrder: (body: CreatePaymentOrderRequest) =>
    apiFetch<CreatePaymentOrderResponse>('/payments/create', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verify: (body: VerifyPaymentRequest) =>
    apiFetch<VerifyPaymentResponse>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  history: () => apiFetch<PaymentRecord[]>('/payments/history'),
};

// ─── Support API ───────────────────────────────────────────────────────────

export const supportApi = {
  create: (body: { title: string; message: string; priority?: string }) =>
    apiFetch<unknown>('/support', { method: 'POST', body: JSON.stringify(body) }),
  list: () => apiFetch<unknown[]>('/support'),
};

// ─── Helpers API ────────────────────────────────────────────────────────────

export interface HelperProfileData {
  id: string;
  userId: string;
  bio?: string | null;
  experienceYears?: number | null;
  hourlyRate?: number | null;
  rating: string;
  totalReviews: number;
  verificationStatus: string;
  isAvailable: boolean;
  services?: unknown[];
  availability?: unknown[];
  documents?: unknown[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    phone?: string | null;
  };
}

export interface UpdateHelperProfileRequest {
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  isAvailable?: boolean;
}

export interface HelperDocumentData {
  id: string;
  type: string;
  fileName: string;
  url: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: string;
  createdAt: string;
}

export interface ServiceRequestData {
  id: string;
  title: string;
  description?: string;
  suggestedPrice: number;
  suggestedPriceType: string;
  suggestedDuration?: number;
  status: string;
  adminNotes?: string;
  category: { id: string; name: string };
  helper: {
    user: { firstName: string; lastName: string; email: string; avatarUrl?: string };
  };
  createdAt: string;
}

export interface CreateServiceRequestPayload {
  categoryId: string;
  title: string;
  description?: string;
  suggestedPrice: number;
  suggestedPriceType: string;
  suggestedDuration?: number;
}

export const helpersApi = {
  list: (params?: { page?: number; limit?: number; categoryId?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.categoryId) q.set('categoryId', params.categoryId);
    return apiFetch<{ helpers: HelperProfileData[]; total: number }>(`/helpers?${q.toString()}`);
  },
  get: (id: string) => apiFetch<HelperProfileData>(`/helpers/${id}`),
  getProfile: () => apiFetch<HelperProfileData>('/helpers/profile'),
  updateProfile: (body: UpdateHelperProfileRequest) =>
    apiFetch<HelperProfileData>('/helpers/profile', { method: 'PUT', body: JSON.stringify(body) }),
  uploadDocument: (file: File, type: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    return apiFetch<HelperDocumentData>('/helpers/documents?type=' + encodeURIComponent(type), {
      method: 'POST',
      body: form,
    });
  },
  getMyServiceRequests: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<{ requests: ServiceRequestData[]; total: number; page: number; limit: number }>(`/services/requests?${q.toString()}`);
  },
  createServiceRequest: (body: CreateServiceRequestPayload) =>
    apiFetch<ServiceRequestData>('/services/requests', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Admin API ─────────────────────────────────────────────────────────────

export interface AdminStatsData {
  totalUsers: number;
  totalHelpers: number;
  totalBookings: number;
  totalRevenue: number;
  pendingVerifications: number;
}

export interface AdminUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AdminBookingData {
  id: string;
  status: string;
  totalAmount: number;
  bookingDate: string;
  scheduledAt?: string | null;
  service: { title: string };
  customer: { firstName: string; lastName: string; email: string };
  helper: { user: { firstName: string; lastName: string } };
  payment: { status: string; amount: number } | null;
  createdAt: string;
}

export interface AdminTicketData {
  id: string;
  title: string;
  status: string;
  priority: string;
  user: { firstName: string; lastName: string; email: string };
  createdAt: string;
}

export interface AdminServiceRequestData {
  id: string;
  title: string;
  description?: string;
  suggestedPrice: number;
  suggestedPriceType: string;
  status: string;
  adminNotes?: string;
  category: { id: string; name: string };
  helper: {
    user: { firstName: string; lastName: string; email: string; avatarUrl?: string };
  };
  createdAt: string;
}

export interface AdminCategoryData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  icon?: string;
}

export interface AdminHelperData {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateAdminServicePayload {
  title: string;
  description?: string;
  categoryId: string;
  helperId: string;
  price: number;
  priceType: string;
  duration?: number;
}

export interface VerifyHelperPayload {
  approved: boolean;
}

export interface ReviewServiceRequestPayload {
  approved: boolean;
  adminNotes?: string;
  title?: string;
  description?: string;
  price?: number;
  priceType?: string;
  duration?: number;
}

export const adminApi = {
  getStats: () => apiFetch<AdminStatsData>('/admin/stats'),
  getUsers: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<{ users: AdminUserData[]; total: number; page: number; limit: number }>(`/admin/users?${q.toString()}`);
  },
  getBookings: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<{ bookings: AdminBookingData[]; total: number; page: number; limit: number }>(`/admin/bookings?${q.toString()}`);
  },
  getTickets: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch<{ tickets: AdminTicketData[]; total: number; page: number; limit: number }>(`/admin/tickets?${q.toString()}`);
  },
  getServiceRequests: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    return apiFetch<{ requests: AdminServiceRequestData[]; total: number; page: number; limit: number }>(`/admin/service-requests?${q.toString()}`);
  },
  reviewServiceRequest: (id: string, body: ReviewServiceRequestPayload) =>
    apiFetch<unknown>(`/admin/service-requests/${id}/review`, { method: 'PUT', body: JSON.stringify(body) }),
  getCategories: () => apiFetch<AdminCategoryData[]>('/admin/categories'),
  createCategory: (body: CreateCategoryPayload) =>
    apiFetch<AdminCategoryData>('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: UpdateCategoryPayload) =>
    apiFetch<AdminCategoryData>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id: string) =>
    apiFetch<{ message: string }>(`/admin/categories/${id}`, { method: 'DELETE' }),
  createService: (body: CreateAdminServicePayload) =>
    apiFetch<ServiceData>('/admin/services', { method: 'POST', body: JSON.stringify(body) }),
  getHelpers: () => apiFetch<AdminHelperData[]>('/admin/helpers'),
  verifyHelper: (id: string, body: VerifyHelperPayload) =>
    apiFetch<{ id: string; verificationStatus: string }>(`/admin/helpers/${id}/verify`, { method: 'PUT', body: JSON.stringify(body) }),
};
