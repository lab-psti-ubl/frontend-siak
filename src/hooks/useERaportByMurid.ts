import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { ERaport } from '../types';

interface UseERaportByMuridParams {
  muridId: string;
  kelasId: string;
  tahunAjaran: string;
  semester: number;
}

export const useERaportByMurid = (params?: UseERaportByMuridParams) => {
  const [eraport, setERaport] = useState<ERaport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.muridId || !params?.kelasId || !params?.tahunAjaran || !params?.semester) {
      setERaport(null);
      setLoading(false);
      return;
    }

    const fetchERaport = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiService.getERaportByMurid({
          muridId: params.muridId,
          kelasId: params.kelasId,
          tahunAjaran: params.tahunAjaran,
          semester: params.semester,
        });

        if (response.success && response.eraport) {
          setERaport(response.eraport);
        } else {
          setERaport(null);
          setError(response.message || 'Data E-Raport tidak ditemukan');
        }
      } catch (err: any) {
        setERaport(null);
        setError(err.message || 'Terjadi kesalahan saat mengambil data E-Raport');
        console.error('Error fetching E-Raport by murid:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchERaport();
  }, [params?.muridId, params?.kelasId, params?.tahunAjaran, params?.semester]);

  const refreshERaport = async () => {
    if (!params?.muridId || !params?.kelasId || !params?.tahunAjaran || !params?.semester) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getERaportByMurid({
        muridId: params.muridId,
        kelasId: params.kelasId,
        tahunAjaran: params.tahunAjaran,
        semester: params.semester,
      });

      if (response.success && response.eraport) {
        setERaport(response.eraport);
      } else {
        setERaport(null);
        setError(response.message || 'Data E-Raport tidak ditemukan');
      }
    } catch (err: any) {
      setERaport(null);
      setError(err.message || 'Terjadi kesalahan saat mengambil data E-Raport');
      console.error('Error fetching E-Raport by murid:', err);
    } finally {
      setLoading(false);
    }
  };

  return { eraport, loading, error, refreshERaport };
};


