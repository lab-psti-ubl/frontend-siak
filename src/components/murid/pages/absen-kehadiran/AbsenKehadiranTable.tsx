import React, { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Absensi } from '../../../../types';
import { usePengaturanAbsen } from '../../../../hooks/usePengaturanAbsen';
import { getAbsenMasukStatus, getAbsenPulangStatus, determineKeterangan } from './absenKehadiranIntegratedUtils';
import AbsenDetailModal from './AbsenDetailModal';

interface AbsenKehadiranTableProps {
  kehadiranAbsensi: Absensi[];
  selectedMonth: number;
  selectedYear: number;
  sesiAbsensi?: any[];
}

const AbsenKehadiranTable: React.FC<AbsenKehadiranTableProps> = ({
  kehadiranAbsensi,
  selectedMonth,
  selectedYear,
}) => {
  const { activePengaturanAbsen } = usePengaturanAbsen();
  const [selectedDateDetail, setSelectedDateDetail] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Helper untuk mendapatkan absensi per hari dari data absensi langsung
  // Menggunakan logika yang sama seperti DataMuridKelasDetailModal.tsx
  const getDayAbsensi = (day: number): { masuk?: Absensi; pulang?: Absensi } => {
    const dateStr = String(selectedYear).padStart(4, '0') + '-' +
                    String(selectedMonth).padStart(2, '0') + '-' +
                    String(day).padStart(2, '0');
    return getDayAbsensiByDateStr(dateStr);
  };

  // Helper untuk mendapatkan absensi berdasarkan dateStr (untuk modal)
  const getDayAbsensiByDateStr = (dateStr: string): { masuk?: Absensi; pulang?: Absensi } => {
    // Filter absensi untuk tanggal tersebut
    const dayAbsensi = kehadiranAbsensi.filter(a => a.tanggal === dateStr);

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

  const getGroupedByDate = useMemo(() => {
    const grouped: Record<string, { masuk?: Absensi; pulang?: Absensi }> = {};
    
    kehadiranAbsensi.forEach(a => {
      // Use tanggal field first, then fallback to waktu for backward compatibility
      const dateStr = a.tanggal || (a.waktu ? a.waktu.split('T')[0] : '');
      if (!dateStr) return;

      if (!grouped[dateStr]) {
        grouped[dateStr] = {};
      }

      // New structure: one record per day contains both masuk and pulang
      if (a.jamMasuk || a.statusMasuk) {
        grouped[dateStr].masuk = {
          ...a,
          tipeAbsen: 'masuk',
          waktu: a.jamMasuk || a.waktu || '',
          status: a.statusMasuk === 'izin' ? 'izin' :
                  a.statusMasuk === 'sakit' ? 'sakit' :
                  a.statusMasuk === 'alfa' ? 'alfa' :
                  a.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
        };
      }

      if (a.jamKeluar || a.statusKeluar) {
        grouped[dateStr].pulang = {
          ...a,
          tipeAbsen: 'pulang',
          waktu: a.jamKeluar || a.waktu || '',
          status: a.statusKeluar === 'izin' ? 'izin' :
                  a.statusKeluar === 'sakit' ? 'sakit' :
                  a.statusKeluar === 'alfa' ? 'alfa' :
                  a.statusKeluar === 'pulang_awal' ? 'pulang_cepat' : 'hadir',
        };
      }

      // Backward compatibility: old structure (separate records)
      if (a.tipeAbsen === 'masuk') {
        grouped[dateStr].masuk = a;
      } else if (a.tipeAbsen === 'pulang') {
        grouped[dateStr].pulang = a;
      }
    });
    
    return Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [kehadiranAbsensi]);

  // Helper untuk menentukan keterangan absensi (Hadir, Sakit, Izin, Alfa, Dispen, Bolos)
  // Menggunakan logika yang sama seperti DataMuridKelasDetailModal.tsx
  const getKeteranganAbsensi = (masuk?: Absensi, pulang?: Absensi): 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'Dispen' | 'Bolos' | null => {
    // Jika ada keteranganAbsensi langsung, gunakan itu
    if (masuk?.keteranganAbsensi) {
      return masuk.keteranganAbsensi as 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'Dispen' | 'Bolos';
    }
    if (pulang?.keteranganAbsensi) {
      return pulang.keteranganAbsensi as 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'Dispen' | 'Bolos';
    }

    // Jika tidak ada absensi sama sekali
    if (!masuk && !pulang) {
      return null;
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

  return (
    <div className="space-y-4">
      {/* Calendar Display */}
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

            const keterangan = absensi ? getKeteranganAbsensi(absensi.masuk, absensi.pulang) : null;

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

            const handleDateClick = () => {
              if (day) {
                const dateStr = String(selectedYear).padStart(4, '0') + '-' +
                                String(selectedMonth).padStart(2, '0') + '-' +
                                String(day).padStart(2, '0');
                setSelectedDateDetail(dateStr);
                setIsDetailModalOpen(true);
              }
            };

            return (
              <div
                key={idx}
                onClick={handleDateClick}
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

      {/* Detailed List */}
      {kehadiranAbsensi.length > 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Tanggal</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Masuk</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Waktu</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Pulang</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Waktu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Keterangan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Metode</th>
                </tr>
              </thead>
              <tbody>
                {getGroupedByDate.map(([dateStr, { masuk, pulang }], idx) => {
                  const date = new Date(dateStr);
                  const masukTime = masuk && masuk.waktu ? new Date(masuk.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
                  const pulangTime = pulang && pulang.waktu ? new Date(pulang.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

                  const masukStatus = masuk && masuk.waktu ? getAbsenMasukStatus(
                    new Date(masuk.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    activePengaturanAbsen || undefined
                  ) : null;

                  const pulangStatus = pulang && pulang.waktu ? getAbsenPulangStatus(
                    new Date(pulang.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    activePengaturanAbsen || undefined
                  ) : null;

                  const keterangan = determineKeterangan(masuk || null, pulang || null, activePengaturanAbsen || undefined);

                  const getMasukLabel = () => {
                    if (!masuk) return 'Bolos';
                    if (masuk.status === 'izin') return 'Izin';
                    if (masuk.status === 'sakit') return 'Sakit';
                    if (masuk.status === 'alfa') return 'Alfa';
                    return masukStatus === 'hadir' ? 'Hadir' : 'Terlambat';
                  };

                  const getPulangLabel = () => {
                    if (!pulang) return '-';
                    if (pulang.status === 'izin') return 'Izin';
                    if (pulang.status === 'sakit') return 'Sakit';
                    if (pulang.status === 'alfa') return 'Alfa';
                    return pulangStatus === 'hadir' ? 'Hadir' : 'Pulang Cepat';
                  };

                  const getMasukColor = () => {
                    if (!masuk) return 'bg-red-100 text-red-700';
                    if (masuk.status === 'izin') return 'bg-blue-100 text-blue-700';
                    if (masuk.status === 'sakit') return 'bg-orange-100 text-orange-700';
                    if (masuk.status === 'alfa') return 'bg-red-100 text-red-700';
                    return masukStatus === 'hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700';
                  };

                  const getPulangColor = () => {
                    if (!pulang) return 'bg-slate-100 text-slate-600';
                    if (pulang.status === 'izin') return 'bg-blue-100 text-blue-700';
                    if (pulang.status === 'sakit') return 'bg-orange-100 text-orange-700';
                    if (pulang.status === 'alfa') return 'bg-red-100 text-red-700';
                    return pulangStatus === 'hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700';
                  };

                  const getKeteranganColor = () => {
                    switch (keterangan) {
                      case 'Hadir': return 'bg-emerald-100 text-emerald-700';
                      case 'Izin': return 'bg-blue-100 text-blue-700';
                      case 'Sakit': return 'bg-orange-100 text-orange-700';
                      case 'Bolos': return 'bg-red-100 text-red-700';
                      case 'Dispen': return 'bg-purple-100 text-purple-700';
                      case 'Alfa': return 'bg-red-100 text-red-700';
                      default: return 'bg-slate-100 text-slate-600';
                    }
                  };

                  const methodLabel = masuk?.method === 'admin-qr' ? 'QR Admin' : masuk?.method === 'manual' ? 'Manual' : 'Otomatis';

                  return (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                        {date.toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getMasukColor()}`}>
                          {getMasukLabel()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-700">
                        {masukTime}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getPulangColor()}`}>
                          {getPulangLabel()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-700">
                        {pulangTime}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getKeteranganColor()}`}>
                          {keterangan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {methodLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Tidak ada data absen kehadiran</p>
          <p className="text-slate-400 text-sm mt-1">Mulai scan QR admin untuk mencatat absen masuk dan pulang</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDateDetail && (
        <AbsenDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedDateDetail(null);
          }}
          masuk={getDayAbsensiByDateStr(selectedDateDetail).masuk}
          pulang={getDayAbsensiByDateStr(selectedDateDetail).pulang}
          selectedDate={selectedDateDetail}
          pengaturanAbsen={activePengaturanAbsen || undefined}
        />
      )}
    </div>
  );
};

export default AbsenKehadiranTable;
