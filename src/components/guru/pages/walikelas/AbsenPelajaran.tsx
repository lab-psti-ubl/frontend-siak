import React, { useState, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useRiwayatWaliKelas } from '../../../../hooks/useRiwayatWaliKelas';
import { JadwalPelajaran, User, Kelas, MataPelajaran, TahunAjaran, Murid, SesiAbsensi, JurnalMengajar, Absensi, RiwayatKelasMurid, Guru } from '../../../../types';
import { getKelasWaliByTahunAjaran, getAllTahunAjaranWaliKelas, getAllSemestersForTahunAjaran } from '../../../../utils/riwayatWaliKelasUtils';
import MapelListView from './components/absen-pelajaran/MapelListView';
import PertemuanListView from './components/absen-pelajaran/PertemuanListView';
import AbsensiDetailView from './components/absen-pelajaran/AbsensiDetailView';
import RekapAbsenPertemuanView from './components/absen-pelajaran/RekapAbsenPertemuanView';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useGurus } from '../../../../hooks/useGurus';
import { useKelas } from '../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useRiwayatKelasMurid } from '../../../../hooks/useRiwayatKelasMurid';
import { useMurid } from '../../../../hooks/useMurid';

type ViewLevel = 'mapel' | 'pertemuan' | 'absensi' | 'rekap';

interface NavigationState {
  level: ViewLevel;
  mapelId?: string;
  jadwalId?: string;
  sesiId?: string;
}

