import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Alumni } from '../types';

// Global cache untuk semua instance hook
let globalAlumniCache: Map<string, { data: Alumni[]; time: number }> = new Map();
let globalAlumniLoadingPromises: Map<string, Promise<Alumni[]>> = new Map();

const CACHE_DURATION = 600000; // 10 menit (600000 ms)

interface AlumniParams {
  tahunLulus?: string;
  kelasId?: string;
  search?: string;
}

export const useAlumni = (params?: AlumniParams) => {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // Check cache validity
    const cached = globalAlumniCache.get(cacheKey);
    const cacheValid = cached && (Date.now() - cached.time) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setAlumni(cached.data);
      setLoading(false);
      return;
    }

    // If there's already a request in progress with same params, wait for it
    const existingPromise = globalAlumniLoadingPromises.get(cacheKey);
    if (existingPromise) {
      existingPromise
        .then(data => {
          setAlumni(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data alumni');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    const promise = (async () => {
      try {
        const response = await apiService.getAllAlumni(params);
        if (response.success && response.alumni) {
          // Update cache
          globalAlumniCache.set(cacheKey, {
            data: response.alumni,
            time: Date.now()
          });
          
          setAlumni(response.alumni);
          setLoading(false);
          return response.alumni;
        } else {
          throw new Error(response.message || 'Gagal mengambil data alumni');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data alumni');
        console.error('Error fetching alumni:', err);
        setLoading(false);
        throw err;
      } finally {
        globalAlumniLoadingPromises.delete(cacheKey);
      }
    })();

    globalAlumniLoadingPromises.set(cacheKey, promise);
  }, [params?.tahunLulus, params?.kelasId, params?.search]);

  const refreshAlumni = async (clearAllCaches = false) => {
    // Clear cache for this params and force refresh
    const cacheKey = JSON.stringify(params || {});
    
    if (clearAllCaches) {
      // Clear all caches when alumni is added/updated
      globalAlumniCache.clear();
      globalAlumniLoadingPromises.clear();
    } else {
      // Clear only this specific cache
      globalAlumniCache.delete(cacheKey);
      globalAlumniLoadingPromises.delete(cacheKey);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllAlumni(params);
      if (response.success && response.alumni) {
        globalAlumniCache.set(cacheKey, {
          data: response.alumni,
          time: Date.now()
        });
        setAlumni(response.alumni);
      } else {
        setError(response.message || 'Gagal mengambil data alumni');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data alumni');
      console.error('Error fetching alumni:', err);
    } finally {
      setLoading(false);
    }
  };

  return { alumni, loading, error, refreshAlumni };
};

// Export function to clear all cache (useful when logging out)
export const clearAlumniCache = () => {
  globalAlumniCache.clear();
  globalAlumniLoadingPromises.clear();
};
