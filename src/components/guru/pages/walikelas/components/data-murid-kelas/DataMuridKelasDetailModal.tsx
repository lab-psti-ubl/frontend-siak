import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import { User as UserType, TahunAjaran, Murid, Absensi } from '../../../../../../types';
import { getInitials } from '../../../../../admin/pages/manejemen-murid/utils/muridUtils';
import PhotoPreviewModal from '../../../../../ui/PhotoPreviewModal';
import { isTanggalExistsInDatabase } from '../absen-kelas/AbsenKelasUtils';

interface DataMuridKelasDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: UserType | null;
  targetKelas: { name?: string; id?: string } | null;
  selectedTahunAjaran: string;
  selectedSemester: number;
  tahunAjaran: TahunAjaran[];
  absensi: Absensi[]; // Data absensi untuk kalender
  getAttendanceStats: (muridId: string, month?: number, year?: number) => {
    hadir: number;
    izin: number;
    sakit: number;
    alfa: number;
    dispen: number;
    bolos: number;
    totalHari: number;
    total: number;
    attendanceRate: number;
  };
}

// Helper function to get months from academic calendar
// Menggunakan data tahun ajaran dari cache yang sudah menyimpan tanggal akademik (tanggalMulai, tanggalSelesai)
const getMonthsFromAcademicCalendar = (
  tahunAjaran: string,
  semester: number,
  tahunAjaranData: TahunAjaran[]
): Array<{ value: number; label: string; year: number }> => {
  // Cari data tahun ajaran dari cache yang sudah menyimpan tanggal akademik
  const taData = tahunAjaranData.find(ta => ta.tahun === tahunAjaran && ta.semester === semester);
  
  // Jika data tahun ajaran ditemukan dan memiliki tanggal akademik, gunakan untuk generate bulan
  if (taData && taData.tanggalMulai && taData.tanggalSelesai) {
    const startDate = new Date(taData.tanggalMulai);
    const endDate = new Date(taData.tanggalSelesai);
    
    // Validasi tanggal
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('Invalid date format in academic calendar:', { tanggalMulai: taData.tanggalMulai, tanggalSelesai: taData.tanggalSelesai });
      // Fallback ke default
    } else {
      const months: Array<{ value: number; label: string; year: number }> = [];
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      
      const currentDate = new Date(startDate);
      currentDate.setDate(1); // Set to first day of month
      
      const endDateCheck = new Date(endDate);
      while (currentDate <= endDateCheck) {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        
        months.push({
          value: month,
          label: `${monthNames[month - 1]} ${year}`,
          year: year
        });
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Jika ada bulan yang ditemukan, return
      if (months.length > 0) {
        return months;
      }
    }
  }
  
  // Fallback: return all months if no calendar data atau data tidak valid
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const currentYear = new Date().getFullYear();
  return monthNames.map((name, idx) => ({
    value: idx + 1,
    label: `${name} ${currentYear}`,
    year: currentYear
  }));
}

