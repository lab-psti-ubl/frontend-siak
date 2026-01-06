import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { ERaport } from '../types';

// Global cache untuk semua instance hook
let globalERaportCache: Map<string, { data: ERaport | null; time: number }> = new Map();
let globalERaportLoadingPromises: Map<string, Promise<ERaport | null>> = new Map();

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

export const useERaport = (params?: { kelasId?: string; tahunAjaran?: string; semester?: number }) => {
  const [eraport, setERaport] = useState<ERaport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.kelasId || !params?.tahunAjaran || !params?.semester) {
      setERaport(null);
      setLoading(false);
      return;
    }

    // Create cache key from params
    const cacheKey = JSON.stringify(params);
    
    // Check cache validity
    const cached = globalERaportCache.get(cacheKey);
    const cacheValid = cached && (Date.now() - cached.time) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setERaport(cached.data);
      setLoading(false);
      return;
    }

    // If there's already a request in progress with same params, wait for it
    const existingPromise = globalERaportLoadingPromises.get(cacheKey);
    if (existingPromise) {
      existingPromise
        .then(data => {
          setERaport(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data E-Raport');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    const promise = (async () => {
      try {
        const response = await apiService.getERaport({
          kelasId: params.kelasId!,
          tahunAjaran: params.tahunAjaran!,
          semester: params.semester!,
        });
        if (response.success) {
          // Update cache
          globalERaportCache.set(cacheKey, {
            data: response.eraport || null,
            time: Date.now()
          });
          
          setERaport(response.eraport || null);
          setLoading(false);
          return response.eraport || null;
        } else {
          throw new Error(response.message || 'Gagal mengambil data E-Raport');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data E-Raport');
        console.error('Error fetching E-Raport:', err);
        setLoading(false);
        throw err;
      } finally {
        globalERaportLoadingPromises.delete(cacheKey);
      }
    })();

    globalERaportLoadingPromises.set(cacheKey, promise);
  }, [params?.kelasId, params?.tahunAjaran, params?.semester]);

  const refreshERaport = async (clearAllCaches = false) => {
    if (!params?.kelasId || !params?.tahunAjaran || !params?.semester) {
      return;
    }

    // Clear cache for this params and force refresh
    const cacheKey = JSON.stringify(params);
    
    if (clearAllCaches) {
      // Clear all caches when E-Raport is generated
      globalERaportCache.clear();
      globalERaportLoadingPromises.clear();
    } else {
      // Clear only this specific cache
      globalERaportCache.delete(cacheKey);
      globalERaportLoadingPromises.delete(cacheKey);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getERaport({
        kelasId: params.kelasId,
        tahunAjaran: params.tahunAjaran,
        semester: params.semester,
      });
      if (response.success) {
        globalERaportCache.set(cacheKey, {
          data: response.eraport || null,
          time: Date.now()
        });
        setERaport(response.eraport || null);
      } else {
        setError(response.message || 'Gagal mengambil data E-Raport');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data E-Raport');
      console.error('Error fetching E-Raport:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateERaport = async () => {
    if (!params?.kelasId || !params?.tahunAjaran || !params?.semester) {
      throw new Error('Parameter tidak lengkap');
    }

    try {
      const response = await apiService.generateERaport({
        kelasId: params.kelasId,
        tahunAjaran: params.tahunAjaran,
        semester: params.semester,
      });
      
      if (response.success) {
        // Clear cache and refresh
        await refreshERaport(true);
        return response;
      } else {
        throw new Error(response.message || 'Gagal generate E-Raport');
      }
    } catch (err: any) {
      throw err;
    }
  };

  return { eraport, loading, error, refreshERaport, generateERaport };
};

// Export function to refresh cache globally
export const refreshERaportCache = async () => {
  globalERaportCache.clear();
  globalERaportLoadingPromises.clear();
};

