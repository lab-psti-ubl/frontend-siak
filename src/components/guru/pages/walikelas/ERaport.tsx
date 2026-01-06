import React, { useState, useEffect, useMemo } from 'react';
import { FileText, AlertCircle, Loader2, Download } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { useAuth } from '../../../../context/AuthContext';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useERaport } from '../../../../hooks/useERaport';
import { useAlumni } from '../../../../hooks/useAlumni';
import { useProfilSekolah } from '../../../../hooks/useProfilSekolah';
import { User } from '../../../../types';
import ERaportTable from './components/e-raport/ERaportTable';
import ERaportDetailModal from './components/e-raport/ERaportDetailModal';
import { downloadERaportZip } from '../../../../utils/eRaportPdfUtils';
import { 
  getKelasForTahunAjaran, 
  getMuridForSelectedPeriod 
} from './components/data-murid-kelas/DataMuridKelasUtils';

const ERaport: React.FC = () => {
  const { user } = useAuth();
  
  const { murid: users } = useMurid();
  const { kelas } = useKelas();
  const { tahunAjaran, activeTahunAjaran: activeTahunAjaranFromHook } = useTahunAjaran();
  const { alumni } = useAlumni();
  const { profilSekolah } = useProfilSekolah();
  
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Get available semesters for selected tahun ajaran
  const availableSemesters = useMemo(() => {
    if (!selectedTahunAjaran) return [];
    
    // Ambil semua semester yang ada di database untuk tahun ajaran ini
    const semestersFromTahunAjaran = tahunAjaran
      .filter(ta => ta.tahun === selectedTahunAjaran)
      .map(ta => ta.semester);
    
    // Hapus duplikat dan urutkan
    return Array.from(new Set(semestersFromTahunAjaran)).sort((a, b) => a - b);
  }, [selectedTahunAjaran, tahunAjaran]);

  // Initialize selectedTahunAjaran and selectedSemester from activeTahunAjaran
  useEffect(() => {
    if (activeTahunAjaranFromHook) {
      setSelectedTahunAjaran(activeTahunAjaranFromHook.tahun);
      setSelectedSemester(activeTahunAjaranFromHook.semester);
    }
  }, [activeTahunAjaranFromHook]);

  // Reset selectedSemester if it's not available for the selected tahun ajaran
  useEffect(() => {
    if (selectedTahunAjaran && availableSemesters.length > 0) {
      if (!availableSemesters.includes(selectedSemester)) {
        // Set to first available semester or active semester if available
        const activeTA = tahunAjaran.find(ta => ta.tahun === selectedTahunAjaran && ta.isActive);
        const newSemester = activeTA?.semester || availableSemesters[0];
        setSelectedSemester(newSemester);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTahunAjaran, availableSemesters, tahunAjaran]);

  const activeTahunAjaran = activeTahunAjaranFromHook || tahunAjaran.find(ta => ta.isActive);

  // Get E-Raport data
  const { eraport, loading: eraportLoading, generateERaport, refreshERaport } = useERaport(
    user?.kelasWali && selectedTahunAjaran && selectedSemester
      ? {
          kelasId: user.kelasWali,
          tahunAjaran: selectedTahunAjaran,
          semester: selectedSemester,
        }
      : undefined
  );

  if (!user?.isWaliKelas || !user.kelasWali) {
    return (
      <Card className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
        <p className="text-gray-600">Anda tidak memiliki akses sebagai wali kelas.</p>
      </Card>
    );
  }

  let targetKelas = null;
  let kelasError = null;

  try {
    targetKelas = getKelasForTahunAjaran(user.kelasWali, selectedTahunAjaran, activeTahunAjaran, kelas);
  } catch (error) {
    if (error instanceof Error) {
      kelasError = error.message;
    }
  }

  const muridKelas = getMuridForSelectedPeriod(
    targetKelas,
    selectedTahunAjaran,
    activeTahunAjaran,
    users,
    kelas,
    user.kelasWali,
    alumni
  );

  // Create a map of muridId to status (berhasil/gagal)
  const muridStatusMap = useMemo(() => {
    const statusMap: Record<string, 'berhasil' | 'gagal'> = {};
    
    if (eraport && eraport.muridData) {
      muridKelas.forEach(murid => {
        const muridData = eraport.muridData.find(m => m.muridId === murid.id);
        statusMap[murid.id] = muridData ? 'berhasil' : 'gagal';
      });
    } else {
      // If no eraport data, all are 'gagal'
      muridKelas.forEach(murid => {
        statusMap[murid.id] = 'gagal';
      });
    }
    
    return statusMap;
  }, [eraport, muridKelas]);

  // Calculate peringkat based on average nilai akhir
  const muridWithPeringkat = useMemo(() => {
    return muridKelas.map(murid => {
      let avgNilai = 0;
      if (eraport) {
        const muridData = eraport.muridData.find(m => m.muridId === murid.id);
        if (muridData && muridData.nilaiMataPelajaran.length > 0) {
          const totalNilai = muridData.nilaiMataPelajaran.reduce((sum, item) => sum + item.nilaiAkhir, 0);
          avgNilai = totalNilai / muridData.nilaiMataPelajaran.length;
        }
      }
      return { ...murid, avgNilai };
    }).sort((a, b) => b.avgNilai - a.avgNilai)
      .map((murid, index) => ({ ...murid, peringkat: index + 1 }));
  }, [muridKelas, eraport]);

  const handleGenerateERaport = async () => {
    if (!targetKelas || !selectedTahunAjaran || !selectedSemester) {
      alert('Data kelas, tahun ajaran, atau semester tidak lengkap');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin generate E-Raport untuk kelas ${targetKelas.name}, ${selectedTahunAjaran} Semester ${selectedSemester}?`)) {
      return;
    }

    setIsGenerating(true);
    try {
      await generateERaport();
      await refreshERaport(true);
      alert('E-Raport berhasil di-generate!');
    } catch (error: any) {
      alert(error.message || 'Gagal generate E-Raport');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewDetail = (murid: User) => {
    setSelectedMurid(murid);
    setIsDetailModalOpen(true);
  };

  const handleDownloadZip = async () => {
    if (!eraport || !targetKelas) {
      alert('Data E-Raport tidak tersedia. Silakan generate E-Raport terlebih dahulu.');
      return;
    }

    if (muridKelas.length === 0) {
      alert('Tidak ada murid di kelas ini.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin mengunduh ZIP berisi semua E-Raport untuk ${muridKelas.length} murid?`)) {
      return;
    }

    setIsDownloadingZip(true);
    try {
      await downloadERaportZip(eraport, muridKelas, profilSekolah || null);
    } catch (error: any) {
      console.error('Error downloading ZIP:', error);
      alert(error.message || 'Gagal mengunduh ZIP E-Raport. Silakan coba lagi.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-teal-200">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2 sm:p-2.5">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Nilai E-Raport</h3>
              <p className="text-xs sm:text-sm text-teal-100">Generate dan kelola E-Raport murid kelas</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Tahun Ajaran
                </label>
                <select
                  value={selectedTahunAjaran}
                  onChange={(e) => setSelectedTahunAjaran(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                >
                  {tahunAjaran.map(ta => (
                    <option key={ta.tahun} value={ta.tahun}>{ta.tahun}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(Number(e.target.value))}
                  disabled={availableSemesters.length === 0}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  {availableSemesters.length === 0 ? (
                    <option value="">Tidak ada semester</option>
                  ) : (
                    availableSemesters.map(sem => (
                      <option key={sem} value={sem}>
                        Semester {sem} {sem === 1 ? '(Ganjil)' : '(Genap)'}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="flex-shrink-0 flex gap-2">
              <Button
                onClick={handleGenerateERaport}
                disabled={isGenerating || !targetKelas}
                variant="primary"
                className="w-full sm:w-auto justify-center flex items-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    <span>Generate E-Raport</span>
                  </>
                )}
              </Button>
              {eraport && muridKelas.length > 0 && (
                <Button
                  onClick={handleDownloadZip}
                  disabled={isDownloadingZip || !eraport}
                  variant="success"
                  className="w-full sm:w-auto justify-center flex items-center"
                >
                  {isDownloadingZip ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Mengunduh...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      <span>Download ZIP</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">Periode Aktif</p>
                <p className="text-sm sm:text-base font-medium text-slate-900 mt-1">
                  Kelas: <span className="text-teal-600">{targetKelas?.name || '-'}</span> • {selectedTahunAjaran} Semester {selectedSemester}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs sm:text-sm text-slate-600">
                  {muridKelas.length} murid
                </span>
                {selectedTahunAjaran === activeTahunAjaran?.tahun && selectedSemester === activeTahunAjaran?.semester && (
                  <span className="text-xs sm:text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                    Periode Aktif
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {kelasError ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Konfigurasi Tidak Lengkap</h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-4">
              {kelasError}
            </p>
          </div>
        </div>
      ) : !targetKelas ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Kelas Tidak Ditemukan</h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
              Tidak dapat menentukan kelas untuk tahun ajaran {selectedTahunAjaran}.
            </p>
          </div>
        </div>
      ) : (
        <ERaportTable
          muridKelas={muridWithPeringkat}
          eraport={eraport}
          muridStatusMap={muridStatusMap}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
          targetKelas={targetKelas}
          onViewDetail={handleViewDetail}
        />
      )}

      {targetKelas && eraport && (
        <ERaportDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedMurid(null);
          }}
          selectedMurid={selectedMurid}
          eraport={eraport}
          targetKelas={targetKelas}
          selectedTahunAjaran={selectedTahunAjaran}
          selectedSemester={selectedSemester}
        />
      )}
    </div>
  );
};

export default ERaport;

