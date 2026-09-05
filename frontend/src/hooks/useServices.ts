import { useState, useEffect, useCallback, useRef } from 'react';
import { servicesApi, ServiceData } from '../lib/api';

export function useServices(params?: {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
}) {
  const page = params?.page ?? 1;
  const requestIdRef = useRef(0);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await servicesApi.list(params);
      if (currentRequestId !== requestIdRef.current) return;

      // Defensive: backend may return either { services, total } or a raw array.
      const servicesList = Array.isArray(res)
        ? (res as unknown as ServiceData[])
        : (res?.services ?? []);
      const totalCount = Array.isArray(res)
        ? (res as unknown as ServiceData[]).length
        : (res?.total ?? 0);

      setServices((prev) => {
        if (page <= 1) return servicesList;

        const merged = [...prev, ...servicesList];
        const unique = new Map<string, ServiceData>();

        merged.forEach((service) => unique.set(service.id, service));
        return Array.from(unique.values());
      });
      setTotal(totalCount);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [page, params?.limit, params?.categoryId, params?.search]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, total, isLoading, error, refetch: fetchServices };
}

export function useService(id: string) {
  const [service, setService] = useState<ServiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchService = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await servicesApi.get(id);
      setService(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load service'
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Clear any stale service data when the id changes, then fetch.
    setService(null);
    if (!id) {
      setIsLoading(false);
      return;
    }
    fetchService();
  }, [fetchService]);

  return { service, isLoading, error, refetch: fetchService };
}
