import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { CBTKelas } from '../types';

// Global cache untuk semua instance hook
let globalCBTKelasCache: CBTKelas[] | null = null;
let globalCBTKelasCacheTime = 0;
let globalCBTKelasCacheKey: string | null = null;
let globalCBTKelasLoadingPromise: Promise<CBTKelas[]> | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

export interface UseCBTKelasParams {
  guruId?: string;
  tingkat?: number;
  mataPelajaranId?: string;
  semester?: number;
  tahunAjaran?: string;
}

export const useCBTKelas = (params: UseCBTKelasParams = {}) => {
  const [cbtKelas, setCBTKelas] = useState<CBTKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCBTKelas = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = JSON.stringify(params || {});
      const cacheValid =
        !forceRefresh &&
        globalCBTKelasCache &&
        globalCBTKelasCacheKey === cacheKey &&
        Date.now() - globalCBTKelasCacheTime < CACHE_DURATION;

      if (cacheValid) {
        setCBTKelas(globalCBTKelasCache);
        setLoading(false);
        return;
      }

      if (globalCBTKelasLoadingPromise && !forceRefresh && globalCBTKelasCacheKey === cacheKey) {
        try {
          const data = await globalCBTKelasLoadingPromise;
          setCBTKelas(data);
          setLoading(false);
        } catch (err: any) {
          setError(err.message || 'Terjadi kesalahan saat mengambil data kelas CBT');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      globalCBTKelasLoadingPromise = (async () => {
        try {
          const response = await apiService.getAllCBTKelas(params);
          if (response.success && response.data) {
            globalCBTKelasCache = response.data as CBTKelas[];
            globalCBTKelasCacheTime = Date.now();
            globalCBTKelasCacheKey = cacheKey;
            return response.data as CBTKelas[];
          }
          throw new Error(response.message || 'Gagal mengambil data kelas CBT');
        } finally {
          globalCBTKelasLoadingPromise = null;
        }
      })();

      try {
        const data = await globalCBTKelasLoadingPromise;
        setCBTKelas(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data kelas CBT');
        setLoading(false);
      }
    },
    [params.guruId, params.tingkat, params.mataPelajaranId, params.semester, params.tahunAjaran]
  );

  useEffect(() => {
    fetchCBTKelas();
  }, [fetchCBTKelas]);

  const refreshCBTKelas = useCallback(async () => {
    globalCBTKelasCache = null;
    globalCBTKelasCacheKey = null;
    globalCBTKelasCacheTime = 0;
    globalCBTKelasLoadingPromise = null;
    await fetchCBTKelas(true);
  }, [fetchCBTKelas]);

  const setCBTKelasLocal = (updater: CBTKelas[] | ((prev: CBTKelas[]) => CBTKelas[])) => {
    if (typeof updater === 'function') {
      setCBTKelas(updater);
      if (globalCBTKelasCache) {
        globalCBTKelasCache = updater(globalCBTKelasCache);
      }
    } else {
      setCBTKelas(updater);
      globalCBTKelasCache = updater;
    }
  };

  return {
    cbtKelas,
    setCBTKelas: setCBTKelasLocal,
    loading,
    error,
    refreshCBTKelas,
  };
};

export const clearCBTKelasCache = () => {
  globalCBTKelasCache = null;
  globalCBTKelasCacheKey = null;
  globalCBTKelasCacheTime = 0;
  globalCBTKelasLoadingPromise = null;
};

