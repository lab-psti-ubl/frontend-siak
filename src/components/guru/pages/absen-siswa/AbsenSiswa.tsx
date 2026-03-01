import React, { useState, useMemo } from 'react';
import { QrCode } from 'lucide-react';
import Badge from '../../../ui/Badge';
import QRScanner, { ScanResult } from '../../../ui/QRScanner';
import { useAuth } from '../../../../context/AuthContext';
import { useMurid } from '../../../../hooks/useMurid';
import { useSantri } from '../../../../hooks/useSantri';
import { useKelas } from '../../../../hooks/useKelas';
import { usePengaturanAbsen } from '../../../../hooks/usePengaturanAbsen';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { clearAbsensiCache } from '../../../../hooks/useAbsensi';
import { parseQRCodeData } from '../../../../utils/qrCodeGenerator';
import { apiService } from '../../../../services/apiService';
import { isAttendanceDayAllowed, getDayNameInIndonesian } from '../../../../utils/attendanceDayValidation';
import { getLocalTimeISOString, getTodayIndonesia, getCurrentTimeIndonesia } from '../../../../utils/absensiUtils';
import { showSuccessNotification, showErrorNotification, showWarningNotification } from '../../../../utils/notificationUtils';
import { useLanguage } from '../../../../context/LanguageContext';
import { Absensi, User } from '../../../../types';

