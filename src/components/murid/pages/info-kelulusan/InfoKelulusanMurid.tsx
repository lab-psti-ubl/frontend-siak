import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../../ui/Badge';
import Card from '../../../ui/Card';
import { useAuth } from '../../../../context/AuthContext';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useNilai } from '../../../../hooks/useNilai';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useJurusan } from '../../../../hooks/useJurusan';
import { usePengumumanKelulusan } from '../../../../hooks/usePengumumanKelulusan';
import { usePengaturanNilaiMinimal } from '../../../../hooks/usePengaturanNilaiMinimal';
import {
  User,
  Kelas,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi,
  Jurusan,
  PengumumanKelulusan
} from '../../../../types';
import { generateRaportData } from '../../../../utils/raport';
import { getNilaiMinimalSettings } from '../../../../utils/nilaiUtils';
import { getKelulusanDataKelas, getKelulusanDataSekolah } from './InfoKelulusanUtils';
import KelulusanHeader from './KelulusanHeader';
import KelulusanStatusCard from './KelulusanStatusCard';
import RankingCards from './RankingCards';
import MuridTerbaikKelas from './MuridTerbaikKelas';
import MuridTerbaikSekolah from './MuridTerbaikSekolah';
import KelulusanActionButtons from './KelulusanActionButtons';
import KelulusanDetailModal from './KelulusanDetailModal';
import { NotKelas12, NotSemesterGenap, NoPengumuman } from './EmptyStates';
import { isMaxTingkatSync } from '../../../../utils/jenjangPendidikanUtils';

