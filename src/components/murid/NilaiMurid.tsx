import React, { useState, useMemo, useEffect } from 'react';
import { AlertCircle, Calendar, Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useNilai } from '../../hooks/useNilai';
import { useGurus } from '../../hooks/useGurus';
import { useJadwalPelajaran } from '../../hooks/useJadwalPelajaran';
import { useMataPelajaran } from '../../hooks/useMataPelajaran';
import { useKelas } from '../../hooks/useKelas';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { useAbsensi } from '../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../hooks/useSesiAbsensi';
import { useRiwayatKelasMurid } from '../../hooks/useRiwayatKelasMurid';
import { useGrade } from '../../hooks/useGrade';
import {
  calculateKehadiran,
  calculateRataTugas,
  setGradeCache,
  getMaxTugasInfo,
  getMaxKomponenDinamisInfo,
  calculateRataKomponen
} from '../../utils/nilaiUtils';
import { getKelasIdByMuridAndTahunAjaran } from '../../utils/riwayatKelasMuridUtils';
import NilaiMuridHeader from './pages/nilai/NilaiMuridHeader';
import NilaiMuridPeriodInfo from './pages/nilai/NilaiMuridPeriodInfo';
import NilaiMuridStats from './pages/nilai/NilaiMuridStats';
import NilaiMuridKomponenInfo from './pages/nilai/NilaiMuridKomponenInfo';
import NilaiMuridTable from './pages/nilai/NilaiMuridTable';
import NilaiMuridDetailModal from './pages/nilai/NilaiMuridDetailModal';

