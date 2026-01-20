import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export type TahfizClass = {
  id: string;
  namaKelas: string;
  ruangan: string;
  ustadzId: string;
  santriIds: string[];
  createdAt: string;
  updatedAt: string;
};

// Global cache untuk semua instance hook
let globalKelasTahfizCache: TahfizClass[] | null = null;
let globalKelasTahfizCacheTime: number = 0;
let globalKelasTahfizLoadingPromise: Promise<TahfizClass[]> | null = null;

const CACHE_DURATION = 2000000; // 5 menit

export const useKelasTahfiz = () => {
  const [kelasTahfiz, setKelasTahfiz] = useState<TahfizClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalKelasTahfizCache && 
                      (Date.now() - globalKelasTahfizCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setKelasTahfiz(globalKelasTahfizCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalKelasTahfizLoadingPromise) {
      globalKelasTahfizLoadingPromise
        .then(data => {
          setKelasTahfiz(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data kelas tahfiz');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalKelasTahfizLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllKelasTahfiz();
        if (response.success && response.kelasTahfiz) {
          // Update cache
          globalKelasTahfizCache = response.kelasTahfiz;
          globalKelasTahfizCacheTime = Date.now();
          
          setKelasTahfiz(response.kelasTahfiz);
          setLoading(false);
          return response.kelasTahfiz;
        } else {
          throw new Error(response.message || 'Gagal mengambil data kelas tahfiz');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data kelas tahfiz');
        console.error('Error fetching kelas tahfiz:', err);
        setLoading(false);
        throw err;
      } finally {
        globalKelasTahfizLoadingPromise = null;
      }
    })() as Promise<TahfizClass[]>;
  }, []);

  const refreshKelasTahfiz = async () => {
    // Clear cache and force refresh
    globalKelasTahfizCache = null;
    globalKelasTahfizCacheTime = 0;
    globalKelasTahfizLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllKelasTahfiz();
      if (response.success && response.kelasTahfiz) {
        globalKelasTahfizCache = response.kelasTahfiz;
        globalKelasTahfizCacheTime = Date.now();
        setKelasTahfiz(response.kelasTahfiz);
      } else {
        setError(response.message || 'Gagal mengambil data kelas tahfiz');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data kelas tahfiz');
      console.error('Error fetching kelas tahfiz:', err);
    } finally {
      setLoading(false);
    }
  };

  return { kelasTahfiz, loading, error, refreshKelasTahfiz };
};

// Export function to clear all cache (useful when logging out)
export const clearKelasTahfizCache = () => {
  globalKelasTahfizCache = null;
  globalKelasTahfizCacheTime = 0;
  globalKelasTahfizLoadingPromise = null;
};
