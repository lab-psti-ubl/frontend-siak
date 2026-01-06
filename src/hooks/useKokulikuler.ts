import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Kokulikuler } from '../types';

// Global cache untuk semua instance hook
let globalKokulikulerCache: Map<string, { data: Kokulikuler | null; time: number }> = new Map();
let globalKokulikulerLoadingPromises: Map<string, Promise<Kokulikuler | null>> = new Map();

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

export const useKokulikuler = (params?: { kelasId?: string; tahunAjaran?: string; semester?: number }) => {
  const [kokulikuler, setKokulikuler] = useState<Kokulikuler | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.kelasId || !params?.tahunAjaran || !params?.semester) {
      setKokulikuler(null);
      setLoading(false);
      return;
    }

    // Create cache key from params
    const cacheKey = JSON.stringify(params);
    
    // Check cache validity
    const cached = globalKokulikulerCache.get(cacheKey);
    const cacheValid = cached && (Date.now() - cached.time) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setKokulikuler(cached.data);
      setLoading(false);
      return;
    }

    // If there's already a request in progress with same params, wait for it
    const existingPromise = globalKokulikulerLoadingPromises.get(cacheKey);
    if (existingPromise) {
      existingPromise
        .then(data => {
          setKokulikuler(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data kokulikuler');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    const promise = (async () => {
      try {
        const response = await apiService.getKokulikuler({
          kelasId: params.kelasId!,
          tahunAjaran: params.tahunAjaran!,
          semester: params.semester!,
        });
        if (response.success) {
          // Update cache
          globalKokulikulerCache.set(cacheKey, {
            data: response.kokulikuler || null,
            time: Date.now()
          });
          
          setKokulikuler(response.kokulikuler || null);
          setLoading(false);
          return response.kokulikuler || null;
        } else {
          throw new Error(response.message || 'Gagal mengambil data kokulikuler');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data kokulikuler');
        console.error('Error fetching kokulikuler:', err);
        setLoading(false);
        throw err;
      } finally {
        globalKokulikulerLoadingPromises.delete(cacheKey);
      }
    })();

    globalKokulikulerLoadingPromises.set(cacheKey, promise);
  }, [params?.kelasId, params?.tahunAjaran, params?.semester]);

  const refreshKokulikuler = async (clearAllCaches = false) => {
    if (!params?.kelasId || !params?.tahunAjaran || !params?.semester) {
      return;
    }

    // Clear cache for this params and force refresh
    const cacheKey = JSON.stringify(params);
    
    if (clearAllCaches) {
      // Clear all caches when kokulikuler is added/updated
      globalKokulikulerCache.clear();
      globalKokulikulerLoadingPromises.clear();
    } else {
      // Clear only this specific cache
      globalKokulikulerCache.delete(cacheKey);
      globalKokulikulerLoadingPromises.delete(cacheKey);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getKokulikuler({
        kelasId: params.kelasId,
        tahunAjaran: params.tahunAjaran,
        semester: params.semester,
      });
      if (response.success) {
        globalKokulikulerCache.set(cacheKey, {
          data: response.kokulikuler || null,
          time: Date.now()
        });
        setKokulikuler(response.kokulikuler || null);
      } else {
        setError(response.message || 'Gagal mengambil data kokulikuler');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data kokulikuler');
      console.error('Error fetching kokulikuler:', err);
    } finally {
      setLoading(false);
    }
  };

  return { kokulikuler, loading, error, refreshKokulikuler };
};

// Export function to refresh cache globally
export const refreshKokulikulerCache = async () => {
  globalKokulikulerCache.clear();
  globalKokulikulerLoadingPromises.clear();
};


