import React, { useState, useMemo, useEffect } from 'react';
import { X, FileText, BarChart3 } from 'lucide-react';
import Button from '../../../../../ui/Button';
import { User, Absensi, SesiAbsensi, TahunAjaran, PengaturanAbsen } from '../../../../../../types';
import RekapAbsenBulanTable from './RekapAbsenBulanTable';
import RekapAbsenSemesterTable from './RekapAbsenSemesterTable';
import { generateRekapAbsenPDF, generateRekapAbsenExcel } from './utils/exportRekapAbsenUtils';
import { generateRekapSemesterPDF, generateRekapSemesterExcel, getRekapSemesterData, getSemestersForTahunAjaran } from './utils/semesterAbsenUtils';
import { determineKeterangan } from '../../../../../../utils/absenValidationUtils';
import { useAbsensi } from '../../../../../../hooks/useAbsensi';
import { useTahunAjaran } from '../../../../../../hooks/useTahunAjaran';

interface RekapAbsenBulanModalProps {
  isOpen: boolean;
  onClose: () => void;
  muridKelas: User[];
  namaKelas: string | undefined;
  waliKelasName: string;
  sesiAbsensi: SesiAbsensi[];
  absensi?: Absensi[]; // Optional, will use hook if not provided
  tahunAjaranData?: TahunAjaran[];
  pengaturanAbsen?: PengaturanAbsen[];
  kelasId?: string; // For fetching absensi from hook
}

interface RekapData {
  murid: User;
  absensiPerTanggal: Record<number, string>;
  totalHadir: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  totalBolos: number;
  totalDispen: number;
}

const getStatusCodeFromKeterangan = (keterangan: string): string => {
  const statusMap: Record<string, string> = {
    'Hadir': 'H',
    'Izin': 'I',
    'Sakit': 'S',
    'Alfa': 'A',
    'Bolos': 'B',
    'Dispen': 'D',
    '-': '-',
  };
  return statusMap[keterangan] || '-';
};

