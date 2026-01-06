import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { InfoSekolah } from '../types';

// Cache for info sekolah data
let infoSekolahCache: InfoSekolah[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let refreshListeners: (() => void)[] = [];

export const useInfoSekolah = () => {
  const [infoSekolah, setInfoSekolah] = useState<InfoSekolah[]>(infoSekolahCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfoSekolah = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Return cached data if still valid
    if (!forceRefresh && infoSekolahCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      setInfoSekolah(infoSekolahCache);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getAllInfoSekolah();
      if (response.success && response.data) {
        infoSekolahCache = response.data;
        cacheTimestamp = now;
        setInfoSekolah(response.data);
        // Notify all listeners
        refreshListeners.forEach(listener => listener());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch info sekolah');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshInfoSekolah = useCallback(() => {
    return fetchInfoSekolah(true);
  }, [fetchInfoSekolah]);

  const createInfoSekolah = useCallback(async (data: Omit<InfoSekolah, 'id'>) => {
    try {
      const response = await apiService.createInfoSekolah(data);
      if (response.success) {
        await refreshInfoSekolah();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshInfoSekolah]);

  const updateInfoSekolah = useCallback(async (id: string, data: Partial<InfoSekolah>) => {
    try {
      const response = await apiService.updateInfoSekolah(id, data);
      if (response.success) {
        await refreshInfoSekolah();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshInfoSekolah]);

  const deleteInfoSekolah = useCallback(async (id: string) => {
    try {
      const response = await apiService.deleteInfoSekolah(id);
      if (response.success) {
        await refreshInfoSekolah();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshInfoSekolah]);

  useEffect(() => {
    fetchInfoSekolah();
    
    const listener = () => {
      setInfoSekolah([...infoSekolahCache]);
    };
    refreshListeners.push(listener);
    
    return () => {
      refreshListeners = refreshListeners.filter(l => l !== listener);
    };
  }, [fetchInfoSekolah]);

  return {
    infoSekolah,
    loading,
    error,
    refreshInfoSekolah,
    createInfoSekolah,
    updateInfoSekolah,
    deleteInfoSekolah
  };
};

// Export function to clear all cache (useful when logging out)
export const clearInfoSekolahCache = () => {
  infoSekolahCache = [];
  cacheTimestamp = 0;
  refreshListeners = [];
};

