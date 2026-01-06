import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

// Cache for has given kenaikan kelas info flag
const flagCache = new Map<string, { hasGiven: boolean; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 2 minutes

export const useHasGivenKenaikanKelasInfo = (tahunAjaran?: string, semester?: number) => {
  const [hasGiven, setHasGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlag = useCallback(async (forceRefresh = false) => {
    if (!tahunAjaran || semester === undefined) {
      setHasGiven(false);
      return;
    }

    const cacheKey = `${tahunAjaran}-${semester}`;
    const now = Date.now();
    
    // Check cache
    if (!forceRefresh) {
      const cached = flagCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setHasGiven(cached.hasGiven);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getHasGivenKenaikanKelasInfo(tahunAjaran, semester);
      if (response.success && response.data) {
        const hasGivenValue = response.data.hasGiven || false;
        flagCache.set(cacheKey, { hasGiven: hasGivenValue, timestamp: now });
        setHasGiven(hasGivenValue);
      } else {
        setHasGiven(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flag');
      setHasGiven(false);
    } finally {
      setLoading(false);
    }
  }, [tahunAjaran, semester]);

  const setFlag = useCallback(async (hasGivenValue: boolean = true) => {
    if (!tahunAjaran || semester === undefined) return;

    try {
      const response = await apiService.setHasGivenKenaikanKelasInfo(tahunAjaran, semester, hasGivenValue);
      if (response.success) {
        const cacheKey = `${tahunAjaran}-${semester}`;
        flagCache.set(cacheKey, { hasGiven: hasGivenValue, timestamp: Date.now() });
        setHasGiven(hasGivenValue);
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [tahunAjaran, semester]);

  const deleteFlag = useCallback(async () => {
    if (!tahunAjaran || semester === undefined) return;

    try {
      const response = await apiService.deleteHasGivenKenaikanKelasInfo(tahunAjaran, semester);
      if (response.success) {
        const cacheKey = `${tahunAjaran}-${semester}`;
        flagCache.delete(cacheKey);
        setHasGiven(false);
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [tahunAjaran, semester]);

  useEffect(() => {
    fetchFlag();
  }, [fetchFlag]);

  return {
    hasGiven,
    loading,
    error,
    setFlag,
    deleteFlag,
    refreshFlag: () => fetchFlag(true)
  };
};

// Export function to clear all cache (useful when logging out)
export const clearHasGivenKenaikanKelasInfoCache = () => {
  flagCache.clear();
};

