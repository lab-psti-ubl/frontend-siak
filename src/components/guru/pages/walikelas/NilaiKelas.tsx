import React, { useState, useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Card from '../../../ui/Card';
import { exportToExcel, exportToPDF } from '../../../../utils/exportUtils';
import { useAuth } from '../../../../context/AuthContext';
import { useNilai } from '../../../../hooks/useNilai';
import { useGurus } from '../../../../hooks/useGurus';
import { useMurid } from '../../../../hooks/useMurid';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useKelas } from '../../../../hooks/useKelas';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useGrade } from '../../../../hooks/useGrade';
import { useKomponenNilai } from '../../../../hooks/useKomponenNilai';
import { Guru, User } from '../../../../types';
import { getKelasWaliByTahunAjaran } from '../../../../utils/riwayatWaliKelasUtils';
import {
  calculateKehadiran,
  calculateRataTugas,
  getSemuaKomponenNilai,
  setGradeCache,
  setKomponenNilaiCache,
  getMaxTugasInfo,
  getMaxKomponenDinamisInfo,
  calculateRataKomponen
} from '../../../../utils/nilaiUtils';
import {
  getMapelName,
  getGuruName,
  getNilaiMurid,
  getClassStats
} from './components/nilai-kelas/NilaiKelasUtils';
import NilaiKelasHeader from './components/nilai-kelas/NilaiKelasHeader';
import NilaiKelasFilters from './components/nilai-kelas/NilaiKelasFilters';
import NilaiKelasStats from './components/nilai-kelas/NilaiKelasStats';
import NilaiKelasTable from './components/nilai-kelas/NilaiKelasTable';
import NilaiKelasRekapTable from './components/nilai-kelas/NilaiKelasRekapTable';
import NilaiKelasEmptyState from './components/nilai-kelas/NilaiKelasEmptyState';
import NilaiKelasDetailModal from './components/nilai-kelas/NilaiKelasDetailModal';

