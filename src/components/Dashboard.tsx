import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePengaturanSistem } from '../hooks/usePengaturanSistem';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import Footer from './layout/Footer';

// Pages
import AdminDashboard from './admin/AdminDashboard';
import AdminMonitoringCBT from './admin/pages/cbt/AdminMonitoringCBT';
import AdminBankSoalCBT from './admin/pages/cbt/AdminBankSoalCBT';
import KepalaSekolahDashboard from './admin/KepalaSekolahDashboard';
import ManajemenGuru from './admin/pages/kelola-guru/ManejemenGuru';
import ManajemenKelas from './admin/pages/kelola-jurusan/ManjemenKelas';
import ManajemenJurusan from './admin/pages/kelola-jurusan/ManejemenJurusan';
import ManajemenMapel from './admin/pages/kelola-akademik/ManejemenMapel';
import ManajemenJadwal from './admin/pages/kelola-akademik/ManejemenJadwal';
import ManajemenTahunAjaran from './admin/pages/kelola-akademik/ManajemenTahunAjaran';
import ManajemenEkstrakulikuler from './admin/pages/ekstrakulikuler/ManajemenEkstrakulikuler';
import ManajemenMuridNew from './admin/pages/manejemen-murid/ManejemenMuridNew';
import TambahMurid from './admin/pages/manejemen-murid/TambahMurid';
import KelolaGuruMapel from './admin/pages/kelola-akademik/KelolaGuruMapel';
import AbsenGuru from './admin/pages/kelola-guru/AbsenGuru';
import QRAdmin from './admin/pages/kelola-guru/QRAdmin';
import PengaturanAbsen from './admin/pages/pengaturan/PengaturanAbsen';
import IzinGuruAdmin from './admin/pages/kelola-guru/IzinGuruAdmin';
import BeriInfo from './admin/pages/info-pengumuman/BeriInfo';
import PengumumanKelulusan from './admin/pages/info-pengumuman/PengumumanKelulusan';
import AlumniSekolah from './admin/pages/info-pengumuman/AlumniSekolah';
import RekapRaportMurid from './admin/pages/info-pengumuman/RekapRaportMurid';
import MonitoringKelas from './admin/pages/monitoring-kelas/MonitoringKelas';
import ManajemenAlatRFID from './admin/pages/kelola-alat-rfid/ManajemenAlatRFID';
import DataFaceRecognition from './admin/pages/kelola-guru/DataFaceRecognition';
import DataUstadz from './admin/pages/tahfiz/DataUstadz';
import DataSantri from './admin/pages/tahfiz/DataSantri';
import DataSantriKepalaSekolah from './admin/pages/tahfiz/DataSantriKepalaSekolah';
import DataUstadzKepalaSekolah from './admin/pages/tahfiz/DataUstadzKepalaSekolah';
import DetailProgressSantriKepalaSekolah from './admin/pages/tahfiz/DetailProgressSantriKepalaSekolah';
import DetailUstadzKepalaSekolah from './admin/pages/tahfiz/DetailUstadzKepalaSekolah';
import DetailKelasTahfiz from './admin/pages/tahfiz/DetailKelasTahfiz';
import DataKelasTahfiz from './admin/pages/tahfiz/DataKelasTahfiz';
import DataJadwalTahfiz from './admin/pages/tahfiz/DataJadwalTahfiz';
import PembukaanSpmb from './admin/pages/spmb/PembukaanSpmb';
import DataPendaftarSpmb from './admin/pages/spmb/DataPendaftarSpmb';
import DataDiterimaSpmb from './admin/pages/spmb/DataDiterimaSpmb';

