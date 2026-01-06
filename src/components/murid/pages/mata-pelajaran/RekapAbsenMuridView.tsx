import React, { useState } from 'react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Download, Printer, Calendar, BookOpen, GraduationCap, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { JadwalPelajaran, SesiAbsensi, Absensi, User, Kelas, MataPelajaran, TahunAjaran, RiwayatKelasMurid, RiwayatWaliKelas } from '../../../../types';
import { generateRekapAbsenMuridData, exportRekapAbsenMuridToExcel, printRekapAbsenMurid } from './rekapAbsenMuridUtils';

interface RekapAbsenMuridViewProps {
  muridId: string;
  kelasId: string;
  tahunAjaran: string;
  semester: number;
  sesiAbsensi: SesiAbsensi[];
  absensi: Absensi[];
  users: User[];
  kelas: Kelas;
  mataPelajaran: MataPelajaran[];
  tahunAjaranList: TahunAjaran[];
  jadwalPelajaran: JadwalPelajaran[];
  riwayatKelasMurid?: RiwayatKelasMurid[];
  riwayatWaliKelas?: RiwayatWaliKelas[];
}

const RekapAbsenMuridView: React.FC<RekapAbsenMuridViewProps> = ({
  muridId,
  kelasId,
  tahunAjaran,
  semester,
  sesiAbsensi,
  absensi,
  users,
  kelas,
  mataPelajaran,
  tahunAjaranList,
  jadwalPelajaran,
  riwayatKelasMurid = [],
  riwayatWaliKelas = [],
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [expandedMapelId, setExpandedMapelId] = useState<string | null>(null);

  const rekapData = generateRekapAbsenMuridData(
    muridId,
    kelasId,
    tahunAjaran,
    semester,
    sesiAbsensi,
    absensi,
    users,
    jadwalPelajaran,
    tahunAjaranList,
    mataPelajaran,
    kelas,
    riwayatKelasMurid,
    riwayatWaliKelas
  );

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportRekapAbsenMuridToExcel(rekapData);
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    printRekapAbsenMurid(rekapData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'H':
        return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700 font-bold text-sm">H</span>;
      case 'A':
        return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold text-sm">A</span>;
      case 'I':
        return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 text-yellow-700 font-bold text-sm">I</span>;
      case 'S':
        return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm">S</span>;
      case '-':
        return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-400 font-bold text-sm">-</span>;
      default:
        return <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-400 font-bold text-sm">-</span>;
    }
  };

  const groupedByMapel: { [mapelId: string]: typeof rekapData.mapelMeetings } = {};
  rekapData.mapelMeetings.forEach(meeting => {
    if (!groupedByMapel[meeting.mapelId]) {
      groupedByMapel[meeting.mapelId] = [];
    }
    groupedByMapel[meeting.mapelId].push(meeting);
  });

  // Urutkan pertemuan untuk setiap mata pelajaran berdasarkan pertemuanKe
  Object.keys(groupedByMapel).forEach(mapelId => {
    groupedByMapel[mapelId].sort((a, b) => a.pertemuanKe - b.pertemuanKe);
  });

  // Hitung maxPertemuan berdasarkan pertemuanKe maksimum yang sebenarnya ada
  const maxPertemuan = Math.max(
    ...Object.values(groupedByMapel).map(meetings => {
      // Ambil pertemuanKe maksimum dari meetings yang ada
      return Math.max(...meetings.map(m => m.pertemuanKe), 0);
    }),
    0
  );

  const totalHadir = Object.values(rekapData.attendanceMatrix).filter(s => s === 'H').length;
  const totalAlfa = Object.values(rekapData.attendanceMatrix).filter(s => s === 'A').length;
  const totalIzin = Object.values(rekapData.attendanceMatrix).filter(s => s === 'I').length;
  const totalSakit = Object.values(rekapData.attendanceMatrix).filter(s => s === 'S').length;

  const toggleExpand = (mapelId: string) => {
    setExpandedMapelId(expandedMapelId === mapelId ? null : mapelId);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">Rekap Absensi Mata Pelajaran</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Semua mata pelajaran dalam satu semester
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={handlePrint}
                variant="secondary"
                className="flex items-center justify-center text-xs sm:text-sm px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-lg"
              >
                <Printer size={14} className="sm:mr-2" />
                <span className="hidden sm:inline">Cetak</span>
                <span className="sm:hidden">Cetak</span>
              </Button>
              <Button
                onClick={handleExportExcel}
                disabled={isExporting}
                variant="primary"
                className="flex items-center justify-center text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg"
              >
                <Download size={14} className="sm:mr-2" />
                {isExporting ? 'Mengekspor...' : <span className="hidden sm:inline">Export Excel</span>}
                {!isExporting && <span className="sm:hidden">Export</span>}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-blue-200">
            <div className="space-y-2">
              <div className="flex items-center">
                <UserIcon size={14} className="sm:w-4 sm:h-4 mr-2 text-blue-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-slate-600">Nama:</span>
                <span className="ml-2 font-semibold text-xs sm:text-sm text-slate-900 truncate">
                  {rekapData.muridInfo.name}
                </span>
              </div>
              <div className="flex items-center">
                <GraduationCap size={14} className="sm:w-4 sm:h-4 mr-2 text-blue-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-slate-600">NISN:</span>
                <span className="ml-2 font-semibold text-xs sm:text-sm text-slate-900">
                  {rekapData.muridInfo.nisn}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <BookOpen size={14} className="sm:w-4 sm:h-4 mr-2 text-blue-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-slate-600">Kelas:</span>
                <span className="ml-2 font-semibold text-xs sm:text-sm text-slate-900">
                  {rekapData.muridInfo.kelas}
                </span>
              </div>
              <div className="flex items-center">
                <UserIcon size={14} className="sm:w-4 sm:h-4 mr-2 text-blue-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-slate-600">Wali Kelas:</span>
                <span className="ml-2 font-semibold text-xs sm:text-sm text-slate-900 truncate">
                  {rekapData.muridInfo.waliKelas}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-blue-200">
            <div className="flex items-center">
              <Calendar size={14} className="sm:w-4 sm:h-4 mr-2 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-slate-600">Tahun Ajaran:</span>
              <span className="ml-2 font-semibold text-xs sm:text-sm text-slate-900">
                {rekapData.tahunAjaran}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar size={14} className="sm:w-4 sm:h-4 mr-2 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-slate-600">Semester:</span>
              <span className="ml-2 font-semibold text-xs sm:text-sm text-slate-900">
                {semester === 1 ? 'Ganjil (1)' : 'Genap (2)'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border border-emerald-200 shadow-sm">
          <div className="text-center p-4 sm:p-5">
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{totalHadir}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Total Hadir</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm">
          <div className="text-center p-4 sm:p-5">
            <p className="text-xl sm:text-2xl font-bold text-red-600">{totalAlfa}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Total Alfa</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl border border-amber-200 shadow-sm">
          <div className="text-center p-4 sm:p-5">
            <p className="text-xl sm:text-2xl font-bold text-amber-600">{totalIzin}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Total Izin</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
          <div className="text-center p-4 sm:p-5">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalSakit}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Total Sakit</p>
          </div>
        </Card>
      </div>

      <Card className="rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-2">Rekap Kehadiran</h3>
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
            {[
              { label: 'H', bg: 'bg-emerald-100', text: 'text-emerald-700', title: 'Hadir' },
              { label: 'A', bg: 'bg-red-100', text: 'text-red-700', title: 'Alfa' },
              { label: 'I', bg: 'bg-amber-100', text: 'text-amber-700', title: 'Izin' },
              { label: 'S', bg: 'bg-blue-100', text: 'text-blue-700', title: 'Sakit' },
              { label: '-', bg: 'bg-slate-100', text: 'text-slate-400', title: 'Tidak Ada Absen' },
            ].map(({ label, bg, text, title }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded font-bold text-xs ${bg} ${text}`}>
                  {label}
                </span>
                <span className="text-slate-600">{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop/Tablet Table View */}
        <div className="hidden md:block overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border-t border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <tr>
                    <th className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-cyan-50 border-r border-slate-300">
                      No
                    </th>
                    <th className="sticky left-12 z-10 px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-cyan-50 border-r border-slate-300 min-w-[120px]">
                      Kode Mapel
                    </th>
                    <th className="sticky left-[168px] z-10 px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-cyan-50 border-r border-slate-300 min-w-[250px]">
                      Nama Mapel
                    </th>
                    {Array.from({ length: maxPertemuan }, (_, i) => (
                      <th
                        key={`pertemuan-${i + 1}`}
                        className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider border-l border-slate-200"
                      >
                        <span className="font-bold text-blue-600">{i + 1}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {Object.keys(groupedByMapel).length === 0 ? (
                    <tr>
                      <td
                        colSpan={3 + maxPertemuan}
                        className="px-6 py-12 text-center"
                      >
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 font-medium text-lg">Tidak ada data mata pelajaran</p>
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedByMapel).map(([mapelId, meetings], idx) => (
                      <tr key={mapelId} className="hover:bg-slate-50 transition-colors">
                        <td className="sticky left-0 z-10 px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 bg-white border-r border-slate-300">
                          {idx + 1}
                        </td>
                        <td className="sticky left-12 z-10 px-6 py-4 whitespace-nowrap bg-white border-r border-slate-300">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm font-bold border border-blue-200">
                            {meetings[0].mapelCode}
                          </span>
                        </td>
                        <td className="sticky left-[168px] z-10 px-6 py-4 bg-white border-r border-slate-300">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div className="ml-3 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{meetings[0].mapelName}</p>
                            </div>
                          </div>
                        </td>
                        {Array.from({ length: maxPertemuan }, (_, i) => {
                          const meeting = meetings.find(m => m.pertemuanKe === i + 1);
                          const meetingKey = meeting ? `${meeting.mapelCode}-${meeting.pertemuanKe}` : '';
                          const status = meetingKey ? rekapData.attendanceMatrix[meetingKey] : '-';
                          return (
                            <td
                              key={`cell-${idx}-${i}`}
                              className="px-4 py-4 text-center border-l border-slate-200"
                            >
                              {getStatusBadge(status || '-')}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-4">
          {Object.keys(groupedByMapel).length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-medium text-sm">Tidak ada data mata pelajaran</p>
            </div>
          ) : (
            Object.entries(groupedByMapel).map(([mapelId, meetings], idx) => {
              const isExpanded = expandedMapelId === mapelId;
              
              // Calculate stats for this mapel
              const mapelStats = {
                hadir: meetings.filter(m => {
                  const key = `${m.mapelCode}-${m.pertemuanKe}`;
                  return rekapData.attendanceMatrix[key] === 'H';
                }).length,
                alfa: meetings.filter(m => {
                  const key = `${m.mapelCode}-${m.pertemuanKe}`;
                  return rekapData.attendanceMatrix[key] === 'A';
                }).length,
                izin: meetings.filter(m => {
                  const key = `${m.mapelCode}-${m.pertemuanKe}`;
                  return rekapData.attendanceMatrix[key] === 'I';
                }).length,
                sakit: meetings.filter(m => {
                  const key = `${m.mapelCode}-${m.pertemuanKe}`;
                  return rekapData.attendanceMatrix[key] === 'S';
                }).length,
              };

              return (
                <div
                  key={mapelId}
                  className="bg-gradient-to-br from-slate-50 to-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleExpand(mapelId)}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-blue-50 duration-150"
                  >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="overflow-hidden text-left flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                            {meetings[0].mapelCode}
                          </span>
                          <p className="text-xs text-slate-500">#{idx + 1}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900 truncate">{meetings[0].mapelName}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 p-4 space-y-4 bg-white">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                          <p className="text-xs text-emerald-600 font-semibold mb-1">Hadir</p>
                          <p className="text-xl font-bold text-emerald-700">{mapelStats.hadir}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <p className="text-xs text-red-600 font-semibold mb-1">Alfa</p>
                          <p className="text-xl font-bold text-red-700">{mapelStats.alfa}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <p className="text-xs text-amber-600 font-semibold mb-1">Izin</p>
                          <p className="text-xl font-bold text-amber-700">{mapelStats.izin}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-blue-600 font-semibold mb-1">Sakit</p>
                          <p className="text-xl font-bold text-blue-700">{mapelStats.sakit}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <p className="text-xs font-semibold text-slate-700 mb-3">Detail Pertemuan</p>
                        <div className="space-y-2">
                          {meetings.map((meeting) => {
                            const meetingKey = `${meeting.mapelCode}-${meeting.pertemuanKe}`;
                            const status = rekapData.attendanceMatrix[meetingKey] || '-';
                            return (
                              <div
                                key={meetingKey}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-600">Pertemuan {meeting.pertemuanKe}</span>
                                </div>
                                {getStatusBadge(status)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {Object.keys(groupedByMapel).length === 0 && (
          <div className="mt-8 text-center py-12 px-4">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium text-base sm:text-lg">Belum ada data rekap absensi</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Data akan muncul setelah ada jadwal mata pelajaran
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RekapAbsenMuridView;