const AbsenSiswa: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // State untuk mencegah double scan
  const [lastProcessedScan, setLastProcessedScan] = useState<{data: string, time: number} | null>(null);
  const SCAN_DEBOUNCE_TIME = 2000;

  const { murid } = useMurid();
  const { santri } = useSantri();
  const { kelas } = useKelas();
  const { pengaturanAbsen } = usePengaturanAbsen();
  const { tahunAjaran } = useTahunAjaran();

  // Combine murid and santri into allStudents array
  // Remove duplicates based on id (santri yang sudah ada di murid tidak perlu ditambahkan lagi)
  const allStudents = useMemo(() => {
    const allUsers = [...murid, ...santri];
    // Remove duplicates based on id
    const uniqueUsers = Array.from(
      new Map(allUsers.map(user => [user.id, user])).values()
    );
    return uniqueUsers;
  }, [murid, santri]);

  const activePengaturanAbsen = pengaturanAbsen.find(p => p.isActive) || pengaturanAbsen[0];
  const today = getTodayIndonesia();

  const handleQRScan = async (qrData: string) => {
    const currentTime = Date.now();
    const currentTime24 = getCurrentTimeIndonesia();

    // Check for duplicate scan
    if (lastProcessedScan && 
        lastProcessedScan.data === qrData && 
        (currentTime - lastProcessedScan.time) < SCAN_DEBOUNCE_TIME) {
      console.log('Duplicate QR scan detected, ignoring...');
      return;
    }

    setLastProcessedScan({ data: qrData, time: currentTime });

    // Parse QR code data (student QR codes contain NISN)
    const parsed = parseQRCodeData(qrData);

    if (!parsed.isValid) {
      const result: ScanResult = {
        statusMessage: t('absenSiswaGuru.qrInvalidMessage'),
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification(t('absenSiswaGuru.qrInvalidTitle'), t('absenSiswaGuru.qrInvalidMessage'));
      return;
    }

    // Find student by ID or NISN from allStudents (murid + santri)
    const student = allStudents.find(m => m.id === parsed.muridId) ||
      allStudents.find(m => parsed.nisn && m.nisn === parsed.nisn);

    if (!student) {
      const result: ScanResult = {
        statusMessage: t('absenSiswaGuru.studentNotFoundMessage'),
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification(t('absenSiswaGuru.studentNotFoundTitle'), t('absenSiswaGuru.studentNotFoundMessage'));
      return;
    }

    // Check if student is active
    if (student.isActive === false) {
      const result: ScanResult = {
        user: student,
        role: 'murid',
        timestamp: currentTime24,
        statusMessage: t('absenSiswaGuru.studentInactiveMessage'),
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification(t('absenSiswaGuru.studentInactiveTitle'), t('absenSiswaGuru.studentInactiveMessage'));
      return;
    }

    // Check if today is a school day for students
    if (!isAttendanceDayAllowed(today, 'murid', pengaturanAbsen)) {
      const dayName = getDayNameInIndonesian(today);
      const result: ScanResult = {
        user: student,
        role: 'murid',
        timestamp: currentTime24,
        statusMessage: t('absenSiswaGuru.notAllowedTodayMessage', { dayName }),
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification(
        t('absenSiswaGuru.notAllowedTodayTitle'),
        t('absenSiswaGuru.notAllowedTodayMessage', { dayName })
      );
      return;
    }

    // Get active tahun ajaran
    const activeTA = tahunAjaran.find(ta => ta.isActive);
    if (!activeTA) {
      const result: ScanResult = {
        user: student,
        role: 'murid',
        timestamp: currentTime24,
        statusMessage: t('absenSiswaGuru.noActiveYearMessage'),
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification(t('absenSiswaGuru.noActiveYearTitle'), t('absenSiswaGuru.noActiveYearMessage'));
      return;
    }

    // Handle santri yang tidak memiliki kelasId (isFromMurid: false)
    const isSantriWithoutKelas = (student as any).isFromMurid === false && !student.kelasId;
    const kelasId = student.kelasId || 'santri'; // Use 'santri' as default for santri without kelasId
    
    // Get student's class (skip for santri without kelasId)
    const studentKelas = student.kelasId ? kelas.find(k => k.id === student.kelasId) : null;
    if (!studentKelas && !isSantriWithoutKelas) {
      const result: ScanResult = {
        user: student,
        role: 'murid',
        timestamp: currentTime24,
        statusMessage: t('absenSiswaGuru.classNotFoundMessage'),
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification(t('absenSiswaGuru.classNotFoundTitle'), t('absenSiswaGuru.classNotFoundMessage'));
      return;
    }

    // Get today's attendance for the student
    let todayAbsensiData: Absensi[] = [];
    try {
      const response = await apiService.getAbsensiByMuridIdAndTanggal(student.id, today);
      if (response.success && response.absensi) {
        todayAbsensiData = response.absensi;
      }
    } catch (error) {
      console.error('Error fetching today absensi:', error);
    }

    // Find today's absensi (one record per day in new structure)
    // For santri without kelasId, search without kelasId filter
    const todayAbsensi = isSantriWithoutKelas
      ? todayAbsensiData.find((a: Absensi) => 
          a.muridId === student.id && 
          a.tanggal === today &&
          (!a.kelasId || a.kelasId === 'santri')
        )
      : todayAbsensiData.find((a: Absensi) =>
          a.muridId === student.id && 
          a.tanggal === today && 
          a.kelasId === student.kelasId
        );

    // Check if already checked in/out using new structure
    const alreadyCheckedIn = todayAbsensi?.jamMasuk || todayAbsensi?.statusMasuk;
    const alreadyCheckedOut = todayAbsensi?.jamKeluar || todayAbsensi?.statusKeluar;

    // Backward compatibility: check old structure
    const oldMasuk = isSantriWithoutKelas
      ? todayAbsensiData.find((a: Absensi) => 
          a.muridId === student.id && 
          a.tanggal === today && 
          (!a.kelasId || a.kelasId === 'santri') &&
          a.tipeAbsen === 'masuk'
        )
      : todayAbsensiData.find((a: Absensi) =>
          a.muridId === student.id && 
          a.tanggal === today && 
          a.kelasId === student.kelasId &&
          a.tipeAbsen === 'masuk'
        );
    const oldPulang = isSantriWithoutKelas
      ? todayAbsensiData.find((a: Absensi) => 
          a.muridId === student.id && 
          a.tanggal === today && 
          (!a.kelasId || a.kelasId === 'santri') &&
          a.tipeAbsen === 'pulang'
        )
      : todayAbsensiData.find((a: Absensi) =>
          a.muridId === student.id && 
          a.tanggal === today && 
          a.kelasId === student.kelasId &&
          a.tipeAbsen === 'pulang'
        );

    const hasMasuk = alreadyCheckedIn || !!oldMasuk;
    const hasPulang = alreadyCheckedOut || !!oldPulang;

    // Determine attendance type
    let tipeAbsen: 'masuk' | 'pulang' = 'masuk';

    if (hasMasuk && !hasPulang) {
      tipeAbsen = 'pulang';
    } else if (hasMasuk && hasPulang) {
      const result: ScanResult = {
        user: student,
        role: 'murid',
        tipeAbsen: 'Sudah Terpenuhi',
        timestamp: currentTime24,
        statusMessage: t('absenSiswaGuru.alreadyCompletedMessage', { name: student.name }),
        isError: false,
        status: 'sudah_terpenuhi'
      };
      setScanResult(result);
      setShowResultModal(true);
      showWarningNotification(t('absenSiswaGuru.alreadyCompletedTitle'), t('absenSiswaGuru.alreadyCompletedMessage', { name: student.name }));
      return;
    }

    // Check if trying to absen masuk but current time has passed jam pulang
    if (tipeAbsen === 'masuk' && activePengaturanAbsen) {
      const [currentHour, currentMinute] = getCurrentTimeIndonesia().split(':').map(Number);
      const [jamPulangHour, jamPulangMinute] = activePengaturanAbsen.jamPulang.split(':').map(Number);
      
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
      
      if (currentTimeMinutes > jamPulangMinutes) {
        const result: ScanResult = {
          user: student,
          role: 'murid',
          timestamp: currentTime24,
          statusMessage: t('absenSiswaGuru.cannotCheckInAfterOutMessage', { jamPulang: activePengaturanAbsen.jamPulang }),
          isError: true,
          errorType: 'not_registered'
        };
        setScanResult(result);
        setShowResultModal(true);
        showErrorNotification(
          t('absenSiswaGuru.cannotCheckInAfterOutTitle'), 
          t('absenSiswaGuru.cannotCheckInAfterOutMessage', { jamPulang: activePengaturanAbsen.jamPulang })
        );
        return;
      }
    }

    // Prepare attendance data
    const nowISO = getLocalTimeISOString();
    const newAbsensi: Partial<Absensi> = {
      id: `${today}-${kelasId}-${student.id}`,
      muridId: student.id,
      tanggal: today,
      kelasId: kelasId, // Use kelasId (could be 'santri' for santri without kelasId)
      method: 'guru-qr',
      tahunAjaranId: activeTA.id,
      semester: activeTA.semester,
      statusAbsen: 'tepat_waktu',
    };

    if (tipeAbsen === 'masuk') {
      newAbsensi.jamMasuk = nowISO;
      newAbsensi.statusMasuk = 'tepat_waktu';
      // Legacy fields for backward compatibility
      newAbsensi.tipeAbsen = 'masuk';
      newAbsensi.status = 'hadir';
      newAbsensi.waktu = nowISO;
    } else {
      newAbsensi.jamKeluar = nowISO;
      newAbsensi.statusKeluar = 'tepat_waktu';
      // Legacy fields for backward compatibility
      newAbsensi.tipeAbsen = 'pulang';
      newAbsensi.status = 'hadir';
      newAbsensi.waktu = nowISO;
    }

    // Create or update attendance via worker (with fallback to server)
    try {
      const response = await apiService.submitAbsensiMuridWithFallback(newAbsensi);
      
      if (response.success) {
        // Clear cache to refresh data
        clearAbsensiCache();
        
        const tipeLabel = tipeAbsen === 'masuk' ? t('absenSiswaPage.masuk') : t('absenSiswaPage.pulang');
        const result: ScanResult = {
          user: student,
          role: 'murid',
          tipeAbsen: tipeLabel,
          status: 'tepat_waktu',
          timestamp: currentTime24,
          statusMessage: t('absenSiswaPage.successStatusMessage', { tipe: tipeLabel, name: student.name }),
          isError: false
        };
        
        setScanResult(result);
        setShowResultModal(true);
        showSuccessNotification(
          tipeAbsen === 'masuk' ? t('absenSiswaPage.successMasukTitle') : t('absenSiswaPage.successPulangTitle'),
          t('absenSiswaPage.successMessage', {
            name: student.name,
            time: new Date().toLocaleTimeString(language === 'ms' ? 'ms-MY' : 'id-ID'),
          })
        );

        // Close scanner after successful scan (unless already fulfilled)
        setTimeout(() => {
          setIsQRScannerOpen(false);
        }, 1500);
      } else {
        throw new Error(response.message || t('absenSiswaPage.saveFailedMessage'));
      }
    } catch (error: any) {
      console.error('Error creating absensi:', error);
      const result: ScanResult = {
        user: student,
        role: 'murid',
        tipeAbsen: tipeAbsen === 'masuk' ? t('absenSiswaPage.masuk') : t('absenSiswaPage.pulang'),
        timestamp: currentTime24,
        statusMessage: error.message || t('absenSiswaPage.saveFailedMessage'),
        isError: true,
        errorType: 'absen_failed'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification(t('absenSiswaPage.saveFailedTitle'), t('absenSiswaPage.saveFailedMessage'));
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
            {t('absenSiswaPage.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t('absenSiswaPage.subtitle')}
          </p>
        </div>
        <div className="flex-shrink-0">
          <Badge variant="info" className="inline-block">
            {new Date().toLocaleDateString(language === 'ms' ? 'ms-MY' : 'id-ID', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Badge>
        </div>
      </div>

      {/* Instruction Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <QrCode className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">
              {t('absenSiswaPage.instructionTitle')}
            </h3>
            <ul className="space-y-2 text-sm sm:text-base text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>{t('absenSiswaPage.step1')}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>{t('absenSiswaPage.step2')}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>{t('absenSiswaPage.step3')}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>{t('absenSiswaPage.step4')}</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>{t('absenSiswaPage.step5')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scan Button Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <QrCode className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {t('absenSiswaPage.readyTitle')}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {t('absenSiswaPage.readySubtitle')}
            </p>
          </div>
          <button
            onClick={() => setIsQRScannerOpen(true)}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <QrCode className="w-5 h-5 mr-2" />
            <span>{t('absenSiswaPage.scanButton')}</span>
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onScan={handleQRScan}
        onClose={() => {
          setIsQRScannerOpen(false);
          setScanResult(null);
          setShowResultModal(false);
          setLastProcessedScan(null);
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

export default AbsenSiswa;

