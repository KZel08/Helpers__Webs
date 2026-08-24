import { useCallback, useEffect, useState } from 'react';
import {
  helpersApi,
  HelperProfileData,
  UpdateHelperProfileRequest,
} from '../lib/api';

/**
 * Loads the authenticated helper's own profile (GET /helpers/profile) and
 * exposes a mutation to update the editable fields supported by the backend
 * (bio, experienceYears, hourlyRate, isAvailable).
 *
 * The profile identity is resolved server-side from the JWT (HelperGuard),
 * so no client-side user/sub is required.
 */
export function useHelperProfile() {
  const [profile, setProfile] = useState<HelperProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setProfile(await helpersApi.getProfile());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load helper profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const update = useCallback(async (body: UpdateHelperProfileRequest) => {
    const updated = await helpersApi.updateProfile(body);
    setProfile(updated);
    return updated;
  }, []);

  return { profile, isLoading, error, refetch: fetchProfile, update };
}
