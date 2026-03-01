import React, { useMemo } from 'react';
import { User, AbsensiGuru, IzinGuru, TahunAjaran } from '../../../../../types';
import { getMonthNames, type DateLocaleLanguage } from '../../../../../utils/dateLocaleUtils';
import { getKeteranganAbsensi, getGuruAbsensiForDate, getGuruIzinForDate, isTanggalExistsInDatabase } from '../utils/absenGuruDataHelpers';

interface RekapAbsenGuruBulanTableProps {
  gurus: User[];
  bulan: number;
  tahun: number;
  absensiGuru: AbsensiGuru[];
  izinGuru: IzinGuru[];
  tahunAjaranData?: TahunAjaran[];
  /** When 'ms', month label uses Malay (Mac, Julai, Ogos, Disember, etc.) */
  language?: DateLocaleLanguage;
}

interface RekapGuruBulanData {
  guru: User;
  absensiPerTanggal: Record<number, string>;
  totalHadir: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  totalBolos: number;
  totalDispen: number;
}

const getStatusCodeFromStatus = (status?: string): string => {
  const statusMap: Record<string, string> = {
    'hadir': 'H',
    'izin': 'I',
    'sakit': 'S',
    'alfa': 'A',
    'bolos': 'B',
    'dispen': 'D',
    '-': '-',
  };
  return statusMap[status?.toLowerCase() || '-'] || '-';
};

