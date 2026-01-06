import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { SesiAbsensi } from '../types';

// Global cache untuk semua instance hook
let globalSesiAbsensiCache: SesiAbsensi[] | null = null;
let globalSesiAbsensiCacheTime: number = 0;
let globalSesiAbsensiLoadingPromise: Promise<SesiAbsensi[]> | null = null;

const CACHE_DURATION = 2000000; // 5 menit (300000 ms) - shorter cache for session data

interface SesiAbsensiParams {
  tanggal?: string;
  jadwalId?: string;
  createdBy?: string;
}

export const useSesiAbsensi = (params?: SesiAbsensiParams) => {
  const [sesiAbsensi, setSesiAbsensi] = useState<SesiAbsensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // Check if has filters
    const hasFilters = params?.tanggal || params?.jadwalId || params?.createdBy;
    
    // Check cache validity (only for getAll, not for filtered queries)
    const cacheValid = globalSesiAbsensiCache && 
                      !hasFilters &&
                      (Date.now() - globalSesiAbsensiCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data only for getAll
      setSesiAbsensi(globalSesiAbsensiCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it (only for getAll)
    if (globalSesiAbsensiLoadingPromise && !hasFilters) {
      globalSesiAbsensiLoadingPromise
        .then(data => {
          setSesiAbsensi(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi');
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
          response = await apiService.getSesiAbsensiByTanggal(params?.tanggal, params?.jadwalId, params?.createdBy);
        } else {
          // Fetch all
          if (!globalSesiAbsensiLoadingPromise) {
            globalSesiAbsensiLoadingPromise = (async () => {
              const resp = await apiService.getAllSesiAbsensi();
              if (resp.success && resp.sesiAbsensi) {
                globalSesiAbsensiCache = resp.sesiAbsensi;
                globalSesiAbsensiCacheTime = Date.now();
                return resp.sesiAbsensi;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data sesi absensi');
              }
            })();
          }
          const data = await globalSesiAbsensiLoadingPromise;
          globalSesiAbsensiLoadingPromise = null;
          setSesiAbsensi(data);
          setLoading(false);
          return;
        }

        if (response.success && response.sesiAbsensi) {
          setSesiAbsensi(response.sesiAbsensi);
          setLoading(false);
        } else {
          throw new Error(response.message || 'Gagal mengambil data sesi absensi');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi');
        console.error('Error fetching sesi absensi:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.tanggal, params?.jadwalId, params?.createdBy]);

  const refreshSesiAbsensi = async () => {
    // Clear cache and force refresh
    globalSesiAbsensiCache = null;
    globalSesiAbsensiCacheTime = 0;
    globalSesiAbsensiLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      const hasFilters = params?.tanggal || params?.jadwalId || params?.createdBy;
      if (hasFilters) {
        response = await apiService.getSesiAbsensiByTanggal(params?.tanggal, params?.jadwalId, params?.createdBy);
      } else {
        response = await apiService.getAllSesiAbsensi();
      }
      
      if (response.success && response.sesiAbsensi) {
        if (!params?.tanggal) {
          globalSesiAbsensiCache = response.sesiAbsensi;
          globalSesiAbsensiCacheTime = Date.now();
        }
        setSesiAbsensi(response.sesiAbsensi);
      } else {
        setError(response.message || 'Gagal mengambil data sesi absensi');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data sesi absensi');
      console.error('Error fetching sesi absensi:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSesiAbsensi = async (data: Partial<SesiAbsensi>) => {
    try {
      const response = await apiService.createSesiAbsensi(data);
      if (response.success && response.sesiAbsensi) {
        // Invalidate cache immediately
        globalSesiAbsensiCache = null;
        globalSesiAbsensiCacheTime = 0;
        globalSesiAbsensiLoadingPromise = null;
        
        // Immediately update state with new session
        setSesiAbsensi(prev => {
          // Check if session already exists
          const exists = prev.some(s => s.id === response.sesiAbsensi?.id);
          if (exists) {
            return prev.map(s => s.id === response.sesiAbsensi?.id ? response.sesiAbsensi : s);
          }
          return [...prev, response.sesiAbsensi];
        });
        
        return response.sesiAbsensi;
      } else {
        throw new Error(response.message || 'Gagal membuat sesi absensi');
      }
    } catch (err: any) {
      console.error('Error creating sesi absensi:', err);
      throw err;
    }
  };

  const updateSesiAbsensi = async (id: string, data: Partial<SesiAbsensi>) => {
    try {
      const response = await apiService.updateSesiAbsensi(id, data);
      if (response.success && response.sesiAbsensi) {
        // Invalidate cache
        globalSesiAbsensiCache = null;
        globalSesiAbsensiCacheTime = 0;
        globalSesiAbsensiLoadingPromise = null;
        
        // Immediately update state with updated session
        setSesiAbsensi(prev => 
          prev.map(s => s.id === id ? response.sesiAbsensi : s)
        );
        
        return response.sesiAbsensi;
      } else {
        throw new Error(response.message || 'Gagal memperbarui sesi absensi');
      }
    } catch (err: any) {
      console.error('Error updating sesi absensi:', err);
      throw err;
    }
  };

  return { sesiAbsensi, loading, error, refreshSesiAbsensi, createSesiAbsensi, updateSesiAbsensi };
};

// Export function to clear all cache (useful when logging out)
export const clearSesiAbsensiCache = () => {
  globalSesiAbsensiCache = null;
  globalSesiAbsensiCacheTime = 0;
  globalSesiAbsensiLoadingPromise = null;
};