const RekapAbsenBulanModal: React.FC<RekapAbsenBulanModalProps> = ({
  isOpen,
  onClose,
  muridKelas,
  namaKelas,
  waliKelasName,
  sesiAbsensi,
  absensi: absensiProp,
  tahunAjaranData,
  pengaturanAbsen = [],
  kelasId,
}) => {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [rekapMode, setRekapMode] = useState<'bulan' | 'semester'>('bulan');
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const activePengaturanAbsen = pengaturanAbsen.find(p => p.isActive);
  
  // Get active tahun ajaran to initialize selection
  const { activeTahunAjaran } = useTahunAjaran();
  
  // Use hook to get fresh absensi data if kelasId is provided, otherwise use prop
  // Memoize params to prevent infinite loop
  const absensiParams = useMemo(() => {
    return kelasId && isOpen ? { kelasId } : undefined;
  }, [kelasId, isOpen]);
  
  const { absensi: absensiFromHook } = useAbsensi(absensiParams);
  
  // Use hook data if available, otherwise fallback to prop
  // Wrap in useMemo to prevent unnecessary re-renders
  const absensi = useMemo(() => {
    if (kelasId && absensiFromHook && absensiFromHook.length > 0) {
      return absensiFromHook;
    }
    return absensiProp || [];
  }, [kelasId, absensiFromHook, absensiProp]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const getAvailableTahunAjaran = (): string[] => {
    if (!tahunAjaranData || tahunAjaranData.length === 0) {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      return [`${currentYear}/${nextYear}`];
    }
    return tahunAjaranData.map(d => d.tahun).filter((v, i, a) => a.indexOf(v) === i);
  };

  const getAvailableSemesters = (): number[] => {
    if (!tahunAjaranData || !selectedTahunAjaran) return [1, 2];
    return getSemestersForTahunAjaran(selectedTahunAjaran, tahunAjaranData);
  };

  // Reset to active tahun ajaran when modal opens
  useEffect(() => {
    if (!isOpen) return; // Only run when modal is open
    
    if (tahunAjaranData && tahunAjaranData.length > 0) {
      const availableTahunAjaran = getAvailableTahunAjaran();
      
      if (activeTahunAjaran) {
        // Use active tahun ajaran if available
        const activeTahun = activeTahunAjaran.tahun;
        const activeSem = activeTahunAjaran.semester;
        
        if (availableTahunAjaran.includes(activeTahun)) {
          setSelectedTahunAjaran(activeTahun);
          const availableSemesters = getSemestersForTahunAjaran(activeTahun, tahunAjaranData);
          // Make sure the active semester is available for the active tahun ajaran
          if (availableSemesters.includes(activeSem)) {
            setSelectedSemester(activeSem);
          } else if (availableSemesters.length > 0) {
            setSelectedSemester(availableSemesters[0]);
          }
        } else if (availableTahunAjaran.length > 0) {
          // Fallback to first available if active is not in the list
          const firstTahunAjaran = availableTahunAjaran[0];
          setSelectedTahunAjaran(firstTahunAjaran);
          const availableSemesters = getSemestersForTahunAjaran(firstTahunAjaran, tahunAjaranData);
          setSelectedSemester(availableSemesters[0] || 1);
        }
      } else if (availableTahunAjaran.length > 0) {
        // If no active tahun ajaran, use first available
        const firstTahunAjaran = availableTahunAjaran[0];
        setSelectedTahunAjaran(firstTahunAjaran);
        const availableSemesters = getSemestersForTahunAjaran(firstTahunAjaran, tahunAjaranData);
        setSelectedSemester(availableSemesters[0] || 1);
      }
    }
  }, [isOpen, activeTahunAjaran, tahunAjaranData]);

  useEffect(() => {
    if (selectedTahunAjaran && tahunAjaranData) {
      const availableSemesters = getAvailableSemesters();
      if (!availableSemesters.includes(selectedSemester)) {
        setSelectedSemester(availableSemesters[0] || 1);
      }
    }
  }, [selectedTahunAjaran, tahunAjaranData]);

  const rekapData: RekapData[] = useMemo(() => {
    return muridKelas.map((murid) => {
      const absensiPerTanggal: Record<number, string> = {};
      let totalHadir = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalAlfa = 0;
      let totalBolos = 0;
      let totalDispen = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        let dayStatus = '-';

        // Find day's absensi (one record per day in new structure)
        const dayAbsensi = absensi.find(a =>
          a.muridId === murid.id && a.tanggal === dateStr
        );

        if (dayAbsensi) {
          // New structure: one record contains both masuk and pulang
          // Create virtual objects for compatibility
          const masukAbsensi: Absensi | null = dayAbsensi.jamMasuk || dayAbsensi.statusMasuk ? {
            ...dayAbsensi,
            tipeAbsen: 'masuk',
            waktu: dayAbsensi.jamMasuk || dayAbsensi.waktu || '',
            status: dayAbsensi.statusMasuk === 'izin' ? 'izin' :
                    dayAbsensi.statusMasuk === 'sakit' ? 'sakit' :
                    dayAbsensi.statusMasuk === 'alfa' ? 'alfa' :
                    dayAbsensi.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
          } : null;

          const pulangAbsensi: Absensi | null = dayAbsensi.jamKeluar || dayAbsensi.statusKeluar ? {
            ...dayAbsensi,
            tipeAbsen: 'pulang',
            waktu: dayAbsensi.jamKeluar || dayAbsensi.waktu || '',
            status: dayAbsensi.statusKeluar === 'izin' ? 'izin' :
                    dayAbsensi.statusKeluar === 'sakit' ? 'sakit' :
                    dayAbsensi.statusKeluar === 'alfa' ? 'alfa' :
                    dayAbsensi.statusKeluar === 'pulang_awal' ? 'pulang_cepat' : 'hadir',
          } : null;

          // Backward compatibility: check old structure (separate records)
          const dayAbsensiOld = absensi.filter(a =>
            a.muridId === murid.id &&
            a.tanggal === dateStr &&
            a.tipeAbsen !== undefined
          );
          
          const masukOld = dayAbsensiOld.find(a => a.tipeAbsen === 'masuk');
          const pulangOld = dayAbsensiOld.find(a => a.tipeAbsen === 'pulang');
          
          const finalMasuk = masukAbsensi || masukOld || null;
          const finalPulang = pulangAbsensi || pulangOld || null;

          // Gunakan determineKeterangan untuk mendapatkan status berdasarkan kombinasi masuk dan pulang
          const keteranganResult = determineKeterangan(finalMasuk, finalPulang, activePengaturanAbsen);
          dayStatus = getStatusCodeFromKeterangan(keteranganResult.keterangan);

          // Hitung total berdasarkan keterangan, bukan status absen masuk/pulang
          if (keteranganResult.keterangan === 'Hadir') totalHadir++;
          else if (keteranganResult.keterangan === 'Izin') totalIzin++;
          else if (keteranganResult.keterangan === 'Sakit') totalSakit++;
          else if (keteranganResult.keterangan === 'Alfa') totalAlfa++;
          else if (keteranganResult.keterangan === 'Bolos') totalBolos++;
          else if (keteranganResult.keterangan === 'Dispen') totalDispen++;
        }

        absensiPerTanggal[day] = dayStatus;
      }

      return {
        murid,
        absensiPerTanggal,
        totalHadir,
        totalIzin,
        totalSakit,
        totalAlfa,
        totalBolos,
        totalDispen,
      };
    });
  }, [muridKelas, selectedMonth, selectedYear, absensi, daysInMonth, activePengaturanAbsen]);

  const rekapSemesterData = useMemo(() => {
    return getRekapSemesterData(muridKelas, sesiAbsensi, absensi, selectedTahunAjaran, selectedSemester, tahunAjaranData, pengaturanAbsen);
  }, [muridKelas, sesiAbsensi, absensi, selectedTahunAjaran, selectedSemester, tahunAjaranData, pengaturanAbsen]);

  const getSemesterDates = () => {
    if (!tahunAjaranData || !selectedTahunAjaran) return { tanggalMulai: undefined, tanggalSelesai: undefined };
    const taData = tahunAjaranData.find(ta => ta.tahun === selectedTahunAjaran && ta.semester === selectedSemester);
    return { tanggalMulai: taData?.tanggalMulai, tanggalSelesai: taData?.tanggalSelesai };
  };

  const handleExportPDF = () => {
    if (rekapMode === 'bulan') {
      generateRekapAbsenPDF(rekapData, namaKelas || 'Kelas', selectedMonth, selectedYear, waliKelasName, selectedTahunAjaran, selectedSemester);
    } else {
      const { tanggalMulai, tanggalSelesai } = getSemesterDates();
      generateRekapSemesterPDF(rekapSemesterData, namaKelas || 'Kelas', selectedTahunAjaran, selectedSemester, waliKelasName, tanggalMulai, tanggalSelesai);
    }
  };

  const handleExportExcel = () => {
    if (rekapMode === 'bulan') {
      generateRekapAbsenExcel(rekapData, namaKelas || 'Kelas', selectedMonth, selectedYear, waliKelasName, selectedTahunAjaran, selectedSemester);
    } else {
      const { tanggalMulai, tanggalSelesai } = getSemesterDates();
      generateRekapSemesterExcel(rekapSemesterData, namaKelas || 'Kelas', selectedTahunAjaran, selectedSemester, waliKelasName, tanggalMulai, tanggalSelesai);
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
      <div className="bg-white rounded-lg shadow-lg w-full max-w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Rekap Absensi</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Kelas: {namaKelas}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-auto flex-grow">
          <div className="space-y-4">
            {/* Controls Section */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 space-y-4 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2 mb-2">
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

                  <div className="col-span-2 sm:col-span-1 flex items-end">
                    <p className="text-xs sm:text-sm text-gray-600">
                      {monthNames[selectedMonth - 1]} {selectedYear}
                    </p>
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

              <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={handleExportPDF}
                  variant="danger"
                  className="flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button
                  onClick={handleExportExcel}
                  variant="success"
                  className="flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  Export Excel
                </Button>
              </div>
            </div>

            {/* Table/Data Section */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              {rekapMode === 'bulan' ? (
                <RekapAbsenBulanTable
                  muridKelas={muridKelas}
                  bulan={selectedMonth}
                  tahun={selectedYear}
                  sesiAbsensi={sesiAbsensi}
                  absensi={absensi}
                  pengaturanAbsen={pengaturanAbsen}
                />
              ) : (
                <RekapAbsenSemesterTable
                  muridKelas={muridKelas}
                  absensi={absensi}
                  pengaturanAbsen={pengaturanAbsen}
                  selectedTahunAjaran={selectedTahunAjaran}
                  selectedSemester={selectedSemester}
                  tahunAjaranData={tahunAjaranData}
                />
              )}
            </div>

            {/* Legend */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs text-gray-600">
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

        {/* Footer - Fixed */}
        <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0 bg-white">
          <Button onClick={onClose} variant="secondary" className="text-xs sm:text-sm">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RekapAbsenBulanModal;