const NilaiKelas: React.FC = () => {
  const { user } = useAuth();
  
  // Use hooks dengan cache untuk mengambil data dari database
  const { nilai, loading: loadingNilai } = useNilai();
  const { gurus, loading: loadingGurus } = useGurus();
  const { murid, loading: loadingMurid } = useMurid();
  const { jadwalPelajaran, loading: loadingJadwal } = useJadwalPelajaran();
  const { mataPelajaran, loading: loadingMapel } = useMataPelajaran();
  const { kelas, loading: loadingKelas } = useKelas();
  const { tahunAjaran, loading: loadingTahunAjaran } = useTahunAjaran();
  const { absensi, loading: loadingAbsensi } = useAbsensi();
  const { sesiAbsensi, loading: loadingSesi } = useSesiAbsensi();
  const { grade: gradeSettings, loading: loadingGrade } = useGrade();
  const { komponenNilai, loading: loadingKomponen } = useKomponenNilai();

  // State hooks
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Set grade cache untuk digunakan di nilaiUtils
  useEffect(() => {
    if (gradeSettings && gradeSettings.length > 0) {
      setGradeCache(gradeSettings);
    }
  }, [gradeSettings]);

  // Set komponen nilai cache untuk digunakan di nilaiUtils
  useEffect(() => {
    if (komponenNilai && komponenNilai.length > 0) {
      setKomponenNilaiCache(komponenNilai);
    }
  }, [komponenNilai]);

  // Gabungkan gurus dan murid sebagai users untuk kompatibilitas
  const users = useMemo(() => [...gurus, ...murid], [gurus, murid]);

  // Loading state
  const isLoading = loadingNilai || loadingGurus || loadingMurid || loadingJadwal || loadingMapel || 
                    loadingKelas || loadingTahunAjaran || loadingAbsensi || loadingSesi || loadingGrade || loadingKomponen;

  const activeTahunAjaran = useMemo(() => tahunAjaran.find(ta => ta.isActive), [tahunAjaran]);

  // Get current kelasWali based on active tahun ajaran
  const currentKelasWali = useMemo(() => {
    if (!user || !activeTahunAjaran) return null;
    const guruUser = user as Guru;
    const fromRiwayat = getKelasWaliByTahunAjaran(
      guruUser,
      activeTahunAjaran.tahun,
      activeTahunAjaran.semester
    );

    if (fromRiwayat) return fromRiwayat;

    // Fallback: gunakan data jadwal untuk menentukan kelas wali pada periode aktif
    const jadwalKelasIds = Array.from(new Set(
      jadwalPelajaran
        .filter(j => j.guruId === user.id && j.tahunAjaran === activeTahunAjaran.tahun && j.semester === activeTahunAjaran.semester)
        .map(j => j.kelasId)
    ));

    return jadwalKelasIds.length > 0 ? jadwalKelasIds[0] : null;
  }, [user, activeTahunAjaran, jadwalPelajaran]);

  const myKelas = useMemo(() => {
    if (!currentKelasWali) return null;
    return kelas.find(k => k.id === currentKelasWali);
  }, [currentKelasWali, kelas]);

  const muridKelas = useMemo(() => {
    if (!currentKelasWali) return [];

    return users.filter(u =>
      u.role === 'murid' &&
      u.kelasId === currentKelasWali &&
      u.isActive !== false
    );
  }, [currentKelasWali, users]);

  const jadwalKelas = useMemo(() => {
    if (!currentKelasWali || !activeTahunAjaran) return [];
    return jadwalPelajaran.filter(j =>
      j.kelasId === currentKelasWali &&
      j.tahunAjaran === activeTahunAjaran.tahun &&
      j.semester === activeTahunAjaran.semester
    );
  }, [currentKelasWali, jadwalPelajaran, activeTahunAjaran]);

  const uniqueMapel = useMemo(() => {
    return [...new Set(jadwalKelas.map(j => j.mataPelajaranId))];
  }, [jadwalKelas]);

  const activeTAPeriod = useMemo(() => {
    if (!activeTahunAjaran) return null;
    return { tahun: activeTahunAjaran.tahun, semester: activeTahunAjaran.semester };
  }, [activeTahunAjaran]);

  // Callbacks
  const handleViewDetail = (muridItem: User) => {
    setSelectedMurid(muridItem);
    setIsDetailModalOpen(true);
  };

  const exportNilaiKelas = () => {
    if (!selectedMapel) {
      alert('Pilih mata pelajaran terlebih dahulu!');
      return;
    }

    if (!currentKelasWali || !activeTahunAjaran) {
      alert('Kelas tidak ditemukan untuk periode aktif!');
      return;
    }

    const selectedTA = { tahun: activeTahunAjaran.tahun, semester: activeTahunAjaran.semester };
    const semuaKomponen = getSemuaKomponenNilai();
    const komponenDinamisList = semuaKomponen.filter(k => !['UTS', 'UAS', 'Tugas', 'Kehadiran'].includes(k.nama));

    // Get all nilai for the same class and subject to calculate max counts
    const nilaiKelas = nilai.filter(n => 
      n.mataPelajaranId === selectedMapel && 
      n.kelasId === currentKelasWali &&
      n.semester === activeTahunAjaran.semester &&
      n.tahunAjaran === activeTahunAjaran.tahun
    );

    // Get max tugas info
    const { maxCount: maxTugasCount, uniqueTugasNames } = getMaxTugasInfo(nilaiKelas);

    // Get max komponen dinamis info
    const maxKomponenDinamisInfo = getMaxKomponenDinamisInfo(nilaiKelas);

    const data = muridKelas.map(m => {
      const nilaiMurid = getNilaiMurid(m.id, selectedMapel, currentKelasWali, selectedTA, nilai);
      const jadwalMapel = jadwalKelas.find(j => j.mataPelajaranId === selectedMapel);
      const kehadiran = calculateKehadiran(
        m.id,
        selectedMapel,
        currentKelasWali,
        jadwalMapel?.guruId || '',
        activeTahunAjaran.semester,
        activeTahunAjaran.tahun,
        absensi,
        sesiAbsensi,
        jadwalPelajaran
      );
      const rataTugas = nilaiMurid ? calculateRataTugas(nilaiMurid.tugas, maxTugasCount, uniqueTugasNames) : 0;

      const rowData: any = {
        nisn: m.nisn,
        nama: m.name,
        kehadiran: `${kehadiran.toFixed(1)}%`,
        rataTugas: rataTugas.toFixed(1),
        jumlahTugas: nilaiMurid?.tugas.length || 0,
        uts: nilaiMurid?.uts != null ? nilaiMurid.uts : '-',
        uas: nilaiMurid?.uas != null ? nilaiMurid.uas : '-',
        nilaiAkhir: nilaiMurid?.nilaiAkhir != null ? nilaiMurid.nilaiAkhir.toFixed(1) : '-',
        grade: nilaiMurid?.grade || '-'
      };

      komponenDinamisList.forEach(komponen => {
        const komponenValues = nilaiMurid?.komponenDinamis?.filter(kd => kd.komponenNama === komponen.nama) ?? [];
        const maxCount = maxKomponenDinamisInfo[komponen.nama] || null;
        const rataKomponen = komponenValues.length > 0
          ? calculateRataKomponen(komponenValues, maxCount)
          : null;
        rowData[komponen.nama] = rataKomponen != null ? rataKomponen.toFixed(1) : '-';
      });

      return rowData;
    });

    const baseColumns = [
      { header: 'NISN', dataKey: 'nisn', width: 15 },
      { header: 'Nama Murid', dataKey: 'nama', width: 25 },
      { header: 'Kehadiran (%)', dataKey: 'kehadiran', width: 12 },
      { header: 'Rata-rata Tugas', dataKey: 'rataTugas', width: 15 },
      { header: 'Jumlah Tugas', dataKey: 'jumlahTugas', width: 12 },
      { header: 'UTS', dataKey: 'uts', width: 10 },
      { header: 'UAS', dataKey: 'uas', width: 10 }
    ];

    const komponenColumns = komponenDinamisList.map(komponen => ({
      header: komponen.nama,
      dataKey: komponen.nama,
      width: 12
    }));

    const columns = [
      ...baseColumns,
      ...komponenColumns,
      { header: 'Nilai Akhir', dataKey: 'nilaiAkhir', width: 12 },
      { header: 'Grade', dataKey: 'grade', width: 10 }
    ];

    const title = `DAFTAR NILAI MURID\nMata Pelajaran: ${getMapelName(selectedMapel, mataPelajaran)}\nKelas: ${myKelas?.name}\nPeriode: ${activeTahunAjaran.tahun} Semester ${activeTahunAjaran.semester}`;
    const filename = `nilai-${getMapelName(selectedMapel, mataPelajaran)}-${myKelas?.name}-${activeTahunAjaran.tahun}-S${activeTahunAjaran.semester}`;

    exportToExcel(data, columns, title, filename);
  };

  const exportNilaiKelasPDF = () => {
    if (!selectedMapel) {
      alert('Pilih mata pelajaran terlebih dahulu!');
      return;
    }

    if (!currentKelasWali || !activeTahunAjaran) {
      alert('Kelas tidak ditemukan untuk periode aktif!');
      return;
    }

    const selectedTA = { tahun: activeTahunAjaran.tahun, semester: activeTahunAjaran.semester };
    const semuaKomponen = getSemuaKomponenNilai();
    const komponenDinamisList = semuaKomponen.filter(k => !['UTS', 'UAS', 'Tugas', 'Kehadiran'].includes(k.nama));

    // Get all nilai for the same class and subject to calculate max counts
    const nilaiKelas = nilai.filter(n => 
      n.mataPelajaranId === selectedMapel && 
      n.kelasId === currentKelasWali &&
      n.semester === activeTahunAjaran.semester &&
      n.tahunAjaran === activeTahunAjaran.tahun
    );

    // Get max tugas info
    const { maxCount: maxTugasCount, uniqueTugasNames } = getMaxTugasInfo(nilaiKelas);

    // Get max komponen dinamis info
    const maxKomponenDinamisInfo = getMaxKomponenDinamisInfo(nilaiKelas);

    const data = muridKelas.map(m => {
      const nilaiMurid = getNilaiMurid(m.id, selectedMapel, currentKelasWali, selectedTA, nilai);
      const jadwalMapel = jadwalKelas.find(j => j.mataPelajaranId === selectedMapel);
      const kehadiran = calculateKehadiran(
        m.id,
        selectedMapel,
        currentKelasWali,
        jadwalMapel?.guruId || '',
        activeTahunAjaran.semester,
        activeTahunAjaran.tahun,
        absensi,
        sesiAbsensi,
        jadwalPelajaran
      );
      const rataTugas = nilaiMurid ? calculateRataTugas(nilaiMurid.tugas, maxTugasCount, uniqueTugasNames) : 0;

      const rowData: any = {
        nisn: m.nisn,
        nama: m.name,
        kehadiran: `${kehadiran.toFixed(1)}%`,
        rataTugas: rataTugas.toFixed(1),
        jumlahTugas: nilaiMurid?.tugas.length || 0,
        uts: nilaiMurid?.uts != null ? nilaiMurid.uts : '-',
        uas: nilaiMurid?.uas != null ? nilaiMurid.uas : '-',
        nilaiAkhir: nilaiMurid?.nilaiAkhir != null ? nilaiMurid.nilaiAkhir.toFixed(1) : '-',
        grade: nilaiMurid?.grade || '-'
      };

      komponenDinamisList.forEach(komponen => {
        const komponenValues = nilaiMurid?.komponenDinamis?.filter(kd => kd.komponenNama === komponen.nama) ?? [];
        const maxCount = maxKomponenDinamisInfo[komponen.nama] || null;
        const rataKomponen = komponenValues.length > 0
          ? calculateRataKomponen(komponenValues, maxCount)
          : null;
        rowData[komponen.nama] = rataKomponen != null ? rataKomponen.toFixed(1) : '-';
      });

      return rowData;
    });

    const baseColumns = [
      { header: 'NISN', dataKey: 'nisn', width: 15 },
      { header: 'Nama Murid', dataKey: 'nama', width: 25 },
      { header: 'Kehadiran (%)', dataKey: 'kehadiran', width: 12 },
      { header: 'Rata-rata Tugas', dataKey: 'rataTugas', width: 15 },
      { header: 'Jumlah Tugas', dataKey: 'jumlahTugas', width: 12 },
      { header: 'UTS', dataKey: 'uts', width: 10 },
      { header: 'UAS', dataKey: 'uas', width: 10 }
    ];

    const komponenColumns = komponenDinamisList.map(komponen => ({
      header: komponen.nama,
      dataKey: komponen.nama,
      width: 12
    }));

    const columns = [
      ...baseColumns,
      ...komponenColumns,
      { header: 'Nilai Akhir', dataKey: 'nilaiAkhir', width: 12 },
      { header: 'Grade', dataKey: 'grade', width: 10 }
    ];

    const title = `DAFTAR NILAI MURID\nMata Pelajaran: ${getMapelName(selectedMapel, mataPelajaran)}\nKelas: ${myKelas?.name}\nPeriode: ${activeTahunAjaran.tahun} Semester ${activeTahunAjaran.semester}`;
    const filename = `nilai-${getMapelName(selectedMapel, mataPelajaran)}-${myKelas?.name}-${activeTahunAjaran.tahun}-S${activeTahunAjaran.semester}`;

    exportToPDF(data, columns, title, filename);
  };

  // CONDITIONAL RETURNS - SEMUA HOOKS HARUS DI ATAS INI
  if (isLoading) {
    return (
      <Card className="text-center py-12">
        <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Memuat Data...</h3>
        <p className="text-gray-600">Mohon tunggu sebentar.</p>
      </Card>
    );
  }

  if (!user?.isWaliKelas || !user.kelasWali) {
    return (
      <NilaiKelasEmptyState
        message="Akses Ditolak"
        description="Anda tidak memiliki akses sebagai wali kelas."
      />
    );
  }

  if (!activeTahunAjaran) {
    return (
      <NilaiKelasEmptyState
        message="Tahun Ajaran Tidak Aktif"
        description="Tidak ada tahun ajaran yang sedang aktif. Hubungi admin untuk mengaktifkan tahun ajaran."
      />
    );
  }

  if (!currentKelasWali || !myKelas) {
    return (
      <NilaiKelasEmptyState
        message="Kelas Tidak Ditemukan"
        description={`Tidak dapat menemukan data kelas untuk periode aktif.`}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <NilaiKelasHeader
        myKelas={myKelas}
        activeTahunAjaran={activeTahunAjaran}
      />

      <NilaiKelasFilters
        selectedMapel={selectedMapel}
        setSelectedMapel={setSelectedMapel}
        uniqueMapel={uniqueMapel}
        getMapelName={(id) => getMapelName(id, mataPelajaran)}
        getGuruName={(id) => getGuruName(id, jadwalKelas, users)}
        onExport={exportNilaiKelas}
        onExportPDF={exportNilaiKelasPDF}
      />

      {selectedMapel && activeTAPeriod && (
        <NilaiKelasStats
          mapelName={getMapelName(selectedMapel, mataPelajaran)}
          stats={getClassStats(selectedMapel, currentKelasWali, activeTAPeriod, nilai)}
        />
      )}

      {selectedMapel && activeTAPeriod ? (
        <NilaiKelasTable
          muridKelas={muridKelas}
          selectedMapel={selectedMapel}
          kelasWali={currentKelasWali}
          mapelName={getMapelName(selectedMapel, mataPelajaran)}
          guruName={getGuruName(selectedMapel, jadwalKelas, users)}
          activeTahunAjaran={activeTAPeriod}
          getNilaiMurid={(muridId, mapelId) => activeTAPeriod ? getNilaiMurid(muridId, mapelId, currentKelasWali, activeTAPeriod, nilai) : undefined}
          jadwalKelas={jadwalKelas}
          absensi={absensi}
          sesiAbsensi={sesiAbsensi}
          jadwalPelajaran={jadwalPelajaran}
          onViewDetail={handleViewDetail}
          nilai={nilai}
        />
      ) : activeTAPeriod ? (
        <NilaiKelasRekapTable
          muridKelas={muridKelas}
          uniqueMapel={uniqueMapel}
          mataPelajaran={mataPelajaran}
          kelasWali={currentKelasWali}
          activeTahunAjaran={activeTAPeriod}
          nilai={nilai}
          jadwalKelas={jadwalKelas}
          namaKelas={myKelas?.name || ''}
          namaWaliKelas={user?.name || ''}
        />
      ) : null}

      <NilaiKelasDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMurid(null);
        }}
        selectedMurid={selectedMurid}
        selectedMapel={selectedMapel}
        kelasWali={currentKelasWali}
        activeTahunAjaran={activeTAPeriod!}
        getMapelName={(id) => getMapelName(id, mataPelajaran)}
        getGuruName={(id) => getGuruName(id, jadwalKelas, users)}
        getNilaiMurid={(muridId, mapelId) => activeTAPeriod ? getNilaiMurid(muridId, mapelId, currentKelasWali, activeTAPeriod, nilai) : undefined}
        jadwalKelas={jadwalKelas}
        absensi={absensi}
        sesiAbsensi={sesiAbsensi}
        jadwalPelajaran={jadwalPelajaran}
        nilai={nilai}
      />
    </div>
  );
};

export default NilaiKelas;
