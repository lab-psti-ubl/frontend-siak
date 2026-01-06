import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Download, Printer, Calculator, TrendingUp, School, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import QRCode from 'qrcode';
import Button from '../../../ui/Button';
import Card from '../../../ui/Card';
import { RaportData } from '../../../../utils/raport';
import { getGradeColor, KOMPONEN_NILAI, getNilaiMinimalSettings, getSemuaKomponenNilai, setKomponenNilaiCache } from '../../../../utils/nilaiUtils';
import { openVerificationPage, getVerificationUrl } from '../../../../utils/verificationPageUtils';
import { isMaxTingkatSync, formatTingkatKelasSync, shouldShowJurusanSync } from '../../../../utils/jenjangPendidikanUtils';
import { useProfilSekolah } from '../../../../hooks/useProfilSekolah';
import { useDataKepsek } from '../../../../hooks/useDataKepsek';
import { useKomponenNilai } from '../../../../hooks/useKomponenNilai';
import { usePengaturanNilaiMinimal } from '../../../../hooks/usePengaturanNilaiMinimal';
import { setProfilSekolahCache, setDataKepsekCache } from '../../../../utils/raport';
import { setNilaiMinimalCache } from '../../../../utils/nilaiUtils';

// Helper function to get data kepsek from cache (for verification page)
const getDataKepsekFromCache = (): any => {
  try {
    // Try to access cache from raport utils module
    const cache = (window as any).__dataKepsekCache;
    if (cache) return cache;
  } catch (e) {
    // Ignore
  }
  return null;
};

interface RaportMuridContentProps {
  raportData: RaportData;
  onPrintRaport: () => void;
  onDownloadRaportPDF: () => void;
  onExportRaportData: () => void;
}

const VerificationQRCode: React.FC<{ verificationUrl: string }> = ({ verificationUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, verificationUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 150,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    }
  }, [verificationUrl]);

  return <canvas ref={canvasRef} className="w-auto h-auto" />;
};

