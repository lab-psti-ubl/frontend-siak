import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { CBTBankSoal } from '../types';

// Global cache untuk semua instance hook
let globalCBTBankSoalCache: CBTBankSoal[] | null = null;
let globalCBTBankSoalCacheTime = 0;
let globalCBTBankSoalCacheKey: string | null = null;
let globalCBTBankSoalLoadingPromise: Promise<CBTBankSoal[]> | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

export interface UseCBTBankSoalParams {
  cbtKelasId?: string;
  guruId?: string;
  tipe?: string;
  includeGlobal?: boolean;
}

export const useCBTBankSoal = (params: UseCBTBankSoalParams = {}) => {
  const [bankSoal, setBankSoal] = useState<CBTBankSoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankSoal = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = JSON.stringify(params || {});
      const cacheValid =
        !forceRefresh &&
        globalCBTBankSoalCache &&
        globalCBTBankSoalCacheKey === cacheKey &&
        Date.now() - globalCBTBankSoalCacheTime < CACHE_DURATION;

      if (cacheValid) {
        setBankSoal(globalCBTBankSoalCache);
        setLoading(false);
        return;
      }

      if (
        globalCBTBankSoalLoadingPromise &&
        !forceRefresh &&
        globalCBTBankSoalCacheKey === cacheKey
      ) {
        try {
          const data = await globalCBTBankSoalLoadingPromise;
          setBankSoal(data);
          setLoading(false);
        } catch (err: any) {
          setError(err.message || 'Terjadi kesalahan saat mengambil data bank soal CBT');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      globalCBTBankSoalLoadingPromise = (async () => {
        try {
          const response = await apiService.getAllCBTBankSoal(params);
          if (response.success && response.data) {
            globalCBTBankSoalCache = response.data as CBTBankSoal[];
            globalCBTBankSoalCacheTime = Date.now();
            globalCBTBankSoalCacheKey = cacheKey;
            return response.data as CBTBankSoal[];
          }
          throw new Error(response.message || 'Gagal mengambil data bank soal CBT');
        } finally {
          globalCBTBankSoalLoadingPromise = null;
        }
      })();

      try {
        const data = await globalCBTBankSoalLoadingPromise;
        setBankSoal(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data bank soal CBT');
        setLoading(false);
      }
    },
    [params.cbtKelasId, params.guruId, params.tipe, params.includeGlobal]
  );

  useEffect(() => {
    fetchBankSoal();
  }, [fetchBankSoal]);

  const refreshBankSoal = useCallback(async () => {
    globalCBTBankSoalCache = null;
    globalCBTBankSoalCacheKey = null;
    globalCBTBankSoalCacheTime = 0;
    globalCBTBankSoalLoadingPromise = null;
    await fetchBankSoal(true);
  }, [fetchBankSoal]);

  const setBankSoalLocal = (
    updater: CBTBankSoal[] | ((prev: CBTBankSoal[]) => CBTBankSoal[])
  ) => {
    if (typeof updater === 'function') {
      setBankSoal(updater);
      if (globalCBTBankSoalCache) {
        globalCBTBankSoalCache = updater(globalCBTBankSoalCache);
      }
    } else {
      setBankSoal(updater);
      globalCBTBankSoalCache = updater;
    }
  };

  return {
    bankSoal,
    setBankSoal: setBankSoalLocal,
    loading,
    error,
    refreshBankSoal,
  };
};

export const clearCBTBankSoalCache = () => {
  globalCBTBankSoalCache = null;
  globalCBTBankSoalCacheKey = null;
  globalCBTBankSoalCacheTime = 0;
  globalCBTBankSoalLoadingPromise = null;
};

