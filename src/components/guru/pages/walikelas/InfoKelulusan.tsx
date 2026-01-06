import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';
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
import {
  AccessDeniedState,
  OnlyForKelas12State,
  SemesterGanjilState,
  NoPengumumanState
} from './components/info-kelulusan/InfoKelulusanEmptyStates';
import InfoKelulusanStatsCards from './components/info-kelulusan/InfoKelulusanStatsCards';
import InfoKelulusanPengumumanCard from './components/info-kelulusan/InfoKelulusanPengumumanCard';
import InfoKelulusanMuridTerbaik from './components/info-kelulusan/InfoKelulusanMuridTerbaik';
import InfoKelulusanTable from './components/info-kelulusan/InfoKelulusanTable';
import InfoKelulusanDetailModal from './components/info-kelulusan/InfoKelulusanDetailModal';
import { getKelulusanData } from './components/info-kelulusan/InfoKelulusanUtils';
import { exportKelulusanKelas } from './components/info-kelulusan/exportUtils';
import { isMaxTingkatSync } from '../../../../utils/jenjangPendidikanUtils';

const InfoKelulusan: React.FC = () => {
  const { user } = useAuth();
  
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
  // Load nilai minimal settings from database to update cache
  // Cache akan digunakan oleh getNilaiMinimalSettings() di utils
  usePengaturanNilaiMinimal();

  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Combine gurus and murid into users array for compatibility
  const users = useMemo(() => [...gurus, ...murid] as User[], [gurus, murid]);

  // Calculate all derived values before conditional returns (Rules of Hooks)
  const myKelas = useMemo(() => {
    if (!user || !(user as any).isWaliKelas || !(user as any).kelasWali) return null;
    return kelas.find(k => k.id === (user as any).kelasWali);
  }, [user, kelas]);

  const activePengumuman = useMemo(() => {
    if (activeTahunAjaran?.semester !== 2) return null;
    return pengumumanKelulusan.find(p =>
      p.isPublished && p.tahunAjaran === activeTahunAjaran?.tahun
    );
  }, [pengumumanKelulusan, activeTahunAjaran]);

  // Gunakan snapshot dari pengumuman jika ada, jika tidak gunakan data sekarang
  // Ini penting untuk menjaga konsistensi data meskipun murid sudah dipindahkan
  // Berdasarkan dokumentasi: "Sistem mengambil murid di kelas wali kelas: Filter users dengan kelasId = user.kelasWali"
  // Tapi karena menggunakan snapshot, kita perlu memfilter berdasarkan data nilai untuk menentukan murid yang berada di kelas ini
  const muridKelas = useMemo(() => {
    if (!user || !(user as any).isWaliKelas || !(user as any).kelasWali || !activePengumuman) return [];
    const kelasWaliId = (user as any).kelasWali;
    
    if (activePengumuman?.snapshotMuridIds && activePengumuman.snapshotMuridIds.length > 0) {
      // Gunakan snapshot dari pengumuman
      // Filter berdasarkan snapshotMuridIds DAN murid yang memiliki nilai di kelas wali kelas ini
      // pada tahun ajaran pengumuman (untuk memastikan murid berada di kelas ini saat pengumuman dibuat)
      const tahunAjaranPengumuman = activePengumuman.tahunAjaran;
      
      // Ambil ID murid yang memiliki nilai di kelas wali kelas ini pada tahun ajaran pengumuman
      // Gunakan semester 2 (genap) untuk kelulusan, jika tidak ada gunakan semester 1 sebagai fallback
      const muridIdsDariNilaiSemester2 = new Set(
        nilai
          .filter(n => 
            n.kelasId === kelasWaliId && 
            n.tahunAjaran === tahunAjaranPengumuman &&
            n.semester === 2 // Semester genap untuk kelulusan
          )
          .map(n => n.muridId)
      );
      
      // Fallback: jika tidak ada data semester 2, gunakan semester 1
      const muridIdsDariNilaiSemester1 = new Set(
        nilai
          .filter(n => 
            n.kelasId === kelasWaliId && 
            n.tahunAjaran === tahunAjaranPengumuman &&
            n.semester === 1
          )
          .map(n => n.muridId)
      );
      
      // Gabungkan kedua set (prioritas semester 2, fallback semester 1)
      const muridIdsDariNilai = new Set([...muridIdsDariNilaiSemester2, ...muridIdsDariNilaiSemester1]);
      
      // Jika ada data nilai, gunakan untuk filter
      if (muridIdsDariNilai.size > 0) {
        // Filter: murid harus ada di snapshot DAN memiliki nilai di kelas wali kelas ini
        const filtered = users.filter(u => 
          u.role === 'murid' && 
          activePengumuman.snapshotMuridIds!.includes(u.id) &&
          muridIdsDariNilai.has(u.id)
        );
        console.log(`Filtered ${filtered.length} murid dari snapshot menggunakan data nilai untuk kelas ${myKelas?.name}`);
        return filtered;
      } else {
        // Fallback: jika tidak ada data nilai sama sekali, gunakan snapshot saja
        // Catatan: Ini akan menampilkan semua murid dari snapshot (dari semua kelas tingkat akhir)
        // Idealnya semua murid di snapshot seharusnya memiliki nilai, tapi jika tidak ada data nilai,
        // kita tetap menampilkan semua snapshot murid untuk memastikan data tidak hilang
        console.warn(`Tidak ada data nilai untuk filter kelas ${myKelas?.name}, menggunakan semua snapshot murid`);
        const allSnapshot = users.filter(u => 
          u.role === 'murid' && 
          activePengumuman.snapshotMuridIds!.includes(u.id)
        );
        console.log(`Menggunakan ${allSnapshot.length} murid dari snapshot tanpa filter kelas (karena tidak ada data nilai)`);
        return allSnapshot;
      }
    } else {
      // Fallback ke data sekarang (untuk backward compatibility)
      // Filter users dengan kelasId = user.kelasWali sesuai dokumentasi
      return users.filter(u => 
        u.role === 'murid' && 
        (u as any).kelasId === kelasWaliId && 
        (u as any).isActive !== false
      );
    }
  }, [users, activePengumuman, user, nilai, kelas]);

  const kelulusanData = useMemo(() => {
    if (!activePengumuman || muridKelas.length === 0) return [];
    return getKelulusanData(
      muridKelas,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran,
      jadwalPelajaran,
      absensi,
      sesiAbsensi,
      activePengumuman
    );
  }, [muridKelas, users, kelas, jurusan, nilai, mataPelajaran, tahunAjaran, jadwalPelajaran, absensi, sesiAbsensi, activePengumuman]);

  const muridLulus = useMemo(() => kelulusanData.filter(d => d.isLulus), [kelulusanData]);
  const muridTidakLulus = useMemo(() => kelulusanData.filter(d => !d.isLulus), [kelulusanData]);
  const muridTerbaik = useMemo(() => kelulusanData.slice(0, 3), [kelulusanData]);
  const tingkatKelulusan = useMemo(() => {
    if (muridLulus.length === 0 || muridKelas.length === 0) return 0;
    return parseFloat(((muridLulus.length / muridKelas.length) * 100).toFixed(1));
  }, [muridLulus.length, muridKelas.length]);

  // Conditional returns AFTER all hooks
  if (!user || !(user as any).isWaliKelas || !(user as any).kelasWali) {
    return <AccessDeniedState />;
  }

  if (!myKelas || !isMaxTingkatSync(myKelas.tingkat)) {
    return <OnlyForKelas12State />;
  }

  if (activeTahunAjaran?.semester !== 2) {
    return <SemesterGanjilState myKelas={myKelas} activeTahunAjaran={activeTahunAjaran || undefined} />;
  }

  if (!activePengumuman) {
    return <NoPengumumanState />;
  }

  const handleViewDetail = (murid: User) => {
    setSelectedMurid(murid);
    setIsDetailModalOpen(true);
  };

  const handleExportKelulusanKelas = () => {
    exportKelulusanKelas(kelulusanData, myKelas, activePengumuman, user);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Info Kelulusan
              </h1>
              <p className="text-sm sm:text-base text-teal-100">
                Kelas {myKelas?.name} • Tahun Ajaran {activePengumuman?.tahunAjaran}
              </p>
            </div>
            <Button
              onClick={handleExportKelulusanKelas}
              className="flex-shrink-0 bg-white hover:bg-teal-50 text-teal-700 border-0 flex items-center justify-center gap-2"
            >
              <Download size={16} className="text-blue-800"/>
              <span className="text-xs sm:text-sm font-semibold text-blue-800">Export Excel</span>
            </Button>
          </div>
        </div>
      </div>

      <InfoKelulusanPengumumanCard pengumuman={activePengumuman} />

      <InfoKelulusanStatsCards
        totalMurid={muridKelas.length}
        muridLulus={muridLulus.length}
        muridTidakLulus={muridTidakLulus.length}
        tingkatKelulusan={tingkatKelulusan}
      />

      <InfoKelulusanMuridTerbaik
        muridTerbaik={muridTerbaik}
        kelasName={myKelas?.name}
      />

      <InfoKelulusanTable
        kelulusanData={kelulusanData}
        kelasName={myKelas?.name}
        onViewDetail={handleViewDetail}
      />

      <InfoKelulusanDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMurid(null);
        }}
        selectedMurid={selectedMurid}
        kelulusanData={kelulusanData}
        myKelas={myKelas}
      />
    </div>
  );
};

export default InfoKelulusan;