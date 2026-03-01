import React, { useState, useMemo, useEffect } from 'react';
import { X, Download, FileText, BarChart3 } from 'lucide-react';
import Button from '../../../../ui/Button';
import { User, AbsensiGuru, SesiAbsensi, TahunAjaran, PengaturanAbsen, IzinGuru } from '../../../../../types';
import { useLanguage } from '../../../../../context/LanguageContext';
import { getMonthNames } from '../../../../../utils/dateLocaleUtils';
import RekapAbsenGuruBulanTable from './RekapAbsenGuruBulanTable';
import RekapAbsenGuruSemesterTable from './RekapAbsenGuruSemesterTable';
import { generateRekapAbsenGuruPDF, generateRekapAbsenGuruExcel } from '../utils/exportRekapAbsenGuruUtils';
import { generateRekapSemesterGuruPDF, generateRekapSemesterGuruExcel, getRekapSemesterGuruData, getSemestersForTahunAjaran } from '../utils/semesterAbsenGuruUtils';
import { getKeteranganAbsensi, getGuruAbsensiForDate, getGuruIzinForDate, isTanggalExistsInDatabase } from '../utils/absenGuruDataHelpers';

interface RekapAbsenGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  gurus: User[];
  namaSekolah?: string;
  absensiGuru: AbsensiGuru[];
  izinGuru: IzinGuru[];
  sesiAbsensi: SesiAbsensi[];
  tahunAjaranData?: TahunAjaran[];
  pengaturanAbsen?: PengaturanAbsen[];
}

interface RekapGuruData {
  guru: User;
  absensiPerTanggal: Record<number, string>;
  totalHadir: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  totalBolos: number;
  totalDispen: number;
}

