import { useRef } from 'react';
import { AbsensiGuru, PengaturanAbsen, User } from '../../../../types';
import { calculateAttendanceStatus, getCurrentTimeIndonesia, getCurrentTimeLocal } from '../../../../utils/absensiUtils';
import {
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
} from '../../../../utils/notificationUtils';
import { apiService } from '../../../../services/apiService';
import {
  isAttendanceDayAllowed,
  getDayNameInIndonesian,
} from '../../../../utils/attendanceDayValidation';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { AbsensiGuruRefreshOptions } from '../../../../hooks/useAbsensiGuru';
import { ScanResult } from '../../../ui/QRScanner';

interface UseFaceAbsenGuruHandlersProps {
  user: User | null;
  refreshAbsensiGuru: (options?: AbsensiGuruRefreshOptions) => Promise<void>;
  activePengaturan: PengaturanAbsen | undefined;
  today: string;
  activeTahunAjaranId: string;
  semester: number;
}

export const useFaceAbsenGuruHandlers = ({
  user,
  refreshAbsensiGuru,
  activePengaturan,
  today,
  activeTahunAjaranId,
  semester,
}: UseFaceAbsenGuruHandlersProps) => {
  const isProcessingRef = useRef(false);
  const { enableEarlyDeparture } = usePengaturanSistem();

  const handleFaceAttendance = async (): Promise<ScanResult | null> => {
    const currentTime24 = getCurrentTimeIndonesia(); // untuk tampilan & validasi (WIB)
    const jamForDb = getCurrentTimeLocal(); // jam lokal perangkat untuk disimpan ke DB

    if (isProcessingRef.current) {
      // ignore multiple triggers
      return null;
    }

    isProcessingRef.current = true;

    if (!activePengaturan) {
      const result: ScanResult = {
        statusMessage: 'Pengaturan absen belum dikonfigurasi!',
        isError: true,
        errorType: 'not_registered',
      };
      showErrorNotification('Pengaturan Tidak Ditemukan', 'Pengaturan absen belum dikonfigurasi!');
      isProcessingRef.current = false;
      return result;
    }

    if (!user?.id) {
      const result: ScanResult = {
        statusMessage: 'Data user tidak ditemukan!',
        isError: true,
        errorType: 'not_registered',
      };
      showErrorNotification('User Tidak Ditemukan', 'Data user tidak ditemukan!');
      isProcessingRef.current = false;
      return result;
    }

    const pengaturanAbsenArray = activePengaturan ? [activePengaturan] : [];
    if (!isAttendanceDayAllowed(today, 'guru', pengaturanAbsenArray)) {
      const dayName = getDayNameInIndonesian(today);
      const result: ScanResult = {
        user,
        role: 'guru',
        timestamp: currentTime24,
        statusMessage: `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari kerja yang telah ditentukan.`,
        isError: true,
        errorType: 'not_registered',
      };
      showErrorNotification(
        'Absensi Tidak Diizinkan',
        `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari kerja yang telah ditentukan.`
      );
      isProcessingRef.current = false;
      return result;
    }

    try {
      const existingResponse = await apiService.getAbsensiGuruByGuruIdAndTanggal(user.id, today);
      const existingAbsensi =
        existingResponse.success && existingResponse.absensiGuru
          ? existingResponse.absensiGuru
          : null;

      if (existingAbsensi) {
        // Absen masuk: boleh update jika belum ada jam masuk ATAU status masuk alfa/tidak_masuk (edit manual dari admin)
        const bolehUpdateMasuk =
          !existingAbsensi.jamMasuk ||
          existingAbsensi.statusMasuk === 'alfa' ||
          existingAbsensi.statusMasuk === 'tidak_masuk';
        if (bolehUpdateMasuk) {
          // Validasi: jangan absen masuk jika sudah lewat jam pulang
          if (activePengaturan) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const [jamPulangHour, jamPulangMinute] = activePengaturan.jamPulang.split(':').map(Number);
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
            if (currentTimeMinutes > jamPulangMinutes) {
              const result: ScanResult = {
                user,
                role: 'guru',
                timestamp: currentTime24,
                statusMessage: `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). Anda tidak dapat melakukan absen masuk.`,
                isError: true,
                errorType: 'not_registered',
              };
              showErrorNotification(
                'Tidak Dapat Absen Masuk',
                `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). Anda tidak dapat melakukan absen masuk.`
              );
              isProcessingRef.current = false;
              return result;
            }
          }
          const statusMasuk = calculateAttendanceStatus(currentTime24, activePengaturan, 'masuk');
          const updatePayload: Partial<AbsensiGuru> = {
            ...existingAbsensi,
            guruId: user.id,
            tanggal: today,
            jamMasuk: jamForDb,
            statusMasuk: statusMasuk as 'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa',
            tahunAjaranId: activeTahunAjaranId,
            semester,
          };
          const updateResponse = await apiService.submitAbsensiGuruWithFallback(updatePayload);
          if (updateResponse.success) {
            await refreshAbsensiGuru({ waitForWorker: { guruId: user.id, tanggal: today } });
            const result: ScanResult = {
              user,
              role: 'guru',
              tipeAbsen: 'Masuk',
              status: statusMasuk,
              timestamp: currentTime24,
              statusMessage: `Absen masuk berhasil. Status: ${statusMasuk === 'tepat_waktu' ? 'Tepat Waktu' : statusMasuk === 'terlambat' ? 'Terlambat' : statusMasuk}`,
              isError: false,
            };
            showSuccessNotification('Absen Masuk Berhasil!', `Waktu: ${currentTime24}`);
            isProcessingRef.current = false;
            return result;
          }
          const result: ScanResult = {
            user,
            role: 'guru',
            tipeAbsen: 'Masuk',
            timestamp: currentTime24,
            statusMessage: updateResponse.message || 'Gagal memperbarui absensi masuk',
            isError: true,
            errorType: 'absen_failed',
          };
          showErrorNotification('Gagal Update Absensi', updateResponse.message || 'Gagal memperbarui absensi masuk');
          isProcessingRef.current = false;
          return result;
        }

        // Absen keluar: lakukan update jika belum ada jam keluar ATAU jam keluar ada tapi status alfa/tidak_keluar (edit manual dari admin)
        const bolehUpdateKeluar =
          !existingAbsensi.jamKeluar ||
          existingAbsensi.statusKeluar === 'alfa' ||
          existingAbsensi.statusKeluar === 'tidak_keluar';
        if (bolehUpdateKeluar) {
          if (!enableEarlyDeparture && activePengaturan) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const [jamPulangHour, jamPulangMinute] = activePengaturan.jamPulang
              .split(':')
              .map(Number);

            const currentTimeMinutes = currentHour * 60 + currentMinute;
            const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
            const batasPulang15Menit = jamPulangMinutes - 15;

            if (currentTimeMinutes < batasPulang15Menit) {
              const batasWaktuJam = Math.floor(batasPulang15Menit / 60);
              const batasWaktuMenit = batasPulang15Menit % 60;
              const batasWaktuString = `${String(batasWaktuJam).padStart(2, '0')}:${String(
                batasWaktuMenit
              ).padStart(2, '0')}`;

              const result: ScanResult = {
                user,
                role: 'guru',
                timestamp: currentTime24,
                statusMessage: `Absen pulang hanya dapat dilakukan mulai 15 menit sebelum jam pulang (${batasWaktuString}). Jam pulang: ${activePengaturan.jamPulang}`,
                isError: true,
                errorType: 'early_departure',
                departureTime: activePengaturan.jamPulang,
              };

              showErrorNotification(
                'Absen Pulang Tidak Diizinkan',
                `Absen pulang hanya dapat dilakukan mulai 15 menit sebelum jam pulang (${batasWaktuString}). Jam pulang: ${activePengaturan.jamPulang}`
              );
              isProcessingRef.current = false;
              return result;
            }
          }

          const statusKeluar = calculateAttendanceStatus(
            currentTime24,
            activePengaturan,
            'keluar'
          );

          const updated: Partial<AbsensiGuru> = {
            jamKeluar: jamForDb,
            statusKeluar:
              statusKeluar as
              | 'tepat_waktu'
              | 'pulang_awal'
              | 'tidak_keluar'
              | 'izin'
              | 'sakit'
              | 'alfa',
          };

          const isMasukHadir = ['tepat_waktu', 'terlambat'].includes(existingAbsensi.statusMasuk);
          const isKeluarHadir = ['tepat_waktu', 'pulang_awal'].includes(statusKeluar);
          const isKeluarDispen = ['izin', 'sakit'].includes(statusKeluar);

          if (isMasukHadir && isKeluarHadir) {
            updated.keterangan = 'Hadir';
            updated.keteranganAbsensi = 'Hadir';
          } else if (isMasukHadir && isKeluarDispen) {
            updated.keterangan = 'Dispen';
            updated.keteranganAbsensi = 'Dispen';
          }

          const updatePayload: Partial<AbsensiGuru> = {
            ...existingAbsensi,
            ...updated,
            guruId: user.id,
            tanggal: today,
            tahunAjaranId: activeTahunAjaranId,
            semester,
            statusMasuk: existingAbsensi.statusMasuk,
          };

          const updateResponse = await apiService.submitAbsensiGuruWithFallback(updatePayload);

          if (updateResponse.success) {
            await refreshAbsensiGuru({
              waitForWorker: { guruId: user.id, tanggal: today },
            });

            const result: ScanResult = {
              user,
              role: 'guru',
              tipeAbsen: 'Keluar',
              status: statusKeluar,
              timestamp: currentTime24,
              statusMessage: `Absen keluar berhasil. Status: ${
                statusKeluar === 'tepat_waktu'
                  ? 'Tepat Waktu'
                  : statusKeluar === 'pulang_awal'
                    ? 'Pulang Awal'
                    : statusKeluar
              }`,
              isError: false,
            };

            showSuccessNotification('Absen Keluar Berhasil!', `Waktu: ${currentTime24}`);
            isProcessingRef.current = false;
            return result;
          }

          const result: ScanResult = {
            user,
            role: 'guru',
            tipeAbsen: 'Keluar',
            timestamp: currentTime24,
            statusMessage: updateResponse.message || 'Gagal memperbarui absensi keluar',
            isError: true,
            errorType: 'absen_failed',
          };
          showErrorNotification(
            'Gagal Update Absensi',
            updateResponse.message || 'Gagal memperbarui absensi keluar'
          );
          isProcessingRef.current = false;
          return result;
        }

        const result: ScanResult = {
          user,
          role: 'guru',
          tipeAbsen: 'Sudah Terpenuhi',
          timestamp: currentTime24,
          statusMessage: 'Anda sudah melakukan absen masuk dan keluar hari ini!',
          isError: false,
          status: 'sudah_terpenuhi',
        };
        showWarningNotification(
          'Sudah Absen Lengkap',
          'Anda sudah melakukan absen masuk dan keluar hari ini!'
        );
        isProcessingRef.current = false;
        return result;
      }

      // Absen masuk baru
      if (activePengaturan) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [jamPulangHour, jamPulangMinute] = activePengaturan.jamPulang.split(':').map(Number);

        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;

        if (currentTimeMinutes > jamPulangMinutes) {
          const result: ScanResult = {
            user,
            role: 'guru',
            timestamp: currentTime24,
            statusMessage: `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). Anda tidak dapat melakukan absen masuk.`,
            isError: true,
            errorType: 'not_registered',
          };
          showErrorNotification(
            'Tidak Dapat Absen Masuk',
            `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). Anda tidak dapat melakukan absen masuk.`
          );
          isProcessingRef.current = false;
          return result;
        }
      }

      const statusMasuk = calculateAttendanceStatus(currentTime24, activePengaturan, 'masuk');
      const newAbsensi: Partial<AbsensiGuru> = {
        guruId: user.id,
        tanggal: today,
        jamMasuk: jamForDb,
        statusMasuk:
          statusMasuk as
          | 'tepat_waktu'
          | 'terlambat'
          | 'tidak_masuk'
          | 'izin'
          | 'sakit'
          | 'alfa',
        statusKeluar: 'tidak_keluar',
        tahunAjaranId: activeTahunAjaranId,
        semester,
      };

      const createResponse = await apiService.submitAbsensiGuruWithFallback(newAbsensi);

      if (createResponse.success) {
        await refreshAbsensiGuru({
          waitForWorker: { guruId: user.id, tanggal: today },
        });

        const result: ScanResult = {
          user,
          role: 'guru',
          tipeAbsen: 'Masuk',
          status: statusMasuk,
          timestamp: currentTime24,
          statusMessage: `Absen masuk berhasil. Status: ${
            statusMasuk === 'tepat_waktu'
              ? 'Tepat Waktu'
              : statusMasuk === 'terlambat'
                ? 'Terlambat'
                : statusMasuk
          }`,
          isError: false,
        };

        showSuccessNotification('Absen Masuk Berhasil!', `Waktu: ${currentTime24}`);
        isProcessingRef.current = false;
        return result;
      }

      const result: ScanResult = {
        user,
        role: 'guru',
        tipeAbsen: 'Masuk',
        timestamp: currentTime24,
        statusMessage: createResponse.message || 'Gagal membuat absensi masuk',
        isError: true,
        errorType: 'absen_failed',
      };
      showErrorNotification(
        'Gagal Buat Absensi',
        createResponse.message || 'Gagal membuat absensi masuk'
      );
      isProcessingRef.current = false;
      return result;
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Error processing face attendance:', error);
      const result: ScanResult = {
        user,
        role: 'guru',
        timestamp: currentTime24,
        statusMessage: error.message || 'Gagal memproses absensi',
        isError: true,
        errorType: 'absen_failed',
      };
      showErrorNotification('Terjadi Kesalahan', error.message || 'Gagal memproses absensi');
      isProcessingRef.current = false;
      return result;
    }
  };

  return {
    handleFaceAttendance,
  };
};

