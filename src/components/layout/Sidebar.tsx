import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  School,
  Calendar,
  CalendarClock,
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
  ScanFace,
  CheckCircle,
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
import { useUstadz } from '../../hooks/useUstadz';
import { useKelasTahfiz } from '../../hooks/useKelasTahfiz';
import { useSantri } from '../../hooks/useSantri';
import { usePengaturanSistem } from '../../hooks/usePengaturanSistem';
import { Kelas, IzinGuru, Alumni } from '../../types';
import { shouldShowJurusanSync, isMaxTingkatSync } from '../../utils/jenjangPendidikanUtils';
import { getTodayIndonesia, getCurrentTimeIndonesia } from '../../utils/absensiUtils';
import { isMuridAlumni } from '../../utils/alumniStatusUtils';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();
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
  const { ustadz } = useUstadz();
  const { kelasTahfiz } = useKelasTahfiz();
  const { santri } = useSantri();
  const { systemType, cbtEnabled, spmbEnabled } = usePengaturanSistem();
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);
  const showJurusan = shouldShowJurusanSync();
  const isCbtEnabled = cbtEnabled ?? true;
  const isSpmbEnabled = spmbEnabled ?? true;
  
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
        const kepalaSekolahMenuItems: MenuItem[] = [
          { id: 'dashboard', label: t('sidebar.dashboard'), icon: Home },
        ];
        
        // Menu monitoring kelas: untuk semua tipe sistem (umum menampilkan jadwal umum, tahfiz menampilkan jadwal tahfiz, umum+tahfiz keduanya)
        kepalaSekolahMenuItems.push({ 
          id: 'monitoring-kelas', 
          label: t('sidebar.monitoringKelas'), 
          icon: Eye 
        });
        
        // Ubah label menu berdasarkan systemType
        if (systemType === 'tahfiz' || systemType === 'sekolah_umum_tahfiz') {
          kepalaSekolahMenuItems.push({ 
            id: 'absen-guru', 
            label: t('sidebar.kehadiranUstadz'), 
            icon: ClipboardList 
          });
        } else {
          kepalaSekolahMenuItems.push({ 
            id: 'absen-guru', 
            label: t('sidebar.absenGuru'), 
            icon: ClipboardList 
          });
        }
        
        // Hide menu data-statistik jika systemType adalah tahfiz
        if (systemType !== 'tahfiz') {
          kepalaSekolahMenuItems.push({
            id: 'data-statistik',
            label: t('sidebar.dataStatistik'),
            icon: BarChart3,
            subItems: [
              { id: 'guru', label: t('sidebar.dataGuru'), icon: Users },
              { id: 'kelola-data-murid', label: t('sidebar.dataMurid'), icon: Users },
            ]
          });
        }
        
        // Show tahfiz menu jika systemType adalah tahfiz atau sekolah_umum_tahfiz
        if (systemType === 'tahfiz' || systemType === 'sekolah_umum_tahfiz') {
          kepalaSekolahMenuItems.push({
            id: 'tahfiz-quran',
            label: t('sidebar.tahfizQuran'),
            icon: BookOpen,
            subItems: [
              { id: 'data-santri-kepala-sekolah', label: t('sidebar.dataSantri'), icon: Users },
              { id: 'data-ustadz-kepala-sekolah', label: t('sidebar.dataUstadz'), icon: Users },
            ]
          });
        }
        
        return kepalaSekolahMenuItems;
      case 'admin':
        const adminMenuItems: MenuItem[] = [];
        
        // Always show dashboard
        adminMenuItems.push({ id: 'dashboard', label: t('sidebar.dashboard'), icon: Home });
        
        // For tahfiz system, show limited menus (termasuk monitoring kelas tahfiz)
        if (systemType === 'tahfiz') {
          adminMenuItems.push(
            { id: 'monitoring-kelas', label: t('sidebar.monitoringKelas'), icon: Eye },
            {
              id: 'kelola-guru',
              label: t('sidebar.kelolaAbsenGuru'),
              icon: Users,
              subItems: [
                { id: 'absen-guru', label: t('sidebar.absenGuru'), icon: ClipboardList },
                { id: 'izin-guru-admin', label: t('sidebar.verifikasiIzinGuru'), icon: FileText },
                { id: 'qr-admin', label: t('sidebar.qrAdmin'), icon: QrCode },
              ]
            },
            {
              id: 'kelola-data-guru',
              label: t('sidebar.kelolaDataGuru'),
              icon: Users,
              subItems: [
                { id: 'guru', label: t('sidebar.manajemenGuru'), icon: Users },
                { id: 'data-face-recognition', label: t('sidebar.dataFaceRecognition'), icon: ScanFace },
              ]
            },
            {
              id: 'info-pengumuman',
              label: t('sidebar.infoPengumuman'),
              icon: FileText,
              subItems: [
                { id: 'beri-info', label: t('sidebar.beriInfo'), icon: FileText },
              ]
            },
            {
              id: 'kelola-alat',
              label: t('sidebar.kelolaAlat'),
              icon: Briefcase,
              subItems: [
                { id: 'data-alat-rfid', label: t('sidebar.dataAlatRfid'), icon: QrCode },
              ]
            },
            {
              id: 'tahfiz-quran',
              label: t('sidebar.tahfizQuran'),
              icon: BookOpen,
              subItems: [
                { id: 'data-kelas-tahfiz', label: t('sidebar.dataKelasRuangan'), icon: School },
                { id: 'data-jadwal-tahfiz', label: t('sidebar.dataJadwalTahfiz'), icon: CalendarClock },
                { id: 'data-ustadz', label: t('sidebar.dataUstadz'), icon: Users },
                { id: 'data-santri', label: t('sidebar.dataSantri'), icon: Users },
              ]
            },
            { id: 'pengaturan', label: t('sidebar.pengaturan'), icon: Settings }
          );
          return adminMenuItems;
        }
        
        // Monitoring kelas: tampilkan untuk sekolah_umum, sekolah_umum_tahfiz, dan tahfiz (isi halaman menyesuaikan systemType)
        adminMenuItems.push(
          { id: 'monitoring-kelas', label: t('sidebar.monitoringKelas'), icon: Eye },
          {
            id: 'kelola-guru',
            label: t('sidebar.kelolaAbsenGuru'),
            icon: Users,
            subItems: [
              { id: 'absen-guru', label: t('sidebar.absenGuru'), icon: ClipboardList },
              { id: 'izin-guru-admin', label: t('sidebar.verifikasiIzinGuru'), icon: FileText },
              { id: 'qr-admin', label: t('sidebar.qrAdmin'), icon: QrCode },
            ]
          },
          {
            id: 'kelola-data-guru',
            label: t('sidebar.kelolaDataGuru'),
            icon: Users,
            subItems: [
              { id: 'guru', label: t('sidebar.manajemenGuru'), icon: Users },
              { id: 'data-face-recognition', label: t('sidebar.dataFaceRecognition'), icon: ScanFace },
            ]
          },
        );

        // Only show Kelola Jurusan menu for SMA/SMK
        if (showJurusan) {
          adminMenuItems.push({
            id: 'kelola-jurusan',
            label: t('sidebar.kelolaJurusan'),
            icon: School,
            subItems: [
              { id: 'jurusan', label: t('sidebar.manajemenJurusan'), icon: BookOpen },
              { id: 'kelas', label: t('sidebar.manajemenKelas'), icon: Users },
            ]
          });
        } else {
          // For SD/SMP, show only Manajemen Kelas without jurusan
          adminMenuItems.push({
            id: 'kelas',
            label: t('sidebar.manajemenKelas'),
            icon: School,
          });
        }

        adminMenuItems.push(
          {
            id: 'murid',
            label: t('sidebar.kelolaDataSiswa'),
            icon: UserCheck,
            subItems: [
              { id: 'tambah-murid', label: t('sidebar.tambahSiswa'), icon: Plus },
              { id: 'kelola-data-murid', label: t('sidebar.manejemenSiswa'), icon: Users },
            ]
          },
          {
            id: 'pelajaran',
            label: t('sidebar.kelolaAkademik'),
            icon: Calendar,
            subItems: [
              { id: 'tahun-ajaran', label: t('sidebar.tahunAjaran'), icon: GraduationCap },
              { id: 'mapel', label: t('sidebar.mataPelajaran'), icon: BookOpen },
              { id: 'guru-mapel', label: t('sidebar.kelolaGuruMapel'), icon: Users },
              { id: 'jadwal', label: t('sidebar.jadwalPelajaran'), icon: Calendar },
            ]
          },
          ...(isSpmbEnabled ? [{
            id: 'spmb',
            label: 'SPMB',
            icon: ClipboardList,
            subItems: [
              { id: 'spmb-pembukaan', label: 'Pembukaan SPMB', icon: Calendar },
              { id: 'spmb-pendaftar', label: 'Data Pendaftar', icon: Users },
              { id: 'spmb-diterima', label: 'Data Diterima', icon: CheckCircle },
            ],
          }] : []),
          ...(isCbtEnabled ? [{
            id: 'kelola-cbt-admin',
            label: t('sidebar.kelolaCBT'),
            icon: ClipboardList,
            subItems: [
              { id: 'cbt-monitoring', label: t('sidebar.monitoringCBT'), icon: Eye },
              { id: 'cbt-bank-soal-admin', label: t('sidebar.bankSoalCBT'), icon: BookOpen },
            ]
          }] : []),
          {
            id: 'info-pengumuman',
            label: t('sidebar.infoPengumuman'),
            icon: FileText,
            subItems: [
              { id: 'beri-info', label: t('sidebar.beriInfo'), icon: FileText },
            ]
          },
          { id: 'pengumuman-kelulusan', label: t('sidebar.pengumumanKelulusan'), icon: GraduationCap },
          {
            id: 'rekap-raport',
            label: t('sidebar.rekapRaportMurid'),
            icon: FileText,
            subItems: [
              { id: 'raport-murid-admin', label: t('sidebar.laporanHasilBelajar'), icon: FileText },
              { id: 'alumni-sekolah', label: t('sidebar.alumniSekolah'), icon: Users },
            ]
          },
          {
            id: 'kelola-alat',
            label: t('sidebar.kelolaAlat'),
            icon: Briefcase,
            subItems: [
              { id: 'data-alat-rfid', label: t('sidebar.dataAlatRfid'), icon: QrCode },
            ]
          },
          { id: 'ekstrakulikuler', label: t('sidebar.ekstrakulikuler'), icon: Activity }
        );

        // Only show tahfiz menu if systemType is sekolah_umum_tahfiz
        if (systemType === 'sekolah_umum_tahfiz') {
          adminMenuItems.push({
            id: 'tahfiz-quran',
            label: t('sidebar.tahfizQuran'),
            icon: BookOpen,
            subItems: [
              { id: 'data-kelas-tahfiz', label: t('sidebar.dataKelasRuangan'), icon: School },
              { id: 'data-jadwal-tahfiz', label: t('sidebar.dataJadwalTahfiz'), icon: CalendarClock },
              { id: 'data-ustadz', label: t('sidebar.dataUstadz'), icon: Users },
              { id: 'data-santri', label: t('sidebar.dataSantri'), icon: Users },
            ]
          });
        }

        adminMenuItems.push({ id: 'pengaturan', label: t('sidebar.pengaturan'), icon: Settings });

        return adminMenuItems;
      case 'guru': {
        const guruMenus: MenuItem[] = [
          { id: 'dashboard', label: t('sidebar.dashboard'), icon: Home },
        ];
        
        // For tahfiz system, show limited menus
        if (systemType === 'tahfiz') {
          guruMenus.push(
            {
              id: 'absen-guru',
              label: t('sidebar.absen'),
              icon: UserCheck,
              subItems: [
                { id: 'absen-saya', label: t('sidebar.absenSaya'), icon: UserCheck },
              ]
            },
            { id: 'izin-guru', label: t('sidebar.pengajuanIzin'), icon: FileText },
            { id: 'absen-siswa', label: t('sidebar.absenSiswa'), icon: UserCheck },
            {
              id: 'tahfiz-quran-guru',
              label: t('sidebar.tahfizQuran'),
              icon: BookOpen,
              subItems: [
                { id: 'data-santri-tahfiz-guru', label: t('sidebar.dataSantriTahfiz'), icon: Users },
                { id: 'jadwal-tahfiz-guru', label: t('sidebar.jadwalTahfiz'), icon: CalendarClock },
                { id: 'absensi-tahfiz', label: t('sidebar.absensiTahfiz'), icon: ClipboardList },
                { id: 'riwayat-absensi-tahfiz', label: t('sidebar.riwayatAbsenTahfiz'), icon: FileText },
                { id: 'progress-tahfiz', label: t('sidebar.progressTahfiz'), icon: BarChart3 },
                { id: 'izin-santri-tahfiz', label: t('sidebar.izinSantri'), icon: FileText },
              ]
            },
            { id: 'profil', label: t('sidebar.profil'), icon: UserIcon }
          );
          return guruMenus;
        }
        
        // For sekolah_umum and sekolah_umum_tahfiz, show general menus
        guruMenus.push(
          {
            id: 'mengajar',
            label: t('sidebar.mengajar'),
            icon: BookOpen,
            subItems: [
              { id: 'jadwal-saya', label: t('sidebar.jadwalSaya'), icon: Calendar },
              { id: 'absensi', label: t('sidebar.kelolaAbsensi'), icon: ClipboardList },
              { id: 'input-nilai', label: t('sidebar.inputNilai'), icon: FileText },
              { id: 'capaian-pembelajaran', label: t('sidebar.capaianPembelajaran'), icon: BookOpen },
              { id: 'riwayat-absensi', label: t('sidebar.riwayatAbsensi'), icon: FileText },
            ]
          },
          ...(isCbtEnabled ? [{
            id: 'kelola-cbt',
            label: t('sidebar.kelolaCBT'),
            icon: ClipboardList,
            subItems: [
              { id: 'cbt-bank-soal', label: t('sidebar.bankSoalCBT'), icon: BookOpen },
              { id: 'cbt-buat-ujian', label: t('sidebar.buatUjianCBT'), icon: FileText },
            ]
          }] : []),
          {
            id: 'absen-guru',
            label: t('sidebar.absen'),
            icon: UserCheck,
            subItems: [
              { id: 'absen-saya', label: t('sidebar.absenSaya'), icon: UserCheck },
              { id: 'absen-siswa', label: t('sidebar.absenSiswa'), icon: QrCode },
            ]
          },
          { id: 'izin-guru', label: t('sidebar.pengajuanIzin'), icon: FileText }
        );
        
        // Only show tahfiz menu if systemType is sekolah_umum_tahfiz and user is ustadz
        if (systemType === 'sekolah_umum_tahfiz') {
          const isUstadz = ustadz.some((u) => u.id === user?.id);
          if (isUstadz) {
            guruMenus.push({
              id: 'tahfiz-quran-guru',
              label: t('sidebar.tahfizQuran'),
              icon: BookOpen,
              subItems: [
                { id: 'data-santri-tahfiz-guru', label: t('sidebar.dataSantriTahfiz'), icon: Users },
                { id: 'jadwal-tahfiz-guru', label: t('sidebar.jadwalTahfiz'), icon: CalendarClock },
                { id: 'absensi-tahfiz', label: t('sidebar.absensiTahfiz'), icon: ClipboardList },
                { id: 'riwayat-absensi-tahfiz', label: t('sidebar.riwayatAbsenTahfiz'), icon: FileText },
                { id: 'progress-tahfiz', label: t('sidebar.progressTahfiz'), icon: BarChart3 },
                { id: 'izin-santri-tahfiz', label: t('sidebar.izinSantri'), icon: FileText },
              ]
            });
          }
        }

        const activeIzinForSubstitute = (() => {
          const today = getTodayIndonesia();
          const currentTime = getCurrentTimeIndonesia();
          
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
          guruMenus.push({ id: 'pengganti', label: t('sidebar.pengganti'), icon: Briefcase });
        }

        guruMenus.push({ id: 'profil', label: t('sidebar.profil'), icon: UserIcon });

        if (user && (user as any).isWaliKelas) {
          guruMenus.splice(-1, 0, {
            id: 'wali-kelas',
            label: t('sidebar.waliKelas'),
            icon: School,
            subItems: [
              { id: 'absen-kelas', label: t('sidebar.absenKelas'), icon: ClipboardList },
              { id: 'jadwal-kelas', label: t('sidebar.jadwalPelajaranKelas'), icon: Calendar },
              { id: 'data-murid-kelas', label: t('sidebar.dataMuridKelas'), icon: Users },
              { id: 'murid-kelas', label: t('sidebar.absenPelajaran'), icon: UserCheck },
              { id: 'nilai-kelas', label: t('sidebar.nilaiKelas'), icon: BookOpen },
              { id: 'nilai-ekstrakulikuler-kelas', label: t('sidebar.nilaiEkstrakulikuler'), icon: Activity },
              { id: 'kokulikuler', label: t('sidebar.kokulikuler'), icon: BookOpen },
              { id: 'surat-izin', label: t('sidebar.suratIzin'), icon: FileText },
              
              { id: 'raport-murid', label: t('sidebar.laporanHasilBelajar'), icon: FileText },
              { id: 'e-raport', label: t('sidebar.nilaiERaport'), icon: FileText },
              ...(users.find(u => u.id === user?.id && (u as any).kelasWali && kelas.find(k => k.id === (u as any).kelasWali && isMaxTingkatSync(k.tingkat))) ?
                [{ id: 'info-kelulusan', label: t('sidebar.infoKelulusan'), icon: GraduationCap }].filter(() => {
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
          guruMenus.push({ id: 'riwayat-wali-kelas', label: t('sidebar.riwayatWalikelas'), icon: GraduationCap });
          guruMenus.push({ id: 'riwayat-kelulusan', label: t('sidebar.riwayatKelulusan'), icon: GraduationCap });
        }

        // Add Tahfiz Qur'an menu if user is an ustadz
        

        return guruMenus;
      }
      case 'murid': {
        // Check if user is a santri that is NOT from murid collection (isFromMurid: false)
        const santriUser = user?.id ? santri.find(s => s.id === user.id) : null;
        const isSantriNotFromMurid = santriUser && (santriUser as any).isFromMurid === false;

        // Menu khusus untuk santri yang bukan dari murid (khusus santri tahfiz)
        if (isSantriNotFromMurid) {
          // Check if santri has at least one tahfiz class
          const hasTahfizClass = kelasTahfiz.some(cls => cls.santriIds.includes(user?.id || ''));

          const santriMenuItems: MenuItem[] = [
            { id: 'dashboard', label: t('sidebar.dashboard'), icon: Home },
            { id: 'qr-code', label: t('sidebar.qrCodeSaya'), icon: QrCode },
          ];

          // Only show Tahfiz Quran menu if santri has tahfiz class
          if (hasTahfizClass) {
            santriMenuItems.push({
              id: 'tahfiz-quran-murid',
              label: t('sidebar.tahfizQuran'),
              icon: BookOpen,
              subItems: [
                { id: 'jadwal-tahfiz-murid', label: t('sidebar.jadwalTahfiz'), icon: CalendarClock },
                { id: 'absensi-santri-tahfiz', label: t('sidebar.absensiTahfiz'), icon: ClipboardList },
                { id: 'progress-hapalan-murid', label: t('sidebar.progressHapalan'), icon: BarChart3 },
              ]
            });
            // Tambahkan menu absen kehadiran untuk santri
            santriMenuItems.push({ id: 'absen-kehadiran', label: t('sidebar.absenKehadiran'), icon: UserCheck });
          }

          santriMenuItems.push(
            { id: 'surat-izin', label: t('sidebar.pengajuanIzin'), icon: FileText },
            { id: 'profil', label: t('sidebar.profil'), icon: UserIcon }
          );

          return santriMenuItems;
        }

        // Menu khusus untuk alumni/lulus
        if (isAlumni) {
          return [
            { id: 'dashboard', label: t('sidebar.dashboard'), icon: Home },
            { id: 'mata-pelajaran', label: t('sidebar.mataPelajaran'), icon: BookOpen },
            { id: 'qr-code', label: t('sidebar.qrCodeSaya'), icon: QrCode },
            { id: 'e-raport-saya', label: t('sidebar.eRaport'), icon: FileText },
            {
              id: 'laporan-nilai',
              label: t('sidebar.laporanNilai'),
              icon: ClipboardList,
              subItems: [
                { id: 'nilai-saya', label: t('sidebar.nilaiSaya'), icon: FileText },
                { id: 'raport-saya', label: t('sidebar.raportSaya'), icon: GraduationCap },
              ]
            },
            ...((() => {
              // Check if logged-in alumni is a santri (exists in santri array and has a tahfiz class)
              if (!user?.id) return [];
              const isSantriUser = santri.some(s => s.id === user.id);
              if (!isSantriUser) return [];
              
              // Check if santri has at least one tahfiz class
              const hasTahfizClass = kelasTahfiz.some(cls => cls.santriIds.includes(user.id));
              if (!hasTahfizClass) return [];

              return [{
                id: 'tahfiz-quran-murid',
                label: t('sidebar.tahfizQuran'),
                icon: BookOpen,
                subItems: [
                  { id: 'jadwal-tahfiz-murid', label: t('sidebar.jadwalTahfiz'), icon: CalendarClock },
                  { id: 'absensi-santri-tahfiz', label: t('sidebar.absensiTahfiz'), icon: ClipboardList },
                  { id: 'progress-hapalan-murid', label: t('sidebar.progressHapalan'), icon: BarChart3 },
                ]
              }];
            })()),
            { id: 'profil', label: t('sidebar.profil'), icon: UserIcon },
          ];
        }

        // Menu untuk murid aktif
        const muridMenuItems: MenuItem[] = [
          { id: 'dashboard', label: t('sidebar.dashboard'), icon: Home },
        ];
        
        // For tahfiz system, show limited menus (only for santri)
        if (systemType === 'tahfiz') {
          // Check if logged-in user is a santri (exists in santri array and has a tahfiz class)
          if (user?.id) {
            const isSantriUser = santri.some(s => s.id === user.id);
            const hasTahfizClass = kelasTahfiz.some(cls => cls.santriIds.includes(user.id));
            
            if (isSantriUser && hasTahfizClass) {
              muridMenuItems.push(
                { id: 'qr-code', label: t('sidebar.qrCodeSaya'), icon: QrCode },
                {
                  id: 'tahfiz-quran-murid',
                  label: t('sidebar.tahfizQuran'),
                  icon: BookOpen,
                  subItems: [
                    { id: 'jadwal-tahfiz-murid', label: t('sidebar.jadwalTahfiz'), icon: CalendarClock },
                    { id: 'absensi-santri-tahfiz', label: t('sidebar.absensiTahfiz'), icon: ClipboardList },
                    { id: 'progress-hapalan-murid', label: t('sidebar.progressHapalan'), icon: BarChart3 },
                  ]
                },
                { id: 'absen-kehadiran', label: t('sidebar.absenKehadiran'), icon: UserCheck },
                { id: 'surat-izin', label: t('sidebar.pengajuanIzin'), icon: FileText },
                { id: 'profil', label: t('sidebar.profil'), icon: UserIcon }
              );
              return muridMenuItems;
            }
          }
          // If not santri in tahfiz system, return empty or minimal menu
          return muridMenuItems;
        }
        
        // For sekolah_umum and sekolah_umum_tahfiz, show general menus
        muridMenuItems.push(
          { id: 'jadwal', label: t('sidebar.jadwalKelas'), icon: Calendar },
          { id: 'mata-pelajaran', label: t('sidebar.mataPelajaran'), icon: BookOpen },
          {
            id: 'kelola-absen',
            label: t('sidebar.kelolaAbsen'),
            icon: School,
            subItems: [
              { id: 'absensi-saya', label: t('sidebar.absensiSaya'), icon: ClipboardList },
              { id: 'absen-kehadiran', label: t('sidebar.absenKehadiran'), icon: UserCheck },
            ]
          },
          ...(isCbtEnabled ? [{
            id: 'cbt-ujian',
            label: t('sidebar.ujianCBT') || 'Ujian CBT',
            icon: ClipboardList
          }] : []),
          { id: 'qr-code', label: t('sidebar.qrCodeSaya'), icon: QrCode },
          {
            id: 'laporan-nilai',
            label: t('sidebar.laporanNilai'),
            icon: ClipboardList,
            subItems: [
              { id: 'nilai-saya', label: t('sidebar.nilaiSaya'), icon: FileText },
              { id: 'raport-saya', label: t('sidebar.raportSaya'), icon: GraduationCap },
              { id: 'e-raport-saya', label: t('sidebar.eRaport'), icon: FileText },
            ]
          }
        );

        // Only show tahfiz menu if systemType is sekolah_umum_tahfiz
        if (systemType === 'sekolah_umum_tahfiz') {
          const tahfizMenu = (() => {
            // Check if logged-in user is a santri (exists in santri array and has a tahfiz class)
            if (!user?.id) return null;
            const isSantriUser = santri.some(s => s.id === user.id);
            if (!isSantriUser) return null;
            
            // Check if santri has at least one tahfiz class
            const hasTahfizClass = kelasTahfiz.some(cls => cls.santriIds.includes(user.id));
            if (!hasTahfizClass) return null;

            return {
              id: 'tahfiz-quran-murid',
              label: t('sidebar.tahfizQuran'),
              icon: BookOpen,
              subItems: [
                { id: 'jadwal-tahfiz-murid', label: t('sidebar.jadwalTahfiz'), icon: CalendarClock },
                { id: 'absensi-santri-tahfiz', label: t('sidebar.absensiTahfiz'), icon: ClipboardList },
                { id: 'progress-hapalan-murid', label: t('sidebar.progressHapalan'), icon: BarChart3 },
              ]
            };
          })();
          
          if (tahfizMenu) {
            muridMenuItems.push(tahfizMenu);
          }
        }

        muridMenuItems.push(
          ...((() => {
            const muridUser = users.find(u => u.id === user?.id);
            const muridKelas = kelas.find(k => k.id === (muridUser as any)?.kelasId);
            const activePengumuman = pengumumanKelulusan.find(p => p.isPublished && p.tahunAjaran === activeTahunAjaran?.tahun);

            return (muridKelas && isMaxTingkatSync(muridKelas.tingkat) && activePengumuman !== undefined && activeTahunAjaran?.semester === 2) ?
              [{ id: 'info-kelulusan-murid', label: t('sidebar.infoKelulusan'), icon: GraduationCap }] : [];
          })()),
          { id: 'surat-izin', label: t('sidebar.pengajuanIzin'), icon: FileText },
          { id: 'profil', label: t('sidebar.profil'), icon: UserIcon }
        );

        return muridMenuItems;
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
        w-96 max-w-[28rem] bg-white shadow-lg h-screen fixed left-0 top-0 z-[70] transform transition-transform duration-300 ease-in-out
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

        <h1 className="text-md sm:text-lg font-bold text-gray-800 leading-snug line-clamp-2 break-words">
          {profilSekolah.namaSekolah || t('sidebar.absensiSekolah')}
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
        <h1 className="text-xl font-bold text-gray-800">{t('sidebar.absensiSekolah')}</h1>
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
          <span className="font-medium">{t('sidebar.logout')}</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;