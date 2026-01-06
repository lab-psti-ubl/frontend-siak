import React, { useState, useEffect } from 'react';
import { QrCode, Camera, Download, Users, Clock, CheckCircle, AlertCircle, Scan, Eye } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';
import Modal from '../../../ui/Modal';
import QRScanner, { ScanResult } from '../../../ui/QRScanner';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import { useAuth } from '../../../../context/AuthContext';
import { User, AbsensiGuru, PengaturanAbsen } from '../../../../types';
import { generateAdminAttendanceQRCode, generateQRCodeURL, downloadQRCode, parseAdminAttendanceQRCode, parseTeacherAttendanceQRCode } from '../../../../utils/qrCodeGenerator';
import { calculateAttendanceStatus, formatTimeDisplay } from '../../../../utils/absensiUtils';
import { showSuccessNotification, showErrorNotification, showWarningNotification } from '../../../../utils/notificationUtils';
import { apiService } from '../../../../services/apiService';
import { useGurus } from '../../../../hooks/useGurus';
import { usePengaturanAbsen } from '../../../../hooks/usePengaturanAbsen';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { useIzinGuru } from '../../../../hooks/useIzinGuru';
import { getGuruAbsensiForDate as getGuruAbsensiForDateUtil, getGuruIzinForDate, getKeteranganAbsensi } from './utils/absenGuruDataHelpers';
import { isAttendanceDayAllowed, getDayNameInIndonesian } from '../../../../utils/attendanceDayValidation';

