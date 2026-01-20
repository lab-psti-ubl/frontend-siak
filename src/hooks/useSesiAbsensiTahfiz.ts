import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { SesiAbsensiTahfiz } from '../types';

// Global cache untuk semua instance hook
let globalSesiAbsensiTahfizCache: SesiAbsensiTahfiz[] | null = null;
let globalSesiAbsensiTahfizCacheTime: number = 0;
let globalSesiAbsensiTahfizLoadingPromise: Promise<SesiAbsensiTahfiz[]> | null = null;

const CACHE_DURATION = 2000000; // 5 menit (300000 ms) - shorter cache for session data

interface SesiAbsensiTahfizParams {
  tanggal?: string;
  jadwalId?: string;
  createdBy?: string;
}

export const useSesiAbsensiTahfiz = (params?: SesiAbsensiTahfizParams) => {
  const [sesiAbsensiTahfiz, setSesiAbsensiTahfiz] = useState<SesiAbsensiTahfiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // Check if has filters
    const hasFilters = params?.tanggal || params?.jadwalId || params?.createdBy;
    
    // Check cache validity (only for getAll, not for filtered queries)
    const cacheValid = globalSesiAbsensiTahfizCache && 
                      !hasFilters &&
                      (Date.now() - globalSesiAbsensiTahfizCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data only for getAll
      setSesiAbsensiTahfiz(globalSesiAbsensiTahfizCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it (only for getAll)
    if (globalSesiAbsensiTahfizLoadingPromise && !hasFilters) {
      globalSesiAbsensiTahfizLoadingPromise
        .then(data => {
          setSesiAbsensiTahfiz(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi tahfiz');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        let response;
        if (hasFilters) {
          // Fetch with filters
          response = await apiService.getSesiAbsensiTahfizByTanggal(params?.tanggal, params?.jadwalId, params?.createdBy);
        } else {
          // Fetch all
          if (!globalSesiAbsensiTahfizLoadingPromise) {
            globalSesiAbsensiTahfizLoadingPromise = (async () => {
              const resp = await apiService.getAllSesiAbsensiTahfiz();
              if (resp.success && resp.sesiAbsensiTahfiz) {
                globalSesiAbsensiTahfizCache = resp.sesiAbsensiTahfiz;
                globalSesiAbsensiTahfizCacheTime = Date.now();
                return resp.sesiAbsensiTahfiz;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data sesi absensi tahfiz');
              }
            })();
          }
          const data = await globalSesiAbsensiTahfizLoadingPromise;
          globalSesiAbsensiTahfizLoadingPromise = null;
          setSesiAbsensiTahfiz(data);
          setLoading(false);
          return;
        }

        if (response.success && response.sesiAbsensiTahfiz) {
          setSesiAbsensiTahfiz(response.sesiAbsensiTahfiz);
          setLoading(false);
        } else {
          throw new Error(response.message || 'Gagal mengambil data sesi absensi tahfiz');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi tahfiz');
        console.error('Error fetching sesi absensi tahfiz:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.tanggal, params?.jadwalId, params?.createdBy]);

  const refreshSesiAbsensiTahfiz = async () => {
    // Clear cache and force refresh
    globalSesiAbsensiTahfizCache = null;
    globalSesiAbsensiTahfizCacheTime = 0;
    globalSesiAbsensiTahfizLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      const hasFilters = params?.tanggal || params?.jadwalId || params?.createdBy;
      if (hasFilters) {
        response = await apiService.getSesiAbsensiTahfizByTanggal(params?.tanggal, params?.jadwalId, params?.createdBy);
      } else {
        response = await apiService.getAllSesiAbsensiTahfiz();
      }
      
      if (response.success && response.sesiAbsensiTahfiz) {
        if (!params?.tanggal) {
          globalSesiAbsensiTahfizCache = response.sesiAbsensiTahfiz;
          globalSesiAbsensiTahfizCacheTime = Date.now();
        }
        setSesiAbsensiTahfiz(response.sesiAbsensiTahfiz);
      } else {
        setError(response.message || 'Gagal mengambil data sesi absensi tahfiz');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi tahfiz');
      console.error('Error fetching sesi absensi tahfiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSesiAbsensiTahfiz = async (data: Partial<SesiAbsensiTahfiz>) => {
    try {
      const response = await apiService.createSesiAbsensiTahfiz(data);
      if (response.success && response.sesiAbsensiTahfiz) {
        // Invalidate cache immediately
        globalSesiAbsensiTahfizCache = null;
        globalSesiAbsensiTahfizCacheTime = 0;
        globalSesiAbsensiTahfizLoadingPromise = null;
        
        // Immediately update state with new session
        setSesiAbsensiTahfiz(prev => {
          // Check if session already exists
          const exists = prev.some(s => s.id === response.sesiAbsensiTahfiz?.id);
          if (exists) {
            return prev.map(s => s.id === response.sesiAbsensiTahfiz?.id ? response.sesiAbsensiTahfiz : s);
          }
          return [...prev, response.sesiAbsensiTahfiz];
        });
        
        return response.sesiAbsensiTahfiz;
      } else {
        throw new Error(response.message || 'Gagal membuat sesi absensi tahfiz');
      }
    } catch (err: any) {
      console.error('Error creating sesi absensi tahfiz:', err);
      throw err;
    }
  };

  const updateSesiAbsensiTahfiz = async (id: string, data: Partial<SesiAbsensiTahfiz>) => {
    try {
      const response = await apiService.updateSesiAbsensiTahfiz(id, data);
      if (response.success && response.sesiAbsensiTahfiz) {
        // Invalidate cache
        globalSesiAbsensiTahfizCache = null;
        globalSesiAbsensiTahfizCacheTime = 0;
        globalSesiAbsensiTahfizLoadingPromise = null;
        
        // Immediately update state with updated session
        setSesiAbsensiTahfiz(prev => 
          prev.map(s => s.id === id ? response.sesiAbsensiTahfiz : s)
        );
        
        return response.sesiAbsensiTahfiz;
      } else {
        throw new Error(response.message || 'Gagal memperbarui sesi absensi tahfiz');
      }
    } catch (err: any) {
      console.error('Error updating sesi absensi tahfiz:', err);
      throw err;
    }
  };

  return { sesiAbsensiTahfiz, loading, error, refreshSesiAbsensiTahfiz, createSesiAbsensiTahfiz, updateSesiAbsensiTahfiz };
};

// Export function to clear all cache (useful when logging out)
export const clearSesiAbsensiTahfizCache = () => {
  globalSesiAbsensiTahfizCache = null;
  globalSesiAbsensiTahfizCacheTime = 0;
  globalSesiAbsensiTahfizLoadingPromise = null;
};

