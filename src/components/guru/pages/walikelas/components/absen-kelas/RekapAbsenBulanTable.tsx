import React, { useMemo } from 'react';
import { User, Absensi, SesiAbsensi, PengaturanAbsen, Murid } from '../../../../../../types';
import { determineKeterangan } from '../../../../../../utils/absenValidationUtils';
import { isTanggalExistsInDatabase } from './AbsenKelasUtils';

interface RekapAbsenBulanTableProps {
  muridKelas: User[];
  bulan: number;
  tahun: number;
  sesiAbsensi: SesiAbsensi[];
  absensi: Absensi[];
  pengaturanAbsen?: PengaturanAbsen[];
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

const isWeekend = (day: number, tahun: number, bulan: number): boolean => {
  const date = new Date(tahun, bulan - 1, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

const RekapAbsenBulanTable: React.FC<RekapAbsenBulanTableProps> = ({
  muridKelas,
  bulan,
  tahun,
  sesiAbsensi,
  absensi,
  pengaturanAbsen = [],
}) => {
  const [openCard, setOpenCard] = React.useState<string | null>(null);

  const toggleCard = (id: string) => {
    setOpenCard(prev => (prev === id ? null : id));
  };

  const daysInMonth = new Date(tahun, bulan, 0).getDate();
  const activePengaturanAbsen = pengaturanAbsen.find(p => p.isActive);

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
        const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        let dayStatus = '-';

        // Get kelasId and tahunAjaranId from first absensi record (if available)
        const firstAbsensi = absensi[0];
        const kelasId = firstAbsensi?.kelasId;
        const tahunAjaranId = firstAbsensi?.tahunAjaranId;
        const semester = firstAbsensi?.semester;

        // Cek apakah tanggal ada di database
        const tanggalExists = isTanggalExistsInDatabase(
          absensi,
          dateStr,
          kelasId,
          tahunAjaranId,
          semester
        );

        // Jika tanggal tidak ada di database, tampilkan "-"
        if (!tanggalExists) {
          absensiPerTanggal[day] = '-';
          continue;
        }

        // Find day's absensi (one record per day in new structure)
        const dayAbsensi = absensi.find(a =>
          a.muridId === murid.id && a.tanggal === dateStr
        );

        // Jika tanggal ada di database tapi murid tidak memiliki record, tampilkan "Alfa"
        if (!dayAbsensi) {
          dayStatus = 'A';
          totalAlfa++;
          absensiPerTanggal[day] = dayStatus;
          continue;
        }

        // Jika ada record absensi, proses seperti biasa
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

        const keteranganResult = determineKeterangan(finalMasuk, finalPulang, activePengaturanAbsen);
        dayStatus = getStatusCodeFromKeterangan(keteranganResult.keterangan);

        const keterangan = keteranganResult.keterangan;
        if (keterangan === 'Hadir') totalHadir++;
        else if (keterangan === 'Izin') totalIzin++;
        else if (keterangan === 'Sakit') totalSakit++;
        else if (keterangan === 'Alfa') totalAlfa++;
        else if (keterangan === 'Bolos') totalBolos++;
        else if (keterangan === 'Dispen') totalDispen++;

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
  }, [muridKelas, bulan, tahun, sesiAbsensi, absensi, daysInMonth, activePengaturanAbsen]);

  const statusLabels: Record<string, { label: string; color: string; bgColor: string }> = {
    H: { label: 'Hadir', color: 'text-green-700', bgColor: 'bg-green-50' },
    I: { label: 'Izin', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    S: { label: 'Sakit', color: 'text-blue-700', bgColor: 'bg-blue-50' },
    A: { label: 'Alfa', color: 'text-red-700', bgColor: 'bg-red-50' },
    B: { label: 'Bolos', color: 'text-orange-700', bgColor: 'bg-orange-50' },
    D: { label: 'Dispen', color: 'text-purple-700', bgColor: 'bg-purple-50' },
    '-': { label: '-', color: 'text-gray-500', bgColor: 'bg-gray-50' },
  };

  return (
    <>
      {/* Desktop/Tablet View - Table */}
      <div className="hidden sm:block overflow-x-auto border rounded-lg border-gray-200">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <th className="border border-gray-300 px-1.5 py-2 sm:px-2 text-left font-semibold">No</th>
              <th className="border border-gray-300 px-1.5 py-2 sm:px-2 text-left font-semibold">Nama Murid</th>
              <th className="border border-gray-300 px-1.5 py-2 sm:px-2 text-center font-semibold">NISN</th>

              {Array.from({ length: daysInMonth }, (_, i) => (
                <th
                  key={i + 1}
                  className={`border border-gray-300 px-0.5 py-2 sm:px-1 text-center font-semibold text-xs text-white ${
                    isWeekend(i + 1, tahun, bulan) ? 'bg-slate-500' : 'bg-blue-600'
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
              <tr key={data.murid.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100 transition-colors'}>
                <td className="border border-gray-300 px-1.5 py-2 sm:px-2 text-center font-medium text-slate-900">{idx + 1}</td>
                <td className="border border-gray-300 px-1.5 py-2 sm:px-2 font-medium text-gray-900 truncate max-w-xs">{data.murid.name}</td>
                <td className="border border-gray-300 px-1.5 py-2 sm:px-2 text-center text-gray-600">{(data.murid as Murid).nisn || '-'}</td>

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const status = data.absensiPerTanggal[day];
                  const isWknd = isWeekend(day, tahun, bulan);
                  const statusInfo = statusLabels[status] || statusLabels['-'];

                  return (
                    <td
                      key={day}
                      className={`border border-gray-300 px-0.5 py-2 sm:px-1 text-center font-semibold text-xs ${statusInfo.color} ${statusInfo.bgColor} ${
                        isWknd ? 'opacity-70' : ''
                      }`}
                      title={statusInfo.label}
                    >
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

      {/* Mobile View - Card List */}
      {/* Mobile View - Material Design */}
      <div className="sm:hidden space-y-3">
        {rekapData.map((data) => (
    <div
      key={data.murid.id}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex justify-between items-center active:bg-gray-100 transition cursor-pointer"
        onClick={() => toggleCard(data.murid.id)}
      >
        <div>
          <p className="font-semibold text-slate-800 text-sm">{data.murid.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">NISN: {(data.murid as Murid).nisn || '-'}</p>
        </div>

        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-gray-600 transform transition-transform duration-300 ${
            openCard === data.murid.id ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expandable Content */}
      <div
  className={`${openCard === data.murid.id ? "block" : "hidden"} px-4 py-3`}
>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
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
            <p className="text-slate-700 text-lg font-bold">
              {data.totalIzin + data.totalSakit + data.totalBolos + data.totalDispen}
            </p>
          </div>
        </div>

        {/* Daily Grid */}
        <p className="text-xs font-semibold text-slate-700 mb-2">Detail Harian:</p>

        <div className="grid grid-cols-7 gap-1.5">
          {/* Header Hari */}
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((dayName, idx) => {
            const isWeekendDay = idx === 0 || idx === 6;
            return (
              <div
                key={`header-${idx}`}
                className={`text-center py-1 rounded text-[10px] font-semibold ${
                  isWeekendDay ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'
                } border border-slate-200`}
              >
                {dayName}
              </div>
            );
          })}

          {/* Spacer untuk hari pertama bulan */}
          {(() => {
            const firstDay = new Date(tahun, bulan - 1, 1).getDay();
            const spacers = [];
            for (let i = 0; i < firstDay; i++) {
              spacers.push(
                <div key={`spacer-${i}`} className="text-center py-1.5 rounded border border-slate-200 bg-transparent"></div>
              );
            }
            return spacers;
          })()}

          {/* Tanggal */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const status = data.absensiPerTanggal[day];
            const statusInfo = statusLabels[status] || statusLabels['-'];
            const isWknd = isWeekend(day, tahun, bulan);

            return (
              <div
                key={day}
                className={`text-center py-1.5 rounded font-semibold text-xs ${statusInfo.bgColor} ${statusInfo.color} ${
                  isWknd ? 'opacity-50' : ''
                } border border-slate-200`}
              >
                <div className="text-xs">{day}</div>
                <div className="font-bold">{status}</div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 mt-3">
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
  ))}
</div>


    </>
  );
};

export default RekapAbsenBulanTable;
