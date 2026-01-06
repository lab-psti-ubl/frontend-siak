import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { JadwalPelajaran } from '../types';

// Global cache untuk semua instance hook
let globalJadwalPelajaranCache: Map<string, { data: JadwalPelajaran[]; time: number }> = new Map();
let globalJadwalPelajaranLoadingPromises: Map<string, Promise<JadwalPelajaran[]>> = new Map();

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

interface JadwalPelajaranParams {
  kelasId?: string;
  guruId?: string;
  tahunAjaran?: string;
  semester?: number;
  hari?: string;
}

export const useJadwalPelajaran = (params?: JadwalPelajaranParams) => {
  const [jadwalPelajaran, setJadwalPelajaran] = useState<JadwalPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // Check cache validity
    const cached = globalJadwalPelajaranCache.get(cacheKey);
    const cacheValid = cached && (Date.now() - cached.time) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setJadwalPelajaran(cached.data);
      setLoading(false);
      return;
    }

    // If there's already a request in progress with same params, wait for it
    const existingPromise = globalJadwalPelajaranLoadingPromises.get(cacheKey);
    if (existingPromise) {
      existingPromise
        .then(data => {
          setJadwalPelajaran(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data jadwal pelajaran');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    const promise = (async () => {
      try {
        const response = await apiService.getAllJadwalPelajaran(params);
        if (response.success && response.jadwalPelajaran) {
          // Update cache
          globalJadwalPelajaranCache.set(cacheKey, {
            data: response.jadwalPelajaran,
            time: Date.now()
          });
          
          setJadwalPelajaran(response.jadwalPelajaran);
          setLoading(false);
          return response.jadwalPelajaran;
        } else {
          throw new Error(response.message || 'Gagal mengambil data jadwal pelajaran');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data jadwal pelajaran');
        console.error('Error fetching jadwal pelajaran:', err);
        setLoading(false);
        throw err;
      } finally {
        globalJadwalPelajaranLoadingPromises.delete(cacheKey);
      }
    })();

    globalJadwalPelajaranLoadingPromises.set(cacheKey, promise);
  }, [params?.kelasId, params?.guruId, params?.tahunAjaran, params?.semester, params?.hari]);

  const refreshJadwalPelajaran = async () => {
    // Clear cache for this params and force refresh
    const cacheKey = JSON.stringify(params || {});
    globalJadwalPelajaranCache.delete(cacheKey);
    globalJadwalPelajaranLoadingPromises.delete(cacheKey);
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllJadwalPelajaran(params);
      if (response.success && response.jadwalPelajaran) {
        globalJadwalPelajaranCache.set(cacheKey, {
          data: response.jadwalPelajaran,
          time: Date.now()
        });
        setJadwalPelajaran(response.jadwalPelajaran);
      } else {
        setError(response.message || 'Gagal mengambil data jadwal pelajaran');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data jadwal pelajaran');
      console.error('Error fetching jadwal pelajaran:', err);
    } finally {
      setLoading(false);
    }
  };

  return { jadwalPelajaran, loading, error, refreshJadwalPelajaran };
};

// Export function to clear all cache (useful when CRUD operations happen)
export const clearAllJadwalPelajaranCache = () => {
  globalJadwalPelajaranCache.clear();
  globalJadwalPelajaranLoadingPromises.clear();
};

