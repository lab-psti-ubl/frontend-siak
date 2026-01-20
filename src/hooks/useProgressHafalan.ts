import { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export interface ProgressHafalan {
  id: string;
  santriId: string;
  juz: number;
  surat: string;
  ayatDari: number;
  ayatSampai: number;
  tanggal: string;
  keterangan?: string;
  hasilTes?: 'Mumtaz' | 'Jayid Jiddan' | 'Jayid' | 'Maqbul';
  tanggalTes?: string;
  tesOleh?: string;
  lafadzKesalahan?: string[];
  catatanPerbaikan?: string;
  poinPerbaikan?: {
    kelancaranHafalan: string;
    ketepatanAyat: string;
    tajwid: string;
    fashahah: string;
  };
  statusPerbaikan?: 'pending' | 'completed';
  riwayatTes?: Array<{
    hasilTes: string;
    tanggalTes: string;
    tesOleh: string;
    lafadzKesalahan: string[];
    catatanPerbaikan: string;
    createdAt: string;
  }>;
  createdBy: string;
  tahun: string;
  createdAt: string;
  updatedAt: string;
}

export const useProgressHafalan = (santriId?: string, tahun?: string) => {
  const [progressList, setProgressList] = useState<ProgressHafalan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        if (santriId) {
          response = await apiService.getProgressHafalanBySantri(santriId, tahun);
        } else {
          response = await apiService.getAllProgressHafalan(tahun, undefined);
        }
        
        if (response.success && response.data) {
          setProgressList(response.data);
        } else {
          setError(response.message || 'Gagal mengambil data progress hafalan');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat mengambil data progress hafalan');
        console.error('Error fetching progress hafalan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [santriId, tahun]);

  const addProgress = async (data: {
    santriId: string;
    juz: number;
    surat: string;
    ayatDari: number;
    ayatSampai: number;
    tanggal: string;
    keterangan?: string;
  }) => {
    try {
      const response = await apiService.addProgressHafalan(data);
      if (response.success) {
        // Refresh the list
        const refreshResponse = santriId
          ? await apiService.getProgressHafalanBySantri(santriId, tahun)
          : await apiService.getAllProgressHafalan(tahun, undefined);
        
        if (refreshResponse.success && refreshResponse.data) {
          setProgressList(refreshResponse.data);
        }
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Gagal menambahkan progress hafalan');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const updateProgress = async (id: string, data: {
    juz?: number;
    surat?: string;
    ayatDari?: number;
    ayatSampai?: number;
    tanggal?: string;
    keterangan?: string;
  }) => {
    try {
      const response = await apiService.updateProgressHafalan(id, data);
      if (response.success) {
        // Refresh the list
        const refreshResponse = santriId
          ? await apiService.getProgressHafalanBySantri(santriId, tahun)
          : await apiService.getAllProgressHafalan(tahun, undefined);
        
        if (refreshResponse.success && refreshResponse.data) {
          setProgressList(refreshResponse.data);
        }
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Gagal memperbarui progress hafalan');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const deleteProgress = async (id: string) => {
    try {
      const response = await apiService.deleteProgressHafalan(id);
      if (response.success) {
        // Refresh the list
        const refreshResponse = santriId
          ? await apiService.getProgressHafalanBySantri(santriId, tahun)
          : await apiService.getAllProgressHafalan(tahun, undefined);
        
        if (refreshResponse.success && refreshResponse.data) {
          setProgressList(refreshResponse.data);
        }
        return { success: true };
      } else {
        throw new Error(response.message || 'Gagal menghapus progress hafalan');
      }
    } catch (err: any) {
      throw err;
    }
  };

  const refreshProgress = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (santriId) {
        response = await apiService.getProgressHafalanBySantri(santriId, tahun);
      } else {
        response = await apiService.getAllProgressHafalan(tahun, undefined);
      }
      
      if (response.success && response.data) {
        setProgressList(response.data);
      } else {
        setError(response.message || 'Gagal mengambil data progress hafalan');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data progress hafalan');
      console.error('Error fetching progress hafalan:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveHasilTes = async (id: string, data: {
    hasilTes: 'Mumtaz' | 'Jayid Jiddan' | 'Jayid' | 'Maqbul';
    lafadzKesalahan?: string[];
    catatanPerbaikan?: string;
    poinPerbaikan?: {
      kelancaranHafalan: string;
      ketepatanAyat: string;
      tajwid: string;
      fashahah: string;
    };
    tanggalTes?: string;
  }) => {
    try {
      const response = await apiService.saveHasilTes(id, data);
      if (response.success) {
        // Refresh the list
        const refreshResponse = santriId
          ? await apiService.getProgressHafalanBySantri(santriId, tahun)
          : await apiService.getAllProgressHafalan(tahun, undefined);
        
        if (refreshResponse.success && refreshResponse.data) {
          setProgressList(refreshResponse.data);
        }
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Gagal menyimpan hasil tes');
      }
    } catch (err: any) {
      throw err;
    }
  };

  return {
    progressList,
    loading,
    error,
    addProgress,
    updateProgress,
    deleteProgress,
    refreshProgress,
    saveHasilTes,
  };
};
