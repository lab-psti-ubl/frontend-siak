import React, { useState, useMemo } from 'react';
import { ChevronLeft, Calendar } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { JurnalMengajar } from '../../../../types';
import { useJadwalTahfiz } from '../../../../hooks/useJadwalTahfiz';
import { useSesiAbsensiTahfiz } from '../../../../hooks/useSesiAbsensiTahfiz';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../hooks/useSantri';
import KelasTahfizListView from './components/riwayat-absensi-tahfiz/KelasTahfizListView';
import PertemuanTahfizListView from './components/riwayat-absensi-tahfiz/PertemuanTahfizListView';
import AbsensiTahfizDetailView from './components/riwayat-absensi-tahfiz/AbsensiTahfizDetailView';
import RekapAbsenTahfizView from './components/riwayat-absensi-tahfiz/RekapAbsenTahfizView';
import SantriTahfizListView from './components/riwayat-absensi-tahfiz/SantriTahfizListView';
import MateriTahfizModal from './components/riwayat-absensi-tahfiz/MateriTahfizModal';
import { apiService } from '../../../../services/apiService';

type ViewLevel = 'kelas' | 'santri' | 'materi' | 'pertemuan' | 'absensi' | 'rekap';

interface NavigationState {
  level: ViewLevel;
  kelasId?: string;
  jadwalId?: string;
  sesiId?: string;
}