const NilaiMurid: React.FC = () => {
  const { user } = useAuth();
  
  // Use hooks dengan cache untuk mengambil data dari database
  // Ambil semua data nilai tanpa filter, nanti filter di frontend
  const { nilai: allNilai, loading: loadingNilai } = useNilai();
  const { gurus, loading: loadingGurus } = useGurus();
  const { jadwalPelajaran, loading: loadingJadwal } = useJadwalPelajaran();
  const { mataPelajaran, loading: loadingMapel } = useMataPelajaran();
  const { kelas, loading: loadingKelas } = useKelas();
  const { tahunAjaran, loading: loadingTahunAjaran } = useTahunAjaran();
  const { absensi, loading: loadingAbsensi } = useAbsensi();
  const { sesiAbsensi, loading: loadingSesi } = useSesiAbsensi();
  const { riwayatKelasMurid, loading: loadingRiwayat } = useRiwayatKelasMurid();
  const { grade: gradeSettings, loading: loadingGrade } = useGrade();

  // Set grade cache untuk digunakan di nilaiUtils
  useEffect(() => {
    if (gradeSettings && gradeSettings.length > 0) {
      setGradeCache(gradeSettings);
    }
  }, [gradeSettings]);

  // Filter nilai untuk murid yang login
  const nilai = useMemo(() => {
    if (!user?.id) return [];
    return allNilai.filter(n => n.muridId === user.id);
  }, [allNilai, user?.id]);

  // Gabungkan gurus sebagai users untuk kompatibilitas
  const users = gurus;
  
  // Loading state
  const isLoading = loadingNilai || loadingGurus || loadingJadwal || loadingMapel || 
                    loadingKelas || loadingTahunAjaran || loadingAbsensi || loadingSesi || loadingRiwayat || loadingGrade;

  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const activeTahunAjaran = tahunAjaran.find(ta => ta.isActive);
  
  // Always use active tahun ajaran and semester
  const selectedTahunAjaran = activeTahunAjaran?.tahun || '';
  const selectedSemester = activeTahunAjaran?.semester || 1;

  const historicalKelasId = useMemo(() => {
    if (!user?.id || !user?.kelasId || !selectedTahunAjaran) return null;
    return getKelasIdByMuridAndTahunAjaran(
      user.id,
      selectedTahunAjaran,
      riwayatKelasMurid,
      user.kelasId,
      nilai
    );
  }, [user?.id, user?.kelasId, selectedTahunAjaran, riwayatKelasMurid, nilai]);

  const targetKelas = useMemo(() => {
    if (!historicalKelasId) return null;
    return kelas.find(k => k.id === historicalKelasId) || null;
  }, [historicalKelasId, kelas]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="text-center py-12">
        <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Memuat Data...</h3>
        <p className="text-gray-600">Mohon tunggu sebentar.</p>
      </Card>
    );
  }

  // Jika tidak ada tahun ajaran aktif, tampilkan pesan
  if (!activeTahunAjaran) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Tahun Ajaran Aktif</h3>
        <p className="text-gray-600">Tidak ada tahun ajaran aktif yang tersedia. Hubungi admin untuk informasi lebih lanjut.</p>
      </Card>
    );
  }

  const jadwalKelas = historicalKelasId ? jadwalPelajaran.filter(j =>
    j.kelasId === historicalKelasId &&
    j.tahunAjaran === selectedTahunAjaran &&
    j.semester === selectedSemester
  ) : [];
  const uniqueMapel = [...new Set(jadwalKelas.map(j => j.mataPelajaranId))];

  const getMapelName = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
  };

  const getGuruName = (mapelId: string) => {
    const jadwal = jadwalKelas.find(j => j.mataPelajaranId === mapelId);
    if (!jadwal) return 'Unknown';
    return users.find(u => u.id === jadwal.guruId)?.name || 'Unknown';
  };

  const getNilaiMurid = (mapelId: string) => {
    if (!historicalKelasId) return undefined;
    return nilai.find(n =>
      n.muridId === user?.id &&
      n.mataPelajaranId === mapelId &&
      n.kelasId === historicalKelasId &&
      n.semester === selectedSemester &&
      n.tahunAjaran === selectedTahunAjaran
    );
  };

  const getOverallStats = () => {
    const myNilai = nilai.filter(n =>
      n.muridId === user?.id &&
      n.semester === selectedSemester &&
      n.tahunAjaran === selectedTahunAjaran &&
      n.nilaiAkhir !== null
    );

    if (myNilai.length === 0) return { rata: 0, gradeDistribution: {} };

    const nilaiAkhirList = myNilai.map(n => n.nilaiAkhir!);
    const rata = nilaiAkhirList.reduce((sum, n) => sum + n, 0) / nilaiAkhirList.length;

    const gradeDistribution = myNilai.reduce((acc, n) => {
      const grade = n.grade || 'E';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { rata, gradeDistribution };
  };

  const handleViewDetail = (mapelId: string) => {
    setSelectedMapel(mapelId);
    setIsDetailModalOpen(true);
  };


  const stats = getOverallStats();

  const nilaiTableData = uniqueMapel.map((mapelId) => {
    const nilaiMurid = getNilaiMurid(mapelId);
    const jadwal = jadwalKelas.find(j => j.mataPelajaranId === mapelId);
    const kehadiran = jadwal && historicalKelasId ? calculateKehadiran(
      user?.id || '',
      mapelId,
      historicalKelasId,
      jadwal.guruId,
      selectedSemester,
      selectedTahunAjaran,
      absensi,
      sesiAbsensi,
      jadwalPelajaran
    ) : 100;
    // Get all nilai for the same class and subject to calculate max counts
    const nilaiKelas = allNilai.filter(n => 
      n.mataPelajaranId === mapelId && 
      n.kelasId === historicalKelasId &&
      n.semester === selectedSemester &&
      n.tahunAjaran === selectedTahunAjaran
    );

    // Get max tugas info
    const { maxCount: maxTugasCount, uniqueTugasNames } = getMaxTugasInfo(nilaiKelas);

    // Get max komponen dinamis info
    const maxKomponenDinamisInfo = getMaxKomponenDinamisInfo(nilaiKelas);

    const rataTugas = nilaiMurid ? calculateRataTugas(nilaiMurid.tugas, maxTugasCount, uniqueTugasNames) : 0;

    // Calculate average for dynamic components
    const komponenDinamis = nilaiMurid?.komponenDinamis ?
      Array.from(
        new Map(
          nilaiMurid.komponenDinamis.map(kd => {
            const kompValues = nilaiMurid.komponenDinamis!.filter(k => k.komponenNama === kd.komponenNama);
            const maxCount = maxKomponenDinamisInfo[kd.komponenNama] || null;
            const rata = calculateRataKomponen(kompValues, maxCount);
            return [kd.komponenNama, rata];
          })
        ).entries()
      ).map(([komponenNama, nilai]) => ({ komponenNama, nilai }))
      : undefined;

    return {
      mapelId,
      mapelName: getMapelName(mapelId),
      guruName: getGuruName(mapelId),
      kehadiran,
      rataTugas,
      jumlahTugas: nilaiMurid?.tugas.length || 0,
      uts: nilaiMurid?.uts !== null ? nilaiMurid?.uts : null,
      uas: nilaiMurid?.uas !== null ? nilaiMurid?.uas : null,
      nilaiAkhir: nilaiMurid?.nilaiAkhir !== null ? nilaiMurid?.nilaiAkhir : null,
      grade: nilaiMurid?.grade || null,
      komponenDinamis
    };
  });

  const selectedNilaiMurid = getNilaiMurid(selectedMapel);
  const selectedJadwal = jadwalKelas.find(j => j.mataPelajaranId === selectedMapel);
  const selectedKehadiran = selectedJadwal && historicalKelasId ? calculateKehadiran(
    user?.id || '',
    selectedMapel,
    historicalKelasId,
    selectedJadwal.guruId,
    selectedSemester,
    selectedTahunAjaran,
    absensi,
    sesiAbsensi,
    jadwalPelajaran
  ) : 100;
  // Get all nilai for selected mapel to calculate max counts
  const selectedNilaiKelas = selectedMapel && historicalKelasId ? allNilai.filter(n => 
    n.mataPelajaranId === selectedMapel && 
    n.kelasId === historicalKelasId &&
    n.semester === selectedSemester &&
    n.tahunAjaran === selectedTahunAjaran
  ) : [];

  // Get max tugas info for selected mapel
  const { maxCount: selectedMaxTugasCount, uniqueTugasNames: selectedUniqueTugasNames } = getMaxTugasInfo(selectedNilaiKelas);

  // Get max komponen dinamis info for selected mapel
  const selectedMaxKomponenDinamisInfo = getMaxKomponenDinamisInfo(selectedNilaiKelas);

  const selectedRataTugas = selectedNilaiMurid ? calculateRataTugas(selectedNilaiMurid.tugas, selectedMaxTugasCount, selectedUniqueTugasNames) : 0;

  return (
    <div className="space-y-6">
      <NilaiMuridHeader
        selectedTahunAjaran={selectedTahunAjaran}
        selectedSemester={selectedSemester}
      />

      <NilaiMuridPeriodInfo
        targetKelas={targetKelas}
        selectedTahunAjaran={selectedTahunAjaran}
        selectedSemester={selectedSemester}
      />

      {!targetKelas ? (
        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Kelas Tidak Ditemukan</h3>
          <p className="text-gray-600">
            Tidak dapat menentukan kelas untuk tahun ajaran {selectedTahunAjaran}.
            Kemungkinan Anda belum masuk sekolah atau sudah lulus pada periode tersebut.
          </p>
        </Card>
      ) : (
        <>
          

          <NilaiMuridKomponenInfo />

          <NilaiMuridTable
            nilaiData={nilaiTableData}
            kelasName={targetKelas?.name}
            selectedTahunAjaran={selectedTahunAjaran}
            selectedSemester={selectedSemester}
            onViewDetail={handleViewDetail}
          />
          <NilaiMuridStats
            rata={stats.rata}
            totalMapel={uniqueMapel.length}
            gradeDistribution={stats.gradeDistribution}
          />
        </>
      )}

      <NilaiMuridDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMapel('');
        }}
        mapelName={getMapelName(selectedMapel)}
        guruName={getGuruName(selectedMapel)}
        kelasName={targetKelas?.name || ''}
        semester={selectedSemester}
        tahunAjaran={selectedTahunAjaran}
        kehadiran={selectedKehadiran}
        rataTugas={selectedRataTugas}
        nilaiMurid={selectedNilaiMurid}
        allNilaiKelas={selectedNilaiKelas}
      />
    </div>
  );
};

export default NilaiMurid;
