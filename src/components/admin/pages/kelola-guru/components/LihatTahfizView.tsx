import React, { useState, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import { User, SesiAbsensiTahfiz, TahfizSchedule } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';
import KelasTahfizListView from './KelasTahfizListView';
import SantriTahfizListView from './SantriTahfizListView';
import JadwalTahfizListView from './JadwalTahfizListView';
import PertemuanTahfizListView from './PertemuanTahfizListView';
import AbsensiTahfizDetailView from './AbsensiTahfizDetailView';
import RekapAbsenTahfizView from './RekapAbsenTahfizView';

type ViewLevel = 'kelas' | 'murid' | 'tahfiz' | 'pertemuan' | 'absensi' | 'rekap';

interface NavigationState {
  level: ViewLevel;
  kelasId?: string;
  jadwalId?: string;
  sesiId?: string;
}

interface LihatTahfizViewProps {
  guru: User;
  jadwalTahfiz: TahfizSchedule[];
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  kelasTahfiz: TahfizClass[];
  onViewJurnalFile: (file: any) => void;
}

const LihatTahfizView: React.FC<LihatTahfizViewProps> = ({
  guru,
  jadwalTahfiz,
  sesiAbsensiTahfiz,
  kelasTahfiz,
  onViewJurnalFile
}) => {
  const { t } = useLanguage();
  const [navigation, setNavigation] = useState<NavigationState>({
    level: 'kelas'
  });

  // Get available years from sesiAbsensiTahfiz
  const availableYears = useMemo(() => {
    const years = sesiAbsensiTahfiz
      .map(s => s.tahun)
      .filter((year, index, self) => self.indexOf(year) === index)
      .sort((a, b) => b.localeCompare(a));
    return years.length > 0 ? years : [new Date().getFullYear().toString()];
  }, [sesiAbsensiTahfiz]);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0] || new Date().getFullYear().toString());

  // Get jadwal tahfiz for this ustadz's classes
  const myJadwalTahfiz = useMemo(() => {
    const myKelasIds = kelasTahfiz.filter(k => k.ustadzId === guru.id).map(k => k.id);
    return jadwalTahfiz.filter(j => myKelasIds.includes(j.kelasId));
  }, [jadwalTahfiz, kelasTahfiz, guru.id]);

  // Get only classes where this ustadz teaches
  const myKelasTahfiz = useMemo(() => {
    return kelasTahfiz.filter(k => k.ustadzId === guru.id);
  }, [kelasTahfiz, guru.id]);

  const handleBack = () => {
    if (navigation.level === 'murid' || navigation.level === 'tahfiz') {
      setNavigation({ level: 'kelas' });
    } else if (navigation.level === 'pertemuan') {
      setNavigation({ level: 'tahfiz', kelasId: navigation.kelasId });
    } else if (navigation.level === 'absensi') {
      setNavigation({ level: 'pertemuan', kelasId: navigation.kelasId, jadwalId: navigation.jadwalId });
    } else if (navigation.level === 'rekap') {
      setNavigation({ level: 'tahfiz', kelasId: navigation.kelasId });
    }
  };

  const handleViewMurid = (kelasId: string) => {
    setNavigation({ level: 'murid', kelasId });
  };

  const handleViewTahfiz = (kelasId: string) => {
    setNavigation({ level: 'tahfiz', kelasId });
  };

  const handleViewPertemuan = (kelasId: string, jadwalId: string) => {
    setNavigation({ level: 'pertemuan', kelasId, jadwalId });
  };

  const handleViewAbsensi = (kelasId: string, jadwalId: string, sesiId: string) => {
    setNavigation({ level: 'absensi', kelasId, jadwalId, sesiId });
  };

  const handleViewRekap = (kelasId: string, jadwalId: string) => {
    setNavigation({ level: 'rekap', kelasId, jadwalId });
  };

  const handleViewMateri = (_jadwal: TahfizSchedule, _kelas: TahfizClass) => {
    // Handled by JadwalTahfizListView
  };

  const getBreadcrumb = () => {
    const breadcrumbs: string[] = [t('detailAbsensiModal.riwayatTahfiz')];

    if (navigation.level === 'murid') {
      const kelas = kelasTahfiz.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelas?.namaKelas || t('detailAbsensiModal.kelas'));
      breadcrumbs.push(t('detailAbsensiModal.dataSantri'));
    } else if (navigation.level === 'tahfiz') {
      const kelas = kelasTahfiz.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelas?.namaKelas || t('detailAbsensiModal.kelas'));
      breadcrumbs.push(t('detailAbsensiModal.tahfiz'));
    } else if (navigation.level === 'pertemuan') {
      const kelas = kelasTahfiz.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelas?.namaKelas || t('detailAbsensiModal.kelas'));
      breadcrumbs.push(t('detailAbsensiModal.tahfiz'));
      breadcrumbs.push(t('detailAbsensiModal.pertemuan'));
    } else if (navigation.level === 'absensi') {
      const kelas = kelasTahfiz.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelas?.namaKelas || t('detailAbsensiModal.kelas'));
      breadcrumbs.push(t('detailAbsensiModal.tahfiz'));
      breadcrumbs.push(t('detailAbsensiModal.pertemuan'));
      breadcrumbs.push(t('detailAbsensiModal.detailAbsensiLabel'));
    } else if (navigation.level === 'rekap') {
      const kelas = kelasTahfiz.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelas?.namaKelas || t('detailAbsensiModal.kelas'));
      breadcrumbs.push(t('detailAbsensiModal.tahfiz'));
      breadcrumbs.push(t('detailAbsensiModal.rekapAbsensiPertemuan'));
    }

    return breadcrumbs;
  };

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
          <div className="flex items-center gap-2">
            <label className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">{t('detailAbsensiModal.tahun')}:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-2 md:px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {navigation.level === 'kelas' && (
        <KelasTahfizListView
          kelasTahfiz={myKelasTahfiz}
          jadwalTahfiz={myJadwalTahfiz}
          sesiAbsensiTahfiz={sesiAbsensiTahfiz}
          selectedYear={selectedYear}
          onViewMurid={handleViewMurid}
          onViewTahfiz={handleViewTahfiz}
        />
      )}

      {navigation.level === 'murid' && navigation.kelasId && (
        <SantriTahfizListView
          kelasId={navigation.kelasId}
          kelasTahfiz={kelasTahfiz}
        />
      )}

      {navigation.level === 'tahfiz' && navigation.kelasId && (
        <JadwalTahfizListView
          kelasId={navigation.kelasId}
          jadwalTahfiz={myJadwalTahfiz}
          kelasTahfiz={kelasTahfiz}
          sesiAbsensiTahfiz={sesiAbsensiTahfiz}
          selectedYear={selectedYear}
          onViewPertemuan={handleViewPertemuan}
          onViewRekap={handleViewRekap}
          onViewMateri={handleViewMateri}
          onViewJurnalFile={onViewJurnalFile}
        />
      )}

      {navigation.level === 'pertemuan' && navigation.kelasId && navigation.jadwalId && (
        <PertemuanTahfizListView
          kelasId={navigation.kelasId}
          jadwalId={navigation.jadwalId}
          sesiAbsensiTahfiz={sesiAbsensiTahfiz}
          jadwalTahfiz={jadwalTahfiz}
          kelasTahfiz={kelasTahfiz}
          selectedYear={selectedYear}
          onViewAbsensi={handleViewAbsensi}
        />
      )}

      {navigation.level === 'absensi' && navigation.sesiId && navigation.jadwalId && navigation.kelasId && (
        <AbsensiTahfizDetailView
          sesiId={navigation.sesiId}
          jadwalId={navigation.jadwalId}
          kelasId={navigation.kelasId}
          sesiAbsensiTahfiz={sesiAbsensiTahfiz}
          jadwalTahfiz={jadwalTahfiz}
          kelasTahfiz={kelasTahfiz}
          onViewJurnalFile={onViewJurnalFile}
        />
      )}

      {navigation.level === 'rekap' && navigation.kelasId && navigation.jadwalId && (
        <RekapAbsenTahfizView
          kelasId={navigation.kelasId}
          jadwalId={navigation.jadwalId}
          sesiAbsensiTahfiz={sesiAbsensiTahfiz}
          jadwalTahfiz={jadwalTahfiz}
          kelasTahfiz={kelasTahfiz}
          selectedYear={selectedYear}
        />
      )}
    </div>
  );
};

export default LihatTahfizView;
