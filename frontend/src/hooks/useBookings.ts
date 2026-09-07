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
      // Backend cancels via soft delete: sets status=CANCELLED and deletedAt.
      // The list endpoint filters by deletedAt=null, so after a successful
      // cancel the booking should disappear. We do NOT mutate the booking
      // optimistically. Instead, refetch to sync with the backend.
      try {
        await bookingsApi.cancel(id);
      } catch (err) {
        // Rethrow so callers can surface the error and the booking remains
        // visible in the UI.
        throw err;
      }
      await fetchBookings();
    },
    [fetchBookings],
  );

  return { bookings, isLoading, error, refetch: fetchBookings, cancelBooking };
}
