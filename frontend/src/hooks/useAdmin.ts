import { useCallback, useEffect, useState } from 'react';
import {
  adminApi,
  AdminStatsData,
  AdminUserData,
  AdminBookingData,
  AdminServiceRequestData,
  AdminCategoryData,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  ReviewServiceRequestPayload,
} from '../lib/api';

// ─── Stats ────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStats(await adminApi.getStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

// ─── Users (paginated) ───────────────────────────────────────────────────────

export function useAdminUsers(page: number, limit: number) {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers({ page, limit });
      setUsers(res.users);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, total, isLoading, error, refetch: fetchUsers };
}

// ─── Bookings (paginated) ────────────────────────────────────────────────────

export function useAdminBookings(page: number, limit: number) {
  const [bookings, setBookings] = useState<AdminBookingData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getBookings({ page, limit });
      setBookings(res.bookings);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, total, isLoading, error, refetch: fetchBookings };
}

// ─── Service requests (paginated) ────────────────────────────────────────────

export function useAdminServiceRequests(page: number, limit: number, status?: string) {
  const [requests, setRequests] = useState<AdminServiceRequestData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getServiceRequests({ page, limit, status });
      setRequests(res.requests);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service requests');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const review = useCallback(
    async (id: string, body: ReviewServiceRequestPayload) => {
      await adminApi.reviewServiceRequest(id, body);
      if (status !== 'PENDING' && body.approved) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setTotal((t) => (t > 0 ? t - 1 : 0));
      } else {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: body.approved ? 'APPROVED' : 'REJECTED', adminNotes: body.adminNotes ?? r.adminNotes }
              : r,
          ),
        );
      }
    },
    [status],
  );

  return { requests, total, isLoading, error, refetch: fetchRequests, review };
}

// ─── Categories (with CRUD) ──────────────────────────────────────────────────

export function useAdminCategories() {
  const [categories, setCategories] = useState<AdminCategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCategories(await adminApi.getCategories());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = useCallback(async (body: CreateCategoryPayload) => {
    const created = await adminApi.createCategory(body);
    setCategories((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, body: UpdateCategoryPayload) => {
    const updated = await adminApi.updateCategory(id, body);
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await adminApi.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, isLoading, error, refetch: fetch, create, update, remove };
}
