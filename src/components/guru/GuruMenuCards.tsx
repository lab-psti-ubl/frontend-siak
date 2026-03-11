import React, { useState } from 'react';
import {
  Calendar,
  ClipboardList,
  FileText,
  QrCode,
  BookOpen,
  School,
  GraduationCap,
  Settings,
  User,
  BarChart3,
  Award,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Eye,
  Trophy,
  Users,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useIzinGuru } from '../../hooks/useIzinGuru';
import { useGurus } from '../../hooks/useGurus';
import { useKelas } from '../../hooks/useKelas';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { usePengumumanKelulusan } from '../../hooks/usePengumumanKelulusan';
import { useRiwayatWaliKelasData } from '../../hooks/useRiwayatWaliKelasData';
import { useUstadz } from '../../hooks/useUstadz';
import { usePengaturanSistem } from '../../hooks/usePengaturanSistem';
import { useCBTSoalInputAssignments } from '../../hooks/useCBTSoalInputAssignments';
import { User as UserType, Kelas, TahunAjaran, IzinGuru } from '../../types';
import { isMaxTingkatSync } from '../../utils/jenjangPendidikanUtils';
import { getTeacherTerm } from '../../utils/terminologyUtils';
import { getTodayIndonesia, getCurrentTimeIndonesia } from '../../utils/absensiUtils';
import { useLanguage } from '../../context/LanguageContext';

interface MenuCard {
  id: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  route: string;
}

interface MenuSection {
  title: string;
  cards: MenuCard[];
}