const InfoKelulusanMurid: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use hooks dengan cache untuk mengambil data dari database
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { nilai } = useNilai();
  const { mataPelajaran } = useMataPelajaran();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  const { jadwalPelajaran } = useJadwalPelajaran();
  const { absensi } = useAbsensi();
  const { sesiAbsensi } = useSesiAbsensi();
  const { jurusan } = useJurusan();
  const { pengumumanKelulusan } = usePengumumanKelulusan();
  const { pengaturanNilaiMinimal } = usePengaturanNilaiMinimal(); // Load nilai minimal settings from database

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Combine gurus and murid into users array for compatibility
  const users = useMemo(() => [...gurus, ...murid] as User[], [gurus, murid]);

  // Calculate all derived values before conditional returns (Rules of Hooks)
  const myKelas = useMemo(() => {
    if (!user?.id) return null;
    return kelas.find(k => k.id === (user as any).kelasId);
  }, [user, kelas]);

  const activePengumuman = useMemo(() => {
    if (activeTahunAjaran?.semester !== 2) return null;
    return pengumumanKelulusan.find(p =>
      p.isPublished && p.tahunAjaran === activeTahunAjaran?.tahun
    );
  }, [pengumumanKelulusan, activeTahunAjaran]);

  const targetTahunAjaranFilter = useMemo(() => {
    if (!activePengumuman) return [];
    return tahunAjaran.filter(ta => ta.tahun === activePengumuman.tahunAjaran);
  }, [tahunAjaran, activePengumuman]);

  const myRaportData = useMemo(() => {
    if (!user?.id || !activePengumuman) return null;
    return generateRaportData(
      user.id,
      2,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      targetTahunAjaranFilter,
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );
  }, [user?.id, users, kelas, jurusan, nilai, mataPelajaran, targetTahunAjaranFilter, jadwalPelajaran, absensi, sesiAbsensi, activePengumuman]);

  // Use nilai minimal from database (via hook) or fallback to utility function
  const minimalSettings = useMemo(() => {
    return pengaturanNilaiMinimal || getNilaiMinimalSettings();
  }, [pengaturanNilaiMinimal]);
  
  const isLulus = useMemo(() => {
    if (!myRaportData) return false;
    return myRaportData.overallGrade >= minimalSettings.nilaiAkhirMinimal && 
           myRaportData.attendanceRate >= minimalSettings.tingkatKehadiranMinimal;
  }, [myRaportData, minimalSettings]);

  // Gunakan snapshot dari pengumuman jika ada untuk murid kelas
  const muridKelas = useMemo(() => {
    if (!user?.id || !myKelas) return [];
    
    if (activePengumuman?.snapshotMuridIds && activePengumuman.snapshotMuridIds.length > 0) {
      // Gunakan snapshot dan filter berdasarkan kelas murid
      const tahunAjaranPengumuman = activePengumuman.tahunAjaran;
      
      // Ambil ID murid yang memiliki nilai di kelas ini pada tahun ajaran pengumuman
      const muridIdsDariNilai = new Set(
        nilai
          .filter(n => 
            n.kelasId === myKelas.id && 
            n.tahunAjaran === tahunAjaranPengumuman &&
            n.semester === 2
          )
          .map(n => n.muridId)
      );
      
      if (muridIdsDariNilai.size > 0) {
        return users.filter(u => 
          u.role === 'murid' && 
          activePengumuman.snapshotMuridIds!.includes(u.id) &&
          muridIdsDariNilai.has(u.id)
        );
      } else {
        // Fallback: gunakan snapshot saja
        return users.filter(u => 
          u.role === 'murid' && 
          activePengumuman.snapshotMuridIds!.includes(u.id) &&
          (u as any).kelasId === myKelas.id
        );
      }
    } else {
      // Fallback ke data sekarang
      return users.filter(u => 
        u.role === 'murid' && 
        (u as any).kelasId === (user as any).kelasId && 
        (u as any).isActive !== false
      );
    }
  }, [users, activePengumuman, user, myKelas, nilai]);

  const kelulusanDataKelas = useMemo(() => {
    if (!activePengumuman || muridKelas.length === 0) return [];
    return getKelulusanDataKelas(
      muridKelas,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      targetTahunAjaranFilter,
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );
  }, [muridKelas, users, kelas, jurusan, nilai, mataPelajaran, targetTahunAjaranFilter, jadwalPelajaran, absensi, sesiAbsensi, activePengumuman]);

  const myRanking = useMemo(() => {
    if (!user?.id) return 0;
    return kelulusanDataKelas.findIndex(d => d.murid.id === user.id) + 1;
  }, [kelulusanDataKelas, user?.id]);

  const muridTerbaikKelas = useMemo(() => kelulusanDataKelas.slice(0, 3), [kelulusanDataKelas]);

  // Untuk data sekolah, gunakan snapshot jika ada
  const allMuridKelas12 = useMemo(() => {
    if (activePengumuman?.snapshotMuridIds && activePengumuman.snapshotMuridIds.length > 0) {
      // Gunakan snapshot untuk semua murid tingkat akhir
      return users.filter(u => 
        u.role === 'murid' && 
        activePengumuman.snapshotMuridIds!.includes(u.id)
      );
    } else {
      // Fallback ke data sekarang
      return users.filter(u => {
        const muridKelas = kelas.find(k => k.id === (u as any).kelasId);
        return u.role === 'murid' && muridKelas && isMaxTingkatSync(muridKelas.tingkat) && (u as any).isActive !== false;
      });
    }
  }, [users, activePengumuman, kelas]);

  const kelulusanDataSekolah = useMemo(() => {
    if (!activePengumuman || allMuridKelas12.length === 0) return [];
    return getKelulusanDataSekolah(
      allMuridKelas12,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      targetTahunAjaranFilter,
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );
  }, [allMuridKelas12, users, kelas, jurusan, nilai, mataPelajaran, targetTahunAjaranFilter, jadwalPelajaran, absensi, sesiAbsensi, activePengumuman]);

  const mySchoolRanking = useMemo(() => {
    if (!user?.id) return 0;
    return kelulusanDataSekolah.findIndex(d => d.murid.id === user.id) + 1;
  }, [kelulusanDataSekolah, user?.id]);

  const muridTerbaikSekolah = useMemo(() => kelulusanDataSekolah.slice(0, 5), [kelulusanDataSekolah]);

  // Conditional returns AFTER all hooks
  if (!myKelas || !isMaxTingkatSync(myKelas.tingkat)) {
    return <NotKelas12 />;
  }

  if (activeTahunAjaran?.semester !== 2) {
    return <NotSemesterGenap activeTahunAjaran={activeTahunAjaran || undefined} />;
  }

  if (!activePengumuman) {
    return <NoPengumuman />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Info Kelulusan</h2>
          <p className="text-sm sm:text-base text-gray-600">Informasi kelulusan dan peringkat Anda</p>
        </div>
        <div className="self-start sm:self-auto">
          <Badge variant="success">
            Pengumuman Resmi
          </Badge>
        </div>
      </div>

      <Card className="border-0 shadow-lg overflow-hidden">
        <KelulusanHeader activePengumuman={activePengumuman} />

        {myRaportData && (
          <>
            <KelulusanStatusCard isLulus={isLulus} raportData={myRaportData} />
            <RankingCards
              myRanking={myRanking}
              totalKelas={kelulusanDataKelas.length}
              mySchoolRanking={mySchoolRanking}
              totalSekolah={kelulusanDataSekolah.length}
            />
          </>
        )}
      </Card>

      <MuridTerbaikKelas
        muridTerbaik={muridTerbaikKelas}
        myKelas={myKelas}
        currentUserId={user?.id}
      />

      <MuridTerbaikSekolah
        muridTerbaik={muridTerbaikSekolah}
        currentUserId={user?.id}
      />

      {myRaportData && (
        <>
          <KelulusanActionButtons
            onViewDetail={() => setIsDetailModalOpen(true)}
            onViewRaport={() => navigate('/dashboard/raport-saya')}
          />

          <KelulusanDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            raportData={myRaportData}
            user={user}
            myKelas={myKelas}
            activePengumuman={activePengumuman}
            isLulus={isLulus}
            myRanking={myRanking}
            totalKelas={kelulusanDataKelas.length}
            mySchoolRanking={mySchoolRanking}
            totalSekolah={kelulusanDataSekolah.length}
          />
        </>
      )}
    </div>
  );
};

export default InfoKelulusanMurid;
