import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import Card from '../../../ui/Card';
import QRScanner, { ScanResult } from '../../../ui/QRScanner';
import { useAuth } from '../../../../context/AuthContext';
import { User, Kelas, SesiAbsensi, Absensi } from '../../../../types';
import { parseQRCodeData } from '../../../../utils/qrCodeGenerator';
import { sseAbsenService } from '../../../../services/sseAbsenService';
import AbsenKelasHeader from './components/absen-kelas/AbsenKelasHeader';
import AbsenKelasWarning from './components/absen-kelas/AbsenKelasWarning';
import AbsenKelasSessionCard from './components/absen-kelas/AbsenKelasSessionCard';
import AbsenKelasTable from './components/absen-kelas/AbsenKelasTable';
import AbsenKelasManualModal from './components/absen-kelas/AbsenKelasManualModal';
import AbsenKelasKeteranganModal from './components/absen-kelas/AbsenKelasKeteranganModal';
import { sendWhatsAppNotification as sendWhatsApp, showNotification } from './components/absen-kelas/AbsenKelasUtils';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useAbsensi, clearAbsensiCache } from '../../../../hooks/useAbsensi';
import { usePengaturanAbsen } from '../../../../hooks/usePengaturanAbsen';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { apiService } from '../../../../services/apiService';
import { isAttendanceDayAllowed, getDayNameInIndonesian } from '../../../../utils/attendanceDayValidation';
import { getLocalTimeISOString } from '../../../../utils/absensiUtils';

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AbsenKelas: React.FC = () => {
  const { user } = useAuth();
  
  // State declarations first
  const [activeSession, setActiveSession] = useState<'masuk' | 'pulang' | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  
  // State untuk scan result modal
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Use hooks with cache
  const { gurus } = useGurus();
  const { murid } = useMurid({ kelasId: user?.kelasWali, status: 'active' });
  const { kelas } = useKelas();
  const { pengaturanAbsen } = usePengaturanAbsen();
  const { enableEarlyDeparture } = usePengaturanSistem();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  
  // Get absensi for selected date and kelas
  const { absensi, createAbsensi, updateAbsensi, refreshAbsensi } = useAbsensi({
    kelasId: user?.kelasWali,
    tanggal: selectedDate
  });

  // State for session metadata (stored in absensi collection)
  const [masukSession, setMasukSession] = useState<SesiAbsensi | null>(null);
  const [pulangSession, setPulangSession] = useState<SesiAbsensi | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  
  // Combine gurus and murid into users array for compatibility
  const users = useMemo(() => {
    return [...gurus, ...murid];
  }, [gurus, murid]);

  const scrollPositionRef = React.useRef<number>(0);

  // State untuk mencegah double scan
  const [lastProcessedScan, setLastProcessedScan] = useState<{data: string, time: number} | null>(null);
  const SCAN_DEBOUNCE_TIME = 2000;

  // Force re-render when absensi changes
  const [refreshKey, setRefreshKey] = useState(0);

  // State untuk tracking waktu pembukaan session (untuk auto-close setelah 5 menit)
  const sessionTimersRef = React.useRef<{masuk?: NodeJS.Timeout, pulang?: NodeJS.Timeout}>({});
  const sessionIdsRef = React.useRef<{masuk?: string, pulang?: string}>({});

  if (!user?.isWaliKelas || !user.kelasWali) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
        <p className="text-gray-600">Anda tidak memiliki akses sebagai wali kelas.</p>
      </Card>
    );
  }

  const myKelas = kelas.find(k => k.id === user.kelasWali);
  const muridKelas = useMemo(() => {
    return murid.filter(m => m.kelasId === user.kelasWali && m.isActive !== false);
  }, [murid, user.kelasWali]);
  const today = getLocalDateString();
  const isToday = selectedDate === today;

  // Fetch session metadata from absensi collection
  const fetchSessionMetadata = async (sessionType: 'masuk' | 'pulang') => {
    if (!user?.kelasWali || !activeTahunAjaran) return null;
    
    try {
      const response = await apiService.getSessionMetadata({
        tanggal: selectedDate,
        kelasId: user.kelasWali,
        sessionType,
        tahunAjaranId: activeTahunAjaran.id,
        semester: activeTahunAjaran.semester,
      });
      
      if (response.success && response.session) {
        return response.session;
      }
      return null;
    } catch (error) {
      console.error('Error fetching session metadata:', error);
      return null;
    }
  };

  // Load sessions when selectedDate or activeTahunAjaran changes
  useEffect(() => {
    if (!user?.kelasWali || !activeTahunAjaran) return;
    
    setSessionsLoading(true);
    Promise.all([
      fetchSessionMetadata('masuk'),
      fetchSessionMetadata('pulang'),
    ]).then(([masuk, pulang]) => {
      setMasukSession(masuk);
      setPulangSession(pulang);
      setSessionsLoading(false);
    });
  }, [selectedDate, user?.kelasWali, activeTahunAjaran?.id, activeTahunAjaran?.semester]);

  // Get selected date's attendance sessions for the class
  const selectedDateMasukSession = masukSession;
  const selectedDatePulangSession = pulangSession;

  const openSession = async (type: 'masuk' | 'pulang') => {
    // Only allow opening sessions for today
    if (selectedDate !== today) {
      showNotification('warning', 'Tidak Dapat Membuka Sesi', 'Sesi absensi hanya dapat dibuka untuk hari ini!');
      return;
    }

    // Check enableEarlyDeparture restriction for pulang session
    if (type === 'pulang') {
      const activePengaturan = pengaturanAbsen.find(p => p.isActive) || pengaturanAbsen[0];
      if (!enableEarlyDeparture && activePengaturan) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [jamPulangHour, jamPulangMinute] = activePengaturan.jamPulang.split(':').map(Number);
        
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
        const batasPulang15Menit = jamPulangMinutes - 15;

        // If trying to open pulang session before 15 minutes before jam pulang, reject
        if (currentTimeMinutes < batasPulang15Menit) {
          const batasWaktuJam = Math.floor(batasPulang15Menit / 60);
          const batasWaktuMenit = batasPulang15Menit % 60;
          const batasWaktuString = `${String(batasWaktuJam).padStart(2, '0')}:${String(batasWaktuMenit).padStart(2, '0')}`;
          
          showNotification(
            'error',
            'Absen Pulang Tidak Dapat Dibuka',
            `Absen pulang hanya dapat dibuka mulai 15 menit sebelum jam pulang (${batasWaktuString}). Jam pulang: ${activePengaturan.jamPulang}`
          );
          return;
        }
      }
    }

    try {
      const response = await apiService.updateSessionMetadata({
        tanggal: selectedDate,
        kelasId: user.kelasWali,
        sessionType: type,
        jamBuka: new Date().toLocaleTimeString('id-ID', { hour12: false }),
        status: 'dibuka',
        createdBy: user.id,
        tahunAjaranId: activeTahunAjaran?.id,
        semester: activeTahunAjaran?.semester,
      });
      
      if (response.success && response.session) {
        if (type === 'masuk') {
          setMasukSession(response.session);
        } else {
          setPulangSession(response.session);
        }
        sessionIdsRef.current[type] = response.session.id;
        setActiveSession(type);
      } else {
        throw new Error(response.message || 'Gagal membuka sesi');
      }
    } catch (error: any) {
      showNotification('error', 'Gagal Membuka Sesi', error.message || 'Terjadi kesalahan saat membuka sesi');
      return;
    }

    // Set auto-close timer untuk 5 menit
    // Store sessionId in ref for the timer
    const timerSessionId = sessionIdsRef.current[type];
    const autoCloseTimer = setTimeout(async () => {
      try {
        // Fetch latest session metadata
        const latestSession = await fetchSessionMetadata(type);
        
        if (latestSession && latestSession.status === 'dibuka') {
          // Close the session
          await apiService.updateSessionMetadata({
            tanggal: selectedDate,
            kelasId: user.kelasWali,
            sessionType: type,
            jamTutup: new Date().toLocaleTimeString('id-ID', { hour12: false }),
            status: 'ditutup',
            createdBy: user.id,
            tahunAjaranId: activeTahunAjaran?.id,
            semester: activeTahunAjaran?.semester,
          });
          
          // Refresh session state
          const updatedSession = await fetchSessionMetadata(type);
          if (type === 'masuk') {
            setMasukSession(updatedSession);
          } else {
            setPulangSession(updatedSession);
          }

          // Auto-mark absent students as 'alfa'
          // Refresh absensi first to get latest data
          await refreshAbsensi();
          
          // Note: absensi state will be updated by refreshAbsensi
          // We'll use the absensi from the hook which will be updated
          // For now, we'll query fresh data by calling the API again or use the updated state
          const newAbsensiRecords: Absensi[] = [];

          // Get fresh absensi data by calling API directly
          // This ensures we have the latest data in the timer callback
          const absensiResponse = await apiService.getAllAbsensi({
            kelasId: user.kelasWali,
            tanggal: selectedDate
          });
          
          const freshAbsensi = absensiResponse.success && absensiResponse.absensi ? absensiResponse.absensi : [];

          muridKelas.forEach(murid => {
            // Find today's absensi (one record per day in new structure)
            const existingAbsensi = freshAbsensi.find((a: Absensi) =>
              a.muridId === murid.id &&
              a.tanggal === selectedDate &&
              a.kelasId === user.kelasWali
            );

            // Check if already has attendance for this session type
            const hasSessionAttendance = type === 'masuk' 
              ? (existingAbsensi?.jamMasuk || existingAbsensi?.statusMasuk)
              : (existingAbsensi?.jamKeluar || existingAbsensi?.statusKeluar);

            // Backward compatibility: check old structure
            const oldAbsensi = freshAbsensi.find((a: Absensi) =>
              a.muridId === murid.id &&
              (a.tanggal === selectedDate || a.waktu?.startsWith(selectedDate)) &&
              a.kelasId === user.kelasWali &&
              a.tipeAbsen === type
            );

            // If no attendance record exists, create alfa record
            if (!hasSessionAttendance && !oldAbsensi) {
              // For pulang session, check if student has izin/sakit status from masuk session
              if (type === 'pulang') {
                const hasMasukIzinSakit = existingAbsensi?.statusMasuk === 'izin' || existingAbsensi?.statusMasuk === 'sakit';
                const oldMasuk = freshAbsensi.find((a: Absensi) =>
                  a.muridId === murid.id &&
                  (a.tanggal === selectedDate || a.waktu?.startsWith(selectedDate)) &&
                  a.kelasId === user.kelasWali &&
                  a.tipeAbsen === 'masuk'
                );
                const oldMasukIzinSakit = oldMasuk && (oldMasuk.status === 'izin' || oldMasuk.status === 'sakit');
                
                // If student marked izin/sakit at masuk, don't create alfa for pulang
                if (hasMasukIzinSakit || oldMasukIzinSakit) {
                  return;
                }
              }

              const now = getLocalTimeISOString();
              const absensiId = `${selectedDate}-${user.kelasWali}-${murid.id}`;

              if (existingAbsensi) {
                // Update existing record
                const updatedAbsensi = {
                  ...existingAbsensi,
                  [type === 'masuk' ? 'jamMasuk' : 'jamKeluar']: now,
                  [type === 'masuk' ? 'statusMasuk' : 'statusKeluar']: 'alfa' as const,
                  keterangan: `Otomatis alfa - tidak absen ${type}`,
                  // Legacy fields
                  tipeAbsen: type,
                  status: 'alfa',
                  waktu: now,
                };
                newAbsensiRecords.push(updatedAbsensi);
              } else {
                // Create new record
                const alfaAbsensi: Absensi = {
                  id: absensiId,
                  muridId: murid.id,
                  tanggal: selectedDate,
                  kelasId: user.kelasWali,
                  [type === 'masuk' ? 'jamMasuk' : 'jamKeluar']: now,
                  [type === 'masuk' ? 'statusMasuk' : 'statusKeluar']: 'alfa' as const,
                  method: 'manual',
                  keterangan: `Otomatis alfa - tidak absen ${type}`,
                  tahunAjaranId: activeTahunAjaran?.id || '',
                  semester: activeTahunAjaran?.semester || 1,
                  // Legacy fields for backward compatibility
                  tipeAbsen: type,
                  status: 'alfa',
                  waktu: now,
                };
                newAbsensiRecords.push(alfaAbsensi);
              }
            }
          });

          // Save new alfa records if any
          if (newAbsensiRecords.length > 0) {
            for (const newRecord of newAbsensiRecords) {
              const existing = freshAbsensi.find(a => a.id === newRecord.id);
              if (existing) {
                await updateAbsensi(newRecord.id, newRecord);
              } else {
                await createAbsensi(newRecord);
              }
            }
            await refreshAbsensi();
          }

          setActiveSession(null);
          setRefreshKey(prev => prev + 1);
          showNotification('info', 'Sesi Otomatis Ditutup', `Absen ${type} otomatis ditutup setelah 5 menit.`);
        }
      } catch (error: any) {
        console.error('Error in auto-close session:', error);
      }
    }, 5 * 60 * 1000); // 5 menit

    sessionTimersRef.current[type] = autoCloseTimer;
  };

  const closeSession = async (type: 'masuk' | 'pulang') => {
    // Clear auto-close timer jika ada
    if (sessionTimersRef.current[type]) {
      clearTimeout(sessionTimersRef.current[type]);
      sessionTimersRef.current[type] = undefined;
    }

    const session = type === 'masuk' ? selectedDateMasukSession : selectedDatePulangSession;
    if (session) {
      try {
        // Update session status to closed
        const response = await apiService.updateSessionMetadata({
          tanggal: selectedDate,
          kelasId: user.kelasWali,
          sessionType: type,
          jamTutup: new Date().toLocaleTimeString('id-ID', { hour12: false }),
          status: 'ditutup',
          createdBy: user.id,
          tahunAjaranId: activeTahunAjaran?.id,
          semester: activeTahunAjaran?.semester,
        });
        
        // Update session state
        if (response.success && response.session) {
          if (type === 'masuk') {
            setMasukSession(response.session);
          } else {
            setPulangSession(response.session);
          }
        }

        // Auto-mark absent students as 'alfa'
        const newAbsensiRecords: Absensi[] = [];

        muridKelas.forEach(murid => {
          // Find today's absensi (one record per day in new structure)
          const existingAbsensi = absensi.find((a: Absensi) =>
            a.muridId === murid.id &&
            a.tanggal === selectedDate &&
            a.kelasId === user.kelasWali
          );

          // Check if already has attendance for this session type
          const hasSessionAttendance = type === 'masuk' 
            ? (existingAbsensi?.jamMasuk || existingAbsensi?.statusMasuk)
            : (existingAbsensi?.jamKeluar || existingAbsensi?.statusKeluar);

          // Backward compatibility: check old structure
          const oldAbsensi = absensi.find((a: Absensi) =>
            a.muridId === murid.id &&
            (a.tanggal === selectedDate || a.waktu?.startsWith(selectedDate)) &&
            a.kelasId === user.kelasWali &&
            a.tipeAbsen === type
          );

          // If no attendance record exists, create alfa record
          if (!hasSessionAttendance && !oldAbsensi) {
            // For pulang session, check if student has izin/sakit status from masuk session
            if (type === 'pulang') {
              const hasMasukIzinSakit = existingAbsensi?.statusMasuk === 'izin' || existingAbsensi?.statusMasuk === 'sakit';
              const oldMasuk = absensi.find((a: Absensi) =>
                a.muridId === murid.id &&
                (a.tanggal === selectedDate || a.waktu?.startsWith(selectedDate)) &&
                a.kelasId === user.kelasWali &&
                a.tipeAbsen === 'masuk'
              );
              const oldMasukIzinSakit = oldMasuk && (oldMasuk.status === 'izin' || oldMasuk.status === 'sakit');
              
              // If student marked izin/sakit at masuk, don't create alfa for pulang
              if (hasMasukIzinSakit || oldMasukIzinSakit) {
                return;
              }
            }

            const now = new Date().toISOString();
            const absensiId = `${selectedDate}-${user.kelasWali}-${murid.id}`;

            if (existingAbsensi) {
              // Update existing record
              const updatedAbsensi = {
                ...existingAbsensi,
                [type === 'masuk' ? 'jamMasuk' : 'jamKeluar']: now,
                [type === 'masuk' ? 'statusMasuk' : 'statusKeluar']: 'alfa' as const,
                keterangan: `Otomatis alfa - tidak absen ${type}`,
                // Legacy fields
                tipeAbsen: type,
                status: 'alfa',
                waktu: now,
              };
              newAbsensiRecords.push(updatedAbsensi);
            } else {
              // Create new record
              const alfaAbsensi: Absensi = {
                id: absensiId,
                muridId: murid.id,
                tanggal: selectedDate,
                kelasId: user.kelasWali,
                [type === 'masuk' ? 'jamMasuk' : 'jamKeluar']: now,
                [type === 'masuk' ? 'statusMasuk' : 'statusKeluar']: 'alfa' as const,
                method: 'manual',
                keterangan: `Otomatis alfa - tidak absen ${type}`,
                tahunAjaranId: activeTahunAjaran?.id || '',
                semester: activeTahunAjaran?.semester || 1,
                // Legacy fields for backward compatibility
                tipeAbsen: type,
                status: 'alfa',
                waktu: now,
              };
              newAbsensiRecords.push(alfaAbsensi);
            }
          }
        });

        // Save new alfa records if any
        if (newAbsensiRecords.length > 0) {
          for (const newRecord of newAbsensiRecords) {
            const existing = absensi.find(a => a.id === newRecord.id);
            if (existing) {
              await updateAbsensi(newRecord.id, newRecord);
            } else {
              await createAbsensi(newRecord);
            }
          }
          await refreshAbsensi();
          showNotification('info', 'Sesi Ditutup', `${newAbsensiRecords.length} murid yang tidak absen otomatis ditandai alfa.`);
        } else {
          showNotification('info', 'Sesi Ditutup', 'Sesi absensi berhasil ditutup.');
        }
      } catch (error: any) {
        showNotification('error', 'Gagal Menutup Sesi', error.message || 'Terjadi kesalahan saat menutup sesi');
      }
    }
    setActiveSession(null);
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    sseAbsenService.connect();

    const handleSSEEvent = (event: any) => {
      if (event.type === 'absen-murid-update' || event.type === 'absen-auto-save') {
        refreshAbsensi();
        setRefreshKey(prev => prev + 1);
      }
    };

    const handleGlobalAutoAlfa = () => {
      refreshAbsensi();
      setRefreshKey(prev => prev + 1);
    };

    const unsubscribe = sseAbsenService.subscribe(handleSSEEvent);
    window.addEventListener('absensi-auto-alfa-processed', handleGlobalAutoAlfa);

    return () => {
      unsubscribe();
      sseAbsenService.disconnect();
      window.removeEventListener('absensi-auto-alfa-processed', handleGlobalAutoAlfa);
    };
  }, [refreshAbsensi]);

  useEffect(() => {
    return () => {
      if (sessionTimersRef.current.masuk) clearTimeout(sessionTimersRef.current.masuk);
      if (sessionTimersRef.current.pulang) clearTimeout(sessionTimersRef.current.pulang);
    };
  }, []);

  const handleQRScan = async (qrData: string) => {
    const currentTime = Date.now();
    
    if (lastProcessedScan && 
        lastProcessedScan.data === qrData && 
        (currentTime - lastProcessedScan.time) < SCAN_DEBOUNCE_TIME) {
      console.log('Duplicate QR scan detected, ignoring...');
      return;
    }
    
    setLastProcessedScan({ data: qrData, time: currentTime });
    
    const parsed = parseQRCodeData(qrData);
    const currentTime24 = new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    if (!parsed.isValid || !activeSession) {
      const result: ScanResult = {
        statusMessage: 'QR Code tidak valid atau sesi tidak aktif!',
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showNotification('error', 'QR Code Tidak Valid', 'QR Code tidak valid atau sesi tidak aktif!');
      return;
    }

    const murid = muridKelas.find(m => m.id === parsed.muridId) ||
      muridKelas.find(m => parsed.nisn && m.nisn === parsed.nisn);

    if (!murid) {
      const result: ScanResult = {
        statusMessage: 'Murid tidak ditemukan dalam sistem!',
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showNotification('error', 'Murid Tidak Ditemukan', 'Murid tidak ditemukan dalam sistem!');
      return;
    }

    const muridKelasId = murid.kelasId || parsed.kelasId;

    if (muridKelasId !== user.kelasWali) {
      const result: ScanResult = {
        user: murid,
        role: 'murid',
        timestamp: currentTime24,
        statusMessage: 'Murid bukan dari kelas ini!',
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showNotification('error', 'Kelas Tidak Sesuai', 'Murid bukan dari kelas ini!');
      return;
    }

    // Check if already marked attendance (non-session based)
    const existingAbsensi = absensi.find((a: Absensi) => 
      a.muridId === murid.id &&
      a.tanggal === selectedDate &&
      a.kelasId === user.kelasWali &&
      ((activeSession === 'masuk' && (a.jamMasuk || a.statusMasuk)) ||
       (activeSession === 'pulang' && (a.jamKeluar || a.statusKeluar)))
    );

    if (existingAbsensi) {
      const result: ScanResult = {
        user: murid,
        role: 'murid',
        tipeAbsen: 'Sudah Terpenuhi',
        timestamp: currentTime24,
        statusMessage: `${murid.name} sudah melakukan absen ${activeSession}!`,
        isError: false,
        status: 'sudah_terpenuhi'
      };
      setScanResult(result);
      setShowResultModal(true);
      showNotification('warning', 'Sudah Absen', `${murid.name} sudah melakukan absen ${activeSession}!`);
      return;
    }

    // Check if selected date is a school day for murid
    if (!isAttendanceDayAllowed(selectedDate, 'murid', pengaturanAbsen)) {
      const dayName = getDayNameInIndonesian(selectedDate);
      const result: ScanResult = {
        user: murid,
        role: 'murid',
        timestamp: currentTime24,
        statusMessage: `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`,
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showNotification(
        'error',
        'Absensi Tidak Diizinkan',
        `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`
      );
      return;
    }

    // Check if in edit mode (session is closed or not today)
    const session = activeSession === 'masuk' ? selectedDateMasukSession : selectedDatePulangSession;
    const isEditMode = session?.status === 'ditutup' || !isToday;

    // Check if trying to absen masuk but current time has passed jam pulang
    // Skip this validation in edit mode
    if (activeSession === 'masuk' && !isEditMode) {
      const activePengaturan = pengaturanAbsen.find(p => p.isActive) || pengaturanAbsen[0];
      if (activePengaturan) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [jamPulangHour, jamPulangMinute] = activePengaturan.jamPulang.split(':').map(Number);
        
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
        
        if (currentTimeMinutes > jamPulangMinutes) {
          const result: ScanResult = {
            user: murid,
            role: 'murid',
            timestamp: currentTime24,
            statusMessage: `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). ${murid.name} tidak dapat melakukan absen masuk.`,
            isError: true,
            errorType: 'not_registered'
          };
          setScanResult(result);
          setShowResultModal(true);
          showNotification(
            'error',
            'Tidak Dapat Absen Masuk', 
            `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). ${murid.name} tidak dapat melakukan absen masuk.`
          );
          return;
        }
      }
    }

    try {
      const now = new Date();
      const nowISO = getLocalTimeISOString();
      const currentTime24 = now.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const absensiId = `${selectedDate}-${user.kelasWali}-${murid.id}`;
      
      // Map status to statusMasuk/statusKeluar
      const mapStatusToNewStructure = (status: string): 'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa' | 'hadir' => {
        if (status === 'izin') return 'izin';
        if (status === 'sakit') return 'sakit';
        if (status === 'alfa') return 'alfa';
        if (status === 'hadir') return 'tepat_waktu';
        return 'tepat_waktu';
      };

      const existing = absensi.find(a => a.id === absensiId);
      
      if (existing) {
        // Update existing record
        const updateData: Partial<Absensi> = {
          keterangan: `Absen ${activeSession} via QR Code`,
          // Legacy fields
          tipeAbsen: activeSession,
          status: 'hadir',
          waktu: nowISO,
        };
        
        if (activeSession === 'masuk') {
          updateData.jamMasuk = nowISO;
          updateData.statusMasuk = mapStatusToNewStructure('hadir');
        } else {
          updateData.jamKeluar = nowISO;
          updateData.statusKeluar = mapStatusToNewStructure('hadir');
        }
        
        await updateAbsensi(existing.id, updateData);
        
        // Create ScanResult for success case
        const result: ScanResult = {
          user: murid,
          role: 'murid',
          tipeAbsen: activeSession === 'masuk' ? 'Masuk' : 'Pulang',
          status: 'tepat_waktu',
          timestamp: currentTime24,
          statusMessage: `Absen ${activeSession} berhasil. Status: Tepat Waktu`,
          isError: false
        };
        setScanResult(result);
        setShowResultModal(true);
      } else {
        // Create new record
        const newAbsensi: Absensi = {
          id: absensiId,
          muridId: murid.id,
          tanggal: selectedDate,
          kelasId: user.kelasWali,
          method: 'qr',
          keterangan: `Absen ${activeSession} via QR Code`,
          tahunAjaranId: activeTahunAjaran?.id || '',
          semester: activeTahunAjaran?.semester || 1,
          // Legacy fields
          tipeAbsen: activeSession,
          status: 'hadir',
          waktu: nowISO,
        };
        
        if (activeSession === 'masuk') {
          newAbsensi.jamMasuk = nowISO;
          newAbsensi.statusMasuk = mapStatusToNewStructure('hadir');
        } else {
          newAbsensi.jamKeluar = nowISO;
          newAbsensi.statusKeluar = mapStatusToNewStructure('hadir');
        }
        
        await createAbsensi(newAbsensi);
        
        // Create ScanResult for success case
        const result: ScanResult = {
          user: murid,
          role: 'murid',
          tipeAbsen: activeSession === 'masuk' ? 'Masuk' : 'Pulang',
          status: 'tepat_waktu',
          timestamp: currentTime24,
          statusMessage: `Absen ${activeSession} berhasil. Status: Tepat Waktu`,
          isError: false
        };
        setScanResult(result);
        setShowResultModal(true);
      }
      
      // Clear cache dan refresh data absensi
      clearAbsensiCache();
      await refreshAbsensi();
      showNotification('success', `Absen ${activeSession.charAt(0).toUpperCase() + activeSession.slice(1)} Berhasil!`, `${murid.name} - ${murid.nisn}`);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      const result: ScanResult = {
        user: murid,
        role: 'murid',
        tipeAbsen: activeSession === 'masuk' ? 'Masuk' : 'Pulang',
        timestamp: currentTime24,
        statusMessage: error.message || 'Terjadi kesalahan saat menyimpan absensi',
        isError: true,
        errorType: 'absen_failed'
      };
      setScanResult(result);
      setShowResultModal(true);
      showNotification('error', 'Gagal Menyimpan Absensi', error.message || 'Terjadi kesalahan saat menyimpan absensi');
    }
  };

  const markAttendance = async (muridId: string, status: 'hadir' | 'izin' | 'sakit' | 'alfa', keteranganAbsen?: string, currentScrollPosition?: number) => {
    if (!activeSession) return;

    // Check if in edit mode (session is closed or not today)
    const session = activeSession === 'masuk' ? selectedDateMasukSession : selectedDatePulangSession;
    const isEditMode = session?.status === 'ditutup' || !isToday;

    // Check if trying to absen masuk but current time has passed jam pulang
    // Skip this validation in edit mode
    if (activeSession === 'masuk' && !isEditMode) {
      const activePengaturan = pengaturanAbsen.find(p => p.isActive) || pengaturanAbsen[0];
      if (activePengaturan) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [jamPulangHour, jamPulangMinute] = activePengaturan.jamPulang.split(':').map(Number);
        
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
        
        if (currentTimeMinutes > jamPulangMinutes) {
          const murid = muridKelas.find(m => m.id === muridId);
          showNotification(
            'error',
            'Tidak Dapat Absen Masuk', 
            `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). ${murid?.name || 'Murid'} tidak dapat melakukan absen masuk.`
          );
          return;
        }
      }
    }

    if (currentScrollPosition !== undefined) {
      scrollPositionRef.current = currentScrollPosition;
    }

    try {
      // Find today's absensi (one record per day in new structure)
      const existingAbsensi = absensi.find((a: Absensi) =>
        a.muridId === muridId &&
        a.tanggal === selectedDate &&
        a.kelasId === user.kelasWali
      );

      const currentTimeISO = getLocalTimeISOString();
      const absensiId = `${selectedDate}-${user.kelasWali}-${muridId}`;

      // Map status to statusMasuk/statusKeluar
      const mapStatusToNewStructure = (status: string): 'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa' | 'hadir' => {
        if (status === 'izin') return 'izin';
        if (status === 'sakit') return 'sakit';
        if (status === 'alfa') return 'alfa';
        if (status === 'hadir') return 'tepat_waktu';
        return 'tepat_waktu';
      };

      if (existingAbsensi) {
        // Update existing absensi (one record per day)
        const updateData: Partial<Absensi> = {
          keterangan: keteranganAbsen,
          // Legacy fields for backward compatibility
          tipeAbsen: activeSession,
          status: status,
          waktu: currentTimeISO,
        };

        if (activeSession === 'masuk') {
          updateData.jamMasuk = currentTimeISO;
          updateData.statusMasuk = mapStatusToNewStructure(status);
        } else {
          updateData.jamKeluar = currentTimeISO;
          updateData.statusKeluar = mapStatusToNewStructure(status);
        }

        // Auto-replicate to pulang session if masuk session has izin/sakit/alfa status
        if (activeSession === 'masuk' && ['izin', 'sakit', 'alfa'].includes(status)) {
          updateData.jamKeluar = currentTimeISO;
          updateData.statusKeluar = mapStatusToNewStructure(status);
        }

        await updateAbsensi(existingAbsensi.id, updateData);
      } else {
        // Create new absensi (one document per day)
        const newAbsensi: Absensi = {
          id: absensiId,
          muridId,
          tanggal: selectedDate,
          kelasId: user.kelasWali,
          method: 'manual',
          keterangan: keteranganAbsen,
          tahunAjaranId: activeTahunAjaran?.id || '',
          semester: activeTahunAjaran?.semester || 1,
          // Legacy fields for backward compatibility
          tipeAbsen: activeSession,
          status: status,
          waktu: currentTimeISO,
        };

        if (activeSession === 'masuk') {
          newAbsensi.jamMasuk = currentTimeISO;
          newAbsensi.statusMasuk = mapStatusToNewStructure(status);
          // Auto-replicate to pulang if izin/sakit/alfa
          if (['izin', 'sakit', 'alfa'].includes(status)) {
            newAbsensi.jamKeluar = currentTimeISO;
            newAbsensi.statusKeluar = mapStatusToNewStructure(status);
          }
        } else {
          newAbsensi.jamKeluar = currentTimeISO;
          newAbsensi.statusKeluar = mapStatusToNewStructure(status);
        }

        await createAbsensi(newAbsensi);
      }

      await refreshAbsensi();
      setSelectedMurid(null);
      setKeterangan('');
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showNotification('error', 'Gagal Menyimpan Absensi', error.message || 'Terjadi kesalahan saat menyimpan absensi');
    }
  };

  const markAttendanceBatch = async (muridIds: string[], status: 'hadir' | 'izin' | 'sakit' | 'alfa', keteranganAbsen?: string) => {
    if (!activeSession) return;

    // Check if in edit mode (session is closed or not today)
    const session = activeSession === 'masuk' ? selectedDateMasukSession : selectedDatePulangSession;
    const isEditMode = session?.status === 'ditutup' || !isToday;

    // Check if trying to absen masuk but current time has passed jam pulang
    // Skip this validation in edit mode
    if (activeSession === 'masuk' && !isEditMode) {
      const activePengaturan = pengaturanAbsen.find(p => p.isActive) || pengaturanAbsen[0];
      if (activePengaturan) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [jamPulangHour, jamPulangMinute] = activePengaturan.jamPulang.split(':').map(Number);
        
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
        
        if (currentTimeMinutes > jamPulangMinutes) {
          showNotification(
            'error',
            'Tidak Dapat Absen Masuk', 
            `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). Tidak dapat melakukan absen masuk batch.`
          );
          return;
        }
      }
    }

    try {
      const currentTimeISO = getLocalTimeISOString();

      // Map status to statusMasuk/statusKeluar
      const mapStatusToNewStructure = (status: string): 'tepat_waktu' | 'terlambat' | 'tidak_masuk' | 'izin' | 'sakit' | 'alfa' | 'hadir' => {
        if (status === 'izin') return 'izin';
        if (status === 'sakit') return 'sakit';
        if (status === 'alfa') return 'alfa';
        if (status === 'hadir') return 'tepat_waktu';
        return 'tepat_waktu';
      };

      const promises = muridIds.map(async (muridId) => {
        const absensiId = `${selectedDate}-${user.kelasWali}-${muridId}`;
        const existingAbsensi = absensi.find((a: Absensi) =>
          a.muridId === muridId &&
          a.tanggal === selectedDate &&
          a.kelasId === user.kelasWali
        );

        if (existingAbsensi) {
          // Update existing record (one record per day)
          const updateData: Partial<Absensi> = {
            keterangan: keteranganAbsen,
            // Legacy fields
            tipeAbsen: activeSession,
            status: status,
            waktu: currentTimeISO,
          };

          if (activeSession === 'masuk') {
            updateData.jamMasuk = currentTimeISO;
            updateData.statusMasuk = mapStatusToNewStructure(status);
          } else {
            updateData.jamKeluar = currentTimeISO;
            updateData.statusKeluar = mapStatusToNewStructure(status);
          }

          // Auto-replicate to pulang session if masuk session has izin/sakit/alfa status
          if (activeSession === 'masuk' && ['izin', 'sakit', 'alfa'].includes(status)) {
            updateData.jamKeluar = currentTimeISO;
            updateData.statusKeluar = mapStatusToNewStructure(status);
          }

          await updateAbsensi(existingAbsensi.id, updateData);
        } else {
          // Create new record (one document per day)
          const newAbsensi: Absensi = {
            id: absensiId,
            muridId,
            tanggal: selectedDate,
            kelasId: user.kelasWali,
            method: 'manual',
            keterangan: keteranganAbsen,
            tahunAjaranId: activeTahunAjaran?.id || '',
            semester: activeTahunAjaran?.semester || 1,
            // Legacy fields
            tipeAbsen: activeSession,
            status: status,
            waktu: currentTimeISO,
          };

          if (activeSession === 'masuk') {
            newAbsensi.jamMasuk = currentTimeISO;
            newAbsensi.statusMasuk = mapStatusToNewStructure(status);
            // Auto-replicate to pulang if izin/sakit/alfa
            if (['izin', 'sakit', 'alfa'].includes(status)) {
              newAbsensi.jamKeluar = currentTimeISO;
              newAbsensi.statusKeluar = mapStatusToNewStructure(status);
            }
          } else {
            newAbsensi.jamKeluar = currentTimeISO;
            newAbsensi.statusKeluar = mapStatusToNewStructure(status);
          }

          await createAbsensi(newAbsensi);
        }
      });

      await Promise.all(promises);
      // Invalidate cache and refresh
      await refreshAbsensi();
      scrollPositionRef.current = 0;
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      showNotification('error', 'Gagal Menyimpan Absensi', error.message || 'Terjadi kesalahan saat menyimpan absensi');
    }
  };

  const getAttendanceStatus = (muridId: string, sessionType: 'masuk' | 'pulang') => {
    // Find today's absensi (one record per day in new structure)
    const todayAbsensi = absensi.find((a: Absensi) =>
      a.muridId === muridId &&
      a.tanggal === selectedDate &&
      a.kelasId === user.kelasWali
    );

    if (todayAbsensi) {
      // New structure: create virtual object for compatibility
      if (sessionType === 'masuk' && (todayAbsensi.jamMasuk || todayAbsensi.statusMasuk)) {
        return {
          ...todayAbsensi,
          tipeAbsen: 'masuk',
          waktu: todayAbsensi.jamMasuk || todayAbsensi.waktu || '',
          status: todayAbsensi.statusMasuk === 'izin' ? 'izin' :
                  todayAbsensi.statusMasuk === 'sakit' ? 'sakit' :
                  todayAbsensi.statusMasuk === 'alfa' ? 'alfa' :
                  todayAbsensi.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
        };
      } else if (sessionType === 'pulang' && (todayAbsensi.jamKeluar || todayAbsensi.statusKeluar)) {
        return {
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
    return absensi.find((a: Absensi) =>
      a.muridId === muridId &&
      (a.tanggal === selectedDate || a.waktu?.startsWith(selectedDate)) &&
      a.kelasId === user.kelasWali &&
      a.tipeAbsen === sessionType
    ) || null;
  };

  const openKeteranganModal = (murid: User, status: 'hadir' | 'izin' | 'sakit' | 'alfa') => {
    setSelectedMurid(murid);
    setKeterangan('');
    
    if (status === 'izin') {
      setKeterangan('Izin dengan keterangan wali kelas');
    } else if (status === 'sakit') {
      setKeterangan('Sakit dengan keterangan wali kelas');
    }
  };

  const confirmMarkAttendance = (status: 'hadir' | 'izin' | 'sakit' | 'alfa') => {
    if (!selectedMurid) return;
    markAttendance(selectedMurid.id, status, keterangan);
  };

  const handleScanQR = (sessionType: 'masuk' | 'pulang') => {
    setActiveSession(sessionType);
    setIsQRScannerOpen(true);
  };

  const handleManualAbsen = (sessionType: 'masuk' | 'pulang') => {
    setActiveSession(sessionType);
    setIsManualModalOpen(true);
  };

  const handleEditAbsen = async (sessionType: 'masuk' | 'pulang') => {
    const session = sessionType === 'masuk' ? selectedDateMasukSession : selectedDatePulangSession;

    // Jika session belum ada, buat session otomatis (ditutup)
    if (!session) {
      try {
        const response = await apiService.updateSessionMetadata({
          tanggal: selectedDate,
          kelasId: user.kelasWali,
          sessionType,
          jamBuka: new Date().toLocaleTimeString('id-ID', { hour12: false }),
          jamTutup: new Date().toLocaleTimeString('id-ID', { hour12: false }),
          status: 'ditutup',
          createdBy: user.id,
          tahunAjaranId: activeTahunAjaran?.id,
          semester: activeTahunAjaran?.semester,
        });
        
        if (response.success && response.session) {
          if (sessionType === 'masuk') {
            setMasukSession(response.session);
          } else {
            setPulangSession(response.session);
          }
        }
      } catch (error: any) {
        showNotification('error', 'Gagal Membuat Sesi', error.message || 'Terjadi kesalahan saat membuat sesi');
        return;
      }
    }

    setActiveSession(sessionType);
    setIsManualModalOpen(true);
  };

  const sendWhatsAppNotification = (murid: User, status: string, sessionType: string) => {
    sendWhatsApp(murid, status, sessionType, myKelas, selectedDate);
  };

  // Fungsi untuk mengecek apakah absen pulang bisa dibuka
  const canOpenPulangSession = () => {
    if (!isToday) return false;

    // Jika absen masuk sudah ditutup, pulang bisa dibuka
    if (selectedDateMasukSession && selectedDateMasukSession.status === 'ditutup') {
      // Check enableEarlyDeparture restriction
      if (!enableEarlyDeparture) {
        const activePengaturanAbsen = pengaturanAbsen.find(p => p.isActive);
        if (activePengaturanAbsen) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const [jamPulangHour, jamPulangMinute] = activePengaturanAbsen.jamPulang.split(':').map(Number);
          
          const currentTimeMinutes = currentHour * 60 + currentMinute;
          const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
          const batasPulang15Menit = jamPulangMinutes - 15;

          // Can only open if current time is at least 15 minutes before jam pulang
          return currentTimeMinutes >= batasPulang15Menit;
        }
      }
      return true;
    }

    const activePengaturanAbsen = pengaturanAbsen.find(p => p.isActive);

    if (activePengaturanAbsen) {
      const [jamMasuk, menitMasuk] = activePengaturanAbsen.jamMasuk.split(':').map(Number);
      const waktuMasuk = new Date();
      waktuMasuk.setHours(jamMasuk, menitMasuk + 15, 0);

      const now = new Date();
      const canOpenByTime = now.getTime() >= waktuMasuk.getTime();
      
      // Check enableEarlyDeparture restriction
      if (!enableEarlyDeparture && canOpenByTime) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const [jamPulangHour, jamPulangMinute] = activePengaturanAbsen.jamPulang.split(':').map(Number);
        
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
        const batasPulang15Menit = jamPulangMinutes - 15;

        // Can only open if current time is at least 15 minutes before jam pulang
        return currentTimeMinutes >= batasPulang15Menit;
      }
      
      return canOpenByTime;
    }

    return false;
  };

  return (
    <div className="space-y-6">
      <AbsenKelasHeader
        myKelas={myKelas}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isToday={isToday}
        today={today}
      />

      <AbsenKelasWarning
        isToday={isToday}
        selectedDate={selectedDate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AbsenKelasSessionCard
          sessionType="masuk"
          session={selectedDateMasukSession}
          kelasId={user.kelasWali || ''}
          selectedDate={selectedDate}
          isToday={isToday}
          onOpenSession={openSession}
          onCloseSession={closeSession}
          onScanQR={handleScanQR}
          onManualAbsen={handleManualAbsen}
          onEditAbsen={handleEditAbsen}
          canOpenPulang={undefined}
        />

        <AbsenKelasSessionCard
          sessionType="pulang"
          session={selectedDatePulangSession}
          kelasId={user.kelasWali || ''}
          selectedDate={selectedDate}
          isToday={isToday}
          onOpenSession={openSession}
          onCloseSession={closeSession}
          onScanQR={handleScanQR}
          onManualAbsen={handleManualAbsen}
          onEditAbsen={handleEditAbsen}
          canOpenPulang={canOpenPulangSession()}
        />
      </div>

      <AbsenKelasTable
        muridKelas={muridKelas}
        selectedDate={selectedDate}
        refreshKey={refreshKey}
        getAttendanceStatus={getAttendanceStatus}
        sendWhatsAppNotification={sendWhatsAppNotification}
      />

      <AbsenKelasManualModal
        isOpen={isManualModalOpen}
        onClose={async () => {
          setIsManualModalOpen(false);
          setActiveSession(null);
          
          // Clear cache globally first to ensure all instances get fresh data
          clearAbsensiCache();
          
          // Wait a bit to ensure cache is cleared
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Refresh absensi - this will fetch fresh data from server
          await refreshAbsensi();
          
          // Also refresh session metadata to ensure latest data
          if (user?.kelasWali && activeTahunAjaran) {
            const [masuk, pulang] = await Promise.all([
              fetchSessionMetadata('masuk'),
              fetchSessionMetadata('pulang'),
            ]);
            setMasukSession(masuk);
            setPulangSession(pulang);
          }
          
          // Force re-render to update all components including AbsenKelasSessionCard
          setRefreshKey(prev => prev + 1);
          
          // Additional refresh after a short delay to ensure all components are updated
          setTimeout(async () => {
            clearAbsensiCache();
            await refreshAbsensi();
            setRefreshKey(prev => prev + 1);
          }, 200);
        }}
        activeSession={activeSession}
        session={activeSession === 'masuk' ? selectedDateMasukSession : selectedDatePulangSession}
        myKelas={myKelas}
        selectedDate={selectedDate}
        isToday={isToday}
        muridKelas={muridKelas}
        refreshKey={refreshKey}
        scrollPositionRef={scrollPositionRef}
        getAttendanceStatus={getAttendanceStatus}
        openKeteranganModal={openKeteranganModal}
        markAttendance={markAttendance}
        markAttendanceBatch={markAttendanceBatch}
        sendWhatsAppNotification={sendWhatsAppNotification}
      />

      <AbsenKelasKeteranganModal
        isOpen={!!selectedMurid}
        onClose={() => {
          setSelectedMurid(null);
          setKeterangan('');
        }}
        selectedMurid={selectedMurid}
        activeSession={activeSession}
        keterangan={keterangan}
        setKeterangan={setKeterangan}
        isToday={isToday}
        confirmMarkAttendance={confirmMarkAttendance}
      />

      <QRScanner
        isOpen={isQRScannerOpen}
        onScan={handleQRScan}
        onClose={() => {
          setIsQRScannerOpen(false);
          setActiveSession(null);
          setScanResult(null);
          setShowResultModal(false);
        }}
        scanResult={scanResult}
        showResultModal={showResultModal}
        onCloseResult={() => {
          setShowResultModal(false);
          setScanResult(null);
        }}
      />
    </div>
  );
};

export default AbsenKelas;