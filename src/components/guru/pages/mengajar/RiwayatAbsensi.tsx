import React, { useState, useMemo } from 'react';
import { ChevronLeft, BookOpen, Calendar } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { JadwalPelajaran, User, Kelas, MataPelajaran, TahunAjaran, Murid, SesiAbsensi, JurnalMengajar, Absensi, RiwayatKelasMurid } from '../../../../types';
import KelasListView from './components/riwayat-absensi-new/KelasListView';
import MuridListView from './components/riwayat-absensi-new/MuridListView';
import MapelListView from './components/riwayat-absensi-new/MapelListView';
import PertemuanListView from './components/riwayat-absensi-new/PertemuanListView';
import AbsensiDetailView from './components/riwayat-absensi-new/AbsensiDetailView';
import RekapAbsenPertemuanView from './components/riwayat-absensi-new/RekapAbsenPertemuanView';
import { useJadwalPelajaran } from '../../../../hooks/useJadwalPelajaran';
import { useGurus } from '../../../../hooks/useGurus';
import { useKelas } from '../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useRiwayatKelasMurid } from '../../../../hooks/useRiwayatKelasMurid';
import { useMurid } from '../../../../hooks/useMurid';
import { apiService } from '../../../../services/apiService';

type ViewLevel = 'kelas' | 'murid' | 'mapel' | 'pertemuan' | 'absensi' | 'rekap';

interface NavigationState {
  level: ViewLevel;
  kelasId?: string;
  mapelId?: string;
  jadwalId?: string;
  sesiId?: string;
}

