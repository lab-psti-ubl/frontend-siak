import React, { useMemo } from 'react';
import { User, AbsensiGuru, IzinGuru, TahunAjaran } from '../../../../../types';
import { getKeteranganAbsensi, getGuruIzinForDate, getGuruAbsensiForDate, isTanggalExistsInDatabase } from '../utils/absenGuruDataHelpers';

interface RekapAbsenGuruSemesterTableProps {
  gurus: User[];
  tahunAjaran: string;
  semester: number;
  absensiGuru: AbsensiGuru[];
  izinGuru: IzinGuru[];
  tahunAjaranData?: TahunAjaran[];
}

interface RekapGuruSemesterData {
  guru: User;
  totalHadir: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  totalBolos: number;
  totalDispen: number;
}

const getSemesterDateRange = (tahunAjaran: string, semester: number, tahunAjaranData?: TahunAjaran[]) => {
  if (!tahunAjaranData || tahunAjaranData.length === 0) {
    const startDate = new Date(new Date().getFullYear(), semester === 1 ? 6 : 0, 1);
    const endDate = new Date(new Date().getFullYear() + 1, semester === 1 ? 11 : 5, 31);
    return { startDate, endDate };
  }

  const taData = tahunAjaranData.find(ta => ta.tahun === tahunAjaran && ta.semester === semester);
  const startDate = taData?.tanggalMulai ? new Date(taData.tanggalMulai) : new Date();
  const endDate = taData?.tanggalSelesai ? new Date(taData.tanggalSelesai) : new Date();

  return { startDate, endDate };
};

