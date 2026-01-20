import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

// Global cache untuk pengaturan sistem
let globalPengaturanCache: { enableEarlyDeparture: boolean; systemType: string } | null = null;
let globalPengaturanCacheTime: number = 0;
let globalPengaturanLoadingPromise: Promise<{ enableEarlyDeparture: boolean; systemType: string }> | null = null;

const CACHE_DURATION = 2000000; // 1 menit

export const usePengaturanSistem = () => {
  const [enableEarlyDeparture, setEnableEarlyDeparture] = useState(false);
  const [systemType, setSystemType] = useState<string>('sekolah_umum_tahfiz');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if token exists (user is logged in)
    const token = localStorage.getItem('authToken');
    if (!token) {
      // If no token, set default and don't fetch
      setEnableEarlyDeparture(false);
      setSystemType('sekolah_umum_tahfiz');
      setLoading(false);
      return;
    }

    // Check cache validity
    const cacheValid = globalPengaturanCache && 
                      (Date.now() - globalPengaturanCacheTime) < CACHE_DURATION;

    if (cacheValid && globalPengaturanCache) {
      // Use cached data
      setEnableEarlyDeparture(globalPengaturanCache.enableEarlyDeparture);
      setSystemType(globalPengaturanCache.systemType);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalPengaturanLoadingPromise) {
      globalPengaturanLoadingPromise
        .then(data => {
          setEnableEarlyDeparture(data.enableEarlyDeparture);
          setSystemType(data.systemType);
          setLoading(false);
        })
        .catch(() => {
          // Silently fail and use default value
          setEnableEarlyDeparture(false); // Default value
          setSystemType('sekolah_umum_tahfiz');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalPengaturanLoadingPromise = (async () => {
      try {
        const [earlyDepartureResponse, systemTypeResponse] = await Promise.all([
          apiService.getEnableEarlyDeparture(),
          apiService.getSystemType()
        ]);
        
        if (earlyDepartureResponse.success && systemTypeResponse.success) {
          const data = { 
            enableEarlyDeparture: earlyDepartureResponse.enableEarlyDeparture ?? false,
            systemType: systemTypeResponse.systemType ?? 'sekolah_umum_tahfiz'
          };
          // Update cache
          globalPengaturanCache = data;
          globalPengaturanCacheTime = Date.now();
          
          setEnableEarlyDeparture(data.enableEarlyDeparture);
          setSystemType(data.systemType);
          setLoading(false);
          return data;
        } else {
          // Set default value instead of throwing error
          const data = { enableEarlyDeparture: false, systemType: 'sekolah_umum_tahfiz' };
          setEnableEarlyDeparture(false);
          setSystemType('sekolah_umum_tahfiz');
          setLoading(false);
          return data;
        }
      } catch (err: any) {
        // Silently fail and use default value to prevent crash
        setEnableEarlyDeparture(false); // Default value
        setSystemType('sekolah_umum_tahfiz');
        setLoading(false);
        const data = { enableEarlyDeparture: false, systemType: 'sekolah_umum_tahfiz' };
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
      const [earlyDepartureResponse, systemTypeResponse] = await Promise.all([
        apiService.getEnableEarlyDeparture(),
        apiService.getSystemType()
      ]);
      
      if (earlyDepartureResponse.success && systemTypeResponse.success) {
        const data = { 
          enableEarlyDeparture: earlyDepartureResponse.enableEarlyDeparture ?? false,
          systemType: systemTypeResponse.systemType ?? 'sekolah_umum_tahfiz'
        };
        globalPengaturanCache = data;
        globalPengaturanCacheTime = Date.now();
        setEnableEarlyDeparture(data.enableEarlyDeparture);
        setSystemType(data.systemType);
      } else {
        setError(earlyDepartureResponse.message || systemTypeResponse.message || 'Gagal mengambil pengaturan sistem');
        setEnableEarlyDeparture(false); // Default value
        setSystemType('sekolah_umum_tahfiz');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil pengaturan sistem');
      console.error('Error fetching pengaturan sistem:', err);
      setEnableEarlyDeparture(false); // Default value
      setSystemType('sekolah_umum_tahfiz');
    } finally {
      setLoading(false);
    }
  };

  const updateEnableEarlyDeparture = async (value: boolean) => {
    try {
      const response = await apiService.updatePengaturanSistem({ enableEarlyDeparture: value });
      if (response.success) {
        // Update cache
        globalPengaturanCache = { 
          enableEarlyDeparture: value,
          systemType: systemType
        };
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

  const updateSystemType = async (value: string, activationPassword?: string) => {
    try {
      const response = await apiService.updatePengaturanSistem({ 
        systemType: value,
        activationPassword: activationPassword
      });
      if (response.success) {
        // Update cache
        globalPengaturanCache = { 
          enableEarlyDeparture: enableEarlyDeparture,
          systemType: value
        };
        globalPengaturanCacheTime = Date.now();
        setSystemType(value);
        return true;
      } else {
        throw new Error(response.message || 'Gagal memperbarui tipe sistem');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui tipe sistem');
      console.error('Error updating system type:', err);
      throw err;
    }
  };

  return { 
    enableEarlyDeparture, 
    systemType,
    loading, 
    error, 
    refreshPengaturanSistem, 
    updateEnableEarlyDeparture,
    updateSystemType
  };
};

// Export function to clear cache
export const clearPengaturanCache = () => {
  globalPengaturanCache = null;
  globalPengaturanCacheTime = 0;
  globalPengaturanLoadingPromise = null;
};