import GuruDashboard from './guru/GuruDashboard';
import JadwalGuru from './guru/pages/mengajar/JadwalGuru';
import KelolaAbsensi from './guru/pages/mengajar/KelolaAbsensi';
import RiwayatAbsensi from './guru/pages/mengajar/RiwayatAbsensi';
import SuratIzinGuru from './guru/pages/walikelas/SuratIzinGuru';
import ProfilGuru from './guru/ProfilGuru';
import AbsenKelas from './guru/pages/walikelas/AbsenKelas';
import AbsenGuruComponent from './guru/AbsenGuru';
import AbsenSiswa from './guru/pages/absen-siswa/AbsenSiswa';
import DataMuridKelas from './guru/pages/walikelas/DataMuridKelas';
import AbsenPelajaran from './guru/pages/walikelas/AbsenPelajaran';
import JadwalKelas from './guru/pages/walikelas/JadwalKelas';
import InputNilai from './guru/pages/mengajar/InputNilai';
import CapaianPembelajaran from './guru/pages/mengajar/CapaianPembelajaran';
import NilaiKelas from './guru/pages/walikelas/NilaiKelas';
import NilaiEkstrakulikulerKelas from './guru/pages/walikelas/components/nilai-ekstrakulikuler/NilaiEkstrakulikulerKelas';
import DetailNilaiEkstrakulikulerMurid from './guru/pages/walikelas/components/nilai-ekstrakulikuler/DetailNilaiEkstrakulikulerMurid';
import KokulikulerKelas from './guru/pages/walikelas/KokulikulerKelas';
import IzinGuruComponent from './guru/IzinGuru';
import RaportMurid from './guru/pages/walikelas/RaportMurid';
import ERaport from './guru/pages/walikelas/ERaport';
import InfoKelulusan from './guru/pages/walikelas/InfoKelulusan';
import RiwayatWaliKelas from './guru/pages/walikelas/RiwayatWaliKelas';
import PenggantiAbsensi from './guru/pages/pengganti/PenggantiAbsensi';
import DataSantriTahfizGuru from './guru/pages/tahfiz/DataSantriTahfizGuru';
import DetailSantriTahfizGuru from './guru/pages/tahfiz/DetailSantriTahfizGuru';
import JadwalTahfizGuru from './guru/pages/tahfiz/JadwalTahfizGuru';
import ProgressTahfiz from './guru/pages/tahfiz/ProgressTahfiz';
import DetailProgressTahfiz from './guru/pages/tahfiz/DetailProgressTahfiz';
import TesHapalan from './guru/pages/tahfiz/TesHapalan';
import DetailHafalan from './guru/pages/tahfiz/DetailHafalan';
import AbsensiTahfiz from './guru/pages/tahfiz/AbsensiTahfiz';
import RiwayatAbsensiTahfiz from './guru/pages/tahfiz/RiwayatAbsensiTahfiz';
import IzinSantriTahfiz from './guru/pages/tahfiz/IzinSantriTahfiz';
import InfoKelulusanMurid from './murid/InfoKelulusanMurid';
import RiwayatKelulusan from './guru/RiwayatKelulusan';
import BankSoalCBT from './guru/pages/cbt/BankSoalCBT/index';
import BuatUjianCBT from './guru/pages/cbt/BuatUjianCBT/index';

