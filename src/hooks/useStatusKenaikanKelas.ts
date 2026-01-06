import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { StatusKenaikanKelas } from '../types';

// Cache for status kenaikan kelas data
let statusKenaikanKelasCache: StatusKenaikanKelas[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 5 minutes
let refreshListeners: (() => void)[] = [];

export const useStatusKenaikanKelas = () => {
  const [statusKenaikanKelas, setStatusKenaikanKelas] = useState<StatusKenaikanKelas[]>(statusKenaikanKelasCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatusKenaikanKelas = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Return cached data if still valid
    if (!forceRefresh && statusKenaikanKelasCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      setStatusKenaikanKelas(statusKenaikanKelasCache);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getAllStatusKenaikanKelas();
      if (response.success && response.data) {
        statusKenaikanKelasCache = response.data;
        cacheTimestamp = now;
        setStatusKenaikanKelas(response.data);
        // Notify all listeners
        refreshListeners.forEach(listener => listener());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status kenaikan kelas');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStatusKenaikanKelas = useCallback(() => {
    return fetchStatusKenaikanKelas(true);
  }, [fetchStatusKenaikanKelas]);

  const updateStatusKenaikanKelas = useCallback(async (id: string, data: Partial<StatusKenaikanKelas>) => {
    try {
      const response = await apiService.updateStatusKenaikanKelas(id, data);
      if (response.success) {
        await refreshStatusKenaikanKelas();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshStatusKenaikanKelas]);

  const createStatusKenaikanKelas = useCallback(async (data: Omit<StatusKenaikanKelas, 'id'>) => {
    try {
      const response = await apiService.createStatusKenaikanKelas(data);
      if (response.success) {
        await refreshStatusKenaikanKelas();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshStatusKenaikanKelas]);

  useEffect(() => {
    fetchStatusKenaikanKelas();
    
    const listener = () => {
      setStatusKenaikanKelas([...statusKenaikanKelasCache]);
    };
    refreshListeners.push(listener);
    
    return () => {
      refreshListeners = refreshListeners.filter(l => l !== listener);
    };
  }, [fetchStatusKenaikanKelas]);

  return {
    statusKenaikanKelas,
    loading,
    error,
    refreshStatusKenaikanKelas,
    updateStatusKenaikanKelas,
    createStatusKenaikanKelas
  };
};

// Export function to clear all cache (useful when logging out)
export const clearStatusKenaikanKelasCache = () => {
  statusKenaikanKelasCache = [];
  cacheTimestamp = 0;
  refreshListeners = [];
};
