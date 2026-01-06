import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { PengumumanKelulusan } from '../types';

// Cache for pengumuman kelulusan data
let pengumumanKelulusanCache: PengumumanKelulusan[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let refreshListeners: (() => void)[] = [];

export const usePengumumanKelulusan = () => {
  const [pengumumanKelulusan, setPengumumanKelulusan] = useState<PengumumanKelulusan[]>(pengumumanKelulusanCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPengumumanKelulusan = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Return cached data if still valid
    if (!forceRefresh && pengumumanKelulusanCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      setPengumumanKelulusan(pengumumanKelulusanCache);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getAllPengumumanKelulusan();
      if (response.success && response.data) {
        pengumumanKelulusanCache = response.data;
        cacheTimestamp = now;
        setPengumumanKelulusan(response.data);
        // Notify all listeners
        refreshListeners.forEach(listener => listener());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pengumuman kelulusan');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPengumumanKelulusan = useCallback(() => {
    return fetchPengumumanKelulusan(true);
  }, [fetchPengumumanKelulusan]);

  const createPengumumanKelulusan = useCallback(async (data: Omit<PengumumanKelulusan, 'id'>) => {
    try {
      const response = await apiService.createPengumumanKelulusan(data);
      if (response.success) {
        await refreshPengumumanKelulusan();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshPengumumanKelulusan]);

  const updatePengumumanKelulusan = useCallback(async (id: string, data: Partial<PengumumanKelulusan>) => {
    try {
      const response = await apiService.updatePengumumanKelulusan(id, data);
      if (response.success) {
        await refreshPengumumanKelulusan();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshPengumumanKelulusan]);

  const deletePengumumanKelulusan = useCallback(async (id: string) => {
    try {
      const response = await apiService.deletePengumumanKelulusan(id);
      if (response.success) {
        await refreshPengumumanKelulusan();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshPengumumanKelulusan]);

  const getActivePengumumanKelulusan = useCallback(async (tahunAjaran?: string) => {
    try {
      const response = await apiService.getActivePengumumanKelulusan(tahunAjaran);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching active pengumuman kelulusan:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchPengumumanKelulusan();
    
    const listener = () => {
      setPengumumanKelulusan([...pengumumanKelulusanCache]);
    };
    refreshListeners.push(listener);
    
    return () => {
      refreshListeners = refreshListeners.filter(l => l !== listener);
    };
  }, [fetchPengumumanKelulusan]);

  return {
    pengumumanKelulusan,
    loading,
    error,
    refreshPengumumanKelulusan,
    createPengumumanKelulusan,
    updatePengumumanKelulusan,
    deletePengumumanKelulusan,
    getActivePengumumanKelulusan
  };
};

// Export function to clear all cache (useful when logging out)
export const clearPengumumanKelulusanCache = () => {
  pengumumanKelulusanCache = [];
  cacheTimestamp = 0;
  refreshListeners = [];
};