const RekapAbsenGuruModal: React.FC<RekapAbsenGuruModalProps> = ({
  isOpen,
  onClose,
  gurus,
  namaSekolah,
  absensiGuru,
  izinGuru,
  sesiAbsensi,
  tahunAjaranData,
  pengaturanAbsen = [],
}) => {
  const { language } = useLanguage();
  const monthNames = getMonthNames(language);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [rekapMode, setRekapMode] = useState<'bulan' | 'semester'>('bulan');
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const getAvailableTahunAjaran = (): string[] => {
    if (!tahunAjaranData || tahunAjaranData.length === 0) {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      return [`${currentYear}/${nextYear}`];
    }
    // Get unique tahun ajaran values and sort them in descending order
    const uniqueTahunAjaran = tahunAjaranData
      .map(d => d.tahun)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)
    return uniqueTahunAjaran;
  };

  const getAvailableSemesters = (): number[] => {
    if (!tahunAjaranData || !selectedTahunAjaran) return [1, 2];
    return getSemestersForTahunAjaran(selectedTahunAjaran, tahunAjaranData);
  };

  // Initialize tahun ajaran when data is loaded
  useEffect(() => {
    if (selectedTahunAjaran === '' && tahunAjaranData && tahunAjaranData.length > 0) {
      const availableTahunAjaran = getAvailableTahunAjaran();
      if (availableTahunAjaran.length > 0) {
        const firstTahunAjaran = availableTahunAjaran[0];
        setSelectedTahunAjaran(firstTahunAjaran);
        const availableSemesters = getSemestersForTahunAjaran(firstTahunAjaran, tahunAjaranData);
        setSelectedSemester(availableSemesters[0] || 1);
      }
    }
  }, [tahunAjaranData]);

  // Validate and update semester when tahun ajaran changes
  useEffect(() => {
    if (selectedTahunAjaran && tahunAjaranData && tahunAjaranData.length > 0) {
      const availableSemesters = getAvailableSemesters();
      if (availableSemesters.length > 0 && !availableSemesters.includes(selectedSemester)) {
        setSelectedSemester(availableSemesters[0] || 1);
      }
    }
  }, [selectedTahunAjaran, tahunAjaranData]);

  // Get active tahun ajaran for the selected month/year
  const activeTahunAjaranForMonth = useMemo(() => {
    if (!tahunAjaranData || tahunAjaranData.length === 0) return null;
    
    // Find tahun ajaran that covers the selected month/year
    const selectedDate = new Date(selectedYear, selectedMonth - 1, 1);
    return tahunAjaranData.find(ta => {
      const startDate = new Date(ta.tanggalMulai);
      const endDate = new Date(ta.tanggalSelesai);
      return selectedDate >= startDate && selectedDate <= endDate;
    }) || tahunAjaranData.find(ta => ta.isActive);
  }, [tahunAjaranData, selectedYear, selectedMonth]);

  // Helper functions with tahunAjaranId filter
  const getGuruAbsensiForDateFiltered = (guru: User, tanggal: string): AbsensiGuru | undefined => {
    return getGuruAbsensiForDate(absensiGuru, guru.id, tanggal, activeTahunAjaranForMonth?.id);
  };

  const getGuruIzinForDateFiltered = (guru: User, tanggal: string): IzinGuru | undefined => {
    return getGuruIzinForDate(izinGuru, guru.id, tanggal, activeTahunAjaranForMonth?.id);
  };

  const rekapData: RekapGuruData[] = useMemo(() => {
    return gurus.map((guru) => {
      const absensiPerTanggal: Record<number, string> = {};
      let totalHadir = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalAlfa = 0;
      let totalBolos = 0;
      let totalDispen = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let status = '-';

        const absen = getGuruAbsensiForDateFiltered(guru, dateStr);
        const izin = getGuruIzinForDateFiltered(guru, dateStr);

        // Cek apakah tanggal ada di database
        const tanggalExists = isTanggalExistsInDatabase(absensiGuru, dateStr, activeTahunAjaranForMonth?.id);

        // Use getKeteranganAbsensi to get the correct keterangan based on logic
        const keterangan = getKeteranganAbsensi(absen || undefined, izin, tanggalExists);

        // Convert keterangan to status code
        // Skip '-' karena tidak dihitung dalam rekap
        if (keterangan === 'Hadir') {
          status = 'H';
          totalHadir++;
        } else if (keterangan === 'Izin') {
          status = 'I';
          totalIzin++;
        } else if (keterangan === 'Sakit') {
          status = 'S';
          totalSakit++;
        } else if (keterangan === 'Alfa') {
          status = 'A';
          totalAlfa++;
        } else if (keterangan === 'Bolos') {
          status = 'B';
          totalBolos++;
        } else if (keterangan === 'Dispen') {
          status = 'D';
          totalDispen++;
        } else {
          // keterangan === '-' (tidak ada record di database)
          status = '-';
        }

        absensiPerTanggal[day] = status;
      }

      return {
        guru,
        absensiPerTanggal,
        totalHadir,
        totalIzin,
        totalSakit,
        totalAlfa,
        totalBolos,
        totalDispen,
      };
    });
  }, [gurus, selectedMonth, selectedYear, absensiGuru, izinGuru, daysInMonth, activeTahunAjaranForMonth]);

  const rekapSemesterData = useMemo(() => {
    return getRekapSemesterGuruData(gurus, absensiGuru, izinGuru, selectedTahunAjaran, selectedSemester, tahunAjaranData, pengaturanAbsen);
  }, [gurus, absensiGuru, izinGuru, selectedTahunAjaran, selectedSemester, tahunAjaranData, pengaturanAbsen]);

  const getSemesterDates = () => {
    if (!tahunAjaranData || !selectedTahunAjaran) return { tanggalMulai: undefined, tanggalSelesai: undefined };
    const taData = tahunAjaranData.find(ta => ta.tahun === selectedTahunAjaran && ta.semester === selectedSemester);
    return { tanggalMulai: taData?.tanggalMulai, tanggalSelesai: taData?.tanggalSelesai };
  };

  const handleExportPDF = async () => {
    try {
      if (rekapMode === 'bulan') {
        await generateRekapAbsenGuruPDF(rekapData, namaSekolah || 'Sekolah', selectedMonth, selectedYear, language);
      } else {
        const { tanggalMulai, tanggalSelesai } = getSemesterDates();
        await generateRekapSemesterGuruPDF(rekapSemesterData, namaSekolah || 'Sekolah', selectedTahunAjaran, selectedSemester, tanggalMulai, tanggalSelesai);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleExportExcel = async () => {
    try {
      if (rekapMode === 'bulan') {
        await generateRekapAbsenGuruExcel(rekapData, namaSekolah || 'Sekolah', selectedMonth, selectedYear, language);
      } else {
        const { tanggalMulai, tanggalSelesai } = getSemesterDates();
        await generateRekapSemesterGuruExcel(rekapSemesterData, namaSekolah || 'Sekolah', selectedTahunAjaran, selectedSemester, tanggalMulai, tanggalSelesai);
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const getAvailableMonthYears = (): Array<{ month: number; year: number }> => {
    const months: Array<{ month: number; year: number }> = [];
    const currentDate = new Date();

    for (let y = currentDate.getFullYear() - 2; y <= currentDate.getFullYear() + 1; y++) {
      for (let m = 1; m <= 12; m++) {
        months.push({ month: m, year: y });
      }
    }

    return months.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header - Sticky */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0 bg-white">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Rekap Absensi Guru</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">{namaSekolah || 'Semua Guru'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 sm:p-6 space-y-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setRekapMode('bulan')}
              className={`px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                rekapMode === 'bulan'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Per Bulan
            </button>
            <button
              onClick={() => setRekapMode('semester')}
              className={`px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                rekapMode === 'semester'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Per Semester
            </button>
          </div>

          {rekapMode === 'bulan' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getAvailableMonthYears()
                    .map(item => item.year)
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .sort((a, b) => b - a)
                    .map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                </select>
              </div>

              
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Tahun Ajaran
                </label>
                <select
                  value={selectedTahunAjaran}
                  onChange={(e) => setSelectedTahunAjaran(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getAvailableTahunAjaran().map((ta) => (
                    <option key={ta} value={ta}>
                      {ta}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getAvailableSemesters().map((sem) => (
                    <option key={sem} value={sem}>
                      {sem === 1 ? 'Ganjil' : 'Genap'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-end">
                <p className="text-xs sm:text-sm text-gray-600">
                  Semester {selectedSemester === 1 ? 'Ganjil' : 'Genap'} {selectedTahunAjaran}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={handleExportPDF}
              variant="primary"
              className="flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="primary"
              className="flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
          </div>

          {/* Data Table */}
          <div className="w-full">
            {rekapMode === 'bulan' ? (
              <RekapAbsenGuruBulanTable
                gurus={gurus}
                bulan={selectedMonth}
                tahun={selectedYear}
                absensiGuru={absensiGuru}
                izinGuru={izinGuru}
                tahunAjaranData={tahunAjaranData}
                language={language}
              />
            ) : (
              <RekapAbsenGuruSemesterTable
                gurus={gurus}
                tahunAjaran={selectedTahunAjaran}
                semester={selectedSemester}
                absensiGuru={absensiGuru}
                izinGuru={izinGuru}
                tahunAjaranData={tahunAjaranData}
              />
            )}
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="px-4 sm:px-6 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 flex-shrink-0">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <div><span className="font-semibold">H</span> = Hadir</div>
            <div><span className="font-semibold">I</span> = Izin</div>
            <div><span className="font-semibold">S</span> = Sakit</div>
            <div><span className="font-semibold">A</span> = Alfa</div>
            <div><span className="font-semibold">B</span> = Bolos</div>
            <div><span className="font-semibold">D</span> = Dispen</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RekapAbsenGuruModal;
