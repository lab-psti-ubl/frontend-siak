import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QRScannerProvider } from './context/QRScannerContext';
import { OnboardingTourProvider } from './context/OnboardingTourContext';
import { LanguageProvider } from './context/LanguageContext';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import ToastContainer from './components/ui/ToastContainer';
import ConfirmationContainer from './components/ui/ConfirmationContainer';
import RFIDMonitoringPage from './pages/RFIDMonitoringPage';
import AktivasiIscholaPage from './pages/AktivasiIscholaPage';
import VerificationPage from './components/shared/VerificationPage';
import VerificationDocumentContent from './components/shared/VerificationDocumentContent';
import JenjangPendidikanSetupModal from './components/admin/JenjangPendidikanSetupModal';
import SystemTypeSetupModal from './components/admin/SystemTypeSetupModal';
import ServerUnavailablePage from './components/ServerUnavailablePage';
import { initializeData, initializeMinimalData, initializeAdminUser } from './utils/seedData';
import { isAppFreshLoad, setupAppCleanup, resetToSeedData } from './utils/dataReset';
import { migrateAbsensiData, shouldMigrateAbsensiData } from './utils/migrateAbsensiData';
import { globalAbsenService } from './services/globalAbsenService';
import { Absensi, SesiAbsensi, JadwalPelajaran, TahunAjaran, User, RiwayatKelasMurid } from './types';
import { DocumentType } from './utils/verificationPageUtils';
import ScrollToTop from "./components/ui/ScrollToTop";
import { getActiveJenjang } from './utils/jenjangPendidikanUtils';
import { initializeSystemActivation } from './utils/systemActivationUtils';
import { apiService } from './services/apiService';
import { prewarmPengaturanCache } from './hooks/usePengaturanSistem';
import InstallPWAButton from './components/pwa/InstallPWAButton';
import SpmbRegistrationPage from './pages/SpmbRegistrationPage';
import SpmbLoginPage from './pages/SpmbLoginPage';
import SpmbRegisterPage from './pages/SpmbRegisterPage';
import SpmbDashboardLayout from './pages/spmb/SpmbDashboardLayout';
import UjianCBTAksesPage from './pages/UjianCBTAksesPage';
import KerjakanUjianCBT from './components/murid/pages/cbt/KerjakanUjianCBT';
import InformasiSpmbPage from './pages/InformasiSpmbPage';
import ProfileSekolahPage from './pages/ProfileSekolahPage';
import BerandaProfileSekolah from './pages/profile-sekolah/BerandaProfileSekolah';
import TentangKamiProfileSekolah from './pages/profile-sekolah/TentangKamiProfileSekolah';
import BeritaListPage from './pages/profile-sekolah/BeritaListPage';
import BeritaDetailPage from './pages/profile-sekolah/BeritaDetailPage';
import PrestasiListPage from './pages/profile-sekolah/PrestasiListPage';
import PrestasiDetailPage from './pages/profile-sekolah/PrestasiDetailPage';


