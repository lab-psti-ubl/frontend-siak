import { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { TahfizSchedule } from '../types';

let globalJadwalTahfizCache: TahfizSchedule[] | null = null;
let globalJadwalTahfizCacheTime = 0;
let globalJadwalTahfizLoadingPromise: Promise<TahfizSchedule[]> | null = null;

const CACHE_DURATION = 300000; // 5 minutes

export const useJadwalTahfiz = () => {
  const [jadwalTahfiz, setJadwalTahfiz] = useState<TahfizSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cacheValid =
      globalJadwalTahfizCache &&
      Date.now() - globalJadwalTahfizCacheTime < CACHE_DURATION;

    if (cacheValid) {
      setJadwalTahfiz(globalJadwalTahfizCache);
      setLoading(false);
      return;
    }

    if (globalJadwalTahfizLoadingPromise) {
      globalJadwalTahfizLoadingPromise
        .then((data) => {
          setJadwalTahfiz(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(
            err.message ||
              'Terjadi kesalahan saat mengambil data jadwal tahfiz'
          );
          setLoading(false);
        });
      return;
    }

    setLoading(true);
    setError(null);

    globalJadwalTahfizLoadingPromise = (async () => {
      try {
        const response = await apiService.getAllJadwalTahfiz();
        if (response.success && response.jadwalTahfiz) {
          globalJadwalTahfizCache = response.jadwalTahfiz;
          globalJadwalTahfizCacheTime = Date.now();

          setJadwalTahfiz(response.jadwalTahfiz);
          setLoading(false);
          return response.jadwalTahfiz;
        }

        throw new Error(
          response.message || 'Gagal mengambil data jadwal tahfiz'
        );
      } catch (err: any) {
        setError(
          err.message || 'Terjadi kesalahan saat mengambil data jadwal tahfiz'
        );
        console.error('Error fetching jadwal tahfiz:', err);
        setLoading(false);
        throw err;
      } finally {
        globalJadwalTahfizLoadingPromise = null;
      }
    })() as Promise<TahfizSchedule[]>;
  }, []);

  const refreshJadwalTahfiz = async () => {
    globalJadwalTahfizCache = null;
    globalJadwalTahfizCacheTime = 0;
    globalJadwalTahfizLoadingPromise = null;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getAllJadwalTahfiz();
      if (response.success && response.jadwalTahfiz) {
        globalJadwalTahfizCache = response.jadwalTahfiz;
        globalJadwalTahfizCacheTime = Date.now();
        setJadwalTahfiz(response.jadwalTahfiz);
      } else {
        setError(response.message || 'Gagal mengambil data jadwal tahfiz');
      }
    } catch (err: any) {
      setError(
        err.message || 'Terjadi kesalahan saat mengambil data jadwal tahfiz'
      );
      console.error('Error fetching jadwal tahfiz:', err);
    } finally {
      setLoading(false);
    }
  };

  return { jadwalTahfiz, loading, error, refreshJadwalTahfiz };
};

export const clearJadwalTahfizCache = () => {
  globalJadwalTahfizCache = null;
  globalJadwalTahfizCacheTime = 0;
  globalJadwalTahfizLoadingPromise = null;
};

