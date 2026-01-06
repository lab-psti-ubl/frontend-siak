import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { RiwayatWaliKelas } from '../types';

// Cache for riwayat wali kelas data
let riwayatWaliKelasCache: RiwayatWaliKelas[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 5 minutes
let refreshListeners: (() => void)[] = [];

export const useRiwayatWaliKelasData = () => {
  const [riwayatWaliKelas, setRiwayatWaliKelas] = useState<RiwayatWaliKelas[]>(riwayatWaliKelasCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiwayatWaliKelas = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Return cached data if still valid
    if (!forceRefresh && riwayatWaliKelasCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      setRiwayatWaliKelas(riwayatWaliKelasCache);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getAllRiwayatWaliKelas();
      if (response.success && response.data) {
        riwayatWaliKelasCache = response.data;
        cacheTimestamp = now;
        setRiwayatWaliKelas(response.data);
        // Notify all listeners
        refreshListeners.forEach(listener => listener());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch riwayat wali kelas');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRiwayatWaliKelas = useCallback(() => {
    return fetchRiwayatWaliKelas(true);
  }, [fetchRiwayatWaliKelas]);

  const createRiwayatWaliKelas = useCallback(async (data: Omit<RiwayatWaliKelas, 'id'>) => {
    try {
      const response = await apiService.createRiwayatWaliKelas(data);
      if (response.success) {
        await refreshRiwayatWaliKelas();
        return response;
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [refreshRiwayatWaliKelas]);

  useEffect(() => {
    fetchRiwayatWaliKelas();
    
    const listener = () => {
      setRiwayatWaliKelas([...riwayatWaliKelasCache]);
    };
    refreshListeners.push(listener);
    
    return () => {
      refreshListeners = refreshListeners.filter(l => l !== listener);
    };
  }, [fetchRiwayatWaliKelas]);

  return {
    riwayatWaliKelas,
    loading,
    error,
    refreshRiwayatWaliKelas,
    createRiwayatWaliKelas
  };
};

// Export function to clear all cache (useful when logging out)
export const clearRiwayatWaliKelasCache = () => {
  riwayatWaliKelasCache = [];
  cacheTimestamp = 0;
  refreshListeners = [];
};