const AbsenPelajaran: React.FC = () => {
  const { user } = useAuth();
  useRiwayatWaliKelas(user?.id);
  
  // Use hooks with cache
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  const { sesiAbsensi, updateSesiAbsensi, refreshSesiAbsensi } = useSesiAbsensi();
  const { absensi } = useAbsensi();
  const { riwayatKelasMurid } = useRiwayatKelasMurid();

  // Combine gurus and murid into users array for compatibility
  const users = useMemo(() => {
    return [...gurus, ...murid];
  }, [gurus, murid]);

  const [navigation, setNavigation] = useState<NavigationState>({
    level: 'mapel'
  });

  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>(activeTahunAjaran?.tahun || '');
  const [selectedSemester, setSelectedSemester] = useState<number>(activeTahunAjaran?.semester || 1);

  React.useEffect(() => {
    if (activeTahunAjaran) {
      setSelectedTahunAjaran(activeTahunAjaran.tahun);
      setSelectedSemester(activeTahunAjaran.semester);
    }
  }, [activeTahunAjaran]);

  const currentGuruData = React.useMemo(() => {
    return gurus.find(u => u.id === user?.id) as Guru | undefined;
  }, [gurus, user?.id]);

  const currentKelasId = React.useMemo(() => {
    if (!currentGuruData) return undefined;

    const kelasWaliForPeriod = getKelasWaliByTahunAjaran(
      currentGuruData,
      selectedTahunAjaran,
      selectedSemester
    );

    return kelasWaliForPeriod;
  }, [selectedTahunAjaran, selectedSemester, currentGuruData]);

  // Get jadwal pelajaran filtered by kelas, tahun ajaran, and semester
  const { jadwalPelajaran } = useJadwalPelajaran(
    currentKelasId && selectedTahunAjaran && selectedSemester
      ? {
          kelasId: currentKelasId,
          tahunAjaran: selectedTahunAjaran,
          semester: selectedSemester,
        }
      : undefined
  );

  const kelasSchedules = useMemo(() => {
    if (!currentKelasId || !selectedTahunAjaran || !selectedSemester) return [];
    return jadwalPelajaran.filter(j =>
      j.kelasId === currentKelasId &&
      j.tahunAjaran === selectedTahunAjaran &&
      j.semester === selectedSemester
    );
  }, [jadwalPelajaran, currentKelasId, selectedTahunAjaran, selectedSemester]);

  const handleBack = () => {
    if (navigation.level === 'pertemuan') {
      setNavigation({ level: 'mapel' });
    } else if (navigation.level === 'absensi') {
      setNavigation({ level: 'pertemuan', mapelId: navigation.mapelId, jadwalId: navigation.jadwalId });
    } else if (navigation.level === 'rekap') {
      setNavigation({ level: 'mapel' });
    }
  };

  const handleViewPertemuan = (mapelId: string, jadwalId: string) => {
    setNavigation({ level: 'pertemuan', mapelId, jadwalId });
  };

  const handleViewAbsensi = (mapelId: string, jadwalId: string, sesiId: string) => {
    setNavigation({ level: 'absensi', mapelId, jadwalId, sesiId });
  };

  const handleViewRekap = (mapelId: string, jadwalId: string) => {
    setNavigation({ level: 'rekap', mapelId, jadwalId });
  };

  const handleUpdateJurnal = async (jadwalId: string, kelasId: string, tanggal: string, jurnal: JurnalMengajar) => {
    try {
      const { apiService } = await import('../../../../services/apiService');
      
      // Get tahun ajaran info
      const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
      if (!jadwal) {
        throw new Error('Jadwal tidak ditemukan');
      }
      
      const ta = tahunAjaran.find(ta => ta.tahun === jadwal.tahunAjaran && ta.semester === jadwal.semester);
      if (!ta) {
        throw new Error('Tahun ajaran tidak ditemukan');
      }

      // Check if jurnal exists
      const existingJurnal = await apiService.getJurnalByJadwalIdAndTanggal(jadwalId, tanggal, kelasId);
      
      if (existingJurnal.success && existingJurnal.jurnal) {
        // Update existing jurnal
        await apiService.updateJurnal(existingJurnal.jurnal.id, {
          judul: jurnal.judul,
          deskripsi: jurnal.deskripsi,
          waktuInput: new Date().toISOString(),
          file: jurnal.file,
        });
      } else {
        // Create new jurnal
        const jurnalId = `jurnal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await apiService.createJurnal({
          id: jurnalId,
          jadwalId,
          kelasId,
          tanggal,
          judul: jurnal.judul,
          deskripsi: jurnal.deskripsi,
          waktuInput: new Date().toISOString(),
          file: jurnal.file,
          tahunAjaranId: ta.id,
          semester: ta.semester,
        });
      }
    } catch (error) {
      console.error('Error updating jurnal:', error);
      throw error;
    }
  };

  const getBreadcrumb = () => {
    const breadcrumbs: string[] = ['Absen Pelajaran'];
    const kelasData = kelas.find(k => k.id === currentKelasId);

    if (navigation.level === 'pertemuan') {
      const mapelData = mataPelajaran.find(m => m.id === navigation.mapelId);
      breadcrumbs.push(kelasData?.name || 'Kelas');
      breadcrumbs.push('Mata Pelajaran');
      breadcrumbs.push(mapelData?.name || 'Mapel');
    } else if (navigation.level === 'absensi') {
      const mapelData = mataPelajaran.find(m => m.id === navigation.mapelId);
      breadcrumbs.push(kelasData?.name || 'Kelas');
      breadcrumbs.push('Mata Pelajaran');
      breadcrumbs.push(mapelData?.name || 'Mapel');
      breadcrumbs.push('Detail Absensi');
    } else if (navigation.level === 'rekap') {
      const mapelData = mataPelajaran.find(m => m.id === navigation.mapelId);
      breadcrumbs.push(kelasData?.name || 'Kelas');
      breadcrumbs.push('Mata Pelajaran');
      breadcrumbs.push(mapelData?.name || 'Mapel');
      breadcrumbs.push('Rekap Absensi Pertemuan');
    } else {
      breadcrumbs.push(kelasData?.name || 'Kelas');
    }

    return breadcrumbs;
  };

  const availableTahunAjaran = React.useMemo(() => {
    if (!currentGuruData) return [];

    return getAllTahunAjaranWaliKelas(currentGuruData, activeTahunAjaran?.tahun);
  }, [currentGuruData, activeTahunAjaran]);

  const availableSemesters = React.useMemo(() => {
    if (!currentGuruData || !selectedTahunAjaran) return [1, 2];

    return getAllSemestersForTahunAjaran(currentGuruData, selectedTahunAjaran);
  }, [currentGuruData, selectedTahunAjaran]);

  React.useEffect(() => {
    if (!availableSemesters.includes(selectedSemester)) {
      setSelectedSemester(availableSemesters[0]);
    }
  }, [availableSemesters, selectedSemester]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-4">
          {navigation.level !== 'mapel' && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Kembali"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
          )}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {getBreadcrumb()[getBreadcrumb().length - 1]}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {getBreadcrumb().slice(0, -1).join(' / ')}
            </p>
          </div>
        </div>
        {navigation.level === 'mapel' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Tahun Ajaran:</label>
              <select
                value={selectedTahunAjaran}
                onChange={(e) => setSelectedTahunAjaran(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableTahunAjaran.map(ta => (
                  <option key={ta} value={ta}>{ta}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Semester:</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableSemesters.map(sem => (
                  <option key={sem} value={sem}>
                    {sem === 1 ? 'Ganjil (1)' : 'Genap (2)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {navigation.level === 'mapel' && (
        <MapelListView
          kelasId={currentKelasId || ''}
          kelasSchedules={kelasSchedules}
          mataPelajaran={mataPelajaran}
          kelas={kelas}
          users={users}
          sesiAbsensi={sesiAbsensi}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          onViewPertemuan={handleViewPertemuan}
          onViewRekap={handleViewRekap}
          onUpdateJurnal={handleUpdateJurnal}
        />
      )}

      {navigation.level === 'pertemuan' && navigation.mapelId && navigation.jadwalId && (
        <PertemuanListView
          kelasId={currentKelasId || ''}
          mapelId={navigation.mapelId}
          jadwalId={navigation.jadwalId}
          sesiAbsensi={sesiAbsensi}
          tahunAjaran={tahunAjaran}
          jadwalPelajaran={jadwalPelajaran}
          onViewAbsensi={handleViewAbsensi}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
        />
      )}

      {navigation.level === 'absensi' && navigation.sesiId && navigation.jadwalId && (
        <AbsensiDetailView
          sesiId={navigation.sesiId}
          jadwalId={navigation.jadwalId}
          kelasId={currentKelasId || ''}
          sesiAbsensi={sesiAbsensi}
          jadwalPelajaran={jadwalPelajaran}
          users={users}
          kelas={kelas}
          mataPelajaran={mataPelajaran}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          tahunAjaran={tahunAjaran}
        />
      )}

      {navigation.level === 'rekap' && navigation.mapelId && navigation.jadwalId && (
        <RekapAbsenPertemuanView
          kelasId={currentKelasId || ''}
          mapelId={navigation.mapelId}
          jadwalId={navigation.jadwalId}
          sesiAbsensi={sesiAbsensi}
          absensi={absensi}
          users={users}
          kelas={kelas}
          mataPelajaran={mataPelajaran}
          tahunAjaran={tahunAjaran}
          jadwalPelajaran={jadwalPelajaran}
          riwayatKelasMurid={riwayatKelasMurid}
        />
      )}
    </div>
  );
};

export default AbsenPelajaran;
