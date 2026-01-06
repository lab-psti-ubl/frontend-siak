import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { IzinGuru } from '../types';

// Global cache untuk semua instance hook
let globalIzinGuruCache: IzinGuru[] | null = null;
let globalIzinGuruCacheTime: number = 0;
let globalIzinGuruLoadingPromise: Promise<IzinGuru[]> | null = null;

const CACHE_DURATION = 600000; // 5 menit (300000 ms) - shorter cache for permission data

interface IzinGuruParams {
  status?: string;
  guruId?: string;
}

export const useIzinGuru = (params?: IzinGuruParams) => {
  const [izinGuru, setIzinGuru] = useState<IzinGuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create cache key from params
    const cacheKey = JSON.stringify(params || {});
    
    // Check cache validity (only for getAll, not for filtered queries)
    const cacheValid = globalIzinGuruCache && 
                      !params?.status &&
                      !params?.guruId &&
                      (Date.now() - globalIzinGuruCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data only for getAll
      setIzinGuru(globalIzinGuruCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it (only for getAll)
    if (globalIzinGuruLoadingPromise && !params?.status && !params?.guruId) {
      globalIzinGuruLoadingPromise
        .then(data => {
          setIzinGuru(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data izin guru');
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
        if (params?.status) {
          // Fetch by status
          response = await apiService.getIzinGuruByStatus(params.status);
        } else {
          // Fetch all
          if (!globalIzinGuruLoadingPromise) {
            globalIzinGuruLoadingPromise = (async () => {
              const resp = await apiService.getAllIzinGuru();
              if (resp.success && resp.izinGuru) {
                globalIzinGuruCache = resp.izinGuru;
                globalIzinGuruCacheTime = Date.now();
                return resp.izinGuru;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data izin guru');
              }
            })();
          }
          const data = await globalIzinGuruLoadingPromise;
          globalIzinGuruLoadingPromise = null;
          
          // Filter by guruId if provided
          let filteredData = data;
          if (params?.guruId) {
            filteredData = data.filter(i => i.guruId === params.guruId);
          }
          
          setIzinGuru(filteredData);
          setLoading(false);
          return;
        }

        if (response.success && response.izinGuru) {
          // Filter by guruId if provided
          let filteredData = response.izinGuru;
          if (params?.guruId) {
            filteredData = response.izinGuru.filter(i => i.guruId === params.guruId);
          }
          
          setIzinGuru(filteredData);
          setLoading(false);
        } else {
          throw new Error(response.message || 'Gagal mengambil data izin guru');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data izin guru');
        console.error('Error fetching izin guru:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.status, params?.guruId]);

  const refreshIzinGuru = async () => {
    // Clear cache and force refresh
    globalIzinGuruCache = null;
    globalIzinGuruCacheTime = 0;
    globalIzinGuruLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (params?.status) {
        response = await apiService.getIzinGuruByStatus(params.status);
      } else {
        response = await apiService.getAllIzinGuru();
      }
      
      if (response.success && response.izinGuru) {
        // Filter by guruId if provided
        let filteredData = response.izinGuru;
        if (params?.guruId) {
          filteredData = response.izinGuru.filter(i => i.guruId === params.guruId);
        }
        
        if (!params?.status && !params?.guruId) {
          globalIzinGuruCache = response.izinGuru;
          globalIzinGuruCacheTime = Date.now();
        }
        setIzinGuru(filteredData);
      } else {
        setError(response.message || 'Gagal mengambil data izin guru');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data izin guru');
      console.error('Error fetching izin guru:', err);
    } finally {
      setLoading(false);
    }
  };

  return { izinGuru, loading, error, refreshIzinGuru };
};

// Export function to clear all cache (useful when logging out)
export const clearIzinGuruCache = () => {
  globalIzinGuruCache = null;
  globalIzinGuruCacheTime = 0;
  globalIzinGuruLoadingPromise = null;
};