const isWeekend = (day: number, tahun: number, bulan: number): boolean => {
  const date = new Date(tahun, bulan - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

const RekapAbsenGuruBulanTable: React.FC<RekapAbsenGuruBulanTableProps> = ({
  gurus,
  bulan,
  tahun,
  absensiGuru,
  izinGuru,
  tahunAjaranData,
  language = 'id',
}) => {
  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  const monthNames = getMonthNames(language);

  const [isMobileView, setIsMobileView] = React.useState(window.innerWidth < 768);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleExpand = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  // Get active tahun ajaran for the selected month/year
  const activeTahunAjaran = useMemo(() => {
    if (!tahunAjaranData || tahunAjaranData.length === 0) return null;
    
    // Find tahun ajaran that covers the selected month/year
    const selectedDate = new Date(tahun, bulan - 1, 1);
    return tahunAjaranData.find(ta => {
      const startDate = new Date(ta.tanggalMulai);
      const endDate = new Date(ta.tanggalSelesai);
      return selectedDate >= startDate && selectedDate <= endDate;
    }) || tahunAjaranData.find(ta => ta.isActive);
  }, [tahunAjaranData, tahun, bulan]);

  // Helper functions with tahunAjaranId filter
  const getGuruAbsensiForDateFiltered = (guru: User, tanggal: string): AbsensiGuru | undefined => {
    return getGuruAbsensiForDate(absensiGuru, guru.id, tanggal, activeTahunAjaran?.id);
  };

  const getGuruIzinForDateFiltered = (guru: User, tanggal: string): IzinGuru | undefined => {
    return getGuruIzinForDate(izinGuru, guru.id, tanggal, activeTahunAjaran?.id);
  };

  const rekapData: RekapGuruBulanData[] = useMemo(() => {
    return gurus.map((guru) => {
      const absensiPerTanggal: Record<number, string> = {};
      let totalHadir = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalAlfa = 0;
      let totalBolos = 0;
      let totalDispen = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let status = '-';

        const absen = getGuruAbsensiForDateFiltered(guru, dateStr);
        const izin = getGuruIzinForDateFiltered(guru, dateStr);

        // Cek apakah tanggal ada di database
        const tanggalExists = isTanggalExistsInDatabase(absensiGuru, dateStr, activeTahunAjaran?.id);

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
  }, [gurus, bulan, tahun, absensiGuru, izinGuru, daysInMonth, activeTahunAjaran]);

  const getColorClass = (s: string) => {
    switch (s) {
      case 'H': return 'bg-green-50 text-green-700 font-semibold';
      case 'I': return 'bg-yellow-50 text-yellow-700 font-semibold';
      case 'S': return 'bg-blue-50 text-blue-700 font-semibold';
      case 'A': return 'bg-red-50 text-red-700 font-semibold';
      case 'B': return 'bg-orange-50 text-orange-700 font-semibold';
      case 'D': return 'bg-purple-50 text-purple-700 font-semibold';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  // =========================
  //      MOBILE VERSION
  // =========================
  if (isMobileView) {
    return (
      <div className="p-3 space-y-4">
        {rekapData.map((data, idx) => {
          const isOpen = expandedIndex === idx;

          return (
            <div
              key={data.guru.id}
              className="bg-white rounded-lg border border-gray-300 shadow-sm"
            >
              {/* CARD HEADER - klik untuk buka/tutup */}
              <div
                onClick={() => toggleExpand(idx)}
                className="p-3 cursor-pointer flex justify-between items-center"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-600">No. {idx + 1}</p>
                  <p className="text-sm font-bold text-gray-900">{data.guru.name}</p>
                  <p className="text-xs text-gray-600">{data.guru.nip || '-'}</p>
                </div>

                <span
  className={`text-gray-500 text-lg transform transition-transform duration-300 ${
    isOpen ? 'rotate-90' : ''
  }`}
>
  ❯
</span>

              </div>

              {/* EXPANDED CONTENT */}
              {isOpen && (
                <div className="p-3 border-t border-gray-200 space-y-3">

                  {/* Kalender */}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Kalender Absensi - {monthNames[bulan - 1]} {tahun}
                    </p>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const status = data.absensiPerTanggal[day] || '-';
                        const weekend = isWeekend(day, tahun, bulan);

                        return (
                          <div
                            key={day}
                            className={`aspect-square flex flex-col items-center justify-center rounded text-xs border ${
                              weekend
                                ? 'bg-slate-300 border-slate-300 text-slate-700'
                                : getColorClass(status)
                            }`}
                          >
                            <div className="text-[10px] font-bold">{day}</div>
                            <div className="text-[10px]">{status}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rekap */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-xs text-gray-600">Hadir</p>
                      <p className="text-sm font-bold text-green-700">{data.totalHadir}</p>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <p className="text-xs text-gray-600">Izin</p>
                      <p className="text-sm font-bold text-yellow-700">{data.totalIzin}</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-xs text-gray-600">Sakit</p>
                      <p className="text-sm font-bold text-blue-700">{data.totalSakit}</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <p className="text-xs text-gray-600">Alfa</p>
                      <p className="text-sm font-bold text-red-700">{data.totalAlfa}</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <p className="text-xs text-gray-600">Bolos</p>
                      <p className="text-sm font-bold text-orange-700">{data.totalBolos}</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <p className="text-xs text-gray-600">Dispen</p>
                      <p className="text-sm font-bold text-purple-700">{data.totalDispen}</p>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // =========================
  //      DESKTOP VERSION
  // =========================
 return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs sm:text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-blue-600 text-white">
            <th className="border border-gray-300 px-1.5 py-2 sm:px-2 text-left font-semibold">No</th>
            <th className="border border-gray-300 px-1.5 py-2 sm:px-2 text-left font-semibold">Nama Guru</th>
            <th className="border border-gray-300 px-1.5 py-2 sm:px-2 text-center font-semibold">NIP</th>
            {Array.from({ length: daysInMonth }, (_, i) => (
              <th
                key={i + 1}
                className={`border border-gray-300 px-0.5 py-2 sm:px-1 text-center font-semibold text-xs text-white ${
                  isWeekend(i + 1, tahun, bulan) ? 'bg-slate-400' : 'bg-blue-600'
                }`}
              >
                <div className="whitespace-nowrap">{i + 1}</div>
              </th>
            ))}
            <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-green-600 text-white">H</th>
            <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-yellow-600 text-white">I</th>
            <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-blue-600 text-white">S</th>
            <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-red-600 text-white">A</th>
            <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-orange-600 text-white">B</th>
            <th className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-semibold bg-purple-600 text-white">D</th>
          </tr>
        </thead>

        <tbody>
          {rekapData.map((data, idx) => (
            <tr key={data.guru.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-1.5 py-2 sm:px-2 text-center font-medium">{idx + 1}</td>
              <td className="border border-gray-300 px-1.5 py-2 sm:px-2 font-medium text-gray-900 truncate max-w-xs">{data.guru.name}</td>
              <td className="border border-gray-300 px-1.5 py-2 sm:px-2 text-center text-gray-600">{data.guru.nip || '-'}</td>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const status = data.absensiPerTanggal[i + 1] || '-';
                return (
                  <td key={i + 1} className={`border border-gray-300 px-1 py-2 sm:px-1.5 text-center ${getColorClass(status)}`}>
                    {status}
                  </td>
                );
              })}
              <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-green-700 bg-green-50">{data.totalHadir}</td>
              <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-yellow-700 bg-yellow-50">{data.totalIzin}</td>
              <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-blue-700 bg-blue-50">{data.totalSakit}</td>
              <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-red-700 bg-red-50">{data.totalAlfa}</td>
              <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-orange-700 bg-orange-50">{data.totalBolos}</td>
              <td className="border border-gray-300 px-1 py-2 sm:px-1.5 text-center font-bold text-purple-700 bg-purple-50">{data.totalDispen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RekapAbsenGuruBulanTable;
