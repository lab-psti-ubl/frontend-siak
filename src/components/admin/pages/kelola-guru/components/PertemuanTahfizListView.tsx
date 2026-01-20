import React, { useMemo } from 'react';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { Calendar, Clock, Eye } from 'lucide-react';
import { SesiAbsensiTahfiz, TahfizSchedule } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';

interface PertemuanTahfizListViewProps {
  kelasId: string;
  jadwalId: string;
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  jadwalTahfiz: TahfizSchedule[];
  kelasTahfiz: TahfizClass[];
  selectedYear: string;
  onViewAbsensi: (kelasId: string, jadwalId: string, sesiId: string) => void;
}

const PertemuanTahfizListView: React.FC<PertemuanTahfizListViewProps> = ({
  kelasId,
  jadwalId,
  sesiAbsensiTahfiz,
  jadwalTahfiz,
  kelasTahfiz,
  selectedYear,
  onViewAbsensi
}) => {
  const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
  const kelas = kelasTahfiz.find(k => k.id === kelasId);

  const generateAllMeetings = () => {
    if (!jadwal) return [];

    const meetings: Array<{
      pertemuanKe: number;
      tanggal: string;
      hari: string;
      jamMulai: string;
      jamSelesai: string;
      status: 'mengajar' | 'tidak_mengajar';
      sesiId?: string;
    }> = [];

    const hariNames: Record<string, string> = {
      'senin': 'Senin',
      'selasa': 'Selasa',
      'rabu': 'Rabu',
      'kamis': 'Kamis',
      'jumat': 'Jumat',
      'sabtu': 'Sabtu',
      'minggu': 'Minggu',
    };

    const hariToDay: Record<string, number> = {
      'minggu': 0,
      'senin': 1,
      'selasa': 2,
      'rabu': 3,
      'kamis': 4,
      'jumat': 5,
      'sabtu': 6,
    };

    // Start from beginning of selected year
    const startDate = new Date(`${selectedYear}-01-01`);
    // End at end of selected year
    const endDate = new Date(`${selectedYear}-12-31`);
    endDate.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const actualEndDate = endDate < today ? endDate : today;

    const targetDay = hariToDay[jadwal.hari];
    let currentDate = new Date(startDate);

    // Find first occurrence of target day
    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let pertemuanCounter = 1;
    while (currentDate <= actualEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const session = sesiAbsensiTahfiz.find(s =>
        s.jadwalId === jadwal.id &&
        s.tanggal === dateStr &&
        s.status === 'ditutup'
      );

      if (session) {
        meetings.push({
          pertemuanKe: pertemuanCounter,
          tanggal: dateStr,
          hari: hariNames[jadwal.hari],
          jamMulai: jadwal.jamMulai,
          jamSelesai: jadwal.jamSelesai,
          status: 'mengajar',
          sesiId: session.id,
        });
      } else {
        meetings.push({
          pertemuanKe: pertemuanCounter,
          tanggal: dateStr,
          hari: hariNames[jadwal.hari],
          jamMulai: jadwal.jamMulai,
          jamSelesai: jadwal.jamSelesai,
          status: 'tidak_mengajar',
        });
      }

      pertemuanCounter++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return meetings;
  };

  const meetings = generateAllMeetings();
  const filteredMeetings = meetings;

  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const totalMengajar = filteredMeetings.filter(m => m.status === 'mengajar').length;
  const totalTidakMengajar = filteredMeetings.filter(m => m.status === 'tidak_mengajar').length;

  if (filteredMeetings.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Belum ada pertemuan</h3>
          <p className="text-xs sm:text-sm text-slate-600 text-center">
            Pertemuan akan muncul berdasarkan kalender akademik
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">Total Pertemuan</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">{filteredMeetings.length}</p>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-500 rounded-lg sm:rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">Ustadz Mengajar</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">{totalMengajar}</p>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-emerald-500 rounded-lg sm:rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">Tidak Mengajar</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">{totalTidakMengajar}</p>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-red-500 rounded-lg sm:rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">Kelas</p>
              <div className="flex items-end justify-between">
                <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{kelas?.namaKelas || '-'}</p>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-indigo-500 rounded-lg sm:rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
              <tr>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Pertemuan</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tanggal</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Hari</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Jam</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredMeetings.map((meeting, index) => (
                <tr key={`${meeting.tanggal}-${index}`} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">Pertemuan {meeting.pertemuanKe}</p>
                    </div>
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className="text-xs sm:text-sm text-slate-900 font-medium">
                      {formatTanggalShort(meeting.tanggal)}
                    </span>
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900 capitalize font-medium">
                    {meeting.hari}
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-900">
                      <Clock size={14} className="text-slate-400 flex-shrink-0" />
                      {meeting.jamMulai} - {meeting.jamSelesai}
                    </div>
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {meeting.status === 'mengajar' ? (
                      <Badge variant="success" size="sm">Ustadz Mengajar</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">Tidak Mengajar</Badge>
                    )}
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                    <Button
                      onClick={() => {
                        // Use sesiId if exists, otherwise create virtual sesiId
                        const virtualSesiId = meeting.sesiId || `virtual-tahfiz-${meeting.tanggal}-${jadwalId}`;
                        onViewAbsensi(kelasId, jadwalId, virtualSesiId);
                      }}
                      variant="primary"
                      className="flex items-center text-xs px-2.5 py-1.5 rounded-lg mx-auto"
                    >
                      <Eye size={13} className="mr-0.5" />
                      Lihat
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {filteredMeetings.map((meeting, index) => (
          <div key={`${meeting.tanggal}-${index}`} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">Pertemuan {meeting.pertemuanKe}</p>
                  <p className="text-xs text-slate-500 mt-0.5">#{index + 1}</p>
                </div>
              </div>

              <div className="space-y-2 mb-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-500 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-slate-900 font-medium">
                    {meeting.hari}, {formatTanggalShort(meeting.tanggal)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-500 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-slate-900 font-medium">
                    {meeting.jamMulai} - {meeting.jamSelesai}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                {meeting.status === 'mengajar' ? (
                  <Badge variant="success" size="sm">Ustadz Mengajar</Badge>
                ) : (
                  <Badge variant="danger" size="sm">Tidak Mengajar</Badge>
                )}
              </div>

              <Button
                onClick={() => {
                  // Use sesiId if exists, otherwise create virtual sesiId
                  const virtualSesiId = meeting.sesiId || `virtual-tahfiz-${meeting.tanggal}-${jadwalId}`;
                  onViewAbsensi(kelasId, jadwalId, virtualSesiId);
                }}
                variant="primary"
                className="w-full flex items-center justify-center text-xs px-3 py-2.5 rounded-lg"
              >
                <Eye size={14} className="mr-1.5" />
                Lihat Absensi
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PertemuanTahfizListView;

