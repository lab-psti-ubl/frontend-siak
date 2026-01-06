import { useState, useRef } from 'react';
import { AbsensiGuru, PengaturanAbsen, User } from '../../../../types';
import { parseQRCodeData, generateTeacherAttendanceQRCode, downloadQRCode, parseAdminAttendanceQRCode } from '../../../../utils/qrCodeGenerator';
import { calculateAttendanceStatus } from '../../../../utils/absensiUtils';
import { showSuccessNotification, showErrorNotification, showWarningNotification } from '../../../../utils/notificationUtils';
import { apiService } from '../../../../services/apiService';
import { isAttendanceDayAllowed, getDayNameInIndonesian } from '../../../../utils/attendanceDayValidation';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { ScanResult } from '../../../ui/QRScanner';

interface UseAbsenGuruHandlersProps {
  user: User | null;
  refreshAbsensiGuru: () => Promise<void>;
  activePengaturan: PengaturanAbsen | undefined;
  today: string;
  activeTahunAjaranId: string;
  semester: number;
}

const SCAN_DEBOUNCE_TIME = 3000;

export const useAbsenGuruHandlers = ({
  user,
  refreshAbsensiGuru,
  activePengaturan,
  today,
  activeTahunAjaranId,
  semester,
}: UseAbsenGuruHandlersProps) => {
  const [lastProcessedScan, setLastProcessedScan] = useState<{data: string, time: number} | null>(null);
  const isProcessingRef = useRef(false);
  const { enableEarlyDeparture } = usePengaturanSistem();

  const handleQRScan = async (qrData: string): Promise<ScanResult | null> => {
    const currentTime = Date.now();
    const currentTime24 = new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });

    if (isProcessingRef.current) {
      console.log('Scan still processing, ignoring...');
      return null;
    }

    if (lastProcessedScan &&
        lastProcessedScan.data === qrData &&
        (currentTime - lastProcessedScan.time) < SCAN_DEBOUNCE_TIME) {
      console.log('Duplicate QR scan detected, ignoring...');
      return null;
    }

    setLastProcessedScan({ data: qrData, time: currentTime });
    isProcessingRef.current = true;

    const parsed = parseQRCodeData(qrData);
    const adminParsed = parseAdminAttendanceQRCode(qrData);

    const isValidQR = parsed.isValid || adminParsed.isValid;

    if (!isValidQR) {
      const result: ScanResult = {
        statusMessage: 'QR Code tidak valid atau tidak dikenali!',
        isError: true,
        errorType: 'not_registered'
      };
      showErrorNotification('QR Code Tidak Valid', 'QR Code tidak valid atau tidak dikenali!');
      isProcessingRef.current = false;
      return result;
    }

    if (!adminParsed.isValid && parsed.kelasId !== 'admin') {
      const result: ScanResult = {
        statusMessage: 'Silakan scan QR Code admin untuk absensi!',
        isError: true,
        errorType: 'not_registered'
      };
      showErrorNotification('QR Code Salah', 'Silakan scan QR Code admin untuk absensi!');
      isProcessingRef.current = false;
      return result;
    }

    if (!activePengaturan) {
      const result: ScanResult = {
        statusMessage: 'Pengaturan absen belum dikonfigurasi!',
        isError: true,
        errorType: 'not_registered'
      };
      showErrorNotification('Pengaturan Tidak Ditemukan', 'Pengaturan absen belum dikonfigurasi!');
      isProcessingRef.current = false;
      return result;
    }

    if (!user?.id) {
      const result: ScanResult = {
        statusMessage: 'Data user tidak ditemukan!',
        isError: true,
        errorType: 'not_registered'
      };
      showErrorNotification('User Tidak Ditemukan', 'Data user tidak ditemukan!');
      isProcessingRef.current = false;
      return result;
    }

    // Check if today is a work day for guru
    const pengaturanAbsenArray = activePengaturan ? [activePengaturan] : [];
    if (!isAttendanceDayAllowed(today, 'guru', pengaturanAbsenArray)) {
      const dayName = getDayNameInIndonesian(today);
      const result: ScanResult = {
        user: user,
        role: 'guru',
        timestamp: currentTime24,
        statusMessage: `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari kerja yang telah ditentukan.`,
        isError: true,
        errorType: 'not_registered'
      };
      showErrorNotification(
        'Absensi Tidak Diizinkan',
        `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari kerja yang telah ditentukan.`
      );
      isProcessingRef.current = false;
      return result;
    }

    try {
      // Check if absensi exists for today
      const existingResponse = await apiService.getAbsensiGuruByGuruIdAndTanggal(user.id, today);
      const existingAbsensi = existingResponse.success && existingResponse.absensiGuru ? existingResponse.absensiGuru : null;

      if (existingAbsensi) {
        if (!existingAbsensi.jamKeluar) {
          // Check enableEarlyDeparture restriction
          if (!enableEarlyDeparture && activePengaturan) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const [jamPulangHour, jamPulangMinute] = activePengaturan.jamPulang.split(':').map(Number);
            
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
            const batasPulang15Menit = jamPulangMinutes - 15;

            // If trying to absen pulang before 15 minutes before jam pulang, reject
            if (currentTimeMinutes < batasPulang15Menit) {
              const batasWaktuJam = Math.floor(batasPulang15Menit / 60);
              const batasWaktuMenit = batasPulang15Menit % 60;
              const batasWaktuString = `${String(batasWaktuJam).padStart(2, '0')}:${String(batasWaktuMenit).padStart(2, '0')}`;
              
              const result: ScanResult = {
                user: user,
                role: 'guru',
                timestamp: currentTime24,
                statusMessage: `Absen pulang hanya dapat dilakukan mulai 15 menit sebelum jam pulang (${batasWaktuString}). Jam pulang: ${activePengaturan.jamPulang}`,
                isError: true,
                errorType: 'early_departure',
                departureTime: activePengaturan.jamPulang
              };
              
              showErrorNotification(
                'Absen Pulang Tidak Diizinkan',
                `Absen pulang hanya dapat dilakukan mulai 15 menit sebelum jam pulang (${batasWaktuString}). Jam pulang: ${activePengaturan.jamPulang}`
              );
              isProcessingRef.current = false;
              return result;
            }
          }

          // Update absensi keluar
          const statusKeluar = calculateAttendanceStatus(currentTime24, activePengaturan, 'keluar');
          
          const updated: Partial<AbsensiGuru> = {
            jamKeluar: currentTime24,
            statusKeluar: statusKeluar as 'tepat_waktu' | 'pulang_awal' | 'tidak_keluar' | 'izin' | 'sakit' | 'alfa',
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

          const updateResponse = await apiService.updateAbsensiGuru(existingAbsensi.id, updated);
          
          if (updateResponse.success) {
            await refreshAbsensiGuru();
            
            const result: ScanResult = {
              user: user,
              role: 'guru',
              tipeAbsen: 'Keluar',
              status: statusKeluar,
              timestamp: currentTime24,
              statusMessage: `Absen keluar berhasil. Status: ${statusKeluar === 'tepat_waktu' ? 'Tepat Waktu' : statusKeluar === 'pulang_awal' ? 'Pulang Awal' : statusKeluar}`,
              isError: false
            };
            
            showSuccessNotification('Absen Keluar Berhasil!', `Waktu: ${currentTime24}`);
            setTimeout(() => {
              isProcessingRef.current = false;
            }, SCAN_DEBOUNCE_TIME);
            return result;
          } else {
            const result: ScanResult = {
              user: user,
              role: 'guru',
              tipeAbsen: 'Keluar',
              timestamp: currentTime24,
              statusMessage: updateResponse.message || 'Gagal memperbarui absensi keluar',
              isError: true,
              errorType: 'absen_failed'
            };
            showErrorNotification('Gagal Update Absensi', updateResponse.message || 'Gagal memperbarui absensi keluar');
            isProcessingRef.current = false;
            return result;
          }
        } else {
          const result: ScanResult = {
            user: user,
            role: 'guru',
            tipeAbsen: 'Sudah Terpenuhi',
            timestamp: currentTime24,
            statusMessage: 'Anda sudah melakukan absen masuk dan keluar hari ini!',
            isError: false,
            status: 'sudah_terpenuhi'
          };
          showWarningNotification('Sudah Absen Lengkap', 'Anda sudah melakukan absen masuk dan keluar hari ini!');
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 1000);
          return result;
        }
      } else {
        // Check if current time has passed jam pulang
        if (activePengaturan) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const [jamPulangHour, jamPulangMinute] = activePengaturan.jamPulang.split(':').map(Number);
          
          const currentTimeMinutes = currentHour * 60 + currentMinute;
          const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
          
          if (currentTimeMinutes > jamPulangMinutes) {
            const result: ScanResult = {
              user: user,
              role: 'guru',
              timestamp: currentTime24,
              statusMessage: `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). Anda tidak dapat melakukan absen masuk.`,
              isError: true,
              errorType: 'not_registered'
            };
            showErrorNotification(
              'Tidak Dapat Absen Masuk', 
              `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). Anda tidak dapat melakukan absen masuk.`
            );
            isProcessingRef.current = false;
            return result;
          }
        }

        // Create new absensi masuk
        const statusMasuk = calculateAttendanceStatus(currentTime24, activePengaturan, 'masuk');
        const newAbsensi: Partial<AbsensiGuru> = {
          guruId: user.id,
          tanggal: today,
          jamMasuk: currentTime24,
          statusMasuk: statusMasuk as 'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa',
          statusKeluar: 'tidak_keluar',
          tahunAjaranId: activeTahunAjaranId,
          semester,
        };

        const createResponse = await apiService.createAbsensiGuru(newAbsensi);
        
        if (createResponse.success) {
          await refreshAbsensiGuru();
          
          const result: ScanResult = {
            user: user,
            role: 'guru',
            tipeAbsen: 'Masuk',
            status: statusMasuk,
            timestamp: currentTime24,
            statusMessage: `Absen masuk berhasil. Status: ${statusMasuk === 'tepat_waktu' ? 'Tepat Waktu' : statusMasuk === 'terlambat' ? 'Terlambat' : statusMasuk}`,
            isError: false
          };
          
          showSuccessNotification('Absen Masuk Berhasil!', `Waktu: ${currentTime24}`);
          setTimeout(() => {
            isProcessingRef.current = false;
          }, SCAN_DEBOUNCE_TIME);
          return result;
        } else {
          const result: ScanResult = {
            user: user,
            role: 'guru',
            tipeAbsen: 'Masuk',
            timestamp: currentTime24,
            statusMessage: createResponse.message || 'Gagal membuat absensi masuk',
            isError: true,
            errorType: 'absen_failed'
          };
          showErrorNotification('Gagal Buat Absensi', createResponse.message || 'Gagal membuat absensi masuk');
          isProcessingRef.current = false;
          return result;
        }
      }
    } catch (error: any) {
      console.error('Error processing QR scan:', error);
      const result: ScanResult = {
        user: user,
        role: 'guru',
        timestamp: currentTime24,
        statusMessage: error.message || 'Gagal memproses absensi',
        isError: true,
        errorType: 'absen_failed'
      };
      showErrorNotification('Terjadi Kesalahan', error.message || 'Gagal memproses absensi');
      isProcessingRef.current = false;
      return result;
    }
  };

  const downloadMyQR = async () => {
    if (user && user.role === 'guru') {
      const guru = user as any; // Cast to Guru type
      const qrData = generateTeacherAttendanceQRCode(user.id, user.name, guru.kelasWali, guru.nip);
      await downloadQRCode(qrData, `guru-qr-${user.name.replace(/\s+/g, '-')}`);
    }
  };

  return {
    handleQRScan,
    downloadMyQR,
  };
};
