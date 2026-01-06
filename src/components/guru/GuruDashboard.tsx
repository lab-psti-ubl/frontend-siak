import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ClipboardList, FileText, CheckCircle, AlertCircle, Camera, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import CameraCapture from '../ui/CameraCapture';
import GuruMenuCards from './GuruMenuCards';
import { useAuth } from '../../context/AuthContext';
import { useRiwayatWaliKelas } from '../../hooks/useRiwayatWaliKelas';
import { useJadwalPelajaran } from '../../hooks/useJadwalPelajaran';
import { useSesiAbsensi } from '../../hooks/useSesiAbsensi';
import { useSuratIzin } from '../../hooks/useSuratIzin';
import { useIzinGuru } from '../../hooks/useIzinGuru';
import { useKelas } from '../../hooks/useKelas';
import { useMataPelajaran } from '../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { useAbsensiGuru } from '../../hooks/useAbsensiGuru';
import { useMurid } from '../../hooks/useMurid';
import { useAbsensi } from '../../hooks/useAbsensi';
import { usePengaturanAbsen } from '../../hooks/usePengaturanAbsen';
import { usePengaturanSistem } from '../../hooks/usePengaturanSistem';
import { apiService } from '../../services/apiService';
import { calculateAttendanceStatus } from '../../utils/absensiUtils';
import { showSuccessNotification, showErrorNotification } from '../../utils/notificationUtils';
import { sseAbsenService } from '../../services/sseAbsenService';
import { isAttendanceDayAllowed, getDayNameInIndonesian } from '../../utils/attendanceDayValidation';
import { JadwalPelajaran, SesiAbsensi, SuratIzin, Kelas, MataPelajaran, IzinGuru, TahunAjaran, AbsensiGuru, Absensi } from '../../types';

const GuruDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useRiwayatWaliKelas(user?.id);
  const [isSubmittingMasuk, setIsSubmittingMasuk] = useState(false);
  const [isSubmittingPulang, setIsSubmittingPulang] = useState(false);
  
  // Get active tahun ajaran first
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  
  // Get data with filters based on active tahun ajaran
  const { jadwalPelajaran } = useJadwalPelajaran(
    activeTahunAjaran
      ? {
          guruId: user?.id,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : { guruId: user?.id }
  );
  
  const today = new Date().toISOString().split('T')[0];
  const { sesiAbsensi } = useSesiAbsensi({ tanggal: today });
  const { suratIzin } = useSuratIzin();
  const { izinGuru } = useIzinGuru({ guruId: user?.id });
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { absensiGuru, refreshAbsensiGuru, createAbsensiGuru, updateAbsensiGuru } = useAbsensiGuru(user?.id);
  const { activePengaturanAbsen } = usePengaturanAbsen();
  const { enableEarlyDeparture } = usePengaturanSistem();
  
  // Get murid and absensi for wali kelas statistics
  const { murid: muridKelas } = useMurid(
    user?.isWaliKelas && user?.kelasWali
      ? { kelasId: user.kelasWali, status: 'active' }
      : undefined
  );
  const { absensi: absensiKelas } = useAbsensi(
    user?.isWaliKelas && user?.kelasWali && activeTahunAjaran
      ? {
          kelasId: user.kelasWali,
          tahunAjaranId: activeTahunAjaran.id,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );
  
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [selectedJadwalForPhoto, setSelectedJadwalForPhoto] = React.useState<JadwalPelajaran | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = React.useState(false);

  // SSE listener untuk auto-alfa guru
  useEffect(() => {
    sseAbsenService.connect();

    const handleSSEEvent = (event: any) => {
      if (event.type === 'absen-guru-auto-alfa' || event.type === 'absen-update' || event.type === 'absen-auto-save') {
        refreshAbsensiGuru();
      }
    };

    const unsubscribe = sseAbsenService.subscribe(handleSSEEvent);

    return () => {
      unsubscribe();
      sseAbsenService.disconnect();
    };
  }, [refreshAbsensiGuru]);

  const currentDay = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();

  // Get guru's schedules
  const mySchedules = jadwalPelajaran.filter(j => 
    j.guruId === user?.id &&
    j.tahunAjaran === activeTahunAjaran?.tahun &&
    j.semester === activeTahunAjaran?.semester
  );
  const todaySchedules = mySchedules.filter(j => j.hari === currentDay);

  // Get today's sessions
  const todaySessions = sesiAbsensi.filter(s => 
    s.tanggal === today && 
    mySchedules.some(j => j.id === s.jadwalId)
  );

  // Get pending surat izin if wali kelas (only from kelas wali)
  const pendingSuratIzin = user?.isWaliKelas && user?.kelasWali ? 
    suratIzin.filter(s => {
      if (s.status !== 'menunggu') return false;
      // Filter by murid's kelasId
      const murid = muridKelas.find(m => m.id === s.muridId);
      return murid && (murid as any).kelasId === user.kelasWali;
    }) : [];
  
  // Get my izin guru (already filtered by guruId in hook)
  const pendingIzinGuru = izinGuru.filter(i => i.status === 'menunggu');
  const activeIzinGuru = izinGuru.find(i => {
    const todayDate = new Date().toISOString().split('T')[0];
    return i.status === 'diterima' &&
           i.jenis !== 'izin_dispen' &&
           i.tanggalMulai <= todayDate &&
           i.tanggalSelesai >= todayDate;
  });

  const pendingIzinGuruCount = pendingIzinGuru.length;

  // Get today's absensi guru
  const todayAbsensiGuru = absensiGuru.find(a => a.guruId === user?.id && a.tanggal === today);
  const hasMasuk = !!(todayAbsensiGuru?.jamMasuk || (todayAbsensiGuru?.statusMasuk && todayAbsensiGuru.statusMasuk !== 'tidak_masuk'));
  const hasPulang = !!(todayAbsensiGuru?.jamKeluar && todayAbsensiGuru?.statusKeluar && todayAbsensiGuru.statusKeluar !== 'tidak_keluar');
  
  // Format time to use dot instead of colon (12.20 instead of 12:20)
  const formatTimeWithDot = (timeString: string | undefined): string => {
    if (!timeString) return '-';
    try {
      // If it's an ISO timestamp, parse it first
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
      }
      // If it's already in HH:mm format, just replace colon with dot
      if (timeString.includes(':')) {
        return timeString.replace(':', '.');
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  // Get waktu masuk and pulang for display - handle both ISO format and HH:mm format
  const waktuMasuk = todayAbsensiGuru?.jamMasuk 
    ? (() => {
        try {
          // Try parsing as ISO datetime first
          const date = new Date(todayAbsensiGuru.jamMasuk);
          if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
          }
          // If not ISO, assume it's already in HH:mm format
          return todayAbsensiGuru.jamMasuk;
        } catch {
          return todayAbsensiGuru.jamMasuk;
        }
      })()
    : undefined;
  const waktuPulang = todayAbsensiGuru?.jamKeluar
    ? (() => {
        try {
          // Try parsing as ISO datetime first
          const date = new Date(todayAbsensiGuru.jamKeluar);
          if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
          }
          // If not ISO, assume it's already in HH:mm format
          return todayAbsensiGuru.jamKeluar;
        } catch {
          return todayAbsensiGuru.jamKeluar;
        }
      })()
    : undefined;

  // Get display status
  const getDisplayStatusMasuk = (): string => {
    if (!todayAbsensiGuru?.statusMasuk || !waktuMasuk) return 'Tepat Waktu';
    if (todayAbsensiGuru.statusMasuk === 'terlambat') return 'Terlambat';
    if (todayAbsensiGuru.statusMasuk === 'izin' || todayAbsensiGuru.statusMasuk === 'sakit' || todayAbsensiGuru.statusMasuk === 'alfa') {
      return todayAbsensiGuru.statusMasuk.charAt(0).toUpperCase() + todayAbsensiGuru.statusMasuk.slice(1);
    }
    return 'Tepat Waktu';
  };

  const getDisplayStatusPulang = (): string => {
    if (!todayAbsensiGuru?.statusKeluar || !waktuPulang || todayAbsensiGuru.statusKeluar === 'tidak_keluar') return 'Tepat Waktu';
    if (todayAbsensiGuru.statusKeluar === 'pulang_awal') return 'Pulang Cepat';
    if (todayAbsensiGuru.statusKeluar === 'izin' || todayAbsensiGuru.statusKeluar === 'sakit' || todayAbsensiGuru.statusKeluar === 'alfa') {
      // Untuk alfa, tampilkan "Tidak Absen"
      return todayAbsensiGuru.statusKeluar === 'alfa' ? 'Tidak Absen' : todayAbsensiGuru.statusKeluar.charAt(0).toUpperCase() + todayAbsensiGuru.statusKeluar.slice(1);
    }
    return 'Tepat Waktu';
  };

  // Handle Absen Masuk
  const handleAbsenMasuk = async () => {
    if (!user || !activeTahunAjaran) {
      showErrorNotification('Error', 'Data tidak lengkap');
      return;
    }

    if (hasMasuk) {
      showErrorNotification('Sudah Absen', 'Anda sudah melakukan absen masuk hari ini');
      return;
    }

    // Check if today is a work day for guru
    const pengaturanAbsenArray = activePengaturanAbsen ? [activePengaturanAbsen] : [];
    if (!isAttendanceDayAllowed(today, 'guru', pengaturanAbsenArray)) {
      const dayName = getDayNameInIndonesian(today);
      showErrorNotification(
        'Absensi Tidak Diizinkan',
        `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari kerja yang telah ditentukan.`
      );
      return;
    }

    // Check if current time has passed jam pulang
    if (activePengaturanAbsen) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [jamPulangHour, jamPulangMinute] = activePengaturanAbsen.jamPulang.split(':').map(Number);
      
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
      
      if (currentTimeMinutes > jamPulangMinutes) {
        showErrorNotification(
          'Tidak Dapat Absen Masuk', 
          `Waktu absen masuk sudah melewati jam pulang (${activePengaturanAbsen.jamPulang}). Anda tidak dapat melakukan absen masuk.`
        );
        return;
      }
    }

    setIsSubmittingMasuk(true);
    try {
      const now = new Date();
      const currentTime24 = now.toTimeString().slice(0, 5); // Format HH:mm
      const statusMasuk = activePengaturanAbsen 
        ? calculateAttendanceStatus(currentTime24, activePengaturanAbsen, 'masuk')
        : 'tepat_waktu';

      const newAbsensi: Partial<AbsensiGuru> = {
        guruId: user.id,
        tanggal: today,
        jamMasuk: now.toISOString(),
        statusMasuk: statusMasuk as 'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa',
        statusKeluar: 'tidak_keluar',
        tahunAjaranId: activeTahunAjaran.id,
        semester: activeTahunAjaran.semester,
      };

      await createAbsensiGuru(newAbsensi);
      await refreshAbsensiGuru();
      showSuccessNotification('Absen Masuk Berhasil', `Waktu: ${currentTime24}`);
    } catch (error) {
      console.error('Error creating absen masuk:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan absen masuk';
      showErrorNotification('Error', errorMessage);
    } finally {
      setIsSubmittingMasuk(false);
    }
  };

  // Handle Absen Pulang
  const handleAbsenPulang = async () => {
    if (!user || !activeTahunAjaran) {
      showErrorNotification('Error', 'Data tidak lengkap');
      return;
    }

    if (hasPulang) {
      showErrorNotification('Sudah Absen', 'Anda sudah melakukan absen pulang hari ini');
      return;
    }

    if (!hasMasuk) {
      showErrorNotification('Belum Absen Masuk', 'Silakan lakukan absen masuk terlebih dahulu');
      return;
    }

    // Check if today is a work day for guru
    const pengaturanAbsenArray = activePengaturanAbsen ? [activePengaturanAbsen] : [];
    if (!isAttendanceDayAllowed(today, 'guru', pengaturanAbsenArray)) {
      const dayName = getDayNameInIndonesian(today);
      showErrorNotification(
        'Absensi Tidak Diizinkan',
        `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari kerja yang telah ditentukan.`
      );
      return;
    }

    if (!todayAbsensiGuru) {
      showErrorNotification('Error', 'Data absensi tidak ditemukan');
      return;
    }

    // Check enableEarlyDeparture restriction
    if (!enableEarlyDeparture && activePengaturanAbsen) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [jamPulangHour, jamPulangMinute] = activePengaturanAbsen.jamPulang.split(':').map(Number);
      
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
      const batasPulang15Menit = jamPulangMinutes - 15;

      // If trying to absen pulang before 15 minutes before jam pulang, reject
      if (currentTimeMinutes < batasPulang15Menit) {
        const batasWaktuJam = Math.floor(batasPulang15Menit / 60);
        const batasWaktuMenit = batasPulang15Menit % 60;
        const batasWaktuString = `${String(batasWaktuJam).padStart(2, '0')}:${String(batasWaktuMenit).padStart(2, '0')}`;
        
        showErrorNotification(
          'Absen Pulang Tidak Diizinkan',
          `Absen pulang hanya dapat dilakukan mulai 15 menit sebelum jam pulang (${batasWaktuString}). Jam pulang: ${activePengaturanAbsen.jamPulang}`
        );
        return;
      }
    }

    setIsSubmittingPulang(true);
    try {
      const now = new Date();
      const currentTime24 = now.toTimeString().slice(0, 5); // Format HH:mm
      const statusKeluar = activePengaturanAbsen
        ? calculateAttendanceStatus(currentTime24, activePengaturanAbsen, 'keluar')
        : 'tepat_waktu';

      const updateData: Partial<AbsensiGuru> = {
        jamKeluar: now.toISOString(),
        statusKeluar: statusKeluar === 'pulang_awal' ? 'pulang_awal' : 'tepat_waktu',
      };

      await updateAbsensiGuru(todayAbsensiGuru.id, updateData);
      await refreshAbsensiGuru();
      showSuccessNotification('Absen Pulang Berhasil', `Waktu: ${currentTime24}`);
    } catch (error) {
      console.error('Error updating absen pulang:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan absen pulang';
      showErrorNotification('Error', errorMessage);
    } finally {
      setIsSubmittingPulang(false);
    }
  };

  // Get status text for today
  const getStatusText = () => {
    // Check for izin/sakit/cuti status
    if (todayAbsensiGuru?.statusMasuk === 'izin' || todayAbsensiGuru?.statusKeluar === 'izin') {
      // Check if there's an active izin with jenis 'cuti'
      if (activeIzinGuru && activeIzinGuru.jenis === 'cuti') {
        return 'CUTI';
      }
      return 'IZIN';
    }
    if (todayAbsensiGuru?.statusMasuk === 'sakit' || todayAbsensiGuru?.statusKeluar === 'sakit') {
      return 'SAKIT';
    }
    if (todayAbsensiGuru?.statusMasuk === 'alfa' || todayAbsensiGuru?.statusKeluar === 'alfa') {
      return 'ALFA';
    }
    // Jika ada absen masuk tapi absen pulangnya alfa
    if (hasMasuk && todayAbsensiGuru?.statusKeluar === 'alfa') {
      return 'Anda Bolos, Tidak Absen Pulang';
    }
    if (hasMasuk && hasPulang) {
      return 'Sudah absen masuk dan pulang';
    }
    if (hasMasuk) {
      return 'Sudah absen masuk';
    }
    return 'Belum absen masuk';
  };

  // Get status bar background color based on status
  const getStatusBarColor = () => {
    // Check for izin/sakit/cuti status (check both masuk and keluar)
    const statusMasuk = todayAbsensiGuru?.statusMasuk;
    const statusKeluar = todayAbsensiGuru?.statusKeluar;
    
    // Check if there's an active izin with jenis 'cuti'
    if ((statusMasuk === 'izin' || statusKeluar === 'izin') && activeIzinGuru && activeIzinGuru.jenis === 'cuti') {
      return 'bg-gradient-to-r from-purple-500 to-purple-600';
    }
    if (statusMasuk === 'izin' || statusKeluar === 'izin') {
      return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    }
    if (statusMasuk === 'sakit' || statusKeluar === 'sakit') {
      return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
    if (statusMasuk === 'alfa' || statusKeluar === 'alfa') {
      return 'bg-gradient-to-r from-red-500 to-red-600';
    }
    
    // Jika ada absen masuk tapi absen pulangnya alfa
    if (hasMasuk && todayAbsensiGuru?.statusKeluar === 'alfa') {
      return 'bg-gradient-to-r from-red-500 to-red-600';
    }
    
    // Jika sudah absen masuk dan pulang
    if (hasMasuk && hasPulang) {
      return 'bg-gradient-to-r from-orange-500 to-orange-600';
    }
    
    // Jika sudah absen masuk saja
    if (hasMasuk) {
      return 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700';
    }
    
    // Default: belum absen masuk
    return 'bg-gradient-to-r from-orange-500 to-orange-600';
  };

  const stats = [
    {
      title: 'Jadwal Hari Ini',
      value: todaySchedules.length,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Sesi Aktif',
      value: todaySessions.filter(s => s.status === 'dibuka').length,
      icon: Clock,
      color: 'bg-emerald-500',
    },
    {
      title: 'Total Jadwal',
      value: mySchedules.length,
      icon: ClipboardList,
      color: 'bg-purple-500',
    },
    ...(user?.isWaliKelas ? [{
      title: 'Surat Izin Pending',
      value: pendingSuratIzin.length,
      icon: FileText,
      color: 'bg-orange-500',
    }] : []),
    {
      title: 'Izin Saya Pending',
      value: pendingIzinGuruCount,
      icon: FileText,
      color: 'bg-yellow-500',
    },
  ];

  const handleTakePhoto = (jadwal: JadwalPelajaran) => {
    setSelectedJadwalForPhoto(jadwal);
    setIsCameraOpen(true);
  };

  const handlePhotoCapture = async (imageBase64: string) => {
    if (!selectedJadwalForPhoto || !user || !activeTahunAjaran) return;

    setIsSavingPhoto(true);

    try {
      // Find or create today's absensi guru record
      const todayAbsensi = absensiGuru.find(a => a.guruId === user.id && a.tanggal === today);
      
      // Backend expects url and timestamp, but we'll use base64 as url for now
      const newFoto = {
        id: `foto-${Date.now()}`,
        jadwalId: selectedJadwalForPhoto.id,
        url: imageBase64, // Store base64 as url (backend schema uses url)
        timestamp: new Date().toISOString(),
      };

      if (todayAbsensi) {
        // Update existing record
        const updatedFotoMengajar = [...(todayAbsensi.fotoMengajar || []), newFoto];
        const response = await apiService.updateAbsensiGuru(todayAbsensi.id, {
          fotoMengajar: updatedFotoMengajar,
        });

        if (response.success) {
          // Refresh absensi guru data
          await refreshAbsensiGuru();
          alert('Foto bukti mengajar berhasil disimpan!');
        } else {
          throw new Error(response.message || 'Gagal menyimpan foto');
        }
      } else {
        // Create new record with photo
        const newAbsensi: Partial<AbsensiGuru> = {
          guruId: user.id,
          tanggal: today,
          statusMasuk: 'tidak_masuk',
          statusKeluar: 'tidak_keluar',
          fotoMengajar: [newFoto],
          keterangan: 'Foto bukti mengajar',
          tahunAjaranId: activeTahunAjaran.id || activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        };

        const response = await apiService.createAbsensiGuru(newAbsensi);

        if (response.success) {
          // Refresh absensi guru data
          await refreshAbsensiGuru();
          alert('Foto bukti mengajar berhasil disimpan!');
        } else {
          throw new Error(response.message || 'Gagal menyimpan foto');
        }
      }

      setSelectedJadwalForPhoto(null);
    } catch (error: any) {
      console.error('Error saving photo:', error);
      alert(error.message || 'Gagal menyimpan foto bukti mengajar');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const getKelasName = (kelasId: string) => {
    return kelas.find(k => k.id === kelasId)?.name || 'Unknown';
  };

  const getMapelName = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
  };

  const hasPhotoForJadwal = (jadwalId: string) => {
    const todayAbsensi = absensiGuru.find(a => a.guruId === user?.id && a.tanggal === today);
    return todayAbsensi?.fotoMengajar?.some(f => f.jadwalId === jadwalId) || false;
  };

  const isJadwalFinished = (jadwal: JadwalPelajaran) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= jadwal.jamSelesai;
  };

  const hasSessionOpened = (jadwalId: string) => {
    return todaySessions.some(s => s.jadwalId === jadwalId);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Selamat Datang, {user?.name}!
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                {activeTahunAjaran?.tahun || ''} Semester {activeTahunAjaran?.semester || ''} - {user?.isWaliKelas ? 'Wali Kelas' : 'Guru Mata Pelajaran'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Absen Masuk & Pulang Buttons - Mobile & Tablet Only - Hanya untuk guru aktif */}
      {user && user.role === 'guru' && (
        <div className="lg:hidden space-y-4">
          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Absen Masuk Button */}
            {hasMasuk && todayAbsensiGuru?.statusMasuk !== 'izin' && todayAbsensiGuru?.statusMasuk !== 'sakit' && todayAbsensiGuru?.statusMasuk !== 'alfa' ? (
              // Display mode: Show time and status
              <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl shadow-lg p-4 sm:p-5 border border-slate-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-400/30 rounded-lg flex items-center justify-center">
                    <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                  </div>
                  <span className="text-slate-600 font-bold text-sm sm:text-base uppercase">Masuk</span>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-600 font-bold text-2xl sm:text-3xl">
                    {formatTimeWithDot(waktuMasuk)}
                  </p>
                  <p className="text-slate-600 text-xs sm:text-sm font-medium">
                    {getDisplayStatusMasuk()}
                  </p>
                </div>
              </div>
            ) : (todayAbsensiGuru?.statusMasuk === 'izin' || todayAbsensiGuru?.statusMasuk === 'sakit') ? (
              // Display mode: Show IZIN/SAKIT/CUTI status
              <div className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
                (todayAbsensiGuru?.statusMasuk === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                  ? 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300'
                  : todayAbsensiGuru?.statusMasuk === 'izin'
                  ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300'
                  : 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                    (todayAbsensiGuru?.statusMasuk === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                      ? 'bg-purple-400/30'
                      : todayAbsensiGuru?.statusMasuk === 'izin'
                      ? 'bg-yellow-400/30'
                      : 'bg-blue-400/30'
                  }`}>
                    <LogIn className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      (todayAbsensiGuru?.statusMasuk === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                        ? 'text-purple-600'
                        : todayAbsensiGuru?.statusMasuk === 'izin'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <span className={`font-bold text-sm sm:text-base uppercase ${
                    (todayAbsensiGuru?.statusMasuk === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                      ? 'text-purple-600'
                      : todayAbsensiGuru?.statusMasuk === 'izin'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}>Masuk</span>
                </div>
                <div className="space-y-1">
                  <p className={`font-bold text-2xl sm:text-3xl uppercase ${
                    (todayAbsensiGuru?.statusMasuk === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                      ? 'text-purple-700'
                      : todayAbsensiGuru?.statusMasuk === 'izin'
                      ? 'text-yellow-700'
                      : 'text-blue-700'
                  }`}>
                    {(todayAbsensiGuru?.statusMasuk === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                      ? 'CUTI'
                      : todayAbsensiGuru?.statusMasuk === 'izin'
                      ? 'IZIN'
                      : 'SAKIT'}
                  </p>
                  <p className={`text-xs sm:text-sm font-medium ${
                    (todayAbsensiGuru?.statusMasuk === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                      ? 'text-purple-600'
                      : todayAbsensiGuru?.statusMasuk === 'izin'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}>
                    Tidak Perlu Absen
                  </p>
                </div>
              </div>
            ) : (
              // Button mode: Clickable or disabled
              <button
                onClick={handleAbsenMasuk}
                disabled={
                  isSubmittingMasuk ||
                  hasMasuk ||
                  todayAbsensiGuru?.statusMasuk === 'izin' ||
                  todayAbsensiGuru?.statusMasuk === 'sakit' ||
                  todayAbsensiGuru?.statusMasuk === 'alfa'
                }
                className={`relative flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-2xl shadow-lg transition-all duration-200 ${
                  isSubmittingMasuk ||
                  hasMasuk ||
                  todayAbsensiGuru?.statusMasuk === 'izin' ||
                  todayAbsensiGuru?.statusMasuk === 'sakit' ||
                  todayAbsensiGuru?.statusMasuk === 'alfa'
                    ? 'bg-gradient-to-br from-slate-200 to-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 active:scale-95 shadow-blue-500/50'
                }`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                  isSubmittingMasuk ||
                  hasMasuk ||
                  todayAbsensiGuru?.statusMasuk === 'izin' ||
                  todayAbsensiGuru?.statusMasuk === 'sakit' ||
                  todayAbsensiGuru?.statusMasuk === 'alfa'
                    ? 'bg-slate-400/30'
                    : 'bg-white/20 backdrop-blur-sm'
                }`}>
                  <LogIn className={`w-6 h-6 sm:w-8 sm:h-8 ${
                    isSubmittingMasuk ||
                    hasMasuk ||
                    todayAbsensiGuru?.statusMasuk === 'izin' ||
                    todayAbsensiGuru?.statusMasuk === 'sakit' ||
                    todayAbsensiGuru?.statusMasuk === 'alfa'
                      ? 'text-slate-600'
                      : 'text-white'
                  }`} />
                </div>
                <span className={`font-semibold text-sm sm:text-base text-center ${
                  isSubmittingMasuk ||
                  hasMasuk ||
                  todayAbsensiGuru?.statusMasuk === 'izin' ||
                  todayAbsensiGuru?.statusMasuk === 'sakit' ||
                  todayAbsensiGuru?.statusMasuk === 'alfa'
                    ? 'text-slate-600'
                    : 'text-white'
                }`}>Absen Masuk</span>
                {isSubmittingMasuk && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            )}

            {/* Absen Pulang Button */}
            {hasPulang && (waktuPulang || todayAbsensiGuru?.statusKeluar === 'alfa') && todayAbsensiGuru?.statusKeluar !== 'izin' && todayAbsensiGuru?.statusKeluar !== 'sakit' ? (
              // Display mode: Show time and status (termasuk alfa)
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-lg p-4 sm:p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-300/30 rounded-lg flex items-center justify-center">
                    <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                  </div>
                  <span className="text-slate-500 font-bold text-sm sm:text-base uppercase">Pulang</span>
                </div>
                <div className="space-y-1">
                  <p className={`font-bold text-2xl sm:text-3xl ${
                    todayAbsensiGuru?.statusKeluar === 'alfa' 
                      ? 'text-slate-500 uppercase' 
                      : 'text-slate-500'
                  }`}>
                    {todayAbsensiGuru?.statusKeluar === 'alfa' 
                      ? 'ALFA' 
                      : formatTimeWithDot(waktuPulang)}
                  </p>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    {getDisplayStatusPulang()}
                  </p>
                </div>
              </div>
            ) : (todayAbsensiGuru?.statusKeluar === 'izin' || todayAbsensiGuru?.statusKeluar === 'sakit') ? (
              // Display mode: Show IZIN/SAKIT/CUTI status
              <div className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
                (todayAbsensiGuru?.statusKeluar === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                  ? 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300'
                  : todayAbsensiGuru?.statusKeluar === 'izin'
                  ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300'
                  : 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                    (todayAbsensiGuru?.statusKeluar === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                      ? 'bg-purple-400/30'
                      : todayAbsensiGuru?.statusKeluar === 'izin'
                      ? 'bg-yellow-400/30'
                      : 'bg-blue-400/30'
                  }`}>
                    <LogOut className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      (todayAbsensiGuru?.statusKeluar === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                        ? 'text-purple-600'
                        : todayAbsensiGuru?.statusKeluar === 'izin'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <span className={`font-bold text-sm sm:text-base uppercase ${
                    (todayAbsensiGuru?.statusKeluar === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                      ? 'text-purple-600'
                      : todayAbsensiGuru?.statusKeluar === 'izin'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}>Pulang</span>
                </div>
                <div className="space-y-1">
                  <p className={`font-bold text-2xl sm:text-3xl uppercase ${
                    (todayAbsensiGuru?.statusKeluar === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                      ? 'text-purple-700'
                      : todayAbsensiGuru?.statusKeluar === 'izin'
                      ? 'text-yellow-700'
                      : 'text-blue-700'
                  }`}>
                    {(todayAbsensiGuru?.statusKeluar === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                      ? 'CUTI'
                      : todayAbsensiGuru?.statusKeluar === 'izin'
                      ? 'IZIN'
                      : 'SAKIT'}
                  </p>
                  <p className={`text-xs sm:text-sm font-medium ${
                    (todayAbsensiGuru?.statusKeluar === 'izin' && activeIzinGuru && activeIzinGuru.jenis === 'cuti')
                      ? 'text-purple-600'
                      : todayAbsensiGuru?.statusKeluar === 'izin'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}>
                    Tidak Perlu Absen
                  </p>
                </div>
              </div>
            ) : (
              // Button mode: Clickable or disabled
              <button
                onClick={handleAbsenPulang}
                disabled={
                  isSubmittingPulang ||
                  !hasMasuk ||
                  hasPulang ||
                  todayAbsensiGuru?.statusKeluar === 'izin' ||
                  todayAbsensiGuru?.statusKeluar === 'sakit' ||
                  todayAbsensiGuru?.statusKeluar === 'alfa'
                }
                className={`relative flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-2xl shadow-lg transition-all duration-200 ${
                  isSubmittingPulang ||
                  !hasMasuk ||
                  hasPulang ||
                  todayAbsensiGuru?.statusKeluar === 'izin' ||
                  todayAbsensiGuru?.statusKeluar === 'sakit' ||
                  todayAbsensiGuru?.statusKeluar === 'alfa'
                    ? 'bg-gradient-to-br from-slate-100 to-slate-200 cursor-not-allowed'
                    : 'bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:via-orange-600 hover:to-orange-700 active:scale-95 shadow-orange-500/50'
                }`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                  isSubmittingPulang ||
                  !hasMasuk ||
                  hasPulang ||
                  todayAbsensiGuru?.statusKeluar === 'izin' ||
                  todayAbsensiGuru?.statusKeluar === 'sakit' ||
                  todayAbsensiGuru?.statusKeluar === 'alfa'
                    ? 'bg-slate-300/30'
                    : 'bg-white/20 backdrop-blur-sm'
                }`}>
                  <LogOut className={`w-6 h-6 sm:w-8 sm:h-8 ${
                    isSubmittingPulang ||
                    !hasMasuk ||
                    hasPulang ||
                    todayAbsensiGuru?.statusKeluar === 'izin' ||
                    todayAbsensiGuru?.statusKeluar === 'sakit' ||
                    todayAbsensiGuru?.statusKeluar === 'alfa'
                      ? 'text-slate-500'
                      : 'text-white'
                  }`} />
                </div>
                <span className={`font-semibold text-sm sm:text-base text-center ${
                  isSubmittingPulang ||
                  !hasMasuk ||
                  hasPulang ||
                  todayAbsensiGuru?.statusKeluar === 'izin' ||
                  todayAbsensiGuru?.statusKeluar === 'sakit' ||
                  todayAbsensiGuru?.statusKeluar === 'alfa'
                    ? 'text-slate-500'
                    : 'text-white'
                }`}>Absen Pulang</span>
                {isSubmittingPulang && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Status Bar */}
          <div className={`${getStatusBarColor()} rounded-2xl shadow-lg overflow-hidden transition-all duration-300`}>
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white font-bold text-sm mb-1">Status Hari Ini</p>
                <p className="text-white text-base">{getStatusText()}</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/absen-guru')}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 active:scale-95"
              >
                Lihat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Cards - Mobile Only */}
      <div className="md:hidden">
        <GuruMenuCards />
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-2 ${stats.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} gap-3 sm:gap-4 lg:gap-5`}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isLastCard = index === stats.length - 1;
          const isOddCount = stats.length % 2 !== 0;
          // Jika jumlah card ganjil dan ini card terakhir, buat full width di mobile
          const shouldSpanFull = isLastCard && isOddCount;
          return (
            <div
              key={index}
              className={`group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] overflow-hidden ${shouldSpanFull ? 'col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${stat.color} shadow-md group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm ml-2 text-slate-600 mb-1">{stat.title}</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        {/* Jadwal Hari Ini */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-200">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Jadwal Hari Ini</h3>
                <p className="text-xs sm:text-sm text-white">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 lg:p-6">
            {todaySchedules.length > 0 ? (
              <div className="space-y-3">
                {todaySchedules.map((jadwal) => {
                  const session = todaySessions.find(s => s.jadwalId === jadwal.id);
                  const isFinished = isJadwalFinished(jadwal);
                  const hasPhoto = hasPhotoForJadwal(jadwal.id);
                  const sessionOpened = hasSessionOpened(jadwal.id);

                  return (
                    <div 
                      key={jadwal.id} 
                      onClick={() => navigate('/dashboard/absensi', { state: { scrollToJadwalId: jadwal.id } })}
                      className="group relative bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-blue-300 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 text-sm sm:text-base mb-1">
                            {getMapelName(jadwal.mataPelajaranId)}
                          </p>
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs sm:text-sm">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <p>
                              {getKelasName(jadwal.kelasId)} • {jadwal.jamMulai} - {jadwal.jamSelesai}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {session ? (
                            <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
                              session.status === 'dibuka' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-700 border border-slate-300'
                            }`}>
                              {session.status === 'dibuka' ? 'Sesi Aktif' : 'Sesi Tutup'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                              Belum Dibuka
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Photo Evidence Section */}
                      {sessionOpened && (
                        <div className="mt-3 pt-3 border-t border-slate-200" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Camera size={14} className="text-blue-600" />
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-slate-700">Bukti Mengajar:</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {hasPhoto ? (
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  <CheckCircle size={12} className="mr-1" />
                                  Tersimpan
                                </span>
                              ) : isFinished ? (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTakePhoto(jadwal);
                                  }}
                                  className="flex items-center gap-1 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white border-0"
                                >
                                  <Camera size={14} />
                                  Ambil Foto
                                </Button>
                              ) : (
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  Selesai untuk foto
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 sm:py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm sm:text-base font-medium text-slate-500">Tidak ada jadwal hari ini</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Nikmati hari istirahatmu!</p>
              </div>
            )}
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-orange-100">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Aktivitas Penting</h3>
                <p className="text-xs sm:text-sm text-white">Status dan notifikasi</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 lg:p-6 space-y-3">
            {activeIzinGuru && (
              <div 
                onClick={() => navigate('/dashboard/izin-guru')}
                className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-lg border border-emerald-200 hover:border-emerald-300 cursor-pointer hover:from-emerald-100 hover:to-emerald-100/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-emerald-900">
                    Izin {activeIzinGuru.jenis} Aktif
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Sampai {new Date(activeIzinGuru.tanggalSelesai).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            )}
            {pendingIzinGuruCount > 0 && (
              <div 
                onClick={() => navigate('/dashboard/izin-guru')}
                className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-lg border border-amber-200 hover:border-amber-300 cursor-pointer hover:from-amber-100 hover:to-amber-100/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-amber-900">
                    {pendingIzinGuruCount} Izin Menunggu Verifikasi
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">Segera hubungi admin untuk persetujuan</p>
                </div>
              </div>
            )}
            {user?.isWaliKelas && pendingSuratIzin.length > 0 && (
              <div 
                onClick={() => navigate('/dashboard/surat-izin')}
                className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-orange-50/50 rounded-lg border border-orange-200 hover:border-orange-300 cursor-pointer hover:from-orange-100 hover:to-orange-100/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-orange-900">
                    {pendingSuratIzin.length} Surat Izin Membutuhkan Verifikasi
                  </p>
                  <p className="text-xs text-orange-700 mt-0.5">Sebagai wali kelas ({getKelasName(user.kelasWali || '')})</p>
                </div>
              </div>
            )}
            {todaySessions.length > 0 && (
              <div 
                onClick={() => navigate('/dashboard/absensi')}
                className="flex items-start gap-3 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-200 hover:border-blue-300 cursor-pointer hover:from-blue-100 hover:to-blue-100/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-blue-900">
                    {todaySessions.filter(s => s.status === 'dibuka').length} Sesi Absensi Aktif
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">Siap untuk pembukaan sesi</p>
                </div>
              </div>
            )}
            {!activeIzinGuru && pendingIzinGuruCount === 0 && (!user?.isWaliKelas || pendingSuratIzin.length === 0) && (
              <div className="text-center py-6 text-slate-500">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs sm:text-sm font-medium">Semua normal!</p>
                <p className="text-xs text-slate-400 mt-0.5">Tidak ada aktivitas yang perlu perhatian</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {user?.isWaliKelas && (() => {
        // Calculate attendance statistics for wali kelas
        let classAttendanceRate = '0';
        
        if (muridKelas.length > 0 && absensiKelas.length > 0 && activeTahunAjaran) {
          // Filter absensi for current tahun ajaran and semester
          const filteredAbsensi = absensiKelas.filter(a => 
            a.tahunAjaranId === activeTahunAjaran.id &&
            a.semester === activeTahunAjaran.semester
          );

          // Count total hadir (using new structure: statusMasuk === 'tepat_waktu' or 'hadir' or status === 'hadir')
          const totalHadir = filteredAbsensi.filter(a => {
            // New structure - check statusMasuk
            if (a.statusMasuk === 'tepat_waktu' || a.statusMasuk === 'hadir') return true;
            // Old structure backward compatibility - check status
            if (a.status === 'hadir') return true;
            return false;
          }).length;

          // Total absensi records (one per day per murid in new structure)
          const totalAbsensi = filteredAbsensi.length;

          // Calculate attendance rate: (total hadir / total absensi) * 100
          if (totalAbsensi > 0) {
            classAttendanceRate = ((totalHadir / totalAbsensi) * 100).toFixed(1);
          }
        }

        return (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-teal-100">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-lg p-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Ringkasan Wali Kelas</h3>
                  <p className="text-xs sm:text-sm text-white">Data kelas yang Anda ampu</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-5 border border-blue-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Kelas Wali</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{getKelasName(user.kelasWali || '')}</p>
                      <p className="text-xs text-blue-600 mt-1">{muridKelas.length} murid aktif</p>
                    </div>
                    <div className="bg-blue-600 rounded-lg p-2 sm:p-2.5 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-5 border border-emerald-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-2">Kehadiran Kelas</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-900">{classAttendanceRate}%</p>
                      <p className="text-xs text-emerald-600 mt-1">Tingkat rata-rata</p>
                    </div>
                    <div className="bg-emerald-600 rounded-lg p-2 sm:p-2.5 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 sm:p-5 border border-orange-100 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-orange-600 uppercase tracking-wide mb-2">Surat Izin</p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900">{pendingSuratIzin.length}</p>
                      <p className="text-xs text-orange-600 mt-1">Menunggu verifikasi</p>
                    </div>
                    <div className="bg-orange-600 rounded-lg p-2 sm:p-2.5 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false);
          setSelectedJadwalForPhoto(null);
        }}
        onCapture={handlePhotoCapture}
        title={selectedJadwalForPhoto ? `Foto Bukti Mengajar - ${getMapelName(selectedJadwalForPhoto.mataPelajaranId)}` : 'Ambil Foto'}
      />
    </div>
  );
};

export default GuruDashboard;