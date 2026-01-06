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
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlumni } from '../../hooks/useAlumni';
import { useMurid } from '../../hooks/useMurid';
import { useKelas } from '../../hooks/useKelas';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { usePengumumanKelulusan } from '../../hooks/usePengumumanKelulusan';
import { User as UserType, Kelas, PengumumanKelulusan, TahunAjaran, Alumni } from '../../types';
import { isMaxTingkatSync } from '../../utils/jenjangPendidikanUtils';
import { isMuridAlumni } from '../../utils/alumniStatusUtils';

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
  const [showAllCards, setShowAllCards] = useState(false);

  const isAlumni = isMuridAlumni(user, alumni);

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
      label: 'QR Code Saya',
      icon: QrCode,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-green-600 to-green-700',
      route: '/dashboard/qr-code',
    },
    {
      id: 'nilai',
      label: 'Nilai Saya',
      icon: BarChart3,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
      route: '/dashboard/nilai-saya',
    },
    {
      id: 'raport',
      label: 'Laporan Hasil Belajar',
      icon: GraduationCap,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      route: '/dashboard/raport-saya',
    },
    {
      id: 'e-raport',
      label: 'E-Raport',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-violet-600 to-violet-700',
      route: '/dashboard/e-raport-saya',
    },
    {
      id: 'profil',
      label: 'Profil',
      icon: User,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-600 to-amber-700',
      route: '/dashboard/profil',
    },
  ];

  // Menu untuk murid aktif
  const baseMenuCards: MenuCard[] = [
    {
      id: 'jadwal',
      label: 'Jadwal',
      icon: Calendar,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-purple-600 to-purple-700',
      route: '/dashboard/jadwal',
    },
    {
      id: 'absensi',
      label: 'Absensi',
      icon: ClipboardList,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-orange-600 to-orange-700',
      route: '/dashboard/absensi-saya',
    },
    {
      id: 'riwayat',
      label: 'Kehadiran',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-600 to-blue-700',
      route: '/dashboard/absen-kehadiran',
    },
    {
      id: 'nilai',
      label: 'Nilai',
      icon: BarChart3,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-teal-600 to-teal-700',
      route: '/dashboard/nilai-saya',
    },
    {
      id: 'qr-code',
      label: 'QR Code',
      icon: QrCode,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-green-600 to-green-700',
      route: '/dashboard/qr-code',
    },
    {
      id: 'mata-pelajaran',
      label: 'Mata Pelajaran',
      icon: BookOpen,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-pink-600 to-pink-700',
      route: '/dashboard/mata-pelajaran',
    },
    {
      id: 'raport',
      label: 'Laporan Hasil Belajar',
      icon: GraduationCap,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-indigo-600 to-indigo-700',
      route: '/dashboard/raport-saya',
    },
    {
      id: 'e-raport',
      label: 'E-Raport',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-violet-600 to-violet-700',
      route: '/dashboard/e-raport-saya',
    },
    {
      id: 'izin',
      label: 'Pengajuan Izin',
      icon: FileText,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-red-600 to-red-700',
      route: '/dashboard/surat-izin',
    },
    {
      id: 'profil',
      label: 'Profil',
      icon: User,
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-amber-600 to-amber-700',
      route: '/dashboard/profil',
    },
  ];

  const menuCards = isAlumni
    ? alumniMenuCards
    : (shouldShowInfoKelulusan
      ? [
          ...baseMenuCards,
          {
            id: 'info-kelulusan',
            label: 'Info Kelulusan',
            icon: Award,
            color: 'text-white',
            bgColor: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
            route: '/dashboard/info-kelulusan-murid',
          },
        ]
      : baseMenuCards);

  const displayedCards = showAllCards ? menuCards : menuCards.slice(0, 8);
  const hasMoreCards = menuCards.length > 8;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">Menu Utama</h3>
        <p className="text-sm text-slate-600 mt-0.5">Akses semua fitur dengan mudah</p>
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
                  Tampilkan Lebih Sedikit
                  <ChevronUp size={20} />
                </>
              ) : (
                <>
                  Lihat Lainnya ({menuCards.length - 8})
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
