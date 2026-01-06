import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { NilaiEkstrakulikulerKelas } from '../types';

// Global cache untuk semua instance hook
let globalNilaiEkstrakulikulerKelasCache: Map<string, { data: NilaiEkstrakulikulerKelas | null; time: number }> = new Map();
let globalNilaiEkstrakulikulerKelasLoadingPromises: Map<string, Promise<NilaiEkstrakulikulerKelas | null>> = new Map();

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

export const useNilaiEkstrakulikulerKelas = (params?: { kelasId?: string; tahunAjaran?: string; semester?: number }) => {
  const [nilaiEkstrakulikuler, setNilaiEkstrakulikuler] = useState<NilaiEkstrakulikulerKelas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.kelasId || !params?.tahunAjaran || !params?.semester) {
      setNilaiEkstrakulikuler(null);
      setLoading(false);
      return;
    }

    // Create cache key from params
    const cacheKey = JSON.stringify(params);
    
    // Check cache validity
    const cached = globalNilaiEkstrakulikulerKelasCache.get(cacheKey);
    const cacheValid = cached && (Date.now() - cached.time) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setNilaiEkstrakulikuler(cached.data);
      setLoading(false);
      return;
    }

    // If there's already a request in progress with same params, wait for it
    const existingPromise = globalNilaiEkstrakulikulerKelasLoadingPromises.get(cacheKey);
    if (existingPromise) {
      existingPromise
        .then(data => {
          setNilaiEkstrakulikuler(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data nilai ekstrakulikuler');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    const promise = (async () => {
      try {
        const response = await apiService.getNilaiEkstrakulikulerKelas({
          kelasId: params.kelasId!,
          tahunAjaran: params.tahunAjaran!,
          semester: params.semester!,
        });
        if (response.success) {
          // Update cache
          globalNilaiEkstrakulikulerKelasCache.set(cacheKey, {
            data: response.nilaiEkstrakulikuler || null,
            time: Date.now()
          });
          
          setNilaiEkstrakulikuler(response.nilaiEkstrakulikuler || null);
          setLoading(false);
          return response.nilaiEkstrakulikuler || null;
        } else {
          throw new Error(response.message || 'Gagal mengambil data nilai ekstrakulikuler');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data nilai ekstrakulikuler');
        console.error('Error fetching nilai ekstrakulikuler kelas:', err);
        setLoading(false);
        throw err;
      } finally {
        globalNilaiEkstrakulikulerKelasLoadingPromises.delete(cacheKey);
      }
    })();

    globalNilaiEkstrakulikulerKelasLoadingPromises.set(cacheKey, promise);
  }, [params?.kelasId, params?.tahunAjaran, params?.semester]);

  const refreshNilaiEkstrakulikuler = async (clearAllCaches = false) => {
    if (!params?.kelasId || !params?.tahunAjaran || !params?.semester) {
      return;
    }

    // Clear cache for this params and force refresh
    const cacheKey = JSON.stringify(params);
    
    if (clearAllCaches) {
      // Clear all caches when nilai ekstrakulikuler is added/updated
      globalNilaiEkstrakulikulerKelasCache.clear();
      globalNilaiEkstrakulikulerKelasLoadingPromises.clear();
    } else {
      // Clear only this specific cache
      globalNilaiEkstrakulikulerKelasCache.delete(cacheKey);
      globalNilaiEkstrakulikulerKelasLoadingPromises.delete(cacheKey);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getNilaiEkstrakulikulerKelas({
        kelasId: params.kelasId,
        tahunAjaran: params.tahunAjaran,
        semester: params.semester,
      });
      if (response.success) {
        globalNilaiEkstrakulikulerKelasCache.set(cacheKey, {
          data: response.nilaiEkstrakulikuler || null,
          time: Date.now()
        });
        setNilaiEkstrakulikuler(response.nilaiEkstrakulikuler || null);
      } else {
        setError(response.message || 'Gagal mengambil data nilai ekstrakulikuler');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data nilai ekstrakulikuler');
      console.error('Error fetching nilai ekstrakulikuler kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  return { nilaiEkstrakulikuler, loading, error, refreshNilaiEkstrakulikuler };
};

// Export function to refresh cache globally
export const refreshNilaiEkstrakulikulerKelasCache = async () => {
  globalNilaiEkstrakulikulerKelasCache.clear();
  globalNilaiEkstrakulikulerKelasLoadingPromises.clear();
};

// Export function to clear all cache (useful when logging out)
export const clearNilaiEkstrakulikulerKelasCache = () => {
  globalNilaiEkstrakulikulerKelasCache.clear();
  globalNilaiEkstrakulikulerKelasLoadingPromises.clear();
};
