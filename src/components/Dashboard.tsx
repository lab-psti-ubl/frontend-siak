import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';

// Pages
import AdminDashboard from './admin/AdminDashboard';
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

import GuruDashboard from './guru/GuruDashboard';
import JadwalGuru from './guru/pages/mengajar/JadwalGuru';
import KelolaAbsensi from './guru/pages/mengajar/KelolaAbsensi';
import RiwayatAbsensi from './guru/pages/mengajar/RiwayatAbsensi';
import SuratIzinGuru from './guru/pages/walikelas/SuratIzinGuru';
import ProfilGuru from './guru/ProfilGuru';
import AbsenKelas from './guru/pages/walikelas/AbsenKelas';
import AbsenGuruComponent from './guru/AbsenGuru';
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
import InfoKelulusanMurid from './murid/InfoKelulusanMurid';
import RiwayatKelulusan from './guru/RiwayatKelulusan';

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
import MuridBottomNavigation from './murid/MuridBottomNavigation';
import GuruBottomNavigation from './guru/GuruBottomNavigation';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
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
    return path === 'dashboard' ? 'dashboard' : path;
  };

  const currentPage = getCurrentPage();

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
      'qr-admin': 'QR Admin',
      'pengaturan': 'Pengaturan Absen',
      'data-alat-rfid': 'Data Alat RFID',
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
      'raport-murid': 'Raport Murid',
      'riwayat-wali-kelas': 'Riwayat Walikelas',
      'raport-murid-admin': 'Raport Murid',
      'beri-info': 'Beri Info',
      'pengumuman-kelulusan': 'Pengumuman Kelulusan',
      'alumni-sekolah': 'Alumni Sekolah',
      'info-kelulusan': 'Info Kelulusan',
      'info-kelulusan-murid': 'Info Kelulusan',
      'pengganti': 'Pengganti',
    };
    return titles[currentPage] || 'Dashboard';
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

      <div className={`flex-1 flex flex-col pt-16 md:pt-0 ${
        user?.role === 'murid' ? (isMuridMobile ? '' : 'lg:ml-80') :
        user?.role === 'guru' ? (isGuruMobile ? '' : 'lg:ml-80') :
        'lg:ml-80'
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
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/guru" element={<ManajemenGuru />} />
                <Route path="/jurusan" element={<ManajemenJurusan />} />
                <Route path="/kelas" element={<ManajemenKelas />} />
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
              </>
            )}
            
            {user?.role === 'guru' && (
              <>
                <Route path="/" element={<GuruDashboard />} />
                <Route path="/jadwal-saya" element={<JadwalGuru />} />
                <Route path="/absensi" element={<KelolaAbsensi />} />
                <Route path="/input-nilai" element={<InputNilai />} />
                <Route path="/capaian-pembelajaran" element={<CapaianPembelajaran />} />
                <Route path="/riwayat-absensi" element={<RiwayatAbsensi />} />
                <Route path="/absen-kelas" element={<AbsenKelas />} />
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
              </>
            )}
            
            {user?.role === 'murid' && (
              <>
                <Route path="/" element={<MuridDashboard />} />
                <Route path="/jadwal" element={<JadwalMurid />} />
                <Route path="/mata-pelajaran" element={<MataPelajaranMurid />} />
                <Route path="/absensi-saya" element={<AbsensiMurid />} />
                <Route path="/absen-kehadiran" element={<AbsenKehadiran />} />
                <Route path="/qr-code" element={<QRCodeMurid />} />
                <Route path="/nilai-saya" element={<NilaiMurid />} />
                <Route path="/raport-saya" element={<MuridRaportMurid />} />
                <Route path="/e-raport-saya" element={<ERaportMurid />} />
                <Route path="/surat-izin" element={<SuratIzinMurid />} />
                <Route path="/info-kelulusan-murid" element={<InfoKelulusanMurid />} />
                <Route path="/profil" element={<ProfilMurid />} />
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
      </div>

      {user?.role === 'murid' && isMuridMobile && <MuridBottomNavigation />}
      {user?.role === 'guru' && isGuruMobile && <GuruBottomNavigation />}
    </div>
  );
};

export default Dashboard;