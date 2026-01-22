import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, CheckCircle, FileText, QrCode, TrendingUp, AlertCircle, UserCheck, LogIn, LogOut, GraduationCap, Award, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useJadwalPelajaran } from '../../hooks/useJadwalPelajaran';
import { useSesiAbsensi } from '../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../hooks/useAbsensi';
import { useSuratIzin } from '../../hooks/useSuratIzin';
import { useKelas } from '../../hooks/useKelas';
import { useMataPelajaran } from '../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { usePengaturanAbsen } from '../../hooks/usePengaturanAbsen';
import { usePengaturanSistem } from '../../hooks/usePengaturanSistem';
import { useAlumni } from '../../hooks/useAlumni';
import { useSantri } from '../../hooks/useSantri';
import { useKelasTahfiz } from '../../hooks/useKelasTahfiz';
import { useJadwalTahfiz } from '../../hooks/useJadwalTahfiz';
import { useSesiAbsensiTahfiz } from '../../hooks/useSesiAbsensiTahfiz';
import { useUstadz } from '../../hooks/useUstadz';
import { useProgressHafalan } from '../../hooks/useProgressHafalan';
import { Absensi, Murid } from '../../types';
import { getTodayKehadiranStatsIntegrated, getAbsenMasukStatus, getAbsenPulangStatus } from '../murid/pages/absen-kehadiran/absenKehadiranIntegratedUtils';
import { isMuridAlumni } from '../../utils/alumniStatusUtils';
import { showSuccessNotification, showErrorNotification } from '../../utils/notificationUtils';
import { sseAbsenService } from '../../services/sseAbsenService';
import MuridMenuCards from './MuridMenuCards';
import { isAttendanceDayAllowed, getDayNameInIndonesian } from '../../utils/attendanceDayValidation';
import { getLocalTimeISOString } from '../../utils/absensiUtils';