const QRAdmin: React.FC = () => {
  const { user } = useAuth();
  const { gurus: gurusData } = useGurus();
  const { pengaturanAbsen, activePengaturanAbsen: activePengaturanAbsenFromHook } = usePengaturanAbsen();
  const { enableEarlyDeparture } = usePengaturanSistem();
  const { izinGuru } = useIzinGuru();
  
  const [users, setUsers] = useState<User[]>([]);
  const [absensiGuru, setAbsensiGuru] = useState<AbsensiGuru[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [adminQRCodeURL, setAdminQRCodeURL] = useState<string>('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAdminQRModalOpen, setIsAdminQRModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastScanResult, setLastScanResult] = useState<{guru: string, time: string, type: string} | null>(null);
  
  // State untuk scan result modal
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // State untuk mencegah double scan
  const [lastProcessedScan, setLastProcessedScan] = useState<{data: string, time: number} | null>(null);
  const SCAN_DEBOUNCE_TIME = 2000;
  
  const activePengaturan = activePengaturanAbsenFromHook;
  const gurus = users.filter(u => u.role === 'guru' && u.isActive !== false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    // Combine gurus with murid (if needed) for users array
    setUsers([...gurusData]);
  }, [gurusData]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const absensiGuruResponse = await apiService.getAbsensiGuruByTanggal(today);

      if (absensiGuruResponse.success && absensiGuruResponse.absensiGuru) {
        setAbsensiGuru(absensiGuruResponse.absensiGuru);
      }
    } catch (error) {
      console.error('Error fetching QR Admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAbsensiForDate = async (tanggal: string) => {
    try {
      const response = await apiService.getAbsensiGuruByTanggal(tanggal);
      if (response.success && response.absensiGuru) {
        setAbsensiGuru(response.absensiGuru);
      }
    } catch (error) {
      console.error('Error fetching absensi for date:', error);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAbsensiForDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    const generateAdminQR = async () => {
      if (user) {
        const qrData = generateAdminAttendanceQRCode(user.id, user.name);
        const url = await generateQRCodeURL(qrData, 400);
        setAdminQRCodeURL(url);
      }
    };
    generateAdminQR();
  }, [user]);

  const handleQRScan = async (qrData: string) => {
    const currentTime = Date.now();

    if (lastProcessedScan &&
        lastProcessedScan.data === qrData &&
        (currentTime - lastProcessedScan.time) < SCAN_DEBOUNCE_TIME) {
      console.log('Duplicate QR scan detected, ignoring...');
      return;
    }

    setLastProcessedScan({ data: qrData, time: currentTime });

    const parsedTeacher = parseTeacherAttendanceQRCode(qrData);

    if (!parsedTeacher.isValid) {
      const result: ScanResult = {
        statusMessage: 'QR Code bukan milik guru atau tidak valid!',
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification('QR Code Tidak Valid', 'QR Code bukan milik guru atau tidak valid!');
      return;
    }

    const guru = users.find(u => u.id === parsedTeacher.guruId && u.role === 'guru') ||
      users.find(u => parsedTeacher.nip && u.nip === parsedTeacher.nip && u.role === 'guru');
    if (!guru) {
      const result: ScanResult = {
        statusMessage: 'QR Code bukan milik guru atau guru tidak ditemukan!',
        isError: true,
        errorType: 'not_registered'
      };
      setScanResult(result);
      setShowResultModal(true);
      showErrorNotification('Guru Tidak Ditemukan', 'QR Code bukan milik guru atau guru tidak ditemukan!');
      return;
    }

    if (!activePengaturan) {
      showErrorNotification('Pengaturan Tidak Ditemukan', 'Pengaturan absen belum dikonfigurasi!');
      return;
    }

    // Check if today is a work day for guru
    const pengaturanAbsenArray = activePengaturan ? [activePengaturan] : [];
    if (!isAttendanceDayAllowed(today, 'guru', pengaturanAbsenArray)) {
      const dayName = getDayNameInIndonesian(today);
      showErrorNotification(
        'Absensi Tidak Diizinkan',
        `Absensi tidak diizinkan pada hari ${dayName}. Silakan absen pada hari kerja yang telah ditentukan.`
      );
      return;
    }

    try {
      // Fetch active tahun ajaran
      const tahunAjaranResponse = await apiService.getActiveTahunAjaran();
      if (!tahunAjaranResponse.success || !tahunAjaranResponse.tahunAjaran) {
        showErrorNotification('Tahun Ajaran Tidak Ditemukan', 'Tahun ajaran aktif tidak ditemukan!');
        return;
      }

      const activeTahunAjaran = tahunAjaranResponse.tahunAjaran;
      const currentTime24 = new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      // Check if guru has active izin/sakit/cuti for today
      const izinAktif = getGuruIzinForDate(izinGuru, guru.id, today);
      if (izinAktif) {
        const result: ScanResult = {
          user: guru,
          role: 'guru',
          timestamp: currentTime24,
          statusMessage: `${guru.name} sedang ${izinAktif.jenis} hari ini`,
          isError: false,
          izinInfo: {
            jenis: izinAktif.jenis,
            alasan: izinAktif.alasan || '',
            tanggalMulai: izinAktif.tanggalMulai || today,
            tanggalSelesai: izinAktif.tanggalSelesai || today
          }
        };
        setScanResult(result);
        setShowResultModal(true);
        showWarningNotification('Guru Sedang Izin', `${guru.name} sedang ${izinAktif.jenis} hari ini`);
        return;
      }
      
      // Fetch existing absensi for today
      const absensiResponse = await apiService.getAbsensiGuruByTanggal(today);
      const existingAbsensi = absensiResponse.success && absensiResponse.absensiGuru
        ? absensiResponse.absensiGuru.find((a: AbsensiGuru) => a.guruId === guru.id)
        : null;

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
                user: guru,
                role: 'guru',
                timestamp: currentTime24,
                statusMessage: `Absen pulang hanya dapat dilakukan mulai 15 menit sebelum jam pulang (${batasWaktuString}). Jam pulang: ${activePengaturan.jamPulang}`,
                isError: true,
                errorType: 'early_departure',
                departureTime: activePengaturan.jamPulang
              };
              setScanResult(result);
              setShowResultModal(true);
              
              showErrorNotification(
                'Absen Pulang Tidak Diizinkan',
                `Absen pulang hanya dapat dilakukan mulai 15 menit sebelum jam pulang (${batasWaktuString}). Jam pulang: ${activePengaturan.jamPulang}`
              );
              return;
            }
          }

          // Update jam keluar
          const statusKeluar = calculateAttendanceStatus(currentTime24, activePengaturan, 'keluar');
          const updateData = {
            jamKeluar: currentTime24,
            statusKeluar,
          };
          
          const updateResponse = await apiService.updateAbsensiGuru(existingAbsensi.id, updateData);
          if (updateResponse.success) {
            await fetchAbsensiForDate(today);
            setLastScanResult({ guru: guru.name, time: currentTime24, type: 'keluar' });
            
            // Create ScanResult for success case
            const result: ScanResult = {
              user: guru,
              role: 'guru',
              tipeAbsen: 'Keluar',
              status: statusKeluar,
              timestamp: currentTime24,
              statusMessage: `Absen keluar berhasil. Status: ${statusKeluar === 'tepat_waktu' ? 'Tepat Waktu' : statusKeluar === 'pulang_awal' ? 'Pulang Awal' : statusKeluar}`,
              isError: false
            };
            setScanResult(result);
            setShowResultModal(true);
            
            showSuccessNotification('Absen Keluar Berhasil!', `${guru.name} - ${currentTime24}`);
          } else {
            // Create ScanResult for error case
            const result: ScanResult = {
              user: guru,
              role: 'guru',
              tipeAbsen: 'Keluar',
              timestamp: currentTime24,
              statusMessage: updateResponse.message || 'Gagal memperbarui absensi keluar',
              isError: true,
              errorType: 'absen_failed'
            };
            setScanResult(result);
            setShowResultModal(true);
            
            showErrorNotification('Gagal Update Absensi', updateResponse.message || 'Gagal memperbarui absensi keluar');
          }
        } else {
          const result: ScanResult = {
            user: guru,
            role: 'guru',
            tipeAbsen: 'Sudah Terpenuhi',
            timestamp: currentTime24,
            statusMessage: `${guru.name} sudah melakukan absen masuk dan keluar hari ini!`,
            isError: false,
            status: 'sudah_terpenuhi'
          };
          setScanResult(result);
          setShowResultModal(true);
          showWarningNotification('Sudah Absen Lengkap', `${guru.name} sudah melakukan absen masuk dan keluar hari ini!`);
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
            showErrorNotification(
              'Tidak Dapat Absen Masuk', 
              `Waktu absen masuk sudah melewati jam pulang (${activePengaturan.jamPulang}). ${guru.name} tidak dapat melakukan absen masuk.`
            );
            return;
          }
        }

        // Create new absensi masuk
        const statusMasuk = calculateAttendanceStatus(currentTime24, activePengaturan, 'masuk');
        const newAbsensi = {
          id: `absensi-guru-${Date.now()}`,
          guruId: guru.id,
          tanggal: today,
          jamMasuk: currentTime24,
          statusMasuk,
          statusKeluar: 'tidak_keluar',
          tahunAjaranId: activeTahunAjaran.id,
          semester: activeTahunAjaran.semester,
        };
        
        const createResponse = await apiService.createAbsensiGuru(newAbsensi);
        if (createResponse.success) {
          await fetchAbsensiForDate(today);
          setLastScanResult({ guru: guru.name, time: currentTime24, type: 'masuk' });
          
          // Create ScanResult for success case
          const result: ScanResult = {
            user: guru,
            role: 'guru',
            tipeAbsen: 'Masuk',
            status: statusMasuk,
            timestamp: currentTime24,
            statusMessage: `Absen masuk berhasil. Status: ${statusMasuk === 'tepat_waktu' ? 'Tepat Waktu' : statusMasuk === 'terlambat' ? 'Terlambat' : statusMasuk}`,
            isError: false
          };
          setScanResult(result);
          setShowResultModal(true);
          
          showSuccessNotification('Absen Masuk Berhasil!', `${guru.name} - ${currentTime24}`);
        } else {
          // Create ScanResult for error case
          const result: ScanResult = {
            user: guru,
            role: 'guru',
            tipeAbsen: 'Masuk',
            timestamp: currentTime24,
            statusMessage: createResponse.message || 'Gagal membuat absensi masuk',
            isError: true,
            errorType: 'absen_failed'
          };
          setScanResult(result);
          setShowResultModal(true);
          
          showErrorNotification('Gagal Create Absensi', createResponse.message || 'Gagal membuat absensi masuk');
        }
      }
    } catch (error: any) {
      console.error('Error processing QR scan:', error);
      showErrorNotification('Error', error.message || 'Terjadi kesalahan saat memproses QR Code');
    }
  };

  const showAdminQR = () => {
    setIsAdminQRModalOpen(true);
  };

  const downloadAdminQR = async () => {
    if (user) {
      const qrData = generateAdminAttendanceQRCode(user.id, user.name);
      await downloadQRCode(qrData, 'admin-qr-code');
    }
  };

  const getAbsensiForDate = (tanggal: string) => {
    return absensiGuru.filter(a => a.tanggal === tanggal);
  };

  const getGuruAbsensiForDate = (guruId: string, tanggal: string) => {
    return getGuruAbsensiForDateUtil(absensiGuru, guruId, tanggal);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'tepat_waktu':
        return <Badge variant="success">Tepat Waktu</Badge>;
      case 'terlambat':
        return <Badge variant="warning">Terlambat</Badge>;
      case 'pulang_awal':
        return <Badge variant="warning">Pulang Awal</Badge>;
      case 'tidak_masuk':
        return <Badge variant="danger">Tidak Masuk</Badge>;
      case 'tidak_keluar':
        return <Badge variant="danger">Tidak Keluar</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const calculateAttendanceStats = (tanggal: string) => {
    const absensiHariIni = getAbsensiForDate(tanggal);
    
    const stats = {
      totalGuru: gurus.length,
      sudahAbsenMasuk: absensiHariIni.filter(a => a.jamMasuk).length,
      sudahAbsenKeluar: absensiHariIni.filter(a => a.jamKeluar).length,
      tepatWaktuMasuk: absensiHariIni.filter(a => a.statusMasuk === 'tepat_waktu').length,
      terlambat: absensiHariIni.filter(a => a.statusMasuk === 'terlambat').length,
      tidakMasuk: gurus.length - absensiHariIni.filter(a => a.jamMasuk).length,
    };

    return stats;
  };

  const stats = calculateAttendanceStats(selectedDate);
  const attendanceRate = stats.totalGuru > 0 ? ((stats.sudahAbsenMasuk / stats.totalGuru) * 100).toFixed(1) : '0';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data QR Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                QR Code Admin
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Kelola QR Code admin dan scan absensi guru
              </p>
            </div>
            <div className="flex-shrink-0">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Working Hours Info */}
      {activePengaturan && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-blue-900 text-sm sm:text-base">Jam Kerja Hari Ini</p>
                  <p className="text-xs sm:text-sm text-blue-700 mt-1">
                    Masuk: {activePengaturan.jamMasuk} ({activePengaturan.toleransiMasuk} mnt) • Pulang: {activePengaturan.jamPulang} ({activePengaturan.toleransiPulang} mnt)
                  </p>
                </div>
              </div>
              <div className="text-center sm:text-right flex-shrink-0">
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">{attendanceRate}%</p>
                <p className="text-xs sm:text-sm text-blue-700 mt-1">Tingkat Kehadiran</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Scan Result */}
      {lastScanResult && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-emerald-900 text-sm sm:text-base">Scan Terakhir Berhasil</p>
                <p className="text-xs sm:text-sm text-emerald-700 mt-1">
                  {lastScanResult.guru} • Absen {lastScanResult.type} pada {lastScanResult.time}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Guru</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.totalGuru}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Sudah Masuk</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.sudahAbsenMasuk}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-orange-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Sudah Keluar</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.sudahAbsenKeluar}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-red-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Terlambat</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{stats.terlambat}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code and Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        {/* QR Code Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-200">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">QR Code Admin</h3>
                <p className="text-xs sm:text-sm text-white">Untuk absensi masuk dan keluar guru</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 lg:p-6 flex flex-col items-center gap-4 sm:gap-5">
            <div className="bg-slate-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-slate-200 shadow-sm">
              {adminQRCodeURL ? (
                <img
                  src={adminQRCodeURL}
                  alt="Admin QR Code"
                  className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
                />
              ) : (
                <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <Button
                onClick={showAdminQR}
                variant="secondary"
                fullWidth
                className="text-xs sm:text-sm flex items-center justify-center"
              >
                <Eye size={14} className="sm:mr-2" />
                <span >Lihat QR</span>
              </Button>
              <Button
                onClick={downloadAdminQR}
                variant="secondary"
                fullWidth
                className="text-xs sm:text-sm flex items-center justify-center"
              >
                <Download size={14} className="sm:mr-2" />
                <span >Download</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Scan QR Code Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 py-4 border-b border-blue-200">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg p-2">
                <Scan className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Scan QR Guru</h3>
                <p className="text-xs sm:text-sm text-white">Scan QR Code guru untuk mengabsen</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 lg:p-6 space-y-4">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 text-xs sm:text-sm mb-2">Cara Penggunaan:</h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>Guru scan QR Code admin untuk absen masuk/keluar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>Admin scan QR Code guru untuk mengabsen guru</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>Sistem otomatis menentukan absen masuk atau keluar</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={() => setIsQRScannerOpen(true)}
              fullWidth
              size="lg"
              className="text-xs sm:text-sm flex items-center justify-center"
            >
              <Scan size={16} className="mr-2" />
              <span className="hidden sm:inline">Scan QR Code Guru</span>
              <span className="sm:hidden">Mulai Scan</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance List - Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Absensi Guru - {new Date(selectedDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell header>Guru</TableCell>
                <TableCell header>Jam Masuk</TableCell>
                <TableCell header>Status Masuk</TableCell>
                <TableCell header>Jam Keluar</TableCell>
                <TableCell header>Status Keluar</TableCell>
                <TableCell header>Keterangan</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gurus.map((guru) => {
                const absensi = getGuruAbsensiForDate(guru.id, selectedDate);
                const izinAktif = getGuruIzinForDate(izinGuru, guru.id, selectedDate);
                const keterangan = getKeteranganAbsensi(absensi, izinAktif);

                return (
                  <TableRow key={guru.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {getInitials(guru.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{guru.name}</p>
                          <p className="text-xs text-slate-500">NIP: {guru.nip}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {absensi?.jamMasuk ? (
                        <div className="flex items-center space-x-2">
                          <Clock size={14} className="text-slate-400" />
                          <span className="font-mono text-sm font-medium">{formatTimeDisplay(absensi.jamMasuk)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {absensi?.statusMasuk ?
                        getStatusBadge(absensi.statusMasuk) :
                        <Badge variant="danger">Tidak Masuk</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      {absensi?.jamKeluar ? (
                        <div className="flex items-center space-x-2">
                          <Clock size={14} className="text-slate-400" />
                          <span className="font-mono text-sm font-medium">{formatTimeDisplay(absensi.jamKeluar)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {absensi?.statusKeluar ?
                        getStatusBadge(absensi.statusKeluar) :
                        <Badge variant="danger">Tidak Keluar</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate text-xs text-slate-600 font-medium" title={keterangan}>
                        {keterangan}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {gurus.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Belum ada data guru</h3>
            <p className="text-slate-600">Tambahkan guru terlebih dahulu untuk melihat data absensi</p>
          </div>
        )}
      </div>

      {/* Attendance List - Mobile Card View */}
      <div className="lg:hidden space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500">
            <h3 className="text-base font-semibold text-white">
              Absensi Guru - {new Date(selectedDate).toLocaleDateString('id-ID', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </h3>
          </div>

          {gurus.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {gurus.map((guru) => {
                const absensi = getGuruAbsensiForDate(guru.id, selectedDate);
                const izinAktif = getGuruIzinForDate(izinGuru, guru.id, selectedDate);
                const keterangan = getKeteranganAbsensi(absensi, izinAktif);

                return (
                  <div key={guru.id} className="p-4">
                    {/* Guru Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        {getInitials(guru.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{guru.name}</p>
                        <p className="text-xs text-slate-600">NIP: {guru.nip}</p>
                      </div>
                    </div>

                    {/* Attendance Details */}
                    <div className="space-y-2">
                      {/* Jam Masuk */}
                      <div className="flex items-start justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock size={12} className="flex-shrink-0" />
                          <span>Jam Masuk</span>
                        </div>
                        <div className="text-right">
                          {absensi?.jamMasuk ? (
                            <p className="font-mono font-medium text-slate-900">{formatTimeDisplay(absensi.jamMasuk)}</p>
                          ) : (
                            <p className="text-slate-400">-</p>
                          )}
                        </div>
                      </div>

                      {/* Status Masuk */}
                      <div className="flex items-start justify-between text-xs">
                        <span className="text-slate-600">Status Masuk</span>
                        <div>
                          {absensi?.statusMasuk ?
                            getStatusBadge(absensi.statusMasuk) :
                            <Badge variant="danger">Tidak Masuk</Badge>
                          }
                        </div>
                      </div>

                      {/* Jam Keluar */}
                      <div className="flex items-start justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock size={12} className="flex-shrink-0" />
                          <span>Jam Keluar</span>
                        </div>
                        <div className="text-right">
                          {absensi?.jamKeluar ? (
                            <p className="font-mono font-medium text-slate-900">{formatTimeDisplay(absensi.jamKeluar)}</p>
                          ) : (
                            <p className="text-slate-400">-</p>
                          )}
                        </div>
                      </div>

                      {/* Status Keluar */}
                      <div className="flex items-start justify-between text-xs">
                        <span className="text-slate-600">Status Keluar</span>
                        <div>
                          {absensi?.statusKeluar ?
                            getStatusBadge(absensi.statusKeluar) :
                            <Badge variant="danger">Tidak Keluar</Badge>
                          }
                        </div>
                      </div>

                      {/* Keterangan */}
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-600">
                          <span className="text-slate-500">Ket:</span> <span className="font-medium">{keterangan}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-medium text-slate-900 mb-1">Belum ada data guru</h3>
              <p className="text-xs text-slate-600">Tambahkan guru terlebih dahulu untuk melihat data absensi</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin QR Modal */}
      <Modal
        isOpen={isAdminQRModalOpen}
        onClose={() => setIsAdminQRModalOpen(false)}
        title="QR Code Admin"
        size="md"
      >
        <div className="text-center space-y-6">
          <div className="bg-white p-8 rounded-xl border-2 border-gray-200 inline-block shadow-sm">
            {adminQRCodeURL ? (
              <img 
                src={adminQRCodeURL} 
                alt="Admin QR Code" 
                className="w-80 h-80 object-contain"
              />
            ) : (
              <div className="w-80 h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-3">Cara Penggunaan:</h4>
            <ul className="text-sm text-yellow-800 space-y-2 text-left">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Tampilkan QR Code ini kepada guru
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Guru scan QR Code ini untuk absen masuk/keluar
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Sistem otomatis menentukan jenis absensi
              </li>
            </ul>
          </div>

          <Button onClick={downloadAdminQR} fullWidth>
            <Download size={16} className="mr-2" />
            Download QR Code
          </Button>
        </div>
      </Modal>

      <QRScanner
        isOpen={isQRScannerOpen}
        onScan={handleQRScan}
        onClose={() => {
          setIsQRScannerOpen(false);
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

export default QRAdmin;