const RiwayatAbsensi: React.FC = () => {
  const { user } = useAuth();
  
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
    level: 'kelas'
  });

  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>(activeTahunAjaran?.tahun || '');
  const [selectedSemester, setSelectedSemester] = useState<number>(activeTahunAjaran?.semester || 1);

  // Get jadwal pelajaran filtered by guru, tahun ajaran, and semester
  // Always filter by guruId to ensure only teacher's schedules are shown
  const { jadwalPelajaran } = useJadwalPelajaran(
    user?.id
      ? {
          guruId: user.id,
          ...(selectedTahunAjaran && selectedSemester
            ? {
                tahunAjaran: selectedTahunAjaran,
                semester: selectedSemester,
              }
            : {}),
        }
      : undefined
  );

  React.useEffect(() => {
    if (activeTahunAjaran) {
      setSelectedTahunAjaran(activeTahunAjaran.tahun);
      setSelectedSemester(activeTahunAjaran.semester);
    }
  }, [activeTahunAjaran]);

  // Filter schedules to only include those matching selected tahun ajaran and semester
  const mySchedules = useMemo(() => {
    if (!selectedTahunAjaran || !selectedSemester) {
      return jadwalPelajaran.filter(j => j.guruId === user?.id);
    }
    return jadwalPelajaran.filter(
      j =>
        j.guruId === user?.id &&
        j.tahunAjaran === selectedTahunAjaran &&
        j.semester === selectedSemester
    );
  }, [jadwalPelajaran, user?.id, selectedTahunAjaran, selectedSemester]);

  const handleBack = () => {
    if (navigation.level === 'murid') {
      setNavigation({ level: 'kelas' });
    } else if (navigation.level === 'mapel') {
      setNavigation({ level: 'kelas' });
    } else if (navigation.level === 'pertemuan') {
      setNavigation({ level: 'mapel', kelasId: navigation.kelasId });
    } else if (navigation.level === 'absensi') {
      setNavigation({ level: 'pertemuan', kelasId: navigation.kelasId, mapelId: navigation.mapelId, jadwalId: navigation.jadwalId });
    } else if (navigation.level === 'rekap') {
      setNavigation({ level: 'mapel', kelasId: navigation.kelasId });
    }
  };

  const handleViewMurid = (kelasId: string) => {
    setNavigation({ level: 'murid', kelasId });
  };

  const handleViewMapel = (kelasId: string) => {
    setNavigation({ level: 'mapel', kelasId });
  };

  const handleViewPertemuan = (kelasId: string, mapelId: string, jadwalId: string) => {
    setNavigation({ level: 'pertemuan', kelasId, mapelId, jadwalId });
  };

  const handleViewAbsensi = (kelasId: string, mapelId: string, jadwalId: string, sesiId: string) => {
    setNavigation({ level: 'absensi', kelasId, mapelId, jadwalId, sesiId });
  };

  const handleViewRekap = (kelasId: string, mapelId: string, jadwalId: string) => {
    setNavigation({ level: 'rekap', kelasId, mapelId, jadwalId });
  };

  const handleUpdateJurnal = async (jadwalId: string, kelasId: string, tanggal: string, jurnal: JurnalMengajar) => {
    try {
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
    const breadcrumbs: string[] = ['Riwayat Absensi'];

    if (navigation.level === 'murid' || navigation.level === 'mapel') {
      const kelasData = kelas.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelasData?.name || 'Kelas');
      breadcrumbs.push(navigation.level === 'murid' ? 'Data Murid' : 'Mata Pelajaran');
    } else if (navigation.level === 'pertemuan') {
      const kelasData = kelas.find(k => k.id === navigation.kelasId);
      const mapelData = mataPelajaran.find(m => m.id === navigation.mapelId);
      breadcrumbs.push(kelasData?.name || 'Kelas');
      breadcrumbs.push('Mata Pelajaran');
      breadcrumbs.push(mapelData?.name || 'Mapel');
    } else if (navigation.level === 'absensi') {
      const kelasData = kelas.find(k => k.id === navigation.kelasId);
      const mapelData = mataPelajaran.find(m => m.id === navigation.mapelId);
      breadcrumbs.push(kelasData?.name || 'Kelas');
      breadcrumbs.push('Mata Pelajaran');
      breadcrumbs.push(mapelData?.name || 'Mapel');
      breadcrumbs.push('Detail Absensi');
    } else if (navigation.level === 'rekap') {
      const kelasData = kelas.find(k => k.id === navigation.kelasId);
      const mapelData = mataPelajaran.find(m => m.id === navigation.mapelId);
      breadcrumbs.push(kelasData?.name || 'Kelas');
      breadcrumbs.push('Mata Pelajaran');
      breadcrumbs.push(mapelData?.name || 'Mapel');
      breadcrumbs.push('Rekap Absensi Pertemuan');
    }

    return breadcrumbs;
  };

  const availableTahunAjaran = React.useMemo(() => {
    const tahunFromJadwal = jadwalPelajaran
      .filter(j => j.guruId === user?.id)
      .map(j => j.tahunAjaran);

    const tahunFromTahunAjaran = tahunAjaran.map(ta => ta.tahun);

    const allTahun = [...new Set([...tahunFromJadwal, ...tahunFromTahunAjaran])];

    return allTahun.sort((a, b) => b.localeCompare(a));
  }, [jadwalPelajaran, tahunAjaran, user?.id]);

  const availableSemesters = React.useMemo(() => {
    if (!selectedTahunAjaran) return [1, 2];

    const semestersFromJadwal = jadwalPelajaran
      .filter(j => j.guruId === user?.id && j.tahunAjaran === selectedTahunAjaran)
      .map(j => j.semester);

    const semestersFromTahunAjaran = tahunAjaran
      .filter(ta => ta.tahun === selectedTahunAjaran)
      .map(ta => ta.semester);

    const allSemesters = [...new Set([...semestersFromJadwal, ...semestersFromTahunAjaran])].sort();

    return allSemesters.length > 0 ? allSemesters : [1, 2];
  }, [selectedTahunAjaran, jadwalPelajaran, tahunAjaran, user?.id]);

  React.useEffect(() => {
    if (!availableSemesters.includes(selectedSemester)) {
      setSelectedSemester(availableSemesters[0]);
    }
  }, [availableSemesters, selectedSemester]);

  const breadcrumbs = getBreadcrumb();
  const currentPageTitle = breadcrumbs[breadcrumbs.length - 1];
  const breadcrumbPath = breadcrumbs.slice(0, -1);

  return (
    <div className="space-y-5 lg:space-y-6">
      {navigation.level === 'kelas' && (
        <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  Riwayat Absensi
                </h1>
                <p className="text-sm sm:text-base text-blue-100">
                  Kelola dan lihat riwayat absensi murid per kelas dan mata pelajaran
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 w-fit">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="text-xs sm:text-sm text-white font-medium">
                  {selectedTahunAjaran} - Sem {selectedSemester}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {navigation.level !== 'kelas' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-1">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 sm:p-2.5 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Kembali"
            >
              <ChevronLeft size={24} className="text-slate-600" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">
                {currentPageTitle}
              </h2>
              {breadcrumbPath.length > 0 && (
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 truncate">
                  {breadcrumbPath.join(' / ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {navigation.level === 'kelas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:gap-3">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">Tahun Ajaran</label>
              <select
                value={selectedTahunAjaran}
                onChange={(e) => setSelectedTahunAjaran(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              >
                {availableTahunAjaran.map(ta => (
                  <option key={ta} value={ta}>{ta}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:gap-3">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              >
                {availableSemesters.map(sem => (
                  <option key={sem} value={sem}>
                    {sem === 1 ? 'Ganjil (1)' : 'Genap (2)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {navigation.level === 'kelas' && (
        <KelasListView
          mySchedules={mySchedules}
          kelas={kelas}
          users={users}
          sesiAbsensi={sesiAbsensi}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          riwayatKelasMurid={riwayatKelasMurid}
          tahunAjaran={tahunAjaran}
          onViewMurid={handleViewMurid}
          onViewMapel={handleViewMapel}
        />
      )}

      {navigation.level === 'murid' && navigation.kelasId && (
        <MuridListView
          kelasId={navigation.kelasId}
          users={users}
          kelas={kelas}
          tahunAjaranId={tahunAjaran.find(ta => ta.tahun === selectedTahunAjaran && ta.semester === selectedSemester)?.id}
          riwayatKelasMurid={riwayatKelasMurid}
        />
      )}

      {navigation.level === 'mapel' && navigation.kelasId && (
        <MapelListView
          kelasId={navigation.kelasId}
          mySchedules={mySchedules}
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

      {navigation.level === 'pertemuan' && navigation.kelasId && navigation.mapelId && navigation.jadwalId && (
        <PertemuanListView
          kelasId={navigation.kelasId}
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
          kelasId={navigation.kelasId || ''}
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

      {navigation.level === 'rekap' && navigation.kelasId && navigation.mapelId && navigation.jadwalId && (
        <RekapAbsenPertemuanView
          kelasId={navigation.kelasId}
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

export default RiwayatAbsensi;
