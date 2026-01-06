import React from 'react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Calendar, Clock, Eye } from 'lucide-react';
import { JadwalPelajaran, SesiAbsensi, TahunAjaran, Absensi } from '../../../../../../types';
import { useAbsensi } from '../../../../../../hooks/useAbsensi';

interface PertemuanListViewProps {
  kelasId: string;
  mapelId: string;
  jadwalId: string;
  sesiAbsensi: SesiAbsensi[];
  tahunAjaran: TahunAjaran[];
  jadwalPelajaran: JadwalPelajaran[];
  onViewAbsensi: (mapelId: string, jadwalId: string, sesiId: string) => void;
  selectedTahunAjaran?: string;
  selectedSemester?: number;
}

const PertemuanListView: React.FC<PertemuanListViewProps> = ({
  kelasId,
  mapelId,
  jadwalId,
  sesiAbsensi,
  tahunAjaran,
  jadwalPelajaran,
  onViewAbsensi,
  selectedTahunAjaran,
  selectedSemester,
}) => {
  const { absensi } = useAbsensi();

  const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
  const activeTahunAjaran = tahunAjaran.find(
    ta => ta.tahun === jadwal?.tahunAjaran && ta.semester === jadwal?.semester
  );

  const isCurrentTahunAjaran = tahunAjaran.find(ta => ta.isActive);
  const isFilteringPreviousTahunAjaran = isCurrentTahunAjaran &&
    (selectedTahunAjaran !== isCurrentTahunAjaran.tahun || selectedSemester !== isCurrentTahunAjaran.semester);

  const generateAllMeetings = () => {
    if (!activeTahunAjaran || !jadwal) return [];

    const meetings: Array<{
      pertemuanKe: number;
      tanggal: string;
      hari: string;
      jamMulai: string;
      jamSelesai: string;
      status: 'mengajar' | 'tidak_mengajar' | 'guru_memberi_absen';
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

    const startDate = new Date(activeTahunAjaran.tanggalMulai);
    const endDate = new Date(activeTahunAjaran.tanggalSelesai);

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const actualEndDate = endDate < today ? endDate : today;

    const targetDay = hariToDay[jadwal.hari];
    let currentDate = new Date(startDate);

    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let pertemuanCounter = 1;
    while (currentDate <= actualEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const session = sesiAbsensi.find(s =>
        s.jadwalId === jadwal.id &&
        s.tanggal === dateStr &&
        s.status === 'ditutup'
      );

      const virtualSesiId = `virtual-${jadwal.id}-${dateStr}`;
      // Check for absensi in sesi.dataAbsensi first, then fallback to absensi collection
      const virtualSesi = sesiAbsensi.find(s => s.id === virtualSesiId);
      const hasAbsensi = (virtualSesi?.dataAbsensi && virtualSesi.dataAbsensi.length > 0) 
        || absensi.some(a => a.sesiId === virtualSesiId);

      if (session && !session.id.startsWith('virtual-')) {
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
          status: hasAbsensi ? 'guru_memberi_absen' : 'tidak_mengajar',
          sesiId: virtualSesiId,
        });
      }

      pertemuanCounter++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return meetings;
  };

  const meetings = generateAllMeetings();

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const totalMengajar = meetings.filter(m => m.status === 'mengajar').length;
  const totalGuruMemberiAbsen = meetings.filter(m => m.status === 'guru_memberi_absen').length;
  const totalTidakMengajar = meetings.filter(m => m.status === 'tidak_mengajar').length;

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{meetings.length}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Total Pertemuan</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{totalMengajar}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Guru Mengajar</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{totalGuruMemberiAbsen}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Guru Memberi Absen</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{totalTidakMengajar}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Guru Tidak Mengajar</p>
          </div>
        </Card>
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
              {meetings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 sm:px-6 py-8 sm:py-12 text-center">
                    <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
                    <p className="text-slate-600 font-medium text-sm sm:text-base">Belum ada pertemuan</p>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">
                      Pertemuan akan muncul berdasarkan kalender akademik
                    </p>
                  </td>
                </tr>
              ) : (
                meetings.map((meeting, index) => (
                  <tr key={`${meeting.tanggal}-${index}`} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">
                      {index + 1}
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 h-9 w-9 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900">
                          Pertemuan {meeting.pertemuanKe}
                        </p>
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
                      <div className="flex items-center text-xs sm:text-sm text-slate-900 gap-1">
                        <Clock size={14} className="text-blue-500 flex-shrink-0" />
                        {meeting.jamMulai} - {meeting.jamSelesai}
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {meeting.status === 'mengajar' ? (
                        <Badge variant="success" className="text-xs">Guru Mengajar</Badge>
                      ) : meeting.status === 'guru_memberi_absen' ? (
                        <Badge variant="warning" className="text-xs">Guru Memberi Absen</Badge>
                      ) : (
                        <Badge variant="error" className="text-xs">Guru Tidak Mengajar</Badge>
                      )}
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      {!(isFilteringPreviousTahunAjaran && meeting.status === 'tidak_mengajar') && (
                        <Button
                          onClick={() => {
                            const sesiIdToUse = meeting.sesiId || `virtual-${jadwalId}-${meeting.tanggal}`;
                            onViewAbsensi(mapelId, jadwalId, sesiIdToUse);
                          }}
                          variant="primary"
                          className="flex items-center justify-center text-xs px-2.5 py-1.5 rounded-lg"
                        >
                          <Eye size={13} className="mr-0.5" />
                          Lihat
                        </Button>
                      )}
                      {isFilteringPreviousTahunAjaran && meeting.status === 'tidak_mengajar' && (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {meetings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-900 mb-2">Belum ada pertemuan</h3>
              <p className="text-xs text-slate-500 text-center">
                Pertemuan akan muncul berdasarkan kalender akademik
              </p>
            </div>
          </div>
        ) : (
          meetings.map((meeting, index) => (
            <div key={`${meeting.tanggal}-${index}`} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-0.5">Pertemuan {meeting.pertemuanKe}</p>
                    <p className="text-sm font-bold text-slate-900">{meeting.hari},{formatTanggalShort(meeting.tanggal)}</p>
                    
                  </div>
                </div>

                <div className="space-y-2.5 mb-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-600">Jam</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {meeting.jamMulai} - {meeting.jamSelesai}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    {meeting.status === 'mengajar' ? (
                      <Badge variant="success" className="text-xs">Guru Mengajar</Badge>
                    ) : meeting.status === 'guru_memberi_absen' ? (
                      <Badge variant="warning" className="text-xs">Guru Memberi Absen</Badge>
                    ) : (
                      <Badge variant="error" className="text-xs">Guru Tidak Mengajar</Badge>
                    )}
                  </div>
                </div>

                {!(isFilteringPreviousTahunAjaran && meeting.status === 'tidak_mengajar') && (
                  <Button
                    onClick={() => {
                      const sesiIdToUse = meeting.sesiId || `virtual-${jadwalId}-${meeting.tanggal}`;
                      onViewAbsensi(mapelId, jadwalId, sesiIdToUse);
                    }}
                    variant="primary"
                    className="w-full flex items-center justify-center text-xs px-3 py-2 rounded-lg"
                  >
                    <Eye size={14} className="mr-1.5" />
                    Lihat Absensi
                  </Button>
                )}
                {isFilteringPreviousTahunAjaran && meeting.status === 'tidak_mengajar' && (
                  <div className="text-center py-2">
                    <span className="text-xs text-slate-400">-</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PertemuanListView;
