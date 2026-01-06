import { useEffect, useRef } from 'react';
import { useGurus } from './useGurus';
import { useTahunAjaran } from './useTahunAjaran';
import { apiService } from '../services/apiService';
import { Guru } from '../types';
import { ensureRiwayatWaliKelas } from '../utils/riwayatWaliKelasUtils';

export const useRiwayatWaliKelas = (userId: string | undefined) => {
  const { gurus, refreshGurus } = useGurus();
  const { activeTahunAjaran } = useTahunAjaran();
  const prevUserRef = useRef<Guru | null>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!userId || !activeTahunAjaran) return;
    if (isUpdatingRef.current) return; // Prevent concurrent updates

    const currentUser = gurus.find(u => u.id === userId && u.role === 'guru') as Guru | undefined;
    if (!currentUser || !currentUser.isWaliKelas || !currentUser.kelasWali) {
      prevUserRef.current = null;
      return;
    }

    // Cek apakah kelasWali berubah
    const kelasWaliChanged = prevUserRef.current &&
                            prevUserRef.current.kelasWali !== currentUser.kelasWali;

    const updatedRiwayat = ensureRiwayatWaliKelas(
      currentUser,
      currentUser.kelasWali,
      activeTahunAjaran.tahun,
      activeTahunAjaran.semester
    );

    const riwayatChanged = JSON.stringify(updatedRiwayat) !== JSON.stringify(currentUser.riwayatKelasWali);

    if (riwayatChanged || kelasWaliChanged) {
      isUpdatingRef.current = true;
      
      // Update via API
      apiService.updateGuru(userId, {
        riwayatKelasWali: updatedRiwayat,
      })
        .then((response) => {
          if (response.success) {
            // Refresh gurus cache to get updated data
            refreshGurus();
          } else {
            console.error('Failed to update riwayat kelas wali:', response.message);
          }
        })
        .catch((error) => {
          console.error('Error updating riwayat kelas wali:', error);
        })
        .finally(() => {
          isUpdatingRef.current = false;
        });
    }

    prevUserRef.current = currentUser;
  }, [userId, gurus, activeTahunAjaran, refreshGurus]);
};