const VerificationPageRoute: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [documentData, setDocumentData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [kelas, setKelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const suratId = searchParams.get('verification') || '';
  const message = searchParams.get('message') || 'Telah ditanda tangani oleh sistem secara digital dan dinyatakan sah';
  const documentType = (searchParams.get('documentType') || 'surat_izin_izin') as DocumentType;

  useEffect(() => {
    const fetchData = async () => {
      if (!suratId) {
        setError('ID dokumen tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch document based on type
        let docData: any = null;
        const isGuruIzinId = suratId.startsWith('izin-guru-');
        const isSuratIzinId = suratId.startsWith('surat-izin-');
        
        if (documentType === 'raport') {
          // For laporan hasil belajar, suratId is actually NISN
          try {
            const raportResponse = await apiService.getRaportVerification(suratId);
            if (raportResponse.success && raportResponse.data) {
              // Store laporan hasil belajar data for generation
              docData = {
                type: 'raport',
                studentId: raportResponse.studentId,
                semester: raportResponse.semester,
                tahunAjaran: raportResponse.tahunAjaran,
                rawData: raportResponse.data
              };
            } else {
              throw new Error(raportResponse.message || 'Data laporan hasil belajar tidak ditemukan');
            }
          } catch (err: any) {
            throw new Error(err.message || 'Gagal memuat data laporan hasil belajar');
          }
        } else {
          // Non-raport: determine probable document source based on ID pattern
          // - ID diawali "surat-izin-" => prioritas ke Surat Izin (murid)
          // - ID diawali "izin-guru-" => prioritas ke Izin Guru
          // - Selain itu: fallback ke urutan lama (Surat Izin lalu Izin Guru)

          const tryFetchSuratIzin = async () => {
            try {
              const suratResponse = await apiService.getSuratIzinVerification(suratId);
              if (suratResponse.success && suratResponse.suratIzin) {
                docData = suratResponse.suratIzin;
              }
            } catch {
              // ignore, will try izin guru
            }
          };

          const tryFetchIzinGuru = async () => {
            try {
              const izinResponse = await apiService.getIzinGuruVerification(suratId);
              if (izinResponse.success && izinResponse.izinGuru) {
                docData = izinResponse.izinGuru;
              }
            } catch {
              // ignore, final error handled below
            }
          };

          if (isGuruIzinId) {
            // Untuk ID izin-guru: coba Izin Guru dulu, baru fallback ke Surat Izin
            await tryFetchIzinGuru();
            if (!docData) {
              await tryFetchSuratIzin();
            }
          } else {
            // Default / ID surat-izin: coba Surat Izin dulu, lalu Izin Guru
            await tryFetchSuratIzin();
            if (!docData) {
              await tryFetchIzinGuru();
            }
          }

          if (!docData) {
            throw new Error('Dokumen tidak ditemukan');
          }
        }

        setDocumentData(docData);

        // Fetch users and kelas for document rendering (optional - may fail without auth)
        // These are needed for proper document rendering but verification will still work without them
        try {
          // Fetch both gurus and murids to get all users
          const [gurusResponse, muridsResponse] = await Promise.allSettled([
            apiService.getAllGurus(),
            apiService.getAllMurid()
          ]);
          
          const allUsers: any[] = [];
          
          if (gurusResponse.status === 'fulfilled' && gurusResponse.value.success && gurusResponse.value.gurus) {
            allUsers.push(...gurusResponse.value.gurus);
          }
          
          if (muridsResponse.status === 'fulfilled' && muridsResponse.value.success && muridsResponse.value.murid) {
            allUsers.push(...muridsResponse.value.murid);
          }
          
          if (allUsers.length > 0) {
            setUsers(allUsers);
          }
        } catch (err) {
          console.warn('Could not fetch users (may require auth):', err);
          // Continue without users - document will render with limited info
        }

        try {
          const kelasResponse = await apiService.getAllKelas();
          if (kelasResponse.success && kelasResponse.kelas) {
            setKelas(kelasResponse.kelas);
          }
        } catch (err) {
          console.warn('Could not fetch kelas (may require auth):', err);
          // Continue without kelas - document will render with limited info
        }
      } catch (err: any) {
        console.error('Error fetching document:', err);
        setError(err.message || 'Gagal memuat dokumen');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [suratId, documentType]);

  // Extract user info from document data
  const getUserInfo = () => {
    if (!documentData) return {};

    if (documentType === 'raport' && documentData.type === 'raport') {
      // For raport, get info from raw data
      const student = documentData.rawData?.users?.find((u: any) => u.id === documentData.studentId);
      const kelasData = student?.kelasId 
        ? documentData.rawData?.kelas?.find((k: any) => k.id === student.kelasId)
        : null;
      
      return {
        userName: student?.name,
        userNISN: student?.nisn,
        userKelas: kelasData?.name,
        signatureTitle: 'Kepala Sekolah'
      };
    } else if (documentType === 'surat_izin_cuti' || 'guruId' in documentData) {
      // Izin guru (cuti atau jenis izin guru lainnya)
      const izin = documentData as any;
      // Use data from backend response if available, otherwise fallback to users
      const guru = izin.guru || users.find(u => u.id === izin.guruId);
      
      return {
        userName: guru?.name,
        userNIP: guru?.nip,
        signatureTitle: 'Admin Sekolah'
      };
    } else if (documentType.startsWith('surat_izin_')) {
      // Surat izin murid (izin, sakit, dispen)
      const surat = documentData as any;
      // Use data from backend response if available, otherwise fallback to users/kelas
      const murid = surat.murid || users.find(u => u.id === surat.muridId);
      const kelasData = surat.kelas || (murid?.kelasId ? kelas.find(k => k.id === murid.kelasId) : null);
      
      return {
        userName: murid?.name,
        userNISN: murid?.nisn,
        userKelas: kelasData?.name,
        signatureTitle: 'Wali Kelas'
      };
    }

    return {};
  };

  const userInfo = getUserInfo();

  // Determine language for proper day name on verification page
  let language: 'id' | 'ms' = 'id';
  const langFromQuery = (searchParams.get('lang') || '').toLowerCase();
  if (langFromQuery === 'ms' || langFromQuery === 'id') {
    language = langFromQuery as 'id' | 'ms';
  } else {
    try {
      const storedLanguage = (localStorage.getItem('language') || '').toLowerCase();
      if (storedLanguage === 'ms' || storedLanguage === 'id') {
        language = storedLanguage as 'id' | 'ms';
      }
    } catch {
      // ignore and keep default
    }
  }

  const locale = language === 'ms' ? 'ms-MY' : 'id-ID';

  const timestamp = documentData?.verifiedAt 
    ? new Date(documentData.verifiedAt).toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : new Date().toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

  return (
    <VerificationPage
      suratId={suratId}
      message={message}
      documentType={documentType}
      userName={userInfo.userName}
      userNIP={userInfo.userNIP}
      userNISN={userInfo.userNISN}
      userKelas={userInfo.userKelas}
      signatureTitle={userInfo.signatureTitle}
      timestamp={timestamp}
      documentContent={
        <VerificationDocumentContent
          documentType={documentType}
          documentData={documentData}
          users={users}
          kelas={kelas}
          loading={loading}
          error={error}
        />
      }
    />
  );
};

/** Deteksi apakah error disebabkan oleh server/koneksi tidak tersedia (bukan karena sistem belum di-set). */
function isServerConnectionError(error: unknown): boolean {
  const anyError = error as any;

  // HTTP 5xx dari backend dianggap sebagai masalah server
  if (typeof anyError?.status === 'number') {
    const status = anyError.status;
    if (status >= 500 && status <= 599) {
      return true;
    }
  }

  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  return (
    // Error jaringan/browser umum
    lower.includes('failed to fetch') ||
    lower.includes('network request failed') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('connection refused') ||
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('err_connection') ||
    lower.includes('err_connection_refused') ||
    lower.includes('err_connection_reset') ||
    lower.includes('timeout') ||
    lower.includes('etimedout') ||
    // Pesan yang biasanya muncul ketika server 500 pada endpoint penting
    lower.includes('internal server error') ||
    lower.includes('terjadi kesalahan saat menginisialisasi aktivasi sistem') ||
    lower.includes('gagal mengambil pengaturan bahasa') ||
    lower.includes('gagal mengambil tipe sistem')
  );
}

const AppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSystemTypeSetup, setShowSystemTypeSetup] = useState(false);
  const [serverUnavailable, setServerUnavailable] = useState(false);
  const [showJenjangSetup, setShowJenjangSetup] = useState(false);
  const [jenjangInitialized, setJenjangInitialized] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize system activation status
        await initializeSystemActivation();

        // Always ensure admin user exists on app start
        initializeAdminUser();

        const { apiService } = await import('./services/apiService');
        const systemTypeResponse = await apiService.getSystemType();
        
        if (!systemTypeResponse.success || !systemTypeResponse.systemType) {
          setShowSystemTypeSetup(true);
          setInitialLoading(false);
          return;
        }

        const systemType = systemTypeResponse.systemType;

        // Pre-populate global cache so Dashboard/Sidebar render
        // the correct menu items immediately without flash.
        prewarmPengaturanCache(systemType);

        // Check if jenjang has been selected
        const activeJenjang = await getActiveJenjang();

        // For tahfiz system, jenjang is not required
        if (systemType === 'tahfiz') {
          setJenjangInitialized(true);
          setInitialLoading(false);
          return;
        }

        // For non-tahfiz systems, jenjang is required
        if (!activeJenjang) {
          // Show jenjang setup modal
          setShowJenjangSetup(true);
          setInitialLoading(false);
          return;
        }

        if (isAppFreshLoad()) {
          resetToSeedData();

          // Initialize data based on jenjang
          if (activeJenjang === 'SMA/SMK') {
            // Full seed data for SMA/SMK
            initializeData();
          } else if (activeJenjang === 'SD' || activeJenjang === 'SMP') {
            // Minimal data for SD/SMP (only admin and basic settings)
            initializeMinimalData();
          }
        }

        setJenjangInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        if (isServerConnectionError(error)) {
          setServerUnavailable(true);
        } else {
          setShowSystemTypeSetup(true);
        }
      } finally {
        setInitialLoading(false);
      }
    };

    initializeApp();

    try {
      const absensi: Absensi[] = JSON.parse(localStorage.getItem('absensi') || '[]');
      const sesiAbsensi: SesiAbsensi[] = JSON.parse(localStorage.getItem('sesiAbsensi') || '[]');

      if (shouldMigrateAbsensiData(absensi, sesiAbsensi)) {
        const jadwalPelajaran: JadwalPelajaran[] = JSON.parse(localStorage.getItem('jadwalPelajaran') || '[]');
        const tahunAjaran: TahunAjaran[] = JSON.parse(localStorage.getItem('tahunAjaran') || '[]');
        const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
        const existingRiwayat: RiwayatKelasMurid[] = JSON.parse(localStorage.getItem('riwayatKelasMurid') || '[]');

        const { updatedAbsensi, updatedSesiAbsensi, riwayatKelasMurid } = migrateAbsensiData(
          absensi,
          sesiAbsensi,
          jadwalPelajaran,
          tahunAjaran,
          users
        );

        localStorage.setItem('absensi', JSON.stringify(updatedAbsensi));
        localStorage.setItem('sesiAbsensi', JSON.stringify(updatedSesiAbsensi));

        const mergedRiwayat = [...existingRiwayat];
        riwayatKelasMurid.forEach(newRiwayat => {
          const exists = mergedRiwayat.find(
            r => r.muridId === newRiwayat.muridId &&
                 r.kelasId === newRiwayat.kelasId &&
                 r.tahunAjaran === newRiwayat.tahunAjaran &&
                 r.semester === newRiwayat.semester
          );
          if (!exists) {
            mergedRiwayat.push(newRiwayat);
          }
        });
        localStorage.setItem('riwayatKelasMurid', JSON.stringify(mergedRiwayat));

        console.log('Data absensi berhasil dimigrasikan');
      }
    } catch (error) {
      console.error('Error migrasi data:', error);
    }

    globalAbsenService.start();

    const cleanup = setupAppCleanup();
    return () => {
      cleanup();
      globalAbsenService.stop();
    };
  }, []);

  const handleSystemTypeSelected = async (systemType: 'sekolah_umum' | 'sekolah_umum_tahfiz' | 'tahfiz') => {
    setShowSystemTypeSetup(false);
    
    // Clear all caches and logout user after system type is selected
    // This ensures fresh start after system type selection
    const { clearAllCaches } = await import('./utils/clearAllCaches');
    const { clearPengaturanCache } = await import('./hooks/usePengaturanSistem');
    
    // Clear all caches
    clearAllCaches();
    clearPengaturanCache();
    
    // Logout user if logged in (clears user state, token, localStorage)
    logout();
    
    // Clear localStorage flags
    localStorage.removeItem('systemTypeWasSet');
    
    // Reload the app to start fresh
    window.location.href = '/';
  };

  const handleJenjangSelected = async (jenjang: 'SD' | 'SMP' | 'SMA/SMK') => {
    setShowJenjangSetup(false);

    // Initialize data based on selected jenjang
    if (jenjang === 'SMA/SMK') {
      initializeData();
    } else {
      initializeMinimalData();
    }

    setJenjangInitialized(true);

    // Redirect to login page after jenjang is selected
    // Use navigate instead of window.location to avoid reload
    navigate('/login', { replace: true });
  };

  if (serverUnavailable) {
    return <ServerUnavailablePage />;
  }

  if (showSystemTypeSetup) {
    return <SystemTypeSetupModal onSystemTypeSelected={handleSystemTypeSelected} />;
  }

  if (showJenjangSetup) {
    return <JenjangPendidikanSetupModal onJenjangSelected={handleJenjangSelected} />;
  }

  // Only show loading screen during initial app load, not during login process
  // This ensures login form stays visible during login attempt
  if (initialLoading || !jenjangInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
      <Routes>
        <Route path="/login" element={!user ? <LoginForm /> : <Navigate to="/dashboard" replace />} />
        <Route path="/aktivasi-ischola" element={<AktivasiIscholaPage />} />
        <Route path="/rfid-monitoring" element={<RFIDMonitoringPage />} />
        <Route path="/ujian-cbt" element={<UjianCBTAksesPage />} />
        <Route path="/ujian-cbt/:nisnMurid" element={<UjianCBTAksesPage />} />
        <Route path="/ujian-cbt/:nisnMurid/kerjakan/:ujianId" element={<KerjakanUjianCBT />} />
        <Route path="/verification" element={<VerificationPageRoute />} />
        <Route path="/informasi-spmb" element={<InformasiSpmbPage />} />
        <Route path="/profile-sekolah" element={<ProfileSekolahPage />}>
          <Route index element={<BerandaProfileSekolah />} />
          <Route path="tentang" element={<TentangKamiProfileSekolah />} />
          <Route path="berita" element={<BeritaListPage />} />
          <Route path="berita/:id" element={<BeritaDetailPage />} />
          <Route path="prestasi" element={<PrestasiListPage />} />
          <Route path="prestasi/:id" element={<PrestasiDetailPage />} />
          <Route path="*" element={<Navigate to="/profile-sekolah" replace />} />
        </Route>
        {/* Portal peserta SPMB terpisah dari login utama */}
        <Route path="/spmb" element={<SpmbLoginPage />} />
        <Route path="/spmb/register" element={<SpmbRegisterPage />} />
        <Route path="/spmb/dashboard/*" element={<SpmbDashboardLayout />} />
        <Route
          path="/dashboard/*"
          element={
            user ? (
              <OnboardingTourProvider enabled={user.role === 'admin'}>
                <Dashboard />
              </OnboardingTourProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/profile-sekolah"} replace />} />
      </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <QRScannerProvider>
            <ScrollToTop />
            <AppContent />
            <ToastContainer />
            <ConfirmationContainer />
            <InstallPWAButton />
          </QRScannerProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;