import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { User } from '../types';

// Global cache untuk semua instance hook
let globalMuridCache: Map<string, { data: User[]; time: number }> = new Map();
let globalMuridLoadingPromises: Map<string, Promise<User[]>> = new Map();
let cacheVersion = 0; // Version counter to trigger re-fetch when cache is cleared

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

export const useMurid = (params?: { kelasId?: string; search?: string; status?: 'active' | 'inactive' }) => {
  const [murid, setMurid] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(cacheVersion);

  // Poll for cache version changes to trigger re-fetch when cache is cleared
  useEffect(() => {
    const interval = setInterval(() => {
      if (version !== cacheVersion) {
        setVersion(cacheVersion);
      }
    }, 100); // Check every 100ms

    return () => clearInterval(interval);
  }, [version]);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // Check cache validity (ignore cache if version changed, meaning cache was cleared)
    const cached = globalMuridCache.get(cacheKey);
    const cacheValid = cached && (Date.now() - cached.time) < CACHE_DURATION && version === cacheVersion;

    if (cacheValid) {
      // Use cached data
      setMurid(cached.data);
      setLoading(false);
      return;
    }

    // If there's already a request in progress with same params, wait for it
    const existingPromise = globalMuridLoadingPromises.get(cacheKey);
    if (existingPromise) {
      existingPromise
        .then(data => {
          setMurid(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data murid');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    const promise = (async () => {
      try {
        const response = await apiService.getAllMurid(params);
        if (response.success && response.murid) {
          // Update cache
          globalMuridCache.set(cacheKey, {
            data: response.murid,
            time: Date.now()
          });
          
          setMurid(response.murid);
          setLoading(false);
          return response.murid;
        } else {
          throw new Error(response.message || 'Gagal mengambil data murid');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data murid');
        console.error('Error fetching murid:', err);
        setLoading(false);
        throw err;
      } finally {
        globalMuridLoadingPromises.delete(cacheKey);
      }
    })();

    globalMuridLoadingPromises.set(cacheKey, promise);
  }, [params?.kelasId, params?.search, params?.status, version]);

  const refreshMurid = async (clearAllCaches = false) => {
    // Clear cache for this params and force refresh
    const cacheKey = JSON.stringify(params || {});
    
    if (clearAllCaches) {
      // Clear all caches when murid is added/updated
      globalMuridCache.clear();
      globalMuridLoadingPromises.clear();
    } else {
      // Clear only this specific cache
      globalMuridCache.delete(cacheKey);
      globalMuridLoadingPromises.delete(cacheKey);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllMurid(params);
      if (response.success && response.murid) {
        globalMuridCache.set(cacheKey, {
          data: response.murid,
          time: Date.now()
        });
        setMurid(response.murid);
      } else {
        setError(response.message || 'Gagal mengambil data murid');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data murid');
      console.error('Error fetching murid:', err);
    } finally {
      setLoading(false);
    }
  };

  return { murid, loading, error, refreshMurid };
};

// Export function to clear all cache (useful when logging out)
export const clearMuridCache = () => {
  globalMuridCache.clear();
  globalMuridLoadingPromises.clear();
  // Increment version to trigger re-fetch in all hook instances
  cacheVersion++;
};