const DataMuridKelasDetailModal: React.FC<DataMuridKelasDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  targetKelas,
  selectedTahunAjaran,
  selectedSemester,
  tahunAjaran,
  absensi,
  getAttendanceStats
}) => {
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  
  // Get available months from academic calendar menggunakan cache tahun ajaran
  // Cache tahun ajaran sudah menyimpan tanggal akademik (tanggalMulai, tanggalSelesai)
  const availableMonths = useMemo(() => {
    return getMonthsFromAcademicCalendar(selectedTahunAjaran, selectedSemester, tahunAjaran);
  }, [selectedTahunAjaran, selectedSemester, tahunAjaran]);
  
  // Initialize selected month to first available month or current month
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    if (availableMonths.length > 0) {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const currentMonthOption = availableMonths.find(m => m.value === currentMonth && m.year === currentYear);
      return currentMonthOption ? currentMonthOption.value : availableMonths[0].value;
    }
    return new Date().getMonth() + 1;
  });
  
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (availableMonths.length > 0) {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const currentMonthOption = availableMonths.find(m => m.value === currentMonth && m.year === currentYear);
      return currentMonthOption ? currentMonthOption.year : availableMonths[0].year;
    }
    return new Date().getFullYear();
  });
  
  // Update selectedYear when month changes
  useEffect(() => {
    const monthOption = availableMonths.find(m => m.value === selectedMonth);
    if (monthOption) {
      setSelectedYear(monthOption.year);
    }
  }, [selectedMonth, availableMonths]);

  if (!selectedMurid) return null;

  const stats = getAttendanceStats(selectedMurid.id, selectedMonth, selectedYear);

  // Helper untuk mendapatkan absensi per hari dari data absensi langsung
  const getDayAbsensi = (day: number): { masuk?: Absensi; pulang?: Absensi } => {
    const dateStr = String(selectedYear).padStart(4, '0') + '-' +
                    String(selectedMonth).padStart(2, '0') + '-' +
                    String(day).padStart(2, '0');

    const kelasId = targetKelas?.id || '';
    const taData = tahunAjaran.find(ta => ta.tahun === selectedTahunAjaran && ta.semester === selectedSemester);

    // Filter absensi untuk tanggal tersebut
    const dayAbsensi = absensi.filter(a =>
      a.muridId === selectedMurid.id &&
      a.kelasId === kelasId &&
      a.tahunAjaranId === taData?.id &&
      a.semester === selectedSemester &&
      a.tanggal === dateStr
    );

    // Handle new structure (one record per day with jamMasuk/jamKeluar)
    if (dayAbsensi.length > 0) {
      const dayRecord = dayAbsensi[0];
      
      // Check if it's new structure (has jamMasuk/jamKeluar or statusMasuk/statusKeluar)
      if (dayRecord.jamMasuk || dayRecord.statusMasuk || dayRecord.jamKeluar || dayRecord.statusKeluar) {
        const masukRecord: Absensi | undefined = (dayRecord.jamMasuk || dayRecord.statusMasuk) ? {
          ...dayRecord,
          tipeAbsen: 'masuk',
          waktu: dayRecord.jamMasuk || dayRecord.waktu || '',
          status: (dayRecord.statusMasuk === 'izin' || dayRecord.statusMasuk === 'sakit' || dayRecord.statusMasuk === 'alfa') 
            ? dayRecord.statusMasuk 
            : (dayRecord.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir'),
        } : undefined;

        const pulangRecord: Absensi | undefined = (dayRecord.jamKeluar || dayRecord.statusKeluar) ? {
          ...dayRecord,
          tipeAbsen: 'pulang',
          waktu: dayRecord.jamKeluar || dayRecord.waktu || '',
          status: (dayRecord.statusKeluar === 'izin' || dayRecord.statusKeluar === 'sakit' || dayRecord.statusKeluar === 'alfa') 
            ? dayRecord.statusKeluar 
            : (dayRecord.statusKeluar === 'pulang_awal' || dayRecord.statusKeluar === 'pulang_cepat' ? 'pulang_cepat' : 'hadir'),
        } : undefined;

        return { masuk: masukRecord, pulang: pulangRecord };
      }
    }

    // Backward compatibility: old structure (separate records with tipeAbsen)
    const masuk = dayAbsensi.find(a => a.tipeAbsen === 'masuk');
    const pulang = dayAbsensi.find(a => a.tipeAbsen === 'pulang');

    return { masuk, pulang };
  };

  // Generate calendar days
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Helper untuk menentukan keterangan absensi (Hadir, Sakit, Izin, Alfa, Dispen, Bolos)
  const getKeteranganAbsensi = (day: number, masuk?: Absensi, pulang?: Absensi): 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'Dispen' | 'Bolos' | null => {
    const dateStr = String(selectedYear).padStart(4, '0') + '-' +
                    String(selectedMonth).padStart(2, '0') + '-' +
                    String(day).padStart(2, '0');

    const kelasId = targetKelas?.id || '';
    const taData = tahunAjaran.find(ta => ta.tahun === selectedTahunAjaran && ta.semester === selectedSemester);

    // Cek apakah tanggal ada di database
    const tanggalExists = isTanggalExistsInDatabase(
      absensi,
      dateStr,
      kelasId,
      taData?.id,
      selectedSemester
    );

    // Jika tanggal tidak ada di database, return null (akan ditampilkan sebagai "-")
    if (!tanggalExists) {
      return null;
    }

    // Jika tanggal ada di database tapi murid tidak memiliki record, return "Alfa"
    if (!masuk && !pulang) {
      return 'Alfa';
    }

    // Jika ada keteranganAbsensi langsung, gunakan itu
    if (masuk?.keteranganAbsensi) {
      return masuk.keteranganAbsensi as 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'Dispen' | 'Bolos';
    }
    if (pulang?.keteranganAbsensi) {
      return pulang.keteranganAbsensi as 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'Dispen' | 'Bolos';
    }

    // Jika tidak ada absensi masuk
    if (!masuk) {
      return 'Bolos';
    }

    // Check statusMasuk (new structure) atau status (old structure)
    const masukStatus = masuk.statusMasuk || masuk.status;
    
    if (masukStatus === 'izin') {
      return 'Izin';
    }

    if (masukStatus === 'sakit') {
      return 'Sakit';
    }

    if (masukStatus === 'alfa' || masukStatus === 'tidak_masuk') {
      return 'Alfa';
    }

    // Jika masuk hadir/tepat_waktu/terlambat, cek pulang
    if (!pulang) {
      // Masuk hadir tapi belum pulang, anggap hadir
      if (masukStatus === 'hadir' || masukStatus === 'tepat_waktu' || masukStatus === 'terlambat') {
        return 'Hadir';
      }
      return null;
    }

    // Check statusKeluar (new structure) atau status (old structure)
    const pulangStatus = pulang.statusKeluar || pulang.status;

    // Jika pulang izin atau sakit, maka Dispen
    if (pulangStatus === 'izin' || pulangStatus === 'sakit') {
      return 'Dispen';
    }

    // Jika pulang alfa, maka Bolos
    if (pulangStatus === 'alfa' || pulangStatus === 'tidak_keluar') {
      return 'Bolos';
    }

    // Jika masuk dan pulang keduanya hadir/tepat_waktu, maka Hadir
    if ((masukStatus === 'hadir' || masukStatus === 'tepat_waktu' || masukStatus === 'terlambat') &&
        (pulangStatus === 'hadir' || pulangStatus === 'tepat_waktu' || pulangStatus === 'pulang_awal' || pulangStatus === 'pulang_cepat')) {
      return 'Hadir';
    }

    return 'Hadir'; // Default
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Murid - ${selectedMurid.name}`}
      size="xl"
    >
      <div className="pb-12 sm:pb-0 space-y-5 sm:space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border border-blue-200 p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <button
              type="button"
              onClick={() => selectedMurid.profileImage && setIsPhotoPreviewOpen(true)}
              className={`transition-all flex-shrink-0 ${
                selectedMurid.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
              }`}
            >
              {selectedMurid.profileImage ? (
                <img
                  src={selectedMurid.profileImage}
                  alt={selectedMurid.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full border-2 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {getInitials(selectedMurid.name)}
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">{selectedMurid.name}</h3>
              <div className="mt-2 space-y-1">
                <p className="text-xs sm:text-sm text-slate-600"><span className="font-semibold text-slate-700">NISN:</span> <code className="bg-white px-2 py-1 rounded text-slate-700 font-mono">{(selectedMurid as Murid).nisn || '-'}</code></p>
                <p className="text-xs sm:text-sm text-slate-600"><span className="font-semibold text-slate-700">Email:</span> {selectedMurid.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-slate-200">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Kelas (Periode)</p>
            <p className="text-sm sm:text-base font-bold text-slate-900">{targetKelas?.name || '-'}</p>
          </div>
          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-slate-200">
            <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">WhatsApp Orang Tua</p>
            <p className="text-sm sm:text-base font-bold text-slate-900 break-all">{((selectedMurid as Murid)?.whatsappOrtu) || '-'}</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg sm:rounded-xl p-5 sm:p-6 border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h4 className="text-sm sm:text-base font-bold text-blue-900 uppercase tracking-wide">
              Statistik Kehadiran - {selectedTahunAjaran} Semester {selectedSemester}
            </h4>
            {availableMonths.length > 0 && (
              <select
                value={`${selectedMonth}-${selectedYear}`}
                onChange={(e) => {
                  const [month, year] = e.target.value.split('-').map(Number);
                  setSelectedMonth(month);
                  setSelectedYear(year);
                }}
                className="px-3 sm:px-4 py-2 border border-blue-300 rounded-lg text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                {availableMonths.map((monthOption) => (
                  <option key={`${monthOption.value}-${monthOption.year}`} value={`${monthOption.value}-${monthOption.year}`}>
                    {monthOption.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border border-blue-100">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-1">{stats.hadir}</div>
              <div className="text-xs sm:text-sm font-semibold text-emerald-700 uppercase tracking-wide">Hadir</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border border-blue-100">
              <div className="text-2xl sm:text-3xl font-bold text-amber-600 mb-1">{stats.izin}</div>
              <div className="text-xs sm:text-sm font-semibold text-amber-700 uppercase tracking-wide">Izin</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border border-blue-100">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">{stats.sakit}</div>
              <div className="text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wide">Sakit</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border border-blue-100">
              <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1">{stats.alfa}</div>
              <div className="text-xs sm:text-sm font-semibold text-red-700 uppercase tracking-wide">Alfa</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border border-blue-100">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">{stats.dispen}</div>
              <div className="text-xs sm:text-sm font-semibold text-purple-700 uppercase tracking-wide">Dispen</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border border-blue-100">
              <div className="text-2xl sm:text-3xl font-bold text-red-700 mb-1">{stats.bolos}</div>
              <div className="text-xs sm:text-sm font-semibold text-red-800 uppercase tracking-wide">Bolos</div>
            </div>
          </div>
        </div>

        <div className=" bg-white rounded-lg sm:rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-b border-slate-200">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide">Riwayat Absensi</h4>
          </div>
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-0 border-b border-slate-200">
                  {weekDays.map((day, dayIdx) => {
                    const isWeekend = dayIdx === 0 || dayIdx === 6;
                    return (
                      <div
                        key={day}
                        className={`text-center py-2 sm:py-3 font-semibold text-xs sm:text-sm border-r border-slate-200 last:border-r-0 ${
                          isWeekend
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-slate-700'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-0 p-0">
                  {days.map((day, idx) => {
                    const absensi = day ? getDayAbsensi(day) : null;
                    const isToday = day === new Date().getDate() &&
                                   new Date().getMonth() + 1 === selectedMonth &&
                                   new Date().getFullYear() === selectedYear;
                    const dayOfWeek = idx % 7;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    const keterangan = day ? getKeteranganAbsensi(day, absensi?.masuk, absensi?.pulang) : null;

                    const getBackgroundColor = () => {
                      if (!day) return 'bg-slate-50';
                      if (isToday) return 'bg-blue-100';

                      if (keterangan === 'Sakit') return 'bg-blue-50';
                      if (keterangan === 'Izin') return 'bg-yellow-50';
                      if (keterangan === 'Alfa' || keterangan === 'Bolos') return 'bg-red-50';
                      if (keterangan === 'Dispen') return 'bg-purple-50';
                      if (keterangan === 'Hadir') return 'bg-emerald-50';

                      if (isWeekend) return 'bg-red-50';
                      return 'bg-white';
                    };

                    const getKeteranganColor = () => {
                      if (keterangan === 'Hadir') return 'bg-emerald-100 text-emerald-700';
                      if (keterangan === 'Izin') return 'bg-yellow-100 text-yellow-700';
                      if (keterangan === 'Sakit') return 'bg-blue-200 text-blue-700';
                      if (keterangan === 'Alfa') return 'bg-red-100 text-red-700';
                      if (keterangan === 'Dispen') return 'bg-purple-100 text-purple-700';
                      if (keterangan === 'Bolos') return 'bg-red-100 text-red-700';
                      return 'bg-slate-100 text-slate-500';
                    };

                    return (
                      <div
                        key={idx}
                        className={`aspect-square border border-slate-200 p-1 sm:p-2 flex flex-col text-xs ${getBackgroundColor()} ${
                          day ? 'cursor-pointer hover:shadow-md transition-all duration-200' : ''
                        }`}
                      >
                        {day && (
                          <>
                            <div className={`font-semibold mb-1 ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                              {day}
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                              {keterangan ? (
                                <div className={`px-1.5 sm:px-2 py-1 sm:py-1.5 rounded text-[9px] sm:text-[10px] font-semibold uppercase text-center ${getKeteranganColor()}`}>
                                  {keterangan}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-slate-400 text-[9px] sm:text-[10px]">
                                  <AlertCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                  <span>-</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <PhotoPreviewModal
          isOpen={isPhotoPreviewOpen}
          onClose={() => setIsPhotoPreviewOpen(false)}
          photoUrl={selectedMurid.profileImage || null}
          name={selectedMurid.name}
        />
      </div>
    </Modal>
  );
};

export default DataMuridKelasDetailModal;