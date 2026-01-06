import { useState, useEffect } from 'react';
import * as React from 'react';
import { apiService } from '../services/apiService';
import { RiwayatKelasMurid } from '../types';

// Global cache untuk semua instance hook
let globalRiwayatKelasMuridCache: RiwayatKelasMurid[] | null = null;
let globalRiwayatKelasMuridCacheTime: number = 0;
let globalRiwayatKelasMuridLoadingPromise: Promise<RiwayatKelasMurid[]> | null = null;

const CACHE_DURATION = 1500000; // 10 menit (600000 ms)

interface RiwayatKelasMuridParams {
  muridId?: string;
  kelasId?: string;
  tahunAjaran?: string;
  semester?: number;
  status?: string;
}

export const useRiwayatKelasMurid = (params?: RiwayatKelasMuridParams) => {
  const [riwayatKelasMurid, setRiwayatKelasMurid] = useState<RiwayatKelasMurid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Store current params for refresh function
  const currentParamsRef = React.useRef(params);

  useEffect(() => {
    currentParamsRef.current = params;
    
    const fetchData = async () => {
      // Check cache validity (only for getAll, not for filtered queries)
      const hasFilters = params?.muridId || params?.kelasId || params?.tahunAjaran || params?.semester !== undefined || params?.status;
      const cacheValid = globalRiwayatKelasMuridCache && 
                        !hasFilters &&
                        (Date.now() - globalRiwayatKelasMuridCacheTime) < CACHE_DURATION;

      if (cacheValid) {
        // Use cached data only for getAll
        setRiwayatKelasMurid(globalRiwayatKelasMuridCache);
        setLoading(false);
        return;
      }

      // If there's already a request in progress, wait for it (only for getAll)
      if (globalRiwayatKelasMuridLoadingPromise && !hasFilters) {
        globalRiwayatKelasMuridLoadingPromise
          .then(data => {
            setRiwayatKelasMurid(data);
            setLoading(false);
          })
          .catch(err => {
            setError(err.message || 'Terjadi kesalahan saat mengambil data riwayat kelas murid');
            setLoading(false);
          });
        return;
      }

      // Make new request
      setLoading(true);
      setError(null);
      
      try {
        let response;
        if (params?.muridId) {
          // Fetch by muridId
          response = await apiService.getRiwayatKelasMuridByMuridId(params.muridId, params.tahunAjaran, params.semester);
        } else {
          // Fetch all (with optional filters)
          if (!globalRiwayatKelasMuridLoadingPromise && !hasFilters) {
            globalRiwayatKelasMuridLoadingPromise = (async () => {
              const resp = await apiService.getAllRiwayatKelasMurid(params);
              if (resp.success && resp.riwayatKelasMurid) {
                globalRiwayatKelasMuridCache = resp.riwayatKelasMurid;
                globalRiwayatKelasMuridCacheTime = Date.now();
                return resp.riwayatKelasMurid;
              } else {
                throw new Error(resp.message || 'Gagal mengambil data riwayat kelas murid');
              }
            })();
          }
          
          if (globalRiwayatKelasMuridLoadingPromise && !hasFilters) {
            const data = await globalRiwayatKelasMuridLoadingPromise;
            globalRiwayatKelasMuridLoadingPromise = null;
            setRiwayatKelasMurid(data);
            setLoading(false);
            return;
          } else {
            response = await apiService.getAllRiwayatKelasMurid(params);
          }
        }

        if (response.success && response.riwayatKelasMurid) {
          const riwayatData = response.riwayatKelasMurid;
          setRiwayatKelasMurid(riwayatData);
          
          // Update cache only for getAll (no filters)
          if (!hasFilters) {
            globalRiwayatKelasMuridCache = riwayatData;
            globalRiwayatKelasMuridCacheTime = Date.now();
          }
          
          setLoading(false);
        } else {
          throw new Error(response.message || 'Gagal mengambil data riwayat kelas murid');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data riwayat kelas murid');
        console.error('Error fetching riwayat kelas murid:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.muridId, params?.kelasId, params?.tahunAjaran, params?.semester, params?.status]);

  const refreshRiwayatKelasMurid = async () => {
    // Clear cache and force refresh
    globalRiwayatKelasMuridCache = null;
    globalRiwayatKelasMuridCacheTime = 0;
    globalRiwayatKelasMuridLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    const params = currentParamsRef.current;
    
    try {
      let response;
      if (params?.muridId) {
        response = await apiService.getRiwayatKelasMuridByMuridId(params.muridId, params.tahunAjaran, params.semester);
      } else {
        response = await apiService.getAllRiwayatKelasMurid(params);
      }
      
      if (response.success && response.riwayatKelasMurid) {
        const hasFilters = params?.muridId || params?.kelasId || params?.tahunAjaran || params?.semester !== undefined || params?.status;
        if (!hasFilters) {
          globalRiwayatKelasMuridCache = response.riwayatKelasMurid;
          globalRiwayatKelasMuridCacheTime = Date.now();
        }
        setRiwayatKelasMurid(response.riwayatKelasMurid);
      } else {
        setError(response.message || 'Gagal mengambil data riwayat kelas murid');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data riwayat kelas murid');
      console.error('Error fetching riwayat kelas murid:', err);
    } finally {
      setLoading(false);
    }
  };

  const createRiwayatKelasMurid = async (riwayatData: Partial<RiwayatKelasMurid>) => {
    try {
      const response = await apiService.createRiwayatKelasMurid(riwayatData);
      if (response.success && response.riwayatKelasMurid) {
        // Refresh data after creation
        await refreshRiwayatKelasMurid();
        return response.riwayatKelasMurid;
      } else {
        throw new Error(response.message || 'Gagal membuat riwayat kelas murid');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membuat riwayat kelas murid');
      throw err;
    }
  };

  const bulkCreateRiwayatKelasMurid = async (riwayatList: Partial<RiwayatKelasMurid>[]) => {
    try {
      const response = await apiService.bulkCreateRiwayatKelasMurid(riwayatList);
      if (response.success && response.riwayatKelasMurid) {
        // Refresh data after creation
        await refreshRiwayatKelasMurid();
        return response.riwayatKelasMurid;
      } else {
        throw new Error(response.message || 'Gagal membuat riwayat kelas murid');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membuat riwayat kelas murid');
      throw err;
    }
  };

  const updateRiwayatKelasMurid = async (id: string, riwayatData: Partial<RiwayatKelasMurid>) => {
    try {
      const response = await apiService.updateRiwayatKelasMurid(id, riwayatData);
      if (response.success && response.riwayatKelasMurid) {
        // Refresh data after update
        await refreshRiwayatKelasMurid();
        return response.riwayatKelasMurid;
      } else {
        throw new Error(response.message || 'Gagal memperbarui riwayat kelas murid');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui riwayat kelas murid');
      throw err;
    }
  };

  const deleteRiwayatKelasMurid = async (id: string) => {
    try {
      const response = await apiService.deleteRiwayatKelasMurid(id);
      if (response.success) {
        // Refresh data after deletion
        await refreshRiwayatKelasMurid();
      } else {
        throw new Error(response.message || 'Gagal menghapus riwayat kelas murid');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menghapus riwayat kelas murid');
      throw err;
    }
  };

  return { 
    riwayatKelasMurid, 
    setRiwayatKelasMurid,
    loading, 
    error, 
    refreshRiwayatKelasMurid,
    createRiwayatKelasMurid,
    bulkCreateRiwayatKelasMurid,
    updateRiwayatKelasMurid,
    deleteRiwayatKelasMurid,
  };
};

// Export function to clear all cache (useful when logging out)
export const clearRiwayatKelasMuridCache = () => {
  globalRiwayatKelasMuridCache = null;
  globalRiwayatKelasMuridCacheTime = 0;
  globalRiwayatKelasMuridLoadingPromise = null;
};

