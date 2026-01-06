import React, { useState, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { JadwalPelajaran, User, Kelas, MataPelajaran, TahunAjaran, SesiAbsensi, Absensi, RiwayatKelasMurid } from '../../types';
import MapelListView from './pages/mata-pelajaran/MapelListView';
import PertemuanListView from './pages/mata-pelajaran/PertemuanListView';
import RekapAbsenMuridView from './pages/mata-pelajaran/RekapAbsenMuridView';
import { useJadwalPelajaran } from '../../hooks/useJadwalPelajaran';
import { useGurus } from '../../hooks/useGurus';
import { useMurid } from '../../hooks/useMurid';
import { useKelas } from '../../hooks/useKelas';
import { useMataPelajaran } from '../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { useSesiAbsensi } from '../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../hooks/useAbsensi';
import { useRiwayatKelasMurid } from '../../hooks/useRiwayatKelasMurid';

type ViewLevel = 'mapel' | 'pertemuan' | 'rekap_absen';

interface NavigationState {
  level: ViewLevel;
  mapelId?: string;
  jadwalId?: string;
}

const MataPelajaranMurid: React.FC = () => {
  const { user } = useAuth();
  
  // Use hooks with cache
  const { gurus } = useGurus();
  const { murid } = useMurid();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  const { sesiAbsensi } = useSesiAbsensi();
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

  const myCurrentKelasId = (user as any)?.kelasId || '';

  // Get all riwayat kelas IDs for this student
  const myRiwayatKelasIds = riwayatKelasMurid
    .filter(r => r.muridId === user?.id)
    .map(r => r.kelasId);

  const allMyKelasIds = [...new Set([myCurrentKelasId, ...myRiwayatKelasIds])].filter(Boolean);

  // Calculate available tahun ajaran from riwayat kelas murid and tahun ajaran data
  const availableTahunAjaran = useMemo(() => {
    // Get all tahun ajaran IDs from riwayat kelas murid
    const tahunAjaranIdsFromRiwayat = riwayatKelasMurid
      .filter(r => r.muridId === user?.id)
      .map(r => r.tahunAjaran);

    // Get tahun ajaran strings from tahun ajaran data
    const tahunAjaranFromRiwayat = tahunAjaran
      .filter(ta => tahunAjaranIdsFromRiwayat.includes(ta.id))
      .map(ta => ta.tahun);

    // Combine with active tahun ajaran
    const allTahunAjaran = [...new Set(tahunAjaranFromRiwayat)];
    
    // Always include active tahun ajaran if it exists
    if (activeTahunAjaran && !allTahunAjaran.includes(activeTahunAjaran.tahun)) {
      allTahunAjaran.push(activeTahunAjaran.tahun);
    }

    // If no tahun ajaran found from riwayat, use all available tahun ajaran from database
    if (allTahunAjaran.length === 0 && tahunAjaran.length > 0) {
      return [...new Set(tahunAjaran.map(ta => ta.tahun))].sort((a, b) => b.localeCompare(a));
    }

    return allTahunAjaran.sort((a, b) => b.localeCompare(a));
  }, [riwayatKelasMurid, user?.id, tahunAjaran, activeTahunAjaran]);

  // Find tahun ajaran data for selected tahun ajaran (match by tahun string, not semester)
  const selectedTahunAjaranData = tahunAjaran.find(
    ta => ta.tahun === selectedTahunAjaran
  );

  // Find riwayat kelas for selected tahun ajaran
  const myRiwayatKelas = selectedTahunAjaranData
    ? riwayatKelasMurid.find(
        r => r.muridId === user?.id && r.tahunAjaran === selectedTahunAjaranData.id
      )
    : undefined;

  // Determine kelas ID for selected tahun ajaran
  const myKelasId = myRiwayatKelas ? myRiwayatKelas.kelasId : myCurrentKelasId;
  const myKelas = kelas.find(k => k.id === myKelasId);

  // Get jadwal pelajaran for available semesters (without semester filter)
  const { jadwalPelajaran: jadwalForSemesters } = useJadwalPelajaran(
    myKelasId && selectedTahunAjaran
      ? {
          kelasId: myKelasId,
          tahunAjaran: selectedTahunAjaran,
          // Don't filter by semester to get all semesters
        }
      : undefined
  );

  // Get jadwal pelajaran filtered by kelas, tahun ajaran, and semester
  const { jadwalPelajaran } = useJadwalPelajaran(
    myKelasId && selectedTahunAjaran && selectedSemester
      ? {
          kelasId: myKelasId,
          tahunAjaran: selectedTahunAjaran,
          semester: selectedSemester,
        }
      : undefined
  );

  const mySchedules = useMemo(() => {
    if (!myKelasId || !selectedTahunAjaran || !selectedSemester) return [];
    return jadwalPelajaran.filter(j =>
      j.kelasId === myKelasId &&
      j.tahunAjaran === selectedTahunAjaran &&
      j.semester === selectedSemester
    );
  }, [jadwalPelajaran, myKelasId, selectedTahunAjaran, selectedSemester]);

  const handleBack = () => {
    if (navigation.level === 'pertemuan' || navigation.level === 'rekap_absen') {
      setNavigation({ level: 'mapel' });
    }
  };

  const handleViewPertemuan = (mapelId: string, jadwalId: string) => {
    setNavigation({ level: 'pertemuan', mapelId, jadwalId });
  };

  const handleViewRekapAbsen = () => {
    setNavigation({ level: 'rekap_absen' });
  };

  const getBreadcrumb = () => {
    const breadcrumbs: string[] = ['Mata Pelajaran'];

    if (navigation.level === 'pertemuan') {
      const mapelData = mataPelajaran.find(m => m.id === navigation.mapelId);
      breadcrumbs.push(mapelData?.name || 'Mapel');
      breadcrumbs.push('Daftar Pertemuan');
    } else if (navigation.level === 'rekap_absen') {
      breadcrumbs.push('Rekap Absensi');
    }

    return breadcrumbs;
  };

  const availableSemesters = React.useMemo(() => {
    if (!selectedTahunAjaran) return [1, 2];

    // Get all tahun ajaran entries with the same tahun (different semesters)
    const tahunAjaranEntries = tahunAjaran.filter(ta => ta.tahun === selectedTahunAjaran);
    
    // Extract unique semesters from tahun ajaran data
    const semestersFromTahunAjaran = [...new Set(tahunAjaranEntries.map(ta => ta.semester))].sort();

    // Also check jadwal pelajaran for additional semesters
    const semestersFromJadwal = [...new Set(
      jadwalForSemesters
        .filter(j => j.kelasId === myKelasId && j.tahunAjaran === selectedTahunAjaran)
        .map(j => j.semester)
    )].sort();

    // Combine both sources and get unique values
    const allSemesters = [...new Set([...semestersFromTahunAjaran, ...semestersFromJadwal])].sort();

    return allSemesters.length > 0 ? allSemesters : [1, 2];
  }, [selectedTahunAjaran, tahunAjaran, jadwalForSemesters, myKelasId]);

  // Update selectedTahunAjaran if it's not in available list
  React.useEffect(() => {
    if (availableTahunAjaran.length > 0 && !availableTahunAjaran.includes(selectedTahunAjaran)) {
      setSelectedTahunAjaran(availableTahunAjaran[0]);
    }
  }, [availableTahunAjaran, selectedTahunAjaran]);

  // Update selectedSemester when tahun ajaran changes or if current semester is not available
  React.useEffect(() => {
    if (!availableSemesters.includes(selectedSemester)) {
      setSelectedSemester(availableSemesters[0] || 1);
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
          mySchedules={mySchedules}
          mataPelajaran={mataPelajaran}
          kelas={myKelas}
          users={users}
          sesiAbsensi={sesiAbsensi}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          onViewPertemuan={handleViewPertemuan}
          onViewRekapAbsen={handleViewRekapAbsen}
        />
      )}

      {navigation.level === 'pertemuan' && navigation.mapelId && navigation.jadwalId && (
        <PertemuanListView
          mapelId={navigation.mapelId}
          jadwalId={navigation.jadwalId}
          sesiAbsensi={sesiAbsensi}
          absensi={absensi}
          tahunAjaran={tahunAjaran}
          jadwalPelajaran={jadwalPelajaran}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          users={users}
          kelas={kelas}
          mataPelajaran={mataPelajaran}
          muridId={user?.id || ''}
          riwayatKelasMurid={riwayatKelasMurid}
          kelasId={myKelasId}
        />
      )}

      {navigation.level === 'rekap_absen' && myKelas && (
        <RekapAbsenMuridView
          muridId={user?.id || ''}
          kelasId={myKelasId}
          tahunAjaran={selectedTahunAjaran}
          semester={selectedSemester}
          sesiAbsensi={sesiAbsensi}
          absensi={absensi}
          users={users}
          kelas={myKelas}
          mataPelajaran={mataPelajaran}
          tahunAjaranList={tahunAjaran}
          jadwalPelajaran={jadwalPelajaran}
          riwayatKelasMurid={riwayatKelasMurid}
        />
      )}
    </div>
  );
};

export default MataPelajaranMurid;