const RaportMuridContent: React.FC<RaportMuridContentProps> = ({
  raportData,
  onPrintRaport,
  onDownloadRaportPDF,
  onExportRaportData
}) => {
  const { profilSekolah } = useProfilSekolah();
  const { dataKepsek } = useDataKepsek();
  const { komponenNilai } = useKomponenNilai();
  const { pengaturanNilaiMinimal } = usePengaturanNilaiMinimal();
  const [logoError, setLogoError] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // Set cache for nilaiUtils
  useEffect(() => {
    if (komponenNilai && komponenNilai.length > 0) {
      setKomponenNilaiCache(komponenNilai);
    }
  }, [komponenNilai]);

  // Set cache for nilai minimal from database
  useEffect(() => {
    if (pengaturanNilaiMinimal) {
      setNilaiMinimalCache({
        nilaiAkhirMinimal: pengaturanNilaiMinimal.nilaiAkhirMinimal,
        tingkatKehadiranMinimal: pengaturanNilaiMinimal.tingkatKehadiranMinimal,
      });
    }
  }, [pengaturanNilaiMinimal]);

  // Set cache for raport utils
  useEffect(() => {
    if (profilSekolah) {
      setProfilSekolahCache(profilSekolah);
    }
  }, [profilSekolah]);

  useEffect(() => {
    if (dataKepsek && dataKepsek.length > 0) {
      setDataKepsekCache(dataKepsek[0]);
    }
  }, [dataKepsek]);

  // Reset logo error when profilSekolah changes
  useEffect(() => {
    setLogoError(false);
  }, [profilSekolah?.logoSekolah]);

  const semuaKomponen = useMemo(() => {
    // Prioritaskan data dari database (via hook) atau gunakan cache
    if (komponenNilai && komponenNilai.length > 0) {
      return komponenNilai;
    }
    return getSemuaKomponenNilai();
  }, [komponenNilai]);

  const getDynamicKomponen = () => {
    return semuaKomponen.filter(k => !['Kehadiran', 'Tugas', 'UTS', 'UAS'].includes(k.nama));
  };

  const schoolData = useMemo(() => {
    if (profilSekolah) {
      return {
        namaSekolah: profilSekolah.namaSekolah || 'Sekolah',
        alamat: profilSekolah.alamat || 'Alamat Sekolah',
        nomorTelepon: profilSekolah.nomorTelepon || '-',
        email: profilSekolah.email || '-',
        kota: profilSekolah.kota || 'Kota'
      };
    }
    return {
      namaSekolah: 'Sekolah',
      alamat: 'Alamat Sekolah',
      nomorTelepon: '-',
      email: '-',
      kota: 'Kota'
    };
  }, [profilSekolah]);

  const kepsekData = useMemo(() => {
    // Prioritaskan data dari hook jika tersedia
    if (dataKepsek && dataKepsek.length > 0) {
      return dataKepsek[0];
    }
    // Fallback ke cache jika hook gagal (untuk verification page)
    return getDataKepsekFromCache();
  }, [dataKepsek]);

  const nilaiMinimalSettings = useMemo(() => {
    // Prioritaskan data dari database (via hook) atau gunakan cache
    if (pengaturanNilaiMinimal) {
      return {
        nilaiAkhirMinimal: pengaturanNilaiMinimal.nilaiAkhirMinimal,
        tingkatKehadiranMinimal: pengaturanNilaiMinimal.tingkatKehadiranMinimal,
      };
    }
    return getNilaiMinimalSettings();
  }, [pengaturanNilaiMinimal]);

  const generateVerificationUrl = (raportId: string) => {
    return getVerificationUrl(raportId, {
      name: raportData.student.name,
      nisn: (raportData.student as any).nisn || '',
      kelas: raportData.kelas.name
    }, 'raport');
  };

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6 gap-4">
            {profilSekolah?.logoSekolah && !logoError ? (
              <div className="flex items-center justify-center flex-shrink-0">
                <img 
                  src={profilSekolah.logoSekolah} 
                  alt="Logo Sekolah" 
                  className="max-w-16 max-h-16 sm:max-w-20 sm:max-h-20 h-auto w-auto object-contain"
                  style={{
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    outline: '2px solid white',
                    outlineOffset: '4px'
                  }}
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <School className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            )}
            <div className="text-center">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">{schoolData.namaSekolah}</h1>
              <p className="text-xs sm:text-sm text-blue-100">{schoolData.alamat}</p>
              <p className="text-xs sm:text-sm text-blue-100">Telp: {schoolData.nomorTelepon} | Email: {schoolData.email}</p>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-wider">LAPORAN HASIL BELAJAR SISWA</h2>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8 p-3 sm:p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
            {/* Mobile Layout */}
            <div className="md:hidden grid grid-cols-2 gap-2.5">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Nama Siswa</p>
                <p className="font-semibold text-slate-900 text-xs leading-tight">{raportData.student.name}</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">NISN</p>
                <p className="font-semibold text-slate-900 text-xs leading-tight">{(raportData.student as any).nisn || '-'}</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Kelas</p>
                <p className="font-semibold text-slate-900 text-xs leading-tight">{raportData.kelas.name}</p>
              </div>
              {shouldShowJurusanSync() && raportData.jurusan && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Jurusan</p>
                  <p className="font-semibold text-slate-900 text-xs leading-tight">{raportData.jurusan.name}</p>
                </div>
              )}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Tahun Ajaran</p>
                <p className="font-semibold text-slate-900 text-xs leading-tight">{raportData.tahunAjaran.tahun}</p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Semester</p>
                <p className="font-semibold text-slate-900 text-xs leading-tight">
                  {raportData.semester} ({raportData.semester === 1 ? 'Ganjil' : 'Genap'})
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Wali Kelas</p>
                <p className="font-semibold text-slate-900 text-xs leading-tight truncate">
                  {raportData.waliKelas ? `${raportData.waliKelas.name}` : '-'}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">NIP</p>
                <p className="font-semibold text-slate-900 text-xs leading-tight">
                  {raportData.waliKelas ? `${raportData.waliKelas.nip}` : '-'}
                </p>
              </div>
            </div>

            {/* Desktop/Tablet Layout */}
            <div className="hidden md:grid md:grid-cols-2 gap-4 lg:gap-8">
              <div className="space-y-3">
                <div className="flex flex-row">
                  <span className="w-32 font-medium text-slate-700 text-sm">Nama Siswa</span>
                  <span className="mr-2">:</span>
                  <span className="font-semibold text-slate-900 text-base">{raportData.student.name}</span>
                </div>
                <div className="flex flex-row">
                  <span className="w-32 font-medium text-slate-700 text-sm">NISN</span>
                  <span className="mr-2">:</span>
                  <span className="font-semibold text-slate-900 text-base">{(raportData.student as any).nisn || '-'}</span>
                </div>
                <div className="flex flex-row">
                  <span className="w-32 font-medium text-slate-700 text-sm">Kelas</span>
                  <span className="mr-2">:</span>
                  <span className="font-semibold text-slate-900 text-base">{raportData.kelas.name}</span>
                </div>
                {shouldShowJurusanSync() && raportData.jurusan && (
                  <div className="flex flex-row">
                    <span className="w-32 font-medium text-slate-700 text-sm">Jurusan</span>
                    <span className="mr-2">:</span>
                    <span className="font-semibold text-slate-900 text-base">{raportData.jurusan.name}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-row">
                  <span className="w-32 font-medium text-slate-700 text-sm">Tahun Ajaran</span>
                  <span className="mr-2">:</span>
                  <span className="font-semibold text-slate-900 text-base">{raportData.tahunAjaran.tahun}</span>
                </div>
                <div className="flex flex-row">
                  <span className="w-32 font-medium text-slate-700 text-sm">Semester</span>
                  <span className="mr-2">:</span>
                  <span className="font-semibold text-slate-900 text-base">
                    {raportData.semester} ({raportData.semester === 1 ? 'Ganjil' : 'Genap'})
                  </span>
                </div>
                <div className="flex flex-row">
                  <span className="w-32 font-medium text-slate-700 text-sm">Wali Kelas</span>
                  <span className="mr-2">:</span>
                  <span className="font-semibold text-slate-900 text-base">
                    {raportData.waliKelas ? `${raportData.waliKelas.name}` : '-'}
                  </span>
                </div>
                <div className="flex flex-row">
                  <span className="w-32 font-medium text-slate-700 text-sm">NIP</span>
                  <span className="mr-2">:</span>
                  <span className="font-semibold text-slate-900 text-base">
                    {raportData.waliKelas ? `${raportData.waliKelas.nip}` : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 sm:mb-8">
            <Button onClick={onPrintRaport} fullWidth className="flex items-center justify-center text-sm sm:text-base">
              <Printer size={16} className="mr-2" />
              <span className="hidden sm:inline">Print Laporan</span>
              <span className="sm:hidden">Print</span>
            </Button>
            <Button onClick={onDownloadRaportPDF} variant="secondary" fullWidth className="flex items-center justify-center text-sm sm:text-base">
              <Download size={16} className="mr-2" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">Download</span>
            </Button>
            <Button onClick={onExportRaportData} variant="success" fullWidth className="flex items-center justify-center text-sm sm:text-base">
              <FileText size={16} className="mr-2" />
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>

          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">CAPAIAN HASIL BELAJAR</h3>
            
            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
              <table className="w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th rowSpan={2} className="border border-slate-300 p-2 sm:p-3 text-center font-bold text-xs sm:text-sm">No</th>
                    <th rowSpan={2} className="border border-slate-300 p-2 sm:p-3 text-center font-bold text-xs sm:text-sm">Mata Pelajaran</th>
                    <th rowSpan={2} className="border border-slate-300 p-2 sm:p-3 text-center font-bold text-xs sm:text-sm">Guru</th>
                    <th colSpan={4 + getDynamicKomponen().length} className="border border-slate-300 p-2 sm:p-3 text-center font-bold text-xs sm:text-sm">Komponen Nilai</th>
                    <th rowSpan={2} className="border border-slate-300 p-2 sm:p-3 text-center font-bold text-xs sm:text-sm">Nilai<br/>Akhir</th>
                    <th rowSpan={2} className="border border-slate-300 p-2 sm:p-3 text-center font-bold text-xs sm:text-sm">Grade</th>
                  </tr>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-1.5 sm:p-2 text-center text-xs font-bold">
                      Kehadiran<br/>({KOMPONEN_NILAI.kehadiran}%)
                    </th>
                    <th className="border border-slate-300 p-1.5 sm:p-2 text-center text-xs font-bold">
                      Tugas<br/>({KOMPONEN_NILAI.tugas}%)
                    </th>
                    <th className="border border-slate-300 p-1.5 sm:p-2 text-center text-xs font-bold">
                      UTS<br/>({KOMPONEN_NILAI.uts}%)
                    </th>
                    <th className="border border-slate-300 p-1.5 sm:p-2 text-center text-xs font-bold">
                      UAS<br/>({KOMPONEN_NILAI.uas}%)
                    </th>
                    {getDynamicKomponen().map((k) => (
                      <th key={k.id} className="border border-slate-300 p-1.5 sm:p-2 text-center text-xs font-bold">
                        {k.nama}<br/>({k.persentase}%)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {raportData.subjects.map((subject, index) => (
                    <tr key={subject.mapelId} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-2 sm:p-3 text-center text-xs sm:text-sm">{index + 1}</td>
                      <td className="border border-slate-300 p-2 sm:p-3 text-left text-xs sm:text-sm">{subject.mapelName}</td>
                      <td className="border border-slate-300 p-2 sm:p-3 text-left text-xs sm:text-sm">{subject.guruName}</td>
                      <td className="border border-slate-300 p-2 sm:p-3 text-center text-xs sm:text-sm">{subject.kehadiran.toFixed(1)}</td>
                      <td className="border border-slate-300 p-2 sm:p-3 text-center text-xs sm:text-sm">{subject.rataTugas.toFixed(1)}</td>
                      <td className="border border-slate-300 p-2 sm:p-3 text-center text-xs sm:text-sm">
                        {subject.uts !== null ? subject.uts : '-'}
                      </td>
                      <td className="border border-slate-300 p-2 sm:p-3 text-center text-xs sm:text-sm">
                        {subject.uas !== null ? subject.uas : '-'}
                      </td>
                      {getDynamicKomponen().map((k) => {
                        const komponenValue = subject.komponenDinamis?.find(kd => kd.komponenNama === k.nama);
                        return (
                          <td key={k.id} className="border border-slate-300 p-2 sm:p-3 text-center text-xs sm:text-sm">
                            {komponenValue?.rataValues !== undefined ? komponenValue.rataValues.toFixed(1) : '-'}
                          </td>
                        );
                      })}
                      <td className="border border-slate-300 p-2 sm:p-3 text-center font-bold text-xs sm:text-sm">
                        {subject.nilaiAkhir !== null ? subject.nilaiAkhir.toFixed(1) : '-'}
                      </td>
                      <td className="border border-slate-300 p-2 sm:p-3 text-center">
                        {subject.grade ? (
                          <div className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold ${getGradeColor(subject.grade)}`}>
                            {subject.grade}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {raportData.subjects.map((subject, index) => {
                const isExpanded = expandedSubjects.has(subject.mapelId);
                
                const toggleExpand = () => {
                  const newExpanded = new Set(expandedSubjects);
                  if (isExpanded) {
                    newExpanded.delete(subject.mapelId);
                  } else {
                    newExpanded.add(subject.mapelId);
                  }
                  setExpandedSubjects(newExpanded);
                };

                return (
                  <Card key={subject.mapelId} className="p-4 border-0 shadow-md">
                    {/* Header - Always Visible */}
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={toggleExpand}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">

                          <h5 className="font-semibold text-sm sm:text-base text-gray-900">{subject.mapelName}</h5>
                        </div>
                        <p className="text-xs text-gray-600">Guru: {subject.guruName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right flex ">
                          <div className="text-lg font-bold text-indigo-600 mb-1 mr-5">
                            {subject.nilaiAkhir !== null && subject.nilaiAkhir !== undefined ? subject.nilaiAkhir.toFixed(1) : '-'}
                          </div>
                          {subject.grade && (
                            <div className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${getGradeColor(subject.grade)}`}>
                              {subject.grade}
                            </div>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content - Only visible when expanded */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 mb-3">
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Kehadiran</p>
                            <p className="text-xs text-gray-500 mb-0.5">({KOMPONEN_NILAI.kehadiran}%)</p>
                            <p className="text-sm font-semibold text-gray-900">{subject.kehadiran.toFixed(1)}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Tugas</p>
                            <p className="text-xs text-gray-500 mb-0.5">({KOMPONEN_NILAI.tugas}%)</p>
                            <p className="text-sm font-semibold text-gray-900">{subject.rataTugas.toFixed(1)}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">UTS</p>
                            <p className="text-xs text-gray-500 mb-0.5">({KOMPONEN_NILAI.uts}%)</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {subject.uts !== null && subject.uts !== undefined ? subject.uts : '-'}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">UAS</p>
                            <p className="text-xs text-gray-500 mb-0.5">({KOMPONEN_NILAI.uas}%)</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {subject.uas !== null && subject.uas !== undefined ? subject.uas : '-'}
                            </p>
                          </div>
                        </div>

                        {getDynamicKomponen().length > 0 && (
                          <div className={`grid gap-2 mb-3 ${
                            getDynamicKomponen().length === 1 
                              ? 'grid-cols-1' 
                              : getDynamicKomponen().length === 2
                              ? 'grid-cols-2'
                              : getDynamicKomponen().length === 3
                              ? 'grid-cols-3'
                              : 'grid-cols-2 sm:grid-cols-4'
                          }`}>
                            {getDynamicKomponen().map((k) => {
                              const komponenValue = subject.komponenDinamis?.find(kd => kd.komponenNama === k.nama);
                              return (
                                <div key={k.id} className="bg-blue-50 p-2 rounded-lg">
                                  <p className="text-xs text-blue-600 mb-1">{k.nama}</p>
                                  <p className="text-xs text-blue-500 mb-0.5">({k.persentase}%)</p>
                                  <p className="text-sm font-semibold text-blue-900">
                                    {komponenValue?.rataValues !== undefined && komponenValue.rataValues !== null 
                                      ? komponenValue.rataValues.toFixed(1) 
                                      : '-'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Nilai Akhir</span>
                            <span className="text-lg font-bold text-indigo-600">
                              {subject.nilaiAkhir !== null && subject.nilaiAkhir !== undefined ? subject.nilaiAkhir.toFixed(1) : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="mb-6 sm:mb-8 p-3 sm:p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <h3 className="text-sm sm:text-lg font-semibold text-slate-900 mb-2 sm:mb-4">RINGKASAN PRESTASI</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-6">
              <div className="text-center p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200">
                <Calculator className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-1.5 sm:mb-3" />
                <div className="text-xl sm:text-3xl font-bold text-blue-600 mb-0.5 sm:mb-0">
                  {raportData.overallGrade.toFixed(1)}
                </div>
                <div className="text-xs text-blue-700 mt-0.5 sm:mt-1">Rata-rata Nilai</div>
              </div>
              <div className="text-center p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200">
                <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-600 mx-auto mb-1.5 sm:mb-3" />
                <div className="text-xl sm:text-3xl font-bold text-emerald-600 mb-0.5 sm:mb-0">
                  {raportData.attendanceRate.toFixed(1)}%
                </div>
                <div className="text-xs text-emerald-700 mt-0.5 sm:mt-1">Tingkat Kehadiran</div>
              </div>
            </div>
          </div>


          {raportData.showKenaikanKelas && (
            <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl border-2 ${
              raportData.isNaikKelas
                ? 'bg-emerald-50 border-emerald-500'
                : 'bg-red-50 border-red-500'
            }`}>
              <h4 className={`font-bold text-center mb-3 sm:mb-4 text-base sm:text-lg ${
                raportData.isNaikKelas ? 'text-emerald-900' : 'text-red-900'
              }`}>
                {isMaxTingkatSync(raportData.kelas.tingkat) ? 'KEPUTUSAN KELULUSAN' : 'KEPUTUSAN KENAIKAN KELAS'}
              </h4>
              <div className={`text-center p-3 sm:p-4 rounded-xl ${
                raportData.isNaikKelas 
                  ? 'bg-emerald-100 border border-emerald-300' 
                  : 'bg-red-100 border border-red-300'
              }`}>
                <p className={`text-xl sm:text-2xl font-bold mb-2 ${
                  raportData.isNaikKelas ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {(() => {
                    if (raportData.isNaikKelas) {
                      if (isMaxTingkatSync(raportData.kelas.tingkat)) {
                        return 'LULUS';
                      } else {
                        const nextTingkat = raportData.kelas.tingkat + 1;
                        const nextTingkatLabel = formatTingkatKelasSync(nextTingkat);
                        return `NAIK KE KELAS ${nextTingkatLabel}`;
                      }
                    } else {
                      if (isMaxTingkatSync(raportData.kelas.tingkat)) {
                        return 'TIDAK LULUS';
                      }
                      return 'TIDAK NAIK KELAS';
                    }
                  })()}
                </p>
                <p className={`text-xs sm:text-sm ${
                  raportData.isNaikKelas ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {raportData.isNaikKelas
                    ? (isMaxTingkatSync(raportData.kelas.tingkat)
                        ? `Memenuhi syarat kelulusan dengan nilai rata-rata ≥ ${nilaiMinimalSettings.nilaiAkhirMinimal} dan kehadiran ≥ ${nilaiMinimalSettings.tingkatKehadiranMinimal}%`
                        : `Memenuhi syarat kenaikan kelas dengan nilai rata-rata ≥ ${nilaiMinimalSettings.nilaiAkhirMinimal} dan kehadiran ≥ ${nilaiMinimalSettings.tingkatKehadiranMinimal}%`)
                    : (isMaxTingkatSync(raportData.kelas.tingkat)
                        ? `Belum memenuhi syarat kelulusan (nilai rata-rata < ${nilaiMinimalSettings.nilaiAkhirMinimal} atau kehadiran < ${nilaiMinimalSettings.tingkatKehadiranMinimal}%)`
                        : `Belum memenuhi syarat kenaikan kelas (nilai rata-rata < ${nilaiMinimalSettings.nilaiAkhirMinimal} atau kehadiran < ${nilaiMinimalSettings.tingkatKehadiranMinimal}%)`)
                  }
                </p>
              </div>
              
              <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="text-center">
                  <p className="text-slate-600">Rata-rata Nilai</p>
                  <p className={`text-base sm:text-lg font-bold ${
                    raportData.overallGrade >= nilaiMinimalSettings.nilaiAkhirMinimal ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {raportData.overallGrade.toFixed(1)} {raportData.overallGrade >= nilaiMinimalSettings.nilaiAkhirMinimal ? '✓' : '✗'}
                  </p>
                  <p className="text-xs text-slate-500">Minimal {nilaiMinimalSettings.nilaiAkhirMinimal}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-600">Tingkat Kehadiran</p>
                  <p className={`text-base sm:text-lg font-bold ${
                    raportData.attendanceRate >= nilaiMinimalSettings.tingkatKehadiranMinimal ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {raportData.attendanceRate.toFixed(1)}% {raportData.attendanceRate >= nilaiMinimalSettings.tingkatKehadiranMinimal ? '✓' : '✗'}
                  </p>
                  <p className="text-xs text-slate-500">Minimal {nilaiMinimalSettings.tingkatKehadiranMinimal}%</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <p className="mb-2 text-xs sm:text-sm">Mengetahui,</p>
              <p className="font-semibold mb-8 sm:mb-12 text-sm sm:text-base">Kepala Sekolah</p>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-semibold text-xs sm:text-sm">
                  {kepsekData?.nama || 'Kepala Sekolah'}
                </p>
                <p className="text-xs text-slate-600">
                  NIP: {kepsekData?.nip || '-'}
                </p>
              </div>
            </div>
            <div className="text-center flex flex-col items-center justify-center">
              <p className="text-xs sm:text-sm font-medium text-slate-700 mb-2">Tanda Tangan Digital</p>
              <div className="bg-white p-3 border-2 border-green-400 rounded">
                <VerificationQRCode
                  verificationUrl={generateVerificationUrl((raportData.student as any).nisn || '')}
                />
              </div>
              <button
                onClick={() => openVerificationPage(
                  (raportData.student as any).nisn || '',
                  'Laporan Hasil Belajar telah disahkan oleh sistem secara digital dan dinyatakan sah',
                  'raport',
                  {
                    name: raportData.student.name,
                    nisn: (raportData.student as any).nisn || '',
                    kelas: raportData.kelas.name,
                    signatureTitle: 'Kepala Sekolah'
                  }
                )}
                className="text-xs text-green-600 font-medium mt-2 hover:text-green-700 cursor-pointer transition-colors duration-200 underline hover:no-underline"
              >
                Sah & Terverifikasi
              </button>
            </div>
            <div className="text-center">
              <p className="mb-2 text-xs sm:text-sm">{schoolData.kota}, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="font-semibold mb-8 sm:mb-12 text-sm sm:text-base">Wali Kelas</p>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-semibold text-xs sm:text-sm">
                  {raportData.waliKelas?.name || 'Wali Kelas'}
                </p>
                <p className="text-xs text-slate-600">
                  NIP: {raportData.waliKelas?.nip || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RaportMuridContent;