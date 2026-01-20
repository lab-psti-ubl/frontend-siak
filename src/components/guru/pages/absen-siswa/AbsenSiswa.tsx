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
import { getLocalTimeISOString } from '../../../../utils/absensiUtils';
import { showSuccessNotification, showErrorNotification, showWarningNotification } from '../../../../utils/notificationUtils';
import { Absensi, User } from '../../../../types';

const AbsenSiswa: React.FC = () => {
  const { user } = useAuth();
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
  const today = new Date().toISOString().split('T')[0];

  const handleQRScan = async (qrData: string) => {
    const currentTime = Date.now();
    const currentTime24 = new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });

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
        statusMessage: 'QR Code tidak valid! Pastikan QR Code adalah milik siswa.',
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification('QR Code Tidak Valid', 'QR Code tidak valid! Pastikan QR Code adalah milik siswa.');
      return;
    }

    // Find student by ID or NISN from allStudents (murid + santri)
    const student = allStudents.find(m => m.id === parsed.muridId) ||
      allStudents.find(m => parsed.nisn && m.nisn === parsed.nisn);

    if (!student) {
      const result: ScanResult = {
        statusMessage: 'Siswa tidak ditemukan dalam sistem!',
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification('Siswa Tidak Ditemukan', 'Siswa tidak ditemukan dalam sistem!');
      return;
    }

    // Check if student is active
    if (student.isActive === false) {
      const result: ScanResult = {
        user: student,
        role: 'murid',
        timestamp: currentTime24,
        statusMessage: 'Siswa tidak aktif dalam sistem!',
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification('Siswa Tidak Aktif', 'Siswa tidak aktif dalam sistem!');
      return;
    }

    // Check if today is a school day for students
    if (!isAttendanceDayAllowed(today, 'murid', pengaturanAbsen)) {
      const dayName = getDayNameInIndonesian(today);
      const result: ScanResult = {
        user: student,
        role: 'murid',
        timestamp: currentTime24,
        statusMessage: `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`,
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification(
        'Absensi Tidak Diizinkan',
        `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari sekolah yang telah ditentukan.`
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
        statusMessage: 'Tidak ada tahun ajaran aktif',
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification('Error', 'Tidak ada tahun ajaran aktif');
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
        statusMessage: `${student.name} sudah melakukan absen masuk dan pulang hari ini!`,
        isError: false,
        status: 'sudah_terpenuhi'
      };
      setScanResult(result);
      setShowResultModal(true);
      showWarningNotification('Sudah Absen', `${student.name} sudah melakukan absen masuk dan pulang hari ini!`);
      return;
    }

    // Check if trying to absen masuk but current time has passed jam pulang
    if (tipeAbsen === 'masuk' && activePengaturanAbsen) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const [jamPulangHour, jamPulangMinute] = activePengaturanAbsen.jamPulang.split(':').map(Number);
      
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const jamPulangMinutes = jamPulangHour * 60 + jamPulangMinute;
      
      if (currentTimeMinutes > jamPulangMinutes) {
        const result: ScanResult = {
          user: student,
          role: 'murid',
          timestamp: currentTime24,
          statusMessage: `Waktu absen masuk sudah melewati jam pulang (${activePengaturanAbsen.jamPulang}). Tidak dapat melakukan absen masuk.`,
          isError: true,
          errorType: 'not_registered'
        };
        setScanResult(result);
        setShowResultModal(true);
        showErrorNotification(
          'Tidak Dapat Absen Masuk', 
          `Waktu absen masuk sudah melewati jam pulang (${activePengaturanAbsen.jamPulang}).`
        );
        return;
      }
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
        statusMessage: 'Kelas siswa tidak ditemukan di sistem!',
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification('Kelas Tidak Ditemukan', 'Kelas siswa tidak ditemukan di sistem!');
      return;
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

    // Create or update attendance
    try {
      const response = await apiService.createAbsensi(newAbsensi);
      
      if (response.success) {
        // Clear cache to refresh data
        clearAbsensiCache();
        
        const tipeLabel = tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang';
        const result: ScanResult = {
          user: student,
          role: 'murid',
          tipeAbsen: tipeLabel,
          status: 'tepat_waktu',
          timestamp: currentTime24,
          statusMessage: `Absen ${tipeLabel} berhasil untuk ${student.name}. Status: Tepat Waktu`,
          isError: false
        };
        
        setScanResult(result);
        setShowResultModal(true);
        showSuccessNotification(
          `Absen ${tipeLabel} Berhasil!`, 
          `${student.name} - ${new Date().toLocaleTimeString('id-ID')}`
        );

        // Close scanner after successful scan (unless already fulfilled)
        setTimeout(() => {
          setIsQRScannerOpen(false);
        }, 1500);
      } else {
        throw new Error(response.message || 'Gagal menyimpan absensi');
      }
    } catch (error: any) {
      console.error('Error creating absensi:', error);
      const result: ScanResult = {
        user: student,
        role: 'murid',
        tipeAbsen: tipeAbsen === 'masuk' ? 'Masuk' : 'Pulang',
        timestamp: currentTime24,
        statusMessage: error.message || 'Gagal menyimpan absensi',
        isError: true,
        errorType: 'absen_failed'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification('Error', 'Gagal menyimpan absensi');
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Absen Siswa</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Scan QR Code siswa untuk melakukan absensi kehadiran</p>
        </div>
        <div className="flex-shrink-0">
          <Badge variant="info" className="inline-block">
            {new Date().toLocaleDateString('id-ID', {
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
              Cara Menggunakan Fitur Absen Siswa
            </h3>
            <ul className="space-y-2 text-sm sm:text-base text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Klik tombol <strong>"Scan QR Code"</strong> di bawah untuk membuka scanner</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Posisikan QR Code siswa di depan kamera</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Sistem akan otomatis menentukan apakah absen <strong>Masuk</strong> atau <strong>Pulang</strong></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Absen masuk akan dicatat jika siswa belum absen hari ini</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Absen pulang akan dicatat jika siswa sudah absen masuk</span>
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
              Siap untuk Scan QR Code Siswa
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Klik tombol di bawah untuk membuka scanner QR Code
            </p>
          </div>
          <button
            onClick={() => setIsQRScannerOpen(true)}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <QrCode className="w-5 h-5 mr-2" />
            <span>Scan QR Code</span>
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

