import { useCallback, useEffect, useState } from 'react';
import { usersApi, AddressData, CreateAddressRequest, UpdateAddressRequest } from '../lib/api';

export function useAddresses() {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await usersApi.listAddresses();
      setAddresses(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createAddress = useCallback(async (body: CreateAddressRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const created = await usersApi.createAddress(body);
      setAddresses((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create address');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAddress = useCallback(async (id: string, body: UpdateAddressRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await usersApi.updateAddress(id, body);
      setAddresses((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update address');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAddress = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await usersApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { addresses, isLoading, error, refetch: fetch, createAddress, updateAddress, deleteAddress } as const;
}
