import { useCallback, useEffect, useState } from 'react';
import { helpersApi, ServiceRequestData, CreateServiceRequestPayload } from '../lib/api';

export function useHelperServiceRequests(page: number, limit: number) {
  const [requests, setRequests] = useState<ServiceRequestData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await helpersApi.getMyServiceRequests({ page, limit });
      setRequests(res.requests);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service requests');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = useCallback(async (body: CreateServiceRequestPayload) => {
    const created = await helpersApi.createServiceRequest(body);
    setRequests((prev) => [created, ...prev]);
    setTotal((t) => t + 1);
    return created;
  }, []);

  return { requests, total, isLoading, error, refetch: fetch, create };
}
