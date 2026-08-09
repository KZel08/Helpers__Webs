import { useState, useEffect, useCallback } from 'react';
import { bookingsApi, BookingData } from '../lib/api';

export function useBookings(role: 'customer' | 'helper' = 'customer') {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bookingsApi.list(role);
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = useCallback(
    async (id: string) => {
      await bookingsApi.cancel(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b)),
      );
    },
    [],
  );

  return { bookings, isLoading, error, refetch: fetchBookings, cancelBooking };
}
