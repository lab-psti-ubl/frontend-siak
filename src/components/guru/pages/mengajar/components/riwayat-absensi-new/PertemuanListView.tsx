import React from 'react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Calendar, Clock, Eye, Download, FileJson } from 'lucide-react';
import { JadwalPelajaran, SesiAbsensi, TahunAjaran, Absensi } from '../../../../../../types';
import { useAbsensi } from '../../../../../../hooks/useAbsensi';
import { exportToExcel, exportToPDF } from '../../../../../../utils/exportUtils';
import { showSuccessToast, showErrorToast } from '../../../../../../components/ui/ToastContainer';

interface PertemuanListViewProps {
  kelasId: string;
  mapelId: string;
  jadwalId: string;
  sesiAbsensi: SesiAbsensi[];
  tahunAjaran: TahunAjaran[];
  jadwalPelajaran: JadwalPelajaran[];
  onViewAbsensi: (kelasId: string, mapelId: string, jadwalId: string, sesiId: string) => void;
  isAdminView?: boolean;
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
  isAdminView = false,
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
      const hasAbsensi = absensi.some(a => a.sesiId === virtualSesiId);

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

  const handleExportPertemuanToExcel = () => {
    try {
      const exportData = meetings.map((meeting, index) => ({
        nomor: index + 1,
        pertemuan: `P${meeting.pertemuanKe}`,
        tanggal: formatTanggalShort(meeting.tanggal),
        hari: meeting.hari,
        jam: `${meeting.jamMulai} - ${meeting.jamSelesai}`,
        status: meeting.status === 'mengajar' ? 'Guru Mengajar' : meeting.status === 'guru_memberi_absen' ? 'Memberi Absen' : 'Tidak Mengajar'
      }));

      const columns = [
        { header: 'No', dataKey: 'nomor', width: 8 },
        { header: 'Pertemuan', dataKey: 'pertemuan', width: 12 },
        { header: 'Tanggal', dataKey: 'tanggal', width: 15 },
        { header: 'Hari', dataKey: 'hari', width: 12 },
        { header: 'Jam', dataKey: 'jam', width: 18 },
        { header: 'Status', dataKey: 'status', width: 18 }
      ];

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Pertemuan_${jadwal?.mataPelajaran || 'Mapel'}_${timestamp}`;

      exportToExcel(exportData, columns, `Daftar Pertemuan Pembelajaran`, filename);
      showSuccessToast('Berhasil', `Data pertemuan berhasil diexport ke Excel`);
    } catch (error) {
      showErrorToast('Gagal', 'Gagal mengexport data ke Excel');
      console.error('Export Excel error:', error);
    }
  };

  const handleExportPertemuanToPDF = () => {
    try {
      const exportData = meetings.map((meeting, index) => ({
        nomor: index + 1,
        pertemuan: `P${meeting.pertemuanKe}`,
        tanggal: formatTanggalShort(meeting.tanggal),
        hari: meeting.hari,
        jam: `${meeting.jamMulai} - ${meeting.jamSelesai}`,
        status: meeting.status === 'mengajar' ? 'Guru Mengajar' : meeting.status === 'guru_memberi_absen' ? 'Memberi Absen' : 'Tidak Mengajar'
      }));

      const columns = [
        { header: 'No', dataKey: 'nomor', width: 8 },
        { header: 'Pertemuan', dataKey: 'pertemuan', width: 12 },
        { header: 'Tanggal', dataKey: 'tanggal', width: 15 },
        { header: 'Hari', dataKey: 'hari', width: 12 },
        { header: 'Jam', dataKey: 'jam', width: 18 },
        { header: 'Status', dataKey: 'status', width: 18 }
      ];

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Pertemuan_${jadwal?.mataPelajaran || 'Mapel'}_${timestamp}`;

      exportToPDF(exportData, columns, `Daftar Pertemuan Pembelajaran`, filename);
      showSuccessToast('Berhasil', `Data pertemuan berhasil diexport ke PDF`);
    } catch (error) {
      showErrorToast('Gagal', 'Gagal mengexport data ke PDF');
      console.error('Export PDF error:', error);
    }
  };

  if (meetings.length === 0) {
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Button
          onClick={handleExportPertemuanToExcel}
          variant="primary"
          className="flex items-center justify-center gap-2 text-sm flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700"
        >
          <FileJson size={16} />
          Export Excel
        </Button>
        <Button
          onClick={handleExportPertemuanToPDF}
          variant="primary"
          className="flex items-center justify-center gap-2 text-sm flex-1 sm:flex-initial bg-red-600 hover:bg-red-700"
        >
          <Download size={16} />
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="group bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">Total Pertemuan</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">{meetings.length}</p>
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
              <p className="text-xs sm:text-sm text-slate-600 font-medium">Guru Mengajar</p>
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
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm text-slate-600 font-medium">Memberi Absen</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">{totalGuruMemberiAbsen}</p>
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-amber-500 rounded-lg sm:rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
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
              {meetings.map((meeting, index) => (
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
                      <Badge variant="success" className="text-xs">Guru Mengajar</Badge>
                    ) : meeting.status === 'guru_memberi_absen' ? (
                      <Badge variant="warning" className="text-xs">Memberi Absen</Badge>
                    ) : (
                      <Badge variant="danger" className="text-xs">Tidak Mengajar</Badge>
                    )}
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                    {!(isFilteringPreviousTahunAjaran && meeting.status === 'tidak_mengajar') && (
                      <Button
                        onClick={() => {
                          const sesiIdToUse = meeting.sesiId || `virtual-${jadwalId}-${meeting.tanggal}`;
                          onViewAbsensi(kelasId, mapelId, jadwalId, sesiIdToUse);
                        }}
                        variant="primary"
                        className="flex items-center text-xs px-2.5 py-1.5 rounded-lg mx-auto"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {meetings.map((meeting, index) => (
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
                  <Badge variant="success" className="text-xs">Guru Mengajar</Badge>
                ) : meeting.status === 'guru_memberi_absen' ? (
                  <Badge variant="warning" className="text-xs">Memberi Absen</Badge>
                ) : (
                  <Badge variant="danger" className="text-xs">Tidak Mengajar</Badge>
                )}
              </div>

              {!(isFilteringPreviousTahunAjaran && meeting.status === 'tidak_mengajar') && (
                <Button
                  onClick={() => {
                    const sesiIdToUse = meeting.sesiId || `virtual-${jadwalId}-${meeting.tanggal}`;
                    onViewAbsensi(kelasId, mapelId, jadwalId, sesiIdToUse);
                  }}
                  variant="primary"
                  className="w-full flex items-center justify-center text-xs px-3 py-2.5 rounded-lg"
                >
                  <Eye size={14} className="mr-1.5" />
                  Lihat Absensi
                </Button>
              )}
              {isFilteringPreviousTahunAjaran && meeting.status === 'tidak_mengajar' && (
                <div className="text-xs text-slate-400 text-center py-2">-</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PertemuanListView;
