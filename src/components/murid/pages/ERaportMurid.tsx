import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Calendar, AlertCircle, Loader2, Download } from 'lucide-react';
import Card from '../../ui/Card';
import { useAuth } from '../../../context/AuthContext';
import { useKelas } from '../../../hooks/useKelas';
import { useTahunAjaran } from '../../../hooks/useTahunAjaran';
import { useRiwayatKelasMurid } from '../../../hooks/useRiwayatKelasMurid';
import { useERaportByMurid } from '../../../hooks/useERaportByMurid';
import { useProfilSekolah } from '../../../hooks/useProfilSekolah';
import { getKelasIdByMuridAndTahunAjaran } from '../../../utils/riwayatKelasMuridUtils';
import { downloadERaportPDF, generateERaportPDFBlob } from '../../../utils/eRaportPdfUtils';
import { TahunAjaran } from '../../../types';

const ERaportMurid: React.FC = () => {
  const { user } = useAuth();
  const { kelas } = useKelas();
  const { tahunAjaran, activeTahunAjaran: activeTahunAjaranFromHook } = useTahunAjaran();
  const { riwayatKelasMurid } = useRiwayatKelasMurid({ muridId: user?.id });
  const { profilSekolah } = useProfilSekolah();

  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Initialize selectedTahunAjaran and selectedSemester from activeTahunAjaran
  useEffect(() => {
    if (activeTahunAjaranFromHook) {
      setSelectedTahunAjaran(activeTahunAjaranFromHook.tahun);
      setSelectedSemester(activeTahunAjaranFromHook.semester);
    }
  }, [activeTahunAjaranFromHook]);

  const activeTahunAjaran = activeTahunAjaranFromHook || tahunAjaran.find(ta => ta.isActive);

  // Get available tahun ajaran from riwayat kelas murid and tahun ajaran data
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
      return Array.from(
        new Map(tahunAjaran.map(ta => [ta.tahun, ta])).values()
      ).sort((a, b) => {
        const yearA = parseInt(a.tahun.split('/')[0]);
        const yearB = parseInt(b.tahun.split('/')[0]);
        return yearB - yearA;
      });
    }

    // Return tahun ajaran objects sorted by year
    return allTahunAjaran
      .map(tahun => tahunAjaran.find(ta => ta.tahun === tahun))
      .filter((ta): ta is TahunAjaran => ta !== undefined)
      .sort((a, b) => {
        const yearA = parseInt(a.tahun.split('/')[0]);
        const yearB = parseInt(b.tahun.split('/')[0]);
        return yearB - yearA;
      });
  }, [riwayatKelasMurid, user?.id, tahunAjaran, activeTahunAjaran]);

  // Get available semesters for selected tahun ajaran
  const availableSemesters = useMemo(() => {
    const semestersFromTahunAjaran = tahunAjaran
      .filter(ta => ta.tahun === selectedTahunAjaran)
      .map(ta => ta.semester);

    // Get semesters from riwayat kelas murid
    const semestersFromRiwayat = riwayatKelasMurid
      .filter(r => r.muridId === user?.id && r.tahunAjaran === tahunAjaran.find(ta => ta.tahun === selectedTahunAjaran)?.id)
      .map(r => r.semester);

    // Combine all semesters
    const allSemesters = [...new Set([...semestersFromTahunAjaran, ...semestersFromRiwayat])]
      .sort((a, b) => a - b);

    return allSemesters.length > 0 ? allSemesters : [1, 2];
  }, [selectedTahunAjaran, tahunAjaran, riwayatKelasMurid, user?.id]);

  // Get kelasId for selected tahun ajaran
  const kelasIdForTahunAjaran = useMemo(() => {
    if (!user?.id || !selectedTahunAjaran) return null;

    const tahunAjaranData = tahunAjaran.find(ta => ta.tahun === selectedTahunAjaran);
    if (!tahunAjaranData) return null;

    const currentKelasId = (user as any)?.kelasId;
    if (!currentKelasId) return null;

    return getKelasIdByMuridAndTahunAjaran(
      user.id,
      tahunAjaranData.id,
      riwayatKelasMurid,
      currentKelasId
    );
  }, [user?.id, selectedTahunAjaran, tahunAjaran, riwayatKelasMurid]);

  // Fetch E-Raport data
  const { eraport, loading: eraportLoading, error: eraportError } = useERaportByMurid(
    user?.id && kelasIdForTahunAjaran && selectedTahunAjaran && selectedSemester
      ? {
          muridId: user.id,
          kelasId: kelasIdForTahunAjaran,
          tahunAjaran: selectedTahunAjaran,
          semester: selectedSemester,
        }
      : undefined
  );

  // Get murid data from eraport
  const muridData = useMemo(() => {
    if (!eraport || !user?.id) return null;
    return eraport.muridData.find(m => m.muridId === user.id) || null;
  }, [eraport, user?.id]);

  // Generate PDF preview when data changes
  useEffect(() => {
    if (eraport && muridData && user) {
      setIsGeneratingPdf(true);
      generateERaportPDFBlob({
        eraport,
        muridData,
        selectedMurid: user as any,
        profilSekolah: profilSekolah || null,
      })
        .then((url) => {
          setPdfPreviewUrl(url);
          setIsGeneratingPdf(false);
        })
        .catch((error) => {
          console.error('Error generating PDF preview:', error);
          setIsGeneratingPdf(false);
        });
    }

    // Cleanup: revoke URL when component unmounts or data changes
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
      }
    };
  }, [eraport, muridData, user, profilSekolah]);

  // Update selectedTahunAjaran if it's not in available list
  useEffect(() => {
    if (availableTahunAjaran.length > 0 && !availableTahunAjaran.some(ta => ta.tahun === selectedTahunAjaran)) {
      setSelectedTahunAjaran(availableTahunAjaran[0].tahun);
    }
  }, [availableTahunAjaran, selectedTahunAjaran]);

  // Update semester if it's not in available semesters
  useEffect(() => {
    if (availableSemesters.length > 0 && !availableSemesters.includes(selectedSemester)) {
      setSelectedSemester(availableSemesters[0]);
    }
  }, [availableSemesters, selectedSemester]);

  const handleDownloadPDF = async () => {
    if (!eraport || !muridData || !user) {
      alert('Data E-Raport tidak tersedia');
      return;
    }

    try {
      await downloadERaportPDF({
        eraport,
        muridData,
        selectedMurid: user as any,
        profilSekolah: profilSekolah || null,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  const handleResetToActive = () => {
    if (activeTahunAjaran) {
      setSelectedTahunAjaran(activeTahunAjaran.tahun);
      setSelectedSemester(activeTahunAjaran.semester);
    }
  };

  const targetKelas = kelas.find(k => k.id === kelasIdForTahunAjaran);

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2 sm:p-2.5">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">E-Raport Saya</h3>
              <p className="text-xs sm:text-sm text-indigo-100">Lihat E-Raport untuk setiap tahun ajaran dan semester</p>
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
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  {availableTahunAjaran.map(ta => (
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
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  {availableSemesters.map(sem => (
                    <option key={sem} value={sem}>
                      Semester {sem} {sem === 1 ? '(Ganjil)' : '(Genap)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedTahunAjaran !== (activeTahunAjaran?.tahun || '') && (
              <button
                onClick={handleResetToActive}
                className="px-4 py-2.5 text-xs sm:text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg sm:rounded-xl transition-colors duration-200"
              >
                Reset ke Aktif
              </button>
            )}
          </div>

          <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">Periode Dipilih</p>
                <p className="text-sm sm:text-base font-medium text-slate-900 mt-1">
                  {targetKelas ? (
                    <>Kelas: <span className="text-indigo-600">{targetKelas.name}</span> • {selectedTahunAjaran} Semester {selectedSemester}</>
                  ) : (
                    <>{selectedTahunAjaran} Semester {selectedSemester}</>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
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

      {/* Content */}
      {!kelasIdForTahunAjaran ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Kelas Tidak Ditemukan</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Tidak dapat menentukan kelas untuk tahun ajaran {selectedTahunAjaran}.
            Kemungkinan Anda belum masuk sekolah atau sudah lulus pada periode tersebut.
          </p>
        </Card>
      ) : eraportLoading ? (
        <Card className="text-center py-12">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-4 text-indigo-600 animate-spin" />
          <p className="text-sm sm:text-base text-slate-600">Memuat data E-Raport...</p>
        </Card>
      ) : eraportError || !eraport || !muridData ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
            E-Raport Belum Tersedia
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
            E-Raport untuk semester {selectedSemester} tahun ajaran {selectedTahunAjaran} belum di-generate oleh wali kelas.
            Silakan hubungi wali kelas untuk informasi lebih lanjut.
          </p>
        </Card>
      ) : (
        <div className="space-y-5 lg:space-y-6">
          {/* Download Button */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">E-Raport Tersedia</h4>
                <p className="text-xs sm:text-sm text-slate-600">
                  Anda dapat melihat dan mengunduh E-Raport Anda
                </p>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg sm:rounded-xl hover:bg-indigo-700 transition-colors duration-200 text-xs sm:text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50">
              <h4 className="text-sm sm:text-base font-semibold text-slate-900">Preview E-Raport</h4>
            </div>
            <div className="eraport-container">
              {isGeneratingPdf ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 border-b-2 border-indigo-600 mx-auto mb-4 animate-spin rounded-full" />
                    <p className="text-sm text-slate-600">Membuat preview PDF...</p>
                  </div>
                </div>
              ) : pdfPreviewUrl ? (
                <div className="w-full" style={{ minHeight: '800px' }}>
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full border-0"
                    title="E-Raport Preview"
                    style={{ minHeight: '800px', height: '100vh' }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-sm text-slate-600">Gagal memuat preview PDF</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styles for PDF Preview */}
      <style>{`
        .eraport-container {
          padding: 0;
          background: #f5f5f5;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default ERaportMurid;


