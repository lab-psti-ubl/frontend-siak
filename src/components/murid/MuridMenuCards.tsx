import React, { useState } from 'react';
import {
  Calendar,
  ClipboardList,
  FileText,
  QrCode,
  BookOpen,
  GraduationCap,
  User,
  BarChart3,
  Award,
  ChevronDown,
  ChevronUp,
  BookMarked,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlumni } from '../../hooks/useAlumni';
import { useMurid } from '../../hooks/useMurid';
import { useKelas } from '../../hooks/useKelas';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { usePengumumanKelulusan } from '../../hooks/usePengumumanKelulusan';
import { useSantri } from '../../hooks/useSantri';
import { useKelasTahfiz } from '../../hooks/useKelasTahfiz';
import { usePengaturanSistem } from '../../hooks/usePengaturanSistem';
import { User as UserType, Kelas, PengumumanKelulusan, TahunAjaran, Alumni } from '../../types';
import { isMaxTingkatSync } from '../../utils/jenjangPendidikanUtils';
import { isMuridAlumni } from '../../utils/alumniStatusUtils';
import { getStudentTerm } from '../../utils/terminologyUtils';
import { useLanguage } from '../../context/LanguageContext';

interface MenuCard {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  route: string;
}

const MuridMenuCards: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { activeTahunAjaran } = useTahunAjaran();
  const { pengumumanKelulusan } = usePengumumanKelulusan();
  const { alumni } = useAlumni();
  const { santri } = useSantri();
  const { kelasTahfiz } = useKelasTahfiz();
  const { systemType, cbtEnabled } = usePengaturanSistem();
  const [showAllCards, setShowAllCards] = useState(false);
  const { t } = useLanguage();

  const studentTerm = getStudentTerm(systemType);
  const isTahfizSystem = systemType === 'tahfiz';
  const isSekolahUmumTahfiz = systemType === 'sekolah_umum_tahfiz';
  // Default ke false saat belum ada nilai, supaya kartu CBT tidak sempat muncul sebentar
  const isCbtEnabled = cbtEnabled === true;

  const isAlumni = isMuridAlumni(user, alumni);
  
  // Check if user is a santri (either from murid or standalone)
  const santriUser = user?.id ? santri.find(s => s.id === user.id) : null;
  const isSantri = !!santriUser;
  const isSantriNotFromMurid = santriUser && (santriUser as any).isFromMurid === false;
  
  // Get tahfiz classes for this santri
  const myTahfizClasses = isSantri && user?.id
    ? kelasTahfiz.filter(cls => cls.santriIds.includes(user.id))
    : [];
  
  // Show tahfiz menu if user is a santri (standalone or from murid) and has tahfiz classes
  const shouldShowTahfizMenu = isSantri && myTahfizClasses.length > 0;

  const shouldShowInfoKelulusan = (() => {
    if (!user) return false;

    const muridUser = murid.find(u => u.id === user.id);
    const muridKelas = kelas.find(k => k.id === (muridUser as any)?.kelasId);
    const activePengumuman = pengumumanKelulusan.find(p =>
      p.isPublished && p.tahunAjaran === activeTahunAjaran?.tahun
    );

    return (
      muridKelas && isMaxTingkatSync(muridKelas.tingkat) &&
      activePengumuman !== undefined &&
      activeTahunAjaran?.semester === 2
    );
  })();

  // Menu khusus untuk alumni
  const alumniMenuCards: MenuCard[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-slate-600 to-slate-700',
      route: '/dashboard',
    },
    
    {
      id: 'qr-code',
      label: t('muridMenu.qrCodeSaya') || 'QR Code Saya',
      icon: QrCode,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-green-600 to-green-700',
      route: '/dashboard/qr-code',
    },
    {
      id: 'nilai',
      label: t('muridMenu.nilai') || 'Nilai Saya',
      icon: BarChart3,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
      route: '/dashboard/nilai-saya',
    },
    {
      id: 'raport',
      label: t('muridMenu.raport') || 'Laporan Hasil Belajar',
      icon: GraduationCap,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      route: '/dashboard/raport-saya',
    },
    {
      id: 'e-raport',
      label: t('muridMenu.eRaport') || 'E-Raport',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-violet-600 to-violet-700',
      route: '/dashboard/e-raport-saya',
    },
    {
      id: 'profil',
      label: t('muridMenu.profil') || 'Profil',
      icon: User,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-600 to-amber-700',
      route: '/dashboard/profil',
    },
  ];

  // Menu khusus untuk santri yang bukan dari murid (sesuai sidebar)
  const santriNotFromMuridMenuCards: MenuCard[] = (() => {
    const baseCards: MenuCard[] = [
      {
        id: 'qr-code',
        label: t('muridMenu.qrCodeSaya') || 'QR Code Saya',
        icon: QrCode,
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-green-600 to-green-700',
        route: '/dashboard/qr-code',
      },
    ];

    // Tambahkan menu tahfiz jika memiliki kelas tahfiz
    if (myTahfizClasses.length > 0) {
      baseCards.push(
        {
          id: 'jadwal-tahfiz',
          label: t('muridMenu.jadwalTahfiz') || 'Jadwal Tahfiz',
          icon: Calendar,
          color: 'text-white',
          bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
          route: '/dashboard/jadwal-tahfiz-murid',
        },
        {
          id: 'absensi-santri-tahfiz',
          label: t('muridMenu.absensiSantri') || 'Absensi Santri',
          icon: ClipboardList,
          color: 'text-white',
          bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
          route: '/dashboard/absensi-santri-tahfiz',
        },
        {
          id: 'absen-kehadiran',
          label: t('muridMenu.absenKehadiran') || 'Absen Kehadiran',
          icon: FileText,
          color: 'text-white',
          bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700',
          route: '/dashboard/absen-kehadiran',
        },
        {
          id: 'progress-hapalan',
          label: t('muridMenu.progressHapalan') || 'Progress Hapalan',
          icon: BookMarked,
          color: 'text-white',
          bgColor: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
          route: '/dashboard/progress-hapalan-murid',
        }
      );
    }

    // Tambahkan menu umum
    baseCards.push(
      {
        id: 'izin',
        label: t('muridMenu.pengajuanIzin') || 'Pengajuan Izin',
        icon: FileText,
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-red-600 to-red-700',
        route: '/dashboard/surat-izin',
      },
      {
        id: 'profil',
        label: t('muridMenu.profil') || 'Profil',
        icon: User,
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-amber-600 to-amber-700',
        route: '/dashboard/profil',
      }
    );

    return baseCards;
  })();

  // Menu khusus untuk sistem tahfiz (hanya untuk santri yang memiliki kelas tahfiz)
  const tahfizSystemMenuCards: MenuCard[] = [
    {
      id: 'qr-code',
      label: t('muridMenu.qrCodeSaya') || 'QR Code Saya',
      icon: QrCode,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-green-600 to-green-700',
      route: '/dashboard/qr-code',
    },
    {
      id: 'jadwal-tahfiz',
      label: t('muridMenu.jadwalTahfiz') || 'Jadwal Tahfiz',
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      route: '/dashboard/jadwal-tahfiz-murid',
    },
    {
      id: 'absensi-santri-tahfiz',
      label: t('muridMenu.absensiSantri') || 'Absensi Santri',
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
      route: '/dashboard/absensi-santri-tahfiz',
    },
    {
      id: 'absen-kehadiran',
      label: t('muridMenu.absenKehadiran') || 'Absen Kehadiran',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700',
      route: '/dashboard/absen-kehadiran',
    },
    {
      id: 'progress-hapalan',
      label: t('muridMenu.progressHapalan') || 'Progress Hapalan',
      icon: BookMarked,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
      route: '/dashboard/progress-hapalan-murid',
    },
    {
      id: 'izin',
      label: t('muridMenu.pengajuanIzin') || 'Pengajuan Izin',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-red-600 to-red-700',
      route: '/dashboard/surat-izin',
    },
    {
      id: 'profil',
      label: t('muridMenu.profil') || 'Profil',
      icon: User,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-600 to-amber-700',
      route: '/dashboard/profil',
    },
  ];

  // Menu Tahfiz untuk Santri (yang juga murid - untuk ditambahkan ke menu murid)
  const tahfizMenuCards: MenuCard[] = [
    {
      id: 'jadwal-tahfiz',
      label: t('muridMenu.jadwalTahfiz') || 'Jadwal Tahfiz',
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      route: '/dashboard/jadwal-tahfiz-murid',
    },
    {
      id: 'absensi-santri-tahfiz',
      label: t('muridMenu.absensiSantri') || 'Absensi Santri',
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
      route: '/dashboard/absensi-santri-tahfiz',
    },
    {
      id: 'absen-kehadiran',
      label: t('muridMenu.absenKehadiran') || 'Absen Kehadiran',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700',
      route: '/dashboard/absen-kehadiran',
    },
    {
      id: 'progress-hapalan',
      label: t('muridMenu.progressHapalan') || 'Progress Hapalan',
      icon: BookMarked,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
      route: '/dashboard/progress-hapalan-murid',
    },
  ];

  // Menu untuk murid aktif
  const baseMenuCards: MenuCard[] = [
    {
      id: 'jadwal',
      label: t('muridMenu.jadwal') || 'Jadwal',
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-purple-600 to-purple-700',
      route: '/dashboard/jadwal',
    },
    {
      id: 'absensi',
      label: t('muridMenu.absensi') || 'Absensi',
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-orange-600 to-orange-700',
      route: '/dashboard/absensi-saya',
    },
    {
      id: 'riwayat',
      label: t('muridMenu.kehadiran') || 'Kehadiran',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700',
      route: '/dashboard/absen-kehadiran',
    },
    {
      id: 'nilai',
      label: t('muridMenu.nilai') || 'Nilai',
      icon: BarChart3,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
      route: '/dashboard/nilai-saya',
    },
    ...(isCbtEnabled ? [{
      id: 'cbt-ujian',
      label: t('muridMenu.ujianCBT') || 'Ujian CBT',
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      route: '/dashboard/cbt-ujian',
    }] : []),
    {
      id: 'qr-code',
      label: t('muridMenu.qrCodeSaya') || 'QR Code',
      icon: QrCode,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-green-600 to-green-700',
      route: '/dashboard/qr-code',
    },
    {
      id: 'mata-pelajaran',
      label: t('muridMenu.mataPelajaran') || 'Mata Pelajaran',
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-pink-600 to-pink-700',
      route: '/dashboard/mata-pelajaran',
    },
    {
      id: 'raport',
      label: t('muridMenu.raport') || 'Laporan Hasil Belajar',
      icon: GraduationCap,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      route: '/dashboard/raport-saya',
    },
    {
      id: 'e-raport',
      label: t('muridMenu.eRaport') || 'E-Raport',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-violet-600 to-violet-700',
      route: '/dashboard/e-raport-saya',
    },
    {
      id: 'izin',
      label: t('muridMenu.pengajuanIzin') || 'Pengajuan Izin',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-red-600 to-red-700',
      route: '/dashboard/surat-izin',
    },
    {
      id: 'profil',
      label: t('muridMenu.profil') || 'Profil',
      icon: User,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-600 to-amber-700',
      route: '/dashboard/profil',
    },
  ];

  // Untuk sistem tahfiz, hanya tampilkan menu tahfiz jika user adalah santri dengan kelas tahfiz
  if (isTahfizSystem && !isSekolahUmumTahfiz) {
    if (shouldShowTahfizMenu) {
      const finalMenuCards = tahfizSystemMenuCards;
      const displayedCards = showAllCards ? finalMenuCards : finalMenuCards.slice(0, 8);
      const hasMoreCards = finalMenuCards.length > 8;

      return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              {t('muridMenu.headerTitle') || 'Menu Utama'}
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              {t('muridMenu.headerSubtitle') || 'Akses semua fitur dengan mudah'}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5">
              {displayedCards.map(card => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    onClick={() => navigate(card.route)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
                  >
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl ${card.bgColor} shadow-lg group-hover:shadow-xl transition-shadow duration-200 flex items-center justify-center`}>
                      <Icon size={28} className=" text-white" />
                    </div>
                    <span className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 text-center line-clamp-2">
                      {card.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {hasMoreCards && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowAllCards(!showAllCards)}
                  className="flex items-center gap-2 px-6 py-3 text-slate-900 font-semibold rounded-lg hover:from-slate-300 hover:to-slate-400 transition-all duration-200 hover:shadow-md active:scale-95"
                >
                  {showAllCards ? (
                    <>
                      {t('muridMenu.showLess') || 'Tampilkan Lebih Sedikit'}
                      <ChevronUp size={20} />
                    </>
                  ) : (
                    <>
                      {t('muridMenu.showMore') || 'Lihat Lainnya'} ({finalMenuCards.length - 8})
                      <ChevronDown size={20} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Jika sistem tahfiz tapi bukan santri, tampilkan menu kosong atau minimal
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              {t('muridMenu.headerTitle') || 'Menu Utama'}
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              {t('muridMenu.headerSubtitle') || 'Akses semua fitur dengan mudah'}
            </p>
          </div>
          <div className="p-6">
            <p className="text-center text-slate-500">
              {t('muridMenu.noMenu') || 'Tidak ada menu yang tersedia'}
            </p>
          </div>
        </div>
      );
    }
  }

  // Jika santri yang bukan dari murid, gunakan menu khusus santri saja
  if (isSantriNotFromMurid) {
    const finalMenuCards = santriNotFromMuridMenuCards;
    const displayedCards = showAllCards ? finalMenuCards : finalMenuCards.slice(0, 8);
    const hasMoreCards = finalMenuCards.length > 8;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">
            {t('muridMenu.headerTitle') || 'Menu Utama'}
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            {t('muridMenu.headerSubtitle') || 'Akses semua fitur dengan mudah'}
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5">
            {displayedCards.map(card => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => navigate(card.route)}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl ${card.bgColor} shadow-lg group-hover:shadow-xl transition-shadow duration-200 flex items-center justify-center`}>
                    <Icon size={28} className=" text-white" />
                  </div>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 text-center line-clamp-2">
                    {card.label}
                  </span>
                </button>
              );
            })}
          </div>

          {hasMoreCards && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowAllCards(!showAllCards)}
                className="flex items-center gap-2 px-6 py-3 text-slate-900 font-semibold rounded-lg hover:from-slate-300 hover:to-slate-400 transition-all duration-200 hover:shadow-md active:scale-95"
              >
                {showAllCards ? (
                  <>
                    {t('muridMenu.showLess') || 'Tampilkan Lebih Sedikit'}
                    <ChevronUp size={20} />
                  </>
                ) : (
                  <>
                    {t('muridMenu.showMore') || 'Lihat Lainnya'} ({finalMenuCards.length - 8})
                    <ChevronDown size={20} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const menuCards = isAlumni
    ? alumniMenuCards
    : (shouldShowInfoKelulusan
      ? [
          ...baseMenuCards,
          {
            id: 'info-kelulusan',
            label: t('muridMenu.infoKelulusan') || 'Info Kelulusan',
            icon: Award,
            color: 'text-white',
            bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
            route: '/dashboard/info-kelulusan-murid',
          },
        ]
      : baseMenuCards);

  // Add tahfiz menu cards if user is a santri (yang juga murid)
  // Untuk sistem sekolah_umum_tahfiz, tambahkan menu tahfiz jika user adalah santri dengan kelas tahfiz
  const finalMenuCards = isSekolahUmumTahfiz
    ? (shouldShowTahfizMenu && !isSantriNotFromMurid
        ? [...tahfizMenuCards, ...menuCards]
        : menuCards)
    : (shouldShowTahfizMenu && !isSantriNotFromMurid
        ? [...tahfizMenuCards, ...menuCards]
        : menuCards);

  const displayedCards = showAllCards ? finalMenuCards : finalMenuCards.slice(0, 8);
  const hasMoreCards = finalMenuCards.length > 8;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">
          {t('muridMenu.headerTitle') || 'Menu Utama'}
        </h3>
        <p className="text-sm text-slate-600 mt-0.5">
          {t('muridMenu.headerSubtitle') || 'Akses semua fitur dengan mudah'}
        </p>
      </div>

      <div className="p-6">
        
        {/* 🔧 GRID MOBILE DIPERBAIKI */}
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5">
          {displayedCards.map(card => {
            const Icon = card.icon;

            return (
              <button
                key={card.id}
                onClick={() => navigate(card.route)}
                className="group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
              >
                {/* 🔧 UKURAN ICON CARD MOBILE DIPERBAIKI */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl ${card.bgColor} shadow-lg group-hover:shadow-xl transition-shadow duration-200 flex items-center justify-center`}>
                  <Icon size={28} className=" text-white" />
                </div>

                {/* TEXT LABEL DIPERKECIL UNTUK MOBILE */}
                <span className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 text-center line-clamp-2">
                  {card.label}
                </span>
              </button>
            );
          })}
        </div>

        {hasMoreCards && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowAllCards(!showAllCards)}
              className="flex items-center gap-2 px-6 py-3 text-slate-900 font-semibold rounded-lg hover:from-slate-300 hover:to-slate-400 transition-all duration-200 hover:shadow-md active:scale-95"
            >
              {showAllCards ? (
                <>
                  {t('muridMenu.showLess') || 'Tampilkan Lebih Sedikit'}
                  <ChevronUp size={20} />
                </>
              ) : (
                <>
                  {t('muridMenu.showMore') || 'Lihat Lainnya'} ({finalMenuCards.length - 8})
                  <ChevronDown size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MuridMenuCards;