const GuruMenuCards: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gurus } = useGurus();
  const { kelas } = useKelas();
  const { activeTahunAjaran } = useTahunAjaran();
  const { pengumumanKelulusan } = usePengumumanKelulusan();
  const { izinGuru } = useIzinGuru();
  const { riwayatWaliKelas: riwayatWaliKelasData } = useRiwayatWaliKelasData();
  const { ustadz } = useUstadz();
  const { systemType, cbtEnabled } = usePengaturanSistem();
  const [showAllCards, setShowAllCards] = useState(false);
  const { t } = useLanguage();
  
  const teacherTerm = getTeacherTerm(systemType);
  const isTahfizSystem = systemType === 'tahfiz';
  const isSekolahUmumTahfiz = systemType === 'sekolah_umum_tahfiz';
  // Default ke false saat belum ada nilai, supaya kartu CBT tidak sempat muncul sebentar
  const isCbtEnabled = cbtEnabled === true;
  const { assignments: cbtInputAssignments } = useCBTSoalInputAssignments({
    enabled: isCbtEnabled && user?.role === 'guru',
  });

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

  const hasRiwayatWaliKelas = riwayatWaliKelasData.some((r: any) => r.guruId === user?.id);

  const isUstadz = ustadz.some((u) => u.id === user?.id);

  const shouldShowInfoKelulusan = (() => {
    if (!user?.isWaliKelas) return false;
    const guruUser = gurus.find(u => u.id === user.id);
    const guruKelas = kelas.find(k => k.id === (guruUser as any)?.kelasWali);
    const activePengumuman = pengumumanKelulusan.find(p => p.isPublished && p.tahunAjaran === activeTahunAjaran?.tahun);
    return guruKelas && isMaxTingkatSync(guruKelas.tingkat) && activePengumuman !== undefined && activeTahunAjaran?.semester === 2;
  })();

  const mengajarCards: MenuCard[] = [
    {
      id: 'jadwal-saya',
      label: t('guruMenu.jadwalSaya') || 'Jadwal Saya',
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700',
      route: '/dashboard/jadwal-saya',
    },
    {
      id: 'kelola-absensi',
      label: t('guruMenu.kelolaAbsensi') || 'Kelola Absensi',
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-orange-600 to-orange-700',
      route: '/dashboard/absensi',
    },
    {
      id: 'input-nilai',
      label: t('guruMenu.inputNilai') || 'Input Nilai',
      icon: BarChart3,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
      route: '/dashboard/input-nilai',
    },
    {
      id: 'capaian-pembelajaran',
      label: t('guruMenu.capaianPembelajaran') || 'Capaian Pembelajaran',
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      route: '/dashboard/capaian-pembelajaran',
    },
    {
      id: 'riwayat-absensi',
      label: t('guruMenu.riwayatAbsensi') || 'Riwayat Absensi',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-green-600 to-green-700',
      route: '/dashboard/riwayat-absensi',
    },
  ];

  const cbtCards: MenuCard[] = [
    ...(cbtInputAssignments.length > 0 ? [{
      id: 'cbt-bank-soal-utsuas',
      label: 'Bank Soal UTS/UAS',
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-violet-600 to-violet-700',
      route: '/dashboard/cbt-bank-soal-utsuas',
    }] : []),
    {
      id: 'cbt-bank-soal',
      label: (t('guruMenu.bankSoalCBT') || t('sidebar.bankSoalCBT')) ?? 'Bank Soal CBT',
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      route: '/dashboard/cbt-bank-soal',
    },
    {
      id: 'cbt-buat-ujian',
      label: (t('guruMenu.buatUjianCBT') || t('sidebar.buatUjianCBT')) ?? 'Buat Ujian CBT',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      route: '/dashboard/cbt-buat-ujian',
    },
  ];

  const baseMenuCards: MenuCard[] = [
    {
      id: 'absen-guru',
      label: isTahfizSystem ? t('guruMenu.absenSaya') : t('guruMenu.absen'),
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-purple-600 to-purple-700',
      route: '/dashboard/absen-guru',
    },
    ...(isSekolahUmumTahfiz ? [{
      id: 'absen-siswa',
      label: t('guruMenu.absenSantri'),
      icon: UserCheck,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      route: '/dashboard/absen-siswa',
    }] : []),
    {
      id: 'izin-guru',
      label: t('guruMenu.pengajuanIzin'),
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-red-600 to-red-700',
      route: '/dashboard/izin-guru',
    },
    ...(activeIzinForSubstitute ? [{
      id: 'pengganti',
      label: t('guruMenu.pengganti') || 'Pengganti',
      icon: Briefcase,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
      route: '/dashboard/pengganti',
    }] : []),
    {
      id: 'profil',
      label: t('guruMenu.profil'),
      icon: User,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-600 to-amber-700',
      route: '/dashboard/profil',
    },
  ];

  const waliKelasCards: MenuCard[] = [
    {
      id: 'absen-kelas',
      label: t('guruMenu.absenKelas'),
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      route: '/dashboard/absen-kelas',
    },
    {
      id: 'data-murid-kelas',
      label: t('guruMenu.dataMuridKelas'),
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-pink-600 to-pink-700',
      route: '/dashboard/data-murid-kelas',
    },
    {
      id: 'murid-kelas',
      label: t('guruMenu.absenPelajaran'),
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-rose-600 to-rose-700',
      route: '/dashboard/murid-kelas',
    },
    {
      id: 'nilai-kelas',
      label: t('guruMenu.nilaiKelas'),
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-sky-600 to-sky-700',
      route: '/dashboard/nilai-kelas',
    },
    {
      id: 'nilai-ekstrakulikuler',
      label: t('guruMenu.nilaiEkstrakurikuler'),
      icon: Trophy,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-yellow-600 to-yellow-700',
      route: '/dashboard/nilai-ekstrakulikuler-kelas',
    },
    {
      id: 'kokulikuler',
      label: t('guruMenu.kokulikuler'),
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-purple-600 to-pink-500',
      route: '/dashboard/kokulikuler',
    },
    {
      id: 'surat-izin',
      label: t('guruMenu.suratIzin'),
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-lime-600 to-lime-700',
      route: '/dashboard/surat-izin',
    },
    {
      id: 'jadwal-kelas',
      label: t('guruMenu.jadwalPelajaranKelas'),
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-violet-600 to-violet-700',
      route: '/dashboard/jadwal-kelas',
    },
    {
      id: 'raport-murid',
      label: t('guruMenu.raportMurid'),
      icon: GraduationCap,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-fuchsia-600 to-fuchsia-700',
      route: '/dashboard/raport-murid',
    },
    {
      id: 'e-raport',
      label: t('guruMenu.nilaiERaport'),
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
      route: '/dashboard/e-raport',
    },
    ...(shouldShowInfoKelulusan ? [{
      id: 'info-kelulusan',
      label: t('guruMenu.infoKelulusan'),
      icon: Award,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      route: '/dashboard/info-kelulusan',
    }] : []),
  ];

  const tahfizQuranCards: MenuCard[] = [
    {
      id: 'data-santri-tahfiz-guru',
      label: t('guruMenu.tahfizDataSantri'),
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      route: '/dashboard/data-santri-tahfiz-guru',
    },
    {
      id: 'jadwal-tahfiz-guru',
      label: t('guruMenu.tahfizJadwal'),
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
      route: '/dashboard/jadwal-tahfiz-guru',
    },
    {
      id: 'absensi-tahfiz',
      label: t('guruMenu.tahfizAbsensi'),
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-red-600 to-red-800',
      route: '/dashboard/absensi-tahfiz',
    },
    {
      id: 'riwayat-absensi-tahfiz',
      label: t('guruMenu.tahfizRiwayatAbsensi'),
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-orange-600 to-orange-700',
      route: '/dashboard/riwayat-absensi-tahfiz',
    },
    {
      id: 'progress-tahfiz',
      label: t('guruMenu.tahfizProgress'),
      icon: BarChart3,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-violet-600 to-violet-700',
      route: '/dashboard/progress-tahfiz',
    },
    {
      id: 'izin-santri-tahfiz',
      label: t('guruMenu.tahfizIzinSantri'),
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-pink-600 to-pink-700',
      route: '/dashboard/izin-santri-tahfiz',
    },
  ];

  const riwayatCards: MenuCard[] = [
    {
      id: 'riwayat-wali-kelas',
      label: t('guruMenu.riwayatWaliKelas'),
      icon: GraduationCap,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-slate-600 to-slate-700',
      route: '/dashboard/riwayat-wali-kelas',
    },
    {
      id: 'riwayat-kelulusan',
      label: t('guruMenu.riwayatKelulusan'),
      icon: Award,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-zinc-600 to-zinc-700',
      route: '/dashboard/riwayat-kelulusan',
    },
  ];

  // Untuk sistem tahfiz, hanya tampilkan menu dasar dan tahfiz
  // Tambahkan menu absensi tahfiz dan absensi murid ke base menu jika ustadz untuk memastikan tetap tersedia
  const baseDisplayCards = isTahfizSystem 
    ? (isUstadz 
        ? [...baseMenuCards, {
            id: 'absen-siswa',
            label: t('guruMenu.absensiMurid'),
            icon: UserCheck,
            color: 'text-white',
            bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
            route: '/dashboard/absen-siswa',
          }, {
            id: 'absensi-tahfiz',
            label: t('guruMenu.tahfizAbsensi'),
            icon: ClipboardList,
            color: 'text-white',
            bgColor: 'bg-gradient-to-br from-red-600 to-red-800',
            route: '/dashboard/absensi-tahfiz',
          }]
        : baseMenuCards)
    : isSekolahUmumTahfiz
    ? [...mengajarCards, ...baseMenuCards]
    : [...mengajarCards, ...baseMenuCards];

  const sections: MenuSection[] = isTahfizSystem
    ? [
        ...(isUstadz ? [{
          title: t('guruMenu.sectionTahfizQuran'),
          cards: tahfizQuranCards,
        }] : []),
      ]
    : isSekolahUmumTahfiz
    ? [
        {
          title: t('guruMenu.sectionMengajar'),
          cards: mengajarCards,
        },
        ...(isCbtEnabled ? [{
          title: t('guruMenu.sectionKelolaCBT') || t('sidebar.kelolaCBT') || 'Kelola CBT',
          cards: cbtCards,
        }] : []),
        ...(user?.isWaliKelas ? [{
          title: t('guruMenu.sectionWaliKelas'),
          cards: waliKelasCards,
        }] : []),
        ...(isUstadz ? [{
          title: t('guruMenu.sectionTahfizQuran'),
          cards: tahfizQuranCards,
        }] : []),
        ...(hasRiwayatWaliKelas ? [{
          title: t('guruMenu.sectionRiwayat'),
          cards: riwayatCards,
        }] : []),
      ]
    : [
        {
          title: t('guruMenu.sectionMengajar'),
          cards: mengajarCards,
        },
        ...(isCbtEnabled ? [{
          title: t('guruMenu.sectionKelolaCBT') || t('sidebar.kelolaCBT') || 'Kelola CBT',
          cards: cbtCards,
        }] : []),
        ...(user?.isWaliKelas ? [{
          title: t('guruMenu.sectionWaliKelas'),
          cards: waliKelasCards,
        }] : []),
        ...(isUstadz ? [{
          title: t('guruMenu.sectionTahfizQuran'),
          cards: tahfizQuranCards,
        }] : []),
        ...(hasRiwayatWaliKelas ? [{
          title: t('guruMenu.sectionRiwayat'),
          cards: riwayatCards,
        }] : []),
      ];

  const sectionsForExpanded: MenuSection[] = isTahfizSystem
    ? [
        ...(isUstadz ? [{
          title: t('guruMenu.sectionTahfizQuran'),
          cards: tahfizQuranCards,
        }] : []),
      ]
    : isSekolahUmumTahfiz
    ? [
        ...(isCbtEnabled ? [{
          title: t('guruMenu.sectionKelolaCBT') || t('sidebar.kelolaCBT') || 'Kelola CBT',
          cards: cbtCards,
        }] : []),
        ...(user?.isWaliKelas ? [{
          title: t('guruMenu.sectionWaliKelas'),
          cards: waliKelasCards,
        }] : []),
        ...(isUstadz ? [{
          title: t('guruMenu.sectionTahfizQuran'),
          cards: tahfizQuranCards,
        }] : []),
        ...(hasRiwayatWaliKelas ? [{
          title: t('guruMenu.sectionRiwayat'),
          cards: riwayatCards,
        }] : []),
      ]
    : [
        ...(isCbtEnabled ? [{
          title: t('guruMenu.sectionKelolaCBT') || t('sidebar.kelolaCBT') || 'Kelola CBT',
          cards: cbtCards,
        }] : []),
        ...(user?.isWaliKelas ? [{
          title: t('guruMenu.sectionWaliKelas'),
          cards: waliKelasCards,
        }] : []),
        ...(isUstadz ? [{
          title: t('guruMenu.sectionTahfizQuran'),
          cards: tahfizQuranCards,
        }] : []),
        ...(hasRiwayatWaliKelas ? [{
          title: t('guruMenu.sectionRiwayat'),
          cards: riwayatCards,
        }] : []),
      ];

  const shouldShowMoreButton = sectionsForExpanded.length > 0;

  const renderMenuCards = (cards: MenuCard[]) => {
    return (
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5">
        {cards.map(card => {
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
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">{t('guruMenu.headerTitle')}</h3>
        <p className="text-sm text-slate-600 mt-0.5">{t('guruMenu.headerSubtitle')}</p>
      </div>

      <div className="p-6 space-y-8">
        {showAllCards ? (
          <>
            <div>
              {renderMenuCards(baseDisplayCards)}
            </div>
            {sectionsForExpanded.map((section, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-200">
                  {section.title}
                </h4>
                {renderMenuCards(section.cards)}
              </div>
            ))}
          </>
        ) : (
          renderMenuCards(baseDisplayCards)
        )}

        {shouldShowMoreButton && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowAllCards(!showAllCards)}
              className="flex items-center gap-2 px-6 py-3 text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-all duration-200 hover:shadow-md active:scale-95"
            >
              {showAllCards ? (
                <>
                  {t('guruMenu.showLess')}
                  <ChevronUp size={20} />
                </>
              ) : (
                <>
                  {t('guruMenu.showMore')}
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

export default GuruMenuCards;
