import React, { useState, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import { JadwalPelajaran, User, Kelas, MataPelajaran, TahunAjaran, SesiAbsensi, JurnalMengajar, Absensi, RiwayatKelasMurid } from '../../../../../types';
import KelasListView from '../../../../guru/pages/mengajar/components/riwayat-absensi-new/KelasListView';
import MuridListView from '../../../../guru/pages/mengajar/components/riwayat-absensi-new/MuridListView';
import MapelListView from '../../../../guru/pages/mengajar/components/riwayat-absensi-new/MapelListView';
import PertemuanListView from '../../../../guru/pages/mengajar/components/riwayat-absensi-new/PertemuanListView';
import AbsensiDetailView from '../../../../guru/pages/mengajar/components/riwayat-absensi-new/AbsensiDetailView';
import RekapAbsenPertemuanView from '../../../../guru/pages/mengajar/components/riwayat-absensi-new/RekapAbsenPertemuanView';
import { useJadwalPelajaran } from '../../../../../hooks/useJadwalPelajaran';
import { useGurus } from '../../../../../hooks/useGurus';
import { useMurid } from '../../../../../hooks/useMurid';
import { useKelas } from '../../../../../hooks/useKelas';
import { useMataPelajaran } from '../../../../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../../../../hooks/useTahunAjaran';
import { useSesiAbsensi } from '../../../../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../../../../hooks/useAbsensi';
import { useRiwayatKelasMurid } from '../../../../../hooks/useRiwayatKelasMurid';

type ViewLevel = 'kelas' | 'murid' | 'mapel' | 'pertemuan' | 'absensi' | 'rekap';

interface NavigationState {
  level: ViewLevel;
  kelasId?: string;
  mapelId?: string;
  jadwalId?: string;
  sesiId?: string;
}

interface LihatPertemuanViewProps {
  guru: User;
}

const LihatPertemuanView: React.FC<LihatPertemuanViewProps> = ({ guru }) => {
  const { t } = useLanguage();
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

  // Get all jadwal pelajaran for this guru first to determine available tahun ajaran
  const { jadwalPelajaran: allJadwalPelajaran } = useJadwalPelajaran({
    guruId: guru.id
  });

  // Get available tahun ajaran from jadwal and tahunAjaran data
  const availableTahunAjaranList = React.useMemo(() => {
    const tahunFromJadwal = allJadwalPelajaran
      .filter(j => j.guruId === guru.id)
      .map(j => j.tahunAjaran);

    const tahunFromTahunAjaran = tahunAjaran.map(ta => ta.tahun);

    const allTahun = [...new Set([...tahunFromJadwal, ...tahunFromTahunAjaran])];
    return allTahun.sort((a, b) => b.localeCompare(a));
  }, [allJadwalPelajaran, tahunAjaran, guru.id]);

  // Initialize selectedTahunAjaran and selectedSemester
  // Use activeTahunAjaran if available, otherwise use first available from jadwal or tahunAjaran data
  const initialTahunAjaran = React.useMemo(() => {
    if (activeTahunAjaran?.tahun) return activeTahunAjaran.tahun;
    if (availableTahunAjaranList.length > 0) return availableTahunAjaranList[0];
    return '';
  }, [activeTahunAjaran, availableTahunAjaranList]);

  const getInitialSemester = (tahun: string) => {
    if (tahun === activeTahunAjaran?.tahun && activeTahunAjaran?.semester) {
      return activeTahunAjaran.semester;
    }
    
    // Get available semesters for the tahun
    const semestersFromJadwal = allJadwalPelajaran
      .filter(j => j.guruId === guru.id && j.tahunAjaran === tahun)
      .map(j => j.semester);
    
    const semestersFromTahunAjaran = tahunAjaran
      .filter(ta => ta.tahun === tahun)
      .map(ta => ta.semester);
    
    const allSemesters = [...new Set([...semestersFromJadwal, ...semestersFromTahunAjaran])].sort();
    return allSemesters.length > 0 ? allSemesters[0] : 1;
  };

  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>(initialTahunAjaran);
  const [selectedSemester, setSelectedSemester] = useState<number>(getInitialSemester(initialTahunAjaran));

  // Update when activeTahunAjaran changes (but only if user hasn't manually selected)
  React.useEffect(() => {
    if (activeTahunAjaran?.tahun && selectedTahunAjaran === '') {
      setSelectedTahunAjaran(activeTahunAjaran.tahun);
      setSelectedSemester(activeTahunAjaran.semester);
    }
  }, [activeTahunAjaran]);

  // Get available semesters when tahun ajaran changes
  const availableSemesters = React.useMemo(() => {
    if (!selectedTahunAjaran) return [1, 2];

    const semestersFromJadwal = allJadwalPelajaran
      .filter(j => j.guruId === guru.id && j.tahunAjaran === selectedTahunAjaran)
      .map(j => j.semester);

    const semestersFromTahunAjaran = tahunAjaran
      .filter(ta => ta.tahun === selectedTahunAjaran)
      .map(ta => ta.semester);

    const allSemesters = [...new Set([...semestersFromJadwal, ...semestersFromTahunAjaran])].sort();
    return allSemesters.length > 0 ? allSemesters : [1, 2];
  }, [selectedTahunAjaran, allJadwalPelajaran, tahunAjaran, guru.id]);

  // Update semester when tahun ajaran changes
  React.useEffect(() => {
    if (selectedTahunAjaran && availableSemesters.length > 0) {
      if (!availableSemesters.includes(selectedSemester)) {
        setSelectedSemester(availableSemesters[0]);
      }
    }
  }, [selectedTahunAjaran, availableSemesters, selectedSemester]);

  // Get jadwal pelajaran filtered by guru, tahun ajaran, and semester
  const { jadwalPelajaran } = useJadwalPelajaran(
    selectedTahunAjaran && selectedSemester
      ? {
          guruId: guru.id,
          tahunAjaran: selectedTahunAjaran,
          semester: selectedSemester,
        }
      : undefined
  );

  const guruSchedules = useMemo(() => {
    if (!selectedTahunAjaran || !selectedSemester) return [];
    return jadwalPelajaran.filter(j =>
      j.guruId === guru.id &&
      j.tahunAjaran === selectedTahunAjaran &&
      j.semester === selectedSemester
    );
  }, [jadwalPelajaran, guru.id, selectedTahunAjaran, selectedSemester]);

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

  const handleUpdateJurnal = async (sesiId: string, jurnal: JurnalMengajar) => {
    try {
      await updateSesiAbsensi(sesiId, { jurnal });
      // Refresh to get updated data
      await refreshSesiAbsensi();
    } catch (error) {
      console.error('Error updating jurnal:', error);
    }
  };

  const getBreadcrumb = () => {
    const breadcrumbs: string[] = [t('detailAbsensiModal.riwayatPertemuan')];

    if (navigation.level === 'murid' || navigation.level === 'mapel') {
      const kelasData = kelas.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelasData?.name || t('detailAbsensiModal.kelas'));
      breadcrumbs.push(navigation.level === 'murid' ? t('detailAbsensiModal.dataMurid') : t('detailAbsensiModal.mataPelajaran'));
    } else if (navigation.level === 'pertemuan') {
      const kelasData = kelas.find(k => k.id === navigation.kelasId);
      const mapelData = mataPelajaran.find(m => m.id === navigation.mapelId);
      breadcrumbs.push(kelasData?.name || t('detailAbsensiModal.kelas'));
      breadcrumbs.push(t('detailAbsensiModal.mataPelajaran'));
      breadcrumbs.push(mapelData?.name || 'Mapel');
    } else if (navigation.level === 'absensi') {
      const kelasData = kelas.find(k => k.id === navigation.kelasId);
      const mapelData = mataPelajaran.find(m => m.id === navigation.mapelId);
      breadcrumbs.push(kelasData?.name || t('detailAbsensiModal.kelas'));
      breadcrumbs.push(t('detailAbsensiModal.mataPelajaran'));
      breadcrumbs.push(mapelData?.name || 'Mapel');
      breadcrumbs.push(t('detailAbsensiModal.detailAbsensiLabel'));
    } else if (navigation.level === 'rekap') {
      const kelasData = kelas.find(k => k.id === navigation.kelasId);
      const mapelData = mataPelajaran.find(m => m.id === navigation.mapelId);
      breadcrumbs.push(kelasData?.name || t('detailAbsensiModal.kelas'));
      breadcrumbs.push(t('detailAbsensiModal.mataPelajaran'));
      breadcrumbs.push(mapelData?.name || 'Mapel');
      breadcrumbs.push(t('detailAbsensiModal.rekapAbsensiPertemuan'));
    }

    return breadcrumbs;
  };

  const availableTahunAjaran = React.useMemo(() => {
    return availableTahunAjaranList;
  }, [availableTahunAjaranList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-2 md:space-x-4">
          {navigation.level !== 'kelas' && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Kembali"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
              {getBreadcrumb()[getBreadcrumb().length - 1]}
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
              {getBreadcrumb().slice(0, -1).join(' / ')}
            </p>
          </div>
        </div>
        {navigation.level === 'kelas' && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">{t('detailAbsensiModal.tahun')}:</label>
              <select
                value={selectedTahunAjaran}
                onChange={(e) => setSelectedTahunAjaran(e.target.value)}
                className="px-2 md:px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
              >
                {availableTahunAjaran.map(ta => (
                  <option key={ta} value={ta}>{ta}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">{t('detailAbsensiModal.semester')}:</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="px-2 md:px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
              >
                {availableSemesters.map(sem => (
                  <option key={sem} value={sem}>
                    {sem === 1 ? `${t('detailAbsensiModal.ganjil')} (1)` : `${t('detailAbsensiModal.genap')} (2)`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {navigation.level === 'kelas' && (
        <KelasListView
          mySchedules={guruSchedules}
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
          mySchedules={guruSchedules}
          mataPelajaran={mataPelajaran}
          kelas={kelas}
          users={users}
          sesiAbsensi={sesiAbsensi}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          onViewPertemuan={handleViewPertemuan}
          onViewRekap={handleViewRekap}
          onUpdateJurnal={handleUpdateJurnal}
          isAdminView={true}
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
          isAdminView={true}
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
          isAdminView={true}
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

export default LihatPertemuanView;
