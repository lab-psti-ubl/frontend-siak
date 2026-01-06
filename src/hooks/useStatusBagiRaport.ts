import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { StatusBagiRaport } from '../types';

// Cache for status bagi raport data
let statusBagiRaportCache: StatusBagiRaport[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 5 minutes
let refreshListeners: (() => void)[] = [];

export const useStatusBagiRaport = () => {
  const [statusBagiRaport, setStatusBagiRaport] = useState<StatusBagiRaport[]>(statusBagiRaportCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatusBagiRaport = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Return cached data if still valid
    if (!forceRefresh && statusBagiRaportCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      setStatusBagiRaport(statusBagiRaportCache);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getAllStatusBagiRaport();
      if (response.success && response.data) {
        statusBagiRaportCache = response.data;
        cacheTimestamp = now;
        setStatusBagiRaport(response.data);
        // Notify all listeners
        refreshListeners.forEach(listener => listener());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status bagi raport');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStatusBagiRaport = useCallback(() => {
    return fetchStatusBagiRaport(true);
  }, [fetchStatusBagiRaport]);

  const updateStatusBagiRaport = useCallback(async (id: string, data: Partial<StatusBagiRaport>) => {
    try {
      const response = await apiService.updateStatusBagiRaport(id, data);
      if (response.success) {
        await refreshStatusBagiRaport();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshStatusBagiRaport]);

  const createStatusBagiRaport = useCallback(async (data: Omit<StatusBagiRaport, 'id'>) => {
    try {
      const response = await apiService.createStatusBagiRaport(data);
      if (response.success) {
        await refreshStatusBagiRaport();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshStatusBagiRaport]);

  useEffect(() => {
    fetchStatusBagiRaport();
    
    const listener = () => {
      setStatusBagiRaport([...statusBagiRaportCache]);
    };
    refreshListeners.push(listener);
    
    return () => {
      refreshListeners = refreshListeners.filter(l => l !== listener);
    };
  }, [fetchStatusBagiRaport]);

  return {
    statusBagiRaport,
    loading,
    error,
    refreshStatusBagiRaport,
    updateStatusBagiRaport,
    createStatusBagiRaport
  };
};

// Export function to clear all cache (useful when logging out)
export const clearStatusBagiRaportCache = () => {
  statusBagiRaportCache = [];
  cacheTimestamp = 0;
  refreshListeners = [];
};
