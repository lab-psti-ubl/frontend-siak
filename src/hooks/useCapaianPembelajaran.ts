import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { CapaianPembelajaran } from '../types';

// Global cache untuk semua instance hook
let globalCapaianPembelajaranCache: Map<string, { data: CapaianPembelajaran[]; time: number }> = new Map();
let globalCapaianPembelajaranLoadingPromises: Map<string, Promise<CapaianPembelajaran[]>> = new Map();

const CACHE_DURATION = 3000000; // 10 menit (600000 ms)

interface CapaianPembelajaranParams {
  guruId?: string;
  tingkat?: number;
  mataPelajaranId?: string;
  tahunAjaran?: string;
  semester?: number;
}

export const useCapaianPembelajaran = (params?: CapaianPembelajaranParams) => {
  const [capaianPembelajaran, setCapaianPembelajaran] = useState<CapaianPembelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // Check cache validity
    const cached = globalCapaianPembelajaranCache.get(cacheKey);
    const cacheValid = cached && (Date.now() - cached.time) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setCapaianPembelajaran(cached.data);
      setLoading(false);
      return;
    }

    // If there's already a request in progress with same params, wait for it
    const existingPromise = globalCapaianPembelajaranLoadingPromises.get(cacheKey);
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
        const response = await apiService.getAllCapaianPembelajaran(params);
        if (response.success && response.capaianPembelajaran) {
          // Update cache
          globalCapaianPembelajaranCache.set(cacheKey, {
            data: response.capaianPembelajaran,
            time: Date.now()
          });
          
          setCapaianPembelajaran(response.capaianPembelajaran);
          setLoading(false);
          return response.capaianPembelajaran;
        } else {
          throw new Error(response.message || 'Gagal mengambil data capaian pembelajaran');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data capaian pembelajaran');
        console.error('Error fetching capaian pembelajaran:', err);
        setLoading(false);
        throw err;
      } finally {
        globalCapaianPembelajaranLoadingPromises.delete(cacheKey);
      }
    })();

    globalCapaianPembelajaranLoadingPromises.set(cacheKey, promise);
  }, [params?.guruId, params?.tingkat, params?.mataPelajaranId, params?.tahunAjaran, params?.semester]);

  const refreshCapaianPembelajaran = async () => {
    // Clear cache for this params and force refresh
    const cacheKey = JSON.stringify(params || {});
    globalCapaianPembelajaranCache.delete(cacheKey);
    globalCapaianPembelajaranLoadingPromises.delete(cacheKey);
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllCapaianPembelajaran(params);
      if (response.success && response.capaianPembelajaran) {
        globalCapaianPembelajaranCache.set(cacheKey, {
          data: response.capaianPembelajaran,
          time: Date.now()
        });
        setCapaianPembelajaran(response.capaianPembelajaran);
      } else {
        setError(response.message || 'Gagal mengambil data capaian pembelajaran');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data capaian pembelajaran');
      console.error('Error fetching capaian pembelajaran:', err);
    } finally {
      setLoading(false);
    }
  };

  return { capaianPembelajaran, loading, error, refreshCapaianPembelajaran };
};

// Export function to clear all cache (useful when logging out)
export const clearCapaianPembelajaranCache = () => {
  globalCapaianPembelajaranCache.clear();
  globalCapaianPembelajaranLoadingPromises.clear();
};