const RiwayatAbsensiTahfiz: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // Use hooks with cache
  const { jadwalTahfiz } = useJadwalTahfiz();
  const { sesiAbsensiTahfiz } = useSesiAbsensiTahfiz();
  const { kelasTahfiz } = useKelasTahfiz();
  const { santri } = useSantri();

  const [navigation, setNavigation] = useState<NavigationState>({
    level: 'kelas'
  });

  const [selectedTahun, setSelectedTahun] = useState<string>(new Date().getFullYear().toString());

  // Filter jadwal tahfiz for logged-in ustadz
  const mySchedules = useMemo(() => {
    if (!user?.id) return [];
    return jadwalTahfiz.filter(j => {
      const kelas = kelasTahfiz.find(k => k.id === j.kelasId);
      return kelas && kelas.ustadzId === user.id;
    });
  }, [jadwalTahfiz, kelasTahfiz, user?.id]);

  // Filter sesi absensi by selected year
  const filteredSesiAbsensi = useMemo(() => {
    return sesiAbsensiTahfiz.filter(s => {
      const jadwal = mySchedules.find(j => j.id === s.jadwalId);
      return jadwal && s.tahun === selectedTahun;
    });
  }, [sesiAbsensiTahfiz, mySchedules, selectedTahun]);

  // Get available years from sesi absensi
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    sesiAbsensiTahfiz.forEach(s => {
      if (mySchedules.some(j => j.id === s.jadwalId)) {
        years.add(s.tahun);
      }
    });
    // Add current year if not present
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [sesiAbsensiTahfiz, mySchedules]);

  React.useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedTahun)) {
      setSelectedTahun(availableYears[0]);
    }
  }, [availableYears, selectedTahun]);

  const handleBack = () => {
    if (navigation.level === 'santri' || navigation.level === 'materi') {
      setNavigation({ level: 'kelas' });
    } else if (navigation.level === 'pertemuan') {
      setNavigation({ level: 'kelas' });
    } else if (navigation.level === 'absensi') {
      setNavigation({ 
        level: 'pertemuan', 
        kelasId: navigation.kelasId, 
        jadwalId: navigation.jadwalId 
      });
    } else if (navigation.level === 'rekap') {
      setNavigation({ level: 'kelas' });
    }
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

  const handleViewSantri = (kelasId: string) => {
    setNavigation({ level: 'santri', kelasId });
  };

  const handleViewMateri = (kelasId: string, jadwalId: string) => {
    setNavigation({ level: 'materi', kelasId, jadwalId });
  };

  const handleUpdateJurnal = async (jadwalId: string, kelasId: string, tanggal: string, jurnal: JurnalMengajar) => {
    try {
      // Check if jurnal tahfiz exists
      const existingJurnal = await apiService.getJurnalTahfizByJadwalIdAndTanggal(jadwalId, tanggal, kelasId);
      
      // Get tahun from sesiAbsensiTahfiz or use current year
      const sesi = sesiAbsensiTahfiz.find(s => s.jadwalId === jadwalId && s.tanggal === tanggal);
      const tahun = sesi?.tahun || new Date().getFullYear().toString();
      
      if (existingJurnal.success && existingJurnal.jurnalTahfiz) {
        // Update existing jurnal tahfiz
        await apiService.updateJurnalTahfiz(existingJurnal.jurnalTahfiz.id, {
          tanggal: tanggal,
          judul: jurnal.judul,
          deskripsi: jurnal.deskripsi,
          waktuInput: new Date().toISOString(),
          file: jurnal.file,
        });
      } else {
        // Create new jurnal tahfiz
        const jurnalId = `jurnal-tahfiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await apiService.createJurnalTahfiz({
          id: jurnalId,
          jadwalId,
          kelasId,
          tanggal,
          judul: jurnal.judul,
          deskripsi: jurnal.deskripsi,
          waktuInput: new Date().toISOString(),
          file: jurnal.file,
          tahun
        });
      }
    } catch (error) {
      console.error('Error updating jurnal:', error);
      throw error;
    }
  };

  const getBreadcrumb = () => {
    const breadcrumbs: string[] = [t('tahfiz.guruTahfiz.riwayatAbsensiTahfiz.title')];

    if (navigation.level === 'santri') {
      const kelasData = kelasTahfiz.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelasData?.namaKelas || 'Kelas');
      breadcrumbs.push('Data Santri');
    } else if (navigation.level === 'materi') {
      const kelasData = kelasTahfiz.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelasData?.namaKelas || 'Kelas');
      breadcrumbs.push('Materi');
    } else if (navigation.level === 'pertemuan') {
      const kelasData = kelasTahfiz.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelasData?.namaKelas || 'Kelas');
      breadcrumbs.push('Pertemuan');
    } else if (navigation.level === 'absensi') {
      const kelasData = kelasTahfiz.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelasData?.namaKelas || 'Kelas');
      breadcrumbs.push('Pertemuan');
      breadcrumbs.push('Detail Absensi');
    } else if (navigation.level === 'rekap') {
      const kelasData = kelasTahfiz.find(k => k.id === navigation.kelasId);
      breadcrumbs.push(kelasData?.namaKelas || 'Kelas');
      breadcrumbs.push('Rekap Absensi Pertemuan');
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumb();
  const currentPageTitle = breadcrumbs[breadcrumbs.length - 1];
  const breadcrumbPath = breadcrumbs.slice(0, -1);

  return (
    <div className="space-y-5 lg:space-y-6">
      {navigation.level === 'kelas' && (
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  {t('tahfiz.guruTahfiz.riwayatAbsensiTahfiz.title')}
                </h1>
                <p className="text-sm sm:text-base text-emerald-100">
                  {t('tahfiz.guruTahfiz.riwayatAbsensiTahfiz.subtitle')}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 w-fit">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="text-xs sm:text-sm text-white font-medium">
                  {t('tahfiz.guruTahfiz.riwayatAbsensiTahfiz.tahun')} {selectedTahun}
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
              aria-label={t('tahfiz.guruTahfiz.riwayatAbsensiTahfiz.kembali')}
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
              <label className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wide">{t('tahfiz.guruTahfiz.riwayatAbsensiTahfiz.tahun')}</label>
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {navigation.level === 'kelas' && (
        <KelasTahfizListView
          mySchedules={mySchedules}
          kelasTahfiz={kelasTahfiz}
          santri={santri}
          sesiAbsensiTahfiz={filteredSesiAbsensi}
          selectedTahun={selectedTahun}
          onViewPertemuan={handleViewPertemuan}
          onViewRekap={handleViewRekap}
          onViewSantri={handleViewSantri}
          onViewMateri={handleViewMateri}
        />
      )}

      {navigation.level === 'santri' && navigation.kelasId && (
        <SantriTahfizListView
          kelasId={navigation.kelasId}
          santri={santri}
          kelasTahfiz={kelasTahfiz}
        />
      )}

      {navigation.level === 'materi' && navigation.kelasId && navigation.jadwalId && (
        <MateriTahfizModal
          isOpen={true}
          onClose={() => setNavigation({ level: 'kelas' })}
          kelasId={navigation.kelasId}
          jadwalId={navigation.jadwalId}
          sesiAbsensiTahfiz={filteredSesiAbsensi}
          jadwalTahfiz={jadwalTahfiz}
          kelasTahfiz={kelasTahfiz}
          selectedTahun={selectedTahun}
          onUpdateJurnal={handleUpdateJurnal}
        />
      )}

      {navigation.level === 'pertemuan' && navigation.kelasId && navigation.jadwalId && (
        <PertemuanTahfizListView
          kelasId={navigation.kelasId}
          jadwalId={navigation.jadwalId}
          sesiAbsensiTahfiz={filteredSesiAbsensi}
          jadwalTahfiz={jadwalTahfiz}
          onViewAbsensi={handleViewAbsensi}
          selectedTahun={selectedTahun}
        />
      )}

      {navigation.level === 'absensi' && navigation.sesiId && navigation.jadwalId && (
        <AbsensiTahfizDetailView
          sesiId={navigation.sesiId}
          jadwalId={navigation.jadwalId}
          kelasId={navigation.kelasId || ''}
          sesiAbsensiTahfiz={filteredSesiAbsensi}
          jadwalTahfiz={jadwalTahfiz}
          santri={santri}
          kelasTahfiz={kelasTahfiz}
          selectedTahun={selectedTahun}
        />
      )}

      {navigation.level === 'rekap' && navigation.kelasId && navigation.jadwalId && (
        <RekapAbsenTahfizView
          kelasId={navigation.kelasId}
          jadwalId={navigation.jadwalId}
          sesiAbsensiTahfiz={filteredSesiAbsensi}
          santri={santri}
          kelasTahfiz={kelasTahfiz}
          jadwalTahfiz={jadwalTahfiz}
        />
      )}
    </div>
  );
};

export default RiwayatAbsensiTahfiz;

