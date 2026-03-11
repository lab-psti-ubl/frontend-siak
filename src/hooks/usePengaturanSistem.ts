import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

// Global cache untuk pengaturan sistem
let globalPengaturanCache: {
  enableEarlyDeparture: boolean;
  systemType: string | null;
  cbtEnabled?: boolean;
  spmbEnabled?: boolean;
} | null = null;
let globalPengaturanCacheTime: number = 0;
let globalPengaturanLoadingPromise: Promise<{
  enableEarlyDeparture: boolean;
  systemType: string | null;
  cbtEnabled?: boolean;
  spmbEnabled?: boolean;
}> | null = null;

const CACHE_DURATION = 2000000; // ~33 menit

const isCacheValid = () =>
  globalPengaturanCache != null && (Date.now() - globalPengaturanCacheTime) < CACHE_DURATION;

export const usePengaturanSistem = () => {
  const [enableEarlyDeparture, setEnableEarlyDeparture] = useState(
    globalPengaturanCache?.enableEarlyDeparture ?? false
  );
  const [systemType, setSystemType] = useState<string | null>(
    globalPengaturanCache?.systemType ?? null
  );
  const [cbtEnabled, setCbtEnabled] = useState<boolean | undefined>(
    globalPengaturanCache?.cbtEnabled
  );
  const [spmbEnabled, setSpmbEnabled] = useState<boolean | undefined>(
    globalPengaturanCache?.spmbEnabled
  );
  const [loading, setLoading] = useState(!isCacheValid());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Always fetch system type, even without token (for initial setup)
    // Check if token exists (user is logged in)
    const token = localStorage.getItem('authToken');
    if (!token) {
      // If no token, still try to fetch system type (for initial setup)
      // But set default values for other settings
      setEnableEarlyDeparture(false);
      // Don't set default systemType - let it be null to trigger setup modal
    }

    const cacheValid = token && isCacheValid();

    // Hanya gunakan cache jika sudah berisi nilai CBT & SPMB yang lengkap.
    // Jika cache hanya di-prewarm dengan systemType saja (tanpa cbtEnabled/spmbEnabled),
    // tetap lakukan fetch ke server agar status menu CBT/SPMB akurat setelah reload.
    if (
      cacheValid &&
      globalPengaturanCache &&
      typeof globalPengaturanCache.cbtEnabled === 'boolean' &&
      typeof globalPengaturanCache.spmbEnabled === 'boolean'
    ) {
      setEnableEarlyDeparture(globalPengaturanCache.enableEarlyDeparture);
      setSystemType(globalPengaturanCache.systemType);
      setCbtEnabled(globalPengaturanCache.cbtEnabled);
      setSpmbEnabled(globalPengaturanCache.spmbEnabled);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalPengaturanLoadingPromise) {
      globalPengaturanLoadingPromise
        .then(data => {
          setEnableEarlyDeparture(data.enableEarlyDeparture);
          setSystemType(data.systemType);
          setCbtEnabled(data.cbtEnabled);
          setSpmbEnabled(data.spmbEnabled);
          setLoading(false);
        })
        .catch(() => {
          // Jangan pakai default: hanya backend yang menentukan systemType
          setEnableEarlyDeparture(false);
          setSystemType(null);
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalPengaturanLoadingPromise = (async () => {
      try {
        const [
          earlyDepartureResponse,
          systemTypeResponse,
          pengaturanResponse,
          cbtSpmbResponse,
        ] = await Promise.all([
          apiService.getEnableEarlyDeparture(),
          apiService.getSystemType(),
          apiService.getPengaturanSistem().catch(() => null),
          apiService.getCbtSpmbSettingsPublic().catch(() => null),
        ]);
        
        if (earlyDepartureResponse.success && systemTypeResponse.success) {
          const pengaturan = pengaturanResponse?.pengaturan;

          // Sumber kebenaran utama untuk CBT/SPMB adalah endpoint publik
          // yang juga digunakan halaman Aktivasi iSchola
          let resolvedCbtEnabled: boolean;
          let resolvedSpmbEnabled: boolean;

          if (cbtSpmbResponse && (cbtSpmbResponse as any).success) {
            resolvedCbtEnabled = (cbtSpmbResponse as any).cbtEnabled ?? true;
            resolvedSpmbEnabled = (cbtSpmbResponse as any).spmbEnabled ?? true;
          } else if (pengaturan) {
            resolvedCbtEnabled = pengaturan.cbtEnabled ?? true;
            resolvedSpmbEnabled = pengaturan.spmbEnabled ?? true;
          } else {
            resolvedCbtEnabled = true;
            resolvedSpmbEnabled = true;
          }

          // systemType can be null if not set yet (for initial setup)
          const data = { 
            enableEarlyDeparture: earlyDepartureResponse.enableEarlyDeparture ?? false,
            systemType: systemTypeResponse.systemType ?? null,
            cbtEnabled: resolvedCbtEnabled,
            spmbEnabled: resolvedSpmbEnabled,
          };
          // Update cache only if systemType is set
          if (data.systemType) {
            globalPengaturanCache = data;
            globalPengaturanCacheTime = Date.now();
          }
          
          setEnableEarlyDeparture(data.enableEarlyDeparture);
          setSystemType(data.systemType);
          setCbtEnabled(data.cbtEnabled);
          setSpmbEnabled(data.spmbEnabled);
          setLoading(false);
          return data;
        } else {
          // Set null for systemType to trigger setup modal
          const data = { enableEarlyDeparture: false, systemType: null, cbtEnabled: true, spmbEnabled: true };
          setEnableEarlyDeparture(false);
          setSystemType(null);
          setCbtEnabled(true);
          setSpmbEnabled(true);
          setLoading(false);
          return data;
        }
      } catch (err: any) {
        // Silently fail and use null for systemType to trigger setup modal
        setEnableEarlyDeparture(false);
        setSystemType(null);
        setCbtEnabled(true);
        setSpmbEnabled(true);
        setLoading(false);
        const data = { enableEarlyDeparture: false, systemType: null, cbtEnabled: true, spmbEnabled: true };
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
      const [
        earlyDepartureResponse,
        systemTypeResponse,
        pengaturanResponse,
        cbtSpmbResponse,
      ] = await Promise.all([
        apiService.getEnableEarlyDeparture(),
        apiService.getSystemType(),
        apiService.getPengaturanSistem().catch(() => null),
        apiService.getCbtSpmbSettingsPublic().catch(() => null),
      ]);
      
      if (earlyDepartureResponse.success && systemTypeResponse.success) {
        const pengaturan = pengaturanResponse?.pengaturan;

        let resolvedCbtEnabled: boolean;
        let resolvedSpmbEnabled: boolean;

        if (cbtSpmbResponse && (cbtSpmbResponse as any).success) {
          resolvedCbtEnabled = (cbtSpmbResponse as any).cbtEnabled ?? true;
          resolvedSpmbEnabled = (cbtSpmbResponse as any).spmbEnabled ?? true;
        } else if (pengaturan) {
          resolvedCbtEnabled = pengaturan.cbtEnabled ?? true;
          resolvedSpmbEnabled = pengaturan.spmbEnabled ?? true;
        } else {
          resolvedCbtEnabled = true;
          resolvedSpmbEnabled = true;
        }

        const data = { 
          enableEarlyDeparture: earlyDepartureResponse.enableEarlyDeparture ?? false,
          systemType: systemTypeResponse.systemType ?? null,
          cbtEnabled: resolvedCbtEnabled,
          spmbEnabled: resolvedSpmbEnabled,
        };
        // Update cache only if systemType is set
        if (data.systemType) {
          globalPengaturanCache = data;
          globalPengaturanCacheTime = Date.now();
        }
        setEnableEarlyDeparture(data.enableEarlyDeparture);
        setSystemType(data.systemType);
        setCbtEnabled(data.cbtEnabled);
        setSpmbEnabled(data.spmbEnabled);
      } else {
        setError(earlyDepartureResponse.message || systemTypeResponse.message || 'Gagal mengambil pengaturan sistem');
        setEnableEarlyDeparture(false);
        setSystemType(null);
        setCbtEnabled(true);
        setSpmbEnabled(true);
      }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil pengaturan sistem');
        console.error('Error fetching pengaturan sistem:', err);
        setEnableEarlyDeparture(false);
        setSystemType(null);
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
          systemType: systemType,
          cbtEnabled,
          spmbEnabled,
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
          systemType: value,
          cbtEnabled,
          spmbEnabled,
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

  const updateCbtEnabled = async (value: boolean) => {
    try {
      const response = await apiService.updatePengaturanSistem({ cbtEnabled: value });
      if (response.success) {
        globalPengaturanCache = {
          enableEarlyDeparture,
          systemType,
          cbtEnabled: value,
          spmbEnabled,
        };
        globalPengaturanCacheTime = Date.now();
        setCbtEnabled(value);
        return true;
      } else {
        throw new Error(response.message || 'Gagal memperbarui pengaturan CBT');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui pengaturan CBT');
      console.error('Error updating CBT pengaturan sistem:', err);
      throw err;
    }
  };

  const updateSpmbEnabled = async (value: boolean) => {
    try {
      const response = await apiService.updatePengaturanSistem({ spmbEnabled: value });
      if (response.success) {
        globalPengaturanCache = {
          enableEarlyDeparture,
          systemType,
          cbtEnabled,
          spmbEnabled: value,
        };
        globalPengaturanCacheTime = Date.now();
        setSpmbEnabled(value);
        return true;
      } else {
        throw new Error(response.message || 'Gagal memperbarui pengaturan SPMB');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui pengaturan SPMB');
      console.error('Error updating SPMB pengaturan sistem:', err);
      throw err;
    }
  };

  return { 
    enableEarlyDeparture, 
    systemType,
    cbtEnabled,
    spmbEnabled,
    loading, 
    error, 
    refreshPengaturanSistem, 
    updateEnableEarlyDeparture,
    updateSystemType,
    updateCbtEnabled,
    updateSpmbEnabled,
  };
};

// Export function to clear cache
export const clearPengaturanCache = () => {
  globalPengaturanCache = null;
  globalPengaturanCacheTime = 0;
  globalPengaturanLoadingPromise = null;
};

// Pre-populate the cache so subsequent usePengaturanSistem() calls
// initialize with the correct systemType on first render (no flash).
export const prewarmPengaturanCache = (systemType: string | null, enableEarlyDeparture?: boolean) => {
  if (systemType) {
    globalPengaturanCache = {
      enableEarlyDeparture: enableEarlyDeparture ?? globalPengaturanCache?.enableEarlyDeparture ?? false,
      systemType,
    };
    globalPengaturanCacheTime = Date.now();
  }
};