const RekapAbsenGuruSemesterTable: React.FC<RekapAbsenGuruSemesterTableProps> = ({
  gurus,
  tahunAjaran,
  semester,
  absensiGuru,
  izinGuru,
  tahunAjaranData,
}) => {
  const { startDate, endDate } = getSemesterDateRange(tahunAjaran, semester, tahunAjaranData);

  // Get tahunAjaranId for the selected tahun ajaran and semester
  const tahunAjaranId = React.useMemo(() => {
    if (!tahunAjaranData || !tahunAjaran) return undefined;
    return tahunAjaranData.find(ta => ta.tahun === tahunAjaran && ta.semester === semester)?.id;
  }, [tahunAjaranData, tahunAjaran, semester]);

  const [isMobileView, setIsMobileView] = React.useState(window.innerWidth < 768);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(prev => (prev === idx ? null : idx));
  };

  const rekapData: RekapGuruSemesterData[] = useMemo(() => {
    // Generate all dates in the semester range
    const allDatesInRange: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      allDatesInRange.push(`${year}-${month}-${day}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return gurus.map(guru => {
      let totalHadir = 0;
      let totalIzin = 0;
      let totalSakit = 0;
      let totalAlfa = 0;
      let totalBolos = 0;
      let totalDispen = 0;

      // Helper functions with tahunAjaranId filter
      const getGuruAbsensiForDateFiltered = (tanggal: string): AbsensiGuru | undefined => {
        return getGuruAbsensiForDate(absensiGuru, guru.id, tanggal, tahunAjaranId);
      };

      const getGuruIzinForDateFiltered = (tanggal: string): IzinGuru | undefined => {
        return getGuruIzinForDate(izinGuru, guru.id, tanggal, tahunAjaranId);
      };

      // Process all dates in the semester range
      allDatesInRange.forEach(tanggal => {
        // Cek apakah tanggal ada di database dengan filter tahunAjaranId dan semester
        const tanggalExists = isTanggalExistsInDatabase(absensiGuru, tanggal, tahunAjaranId, semester);
        
        // Jika tanggal tidak ada di database, skip (tidak dihitung)
        if (!tanggalExists) {
          return;
        }

        // Get absensi and izin for this date
        const absen = getGuruAbsensiForDateFiltered(tanggal);
        const izin = getGuruIzinForDateFiltered(tanggal);

        // Use getKeteranganAbsensi to get the correct keterangan based on logic
        const keterangan = getKeteranganAbsensi(absen || undefined, izin, tanggalExists);

        // Skip '-' karena tidak dihitung dalam rekap
        if (keterangan === "Hadir") {
          totalHadir++;
        } else if (keterangan === "Izin") {
          totalIzin++;
        } else if (keterangan === "Sakit") {
          totalSakit++;
        } else if (keterangan === "Alfa") {
          totalAlfa++;
        } else if (keterangan === "Bolos") {
          totalBolos++;
        } else if (keterangan === "Dispen") {
          totalDispen++;
        }
        // If keterangan === '-', skip (tidak dihitung)
      });

      return {
        guru,
        totalHadir,
        totalIzin,
        totalSakit,
        totalAlfa,
        totalBolos,
        totalDispen,
      };
    });
  }, [gurus, absensiGuru, izinGuru, startDate, endDate, tahunAjaran, semester, tahunAjaranData, tahunAjaranId]);

  // ============================
  //        MOBILE VIEW
  // ============================
  if (isMobileView) {
    return (
      <div className="p-3 space-y-3">
        {rekapData.map((data, idx) => {
          const isOpen = expandedIndex === idx;

          return (
            <div
              key={data.guru.id}
              className="bg-white rounded-lg border border-gray-300 shadow-sm"
            >
              {/* HEADER CLICK */}
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

              {/* EXPANDED PANEL */}
              {isOpen && (
                <div className="p-3 border-t border-gray-200 grid grid-cols-2 gap-2">

                  <div className="p-2.5 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium">Hadir</p>
                    <p className="text-lg font-bold text-green-700">{data.totalHadir}</p>
                  </div>

                  <div className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-700 font-medium">Izin</p>
                    <p className="text-lg font-bold text-yellow-700">{data.totalIzin}</p>
                  </div>

                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium">Sakit</p>
                    <p className="text-lg font-bold text-blue-700">{data.totalSakit}</p>
                  </div>

                  <div className="p-2.5 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-red-700 font-medium">Alfa</p>
                    <p className="text-lg font-bold text-red-700">{data.totalAlfa}</p>
                  </div>

                  <div className="p-2.5 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-700 font-medium">Bolos</p>
                    <p className="text-lg font-bold text-orange-700">{data.totalBolos}</p>
                  </div>

                  <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-700 font-medium">Dispen</p>
                    <p className="text-lg font-bold text-purple-700">{data.totalDispen}</p>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ============================
  //        DESKTOP VIEW
  // ============================
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs sm:text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="bg-blue-600 text-white">
            <th className="border border-gray-300 px-2 py-2 text-left font-semibold">No</th>
            <th className="border border-gray-300 px-2 py-2 text-left font-semibold">Nama Guru</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold">NIP</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold bg-green-600 text-white">H</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold bg-yellow-600 text-white">I</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold bg-blue-600 text-white">S</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold bg-red-600 text-white">A</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold bg-orange-600 text-white">B</th>
            <th className="border border-gray-300 px-2 py-2 text-center font-semibold bg-purple-600 text-white">D</th>
          </tr>
        </thead>

        <tbody>
          {rekapData.map((data, idx) => (
            <tr key={data.guru.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="border px-2 py-2 text-center font-medium">{idx + 1}</td>
              <td className="border px-2 py-2 font-medium text-gray-900">{data.guru.name}</td>
              <td className="border px-2 py-2 text-center text-gray-700">{data.guru.nip || '-'}</td>
              <td className="border px-2 py-2 text-center font-bold text-green-700 bg-green-50">{data.totalHadir}</td>
              <td className="border px-2 py-2 text-center font-bold text-yellow-700 bg-yellow-50">{data.totalIzin}</td>
              <td className="border px-2 py-2 text-center font-bold text-blue-700 bg-blue-50">{data.totalSakit}</td>
              <td className="border px-2 py-2 text-center font-bold text-red-700 bg-red-50">{data.totalAlfa}</td>
              <td className="border px-2 py-2 text-center font-bold text-orange-700 bg-orange-50">{data.totalBolos}</td>
              <td className="border px-2 py-2 text-center font-bold text-purple-700 bg-purple-50">{data.totalDispen}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RekapAbsenGuruSemesterTable;
