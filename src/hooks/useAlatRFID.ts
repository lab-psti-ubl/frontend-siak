import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { AlatRFID } from '../types';

// Global cache untuk semua instance hook
let globalAlatRFIDCache: AlatRFID[] | null = null;
let globalAlatRFIDCacheTime: number = 0;
let globalAlatRFIDLoadingPromise: Promise<AlatRFID[]> | null = null;

const CACHE_DURATION = 1500000; // 15 menit (1500000 ms)

export const useAlatRFID = () => {
  const [alatRFID, setAlatRFID] = useState<AlatRFID[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache validity
    const cacheValid = globalAlatRFIDCache && 
                      (Date.now() - globalAlatRFIDCacheTime) < CACHE_DURATION;

    if (cacheValid) {
      // Use cached data
      setAlatRFID(globalAlatRFIDCache);
      setLoading(false);
      return;
    }

    // If there's already a request in progress, wait for it
    if (globalAlatRFIDLoadingPromise) {
      globalAlatRFIDLoadingPromise
        .then(data => {
          setAlatRFID(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Terjadi kesalahan saat mengambil data alat RFID');
          setLoading(false);
        });
      return;
    }

    // Make new request
    setLoading(true);
    setError(null);
    
    globalAlatRFIDLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllAlatRFID();
        if (response.success && response.alatRfid) {
          // Update cache
          globalAlatRFIDCache = response.alatRfid;
          globalAlatRFIDCacheTime = Date.now();
          
          setAlatRFID(response.alatRfid);
          setLoading(false);
          return response.alatRfid;
        } else {
          throw new Error(response.message || 'Gagal mengambil data alat RFID');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data alat RFID');
        console.error('Error fetching alat RFID:', err);
        setLoading(false);
        throw err;
      } finally {
        globalAlatRFIDLoadingPromise = null;
      }
    })();
  }, []);

  const refreshAlatRFID = async () => {
    // Clear cache and force refresh
    globalAlatRFIDCache = null;
    globalAlatRFIDCacheTime = 0;
    globalAlatRFIDLoadingPromise = null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllAlatRFID();
      if (response.success && response.alatRfid) {
        globalAlatRFIDCache = response.alatRfid;
        globalAlatRFIDCacheTime = Date.now();
        setAlatRFID(response.alatRfid);
      } else {
        setError(response.message || 'Gagal mengambil data alat RFID');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data alat RFID');
      console.error('Error fetching alat RFID:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get enableEarlyDeparture from first active alat or first alat
  const enableEarlyDeparture = alatRFID.length > 0 
    ? (alatRFID.find(a => a.status === 'aktif')?.enableEarlyDeparture ?? alatRFID[0].enableEarlyDeparture ?? false)
    : false;

  return { alatRFID, loading, error, refreshAlatRFID, enableEarlyDeparture };
};

// Export function to clear all cache (useful when logging out)
export const clearAlatRFIDCache = () => {
  globalAlatRFIDCache = null;
  globalAlatRFIDCacheTime = 0;
  globalAlatRFIDLoadingPromise = null;
};

