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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useIzinGuru } from '../../hooks/useIzinGuru';
import { useGurus } from '../../hooks/useGurus';
import { useKelas } from '../../hooks/useKelas';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { usePengumumanKelulusan } from '../../hooks/usePengumumanKelulusan';
import { useRiwayatWaliKelasData } from '../../hooks/useRiwayatWaliKelasData';
import { User as UserType, Kelas, TahunAjaran, IzinGuru } from '../../types';
import { isMaxTingkatSync } from '../../utils/jenjangPendidikanUtils';

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
  const [showAllCards, setShowAllCards] = useState(false);

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

  const hasRiwayatWaliKelas = riwayatWaliKelasData.some((r: any) => r.guruId === user?.id);

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
      label: 'Jadwal Saya',
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700',
      route: '/dashboard/jadwal-saya',
    },
    {
      id: 'kelola-absensi',
      label: 'Kelola Absensi',
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-orange-600 to-orange-700',
      route: '/dashboard/absensi',
    },
    {
      id: 'input-nilai',
      label: 'Input Nilai',
      icon: BarChart3,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
      route: '/dashboard/input-nilai',
    },
    {
      id: 'capaian-pembelajaran',
      label: 'Capaian Pembelajaran',
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      route: '/dashboard/capaian-pembelajaran',
    },
    {
      id: 'riwayat-absensi',
      label: 'Riwayat Absensi',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-green-600 to-green-700',
      route: '/dashboard/riwayat-absensi',
    },
  ];

  const baseMenuCards: MenuCard[] = [
    {
      id: 'absen-guru',
      label: 'Absen',
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-purple-600 to-purple-700',
      route: '/dashboard/absen-guru',
    },
    {
      id: 'izin-guru',
      label: 'Pengajuan Izin',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-red-600 to-red-700',
      route: '/dashboard/izin-guru',
    },
    ...(activeIzinForSubstitute ? [{
      id: 'pengganti',
      label: 'Pengganti',
      icon: Briefcase,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-cyan-600 to-cyan-700',
      route: '/dashboard/pengganti',
    }] : []),
    {
      id: 'profil',
      label: 'Profil',
      icon: User,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-600 to-amber-700',
      route: '/dashboard/profil',
    },
  ];

  const waliKelasCards: MenuCard[] = [
    {
      id: 'absen-kelas',
      label: 'Absen Kelas',
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      route: '/dashboard/absen-kelas',
    },
    {
      id: 'data-murid-kelas',
      label: 'Data Murid Kelas',
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-pink-600 to-pink-700',
      route: '/dashboard/data-murid-kelas',
    },
    {
      id: 'murid-kelas',
      label: 'Absen Pelajaran',
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-rose-600 to-rose-700',
      route: '/dashboard/murid-kelas',
    },
    {
      id: 'nilai-kelas',
      label: 'Nilai Kelas',
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-sky-600 to-sky-700',
      route: '/dashboard/nilai-kelas',
    },
    {
      id: 'nilai-ekstrakulikuler',
      label: 'Nilai Ekstrakulikuler',
      icon: Trophy,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-yellow-600 to-yellow-700',
      route: '/dashboard/nilai-ekstrakulikuler-kelas',
    },
    {
      id: 'kokulikuler',
      label: 'Kokulikuler',
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-purple-600 to-pink-500',
      route: '/dashboard/kokulikuler',
    },
    {
      id: 'surat-izin',
      label: 'Surat Izin',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-lime-600 to-lime-700',
      route: '/dashboard/surat-izin',
    },
    {
      id: 'jadwal-kelas',
      label: 'Jadwal Pelajaran Kelas',
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-violet-600 to-violet-700',
      route: '/dashboard/jadwal-kelas',
    },
    {
      id: 'raport-murid',
      label: 'Raport Murid',
      icon: GraduationCap,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-fuchsia-600 to-fuchsia-700',
      route: '/dashboard/raport-murid',
    },
    {
      id: 'e-raport',
      label: 'Nilai E-Raport',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
      route: '/dashboard/e-raport',
    },
    ...(shouldShowInfoKelulusan ? [{
      id: 'info-kelulusan',
      label: 'Info Kelulusan',
      icon: Award,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      route: '/dashboard/info-kelulusan',
    }] : []),
  ];

  const riwayatCards: MenuCard[] = [
    {
      id: 'riwayat-wali-kelas',
      label: 'Riwayat Wali Kelas',
      icon: GraduationCap,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-slate-600 to-slate-700',
      route: '/dashboard/riwayat-wali-kelas',
    },
    {
      id: 'riwayat-kelulusan',
      label: 'Riwayat Kelulusan',
      icon: Award,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-zinc-600 to-zinc-700',
      route: '/dashboard/riwayat-kelulusan',
    },
  ];

  const sections: MenuSection[] = [
    {
      title: 'Mengajar',
      cards: mengajarCards,
    },
    ...(user?.isWaliKelas ? [{
      title: 'Wali Kelas',
      cards: waliKelasCards,
    }] : []),
    ...(hasRiwayatWaliKelas ? [{
      title: 'Riwayat',
      cards: riwayatCards,
    }] : []),
  ];

  const baseDisplayCards = [...mengajarCards, ...baseMenuCards];
  const shouldShowMoreButton = user?.isWaliKelas || hasRiwayatWaliKelas;

  const sectionsForExpanded: MenuSection[] = [
    ...(user?.isWaliKelas ? [{
      title: 'Wali Kelas',
      cards: waliKelasCards,
    }] : []),
    ...(hasRiwayatWaliKelas ? [{
      title: 'Riwayat',
      cards: riwayatCards,
    }] : []),
  ];

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
        <h3 className="text-lg font-bold text-slate-900">Menu Utama</h3>
        <p className="text-sm text-slate-600 mt-0.5">Akses semua fitur dengan mudah</p>
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
                  Tampilkan Lebih Sedikit
                  <ChevronUp size={20} />
                </>
              ) : (
                <>
                  Lihat Lainnya
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
