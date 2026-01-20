import React, { useState, useEffect } from 'react';
import Card from '../../../../ui/Card';
import { User, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { RekapAbsenTahfizData } from '../utils/rekapAbsenTahfizUtils';

interface RekapAbsenTahfizTableProps {
  rekapData: RekapAbsenTahfizData;
}

const RekapAbsenTahfizTable: React.FC<RekapAbsenTahfizTableProps> = ({ rekapData }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'H': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Hadir' },
      'A': { bg: 'bg-red-100', text: 'text-red-700', label: 'Alfa' },
      'I': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Izin' },
      'S': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sakit' },
      '-': { bg: 'bg-slate-100', text: 'text-slate-400', label: 'Tidak Ada' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['-'];

    return (
      <div className={`inline-flex items-center justify-center min-w-12 px-2 py-1 rounded-md font-semibold text-xs border ${config.bg} ${config.text}`}>
        {status}
      </div>
    );
  };

  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const toggleExpand = (studentId: string) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  // Mobile View
  if (isMobile) {
    return (
      <Card>
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-900 mb-2">Rekap Kehadiran Santri</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { label: 'H', bg: 'bg-emerald-100', text: 'text-emerald-700', title: 'Hadir' },
              { label: 'A', bg: 'bg-red-100', text: 'text-red-700', title: 'Alfa' },
              { label: 'I', bg: 'bg-amber-100', text: 'text-amber-700', title: 'Izin' },
              { label: 'S', bg: 'bg-blue-100', text: 'text-blue-700', title: 'Sakit' },
            ].map(({ label, bg, text, title }) => (
              <div key={label} className="flex items-center gap-1">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-bold text-xs ${bg} ${text}`}>
                  {label}
                </span>
                <span className="text-slate-600">{title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {rekapData.students.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-medium text-sm">Tidak ada data santri</p>
            </div>
          ) : (
            rekapData.students.map((student) => {
              const isExpanded = expandedStudentId === student.id;

              const attendanceStats = {
                hadir: rekapData.meetings.filter(
                  m => rekapData.attendanceMatrix[student.id]?.[m.sesiId || ''] === 'H'
                ).length,
                alfa: rekapData.meetings.filter(
                  m => rekapData.attendanceMatrix[student.id]?.[m.sesiId || ''] === 'A'
                ).length,
                izin: rekapData.meetings.filter(
                  m => rekapData.attendanceMatrix[student.id]?.[m.sesiId || ''] === 'I'
                ).length,
                sakit: rekapData.meetings.filter(
                  m => rekapData.attendanceMatrix[student.id]?.[m.sesiId || ''] === 'S'
                ).length,
              };

              const total = attendanceStats.hadir + attendanceStats.alfa + attendanceStats.izin + attendanceStats.sakit;

              return (
                <div key={student.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div
                    className="bg-white p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{student.name}</p>
                        <p className="text-xs text-slate-500 mt-1">NISN: {student.nisn || '-'}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{total}</p>
                          <p className="text-xs text-slate-500">Total</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          <div className="text-center">
                            <p className="text-lg font-bold text-emerald-600">{attendanceStats.hadir}</p>
                            <p className="text-xs text-slate-600">Hadir</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-red-600">{attendanceStats.alfa}</p>
                            <p className="text-xs text-slate-600">Alfa</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-amber-600">{attendanceStats.izin}</p>
                            <p className="text-xs text-slate-600">Izin</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">{attendanceStats.sakit}</p>
                            <p className="text-xs text-slate-600">Sakit</p>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {rekapData.meetings.map((meeting) => {
                            const status = rekapData.attendanceMatrix[student.id]?.[meeting.sesiId || ''] || '-';
                            return (
                              <div key={meeting.sesiId || meeting.tanggal} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-slate-900">
                                    P{meeting.pertemuanKe} - {formatTanggalShort(meeting.tanggal)}
                                  </p>
                                  <p className="text-xs text-slate-500">{meeting.hari} {meeting.jamMulai}-{meeting.jamSelesai}</p>
                                </div>
                                {getStatusBadge(status)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    );
  }

  // Desktop View
  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-900 mb-2">Rekap Kehadiran Santri</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { label: 'H', bg: 'bg-emerald-100', text: 'text-emerald-700', title: 'Hadir' },
            { label: 'A', bg: 'bg-red-100', text: 'text-red-700', title: 'Alfa' },
            { label: 'I', bg: 'bg-amber-100', text: 'text-amber-700', title: 'Izin' },
            { label: 'S', bg: 'bg-blue-100', text: 'text-blue-700', title: 'Sakit' },
          ].map(({ label, bg, text, title }) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-bold text-xs ${bg} ${text}`}>
                {label}
              </span>
              <span className="text-slate-600">{title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-50 to-slate-50 border-b-2 border-blue-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider sticky left-0 z-10 bg-blue-50 border-r">No</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider sticky left-12 z-10 bg-blue-50 border-r">Nama Santri</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider sticky left-48 z-10 bg-blue-50 border-r">NISN</th>
              {rekapData.meetings.map((meeting) => (
                <th
                  key={meeting.sesiId || meeting.tanggal}
                  className="px-2 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-12"
                  title={`Pertemuan ${meeting.pertemuanKe} - ${formatTanggalShort(meeting.tanggal)}`}
                >
                  P{meeting.pertemuanKe}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Hadir</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Alfa</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Izin</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Sakit</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {rekapData.students.length === 0 ? (
              <tr>
                <td colSpan={4 + rekapData.meetings.length + 5} className="px-4 py-12 text-center">
                  <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 font-medium text-sm">Tidak ada data santri</p>
                </td>
              </tr>
            ) : (
              rekapData.students.map((student, index) => {
                const attendanceStats = {
                  hadir: rekapData.meetings.filter(
                    m => rekapData.attendanceMatrix[student.id]?.[m.sesiId || ''] === 'H'
                  ).length,
                  alfa: rekapData.meetings.filter(
                    m => rekapData.attendanceMatrix[student.id]?.[m.sesiId || ''] === 'A'
                  ).length,
                  izin: rekapData.meetings.filter(
                    m => rekapData.attendanceMatrix[student.id]?.[m.sesiId || ''] === 'I'
                  ).length,
                  sakit: rekapData.meetings.filter(
                    m => rekapData.attendanceMatrix[student.id]?.[m.sesiId || ''] === 'S'
                  ).length,
                };

                const total = attendanceStats.hadir + attendanceStats.alfa + attendanceStats.izin + attendanceStats.sakit;

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-900 sticky left-0 z-10 bg-white border-r">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-900 sticky left-12 z-10 bg-white border-r">{student.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 sticky left-48 z-10 bg-white border-r">{student.nisn || '-'}</td>
                    {rekapData.meetings.map((meeting) => {
                      const status = rekapData.attendanceMatrix[student.id]?.[meeting.sesiId || ''] || '-';
                      return (
                        <td key={meeting.sesiId || meeting.tanggal} className="px-2 py-3 text-center">
                          {getStatusBadge(status)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-bold text-emerald-600">{attendanceStats.hadir}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-bold text-red-600">{attendanceStats.alfa}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-bold text-amber-600">{attendanceStats.izin}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-bold text-blue-600">{attendanceStats.sakit}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-xs font-bold text-slate-900">{total}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default RekapAbsenTahfizTable;

