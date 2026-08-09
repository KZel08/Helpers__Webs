import { useState, useEffect, useCallback } from 'react';
import { servicesApi, ServiceData } from '../lib/api';

export function useServices(params?: {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
}) {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await servicesApi.list(params);
      setServices(res.services);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  }, [params?.page, params?.limit, params?.categoryId, params?.search]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return { services, total, isLoading, error, refetch: fetchServices };
}

export function useService(id: string) {
  const [service, setService] = useState<ServiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    servicesApi
      .get(id)
      .then(setService)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { service, isLoading, error };
}
