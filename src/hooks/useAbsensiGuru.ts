import { useState, useEffect } from 'react';
import * as React from 'react';
import { apiService } from '../services/apiService';
import { AbsensiGuru } from '../types';

// Global cache untuk semua instance hook
let globalAbsensiGuruCache: AbsensiGuru[] | null = null;
let globalAbsensiGuruCacheTime: number = 0;
let globalAbsensiGuruLoadingPromise: Promise<AbsensiGuru[]> | null = null;

const CACHE_DURATION = 2000000; // 10 menit (600000 ms) - shorter cache for attendance data

export const useAbsensiGuru = (guruId?: string, bulan?: number, tahun?: number) => {
  const [absensiGuru, setAbsensiGuru] = useState<AbsensiGuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Store current params for refresh function
  const currentParamsRef = React.useRef({ guruId, bulan, tahun });

  useEffect(() => {
    currentParamsRef.current = { guruId, bulan, tahun };
    
    const fetchData = async () => {
      // Check cache validity (only for getAll, not for filtered queries)
      const cacheValid = globalAbsensiGuruCache && 
                        (Date.now() - globalAbsensiGuruCacheTime) < CACHE_DURATION &&
                        !guruId && !bulan && !tahun;

      if (cacheValid) {
        // Use cached data only for getAll
        setAbsensiGuru(globalAbsensiGuruCache);
        setLoading(false);
        return;
      }

      // If there's already a request in progress, wait for it (only for getAll)
      if (globalAbsensiGuruLoadingPromise && !guruId && !bulan && !tahun) {
        globalAbsensiGuruLoadingPromise
          .then(data => {
            setAbsensiGuru(data);
            setLoading(false);
          })
          .catch(err => {
            setError(err.message || 'Terjadi kesalahan saat mengambil data absensi guru');
            setLoading(false);
          });
        return;
      }

      // Make new request
      setLoading(true);
      setError(null);
      
      try {
        let response;
        if (guruId) {
          // Fetch by guruId (with optional bulan/tahun filter)
          response = await apiService.getAbsensiGuruByGuruId(guruId, bulan, tahun);
        } else {
          // Fetch all
          if (!globalAbsensiGuruLoadingPromise) {
            globalAbsensiGuruLoadingPromise = (async () => {
              const resp = await apiService.getAllAbsensiGuru();
              if (resp.success && resp.absensiGuru) {
                globalAbsensiGuruCache = resp.absensiGuru;
                globalAbsensiGuruCacheTime = Date.now();
                return resp.absensiGuru;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data absensi guru');
              }
            })();
          }
          const data = await globalAbsensiGuruLoadingPromise;
          globalAbsensiGuruLoadingPromise = null;
          setAbsensiGuru(data);
          setLoading(false);
          return;
        }

        if (response.success && response.absensiGuru) {
          setAbsensiGuru(response.absensiGuru);
          setLoading(false);
        } else {
          throw new Error(response.message || 'Gagal mengambil data absensi guru');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data absensi guru');
        console.error('Error fetching absensi guru:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [guruId, bulan, tahun]);

  const refreshAbsensiGuru = async () => {
    // Clear cache and force refresh
    globalAbsensiGuruCache = null;
    globalAbsensiGuruCacheTime = 0;
    globalAbsensiGuruLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    const params = currentParamsRef.current;
    
    try {
      let response;
      if (params.guruId) {
        response = await apiService.getAbsensiGuruByGuruId(params.guruId, params.bulan, params.tahun);
      } else {
        response = await apiService.getAllAbsensiGuru();
      }
      
      if (response.success && response.absensiGuru) {
        if (!params.guruId && !params.bulan && !params.tahun) {
          globalAbsensiGuruCache = response.absensiGuru;
          globalAbsensiGuruCacheTime = Date.now();
        }
        setAbsensiGuru(response.absensiGuru);
      } else {
        setError(response.message || 'Gagal mengambil data absensi guru');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data absensi guru');
      console.error('Error fetching absensi guru:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAbsensiGuru = async (data: Partial<AbsensiGuru>) => {
    try {
      const response = await apiService.createAbsensiGuru(data);
      if (response.success && response.absensiGuru) {
        // Invalidate cache
        globalAbsensiGuruCache = null;
        globalAbsensiGuruCacheTime = 0;
        globalAbsensiGuruLoadingPromise = null;
        return response.absensiGuru;
      } else {
        throw new Error(response.message || 'Gagal membuat absensi guru');
      }
    } catch (err: any) {
      console.error('Error creating absensi guru:', err);
      throw err;
    }
  };

  const updateAbsensiGuru = async (id: string, data: Partial<AbsensiGuru>) => {
    try {
      const response = await apiService.updateAbsensiGuru(id, data);
      if (response.success && response.absensiGuru) {
        // Invalidate cache
        globalAbsensiGuruCache = null;
        globalAbsensiGuruCacheTime = 0;
        globalAbsensiGuruLoadingPromise = null;
        return response.absensiGuru;
      } else {
        throw new Error(response.message || 'Gagal memperbarui absensi guru');
      }
    } catch (err: any) {
      console.error('Error updating absensi guru:', err);
      throw err;
    }
  };

  return { absensiGuru, loading, error, refreshAbsensiGuru, createAbsensiGuru, updateAbsensiGuru };
};

// Export function to clear all cache (useful when logging out)
export const clearAbsensiGuruCache = () => {
  globalAbsensiGuruCache = null;
  globalAbsensiGuruCacheTime = 0;
  globalAbsensiGuruLoadingPromise = null;
};