const MuridDashboard: React.FC = () => {
  const { user } = useAuth();
  const murid = user as Murid | null;
  const navigate = useNavigate();
  const [isSubmittingMasuk, setIsSubmittingMasuk] = useState(false);
  const [isSubmittingPulang, setIsSubmittingPulang] = useState(false);
  
  // Get active tahun ajaran first to use for filtering
  const { activeTahunAjaran } = useTahunAjaran();
  
  // Get all data using hooks with cache
  const { jadwalPelajaran } = useJadwalPelajaran(
    murid?.kelasId && activeTahunAjaran
      ? {
          kelasId: murid.kelasId,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );
  const { sesiAbsensi } = useSesiAbsensi();
  const { absensi, refreshAbsensi, createAbsensi } = useAbsensi({ muridId: user?.id });
  const { suratIzin } = useSuratIzin();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { activePengaturanAbsen } = usePengaturanAbsen();
  const { enableEarlyDeparture } = usePengaturanSistem();
  const { alumni } = useAlumni();
  const { santri } = useSantri();
  const { kelasTahfiz } = useKelasTahfiz();
  const { jadwalTahfiz } = useJadwalTahfiz();
  const { sesiAbsensiTahfiz } = useSesiAbsensiTahfiz();
  const { ustadz } = useUstadz();

  // Define today and currentDay early to avoid initialization errors
  const today = new Date().toISOString().split('T')[0];
  const currentDay = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();

  const isAlumni = isMuridAlumni(user || undefined, alumni);
  
  // Check if user is a santri that is NOT from murid collection (isFromMurid: false)
  const santriUser = user?.id ? santri.find(s => s.id === user.id) : null;
  const isSantriNotFromMurid = santriUser && (santriUser as any).isFromMurid === false;
  
  // Get tahfiz classes for this santri
  const myTahfizClasses = isSantriNotFromMurid && user?.id
    ? kelasTahfiz.filter(cls => cls.santriIds.includes(user.id))
    : [];

  // Get tahfiz schedules for this santri
  const myTahfizSchedules = isSantriNotFromMurid && user?.id
    ? jadwalTahfiz.filter(j => myTahfizClasses.some(cls => cls.id === j.kelasId))
    : [];

  // Get today's tahfiz schedules
  const todayTahfizSchedules = myTahfizSchedules.filter(j => j.hari === currentDay);

  // Get today's tahfiz sessions
  const todayTahfizSessions = sesiAbsensiTahfiz.filter(s =>
    s.tanggal === today &&
    myTahfizSchedules.some(j => j.id === s.jadwalId)
  );

  // Get progress hafalan for this santri
  const currentYear = new Date().getFullYear().toString();
  const { progressList: progressHafalan } = useProgressHafalan(
    isSantriNotFromMurid ? user?.id : undefined,
    currentYear
  );

  // Calculate progress hafalan stats
  const progressStats = useMemo(() => {
    if (!progressHafalan || progressHafalan.length === 0) {
      return { totalJuz: 0, totalSurah: 0, lastUpdate: null };
    }
    const uniqueJuz = new Set(progressHafalan.map(p => p.juz)).size;
    const uniqueSurah = new Set(progressHafalan.map(p => p.surat)).size;
    const lastUpdate = progressHafalan.reduce((latest, p) => {
      const pDate = new Date(p.updatedAt || p.createdAt);
      const latestDate = latest ? new Date(latest) : null;
      return !latestDate || pDate > latestDate ? p.updatedAt || p.createdAt : latest;
    }, null as string | null);
    return { totalJuz: uniqueJuz, totalSurah: uniqueSurah, lastUpdate };
  }, [progressHafalan]);

  // Helper function to get ustadz name
  const getUstadzName = (ustadzId: string) => {
    const ustadzData = ustadz.find(u => u.id === ustadzId);
    return ustadzData?.name || 'Belum diatur';
  };

  // Format time helper
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}.${minutes}`;
  };

  // Get student's class schedules
  // jadwalPelajaran already filtered by kelasId, tahunAjaran, and semester from hook
  const myKelas = kelas.find(k => k.id === murid?.kelasId);
  const mySchedules = jadwalPelajaran; // Already filtered by hook
  const todaySchedules = mySchedules.filter(j => j.hari === currentDay);
  
  // Calculate unique mata pelajaran count for active semester
  const totalMataPelajaran = activeTahunAjaran
    ? new Set(mySchedules.map(j => j.mataPelajaranId)).size
    : 0;

  // Get today's active sessions
  const todaySessions = sesiAbsensi.filter(s => 
    s.tanggal === today && 
    mySchedules.some(j => j.id === s.jadwalId)
  );

  // Get my attendance records
  const myAttendance = absensi.filter(a => a.muridId === murid?.id);
  const todayAttendance = myAttendance.filter(a => {
    const sesi = sesiAbsensi.find(s => s.id === a.sesiId);
    return sesi?.tanggal === today;
  });

  // Get my surat izin
  const mySuratIzin = suratIzin.filter(s => s.muridId === murid?.id);
  const pendingSuratIzin = mySuratIzin.filter(s => s.status === 'menunggu');

  // Get today's kehadiran absensi status (new structure: one record per day)
  const todayKehadiranAbsensi = myAttendance.find(a =>
    a.method === 'admin-qr' &&
    a.tanggal === today
  ) as Absensi | undefined;

  // Use new structure first
  const todayKehadiranMasuk = todayKehadiranAbsensi?.jamMasuk || todayKehadiranAbsensi?.statusMasuk ? {
    ...todayKehadiranAbsensi,
    tipeAbsen: 'masuk',
    waktu: todayKehadiranAbsensi.jamMasuk || todayKehadiranAbsensi.waktu || '',
    status: todayKehadiranAbsensi.statusMasuk === 'izin' ? 'izin' :
            todayKehadiranAbsensi.statusMasuk === 'sakit' ? 'sakit' :
            todayKehadiranAbsensi.statusMasuk === 'alfa' ? 'alfa' :
            todayKehadiranAbsensi.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
  } : undefined;

  const todayKehadiranPulang = todayKehadiranAbsensi?.jamKeluar || todayKehadiranAbsensi?.statusKeluar ? {
    ...todayKehadiranAbsensi,
    tipeAbsen: 'pulang',
    waktu: todayKehadiranAbsensi.jamKeluar || todayKehadiranAbsensi.waktu || '',
    status: todayKehadiranAbsensi.statusKeluar === 'izin' ? 'izin' :
            todayKehadiranAbsensi.statusKeluar === 'sakit' ? 'sakit' :
            todayKehadiranAbsensi.statusKeluar === 'alfa' ? 'alfa' :
            todayKehadiranAbsensi.statusKeluar === 'pulang_awal' ? 'pulang_cepat' : 'hadir',
  } : undefined;

  // Backward compatibility: check old structure
  if (!todayKehadiranMasuk && !todayKehadiranPulang) {
    const todayKehadiranAbsensiOld = myAttendance.filter(a =>
      a.method === 'admin-qr' &&
      a.tipeAbsen !== undefined &&
      (a.waktu?.startsWith(today) || a.tanggal === today)
    );
    const masukOld = todayKehadiranAbsensiOld.find(a => a.tipeAbsen === 'masuk');
    const pulangOld = todayKehadiranAbsensiOld.find(a => a.tipeAbsen === 'pulang');
    if (masukOld) Object.assign(todayKehadiranMasuk || {}, masukOld);
    if (pulangOld) Object.assign(todayKehadiranPulang || {}, pulangOld);
  }

  // Get today's kehadiran stats
  const todayStats = getTodayKehadiranStatsIntegrated(absensi, murid?.id || '');

  const getTodayStatusDetail = () => {
    // Find today's absensi (one record per day in new structure)
    const todayAbsensi = absensi.find(a =>
      a.muridId === murid?.id && a.tanggal === today
    );

    // Use new structure first
    let masuk: Absensi | undefined;
    let pulang: Absensi | undefined;

    if (todayAbsensi) {
      if (todayAbsensi.jamMasuk || todayAbsensi.statusMasuk) {
        masuk = {
          ...todayAbsensi,
          tipeAbsen: 'masuk',
          waktu: todayAbsensi.jamMasuk || todayAbsensi.waktu || '',
          status: todayAbsensi.statusMasuk === 'izin' ? 'izin' :
                  todayAbsensi.statusMasuk === 'sakit' ? 'sakit' :
                  todayAbsensi.statusMasuk === 'alfa' ? 'alfa' :
                  todayAbsensi.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
        };
      }

      if (todayAbsensi.jamKeluar || todayAbsensi.statusKeluar) {
        pulang = {
          ...todayAbsensi,
          tipeAbsen: 'pulang',
          waktu: todayAbsensi.jamKeluar || todayAbsensi.waktu || '',
          status: todayAbsensi.statusKeluar === 'izin' ? 'izin' :
                  todayAbsensi.statusKeluar === 'sakit' ? 'sakit' :
                  todayAbsensi.statusKeluar === 'alfa' ? 'alfa' :
                  todayAbsensi.statusKeluar === 'pulang_awal' ? 'pulang_cepat' : 'hadir',
        };
      }
    }

    // Backward compatibility: check old structure (separate records)
    if (!masuk && !pulang) {
      const todayAbsensiOld = absensi.filter(a =>
        a.muridId === murid?.id &&
        a.tipeAbsen !== undefined &&
        (a.waktu?.startsWith(today) || a.tanggal === today)
      );

      masuk = todayAbsensiOld.find(a => a.tipeAbsen === 'masuk');
      pulang = todayAbsensiOld.find(a => a.tipeAbsen === 'pulang');
    }

    let displayStatusMasuk: string | null = null;
    let displayStatusPulang: string | null = null;

    if (masuk) {
      if (masuk.status === 'izin' || masuk.status === 'sakit' || masuk.status === 'alfa') {
        displayStatusMasuk = masuk.status.charAt(0).toUpperCase() + masuk.status.slice(1);
      } else {
        if (masuk.waktu) {
          const statusMasuk = getAbsenMasukStatus(
            new Date(masuk.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
            activePengaturanAbsen || undefined
          );
          displayStatusMasuk = statusMasuk === 'hadir' ? 'Tepat Waktu' : 'Terlambat';
        }
      }
    }

    if (pulang) {
      if (pulang.status === 'izin' || pulang.status === 'sakit' || pulang.status === 'alfa') {
        // Untuk alfa, tampilkan "Tidak Absen"
        displayStatusPulang = pulang.status === 'alfa' ? 'Tidak Absen' : pulang.status.charAt(0).toUpperCase() + pulang.status.slice(1);
      } else {
        if (pulang.waktu) {
          const statusPulang = getAbsenPulangStatus(
            new Date(pulang.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
            activePengaturanAbsen || undefined
          );
          displayStatusPulang = statusPulang === 'hadir' ? 'Tepat Waktu' : 'Pulang Cepat';
        }
      }
    }

    return {
      displayStatusMasuk,
      displayStatusPulang,
      masukRawStatus: masuk?.status,
      pulangRawStatus: pulang?.status,
      hasMasuk: !!masuk,
      hasPulang: !!pulang,
      masuk,
      pulang
    };
  };

  const todayDetail = getTodayStatusDetail();

  // SSE listener untuk auto-alfa
  useEffect(() => {
    sseAbsenService.connect();

    const handleSSEEvent = (event: any) => {
      if (event.type === 'absen-auto-alfa' || event.type === 'absen-murid-update' || event.type === 'absen-auto-save') {
        refreshAbsensi();
      }
    };

    const unsubscribe = sseAbsenService.subscribe(handleSSEEvent);

    return () => {
      unsubscribe();
      sseAbsenService.disconnect();
    };
  }, [refreshAbsensi]);

  // Calculate attendance statistics based on active academic year and semester
  const recentAttendance = myAttendance.filter(a => {
    const sesi = sesiAbsensi.find(s => s.id === a.sesiId);
    if (!sesi) return false;

    const jadwal = jadwalPelajaran.find(j => j.id === sesi.jadwalId);
    if (!jadwal) return false;

    // Filter by active academic year and semester
    return jadwal.tahunAjaran === activeTahunAjaran?.tahun &&
           jadwal.semester === activeTahunAjaran?.semester;
  });

  const attendanceStats = {
    hadir: recentAttendance.filter(a => a.status === 'hadir').length,
    izin: recentAttendance.filter(a => a.status === 'izin').length,
    sakit: recentAttendance.filter(a => a.status === 'sakit').length,
    alfa: recentAttendance.filter(a => a.status === 'alfa').length,
    total: recentAttendance.length
  };

  const attendanceRate = attendanceStats.total > 0 ?
    ((attendanceStats.hadir / attendanceStats.total) * 100).toFixed(1) : '0';

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
      title: 'Sudah Absen',
      value: todayAttendance.length,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
    
    {
      title: 'Surat Pending',
      value: pendingSuratIzin.length,
      icon: FileText,
      color: 'bg-orange-500',
    },
  ];

  const getMapelName = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
  };

  // Handle Absen Masuk
  const handleAbsenMasuk = async () => {
    if (!murid || !activeTahunAjaran) {
      showErrorNotification('Error', 'Data tidak lengkap');
      return;
    }

    // Check if already absen masuk
    if (todayDetail.hasMasuk) {
      showErrorNotification('Sudah Absen', 'Anda sudah melakukan absen masuk hari ini');
      return;
    }

    // Check if today is a school day for murid
    const pengaturanAbsenArray = activePengaturanAbsen ? [activePengaturanAbsen] : [];
    if (!isAttendanceDayAllowed(today, 'murid', pengaturanAbsenArray)) {
      const dayName = getDayNameInIndonesian(today);
      showErrorNotification(
        'Absensi Tidak Diizinkan',
        `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`
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
      const nowIso = getLocalTimeISOString();
      const idKey = `${today}-${murid.kelasId}-${murid.id}`;

      const newAbsensi: Partial<Absensi> = {
        id: idKey,
        muridId: murid.id,
        tanggal: today,
        kelasId: murid.kelasId,
        method: 'manual',
        statusAbsen: 'tepat_waktu',
        tahunAjaranId: activeTahunAjaran.id,
        semester: activeTahunAjaran.semester,
        jamMasuk: nowIso,
        statusMasuk: 'tepat_waktu',
        // Legacy fields for backward compatibility
        tipeAbsen: 'masuk',
        status: 'hadir',
        waktu: nowIso,
      };

      await createAbsensi(newAbsensi);
      await refreshAbsensi();
      showSuccessNotification('Absen Masuk Berhasil', `Waktu: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
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
    if (!murid || !activeTahunAjaran) {
      showErrorNotification('Error', 'Data tidak lengkap');
      return;
    }

    // Check if already absen pulang
    if (todayDetail.hasPulang) {
      showErrorNotification('Sudah Absen', 'Anda sudah melakukan absen pulang hari ini');
      return;
    }

    // Check if belum absen masuk
    if (!todayDetail.hasMasuk) {
      showErrorNotification('Belum Absen Masuk', 'Silakan lakukan absen masuk terlebih dahulu');
      return;
    }

    // Check if today is a school day for murid
    const pengaturanAbsenArray = activePengaturanAbsen ? [activePengaturanAbsen] : [];
    if (!isAttendanceDayAllowed(today, 'murid', pengaturanAbsenArray)) {
      const dayName = getDayNameInIndonesian(today);
      showErrorNotification(
        'Absensi Tidak Diizinkan',
        `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`
      );
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
      const nowIso = getLocalTimeISOString();
      const idKey = `${today}-${murid.kelasId}-${murid.id}`;

      // Find existing absensi for today
      const todayAbsensi = absensi.find(a =>
        a.muridId === murid.id && a.tanggal === today
      );

      const newAbsensi: Partial<Absensi> = {
        id: idKey,
        muridId: murid.id,
        tanggal: today,
        kelasId: murid.kelasId,
        method: 'manual',
        statusAbsen: 'tepat_waktu',
        tahunAjaranId: activeTahunAjaran.id,
        semester: activeTahunAjaran.semester,
        jamKeluar: nowIso,
        statusKeluar: 'tepat_waktu',
        // Keep existing jamMasuk if exists
        ...(todayAbsensi?.jamMasuk && { jamMasuk: todayAbsensi.jamMasuk }),
        ...(todayAbsensi?.statusMasuk && { statusMasuk: todayAbsensi.statusMasuk }),
        // Legacy fields for backward compatibility
        tipeAbsen: 'pulang',
        status: 'hadir',
        waktu: nowIso,
      };

      await createAbsensi(newAbsensi);
      await refreshAbsensi();
      showSuccessNotification('Absen Pulang Berhasil', `Waktu: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (error) {
      console.error('Error creating absen pulang:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan absen pulang';
      showErrorNotification('Error', errorMessage);
    } finally {
      setIsSubmittingPulang(false);
    }
  };

  // Format time to use dot instead of colon (12.20 instead of 12:20)
  const formatTimeWithDot = (timeString: string | undefined): string => {
    if (!timeString) return '-';
    return timeString.replace(':', '.');
  };

  // Get status text for today
  const getStatusText = () => {
    // Check for izin/sakit/cuti status
    if (todayDetail.masukRawStatus === 'izin' || todayDetail.pulangRawStatus === 'izin') {
      return 'IZIN';
    }
    if (todayDetail.masukRawStatus === 'sakit' || todayDetail.pulangRawStatus === 'sakit') {
      return 'SAKIT';
    }
    if (todayDetail.masukRawStatus === 'alfa' || todayDetail.pulangRawStatus === 'alfa') {
      return 'ALFA';
    }
    // Jika ada absen masuk tapi absen pulangnya alfa
    if (todayDetail.hasMasuk && todayDetail.pulangRawStatus === 'alfa') {
      return 'Anda Bolos, Tidak Absen Pulang';
    }
    if (todayDetail.hasMasuk && todayDetail.hasPulang) {
      return 'Sudah absen masuk dan pulang';
    }
    if (todayDetail.hasMasuk) {
      return 'Sudah absen masuk';
    }
    return 'Belum absen masuk';
  };

  // Get status bar background color based on status
  const getStatusBarColor = () => {
    // Check for izin/sakit/cuti status (check both masuk and pulang)
    const statusMasuk = todayDetail.masukRawStatus;
    const statusPulang = todayDetail.pulangRawStatus;
    
    if (statusMasuk === 'izin' || statusPulang === 'izin') {
      return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    }
    if (statusMasuk === 'sakit' || statusPulang === 'sakit') {
      return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
    if (statusMasuk === 'alfa' || statusPulang === 'alfa') {
      return 'bg-gradient-to-r from-red-500 to-red-600';
    }
    
    // Jika ada absen masuk tapi absen pulangnya alfa
    if (todayDetail.hasMasuk && todayDetail.pulangRawStatus === 'alfa') {
      return 'bg-gradient-to-r from-red-500 to-red-600';
    }
    
    // Jika sudah absen masuk dan pulang
    if (todayDetail.hasMasuk && todayDetail.hasPulang) {
      return 'bg-gradient-to-r from-orange-500 to-orange-600';
    }
    
    // Jika sudah absen masuk saja
    if (todayDetail.hasMasuk) {
      return 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700';
    }
    
    // Default: belum absen masuk
    return 'bg-gradient-to-r from-orange-500 to-orange-600';
  };

  // Dashboard khusus untuk santri tahfiz (bukan dari murid)
  if (isSantriNotFromMurid) {
    // Get tahfiz class ID for attendance (use first class)
    const tahfizKelasId = myTahfizClasses[0]?.id;
    const effectiveKelasIdForAttendance = tahfizKelasId || '';
    
    // Get today's kehadiran absensi for santri tahfiz (using existing absensi hook)
    const todayKehadiranAbsensiSantri = absensi.find(a =>
      a.muridId === user?.id &&
      a.tanggal === today
    );

    // Get today's status detail for santri tahfiz
    const getTodayStatusDetailSantri = () => {
      const todayAbsensi = absensi.find(a =>
        a.muridId === user?.id && a.tanggal === today
      );

      let masuk: Absensi | undefined;
      let pulang: Absensi | undefined;

      if (todayAbsensi) {
        if (todayAbsensi.jamMasuk || todayAbsensi.statusMasuk) {
          masuk = {
            ...todayAbsensi,
            tipeAbsen: 'masuk',
            waktu: todayAbsensi.jamMasuk || todayAbsensi.waktu || '',
            status: todayAbsensi.statusMasuk === 'izin' ? 'izin' :
                    todayAbsensi.statusMasuk === 'sakit' ? 'sakit' :
                    todayAbsensi.statusMasuk === 'alfa' ? 'alfa' :
                    todayAbsensi.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
          };
        }

        if (todayAbsensi.jamKeluar || todayAbsensi.statusKeluar) {
          pulang = {
            ...todayAbsensi,
            tipeAbsen: 'pulang',
            waktu: todayAbsensi.jamKeluar || todayAbsensi.waktu || '',
            status: todayAbsensi.statusKeluar === 'izin' ? 'izin' :
                    todayAbsensi.statusKeluar === 'sakit' ? 'sakit' :
                    todayAbsensi.statusKeluar === 'alfa' ? 'alfa' :
                    todayAbsensi.statusKeluar === 'pulang_awal' ? 'pulang_cepat' : 'hadir',
          };
        }
      }

      // Backward compatibility: check old structure
      if (!masuk && !pulang) {
        const todayAbsensiOld = absensi.filter(a =>
          a.muridId === user?.id &&
          a.tipeAbsen !== undefined &&
          (a.waktu?.startsWith(today) || a.tanggal === today)
        );

        masuk = todayAbsensiOld.find(a => a.tipeAbsen === 'masuk');
        pulang = todayAbsensiOld.find(a => a.tipeAbsen === 'pulang');
      }

      let displayStatusMasuk: string | null = null;
      let displayStatusPulang: string | null = null;

      if (masuk) {
        if (masuk.status === 'izin' || masuk.status === 'sakit' || masuk.status === 'alfa') {
          displayStatusMasuk = masuk.status.charAt(0).toUpperCase() + masuk.status.slice(1);
        } else {
          if (masuk.waktu) {
            const statusMasuk = getAbsenMasukStatus(
              new Date(masuk.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
              activePengaturanAbsen || undefined
            );
            displayStatusMasuk = statusMasuk === 'hadir' ? 'Tepat Waktu' : 'Terlambat';
          }
        }
      }

      if (pulang) {
        if (pulang.status === 'izin' || pulang.status === 'sakit' || pulang.status === 'alfa') {
          displayStatusPulang = pulang.status === 'alfa' ? 'Tidak Absen' : pulang.status.charAt(0).toUpperCase() + pulang.status.slice(1);
        } else {
          if (pulang.waktu) {
            const statusPulang = getAbsenPulangStatus(
              new Date(pulang.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
              activePengaturanAbsen || undefined
            );
            displayStatusPulang = statusPulang === 'hadir' ? 'Tepat Waktu' : 'Pulang Cepat';
          }
        }
      }

      return {
        displayStatusMasuk,
        displayStatusPulang,
        masukRawStatus: masuk?.status,
        pulangRawStatus: pulang?.status,
        hasMasuk: !!masuk,
        hasPulang: !!pulang,
        masuk,
        pulang
      };
    };

    const todayDetailSantri = getTodayStatusDetailSantri();
    
    // Get today's stats for santri tahfiz
    const todayStatsSantri = getTodayKehadiranStatsIntegrated(absensi, user?.id || '');

    // Handle Absen Masuk for santri tahfiz
    const handleAbsenMasukSantri = async () => {
      if (!user || !activeTahunAjaran || !effectiveKelasIdForAttendance) {
        showErrorNotification('Error', 'Data tidak lengkap');
        return;
      }

      if (todayDetailSantri.hasMasuk) {
        showErrorNotification('Sudah Absen', 'Anda sudah melakukan absen masuk hari ini');
        return;
      }

      const pengaturanAbsenArray = activePengaturanAbsen ? [activePengaturanAbsen] : [];
      if (!isAttendanceDayAllowed(today, 'murid', pengaturanAbsenArray)) {
        const dayName = getDayNameInIndonesian(today);
        showErrorNotification(
          'Absensi Tidak Diizinkan',
          `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`
        );
        return;
      }

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
        const nowIso = getLocalTimeISOString();
        const idKey = `${today}-${effectiveKelasIdForAttendance}-${user.id}`;

        const newAbsensi: Partial<Absensi> = {
          id: idKey,
          muridId: user.id,
          tanggal: today,
          kelasId: effectiveKelasIdForAttendance,
          method: 'manual',
          statusAbsen: 'tepat_waktu',
          tahunAjaranId: activeTahunAjaran.id,
          semester: activeTahunAjaran.semester,
          jamMasuk: nowIso,
          statusMasuk: 'tepat_waktu',
          tipeAbsen: 'masuk',
          status: 'hadir',
          waktu: nowIso,
        };

        await createAbsensi(newAbsensi);
        await refreshAbsensi();
        showSuccessNotification('Absen Masuk Berhasil', `Waktu: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
      } catch (error) {
        console.error('Error creating absen masuk:', error);
        const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan absen masuk';
        showErrorNotification('Error', errorMessage);
      } finally {
        setIsSubmittingMasuk(false);
      }
    };

    // Handle Absen Pulang for santri tahfiz
    const handleAbsenPulangSantri = async () => {
      if (!user || !activeTahunAjaran || !effectiveKelasIdForAttendance) {
        showErrorNotification('Error', 'Data tidak lengkap');
        return;
      }

      if (todayDetailSantri.hasPulang) {
        showErrorNotification('Sudah Absen', 'Anda sudah melakukan absen pulang hari ini');
        return;
      }

      if (!todayDetailSantri.hasMasuk) {
        showErrorNotification('Belum Absen Masuk', 'Silakan lakukan absen masuk terlebih dahulu');
        return;
      }

      const pengaturanAbsenArray = activePengaturanAbsen ? [activePengaturanAbsen] : [];
      if (!isAttendanceDayAllowed(today, 'murid', pengaturanAbsenArray)) {
        const dayName = getDayNameInIndonesian(today);
        showErrorNotification(
          'Absensi Tidak Diizinkan',
          `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`
        );
        return;
      }

      if (!enableEarlyDeparture && activePengaturanAbsen) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [jamPulangHour, jamPulangMinute] = activePengaturanAbsen.jamPulang.split(':').map(Number);
        
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
        const batasPulang15Menit = jamPulangMinutes - 15;

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
        const nowIso = getLocalTimeISOString();
        const idKey = `${today}-${effectiveKelasIdForAttendance}-${user.id}`;

        const todayAbsensi = absensi.find(a =>
          a.muridId === user.id && a.tanggal === today
        );

        const newAbsensi: Partial<Absensi> = {
          id: idKey,
          muridId: user.id,
          tanggal: today,
          kelasId: effectiveKelasIdForAttendance,
          method: 'manual',
          statusAbsen: 'tepat_waktu',
          tahunAjaranId: activeTahunAjaran.id,
          semester: activeTahunAjaran.semester,
          jamKeluar: nowIso,
          statusKeluar: 'tepat_waktu',
          ...(todayAbsensi?.jamMasuk && { jamMasuk: todayAbsensi.jamMasuk }),
          ...(todayAbsensi?.statusMasuk && { statusMasuk: todayAbsensi.statusMasuk }),
          tipeAbsen: 'pulang',
          status: 'hadir',
          waktu: nowIso,
        };

        await createAbsensi(newAbsensi);
        await refreshAbsensi();
        showSuccessNotification('Absen Pulang Berhasil', `Waktu: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
      } catch (error) {
        console.error('Error creating absen pulang:', error);
        const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan absen pulang';
        showErrorNotification('Error', errorMessage);
      } finally {
        setIsSubmittingPulang(false);
      }
    };

    // Get status text for santri tahfiz
    const getStatusTextSantri = () => {
      if (todayDetailSantri.masukRawStatus === 'izin' || todayDetailSantri.pulangRawStatus === 'izin') {
        return 'IZIN';
      }
      if (todayDetailSantri.masukRawStatus === 'sakit' || todayDetailSantri.pulangRawStatus === 'sakit') {
        return 'SAKIT';
      }
      if (todayDetailSantri.masukRawStatus === 'alfa' || todayDetailSantri.pulangRawStatus === 'alfa') {
        return 'ALFA';
      }
      if (todayDetailSantri.hasMasuk && todayDetailSantri.pulangRawStatus === 'alfa') {
        return 'Anda Bolos, Tidak Absen Pulang';
      }
      if (todayDetailSantri.hasMasuk && todayDetailSantri.hasPulang) {
        return 'Sudah absen masuk dan pulang';
      }
      if (todayDetailSantri.hasMasuk) {
        return 'Sudah absen masuk';
      }
      return 'Belum absen masuk';
    };

    // Get status bar color for santri tahfiz
    const getStatusBarColorSantri = () => {
      const statusMasuk = todayDetailSantri.masukRawStatus;
      const statusPulang = todayDetailSantri.pulangRawStatus;
      
      if (statusMasuk === 'izin' || statusPulang === 'izin') {
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      }
      if (statusMasuk === 'sakit' || statusPulang === 'sakit') {
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      }
      if (statusMasuk === 'alfa' || statusPulang === 'alfa') {
        return 'bg-gradient-to-r from-red-500 to-red-600';
      }
      
      if (todayDetailSantri.hasMasuk && todayDetailSantri.pulangRawStatus === 'alfa') {
        return 'bg-gradient-to-r from-red-500 to-red-600';
      }
      
      if (todayDetailSantri.hasMasuk && todayDetailSantri.hasPulang) {
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      }
      
      if (todayDetailSantri.hasMasuk) {
        return 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700';
      }
      
      return 'bg-gradient-to-r from-orange-500 to-orange-600';
    };

    return (
      <div className="space-y-5 lg:space-y-6">
        {/* Welcome Header - Tema Hijau untuk Tahfiz */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  Assalamu'alaikum, {user?.name}!
                </h1>
                <p className="text-sm sm:text-base text-white/90">
                  {myTahfizClasses.length > 0
                    ? `Santri Tahfiz - ${myTahfizClasses.map(c => c.namaKelas).join(', ')}`
                    : 'Santri Tahfiz'}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Absen Masuk & Pulang Buttons - Mobile & Tablet Only */}
        {user && (
          <div className="lg:hidden space-y-4">
            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Absen Masuk Button */}
              {todayDetailSantri.hasMasuk && todayDetailSantri.masukRawStatus !== 'izin' && todayDetailSantri.masukRawStatus !== 'sakit' && todayDetailSantri.masukRawStatus !== 'alfa' ? (
                <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl shadow-lg p-4 sm:p-5 border border-slate-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-400/30 rounded-lg flex items-center justify-center">
                      <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                    </div>
                    <span className="text-slate-600 font-bold text-sm sm:text-base uppercase">Masuk</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-600 font-bold text-2xl sm:text-3xl">
                      {formatTimeWithDot(todayStatsSantri.waktuMasuk)}
                    </p>
                    <p className="text-slate-600 text-xs sm:text-sm font-medium">
                      {todayDetailSantri.displayStatusMasuk || 'Tepat Waktu'}
                    </p>
                  </div>
                </div>
              ) : (todayDetailSantri.masukRawStatus === 'izin' || todayDetailSantri.masukRawStatus === 'sakit') ? (
                <div className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
                  todayDetailSantri.masukRawStatus === 'izin'
                    ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300'
                    : 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                      todayDetailSantri.masukRawStatus === 'izin'
                        ? 'bg-yellow-400/30'
                        : 'bg-blue-400/30'
                    }`}>
                      <LogIn className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        todayDetailSantri.masukRawStatus === 'izin'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                      }`} />
                    </div>
                    <span className={`font-bold text-sm sm:text-base uppercase ${
                      todayDetailSantri.masukRawStatus === 'izin'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}>Masuk</span>
                  </div>
                  <div className="space-y-1">
                    <p className={`font-bold text-2xl sm:text-3xl uppercase ${
                      todayDetailSantri.masukRawStatus === 'izin'
                        ? 'text-yellow-700'
                        : 'text-blue-700'
                    }`}>
                      {todayDetailSantri.masukRawStatus === 'izin' ? 'IZIN' : 'SAKIT'}
                    </p>
                    <p className={`text-xs sm:text-sm font-medium ${
                      todayDetailSantri.masukRawStatus === 'izin'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}>
                      Tidak Perlu Absen
                    </p>
                  </div>
                </div>
              ) : (activePengaturanAbsen?.enableManualAbsen !== false) ? (
                <button
                  onClick={handleAbsenMasukSantri}
                  disabled={
                    isSubmittingMasuk ||
                    todayDetailSantri.hasMasuk ||
                    todayDetailSantri.masukRawStatus === 'izin' ||
                    todayDetailSantri.masukRawStatus === 'sakit' ||
                    todayDetailSantri.masukRawStatus === 'alfa'
                  }
                  className={`relative flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-2xl shadow-lg transition-all duration-200 ${
                    isSubmittingMasuk ||
                    todayDetailSantri.hasMasuk ||
                    todayDetailSantri.masukRawStatus === 'izin' ||
                    todayDetailSantri.masukRawStatus === 'sakit' ||
                    todayDetailSantri.masukRawStatus === 'alfa'
                      ? 'bg-gradient-to-br from-slate-200 to-slate-300 cursor-not-allowed'
                      : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:via-emerald-700 hover:to-emerald-800 active:scale-95 shadow-emerald-500/50'
                  }`}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                    isSubmittingMasuk ||
                    todayDetailSantri.hasMasuk ||
                    todayDetailSantri.masukRawStatus === 'izin' ||
                    todayDetailSantri.masukRawStatus === 'sakit' ||
                    todayDetailSantri.masukRawStatus === 'alfa'
                      ? 'bg-slate-400/30'
                      : 'bg-white/20 backdrop-blur-sm'
                  }`}>
                    <LogIn className={`w-6 h-6 sm:w-8 sm:h-8 ${
                      isSubmittingMasuk ||
                      todayDetailSantri.hasMasuk ||
                      todayDetailSantri.masukRawStatus === 'izin' ||
                      todayDetailSantri.masukRawStatus === 'sakit' ||
                      todayDetailSantri.masukRawStatus === 'alfa'
                        ? 'text-slate-600'
                        : 'text-white'
                    }`} />
                  </div>
                  <span className={`font-semibold text-sm sm:text-base text-center ${
                    isSubmittingMasuk ||
                    todayDetailSantri.hasMasuk ||
                    todayDetailSantri.masukRawStatus === 'izin' ||
                    todayDetailSantri.masukRawStatus === 'sakit' ||
                    todayDetailSantri.masukRawStatus === 'alfa'
                      ? 'text-slate-600'
                      : 'text-white'
                  }`}>Absen Masuk</span>
                  {isSubmittingMasuk && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              ) : null}

              {/* Absen Pulang Button */}
              {todayDetailSantri.hasPulang && todayDetailSantri.pulangRawStatus !== 'izin' && todayDetailSantri.pulangRawStatus !== 'sakit' ? (
                <div className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
                  todayDetailSantri.pulangRawStatus === 'alfa' 
                    ? 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-200' 
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                      todayDetailSantri.pulangRawStatus === 'alfa' 
                        ? 'bg-slate-300/30' 
                        : 'bg-slate-300/30'
                    }`}>
                      <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                    </div>
                    <span className="text-slate-500 font-bold text-sm sm:text-base uppercase">Pulang</span>
                  </div>
                  <div className="space-y-1">
                    <p className={`font-bold text-2xl sm:text-3xl ${
                      todayDetailSantri.pulangRawStatus === 'alfa' 
                        ? 'text-slate-500 uppercase' 
                        : 'text-slate-500'
                    }`}>
                      {todayDetailSantri.pulangRawStatus === 'alfa' 
                        ? 'ALFA' 
                        : formatTimeWithDot(todayStatsSantri.waktuPulang)}
                    </p>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium">
                      {todayDetailSantri.displayStatusPulang || 'Tepat Waktu'}
                    </p>
                  </div>
                </div>
              ) : (todayDetailSantri.pulangRawStatus === 'izin' || todayDetailSantri.pulangRawStatus === 'sakit') ? (
                <div className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
                  todayDetailSantri.pulangRawStatus === 'izin'
                    ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300'
                    : 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                      todayDetailSantri.pulangRawStatus === 'izin'
                        ? 'bg-yellow-400/30'
                        : 'bg-blue-400/30'
                    }`}>
                      <LogOut className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        todayDetailSantri.pulangRawStatus === 'izin'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                      }`} />
                    </div>
                    <span className={`font-bold text-sm sm:text-base uppercase ${
                      todayDetailSantri.pulangRawStatus === 'izin'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}>Pulang</span>
                  </div>
                  <div className="space-y-1">
                    <p className={`font-bold text-2xl sm:text-3xl uppercase ${
                      todayDetailSantri.pulangRawStatus === 'izin'
                        ? 'text-yellow-700'
                        : 'text-blue-700'
                    }`}>
                      {todayDetailSantri.pulangRawStatus === 'izin' ? 'IZIN' : 'SAKIT'}
                    </p>
                    <p className={`text-xs sm:text-sm font-medium ${
                      todayDetailSantri.pulangRawStatus === 'izin'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}>
                      Tidak Perlu Absen
                    </p>
                  </div>
                </div>
              ) : (activePengaturanAbsen?.enableManualAbsen !== false) ? (
                <button
                  onClick={handleAbsenPulangSantri}
                  disabled={
                    isSubmittingPulang ||
                    !todayDetailSantri.hasMasuk ||
                    todayDetailSantri.hasPulang ||
                    todayDetailSantri.pulangRawStatus === 'izin' ||
                    todayDetailSantri.pulangRawStatus === 'sakit' ||
                    todayDetailSantri.pulangRawStatus === 'alfa'
                  }
                  className={`relative flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-2xl shadow-lg transition-all duration-200 ${
                    isSubmittingPulang ||
                    !todayDetailSantri.hasMasuk ||
                    todayDetailSantri.hasPulang ||
                    todayDetailSantri.pulangRawStatus === 'izin' ||
                    todayDetailSantri.pulangRawStatus === 'sakit' ||
                    todayDetailSantri.pulangRawStatus === 'alfa'
                      ? 'bg-gradient-to-br from-slate-100 to-slate-200 cursor-not-allowed'
                      : 'bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:via-orange-600 hover:to-orange-700 active:scale-95 shadow-orange-500/50'
                  }`}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                    isSubmittingPulang ||
                    !todayDetailSantri.hasMasuk ||
                    todayDetailSantri.hasPulang ||
                    todayDetailSantri.pulangRawStatus === 'izin' ||
                    todayDetailSantri.pulangRawStatus === 'sakit' ||
                    todayDetailSantri.pulangRawStatus === 'alfa'
                      ? 'bg-slate-300/30'
                      : 'bg-white/20 backdrop-blur-sm'
                  }`}>
                    <LogOut className={`w-6 h-6 sm:w-8 sm:h-8 ${
                      isSubmittingPulang ||
                      !todayDetailSantri.hasMasuk ||
                      todayDetailSantri.hasPulang ||
                      todayDetailSantri.pulangRawStatus === 'izin' ||
                      todayDetailSantri.pulangRawStatus === 'sakit' ||
                      todayDetailSantri.pulangRawStatus === 'alfa'
                        ? 'text-slate-500'
                        : 'text-white'
                    }`} />
                  </div>
                  <span className={`font-semibold text-sm sm:text-base text-center ${
                    isSubmittingPulang ||
                    !todayDetailSantri.hasMasuk ||
                    todayDetailSantri.hasPulang ||
                    todayDetailSantri.pulangRawStatus === 'izin' ||
                    todayDetailSantri.pulangRawStatus === 'sakit' ||
                    todayDetailSantri.pulangRawStatus === 'alfa'
                      ? 'text-slate-500'
                      : 'text-white'
                  }`}>Absen Pulang</span>
                  {isSubmittingPulang && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              ) : null}
            </div>

            {/* Status Bar */}
            <div className={`${getStatusBarColorSantri()} rounded-2xl shadow-lg overflow-hidden transition-all duration-300`}>
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-bold text-sm mb-1">Status Hari Ini</p>
                  <p className="text-white text-base">{getStatusTextSantri()}</p>
                </div>
                <button
                  onClick={() => navigate('/dashboard/absen-kehadiran')}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 active:scale-95"
                >
                  Lihat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Cards - Only visible on mobile */}
        <div className="md:hidden">
          <MuridMenuCards />
        </div>

        {/* Quick Stats Cards - Hidden on mobile, visible on desktop */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Kelas Tahfiz */}
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-emerald-100 rounded-lg p-3">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Kelas Tahfiz</p>
            <p className="text-2xl font-bold text-slate-900">{myTahfizClasses.length}</p>
            <p className="text-xs text-slate-500 mt-1">Kelas yang diikuti</p>
          </div>

          {/* Progress Hapalan */}
          <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-teal-100 rounded-lg p-3">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">Juz yang Dihafal</p>
            <p className="text-2xl font-bold text-slate-900">{progressStats.totalJuz}</p>
            <p className="text-xs text-slate-500 mt-1">Dari 30 Juz</p>
          </div>

          {/* Surah yang Dihafal */}
          <div className="bg-white rounded-xl border border-cyan-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-cyan-100 rounded-lg p-3">
                <Award className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide mb-1">Surah yang Dihafal</p>
            <p className="text-2xl font-bold text-slate-900">{progressStats.totalSurah}</p>
            <p className="text-xs text-slate-500 mt-1">Total surah</p>
          </div>

          {/* Surat Izin */}
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-amber-100 rounded-lg p-3">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Surat Izin</p>
            <p className="text-2xl font-bold text-slate-900">{pendingSuratIzin.length}</p>
            <p className="text-xs text-slate-500 mt-1">Menunggu approval</p>
          </div>
        </div>

        {/* Absen Masuk dan Pulang Hari Ini - Hidden di mobile, visible on desktop */}
        {user && (
          <div className="hidden lg:block bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-5 sm:px-6 py-4 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 rounded-lg p-2">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Status Absen Kehadiran Hari Ini</h3>
                  <p className="text-xs sm:text-sm text-slate-600">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Masuk Status */}
                <div className={`rounded-lg sm:rounded-xl p-4 sm:p-5 border ${
                  todayDetailSantri.masukRawStatus === 'izin' ? 'bg-gradient-to-br from-yellow-50 to-yellow-50 border-yellow-100' :
                  todayDetailSantri.masukRawStatus === 'sakit' ? 'bg-gradient-to-br from-blue-50 to-blue-50 border-blue-100' :
                  todayDetailSantri.masukRawStatus === 'alfa' ? 'bg-gradient-to-br from-red-50 to-red-50 border-red-100' :
                  'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-2 ${
                        todayDetailSantri.masukRawStatus === 'izin' ? 'bg-yellow-600' :
                        todayDetailSantri.masukRawStatus === 'sakit' ? 'bg-blue-600' :
                        todayDetailSantri.masukRawStatus === 'alfa' ? 'bg-red-600' :
                        'bg-emerald-600'
                      }`}>
                        <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <p className={`text-xs sm:text-sm font-semibold uppercase ${
                        todayDetailSantri.masukRawStatus === 'izin' ? 'text-yellow-600' :
                        todayDetailSantri.masukRawStatus === 'sakit' ? 'text-blue-600' :
                        todayDetailSantri.masukRawStatus === 'alfa' ? 'text-red-600' :
                        'text-emerald-600'
                      }`}>Masuk</p>
                    </div>
                  </div>
                  {todayDetailSantri.masukRawStatus === 'izin' || todayDetailSantri.masukRawStatus === 'sakit' || todayDetailSantri.masukRawStatus === 'alfa' ? (
                    <div>
                      <p className={`text-2xl sm:text-3xl font-bold mb-1 uppercase ${
                        todayDetailSantri.masukRawStatus === 'izin' ? 'text-yellow-700' :
                        todayDetailSantri.masukRawStatus === 'sakit' ? 'text-blue-700' :
                        'text-red-700'
                      }`}>
                        {todayDetailSantri.masukRawStatus}
                      </p>
                      <p className={`text-xs sm:text-sm ${
                        todayDetailSantri.masukRawStatus === 'izin' ? 'text-yellow-600' :
                        todayDetailSantri.masukRawStatus === 'sakit' ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        Tidak Perlu Absen
                      </p>
                    </div>
                  ) : todayStatsSantri.waktuMasuk ? (
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold mb-1 text-emerald-700">
                        {todayStatsSantri.waktuMasuk}
                      </p>
                      <p className="text-xs sm:text-sm text-emerald-600">
                        {todayDetailSantri.displayStatusMasuk || 'Tepat Waktu'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-400 mb-1">-</p>
                      <p className="text-xs sm:text-sm text-slate-600">Belum Absen</p>
                    </div>
                  )}
                </div>

                {/* Pulang Status */}
                <div className={`rounded-lg sm:rounded-xl p-4 sm:p-5 border ${
                  todayDetailSantri.pulangRawStatus === 'izin' ? 'bg-gradient-to-br from-yellow-50 to-yellow-50 border-yellow-100' :
                  todayDetailSantri.pulangRawStatus === 'sakit' ? 'bg-gradient-to-br from-blue-50 to-blue-50 border-blue-100' :
                  todayDetailSantri.pulangRawStatus === 'alfa' ? 'bg-gradient-to-br from-red-50 to-red-50 border-red-100' :
                  'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-2 ${
                        todayDetailSantri.pulangRawStatus === 'izin' ? 'bg-yellow-600' :
                        todayDetailSantri.pulangRawStatus === 'sakit' ? 'bg-blue-600' :
                        todayDetailSantri.pulangRawStatus === 'alfa' ? 'bg-red-600' :
                        'bg-amber-600'
                      }`}>
                        <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <p className={`text-xs sm:text-sm font-semibold uppercase ${
                        todayDetailSantri.pulangRawStatus === 'izin' ? 'text-yellow-600' :
                        todayDetailSantri.pulangRawStatus === 'sakit' ? 'text-blue-600' :
                        todayDetailSantri.pulangRawStatus === 'alfa' ? 'text-red-600' :
                        'text-amber-600'
                      }`}>Pulang</p>
                    </div>
                  </div>
                  {todayDetailSantri.pulangRawStatus === 'izin' || todayDetailSantri.pulangRawStatus === 'sakit' || todayDetailSantri.pulangRawStatus === 'alfa' ? (
                    <div>
                      <p className={`text-2xl sm:text-3xl font-bold mb-1 uppercase ${
                        todayDetailSantri.pulangRawStatus === 'izin' ? 'text-yellow-700' :
                        todayDetailSantri.pulangRawStatus === 'sakit' ? 'text-blue-700' :
                        'text-red-700'
                      }`}>
                        {todayDetailSantri.pulangRawStatus === 'alfa' ? 'ALFA' : todayDetailSantri.pulangRawStatus}
                      </p>
                      <p className={`text-xs sm:text-sm ${
                        todayDetailSantri.pulangRawStatus === 'izin' ? 'text-yellow-600' :
                        todayDetailSantri.pulangRawStatus === 'sakit' ? 'text-blue-600' :
                        'text-red-600'
                      }`}>
                        {todayDetailSantri.pulangRawStatus === 'alfa' ? 'Tidak Absen' : 'Tidak Perlu Absen'}
                      </p>
                    </div>
                  ) : todayStatsSantri.waktuPulang ? (
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold mb-1 text-amber-700">
                        {todayStatsSantri.waktuPulang}
                      </p>
                      <p className="text-xs sm:text-sm text-amber-600">
                        {todayDetailSantri.displayStatusPulang || 'Tepat Waktu'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-400 mb-1">-</p>
                      <p className="text-xs sm:text-sm text-slate-600">Belum Absen</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jadwal Tahfiz Hari Ini */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-5 sm:px-6 py-4 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Jadwal Tahfiz Hari Ini</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/jadwal-tahfiz-murid')}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                Lihat Semua →
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-5 lg:p-6">
            {todayTahfizSchedules.length > 0 ? (
              <div className="space-y-3">
                {todayTahfizSchedules.map((schedule) => {
                  const kelas = myTahfizClasses.find(c => c.id === schedule.kelasId);
                  const ustadzName = kelas ? getUstadzName(kelas.ustadzId) : 'Belum diatur';
                  const session = todayTahfizSessions.find(s => s.jadwalId === schedule.id);
                  const attendance = session?.dataAbsensi?.find((a: any) => a.muridId === user?.id || a.santriId === user?.id);
                  
                  // Get attendance status badge
                  const getAttendanceBadge = () => {
                    if (!attendance) {
                      if (session) {
                        return (
                          <button
                            onClick={() => navigate('/dashboard/absensi-santri-tahfiz')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Absen
                          </button>
                        );
                      } else {
                        return (
                          <div className="text-xs text-slate-400 px-3 py-1.5">
                            Belum mulai
                          </div>
                        );
                      }
                    }
                    
                    const status = attendance.status;
                    let bgColor = '';
                    let textColor = '';
                    let icon = null;
                    let label = '';
                    
                    switch (status) {
                      case 'izin':
                        bgColor = 'bg-yellow-50';
                        textColor = 'text-yellow-700';
                        icon = <AlertCircle className="w-4 h-4" />;
                        label = 'Izin';
                        break;
                      case 'sakit':
                        bgColor = 'bg-blue-50';
                        textColor = 'text-blue-700';
                        icon = <AlertCircle className="w-4 h-4" />;
                        label = 'Sakit';
                        break;
                      case 'alfa':
                        bgColor = 'bg-red-50';
                        textColor = 'text-red-700';
                        icon = <AlertCircle className="w-4 h-4" />;
                        label = 'Alfa';
                        break;
                      case 'terlambat':
                        bgColor = 'bg-orange-50';
                        textColor = 'text-orange-700';
                        icon = <Clock className="w-4 h-4" />;
                        label = 'Terlambat';
                        break;
                      case 'pulang_cepat':
                        bgColor = 'bg-amber-50';
                        textColor = 'text-amber-700';
                        icon = <Clock className="w-4 h-4" />;
                        label = 'Pulang Cepat';
                        break;
                      case 'hadir':
                      default:
                        bgColor = 'bg-emerald-50';
                        textColor = 'text-emerald-700';
                        icon = <CheckCircle className="w-4 h-4" />;
                        label = 'Hadir';
                        break;
                    }
                    
                    return (
                      <div className={`flex items-center gap-2 ${bgColor} ${textColor} px-3 py-1.5 rounded-lg`}>
                        {icon}
                        <span className="text-xs font-medium">{label}</span>
                      </div>
                    );
                  };
                  
                  return (
                    <div
                      key={schedule.id}
                      className="border border-slate-200 rounded-lg p-4 hover:border-emerald-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-600">
                              {formatTime(schedule.jamMulai)} - {formatTime(schedule.jamSelesai)}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mb-1">
                            {kelas?.namaKelas || 'Kelas tidak ditemukan'}
                          </h4>
                          <p className="text-sm text-slate-600 mb-2">
                            Ruangan: {kelas?.ruangan || '-'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{ustadzName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {getAttendanceBadge()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-600">Tidak ada jadwal tahfiz hari ini</p>
                <button
                  onClick={() => navigate('/dashboard/jadwal-tahfiz-murid')}
                  className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  Lihat jadwal lengkap →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Hapalan Ringkasan */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-5 sm:px-6 py-4 border-b border-teal-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Progress Hapalan</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Ringkasan hafalan Anda</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/progress-hapalan-murid')}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
              >
                Detail →
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-5 lg:p-6">
            {progressStats.totalJuz > 0 || progressStats.totalSurah > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Total Juz</p>
                    <p className="text-3xl font-bold text-teal-600">{progressStats.totalJuz} / 30</p>
                  </div>
                  <div className="bg-teal-600 rounded-full p-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Total Surah</p>
                    <p className="text-3xl font-bold text-cyan-600">{progressStats.totalSurah}</p>
                  </div>
                  <div className="bg-cyan-600 rounded-full p-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                </div>
                {progressStats.lastUpdate && (
                  <p className="text-xs text-slate-500 text-center">
                    Terakhir diperbarui: {new Date(progressStats.lastUpdate).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-600 mb-2">Belum ada progress hapalan</p>
                <p className="text-xs text-slate-500">Mulai hafalan Anda hari ini!</p>
              </div>
            )}
          </div>
        </div>

        {/* Kelas Tahfiz yang Diikuti */}
        {myTahfizClasses.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 sm:px-6 py-4 border-b border-green-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Kelas Tahfiz Anda</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Daftar kelas tahfiz yang Anda ikuti</p>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myTahfizClasses.map((kelas) => {
                  const ustadzName = getUstadzName(kelas.ustadzId);
                  const jadwalKelas = myTahfizSchedules.filter(j => j.kelasId === kelas.id);
                  
                  return (
                    <div
                      key={kelas.id}
                      className="border border-emerald-200 rounded-lg p-4 hover:border-emerald-300 hover:shadow-md transition-all bg-gradient-to-br from-emerald-50 to-green-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-slate-900 mb-1">{kelas.namaKelas}</h4>
                          <p className="text-sm text-slate-600 mb-2">Ruangan: {kelas.ruangan}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Users className="w-4 h-4" />
                            <span>{ustadzName}</span>
                          </div>
                        </div>
                        <div className="bg-emerald-600 rounded-lg p-2">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <p className="text-xs text-slate-600">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {jadwalKelas.length} jadwal per minggu
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/dashboard/jadwal-tahfiz-murid')}
            className="bg-white border border-emerald-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all text-center"
          >
            <Calendar className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
            <p className="text-sm font-medium text-slate-900">Jadwal Tahfiz</p>
          </button>
          <button
            onClick={() => navigate('/dashboard/absensi-santri-tahfiz')}
            className="bg-white border border-teal-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-md transition-all text-center"
          >
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-teal-600" />
            <p className="text-sm font-medium text-slate-900">Absensi</p>
          </button>
          <button
            onClick={() => navigate('/dashboard/progress-hapalan-murid')}
            className="bg-white border border-cyan-200 rounded-xl p-4 hover:border-cyan-300 hover:shadow-md transition-all text-center"
          >
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-cyan-600" />
            <p className="text-sm font-medium text-slate-900">Progress</p>
          </button>
          <button
            onClick={() => navigate('/dashboard/qr-code')}
            className="bg-white border border-green-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all text-center"
          >
            <QrCode className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium text-slate-900">QR Code</p>
          </button>
        </div>
      </div>
    );
  }

  // Dashboard untuk murid biasa dan alumni (tampilan asli)
  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Welcome Header */}
      <div className={`rounded-2xl shadow-lg overflow-hidden ${
        isAlumni 
          ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600' 
          : 'bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600'
      }`}>
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Selamat Datang, {user?.name}!
              </h1>
              <p className="text-sm sm:text-base text-white/90">
                {isAlumni ? (
                  <>
                    <span className="inline-flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Alumni
                    
                    {(() => {
                      const alumniData = alumni.find(a => a.muridId === user?.id);
                      return alumniData ? ` - Lulus Tahun ${alumniData.tahunLulus}` : '';
                    })()}</span>
                  </>
                ) : (
                  `Kelas ${myKelas?.name || 'Tidak ada'}` + (activeTahunAjaran ? ` - ${activeTahunAjaran.tahun} Semester ${activeTahunAjaran.semester}` : '')
                )}
              </p>
            </div>
            {isAlumni && (
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-12 h-12 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Absen Masuk & Pulang Buttons - Mobile & Tablet Only - Hanya untuk murid aktif */}
      {!isAlumni && user && user.role === 'murid' && (
        <div className="lg:hidden space-y-4">
          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Absen Masuk Button */}
            {todayDetail.hasMasuk && todayDetail.masukRawStatus !== 'izin' && todayDetail.masukRawStatus !== 'sakit' && todayDetail.masukRawStatus !== 'alfa' ? (
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
                    {formatTimeWithDot(todayStats.waktuMasuk)}
                  </p>
                  <p className="text-slate-600 text-xs sm:text-sm font-medium">
                    {todayDetail.displayStatusMasuk || 'Tepat Waktu'}
                  </p>
                </div>
              </div>
            ) : (todayDetail.masukRawStatus === 'izin' || todayDetail.masukRawStatus === 'sakit') ? (
              // Display mode: Show IZIN/SAKIT status
              <div className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
                todayDetail.masukRawStatus === 'izin'
                  ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300'
                  : 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                    todayDetail.masukRawStatus === 'izin'
                      ? 'bg-yellow-400/30'
                      : 'bg-blue-400/30'
                  }`}>
                    <LogIn className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      todayDetail.masukRawStatus === 'izin'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <span className={`font-bold text-sm sm:text-base uppercase ${
                    todayDetail.masukRawStatus === 'izin'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}>Masuk</span>
                </div>
                <div className="space-y-1">
                  <p className={`font-bold text-2xl sm:text-3xl uppercase ${
                    todayDetail.masukRawStatus === 'izin'
                      ? 'text-yellow-700'
                      : 'text-blue-700'
                  }`}>
                    {todayDetail.masukRawStatus === 'izin' ? 'IZIN' : 'SAKIT'}
                  </p>
                  <p className={`text-xs sm:text-sm font-medium ${
                    todayDetail.masukRawStatus === 'izin'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}>
                    Tidak Perlu Absen
                  </p>
                </div>
              </div>
            ) : (activePengaturanAbsen?.enableManualAbsen !== false) ? (
              // Button mode: Clickable or disabled (only show if manual absen is enabled)
              <button
                onClick={handleAbsenMasuk}
                disabled={
                  isSubmittingMasuk ||
                  todayDetail.hasMasuk ||
                  todayDetail.masukRawStatus === 'izin' ||
                  todayDetail.masukRawStatus === 'sakit' ||
                  todayDetail.masukRawStatus === 'alfa'
                }
                className={`relative flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-2xl shadow-lg transition-all duration-200 ${
                  isSubmittingMasuk ||
                  todayDetail.hasMasuk ||
                  todayDetail.masukRawStatus === 'izin' ||
                  todayDetail.masukRawStatus === 'sakit' ||
                  todayDetail.masukRawStatus === 'alfa'
                    ? 'bg-gradient-to-br from-slate-200 to-slate-300 cursor-not-allowed'
                    : 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 active:scale-95 shadow-blue-500/50'
                }`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                  isSubmittingMasuk ||
                  todayDetail.hasMasuk ||
                  todayDetail.masukRawStatus === 'izin' ||
                  todayDetail.masukRawStatus === 'sakit' ||
                  todayDetail.masukRawStatus === 'alfa'
                    ? 'bg-slate-400/30'
                    : 'bg-white/20 backdrop-blur-sm'
                }`}>
                  <LogIn className={`w-6 h-6 sm:w-8 sm:h-8 ${
                    isSubmittingMasuk ||
                    todayDetail.hasMasuk ||
                    todayDetail.masukRawStatus === 'izin' ||
                    todayDetail.masukRawStatus === 'sakit' ||
                    todayDetail.masukRawStatus === 'alfa'
                      ? 'text-slate-600'
                      : 'text-white'
                  }`} />
                </div>
                <span className={`font-semibold text-sm sm:text-base text-center ${
                  isSubmittingMasuk ||
                  todayDetail.hasMasuk ||
                  todayDetail.masukRawStatus === 'izin' ||
                  todayDetail.masukRawStatus === 'sakit' ||
                  todayDetail.masukRawStatus === 'alfa'
                    ? 'text-slate-600'
                    : 'text-white'
                }`}>Absen Masuk</span>
                {isSubmittingMasuk && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            ) : null}

            {/* Absen Pulang Button */}
            {todayDetail.hasPulang && todayDetail.pulangRawStatus !== 'izin' && todayDetail.pulangRawStatus !== 'sakit' ? (
              // Display mode: Show time and status (termasuk alfa)
              <div className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
                todayDetail.pulangRawStatus === 'alfa' 
                  ? 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-200' 
                  : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                    todayDetail.pulangRawStatus === 'alfa' 
                      ? 'bg-slate-300/30' 
                      : 'bg-slate-300/30'
                  }`}>
                    <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                  </div>
                  <span className="text-slate-500 font-bold text-sm sm:text-base uppercase">Pulang</span>
                </div>
                <div className="space-y-1">
                  <p className={`font-bold text-2xl sm:text-3xl ${
                    todayDetail.pulangRawStatus === 'alfa' 
                      ? 'text-slate-500 uppercase' 
                      : 'text-slate-500'
                  }`}>
                    {todayDetail.pulangRawStatus === 'alfa' 
                      ? 'ALFA' 
                      : formatTimeWithDot(todayStats.waktuPulang)}
                  </p>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    {todayDetail.displayStatusPulang || 'Tepat Waktu'}
                  </p>
                </div>
              </div>
            ) : (todayDetail.pulangRawStatus === 'izin' || todayDetail.pulangRawStatus === 'sakit') ? (
              // Display mode: Show IZIN/SAKIT status
              <div className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
                todayDetail.pulangRawStatus === 'izin'
                  ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300'
                  : 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                    todayDetail.pulangRawStatus === 'izin'
                      ? 'bg-yellow-400/30'
                      : 'bg-blue-400/30'
                  }`}>
                    <LogOut className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      todayDetail.pulangRawStatus === 'izin'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <span className={`font-bold text-sm sm:text-base uppercase ${
                    todayDetail.pulangRawStatus === 'izin'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}>Pulang</span>
                </div>
                <div className="space-y-1">
                  <p className={`font-bold text-2xl sm:text-3xl uppercase ${
                    todayDetail.pulangRawStatus === 'izin'
                      ? 'text-yellow-700'
                      : 'text-blue-700'
                  }`}>
                    {todayDetail.pulangRawStatus === 'izin' ? 'IZIN' : 'SAKIT'}
                  </p>
                  <p className={`text-xs sm:text-sm font-medium ${
                    todayDetail.pulangRawStatus === 'izin'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}>
                    Tidak Perlu Absen
                  </p>
                </div>
              </div>
            ) : (activePengaturanAbsen?.enableManualAbsen !== false) ? (
              // Button mode: Clickable or disabled (only show if manual absen is enabled)
              <button
                onClick={handleAbsenPulang}
                disabled={
                  isSubmittingPulang ||
                  !todayDetail.hasMasuk ||
                  todayDetail.hasPulang ||
                  todayDetail.pulangRawStatus === 'izin' ||
                  todayDetail.pulangRawStatus === 'sakit' ||
                  todayDetail.pulangRawStatus === 'alfa'
                }
                className={`relative flex flex-col items-center justify-center gap-3 p-5 sm:p-6 rounded-2xl shadow-lg transition-all duration-200 ${
                  isSubmittingPulang ||
                  !todayDetail.hasMasuk ||
                  todayDetail.hasPulang ||
                  todayDetail.pulangRawStatus === 'izin' ||
                  todayDetail.pulangRawStatus === 'sakit' ||
                  todayDetail.pulangRawStatus === 'alfa'
                    ? 'bg-gradient-to-br from-slate-100 to-slate-200 cursor-not-allowed'
                    : 'bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:via-orange-600 hover:to-orange-700 active:scale-95 shadow-orange-500/50'
                }`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${
                  isSubmittingPulang ||
                  !todayDetail.hasMasuk ||
                  todayDetail.hasPulang ||
                  todayDetail.pulangRawStatus === 'izin' ||
                  todayDetail.pulangRawStatus === 'sakit' ||
                  todayDetail.pulangRawStatus === 'alfa'
                    ? 'bg-slate-300/30'
                    : 'bg-white/20 backdrop-blur-sm'
                }`}>
                  <LogOut className={`w-6 h-6 sm:w-8 sm:h-8 ${
                    isSubmittingPulang ||
                    !todayDetail.hasMasuk ||
                    todayDetail.hasPulang ||
                    todayDetail.pulangRawStatus === 'izin' ||
                    todayDetail.pulangRawStatus === 'sakit' ||
                    todayDetail.pulangRawStatus === 'alfa'
                      ? 'text-slate-500'
                      : 'text-white'
                  }`} />
                </div>
                <span className={`font-semibold text-sm sm:text-base text-center ${
                  isSubmittingPulang ||
                  !todayDetail.hasMasuk ||
                  todayDetail.hasPulang ||
                  todayDetail.pulangRawStatus === 'izin' ||
                  todayDetail.pulangRawStatus === 'sakit' ||
                  todayDetail.pulangRawStatus === 'alfa'
                    ? 'text-slate-500'
                    : 'text-white'
                }`}>Absen Pulang</span>
                {isSubmittingPulang && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            ) : null}
          </div>

          {/* Status Bar */}
          <div className={`${getStatusBarColor()} rounded-2xl shadow-lg overflow-hidden transition-all duration-300`}>
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white font-bold text-sm mb-1">Status Hari Ini</p>
                <p className="text-white text-base">{getStatusText()}</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/absen-kehadiran')}
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
        <MuridMenuCards />
      </div>

      {/* Stats Grid - Hanya untuk murid aktif */}
      {!isAlumni && (<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden"
            >
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-center ">
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
      )}

      {/* Absen Masuk dan Pulang Hari Ini - Hanya untuk murid aktif - Hidden di mobile */}
      {!isAlumni && (<div className="hidden lg:block bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 sm:px-6 py-4 border-b border-green-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 rounded-lg p-2">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Status Absen Kehadiran Hari Ini</h3>
              <p className="text-xs sm:text-sm text-slate-600">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Masuk Status */}
            <div className={`rounded-lg sm:rounded-xl p-4 sm:p-5 border ${
              todayDetail.masukRawStatus === 'izin' ? 'bg-gradient-to-br from-yellow-50 to-yellow-50 border-yellow-100' :
              todayDetail.masukRawStatus === 'sakit' ? 'bg-gradient-to-br from-blue-50 to-blue-50 border-blue-100' :
              todayDetail.masukRawStatus === 'alfa' ? 'bg-gradient-to-br from-red-50 to-red-50 border-red-100' :
              'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-2 ${
                    todayDetail.masukRawStatus === 'izin' ? 'bg-yellow-600' :
                    todayDetail.masukRawStatus === 'sakit' ? 'bg-blue-600' :
                    todayDetail.masukRawStatus === 'alfa' ? 'bg-red-600' :
                    'bg-emerald-600'
                  }`}>
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className={`text-xs sm:text-sm font-semibold uppercase ${
                    todayDetail.masukRawStatus === 'izin' ? 'text-yellow-600' :
                    todayDetail.masukRawStatus === 'sakit' ? 'text-blue-600' :
                    todayDetail.masukRawStatus === 'alfa' ? 'text-red-600' :
                    'text-emerald-600'
                  }`}>Masuk</p>
                </div>
              </div>
              {todayDetail.masukRawStatus === 'izin' || todayDetail.masukRawStatus === 'sakit' || todayDetail.masukRawStatus === 'alfa' ? (
                <div>
                  <p className={`text-2xl sm:text-3xl font-bold mb-1 uppercase ${
                    todayDetail.masukRawStatus === 'izin' ? 'text-yellow-700' :
                    todayDetail.masukRawStatus === 'sakit' ? 'text-blue-700' :
                    'text-red-700'
                  }`}>
                    {todayDetail.masukRawStatus}
                  </p>
                  <p className={`text-xs sm:text-sm ${
                    todayDetail.masukRawStatus === 'izin' ? 'text-yellow-600' :
                    todayDetail.masukRawStatus === 'sakit' ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    Tidak Perlu Absen
                  </p>
                </div>
              ) : todayStats.waktuMasuk ? (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold mb-1 text-emerald-700">
                    {todayStats.waktuMasuk}
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-600">
                    {todayDetail.displayStatusMasuk || 'Tepat Waktu'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-400 mb-1">-</p>
                  <p className="text-xs sm:text-sm text-slate-600">Belum Absen</p>
                </div>
              )}
            </div>

            {/* Pulang Status */}
            <div className={`rounded-lg sm:rounded-xl p-4 sm:p-5 border ${
              todayDetail.pulangRawStatus === 'izin' ? 'bg-gradient-to-br from-yellow-50 to-yellow-50 border-yellow-100' :
              todayDetail.pulangRawStatus === 'sakit' ? 'bg-gradient-to-br from-blue-50 to-blue-50 border-blue-100' :
              todayDetail.pulangRawStatus === 'alfa' ? 'bg-gradient-to-br from-red-50 to-red-50 border-red-100' :
              'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-2 ${
                    todayDetail.pulangRawStatus === 'izin' ? 'bg-yellow-600' :
                    todayDetail.pulangRawStatus === 'sakit' ? 'bg-blue-600' :
                    todayDetail.pulangRawStatus === 'alfa' ? 'bg-red-600' :
                    'bg-amber-600'
                  }`}>
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className={`text-xs sm:text-sm font-semibold uppercase ${
                    todayDetail.pulangRawStatus === 'izin' ? 'text-yellow-600' :
                    todayDetail.pulangRawStatus === 'sakit' ? 'text-blue-600' :
                    todayDetail.pulangRawStatus === 'alfa' ? 'text-red-600' :
                    'text-amber-600'
                  }`}>Pulang</p>
                </div>
              </div>
              {todayDetail.pulangRawStatus === 'izin' || todayDetail.pulangRawStatus === 'sakit' || todayDetail.pulangRawStatus === 'alfa' ? (
                <div>
                  <p className={`text-2xl sm:text-3xl font-bold mb-1 uppercase ${
                    todayDetail.pulangRawStatus === 'izin' ? 'text-yellow-700' :
                    todayDetail.pulangRawStatus === 'sakit' ? 'text-blue-700' :
                    'text-red-700'
                  }`}>
                    {todayDetail.pulangRawStatus === 'alfa' ? 'ALFA' : todayDetail.pulangRawStatus}
                  </p>
                  <p className={`text-xs sm:text-sm ${
                    todayDetail.pulangRawStatus === 'izin' ? 'text-yellow-600' :
                    todayDetail.pulangRawStatus === 'sakit' ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {todayDetail.pulangRawStatus === 'alfa' ? 'Tidak Absen' : 'Tidak Perlu Absen'}
                  </p>
                </div>
              ) : todayStats.waktuPulang ? (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold mb-1 text-amber-700">
                    {todayStats.waktuPulang}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-600">
                    {todayDetail.displayStatusPulang || 'Tepat Waktu'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-400 mb-1">-</p>
                  <p className="text-xs sm:text-sm text-slate-600">Belum Absen</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Jadwal Hari Ini & Statistik Kehadiran - Hanya untuk murid aktif */}
      {!isAlumni && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        {/* Jadwal Hari Ini */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 sm:px-6 py-4 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Jadwal Hari Ini</h3>
                <p className="text-xs sm:text-sm text-slate-600">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 lg:p-6">
            {todaySchedules.length > 0 ? (
              <div className="space-y-3">
                {todaySchedules.map((jadwal) => {
                  const session = todaySessions.find(s => s.jadwalId === jadwal.id);
                  const attendance = todayAttendance.find(a => {
                    const sesi = sesiAbsensi.find(s => s.id === a.sesiId);
                    return sesi?.jadwalId === jadwal.id;
                  });

                  return (
                    <div 
                      key={jadwal.id} 
                      onClick={() => navigate('/dashboard/absensi-saya', { state: { scrollToJadwalId: jadwal.id } })}
                      className="group relative bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-blue-300 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 text-sm sm:text-base mb-1">
                            {getMapelName(jadwal.mataPelajaranId)}
                          </p>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <p className="text-xs sm:text-sm">
                              {jadwal.jamMulai} - {jadwal.jamSelesai}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {attendance && attendance.status ? (
                            <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
                              attendance.status === 'hadir' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              attendance.status === 'izin' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              attendance.status === 'sakit' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {attendance.status.toUpperCase()}
                            </span>
                          ) : session?.status === 'dibuka' ? (
                            <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 animate-pulse">
                              <QrCode className="w-3 h-3 mr-1" />
                              Scan QR
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                              Sesi Tutup
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm sm:text-base font-medium text-slate-500">Tidak ada jadwal hari ini</p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Nikmati hari istirahatmu!</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistik Kehadiran */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 sm:px-6 py-4 border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 rounded-lg p-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Statistik Kehadiran</h3>
                <p className="text-xs sm:text-sm text-slate-600">{activeTahunAjaran?.tahun || ''} Semester {activeTahunAjaran?.semester || ''}</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
            {/* Progress Circle */}
            <div className="flex items-center justify-between bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-emerald-100">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-emerald-700 mb-2">Tingkat Kehadiran</p>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-600">{attendanceRate}%</p>
                <p className="text-xs sm:text-sm text-emerald-600 mt-1">{attendanceStats.total} total kehadiran</p>
              </div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <svg className="transform -rotate-90 w-20 h-20 sm:w-24 sm:h-24">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-emerald-200"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - parseFloat(attendanceRate) / 100)}`}
                    className="text-emerald-600 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-emerald-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{attendanceStats.hadir}</p>
                <p className="text-xs sm:text-sm font-medium text-emerald-600 mt-1">Hadir</p>
              </div>
              <div className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-amber-700">{attendanceStats.izin}</p>
                <p className="text-xs sm:text-sm font-medium text-amber-600 mt-1">Izin</p>
              </div>
              <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-700">{attendanceStats.sakit}</p>
                <p className="text-xs sm:text-sm font-medium text-blue-600 mt-1">Sakit</p>
              </div>
              <div className="group bg-gradient-to-br from-red-50 to-rose-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-red-700">{attendanceStats.alfa}</p>
                <p className="text-xs sm:text-sm font-medium text-red-600 mt-1">Alfa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Dashboard Khusus Alumni */}
      {isAlumni && (
        <div className="space-y-5 lg:space-y-6">
          {/* Informasi Alumni */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 sm:px-6 py-4 border-b border-emerald-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Informasi Alumni</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Data kelulusan dan pencapaian akademik</p>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              {(() => {
                const alumniData = alumni.find(a => a.muridId === user?.id);
                if (!alumniData) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-slate-500">Data alumni tidak ditemukan</p>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* Tahun Lulus */}
                    <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-5 border border-emerald-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-2">Tahun Lulus</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-900">{alumniData.tahunLulus}</p>
                        </div>
                        <div className="bg-emerald-600 rounded-lg p-2 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200">
                          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Nilai Akhir */}
                    <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-5 border border-blue-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Nilai Akhir</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{alumniData.nilaiAkhir.toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-600 rounded-lg p-2 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200">
                          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Peringkat Kelas */}
                    <div className="group bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 sm:p-5 border border-purple-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">Peringkat Kelas</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">#{alumniData.peringkatKelas}</p>
                          <p className="text-xs text-purple-600 mt-1">{alumniData.namaKelas}</p>
                        </div>
                        <div className="bg-purple-600 rounded-lg p-2 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200">
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Peringkat Sekolah */}
                    <div className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 sm:p-5 border border-amber-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-amber-600 uppercase tracking-wide mb-2">Peringkat Sekolah</p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-900">#{alumniData.peringkatSekolah}</p>
                        </div>
                        <div className="bg-amber-600 rounded-lg p-2 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200">
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Pencapaian Akademik */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 sm:px-6 py-4 border-b border-indigo-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Pencapaian Akademik</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Ringkasan prestasi selama masa sekolah</p>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              {(() => {
                const alumniData = alumni.find(a => a.muridId === user?.id);
                if (!alumniData) return null;
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                    {/* Tingkat Kehadiran */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 sm:p-6 border border-emerald-100">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-semibold text-emerald-700 mb-1">Tingkat Kehadiran</p>
                          <p className="text-3xl sm:text-4xl font-bold text-emerald-900">{alumniData.tingkatKehadiran.toFixed(1)}%</p>
                        </div>
                        <div className="bg-emerald-600 rounded-xl p-3">
                          <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="w-full bg-emerald-200 rounded-full h-3">
                        <div 
                          className="bg-emerald-600 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${alumniData.tingkatKehadiran}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Informasi Kelulusan */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 sm:p-6 border border-blue-100">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Kelas Saat Lulus</p>
                          <p className="text-lg font-bold text-blue-900">{alumniData.namaKelas}</p>
                        </div>
                        {alumniData.namaJurusan && (
                          <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Jurusan</p>
                            <p className="text-lg font-bold text-blue-900">{alumniData.namaJurusan}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Tanggal Lulus</p>
                          <p className="text-lg font-bold text-blue-900">
                            {new Date(alumniData.tanggalLulus).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {alumniData.namaWaliKelasSebelumnya && (
                          <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Wali Kelas</p>
                            <p className="text-base font-semibold text-blue-900">{alumniData.namaWaliKelasSebelumnya}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Catatan Penting untuk Alumni */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="bg-amber-600 rounded-lg p-3 flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-amber-900 mb-2">Informasi Penting untuk Alumni</h3>
                  <div className="space-y-2 text-sm text-amber-800">
                    <p>• <strong>Absensi:</strong> Sebagai alumni, Anda tidak dapat melakukan absensi menggunakan RFID atau QRCode karena status Anda sudah tidak aktif sebagai murid.</p>
                    <p>• <strong>Akses Data:</strong> Anda masih dapat mengakses data akademik seperti nilai, raport, dan e-raport melalui menu yang tersedia.</p>
                    <p>• <strong>QR Code:</strong> QR Code Anda tetap dapat digunakan untuk keperluan identitas, namun tidak dapat digunakan untuk absensi.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informasi Kelas - Hanya untuk murid aktif */}
      {!isAlumni && (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 sm:px-6 py-4 border-b border-slate-200">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Informasi Akademik</h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">Detail informasi akademik</p>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Kelas / Alumni Status */}
            <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-5 border border-blue-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Kelas</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{myKelas?.name || 'Tidak ada'}</p>
                </div>
                <div className="bg-blue-600 rounded-lg p-2 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Total Mata Pelajaran */}
            <div className="group bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 sm:p-5 border border-violet-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-violet-600 uppercase tracking-wide mb-2">Mata Pelajaran</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-violet-900">{totalMataPelajaran}</p>
                  <p className="text-xs text-violet-600 mt-1">
                    {activeTahunAjaran ? `Semester ${activeTahunAjaran.semester}` : 'Tidak ada semester aktif'}
                  </p>
                </div>
                <div className="bg-violet-600 rounded-lg p-2 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Surat Izin */}
            <div className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 sm:p-5 border border-amber-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-amber-600 uppercase tracking-wide mb-2">Surat Izin</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-900">{pendingSuratIzin.length}</p>
                  <p className="text-xs text-amber-600 mt-1">Menunggu approval</p>
                </div>
                <div className="bg-amber-600 rounded-lg p-2 sm:p-2.5 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default MuridDashboard;

