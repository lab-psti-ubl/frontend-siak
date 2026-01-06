import React, { useMemo } from 'react';
import { User, Absensi, PengaturanAbsen, TahunAjaran, Murid } from '../../../../../../types';
import { getSemesterDateRange } from './utils/semesterAbsenUtils';
import { determineKeterangan } from '../../../../../../utils/absenValidationUtils';
import { useTahunAjaran } from '../../../../../../hooks/useTahunAjaran';
import { isTanggalExistsInDatabase } from './AbsenKelasUtils';

interface RekapAbsenSemesterTableProps {
  muridKelas: User[];
  absensi: Absensi[];
  pengaturanAbsen?: PengaturanAbsen[];
  selectedTahunAjaran?: string; // Tahun ajaran yang dipilih (format: "2024/2025")
  selectedSemester?: number; // Semester yang dipilih (1 atau 2)
  tahunAjaranData?: TahunAjaran[]; // Data tahun ajaran untuk mencari ID
}

interface RekapSemesterData {
  murid: User;
  totalHadir: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  totalBolos: number;
  totalDispen: number;
}

const RekapAbsenSemesterTable: React.FC<RekapAbsenSemesterTableProps> = ({
  muridKelas,
  absensi,
  pengaturanAbsen = [],
  selectedTahunAjaran: selectedTahunAjaranProp,
  selectedSemester: selectedSemesterProp,
  tahunAjaranData: tahunAjaranDataProp,
}) => {
  // Use hook to get tahun ajaran data from cache
  const { tahunAjaran: tahunAjaranFromHook, activeTahunAjaran } = useTahunAjaran();

  // Use props if provided, otherwise fallback to hook data
  const tahunAjaranData = tahunAjaranDataProp || tahunAjaranFromHook;
  
  // Use selected tahun ajaran and semester from props if provided, otherwise use active tahun ajaran
  const tahunAjaran = selectedTahunAjaranProp || activeTahunAjaran?.tahun || '';
  const semester = selectedSemesterProp !== undefined ? selectedSemesterProp : (activeTahunAjaran?.semester || 1);

  // Data sudah diambil dari hooks cache di parent component
  const { startDate, endDate } = getSemesterDateRange(tahunAjaran, semester, tahunAjaranData);
  const activePengaturanAbsen = pengaturanAbsen.find(p => p.isActive);

  // Find tahun ajaran data based on selected tahun ajaran and semester
  const taData = useMemo(() => {
    if (tahunAjaran && semester && tahunAjaranData) {
      return tahunAjaranData.find(ta => ta.tahun === tahunAjaran && ta.semester === semester) || null;
    }
    return activeTahunAjaran;
  }, [tahunAjaran, semester, tahunAjaranData, activeTahunAjaran]);

  const rekapData: RekapSemesterData[] = useMemo(() => {
    const filteredAbsensi = absensi.filter(a => {
      // Filter by tahunAjaranId and semester first (if taData is available)
      if (taData) {
        if (a.tahunAjaranId !== taData.id) return false;
      }
      // Always filter by semester
      if (a.semester !== semester) return false;
      
      // Then filter by date range
      const dateStr = a.tanggal || a.waktu;
      if (!dateStr) return false;
      const absenDate = new Date(dateStr);
      return absenDate >= startDate && absenDate <= endDate;
    });

    // Get all dates in the semester range
    const allDatesInRange: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      allDatesInRange.push(`${year}-${month}-${day}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get kelasId from first absensi record (if available)
    const firstAbsensi = filteredAbsensi[0];
    const kelasId = firstAbsensi?.kelasId;

    return muridKelas.map((murid) => {
      let totalHadir = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalAlfa = 0;
      let totalBolos = 0;
      let totalDispen = 0;

      const muridAbsensi = filteredAbsensi.filter(a => a.muridId === murid.id);

      // Group by tanggal (new structure: one record per day)
      const absensiByDate: Record<string, { masuk?: Absensi; pulang?: Absensi; originalRecord?: Absensi }> = {};

      muridAbsensi.forEach(abs => {
        const dateKey = abs.tanggal || (abs.waktu ? abs.waktu.split('T')[0] : '');
        if (!dateKey) return;

        if (!absensiByDate[dateKey]) {
          absensiByDate[dateKey] = {};
        }

        // New structure: one record contains both masuk and pulang
        if (abs.jamMasuk || abs.statusMasuk || abs.jamKeluar || abs.statusKeluar) {
          // Store original record for reference
          absensiByDate[dateKey].originalRecord = abs;

          if (abs.jamMasuk || abs.statusMasuk) {
            absensiByDate[dateKey].masuk = {
              ...abs,
              tipeAbsen: 'masuk',
              waktu: abs.jamMasuk || abs.waktu || '',
              status: abs.statusMasuk === 'izin' ? 'izin' :
                      abs.statusMasuk === 'sakit' ? 'sakit' :
                      abs.statusMasuk === 'alfa' ? 'alfa' :
                      abs.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
            };
          }

          if (abs.jamKeluar || abs.statusKeluar) {
            absensiByDate[dateKey].pulang = {
              ...abs,
              tipeAbsen: 'pulang',
              waktu: abs.jamKeluar || abs.waktu || '',
              status: abs.statusKeluar === 'izin' ? 'izin' :
                      abs.statusKeluar === 'sakit' ? 'sakit' :
                      abs.statusKeluar === 'alfa' ? 'alfa' :
                      abs.statusKeluar === 'pulang_awal' ? 'pulang_cepat' : 'hadir',
            };
          }
        } else {
          // Backward compatibility: old structure (separate records)
          if (abs.tipeAbsen === 'masuk') {
            absensiByDate[dateKey].masuk = abs;
          } else if (abs.tipeAbsen === 'pulang') {
            absensiByDate[dateKey].pulang = abs;
          }
        }
      });

      // Process all dates in the semester range
      allDatesInRange.forEach(dateStr => {
        // Cek apakah tanggal ada di database
        const tanggalExists = isTanggalExistsInDatabase(
          filteredAbsensi,
          dateStr,
          kelasId,
          taData?.id,
          semester
        );

        // Jika tanggal tidak ada di database, skip (tidak dihitung)
        if (!tanggalExists) {
          return;
        }

        // Cek apakah murid memiliki record untuk tanggal ini
        const dayAbsensi = absensiByDate[dateStr];

        // Jika tanggal ada di database tapi murid tidak memiliki record, count as alfa
        if (!dayAbsensi || (!dayAbsensi.masuk && !dayAbsensi.pulang && !dayAbsensi.originalRecord)) {
          totalAlfa++;
          return;
        }

        // Jika ada record, proses seperti biasa
        const masukAbsensi = dayAbsensi.masuk || null;
        const pulangAbsensi = dayAbsensi.pulang || null;

        const keteranganResult = determineKeterangan(masukAbsensi, pulangAbsensi, activePengaturanAbsen);
        const keterangan = keteranganResult.keterangan;

        if (keterangan === 'Hadir') totalHadir++;
        else if (keterangan === 'Izin') totalIzin++;
        else if (keterangan === 'Sakit') totalSakit++;
        else if (keterangan === 'Alfa') totalAlfa++;
        else if (keterangan === 'Bolos') totalBolos++;
        else if (keterangan === 'Dispen') totalDispen++;
      });

      return {
        murid,
        totalHadir,
        totalIzin,
        totalSakit,
        totalAlfa,
        totalBolos,
        totalDispen,
      };
    });
  }, [muridKelas, absensi, startDate, endDate, tahunAjaranData, activePengaturanAbsen, taData, tahunAjaran, semester]);

  const getAttendanceRate = (data: RekapSemesterData): number => {
    const total = data.totalHadir + data.totalIzin + data.totalSakit + data.totalAlfa + data.totalBolos + data.totalDispen;
    return total > 0 ? Math.round((data.totalHadir / total) * 100) : 0;
  };

  const getAttendanceStatus = (rate: number): string => {
    if (rate >= 80) return 'Baik';
    if (rate >= 60) return 'Cukup';
    return 'Perlu Perhatian';
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 80) return 'from-emerald-50 to-emerald-50 border-emerald-200';
    if (rate >= 60) return 'from-amber-50 to-amber-50 border-amber-200';
    return 'from-red-50 to-red-50 border-red-200';
  };

  const getStatusTextColor = (rate: number) => {
    if (rate >= 80) return 'text-emerald-700';
    if (rate >= 60) return 'text-amber-700';
    return 'text-red-700';
  };

  return (
    <>
      {/* Desktop/Tablet View - Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="border border-gray-300 px-1.5 py-2 sm:px-2 text-left font-semibold">No</th>
              <th className="border border-gray-300 px-1.5 py-2 sm:px-2 text-left font-semibold">Nama Murid</th>
              <th className="border border-gray-300 px-1.5 py-2 sm:px-2 text-center font-semibold">NISN</th>
              <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-green-600 text-white">H</th>
              <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-yellow-600 text-white">I</th>
              <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-blue-600 text-white">S</th>
              <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-red-600 text-white">A</th>
              <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-orange-600 text-white">B</th>
              <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-purple-600 text-white">D</th>
              <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-slate-600 text-white">%</th>
            </tr>
          </thead>

          <tbody>
            {rekapData.map((data, idx) => {
              const attendanceRate = getAttendanceRate(data);
              return (
                <tr key={data.murid.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100 transition-colors'}>
                  <td className="border border-gray-300 px-1.5 py-2 sm:px-2 text-center font-medium text-slate-900">{idx + 1}</td>
                  <td className="border border-gray-300 px-1.5 py-2 sm:px-2 font-medium text-gray-900 truncate max-w-xs">{data.murid.name}</td>
                  <td className="border border-gray-300 px-1.5 py-2 sm:px-2 text-center text-gray-600">{(data.murid as Murid).nisn || '-'}</td>
                  <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-green-700 bg-green-50">{data.totalHadir}</td>
                  <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-yellow-700 bg-yellow-50">{data.totalIzin}</td>
                  <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-blue-700 bg-blue-50">{data.totalSakit}</td>
                  <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-red-700 bg-red-50">{data.totalAlfa}</td>
                  <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-orange-700 bg-orange-50">{data.totalBolos}</td>
                  <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-purple-700 bg-purple-50">{data.totalDispen}</td>
                  <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold bg-slate-50 text-slate-900">{attendanceRate}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card List */}
      <div className="sm:hidden space-y-3">
        {rekapData.map((data, idx) => {
          const attendanceRate = getAttendanceRate(data);
          const statusColor = getStatusColor(attendanceRate);
          const statusTextColor = getStatusTextColor(attendanceRate);
          const status = getAttendanceStatus(attendanceRate);

          return (
            <div
              key={data.murid.id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-white font-bold text-sm">{data.murid.name}</p>
                    <p className="text-blue-100 text-xs mt-1">NISN: {(data.murid as Murid).nisn || '-'}</p>
                  </div>
                  <span className="text-white text-xs font-medium bg-white bg-opacity-20 px-2.5 py-1 rounded-full">#{idx + 1}</span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-600 text-xs font-medium">Hadir</p>
                    <p className="text-green-700 text-lg font-bold">{data.totalHadir}</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-600 text-xs font-medium">Alfa</p>
                    <p className="text-red-700 text-lg font-bold">{data.totalAlfa}</p>
                  </div>
                  <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-600 text-xs font-medium">Lainnya</p>
                    <p className="text-slate-700 text-lg font-bold">{data.totalIzin + data.totalSakit + data.totalBolos + data.totalDispen}</p>
                  </div>
                </div>

                {/* Attendance Rate */}
                <div className={`bg-gradient-to-br ${statusColor} rounded-lg border p-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-medium ${statusTextColor}`}>Tingkat Kehadiran</p>
                      <p className={`text-2xl font-bold ${statusTextColor} mt-1`}>{attendanceRate}%</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-semibold ${statusTextColor}`}>{status}</p>
                    </div>
                  </div>
                </div>

                {/* Detail Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Izin:</span>
                    <span className="font-semibold text-yellow-700">{data.totalIzin}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Sakit:</span>
                    <span className="font-semibold text-blue-700">{data.totalSakit}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Bolos:</span>
                    <span className="font-semibold text-orange-700">{data.totalBolos}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Dispen:</span>
                    <span className="font-semibold text-purple-700">{data.totalDispen}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default RekapAbsenSemesterTable;
