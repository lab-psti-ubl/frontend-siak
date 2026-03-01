import React, { useMemo } from 'react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Calendar, Clock, Eye, Download, FileJson } from 'lucide-react';
import { TahfizSchedule, SesiAbsensiTahfiz } from '../../../../../../types';
import { exportToExcel, exportToPDF } from '../../../../../../utils/exportUtils';
import { showSuccessToast, showErrorToast } from '../../../../../../components/ui/ToastContainer';
import { useLanguage } from '../../../../../../context/LanguageContext';
import { getDateLocale, getDayNames } from '../../../../../../utils/dateLocaleUtils';

interface PertemuanTahfizListViewProps {
  kelasId: string;
  jadwalId: string;
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  jadwalTahfiz: TahfizSchedule[];
  onViewAbsensi: (kelasId: string, jadwalId: string, sesiId: string) => void;
  selectedTahun: string;
}

const PertemuanTahfizListView: React.FC<PertemuanTahfizListViewProps> = ({
  kelasId,
  jadwalId,
  sesiAbsensiTahfiz,
  jadwalTahfiz,
  onViewAbsensi,
  selectedTahun,
}) => {
  const { language } = useLanguage();
  const dateLocale = getDateLocale(language);
  const hariNames: Record<string, string> = useMemo(() => {
    const dayNames = getDayNames(language);
    return {
      'minggu': dayNames[0],
      'senin': dayNames[1],
      'selasa': dayNames[2],
      'rabu': dayNames[3],
      'kamis': dayNames[4],
      'jumat': dayNames[5],
      'sabtu': dayNames[6],
    };
  }, [language]);

  const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);

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
    const startDate = new Date(`${selectedTahun}-01-01`);
    // End at end of selected year
    const endDate = new Date(`${selectedTahun}-12-31`);
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

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString(dateLocale, options);
  };

  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const totalMengajar = meetings.filter(m => m.status === 'mengajar').length;
  const totalTidakMengajar = meetings.filter(m => m.status === 'tidak_mengajar').length;

  const handleExportPertemuanToExcel = () => {
    try {
      const exportData = meetings.map((meeting, index) => ({
        nomor: index + 1,
        pertemuan: `P${meeting.pertemuanKe}`,
        tanggal: formatTanggalShort(meeting.tanggal),
        hari: meeting.hari,
        jam: `${meeting.jamMulai} - ${meeting.jamSelesai}`,
        status: meeting.status === 'mengajar' ? 'Guru Mengajar' : 'Tidak Mengajar'
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
      const filename = `Pertemuan_Tahfiz_${selectedTahun}_${timestamp}`;

      exportToExcel(exportData, columns, `Daftar Pertemuan Tahfiz`, filename);
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
        status: meeting.status === 'mengajar' ? 'Guru Mengajar' : 'Tidak Mengajar'
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
      const filename = `Pertemuan_Tahfiz_${selectedTahun}_${timestamp}`;

      exportToPDF(exportData, columns, `Daftar Pertemuan Tahfiz`, filename);
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
            Pertemuan akan muncul berdasarkan jadwal tahfiz
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
          variant="secondary"
          className="flex items-center justify-center gap-2 text-sm flex-1 sm:flex-initial bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
        >
          <Download size={16} />
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Total Pertemuan</span>
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">{meetings.length}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Sudah Mengajar</span>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{totalMengajar}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Tidak Mengajar</span>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-700">{totalTidakMengajar}</p>
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
              {meetings.map((meeting, index) => (
                <tr key={meeting.tanggal} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      P{meeting.pertemuanKe}
                    </span>
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-900">{formatTanggalShort(meeting.tanggal)}</td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600">{meeting.hari}</td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-600">
                    {meeting.jamMulai} - {meeting.jamSelesai}
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <Badge
                      variant={meeting.status === 'mengajar' ? 'success' : 'secondary'}
                      className="text-xs"
                    >
                      {meeting.status === 'mengajar' ? 'Sudah Mengajar' : 'Tidak Mengajar'}
                    </Badge>
                  </td>
                  <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                    <Button
                      onClick={() => {
                        // Use sesiId if exists, otherwise create virtual sesiId
                        const virtualSesiId = meeting.sesiId || `virtual-tahfiz-${meeting.tanggal}-${jadwalId}`;
                        onViewAbsensi(kelasId, jadwalId, virtualSesiId);
                      }}
                      variant="primary"
                      className="flex items-center text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg"
                    >
                      <Eye size={14} className="mr-1" />
                      Detail
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
        {meetings.map((meeting, index) => (
          <Card key={meeting.tanggal} className="border border-slate-200">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      P{meeting.pertemuanKe}
                    </span>
                    <Badge
                      variant={meeting.status === 'mengajar' ? 'success' : 'secondary'}
                      className="text-xs"
                    >
                      {meeting.status === 'mengajar' ? 'Sudah Mengajar' : 'Tidak Mengajar'}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatTanggal(meeting.tanggal)}</p>
                  <p className="text-xs text-slate-600 mt-1">{meeting.hari}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 mb-3 pb-3 border-b border-slate-200">
                <Clock className="w-4 h-4" />
                <span>{meeting.jamMulai} - {meeting.jamSelesai}</span>
              </div>
              <Button
                onClick={() => {
                  // Use sesiId if exists, otherwise create virtual sesiId
                  const virtualSesiId = meeting.sesiId || `virtual-tahfiz-${meeting.tanggal}-${jadwalId}`;
                  onViewAbsensi(kelasId, jadwalId, virtualSesiId);
                }}
                variant="primary"
                className="w-full flex items-center justify-center text-xs px-3 py-2 rounded-lg"
              >
                <Eye size={14} className="mr-1.5" />
                Lihat Detail Absensi
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PertemuanTahfizListView;

