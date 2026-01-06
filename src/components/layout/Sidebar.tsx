import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  School,
  Calendar,
  ClipboardList,
  FileText,
  GraduationCap,
  LogOut,
  UserCheck,
  BookOpen,
  QrCode,
  Settings,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Briefcase,
  Eye,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIzinGuru } from '../../hooks/useIzinGuru';
import { useGurus } from '../../hooks/useGurus';
import { useMurid } from '../../hooks/useMurid';
import { useKelas } from '../../hooks/useKelas';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { usePengumumanKelulusan } from '../../hooks/usePengumumanKelulusan';
import { useRiwayatWaliKelasData } from '../../hooks/useRiwayatWaliKelasData';
import { useAlumni } from '../../hooks/useAlumni';
import { useProfilSekolah } from '../../hooks/useProfilSekolah';
import { Kelas, IzinGuru, Alumni } from '../../types';
import { shouldShowJurusanSync, isMaxTingkatSync } from '../../utils/jenjangPendidikanUtils';
import { isMuridAlumni } from '../../utils/alumniStatusUtils';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  subItems?: MenuItem[];
}
const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { activeTahunAjaran } = useTahunAjaran();
  const { pengumumanKelulusan } = usePengumumanKelulusan();
  const { izinGuru } = useIzinGuru();
  const { riwayatWaliKelas: riwayatWaliKelasData } = useRiwayatWaliKelasData();
  const { alumni } = useAlumni();
  const { profilSekolah } = useProfilSekolah();
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);
  const showJurusan = shouldShowJurusanSync();
  
  // Combine gurus and murid into users array for compatibility
  const users = React.useMemo(() => [...gurus, ...murid], [gurus, murid]);

  const isAlumni = user ? isMuridAlumni(user, alumni) : false;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  React.useEffect(() => {
    const menuItems = getMenuItems();
    menuItems.forEach(item => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(
          sub => sub.id === currentPage || location.pathname === `/dashboard/${sub.id}`
        );
        if (hasActiveSubItem && !expandedMenus.includes(item.id)) {
          setExpandedMenus(prev => [...prev, item.id]);
        }
      }
    });
  }, [currentPage, location.pathname]);

  // Fix scroll container initialization on first load
  React.useEffect(() => {
    const fixScroll = () => {
      setTimeout(() => {
        const navElement = document.querySelector('nav.overflow-y-auto');
        if (navElement) {
          // Force reflow to ensure scroll is properly initialized
          void (navElement as HTMLElement).offsetHeight;
        }
      }, 50);
    };

    fixScroll();
  }, []);

  const handlePageChange = (page: string) => {
    onPageChange(page);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case 'kepala_sekolah':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'monitoring-kelas', label: 'Monitoring Kelas', icon: Eye },
          { id: 'absen-guru', label: 'Absen Guru', icon: ClipboardList },
          {
            id: 'data-statistik',
            label: 'Data Statistik',
            icon: BarChart3,
            subItems: [
              { id: 'guru', label: 'Data Guru', icon: Users },
              { id: 'kelola-data-murid', label: 'Data Murid', icon: Users },
            ]
          },
        ];
      case 'admin':
        const adminMenuItems: MenuItem[] = [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'monitoring-kelas', label: 'Monitoring Kelas', icon: Eye },
          {
            id: 'kelola-guru',
            label: 'Kelola Guru',
            icon: Users,
            subItems: [
              { id: 'guru', label: 'Manajemen Guru', icon: Users },
              { id: 'absen-guru', label: 'Absen Guru', icon: ClipboardList },
              { id: 'izin-guru-admin', label: 'Verifikasi Izin Guru', icon: FileText },
              { id: 'qr-admin', label: 'QR Admin', icon: QrCode },
            ]
          },
        ];

        // Only show Kelola Jurusan menu for SMA/SMK
        if (showJurusan) {
          adminMenuItems.push({
            id: 'kelola-jurusan',
            label: 'Kelola Jurusan',
            icon: School,
            subItems: [
              { id: 'jurusan', label: 'Manajemen Jurusan', icon: BookOpen },
              { id: 'kelas', label: 'Manajemen Kelas', icon: Users },
            ]
          });
        } else {
          // For SD/SMP, show only Manajemen Kelas without jurusan
          adminMenuItems.push({
            id: 'kelas',
            label: 'Manajemen Kelas',
            icon: School,
          });
        }

        adminMenuItems.push(
          {
            id: 'murid',
            label: 'Manajemen Murid',
            icon: UserCheck,
            subItems: [
              { id: 'tambah-murid', label: 'Tambah Murid', icon: Plus },
              { id: 'kelola-data-murid', label: 'Kelola Data Murid', icon: Users },
            ]
          },
          {
            id: 'pelajaran',
            label: 'Kelola Akademik',
            icon: Calendar,
            subItems: [
              { id: 'tahun-ajaran', label: 'Tahun Ajaran', icon: GraduationCap },
               { id: 'mapel', label: 'Mata Pelajaran', icon: BookOpen },
              { id: 'guru-mapel', label: 'Kelola Guru Mapel', icon: Users },
             
              { id: 'jadwal', label: 'Jadwal Pelajaran', icon: Calendar },
              
              
            ]
          },
          {
            id: 'info-pengumuman',
            label: 'Info & Pengumuman',
            icon: FileText,
            subItems: [
              { id: 'beri-info', label: 'Beri Info', icon: FileText },
              { id: 'pengumuman-kelulusan', label: 'Pengumuman Kelulusan', icon: GraduationCap },
              
            ]
          },
          {
            id: 'rekap-raport',
            label: 'Rekap Raport Murid',
            icon: FileText,
            subItems: [
              { id: 'raport-murid-admin', label: 'Laporan Hasil Belajar', icon: FileText },
              { id: 'alumni-sekolah', label: 'Alumni Sekolah', icon: Users },
            ]
          },
          {
            id: 'kelola-alat',
            label: 'Kelola Alat',
            icon: Briefcase,
            subItems: [
              { id: 'data-alat-rfid', label: 'Data Alat RFID', icon: QrCode },
            ]
          },
          { id: 'ekstrakulikuler', label: 'Ekstrakulikuler', icon: Activity },
        );

        adminMenuItems.push({ id: 'pengaturan', label: 'Pengaturan', icon: Settings });

        return adminMenuItems;
      case 'guru': {
        const guruMenus: MenuItem[] = [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          {
            id: 'mengajar',
            label: 'Mengajar',
            icon: BookOpen,
            subItems: [
              { id: 'jadwal-saya', label: 'Jadwal Saya', icon: Calendar },
              { id: 'absensi', label: 'Kelola Absensi', icon: ClipboardList },
              { id: 'input-nilai', label: 'Input Nilai', icon: FileText },
              { id: 'capaian-pembelajaran', label: 'Capaian Pembelajaran', icon: BookOpen },
              { id: 'riwayat-absensi', label: 'Riwayat Absensi', icon: FileText },
            ]
          },
          { id: 'absen-guru', label: 'Absen', icon: UserCheck },
          { id: 'izin-guru', label: 'Pengajuan Izin', icon: FileText },
        ];

        const activeIzinForSubstitute = (() => {
          const today = new Date().toISOString().split('T')[0];
          const currentTime = new Date().toTimeString().slice(0, 5);
          
          return izinGuru.find(i => {
            // Check if user is assigned as substitute
            const isAssigned = i.guruPenggantiList?.some(gp => gp.guruPenggantiId === user?.id);
            if (!isAssigned || i.status !== 'diterima') return false;
            
            // For izin_dispen, check if today matches tanggalMulai and current time is within jamMulai-jamSelesai
            if (i.jenis === 'izin_dispen') {
              if (i.tanggalMulai === today && i.jamMulai && i.jamSelesai) {
                return currentTime >= i.jamMulai && currentTime <= i.jamSelesai;
              }
              return false;
            }
            
            // For other types, check if today is within tanggalMulai-tanggalSelesai
            return i.tanggalMulai <= today && i.tanggalSelesai >= today;
          });
        })();

        if (activeIzinForSubstitute) {
          guruMenus.push({ id: 'pengganti', label: 'Pengganti', icon: Briefcase });
        }

        guruMenus.push({ id: 'profil', label: 'Profil', icon: UserIcon });

        if (user && (user as any).isWaliKelas) {
          guruMenus.splice(-1, 0, {
            id: 'wali-kelas',
            label: 'Wali Kelas',
            icon: School,
            subItems: [
              { id: 'absen-kelas', label: 'Absen Kelas', icon: ClipboardList },
              { id: 'jadwal-kelas', label: 'Jadwal Pelajaran Kelas', icon: Calendar },
              { id: 'data-murid-kelas', label: 'Data Murid Kelas', icon: Users },
              { id: 'murid-kelas', label: 'Absen Pelajaran', icon: UserCheck },
              { id: 'nilai-kelas', label: 'Nilai Kelas', icon: BookOpen },
              { id: 'nilai-ekstrakulikuler-kelas', label: 'Nilai Ekstrakulikuler', icon: Activity },
              { id: 'kokulikuler', label: 'Kokulikuler', icon: BookOpen },
              { id: 'surat-izin', label: 'Surat Izin', icon: FileText },
              
              { id: 'raport-murid', label: 'Laporan Hasil Belajar', icon: FileText },
              { id: 'e-raport', label: 'Nilai E-Raport', icon: FileText },
              ...(users.find(u => u.id === user?.id && (u as any).kelasWali && kelas.find(k => k.id === (u as any).kelasWali && isMaxTingkatSync(k.tingkat))) ?
                [{ id: 'info-kelulusan', label: 'Info Kelulusan', icon: GraduationCap }].filter(() => {
                  const activePengumuman = pengumumanKelulusan.find(p => p.isPublished && p.tahunAjaran === activeTahunAjaran?.tahun);
                  return activeTahunAjaran?.semester === 2 && activePengumuman !== undefined;
                }) : []
              ),
            ]
          });
        }

        // Add Riwayat Walikelas as separate menu item for teachers who have history as wali kelas
        const hasRiwayatWaliKelas = riwayatWaliKelasData.some((r: any) => r.guruId === user?.id);
        if (hasRiwayatWaliKelas) {
          guruMenus.push({ id: 'riwayat-wali-kelas', label: 'Riwayat Walikelas', icon: GraduationCap });
          guruMenus.push({ id: 'riwayat-kelulusan', label: 'Riwayat Kelulusan', icon: GraduationCap });
        }

        return guruMenus;
      }
      case 'murid': {
        // Menu khusus untuk alumni/lulus
        if (isAlumni) {
          return [
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'mata-pelajaran', label: 'Mata Pelajaran', icon: BookOpen },
            { id: 'qr-code', label: 'QR Code Saya', icon: QrCode },
            { id: 'e-raport-saya', label: 'E-Raport', icon: FileText },
            {
              id: 'laporan-nilai',
              label: 'Laporan Nilai',
              icon: ClipboardList,
              subItems: [
                { id: 'nilai-saya', label: 'Nilai Saya', icon: FileText },
                { id: 'raport-saya', label: 'Laporan Hasil Belajar', icon: GraduationCap },
              ]
            },
            { id: 'profil', label: 'Profil', icon: UserIcon },
          ];
        }

        // Menu untuk murid aktif
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'jadwal', label: 'Jadwal Kelas', icon: Calendar },
          { id: 'mata-pelajaran', label: 'Mata Pelajaran', icon: BookOpen },
          {
            id: 'kelola-absen',
            label: 'Kelola-absen',
            icon: School,
            subItems: [
              { id: 'absensi-saya', label: 'Absensi Saya', icon: ClipboardList },
              { id: 'absen-kehadiran', label: 'Absen Kehadiran', icon: UserCheck },
            ]
          },

          { id: 'qr-code', label: 'QR Code Saya', icon: QrCode },
          {
            id: 'laporan-nilai',
            label: 'Laporan Nilai',
            icon: ClipboardList,
            subItems: [
              { id: 'nilai-saya', label: 'Nilai Saya', icon: FileText },
              { id: 'raport-saya', label: 'Laporan Hasil Belajar', icon: GraduationCap },
              { id: 'e-raport-saya', label: 'E-Raport', icon: FileText },
            ]
          },

          ...((() => {
            const muridUser = users.find(u => u.id === user?.id);
            const muridKelas = kelas.find(k => k.id === (muridUser as any)?.kelasId);
            const activePengumuman = pengumumanKelulusan.find(p => p.isPublished && p.tahunAjaran === activeTahunAjaran?.tahun);

            return (muridKelas && isMaxTingkatSync(muridKelas.tingkat) && activePengumuman !== undefined && activeTahunAjaran?.semester === 2) ?
              [{ id: 'info-kelulusan-murid', label: 'Info Kelulusan', icon: GraduationCap }] : [];
          })()),
          { id: 'surat-izin', label: 'Pengajuan Izin', icon: FileText },
          { id: 'profil', label: 'Profil', icon: UserIcon },
        ];
      }
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const isActive = currentPage === item.id || 
                    (hasSubItems && item.subItems?.some(sub => sub.id === currentPage)) ||
                    location.pathname === `/dashboard/${item.id}` ||
                    (hasSubItems && item.subItems?.some(sub => location.pathname === `/dashboard/${sub.id}`));
    const Icon = item.icon;

    return (
      <li key={item.id}>
        <button
          onClick={() => {
            if (hasSubItems) {
              toggleMenu(item.id);
            } else {
              handlePageChange(item.id);
            }
          }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
            level > 0 ? 'ml-4 text-sm' : ''
          } ${
            isActive && !hasSubItems
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : isActive && hasSubItems
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Icon size={20} />
            <span className="font-medium">{item.label}</span>
          </div>
          {hasSubItems && (
            <div className="ml-2">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          )}
        </button>
        
        {hasSubItems && isExpanded && (
          <ul className="mt-2 space-y-1">
            {item.subItems?.map(subItem => renderMenuItem(subItem, level + 1))}
          </ul>
        )}
      </li>
    );
  };
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-80 bg-white shadow-lg h-screen fixed left-0 top-0 z-[70] transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-30
        flex flex-col
      `}>
        {/* Mobile Close Button */}
        <div className="flex items-start justify-between p-2 border-b border-gray-200">
  <div className="flex-1">
  {profilSekolah?.logoSekolah ? (
    <div className="flex flex-col">
      
      {/* Baris 1: Logo + Nama Sekolah */}
      <div className="flex items-center space-x-1">
        <img
  src={profilSekolah.logoSekolah}
  alt="Logo Sekolah"
  className="object-contain flex-shrink-0 max-h-14 max-w-14"
 />

        <h1 className="text-md sm:text-lg font-bold text-gray-800 truncate">
          {profilSekolah.namaSekolah || 'Absensi Sekolah'}
        </h1>
      </div>

      {/* Baris 2: Name + Role */}
      <div className="mt-1.5 pl-4">
        <p className="text-xs text-gray-600">
          {user?.name}
          <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full ml-2 capitalize">
            {user?.role}
          </span>
        </p>
      </div>

    </div>
 

    ) : (
      <div>
        <h1 className="text-xl font-bold text-gray-800">Absensi Sekolah</h1>
        <p className="text-sm text-gray-600 mt-1">{user?.name}
          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-2 ml-2 capitalize">
            {user?.role}
          </span>
        </p>
      </div>
    )}
  </div>
  <div className="lg:hidden flex-shrink-0">
    <button
      onClick={onClose}
      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <X size={20} />
    </button>
  </div>
</div>


      <nav className="p-4 flex-1 overflow-y-auto min-h-0">
        <ul className="space-y-2">
          {menuItems.map(item => renderMenuItem(item))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 mt-auto flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;