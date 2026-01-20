import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, ClipboardList, FileText, CheckCircle, AlertCircle, TrendingUp, BookOpen, ArrowRight, School, UserCheck, Settings, QrCode, Eye } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { User, JadwalPelajaran, SesiAbsensi, IzinGuru, SuratIzin, AbsensiGuru } from '../../types';
import GSTActivationModal from './GSTActivationModal';
import { isSystemActive } from '../../utils/systemActivationUtils';
import { apiService } from '../../services/apiService';
import { useGurus } from '../../hooks/useGurus';
import { useMurid } from '../../hooks/useMurid';
import { useKelas } from '../../hooks/useKelas';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { usePengaturanAbsen } from '../../hooks/usePengaturanAbsen';
import { useAlumni } from '../../hooks/useAlumni';
import { useOnboardingTourContext } from '../../context/OnboardingTourContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePengaturanSistem } from '../../hooks/usePengaturanSistem';
import { getTeacherTerm, getStudentTerm } from '../../utils/terminologyUtils';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { systemType } = usePengaturanSistem();
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { tahunAjaran, activeTahunAjaran: activeTahunAjaranFromHook } = useTahunAjaran();
  const { pengaturanAbsen, activePengaturanAbsen: activePengaturanAbsenFromHook } = usePengaturanAbsen();
  const { alumni } = useAlumni();
  
  const isTahfiz = systemType === 'tahfiz';
  const teacherTerm = getTeacherTerm(systemType);
  const studentTerm = getStudentTerm(systemType);
  
  const [users, setUsers] = useState<User[]>([]);
  const [jadwal, setJadwal] = useState<JadwalPelajaran[]>([]);
  const [sesiAbsensi, setSesiAbsensi] = useState<SesiAbsensi[]>([]);
  const [izinGuru, setIzinGuru] = useState<IzinGuru[]>([]);
  const [suratIzin, setSuratIzin] = useState<SuratIzin[]>([]);
  const [absensiGuru, setAbsensiGuru] = useState<AbsensiGuru[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGSTModal, setShowGSTModal] = useState(false);
  const [isCheckingActivation, setIsCheckingActivation] = useState(true);
  
  // Onboarding tour context (modal is handled by provider)
  const { currentStep } = useOnboardingTourContext();

  useEffect(() => {
    const checkActivation = async () => {
      setIsCheckingActivation(true);
      try {
        const active = await isSystemActive();
        if (!active) {
          setShowGSTModal(true);
        } else {
          setShowGSTModal(false);
        }
      } catch (error) {
        console.error('Error checking system activation:', error);
        // On error, show modal to be safe
        setShowGSTModal(true);
      } finally {
        setIsCheckingActivation(false);
      }
    };

    checkActivation();
  }, []);


  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        const [
          jadwalResponse,
          sesiAbsensiResponse,
          izinGuruResponse,
          suratIzinResponse,
          absensiGuruResponse,
        ] = await Promise.all([
          apiService.getAllJadwalPelajaran(),
          apiService.getAllSesiAbsensi(),
          apiService.getAllIzinGuru(),
          apiService.getAllSuratIzin(),
          apiService.getAbsensiGuruByTanggal(today),
        ]);

        if (jadwalResponse.success && jadwalResponse.jadwalPelajaran) {
          setJadwal(jadwalResponse.jadwalPelajaran);
        }
        if (sesiAbsensiResponse.success && sesiAbsensiResponse.sesiAbsensi) {
          setSesiAbsensi(sesiAbsensiResponse.sesiAbsensi);
        }
        if (izinGuruResponse.success && izinGuruResponse.izinGuru) {
          setIzinGuru(izinGuruResponse.izinGuru);
        }
        if (suratIzinResponse.success && suratIzinResponse.suratIzin) {
          setSuratIzin(suratIzinResponse.suratIzin);
        }
        if (absensiGuruResponse.success && absensiGuruResponse.absensiGuru) {
          setAbsensiGuru(absensiGuruResponse.absensiGuru);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Combine gurus and murid into users array for compatibility
  useEffect(() => {
    setUsers([...gurus, ...murid]);
  }, [gurus, murid]);

  const activeTahunAjaran = activeTahunAjaranFromHook;
  const today = new Date().toISOString().split('T')[0];

  // Real data calculations
  const totalGuru = users.filter(u => u.role === 'guru').length;
  
  // Filter murid yang bukan alumni dan aktif
  const alumniMuridIds = new Set(alumni.map(a => a.muridId));
  const totalMurid = users.filter(u => 
    u.role === 'murid' && 
    !alumniMuridIds.has(u.id) &&
    u.isActive !== false
  ).length;
  
  const totalKelas = kelas.length;
  const todaySessions = sesiAbsensi.filter(s => s.tanggal === today);
  const activeSessions = todaySessions.filter(s => s.status === 'dibuka');

  const pendingIzinGuru = izinGuru.filter(i => i.status === 'menunggu');
  const pendingSuratIzin = suratIzin.filter(s => s.status === 'menunggu');
  const activePengaturan = activePengaturanAbsenFromHook;

  // Calculate attendance rate for today
  const todayAbsensiGuru = absensiGuru.filter(a => a.tanggal === today);
  const gurusWithScheduleToday = users.filter(u => {
    if (u.role !== 'guru') return false;
    const currentDay = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();
    return jadwal.some(j => 
      j.guruId === u.id && 
      j.hari === currentDay &&
      j.tahunAjaran === activeTahunAjaran?.tahun &&
      j.semester === activeTahunAjaran?.semester
    );
  });
  
  const attendanceRate = gurusWithScheduleToday.length > 0 ? 
    ((todayAbsensiGuru.filter(a => a.jamMasuk).length / gurusWithScheduleToday.length) * 100).toFixed(1) : '0';

  const mainStats = [
    {
      title: isTahfiz ? `Jumlah ${teacherTerm === 'ustadz' ? 'Ustadz' : 'Guru'}` : t('dashboardKepalaSekolah.totalGuru'),
      value: totalGuru,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      onClick: () => navigate(isTahfiz ? '/dashboard/data-ustadz' : '/dashboard/guru')
    },
    {
      title: isTahfiz ? `Jumlah ${studentTerm === 'santri' ? 'Santri' : 'Murid'}` : t('dashboardKepalaSekolah.totalMurid'),
      value: totalMurid,
      icon: UserCheck,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      onClick: () => navigate(isTahfiz ? '/dashboard/data-santri' : '/dashboard/kelola-data-murid')
    },
    {
      title: isTahfiz ? 'Jumlah Kelas/Bilik' : t('dashboardKepalaSekolah.totalKelas'),
      value: totalKelas,
      icon: School,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      onClick: () => navigate(isTahfiz ? '/dashboard/data-kelas-tahfiz' : '/dashboard/kelas')
    },
    {
      title: 'Sesi Hari Ini',
      value: todaySessions.length,
      icon: ClipboardList,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      onClick: () => navigate(isTahfiz ? '/dashboard/data-jadwal-tahfiz' : '/dashboard/absen-guru')
    },
  ];

  const getGuruName = (guruId: string) => {
    return users.find(u => u.id === guruId)?.name || 'Unknown';
  };

  const getMuridName = (muridId: string) => {
    return users.find(u => u.id === muridId)?.name || 'Unknown';
  };

  // Generate real recent activities
  const generateRecentActivities = () => {
    const activities = [];

    // Add pending izin guru (only for non-tahfiz)
    if (!isTahfiz && pendingIzinGuru.length > 0) {
      activities.push({
        id: 'izin-guru-pending',
        title: `${pendingIzinGuru.length} ${t('common.language') === 'ms' ? 'permohonan izin' : 'pengajuan izin'} ${teacherTerm === 'ustadz' ? 'ustadz' : 'guru'} ${t('common.language') === 'ms' ? 'menunggu pengesahan' : 'menunggu verifikasi'}`,
        subtitle: pendingIzinGuru.slice(0, 2).map(i => getGuruName(i.guruId)).join(', '),
        time: t('common.language') === 'ms' ? 'Perlu ditinjau' : 'Perlu ditinjau',
        type: 'warning' as const,
        icon: FileText,
      });
    }

    // Add pending surat izin
    if (pendingSuratIzin.length > 0) {
      activities.push({
        id: 'surat-izin-pending',
        title: `${pendingSuratIzin.length} ${t('common.language') === 'ms' ? 'surat izin' : 'surat izin'} ${studentTerm === 'santri' ? 'santri' : 'murid'} ${t('common.language') === 'ms' ? 'menunggu pengesahan' : 'menunggu verifikasi'}`,
        subtitle: t('common.language') === 'ms' ? 'Perlu ditinjau wali kelas' : 'Perlu ditinjau wali kelas',
        time: t('common.language') === 'ms' ? 'Perlu ditinjau' : 'Perlu ditinjau',
        type: 'info' as const,
        icon: AlertCircle,
      });
    }

    // Add today's active sessions
    if (activeSessions.length > 0) {
      const latestSession = activeSessions[activeSessions.length - 1];
      const sessionJadwal = jadwal.find(j => j.id === latestSession.jadwalId);
      const sessionGuru = users.find(u => u.id === sessionJadwal?.guruId);
      const sessionKelas = kelas.find(k => k.id === sessionJadwal?.kelasId);
      
      activities.push({
        id: 'session-active',
        title: `Sesi absensi aktif`,
        subtitle: `${sessionKelas?.name} - ${sessionGuru?.name}`,
        time: `Dibuka ${latestSession.jamBuka}`,
        type: 'success' as const,
        icon: Clock,
      });
    }

    // Add recent guru attendance (only for non-tahfiz)
    if (!isTahfiz) {
      const recentGuruAbsen = todayAbsensiGuru
        .filter(a => a.jamMasuk)
        .sort((a, b) => (b.jamMasuk || '').localeCompare(a.jamMasuk || ''))
        .slice(0, 2);

      recentGuruAbsen.forEach(absen => {
        const guru = users.find(u => u.id === absen.guruId);
        if (guru) {
          activities.push({
            id: `guru-absen-${absen.id}`,
            title: `${guru.name} ${t('common.language') === 'ms' ? 'telah melakukan kehadiran masuk' : 'telah absen masuk'}`,
            subtitle: `${absen.jamMasuk} - ${absen.statusMasuk === 'tepat_waktu' ? (t('common.language') === 'ms' ? 'Tepat waktu' : 'Tepat waktu') : (t('common.language') === 'ms' ? 'Terlambat' : 'Terlambat')}`,
            time: t('common.language') === 'ms' ? 'Hari ini' : 'Hari ini',
            type: absen.statusMasuk === 'tepat_waktu' ? 'success' as const : 'warning' as const,
            icon: UserCheck,
          });
        }
      });
    }

    // Add system activities (only for non-tahfiz)
    if (!isTahfiz && activeTahunAjaran) {
      activities.push({
        id: 'tahun-ajaran-aktif',
        title: `${t('dashboardKepalaSekolah.tahunAjaran')} ${activeTahunAjaran.tahun} ${t('dashboardKepalaSekolah.aktif')}`,
        subtitle: `${t('dashboardKepalaSekolah.semester')} ${activeTahunAjaran.semester} (${activeTahunAjaran.semester === 1 ? t('dashboardKepalaSekolah.ganjil') : t('dashboardKepalaSekolah.genap')})`,
        time: t('common.language') === 'ms' ? 'Sistem' : 'Sistem',
        type: 'info' as const,
        icon: Calendar,
      });
    }

    return activities.slice(0, 5); // Limit to 5 activities
  };

  const recentActivities = generateRecentActivities();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isCheckingActivation || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isCheckingActivation ? 'Memeriksa status aktivasi...' : 'Memuat data dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showGSTModal && (
        <GSTActivationModal
          onActivationSuccess={() => {
            setShowGSTModal(false);
            // Refresh page to update all components
            window.location.reload();
          }}
          onLogout={handleLogout}
        />
      )}
      <div className={`space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-0 ${showGSTModal ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">{t('sidebar.dashboard') === 'Papan Pemuka' ? 'Selamat Datang, Admin!' : 'Selamat Datang, Admin!'}</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
              {new Date().toLocaleDateString(t('common.language') === 'ms' ? 'ms-MY' : 'id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            {!isTahfiz && activeTahunAjaran && (
              <p className="text-blue-200 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
                {t('dashboardKepalaSekolah.tahunAjaran')} {activeTahunAjaran.tahun} - {t('dashboardKepalaSekolah.semester')} {activeTahunAjaran.semester}
              </p>
            )}
          </div>
          <div className="hidden sm:block flex-shrink-0 ml-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <School className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} onClick={stat.onClick} className="h-full">
              <Card 
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full group"
              >
                <div className="p-2 sm:p-2 lg:p-2 h-full flex flex-col">
                  {/* Title with Icon */}
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${stat.textColor}`} />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 leading-tight line-clamp-2">{stat.title}</p>
                  </div>
                  
                  {/* Value */}
                  <div className="flex-1 flex items-end">
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">{stat.value}</p>
                  </div>
                </div>
                {/* Bottom Accent Bar */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}></div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Pending Approvals */}
        <Card className="border-0 shadow-lg">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <div className="w-2 h-5 sm:h-6 bg-orange-500 rounded-full mr-2 sm:mr-3"></div>
              <span className="text-sm sm:text-base lg:text-xl">{t('common.language') === 'ms' ? 'Menunggu Persetujuan' : 'Menunggu Persetujuan'}</span>
            </h3>
            
            {((!isTahfiz && pendingIzinGuru.length > 0) || pendingSuratIzin.length > 0) ? (
              <div className="space-y-3 sm:space-y-4">
                {!isTahfiz && pendingIzinGuru.length > 0 && (
                  <div 
                    className="p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg sm:rounded-xl border border-yellow-200 cursor-pointer hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all"
                    onClick={() => navigate('/dashboard/izin-guru-admin')}
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center min-w-0 flex-1">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-2 flex-shrink-0" />
                        <span className="font-medium text-yellow-900 text-sm sm:text-base truncate">{t('common.language') === 'ms' ? 'Izin Guru' : 'Izin Guru'}</span>
                      </div>
                      <Badge variant="warning" className="flex-shrink-0 ml-2 text-xs">{pendingIzinGuru.length} {t('common.language') === 'ms' ? 'menunggu' : 'pending'}</Badge>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {pendingIzinGuru.slice(0, 3).map((izin) => (
                        <div key={izin.id} className="text-xs sm:text-sm">
                          <p className="font-medium text-gray-900 truncate">{getGuruName(izin.guruId)}</p>
                          <p className="text-gray-600 text-xs truncate">
                            {izin.jenis.charAt(0).toUpperCase() + izin.jenis.slice(1)} • {' '}
                            {new Date(izin.tanggalMulai).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      ))}
                      {pendingIzinGuru.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{pendingIzinGuru.length - 3} lainnya
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {pendingSuratIzin.length > 0 && (
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center min-w-0 flex-1">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 flex-shrink-0" />
                        <span className="font-medium text-blue-900 text-sm sm:text-base truncate">{t('common.language') === 'ms' ? 'Surat Izin' : 'Surat Izin'} {studentTerm === 'santri' ? (t('common.language') === 'ms' ? 'Santri' : 'Santri') : (t('common.language') === 'ms' ? 'Murid' : 'Murid')}</span>
                      </div>
                      <Badge variant="info" className="flex-shrink-0 ml-2 text-xs">{pendingSuratIzin.length} {t('common.language') === 'ms' ? 'menunggu' : 'pending'}</Badge>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {pendingSuratIzin.slice(0, 3).map((surat) => (
                        <div key={surat.id} className="text-xs sm:text-sm">
                          <p className="font-medium text-gray-900 truncate">{getMuridName(surat.muridId)}</p>
                          <p className="text-gray-600 text-xs truncate">
                            {surat.jenis.charAt(0).toUpperCase() + surat.jenis.slice(1)} • {' '}
                            {new Date(surat.tanggalMulai).toLocaleDateString(t('common.language') === 'ms' ? 'ms-MY' : 'id-ID')}
                          </p>
                        </div>
                      ))}
                      {pendingSuratIzin.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{pendingSuratIzin.length - 3} {t('common.language') === 'ms' ? 'lainnya' : 'lainnya'}
                        </p>
                      )}
                    </div>
                    {!isTahfiz && (
                      <p className="text-xs text-blue-600 mt-2">
                        {t('common.language') === 'ms' ? 'Perlu ditinjau oleh wali kelas masing-masing' : 'Perlu ditinjau oleh wali kelas masing-masing'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-emerald-300" />
                <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">{t('common.language') === 'ms' ? 'Semua Terverifikasi' : 'Semua Terverifikasi'}</h4>
                <p className="text-sm sm:text-base text-gray-600">{t('common.language') === 'ms' ? 'Tidak ada pengajuan yang menunggu persetujuan' : 'Tidak ada pengajuan yang menunggu persetujuan'}</p>
              </div>
            )}
          </div>
        </Card>
        

        {/* Recent Activities */}
        <Card className="border-0 shadow-lg">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <div className="w-2 h-5 sm:h-6 bg-emerald-500 rounded-full mr-2 sm:mr-3"></div>
              <span className="text-sm sm:text-base lg:text-xl">{t('common.language') === 'ms' ? 'Aktivitas Terbaru' : 'Aktivitas Terbaru'}</span>
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  const typeColors = {
                    success: 'bg-emerald-100 text-emerald-600',
                    warning: 'bg-yellow-100 text-yellow-600',
                    info: 'bg-blue-100 text-blue-600',
                    error: 'bg-red-100 text-red-600',
                  };
                  
                  return (
                    <div key={activity.id} className="flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 lg:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${typeColors[activity.type]}`}>
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 truncate">{activity.subtitle}</p>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 ml-2">
                        {activity.time}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-emerald-300" />
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">{t('common.language') === 'ms' ? 'Semua Berjalan Lancar' : 'Semua Berjalan Lancar'}</h4>
                  <p className="text-sm sm:text-base text-gray-600">{t('common.language') === 'ms' ? 'Tidak ada aktivitas yang memerlukan perhatian khusus' : 'Tidak ada aktivitas yang memerlukan perhatian khusus'}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* System Status */}
        <Card className="border-0 shadow-lg">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <div className="w-2 h-5 sm:h-6 bg-purple-500 rounded-full mr-2 sm:mr-3"></div>
              <span className="text-sm sm:text-base lg:text-xl">{t('dashboardKepalaSekolah.statusSistem')}</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {!isTahfiz && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl">
                  <div className="flex items-center min-w-0 flex-1">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-emerald-900 text-sm sm:text-base truncate">
                        {activeTahunAjaran ? t('dashboardKepalaSekolah.semesterAktif') : t('dashboardKepalaSekolah.tidakAdaSemesterAktif')}
                      </p>
                      <p className="text-xs sm:text-sm text-emerald-700 truncate">
                        {activeTahunAjaran ? 
                          `${activeTahunAjaran.semester === 1 ? t('dashboardKepalaSekolah.ganjil') : t('dashboardKepalaSekolah.genap')} ${activeTahunAjaran.tahun}` :
                          t('dashboardKepalaSekolah.silakanHubungiAdmin')
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant={activeTahunAjaran ? 'success' : 'warning'} className="flex-shrink-0 ml-2 text-xs">
                    {activeTahunAjaran ? t('dashboardKepalaSekolah.aktif') : t('dashboardKepalaSekolah.tidakAktif')}
                  </Badge>
                </div>
              )}

              {!isTahfiz && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg sm:rounded-xl">
                  <div className="flex items-center min-w-0 flex-1">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-blue-900 text-sm sm:text-base truncate">{t('dashboardKepalaSekolah.tingkatKehadiranGuru')}</p>
                      <p className="text-xs sm:text-sm text-blue-700 truncate">
                        {gurusWithScheduleToday.length > 0 ? 
                          `${todayAbsensiGuru.filter(a => a.jamMasuk).length} ${t('dashboardKepalaSekolah.dari')} ${gurusWithScheduleToday.length} ${teacherTerm === 'ustadz' ? 'ustadz' : 'guru'}` :
                          t('dashboardKepalaSekolah.tidakAdaJadwalHariIni')
                        }
                      </p>
                    </div>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-blue-600 flex-shrink-0 ml-2">{attendanceRate}%</span>
                </div>
              )}

              {!isTahfiz && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg sm:rounded-xl">
                  <div className="flex items-center min-w-0 flex-1">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-purple-900 text-sm sm:text-base truncate">{t('dashboardKepalaSekolah.jadwalAktif')}</p>
                      <p className="text-xs sm:text-sm text-purple-700 truncate">
                        {activeTahunAjaran ? 
                          `${t('dashboardKepalaSekolah.semester')} ${activeTahunAjaran.semester} - ${activeTahunAjaran.tahun}` :
                          t('dashboardKepalaSekolah.belumAdaTahunAjaranAktif')
                        }
                      </p>
                    </div>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-purple-600 flex-shrink-0 ml-2">
                    {activeTahunAjaran ? 
                      jadwal.filter(j => 
                        j.tahunAjaran === activeTahunAjaran.tahun && 
                        j.semester === activeTahunAjaran.semester
                      ).length : 0
                    }
                  </span>
                </div>
              )}

              {!isTahfiz && (
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg sm:rounded-xl">
                  <div className="flex items-center min-w-0 flex-1">
                    <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-orange-900 text-sm sm:text-base truncate">{t('dashboardKepalaSekolah.pengaturanAbsen')}</p>
                      <p className="text-xs sm:text-sm text-orange-700 truncate">
                        {activePengaturan ? 
                          `${activePengaturan.jamMasuk} - ${activePengaturan.jamPulang}` :
                          t('dashboardKepalaSekolah.belumDikonfigurasi')
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant={activePengaturan ? 'success' : 'warning'} className="flex-shrink-0 ml-2 text-xs">
                    {activePengaturan ? t('dashboardKepalaSekolah.aktif') : t('dashboardKepalaSekolah.perluSetup')}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </Card>
{/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <div className="w-2 h-5 sm:h-6 bg-blue-500 rounded-full mr-2 sm:mr-3"></div>
              <span className="text-sm sm:text-base lg:text-xl">{t('common.language') === 'ms' ? 'Aksi Cepat' : 'Aksi Cepat'}</span>
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {isTahfiz ? (
                <>
                  <Button 
                    fullWidth 
                    className="justify-start text-left h-auto p-2.5 sm:p-3 lg:p-4 group hover:bg-blue-50 transition-all duration-200"
                    variant="secondary"
                    onClick={() => navigate('/dashboard/data-ustadz')}
                  >
                    <div className="flex items-center w-full">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-blue-200 transition-colors flex-shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">{t('common.language') === 'ms' ? 'Urus Ustadz' : 'Kelola Ustadz'}</p>
                        <p className="text-xs text-gray-500 truncate">{t('common.language') === 'ms' ? 'Tambah & edit data ustadz' : 'Tambah & edit data ustadz'}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </Button>

                  <Button 
                    fullWidth 
                    className="justify-start text-left h-auto p-2.5 sm:p-3 lg:p-4 group hover:bg-emerald-50 transition-all duration-200"
                    variant="secondary"
                    onClick={() => navigate('/dashboard/data-santri')}
                  >
                    <div className="flex items-center w-full">
                      <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-emerald-200 transition-colors flex-shrink-0">
                        <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">{t('common.language') === 'ms' ? 'Urus Santri' : 'Kelola Santri'}</p>
                        <p className="text-xs text-gray-500 truncate">{t('common.language') === 'ms' ? 'Tambah & edit data santri' : 'Tambah & edit data santri'}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </Button>

                  <Button 
                    fullWidth 
                    className="justify-start text-left h-auto p-2.5 sm:p-3 lg:p-4 group hover:bg-purple-50 transition-all duration-200"
                    variant="secondary"
                    onClick={() => navigate('/dashboard/data-jadwal-tahfiz')}
                  >
                    <div className="flex items-center w-full">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-purple-200 transition-colors flex-shrink-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">{t('sidebar.dataJadwalTahfiz')}</p>
                        <p className="text-xs text-gray-500 truncate">{t('common.language') === 'ms' ? 'Atur jadwal tahfiz' : 'Atur jadwal tahfiz'}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    fullWidth 
                    className="justify-start text-left h-auto p-2.5 sm:p-3 lg:p-4 group hover:bg-blue-50 transition-all duration-200"
                    variant="secondary"
                    onClick={() => navigate('/dashboard/guru')}
                  >
                    <div className="flex items-center w-full">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-blue-200 transition-colors flex-shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">{t('common.language') === 'ms' ? 'Urus Guru' : 'Kelola Guru'}</p>
                        <p className="text-xs text-gray-500 truncate">{t('common.language') === 'ms' ? 'Tambah & edit data guru' : 'Tambah & edit data guru'}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </Button>

                  <Button 
                    fullWidth 
                    className="justify-start text-left h-auto p-2.5 sm:p-3 lg:p-4 group hover:bg-emerald-50 transition-all duration-200"
                    variant="secondary"
                    onClick={() => navigate('/dashboard/kelola-data-murid')}
                  >
                    <div className="flex items-center w-full">
                      <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-emerald-200 transition-colors flex-shrink-0">
                        <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">{t('common.language') === 'ms' ? 'Urus Murid' : 'Kelola Murid'}</p>
                        <p className="text-xs text-gray-500 truncate">{t('common.language') === 'ms' ? 'Tambah & edit data murid' : 'Tambah & edit data murid'}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </Button>

                  <Button 
                    fullWidth 
                    className="justify-start text-left h-auto p-2.5 sm:p-3 lg:p-4 group hover:bg-purple-50 transition-all duration-200"
                    variant="secondary"
                    onClick={() => navigate('/dashboard/jadwal')}
                  >
                    <div className="flex items-center w-full">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-purple-200 transition-colors flex-shrink-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">{t('sidebar.jadwalPelajaran')}</p>
                        <p className="text-xs text-gray-500 truncate">{t('common.language') === 'ms' ? 'Atur jadwal mengajar' : 'Atur jadwal mengajar'}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </Button>

                  <Button
                    fullWidth
                    className="justify-start text-left h-auto p-2.5 sm:p-3 lg:p-4 group hover:bg-orange-50 transition-all duration-200"
                    variant="secondary"
                    onClick={() => navigate('/dashboard/qr-admin')}
                  >
                    <div className="flex items-center w-full">
                      <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-orange-200 transition-colors flex-shrink-0">
                        <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">{t('sidebar.qrAdmin')}</p>
                        <p className="text-xs text-gray-500 truncate">{t('common.language') === 'ms' ? `Pantau kehadiran ${teacherTerm === 'ustadz' ? 'ustadz' : 'guru'}` : `Pantau absen ${teacherTerm === 'ustadz' ? 'ustadz' : 'guru'}`}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-orange-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </Button>

                  <Button
                    fullWidth
                    className="justify-start text-left h-auto p-2.5 sm:p-3 lg:p-4 group hover:bg-teal-50 transition-all duration-200"
                    variant="secondary"
                    onClick={() => navigate('/dashboard/monitoring-kelas')}
                  >
                    <div className="flex items-center w-full">
                      <div className="p-1.5 sm:p-2 bg-teal-100 rounded-lg mr-2 sm:mr-3 group-hover:bg-teal-200 transition-colors flex-shrink-0">
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm lg:text-base">{t('sidebar.monitoringKelas')}</p>
                        <p className="text-xs text-gray-500 truncate">{t('common.language') === 'ms' ? `Monitor ${teacherTerm === 'ustadz' ? 'ustadz' : 'guru'} mengajar real-time` : `Monitor ${teacherTerm === 'ustadz' ? 'ustadz' : 'guru'} mengajar real-time`}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-teal-600 transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
        
      </div>

      {/* Additional Stats */}
      {!isTahfiz && (
        <Card className="border-0 shadow-lg">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <div className="w-2 h-5 sm:h-6 bg-indigo-500 rounded-full mr-2 sm:mr-3"></div>
              <span className="text-sm sm:text-base lg:text-xl">{t('dashboardKepalaSekolah.ringkasanAkademik')}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div 
                className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-all"
                onClick={() => navigate('/dashboard/jadwal')}
              >
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600 mx-auto mb-1 sm:mb-2 lg:mb-3" />
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">
                  {activeTahunAjaran ? 
                    jadwal.filter(j => 
                      j.tahunAjaran === activeTahunAjaran.tahun && 
                      j.semester === activeTahunAjaran.semester
                    ).length : 0
                  }
                </p>
                <p className="text-xs text-blue-700">{t('dashboardKepalaSekolah.jadwalAktif')}</p>
              </div>
              
              <div 
                className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl cursor-pointer hover:from-emerald-100 hover:to-emerald-200 transition-all"
                onClick={() => navigate('/dashboard/guru')}
              >
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-emerald-600 mx-auto mb-1 sm:mb-2 lg:mb-3" />
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-900">
                  {users.filter(u => u.role === 'guru' && (u as any).isWaliKelas).length}
                </p>
                <p className="text-xs text-emerald-700">{t('dashboardKepalaSekolah.waliKelas')}</p>
              </div>
              
              <div 
                className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl cursor-pointer hover:from-purple-100 hover:to-purple-200 transition-all"
                onClick={() => navigate('/dashboard/kelas')}
              >
                <School className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600 mx-auto mb-1 sm:mb-2 lg:mb-3" />
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">{kelas.length}</p>
                <p className="text-xs text-purple-700">{t('dashboardKepalaSekolah.kelasAktif')}</p>
              </div>
              
              <div 
                className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg sm:rounded-xl cursor-pointer hover:from-orange-100 hover:to-orange-200 transition-all"
                onClick={() => navigate('/dashboard/absen-guru')}
              >
                <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-600 mx-auto mb-1 sm:mb-2 lg:mb-3" />
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900">{activeSessions.length}</p>
                <p className="text-xs text-orange-700">{t('common.language') === 'ms' ? 'Sesi Aktif' : 'Sesi Aktif'}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Today's Summary */}
      {!isTahfiz && (
        <Card className="border-0 shadow-lg">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                <div className="w-2 h-5 sm:h-6 bg-green-500 rounded-full mr-2 sm:mr-3"></div>
                <span className="text-sm sm:text-base lg:text-xl">{t('dashboardKepalaSekolah.ringkasanHariIni')}</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-blue-600">{t('dashboardKepalaSekolah.guruMengajar')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">{gurusWithScheduleToday.length}</p>
                    <p className="text-xs text-blue-700 truncate">
                      {todayAbsensiGuru.filter(a => a.jamMasuk).length} {t('dashboardKepalaSekolah.sudahAbsenMasuk')}
                    </p>
                  </div>
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 ml-2" />
                </div>
              </div>
              
              <div className="p-3 sm:p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-emerald-600">{t('common.language') === 'ms' ? 'Sesi Kehadiran' : 'Sesi Absensi'}</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-900">{todaySessions.length}</p>
                    <p className="text-xs text-emerald-700 truncate">
                      {activeSessions.length} {t('common.language') === 'ms' ? 'sesi masih aktif' : 'sesi masih aktif'}
                    </p>
                  </div>
                  <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0 ml-2" />
                </div>
              </div>
              
              <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-purple-600">{t('common.language') === 'ms' ? 'Pengajuan Menunggu' : 'Pengajuan Pending'}</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-900">
                      {pendingIzinGuru.length + pendingSuratIzin.length}
                    </p>
                    <p className="text-xs text-purple-700 truncate">
                      {pendingIzinGuru.length} {t('common.language') === 'ms' ? 'izin guru' : 'izin guru'}, {pendingSuratIzin.length} {t('common.language') === 'ms' ? 'izin murid' : 'izin murid'}
                    </p>
                  </div>
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0 ml-2" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      </div>
    </>
  );
};

export default AdminDashboard;