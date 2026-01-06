import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

// Global cache untuk pengaturan sistem
let globalPengaturanCache: { enableEarlyDeparture: boolean } | null = null;
let globalPengaturanCacheTime: number = 0;
let globalPengaturanLoadingPromise: Promise<{ enableEarlyDeparture: boolean }> | null = null;

const CACHE_DURATION = 2000000; // 1 menit

export const usePengaturanSistem = () => {
  const [enableEarlyDeparture, setEnableEarlyDeparture] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if token exists (user is logged in)
    const token = localStorage.getItem('authToken');
    if (!token) {
      // If no token, set default and don't fetch
      setEnableEarlyDeparture(false);
      setLoading(false);
      return;
    }

    // Check cache validity
    const cacheValid = globalPengaturanCache && 
                      (Date.now() - globalPengaturanCacheTime) < CACHE_DURATION;

    if (cacheValid && globalPengaturanCache) {
      // Use cached data
      setEnableEarlyDeparture(globalPengaturanCache.enableEarlyDeparture);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalPengaturanLoadingPromise) {
      globalPengaturanLoadingPromise
        .then(data => {
          setEnableEarlyDeparture(data.enableEarlyDeparture);
          setLoading(false);
        })
        .catch(() => {
          // Silently fail and use default value
          setEnableEarlyDeparture(false); // Default value
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalPengaturanLoadingPromise = (async () => {
      try {
        const response = await apiService.getEnableEarlyDeparture();
        if (response.success) {
          const data = { enableEarlyDeparture: response.enableEarlyDeparture ?? false };
          // Update cache
          globalPengaturanCache = data;
          globalPengaturanCacheTime = Date.now();
          
          setEnableEarlyDeparture(data.enableEarlyDeparture);
          setLoading(false);
          return data;
        } else {
          // Set default value instead of throwing error
          const data = { enableEarlyDeparture: false };
          setEnableEarlyDeparture(false);
          setLoading(false);
          return data;
        }
      } catch (err: any) {
        // Silently fail and use default value to prevent crash
        setEnableEarlyDeparture(false); // Default value
        setLoading(false);
        const data = { enableEarlyDeparture: false };
        return data;
      } finally {
        globalPengaturanLoadingPromise = null;
      }
    })();
  }, []);

  const refreshPengaturanSistem = async () => {
    // Clear cache and force refresh
    globalPengaturanCache = null;
    globalPengaturanCacheTime = 0;
    globalPengaturanLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getEnableEarlyDeparture();
      if (response.success) {
        const data = { enableEarlyDeparture: response.enableEarlyDeparture ?? false };
        globalPengaturanCache = data;
        globalPengaturanCacheTime = Date.now();
        setEnableEarlyDeparture(data.enableEarlyDeparture);
      } else {
        setError(response.message || 'Gagal mengambil pengaturan sistem');
        setEnableEarlyDeparture(false); // Default value
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil pengaturan sistem');
      console.error('Error fetching pengaturan sistem:', err);
      setEnableEarlyDeparture(false); // Default value
    } finally {
      setLoading(false);
    }
  };

  const updateEnableEarlyDeparture = async (value: boolean) => {
    try {
      const response = await apiService.updatePengaturanSistem({ enableEarlyDeparture: value });
      if (response.success) {
        // Update cache
        globalPengaturanCache = { enableEarlyDeparture: value };
        globalPengaturanCacheTime = Date.now();
        setEnableEarlyDeparture(value);
        return true;
      } else {
        throw new Error(response.message || 'Gagal memperbarui pengaturan');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui pengaturan');
      console.error('Error updating pengaturan sistem:', err);
      throw err;
    }
  };

  return { enableEarlyDeparture, loading, error, refreshPengaturanSistem, updateEnableEarlyDeparture };
};

// Export function to clear cache
export const clearPengaturanCache = () => {
  globalPengaturanCache = null;
  globalPengaturanCacheTime = 0;
  globalPengaturanLoadingPromise = null;
};

