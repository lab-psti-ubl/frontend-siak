import React, { useState, useEffect } from 'react';
import Card from '../../../../../ui/Card';
import { User, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { RekapAbsenData } from './rekapAbsenUtils';

interface RekapAbsenTableProps {
  rekapData: RekapAbsenData;
}

const RekapAbsenTable: React.FC<RekapAbsenTableProps> = ({ rekapData }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // ============================================================
  // ===============    BADGE & FORMAT SHARED     ===============
  // ============================================================
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

  // =====================================================================
  // ==================          MOBILE VIEW           ===================
  // =====================================================================
  if (isMobile) {
    return (
      <Card>
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-900 mb-2">Rekap Kehadiran Murid</h3>
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
              <p className="text-slate-500 font-medium text-sm">Tidak ada data murid</p>
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

              return (
                <div
                  key={student.id}
                  className="bg-gradient-to-br from-slate-50 to-slate-50 border border-slate-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(student.id)}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-blue-50 duration-150"
                  >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="overflow-hidden text-left">
                        <p className="text-sm font-semibold text-slate-900 truncate">{student.name}</p>
                        <p className="text-xs text-slate-500 truncate">NISN: {student.nisn}</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-200 p-4 space-y-4 bg-white">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                          <p className="text-xs text-emerald-600 font-semibold mb-1">Hadir</p>
                          <p className="text-2xl font-bold text-emerald-700">{attendanceStats.hadir}</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <p className="text-xs text-red-600 font-semibold mb-1">Alfa</p>
                          <p className="text-2xl font-bold text-red-700">{attendanceStats.alfa}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <p className="text-xs text-amber-600 font-semibold mb-1">Izin</p>
                          <p className="text-2xl font-bold text-amber-700">{attendanceStats.izin}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-blue-600 font-semibold mb-1">Sakit</p>
                          <p className="text-2xl font-bold text-blue-700">{attendanceStats.sakit}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <p className="text-xs font-semibold text-slate-700 mb-3">Detail Pertemuan</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {rekapData.meetings.map((meeting, idx) => {
                            const attendance = rekapData.attendanceMatrix[student.id]?.[meeting.sesiId || ''];
                            return (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                <div>
                                  <p className="text-xs font-semibold text-slate-700">
                                    Pertemuan {meeting.pertemuanKe}
                                  </p>
                                  <p className="text-xs text-slate-500">{formatTanggalShort(meeting.tanggal)}</p>
                                </div>
                                {getStatusBadge(attendance || '-')}
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

        {rekapData.students.length === 0 && rekapData.meetings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-semibold text-sm">Belum ada data rekap absensi</p>
          </div>
        )}
      </Card>
    );
  }

  // =====================================================================
  // =======================   DESKTOP VIEW   =============================
  // =====================================================================

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Rekap Kehadiran Murid</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 text-green-700 font-bold text-xs">H</span>
            <span className="text-gray-600">= Hadir</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 text-red-700 font-bold text-xs">A</span>
            <span className="text-gray-600">= Alfa</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-100 text-yellow-700 font-bold text-xs">I</span>
            <span className="text-gray-600">= Izin</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 font-bold text-xs">S</span>
            <span className="text-gray-600">= Sakit</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-400 font-bold text-xs">-</span>
            <span className="text-gray-600">= Tidak Ada Absen</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-indigo-50 border-r border-gray-300">
                    No
                  </th>
                  <th className="sticky left-12 z-10 px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-indigo-50 border-r border-gray-300 min-w-[200px]">
                    Nama Murid
                  </th>
                  <th className="sticky left-[240px] z-10 px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-indigo-50 border-r border-gray-300 min-w-[140px]">
                    NISN
                  </th>

                  {rekapData.meetings.map((meeting, idx) => (
                    <th key={idx} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                      <div className="flex flex-col items-center space-y-1">
                        <span className="font-bold text-blue-600">{meeting.pertemuanKe}</span>
                        <span className="text-xs text-gray-600">
                          {formatTanggalShort(meeting.tanggal)}
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Statistik kehadiran per murid */}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                    H
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                    I
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                    S
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                    A
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                    %
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {rekapData.students.length === 0 ? (
                  <tr>
                    <td colSpan={3 + rekapData.meetings.length + 6} className="px-6 py-12 text-center">
                      <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 font-medium text-lg">Tidak ada data murid</p>
                    </td>
                  </tr>
                ) : (
                  rekapData.students.map((student, studentIdx) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-10 px-4 py-4 bg-white border-r border-gray-300">
                        {studentIdx + 1}
                      </td>

                      <td className="sticky left-12 z-10 px-6 py-4 bg-white border-r border-gray-300">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-bold text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="sticky left-[240px] z-10 px-6 py-4 bg-white border-r border-gray-300">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                          {student.nisn}
                        </span>
                      </td>

                      {rekapData.meetings.map((meeting, meetingIdx) => {
                        const attendance = rekapData.attendanceMatrix[student.id]?.[meeting.sesiId || ''];
                        return (
                          <td key={meetingIdx} className="px-4 py-4 text-center border-l border-gray-200">
                            {getStatusBadge(attendance || '-')}
                          </td>
                        );
                      })}

                      {(() => {
                        const stats = {
                          hadir: 0,
                          alfa: 0,
                          izin: 0,
                          sakit: 0,
                        };

                        rekapData.meetings.forEach(meeting => {
                          const attendance = rekapData.attendanceMatrix[student.id]?.[meeting.sesiId || ''] || '-';
                          if (attendance === 'H') stats.hadir += 1;
                          else if (attendance === 'A') stats.alfa += 1;
                          else if (attendance === 'I') stats.izin += 1;
                          else if (attendance === 'S') stats.sakit += 1;
                        });

                        const total = rekapData.meetings.length;
                        const persen = total > 0 ? Math.round((stats.hadir / total) * 100) : 0;

                        return (
                          <>
                            <td className="px-4 py-4 text-center border-l border-gray-200 text-xs font-semibold text-emerald-700">
                              {stats.hadir}
                            </td>
                            <td className="px-4 py-4 text-center border-l border-gray-200 text-xs font-semibold text-amber-700">
                              {stats.izin}
                            </td>
                            <td className="px-4 py-4 text-center border-l border-gray-200 text-xs font-semibold text-blue-700">
                              {stats.sakit}
                            </td>
                            <td className="px-4 py-4 text-center border-l border-gray-200 text-xs font-semibold text-red-700">
                              {stats.alfa}
                            </td>
                            <td className="px-4 py-4 text-center border-l border-gray-200 text-xs font-semibold text-slate-900">
                              {total}
                            </td>
                            <td className="px-4 py-4 text-center border-l border-gray-200">
                              <span
                                className={`inline-flex items-center justify-center min-w-10 px-2 py-1 rounded-md font-semibold text-xs border ${
                                  persen >= 75
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : persen >= 50
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {persen}%
                              </span>
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {rekapData.students.length === 0 && rekapData.meetings.length === 0 && (
        <div className="mt-8 text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium text-lg">Belum ada data rekap absensi</p>
        </div>
      )}
    </Card>
  );
};

export default RekapAbsenTable;
