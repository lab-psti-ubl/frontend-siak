import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { CapaianPembelajaranKelas } from '../types';

// Global cache untuk semua instance hook
let globalCapaianPembelajaranKelasCache: Map<string, { data: CapaianPembelajaranKelas | null; time: number }> = new Map();
let globalCapaianPembelajaranKelasLoadingPromises: Map<string, Promise<CapaianPembelajaranKelas | null>> = new Map();

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

export const useCapaianPembelajaranKelas = (params?: { guruId?: string; tahunAjaran?: string; semester?: number }) => {
  const [capaianPembelajaran, setCapaianPembelajaran] = useState<CapaianPembelajaranKelas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.guruId || !params?.tahunAjaran || !params?.semester) {
      setCapaianPembelajaran(null);
      setLoading(false);
      return;
    }

    // Create cache key from params
    const cacheKey = JSON.stringify(params);
    
    // Check cache validity
    const cached = globalCapaianPembelajaranKelasCache.get(cacheKey);
    const cacheValid = cached && (Date.now() - cached.time) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setCapaianPembelajaran(cached.data);
      setLoading(false);
      return;
    }

    // If there's already a request in progress with same params, wait for it
    const existingPromise = globalCapaianPembelajaranKelasLoadingPromises.get(cacheKey);
    if (existingPromise) {
      existingPromise
        .then(data => {
          setCapaianPembelajaran(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data capaian pembelajaran');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    const promise = (async () => {
      try {
        const response = await apiService.getCapaianPembelajaranKelas({
          guruId: params.guruId!,
          tahunAjaran: params.tahunAjaran!,
          semester: params.semester!,
        });
        if (response.success) {
          // Update cache
          globalCapaianPembelajaranKelasCache.set(cacheKey, {
            data: response.capaianPembelajaran || null,
            time: Date.now()
          });
          
          setCapaianPembelajaran(response.capaianPembelajaran || null);
          setLoading(false);
          return response.capaianPembelajaran || null;
        } else {
          throw new Error(response.message || 'Gagal mengambil data capaian pembelajaran');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data capaian pembelajaran');
        console.error('Error fetching capaian pembelajaran kelas:', err);
        setLoading(false);
        throw err;
      } finally {
        globalCapaianPembelajaranKelasLoadingPromises.delete(cacheKey);
      }
    })();

    globalCapaianPembelajaranKelasLoadingPromises.set(cacheKey, promise);
  }, [params?.guruId, params?.tahunAjaran, params?.semester]);

  const refreshCapaianPembelajaran = async (clearAllCaches = false) => {
    if (!params?.guruId || !params?.tahunAjaran || !params?.semester) {
      return;
    }

    // Clear cache for this params and force refresh
    const cacheKey = JSON.stringify(params);
    
    if (clearAllCaches) {
      // Clear all caches when capaian pembelajaran is added/updated
      globalCapaianPembelajaranKelasCache.clear();
      globalCapaianPembelajaranKelasLoadingPromises.clear();
    } else {
      // Clear only this specific cache
      globalCapaianPembelajaranKelasCache.delete(cacheKey);
      globalCapaianPembelajaranKelasLoadingPromises.delete(cacheKey);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getCapaianPembelajaranKelas({
        guruId: params.guruId,
        tahunAjaran: params.tahunAjaran,
        semester: params.semester,
      });
      if (response.success) {
        globalCapaianPembelajaranKelasCache.set(cacheKey, {
          data: response.capaianPembelajaran || null,
          time: Date.now()
        });
        setCapaianPembelajaran(response.capaianPembelajaran || null);
      } else {
        setError(response.message || 'Gagal mengambil data capaian pembelajaran');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data capaian pembelajaran');
      console.error('Error fetching capaian pembelajaran kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  return { capaianPembelajaran, loading, error, refreshCapaianPembelajaran };
};

// Export function to refresh cache globally
export const refreshCapaianPembelajaranKelasCache = async () => {
  globalCapaianPembelajaranKelasCache.clear();
  globalCapaianPembelajaranKelasLoadingPromises.clear();
};

// Export function to clear all cache (useful when logging out)
export const clearCapaianPembelajaranKelasCache = () => {
  globalCapaianPembelajaranKelasCache.clear();
  globalCapaianPembelajaranKelasLoadingPromises.clear();
};