import MuridDashboard from './murid/MuridDashboard';
import JadwalMurid from './murid/JadwalMurid';
import AbsensiMurid from './murid/AbsensiMurid';
import AbsenKehadiran from './murid/pages/absen-kehadiran/AbsenKehadiran';
import QRCodeMurid from './murid/QRCodeMurid';
import SuratIzinMurid from './murid/pages/surat-izin/SuratIzinMurid';
import ProfilMurid from './murid/ProfilMurid';
import NilaiMurid from './murid/NilaiMurid';
import MuridRaportMurid from './murid/RaportMurid';
import ERaportMurid from './murid/pages/ERaportMurid';
import MataPelajaranMurid from './murid/MataPelajaranMurid';
import JadwalTahfizMurid from './murid/pages/tahfiz/JadwalTahfizMurid';
import AbsensiSantriTahfiz from './murid/pages/tahfiz/AbsensiSantriTahfiz';
import ProgressHapalanMurid from './murid/pages/tahfiz/ProgressHapalanMurid';
import UjianCBTMurid from './murid/pages/cbt/UjianCBTMurid';
import KerjakanUjianCBT from './murid/pages/cbt/KerjakanUjianCBT';
import MuridBottomNavigation from './murid/MuridBottomNavigation';
import GuruBottomNavigation from './guru/GuruBottomNavigation';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { systemType, loading: systemTypeLoading } = usePengaturanSistem();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        if (width >= 1024) {
          setIsSidebarOpen(true);
        } else {
          setIsSidebarOpen(false);
        }
        // Update mobile view state
        setIsMobileView(width < 768);
      }, 100);
    };

    // Run once on mount to ensure correct initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Paksa login ulang jika ada kunci CBT saat kembali ke dashboard
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard') && user?.role === 'murid') {
      try {
        const lock = sessionStorage.getItem('cbt_lock');
        if (lock) {
          sessionStorage.removeItem('cbt_lock');
          logout();
          navigate('/login', { replace: true });
          return;
        }
      } catch {
        // abaikan error storage
      }
    }
  }, [location.pathname, navigate, logout, user]);

  // Fix scroll container initialization on first load
  useEffect(() => {
    // Force browser to recalculate scroll container after mount
    const fixScroll = () => {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        const mainContent = document.querySelector('.main-content-scroll main');
        if (mainContent) {
          // Force reflow by reading layout properties
          void (mainContent as HTMLElement).offsetHeight;
          void (mainContent as HTMLElement).scrollHeight;
          // Ensure scroll is enabled
          (mainContent as HTMLElement).style.overflowY = 'auto';
        }
      }, 0);
    };

    // Fix immediately and after a short delay
    fixScroll();
    const timeoutId = setTimeout(fixScroll, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // Get current page from URL
  const getCurrentPage = () => {
    const path = location.pathname.replace('/dashboard/', '') || 'dashboard';
    if (path === 'dashboard' || path === '') {
      return 'dashboard';
    }
    // Extract base path (remove parameters and sub-paths)
    // e.g., "progress-tahfiz/123" -> "progress-tahfiz"
    // e.g., "progress-tahfiz/123/tes-hapalan" -> "progress-tahfiz"
    const basePath = path.split('/')[0];
    return basePath;
  };

  const currentPage = getCurrentPage();

  // Update document title based on current page
  useEffect(() => {
    const pageTitle = getPageTitle();
    document.title = `${pageTitle} - iSchola`;
  }, [location.pathname]);

  const handlePageChange = (page: string) => {
    if (page === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${page}`);
    }
  };

  const getPageTitle = () => {
    const titles: { [key: string]: string } = {
      dashboard: 'Dashboard',
      guru: 'Manajemen Guru',
      jurusan: 'Manajemen Jurusan',
      kelas: 'Manajemen Kelas',
      'tambah-murid': 'Tambah Murid',
      'kelola-data-murid': 'Kelola Data Murid',
      'data-statistik': 'Data Statistik',
      'guru-mapel': 'Kelola Guru Mapel',
      mapel: 'Mata Pelajaran',
      jadwal: 'Jadwal Pelajaran',
      'tahun-ajaran': 'Tahun Ajaran',
      'monitoring-kelas': 'Monitoring Kelas Real-Time',
      'absen-guru': 'Absen Guru',
      'absen-saya': 'Absen Saya',
      'absen-siswa': 'Absen Siswa',
      'data-santri-kepala-sekolah': 'Data Santri Tahfiz',
      'data-ustadz-kepala-sekolah': 'Data Ustaz/ah Tahfiz',
      'qr-admin': 'QR Admin',
      'pengaturan': 'Pengaturan Absen',
      'data-alat-rfid': 'Data Alat RFID',
      'data-face-recognition': 'Data Face Recognition',
      'jadwal-saya': 'Jadwal Saya',
      absensi: 'Kelola Absensi',
      'riwayat-absensi': 'Riwayat Absensi',
      'absen-kelas': 'Absen Kelas',
      'data-murid-kelas': 'Data Murid Kelas',
      'murid-kelas': 'Absen Pelajaran',
      'surat-izin': 'Surat Izin',
      'jadwal-kelas': 'Jadwal Pelajaran Kelas',
      'input-nilai': 'Input Nilai',
      'capaian-pembelajaran': 'Capaian Pembelajaran',
      'profil': 'Profil',
      'absensi-saya': 'Absensi Saya',
      'absen-kehadiran': 'Absen Kehadiran',
      'qr-code': 'QR Code Saya',
      'mata-pelajaran': 'Mata Pelajaran',
      'nilai-saya': 'Nilai Saya',
      'raport-saya': 'Raport Saya',
      'e-raport-saya': 'E-Raport Saya',
      'jadwal-tahfiz-murid': 'Jadwal Tahfiz',
      'absensi-santri-tahfiz': 'Absensi Santri',
      'progress-hapalan-murid': 'Progress Hapalan',
      'raport-murid': 'Raport Murid',
      'riwayat-wali-kelas': 'Riwayat Walikelas',
      'raport-murid-admin': 'Raport Murid',
      'beri-info': 'Beri Info',
      'pengumuman-kelulusan': 'Pengumuman Kelulusan',
      'alumni-sekolah': 'Alumni Sekolah',
      'info-kelulusan': 'Info Kelulusan',
      'info-kelulusan-murid': 'Info Kelulusan',
      'pengganti': 'Pengganti',
      'data-kelas-tahfiz': 'Data Kelas/Ruangan Tahfiz',
      'data-jadwal-tahfiz': 'Data Jadwal Tahfiz',
      'data-santri-tahfiz-guru': 'Data Santri Tahfiz',
      'absensi-tahfiz': 'Absensi Tahfiz',
      'riwayat-absensi-tahfiz': 'Riwayat Absen Tahfiz',
      'izin-santri-tahfiz': 'Izin Santri',
      'progress-tahfiz': 'Progress Tahfiz',
      'spmb-pembukaan': 'Pembukaan SPMB',
      'spmb-pendaftar': 'Data Pendaftar SPMB',
      'spmb-diterima': 'Data Diterima SPMB',
      'cbt-bank-soal': 'Bank Soal CBT',
      'cbt-buat-ujian': 'Buat Ujian CBT',
    };
    const currentPageForTitle = getCurrentPage();
    return titles[currentPageForTitle] || 'Dashboard';
  };

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };


  const isMuridMobile = user?.role === 'murid' && isMobileView;
  const isGuruMobile = user?.role === 'guru' && isMobileView;

  // Tampilkan loading sampai systemType dari backend tersedia (jangan tampilkan sistem default)
  if (systemTypeLoading || systemType === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {user?.role !== 'murid' && user?.role !== 'guru' && (
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isOpen={isSidebarOpen}
          onClose={handleSidebarClose}
        />
      )}

      {user?.role === 'murid' && !isMuridMobile && (
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isOpen={isSidebarOpen}
          onClose={handleSidebarClose}
        />
      )}

      {user?.role === 'guru' && !isGuruMobile && (
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isOpen={isSidebarOpen}
          onClose={handleSidebarClose}
        />
      )}

      <div className={`flex-1 flex flex-col pt-16 md:pt-0 min-w-0 ${
        user?.role === 'murid' ? (isMuridMobile ? '' : 'lg:ml-96') :
        user?.role === 'guru' ? (isGuruMobile ? '' : 'lg:ml-96') :
        'lg:ml-96'
      } overflow-hidden h-screen ${
        (user?.role === 'murid' && isMuridMobile) || (user?.role === 'guru' && isGuruMobile) ? 'pb-24' : ''
      } main-content-scroll`}>
        <Header
          title={getPageTitle()}
          onMenuClick={handleMenuClick}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Routes>
            {user?.role === 'kepala_sekolah' && (
              <>
                <Route path="/" element={<KepalaSekolahDashboard />} />
                <Route path="/monitoring-kelas" element={<MonitoringKelas />} />
                <Route path="/absen-guru" element={<AbsenGuru />} />
                <Route path="/guru" element={<ManajemenGuru />} />
                <Route path="/kelola-data-murid" element={
                  <ManajemenMuridNew onAddMurid={(kelasId) => {
                    if (kelasId) {
                      sessionStorage.setItem('selectedKelasId', kelasId);
                      navigate('/dashboard/tambah-murid', { state: { selectedKelasId: kelasId } });
                    } else {
                      navigate('/dashboard/tambah-murid');
                    }
                  }} />
                } />
                <Route path="/data-santri-kepala-sekolah" element={<DataSantriKepalaSekolah />} />
                <Route path="/data-santri-kepala-sekolah/:santriId" element={<DetailProgressSantriKepalaSekolah />} />
                <Route path="/data-ustadz-kepala-sekolah" element={<DataUstadzKepalaSekolah />} />
                <Route path="/data-ustadz-kepala-sekolah/:ustadzId" element={<DetailUstadzKepalaSekolah />} />
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Route path="/" element={<AdminDashboard />} />
                {systemType === 'tahfiz' ? (
                  <>
                    <Route path="/monitoring-kelas" element={<MonitoringKelas />} />
                    <Route path="/guru" element={<ManajemenGuru />} />
                    <Route path="/absen-guru" element={<AbsenGuru />} />
                    <Route path="/izin-guru-admin" element={<IzinGuruAdmin />} />
                    <Route path="/qr-admin" element={<QRAdmin />} />
                    <Route path="/beri-info" element={<BeriInfo />} />
                    <Route path="/data-alat-rfid" element={<ManajemenAlatRFID />} />
                    <Route path="/data-kelas-tahfiz" element={<DataKelasTahfiz />} />
                    <Route path="/data-kelas-tahfiz/:id" element={<DetailKelasTahfiz />} />
                    <Route path="/data-jadwal-tahfiz" element={<DataJadwalTahfiz />} />
                    <Route path="/data-ustadz" element={<DataUstadz />} />
                    <Route path="/data-santri" element={<DataSantri />} />
                    <Route path="/pengaturan" element={<PengaturanAbsen />} />
                  </>
                ) : (
                  <>
                    <Route path="/guru" element={<ManajemenGuru />} />
                    <Route path="/data-face-recognition" element={<DataFaceRecognition />} />
                    {(systemType === 'sekolah_umum' || systemType === 'sekolah_umum_tahfiz') && (
                      <>
                        <Route path="/jurusan" element={<ManajemenJurusan />} />
                        <Route path="/kelas" element={<ManajemenKelas />} />
                      </>
                    )}
                    <Route path="/tambah-murid" element={
                      <TambahMurid 
                        onBack={() => navigate('/dashboard/kelola-data-murid')} 
                      />
                    } />
                    <Route path="/kelola-data-murid" element={
                      <ManajemenMuridNew onAddMurid={(kelasId) => {
                        if (kelasId) {
                          // Store kelas ID for persistence
                          sessionStorage.setItem('selectedKelasId', kelasId);
                          navigate('/dashboard/tambah-murid', { state: { selectedKelasId: kelasId } });
                        } else {
                          navigate('/dashboard/tambah-murid');
                        }
                      }} />
                    } />
                    <Route path="/spmb-pembukaan" element={<PembukaanSpmb />} />
                    <Route path="/spmb-pendaftar" element={<DataPendaftarSpmb />} />
                    <Route path="/spmb-diterima" element={<DataDiterimaSpmb />} />
                    <Route path="/guru-mapel" element={<KelolaGuruMapel />} />
                    <Route path="/mapel" element={<ManajemenMapel />} />
                    <Route path="/jadwal" element={<ManajemenJadwal />} />
                    <Route path="/tahun-ajaran" element={<ManajemenTahunAjaran />} />
                    <Route path="/ekstrakulikuler" element={<ManajemenEkstrakulikuler />} />
                    <Route path="/monitoring-kelas" element={<MonitoringKelas />} />
                    <Route path="/absen-guru" element={<AbsenGuru />} />
                    <Route path="/qr-admin" element={<QRAdmin />} />
                    <Route path="/izin-guru-admin" element={<IzinGuruAdmin />} />
                    <Route path="/pengaturan" element={<PengaturanAbsen />} />
                    <Route path="/data-alat-rfid" element={<ManajemenAlatRFID />} />
                    <Route path="/beri-info" element={<BeriInfo />} />
                    <Route path="/pengumuman-kelulusan" element={<PengumumanKelulusan />} />
                    <Route path="/raport-murid-admin" element={<RekapRaportMurid />} />
                    <Route path="/alumni-sekolah" element={<AlumniSekolah />} />
                    <Route path="/cbt-monitoring" element={<AdminMonitoringCBT />} />
                    <Route path="/cbt-bank-soal-admin" element={<AdminBankSoalCBT />} />
                    {systemType === 'sekolah_umum_tahfiz' && (
                      <>
                        <Route path="/data-kelas-tahfiz" element={<DataKelasTahfiz />} />
                        <Route path="/data-kelas-tahfiz/:id" element={<DetailKelasTahfiz />} />
                        <Route path="/data-jadwal-tahfiz" element={<DataJadwalTahfiz />} />
                        <Route path="/data-ustadz" element={<DataUstadz />} />
                        <Route path="/data-santri" element={<DataSantri />} />
                      </>
                    )}
                  </>
                )}
              </>
            )}
            
            {user?.role === 'guru' && (
              <>
                <Route path="/" element={<GuruDashboard />} />
                {systemType === 'tahfiz' ? (
                  <>
                    <Route path="/absen-saya" element={<AbsenGuruComponent />} />
                    <Route path="/izin-guru" element={<IzinGuruComponent />} />
                    <Route path="/absen-siswa" element={<AbsenSiswa />} />
                    <Route path="/data-santri-tahfiz-guru" element={<DataSantriTahfizGuru />} />
                    <Route path="/data-santri-tahfiz-guru/:id" element={<DetailSantriTahfizGuru />} />
                    <Route path="/jadwal-tahfiz-guru" element={<JadwalTahfizGuru />} />
                    <Route path="/absensi-tahfiz" element={<AbsensiTahfiz />} />
                    <Route path="/riwayat-absensi-tahfiz" element={<RiwayatAbsensiTahfiz />} />
                    <Route path="/izin-santri-tahfiz" element={<IzinSantriTahfiz />} />
                    <Route path="/progress-tahfiz" element={<ProgressTahfiz />} />
                    <Route path="/progress-tahfiz/:santriId" element={<DetailProgressTahfiz />} />
                    <Route path="/progress-tahfiz/:santriId/tes-hapalan" element={<TesHapalan />} />
                    <Route path="/progress-tahfiz/:santriId/detail-hafalan" element={<DetailHafalan />} />
                    <Route path="/profil" element={<ProfilGuru />} />
                  </>
                ) : (
                  <>
                    <Route path="/jadwal-saya" element={<JadwalGuru />} />
                    <Route path="/absensi" element={<KelolaAbsensi />} />
                    <Route path="/input-nilai" element={<InputNilai />} />
                    <Route path="/cbt-bank-soal" element={<BankSoalCBT />} />
                    <Route path="/cbt-buat-ujian" element={<BuatUjianCBT />} />
                    <Route path="/capaian-pembelajaran" element={<CapaianPembelajaran />} />
                    <Route path="/riwayat-absensi" element={<RiwayatAbsensi />} />
                    <Route path="/absen-kelas" element={<AbsenKelas />} />
                    <Route path="/absen-saya" element={<AbsenGuruComponent />} />
                    <Route path="/absen-siswa" element={<AbsenSiswa />} />
                    <Route path="/absen-guru" element={<AbsenGuruComponent />} />
                    <Route path="/data-murid-kelas" element={<DataMuridKelas />} />
                    <Route path="/murid-kelas" element={<AbsenPelajaran />} />
                    <Route path="/nilai-kelas" element={<NilaiKelas />} />
                    <Route path="/nilai-ekstrakulikuler-kelas" element={<NilaiEkstrakulikulerKelas />} />
                    <Route path="/nilai-ekstrakulikuler-murid/:muridId" element={<DetailNilaiEkstrakulikulerMurid />} />
                    <Route path="/kokulikuler" element={<KokulikulerKelas />} />
                    <Route path="/surat-izin" element={<SuratIzinGuru />} />
                    <Route path="/jadwal-kelas" element={<JadwalKelas />} />
                    <Route path="/izin-guru" element={<IzinGuruComponent />} />
                    <Route path="/pengganti" element={<PenggantiAbsensi />} />
                    <Route path="/profil" element={<ProfilGuru />} />
                    <Route path="/raport-murid" element={<RaportMurid />} />
                    <Route path="/e-raport" element={<ERaport />} />
                    <Route path="/info-kelulusan" element={<InfoKelulusan />} />
                    <Route path="/riwayat-wali-kelas" element={<RiwayatWaliKelas />} />
                    <Route path="/riwayat-kelulusan" element={<RiwayatKelulusan />} />
                    {systemType === 'sekolah_umum_tahfiz' && (
                      <>
                        <Route path="/data-santri-tahfiz-guru" element={<DataSantriTahfizGuru />} />
                        <Route path="/data-santri-tahfiz-guru/:id" element={<DetailSantriTahfizGuru />} />
                        <Route path="/jadwal-tahfiz-guru" element={<JadwalTahfizGuru />} />
                        <Route path="/absensi-tahfiz" element={<AbsensiTahfiz />} />
                        <Route path="/riwayat-absensi-tahfiz" element={<RiwayatAbsensiTahfiz />} />
                        <Route path="/izin-santri-tahfiz" element={<IzinSantriTahfiz />} />
                        <Route path="/progress-tahfiz" element={<ProgressTahfiz />} />
                        <Route path="/progress-tahfiz/:santriId" element={<DetailProgressTahfiz />} />
                        <Route path="/progress-tahfiz/:santriId/tes-hapalan" element={<TesHapalan />} />
                        <Route path="/progress-tahfiz/:santriId/detail-hafalan" element={<DetailHafalan />} />
                      </>
                    )}
                  </>
                )}
              </>
            )}
            
            {user?.role === 'murid' && (
              <>
                <Route path="/" element={<MuridDashboard />} />
                {systemType === 'tahfiz' ? (
                  <>
                    <Route path="/qr-code" element={<QRCodeMurid />} />
                    <Route path="/jadwal-tahfiz-murid" element={<JadwalTahfizMurid />} />
                    <Route path="/absensi-santri-tahfiz" element={<AbsensiSantriTahfiz />} />
                    <Route path="/absen-kehadiran" element={<AbsenKehadiran />} />
                    <Route path="/progress-hapalan-murid" element={<ProgressHapalanMurid />} />
                    <Route path="/surat-izin" element={<SuratIzinMurid />} />
                    <Route path="/profil" element={<ProfilMurid />} />
                  </>
                ) : (
                  <>
                    <Route path="/jadwal" element={<JadwalMurid />} />
                    <Route path="/mata-pelajaran" element={<MataPelajaranMurid />} />
                    <Route path="/absensi-saya" element={<AbsensiMurid />} />
                    <Route path="/absen-kehadiran" element={<AbsenKehadiran />} />
                    <Route path="/qr-code" element={<QRCodeMurid />} />
                    <Route path="/nilai-saya" element={<NilaiMurid />} />
                    <Route path="/cbt-ujian" element={<UjianCBTMurid />} />
                    <Route path="/cbt-ujian/:ujianId" element={<KerjakanUjianCBT />} />
                    <Route path="/raport-saya" element={<MuridRaportMurid />} />
                    <Route path="/e-raport-saya" element={<ERaportMurid />} />
                    <Route path="/surat-izin" element={<SuratIzinMurid />} />
                    <Route path="/info-kelulusan-murid" element={<InfoKelulusanMurid />} />
                    {systemType === 'sekolah_umum_tahfiz' && (
                      <>
                        <Route path="/jadwal-tahfiz-murid" element={<JadwalTahfizMurid />} />
                        <Route path="/absensi-santri-tahfiz" element={<AbsensiSantriTahfiz />} />
                        <Route path="/progress-hapalan-murid" element={<ProgressHapalanMurid />} />
                      </>
                    )}
                    <Route path="/profil" element={<ProfilMurid />} />
                  </>
                )}
              </>
            )}
            
            {/* Fallback route */}
            <Route path="*" element={
              user?.role === 'admin' ? <AdminDashboard /> :
              user?.role === 'kepala_sekolah' ? <KepalaSekolahDashboard /> :
              user?.role === 'guru' ? <GuruDashboard /> :
              user?.role === 'murid' ? <MuridDashboard /> :
              <div>Role tidak dikenali</div>
            } />
          </Routes>
        </main>
        {(!isMobileView || location.pathname.endsWith('/profil')) && <Footer />}
      </div>

      {user?.role === 'murid' && isMuridMobile && <MuridBottomNavigation />}
      {user?.role === 'guru' && isGuruMobile && <GuruBottomNavigation />}
    </div>
  );
};

export default Dashboard;