import React, { useMemo } from 'react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import Button from '../../../ui/Button';
import { Calendar, Clock, Download, Printer } from 'lucide-react';
import { JadwalPelajaran, SesiAbsensi, TahunAjaran, Absensi, User, Kelas, MataPelajaran, RiwayatKelasMurid, Murid } from '../../../../types';
import { exportPertemuanMuridToExcel, printPertemuanMurid } from './pertemuanMuridUtils';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../hooks/useSesiAbsensi';

interface PertemuanListViewProps {
  mapelId: string;
  jadwalId: string;
  sesiAbsensi: SesiAbsensi[];
  absensi: Absensi[];
  tahunAjaran: TahunAjaran[];
  jadwalPelajaran: JadwalPelajaran[];
  selectedTahunAjaran: string;
  selectedSemester: number;
  users: User[];
  kelas: Kelas[];
  mataPelajaran: MataPelajaran[];
  muridId: string;
  riwayatKelasMurid: RiwayatKelasMurid[];
  kelasId: string;
}

const PertemuanListView: React.FC<PertemuanListViewProps> = ({
  mapelId,
  jadwalId,
  sesiAbsensi: propSesiAbsensi,
  absensi: propAbsensi,
  tahunAjaran,
  jadwalPelajaran,
  selectedTahunAjaran,
  selectedSemester,
  users,
  kelas,
  mataPelajaran,
  muridId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  riwayatKelasMurid,
  kelasId,
}) => {
  const { absensi: hookAbsensi } = useAbsensi();
  const { sesiAbsensi: hookSesiAbsensi } = useSesiAbsensi();

  // Combine prop and hook data
  const absensi = useMemo(() => {
    const propIds = new Set(propAbsensi.map(a => a.id));
    const hookData = hookAbsensi.filter(a => !propIds.has(a.id));
    return [...propAbsensi, ...hookData];
  }, [propAbsensi, hookAbsensi]);

  const sesiAbsensi = useMemo(() => {
    const propIds = new Set(propSesiAbsensi.map(s => s.id));
    const hookData = hookSesiAbsensi.filter(s => !propIds.has(s.id));
    return [...propSesiAbsensi, ...hookData];
  }, [propSesiAbsensi, hookSesiAbsensi]);

  const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
  const activeTahunAjaran = tahunAjaran.find(
    ta => ta.tahun === jadwal?.tahunAjaran && ta.semester === jadwal?.semester
  );
  const mapelData = mataPelajaran.find(m => m.id === mapelId);
  const kelasData = kelas.find(k => k.id === kelasId);
  const guruData = users.find(u => u.id === jadwal?.guruId);
  const muridData = users.find(u => u.id === muridId) as Murid | undefined;

  const generateAllMeetings = () => {
    if (!activeTahunAjaran || !jadwal) return [];

    const meetings: Array<{
      pertemuanKe: number;
      tanggal: string;
      hari: string;
      jamMulai: string;
      jamSelesai: string;
      status: 'hadir' | 'izin' | 'sakit' | 'alfa' | 'guru_tidak_mengajar';
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
    // eslint-disable-next-line prefer-const
    let currentDate = new Date(startDate);

    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let pertemuanCounter = 1;
    while (currentDate <= actualEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const virtualSesiId = `virtual-${jadwal.id}-${dateStr}`;
      const session = sesiAbsensi.find(s =>
        (s.jadwalId === jadwal.id &&
        s.tanggal === dateStr &&
        s.status === 'ditutup') || s.id === virtualSesiId
      );

      const sesiIdToCheck = session?.id || virtualSesiId;
      
      // First, try to get from sesi.dataAbsensi (absensi pelajaran) - PRIMARY SOURCE
      let attendance = null;
      if (session?.dataAbsensi) {
        const absensiPelajaran = session.dataAbsensi.find(a => a.muridId === muridId);
        if (absensiPelajaran) {
          attendance = {
            status: absensiPelajaran.status,
            muridId: absensiPelajaran.muridId,
          };
        }
      }
      
      // Fallback to Absensi collection if not found in sesi.dataAbsensi
      if (!attendance) {
        const absensiFromCollection = absensi.find(
          a => a.muridId === muridId && a.sesiId === sesiIdToCheck
        );
        if (absensiFromCollection) {
          attendance = absensiFromCollection;
        }
      }

      let meetingStatus: 'hadir' | 'izin' | 'sakit' | 'alfa' | 'guru_tidak_mengajar' = 'guru_tidak_mengajar';

      if (attendance) {
        if (attendance.status === 'hadir') meetingStatus = 'hadir';
        else if (attendance.status === 'izin') meetingStatus = 'izin';
        else if (attendance.status === 'sakit') meetingStatus = 'sakit';
        else if (attendance.status === 'alfa') meetingStatus = 'alfa';
      } else if (session && !session.id.startsWith('virtual-')) {
        // Check if there's any absensi in sesi.dataAbsensi or absensi collection
        const hasAnyAbsensi = (session.dataAbsensi && session.dataAbsensi.length > 0) 
          || absensi.some(a => a.sesiId === sesiIdToCheck);
        if (hasAnyAbsensi) {
          meetingStatus = 'alfa';
        }
      }

      meetings.push({
        pertemuanKe: pertemuanCounter,
        tanggal: dateStr,
        hari: hariNames[jadwal.hari],
        jamMulai: jadwal.jamMulai,
        jamSelesai: jadwal.jamSelesai,
        status: meetingStatus,
        sesiId: sesiIdToCheck,
      });

      pertemuanCounter++;
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return meetings;
  };

  const meetings = generateAllMeetings();

  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const totalHadir = meetings.filter(m => m.status === 'hadir').length;
  const totalIzin = meetings.filter(m => m.status === 'izin').length;
  const totalSakit = meetings.filter(m => m.status === 'sakit').length;
  const totalAlfa = meetings.filter(m => m.status === 'alfa').length;

  const handleExportExcel = () => {
    exportPertemuanMuridToExcel(
      meetings,
      muridData?.name || '',
      muridData?.nisn || '',
      kelasData?.name || '',
      mapelData?.name || '',
      selectedTahunAjaran,
      selectedSemester === 1 ? 'Ganjil (1)' : 'Genap (2)',
      guruData?.name || ''
    );
  };

  const handlePrint = () => {
    printPertemuanMurid(
      meetings,
      muridData?.name || '',
      muridData?.nisn || '',
      kelasData?.name || '',
      mapelData?.name || '',
      selectedTahunAjaran,
      selectedSemester === 1 ? 'Ganjil (1)' : 'Genap (2)',
      guruData?.name || ''
    );
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-emerald-200 shadow-sm">
          <div className="text-center p-4 sm:p-5">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">{totalHadir}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Hadir</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl border border-amber-200 shadow-sm">
          <div className="text-center p-4 sm:p-5">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">{totalIzin}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Izin</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
          <div className="text-center p-4 sm:p-5">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{totalSakit}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Sakit</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm">
          <div className="text-center p-4 sm:p-5">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{totalAlfa}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Alfa</p>
          </div>
        </Card>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Daftar Pertemuan</h3>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                onClick={handleExportExcel}
                variant="primary"
                className="flex items-center justify-center text-xs sm:text-sm flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              >
                <Download size={14} className="sm:mr-1" />
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Excel</span>
              </Button>
              <Button
                onClick={handlePrint}
                variant="primary"
                className="flex items-center justify-center text-xs sm:text-sm flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <Printer size={14} className="sm:mr-1" />
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
            </div>
          </div>

          {/* Desktop/Tablet Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
                <tr>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Pertemuan</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tanggal</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Hari</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Jam</th>
                  <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {meetings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 sm:px-6 py-8 sm:py-12 text-center">
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
                        {meeting.status === 'hadir' ? (
                          <Badge variant="success" size="sm">Hadir</Badge>
                        ) : meeting.status === 'izin' ? (
                          <Badge variant="warning" size="sm">Izin</Badge>
                        ) : meeting.status === 'sakit' ? (
                          <Badge variant="info" size="sm">Sakit</Badge>
                        ) : meeting.status === 'alfa' ? (
                          <Badge variant="danger" size="sm">Alfa</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">Guru Tidak Mengajar</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                        <p className="text-sm font-bold text-slate-900">{meeting.hari}, {formatTanggalShort(meeting.tanggal)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">#{index + 1}</p>
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

                    <div className="flex items-center justify-between">
                      <div>
                        {meeting.status === 'hadir' ? (
                          <Badge variant="success" size="sm">Hadir</Badge>
                        ) : meeting.status === 'izin' ? (
                          <Badge variant="warning" size="sm">Izin</Badge>
                        ) : meeting.status === 'sakit' ? (
                          <Badge variant="info" size="sm">Sakit</Badge>
                        ) : meeting.status === 'alfa' ? (
                          <Badge variant="danger" size="sm">Alfa</Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">Guru Tidak Mengajar</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PertemuanListView;
