import React from 'react';
import { Calendar } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import { SesiAbsensiTahfiz, AbsensiPelajaran } from '../../../../types';
import { useLanguage } from '../../../../context/LanguageContext';

interface AttendanceHistoryTableTahfizProps {
  filteredSessions: SesiAbsensiTahfiz[];
  selectedMonth: number;
  selectedYear: number;
  getJadwalInfo: (jadwalId: string) => { mapel: string; ustadz: string; waktu: string; kelas: string };
  getAttendanceStatus: (sesiId: string) => AbsensiPelajaran | undefined;
}

const AttendanceHistoryTableTahfiz: React.FC<AttendanceHistoryTableTahfizProps> = ({
  filteredSessions,
  selectedMonth,
  selectedYear,
  getJadwalInfo,
  getAttendanceStatus
}) => {
  const { t } = useLanguage();
  
  if (filteredSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-sm sm:text-base font-medium text-slate-500">{t('tahfiz.muridTahfiz.attendanceHistory.tidakAdaRiwayatAbsensi')}</p>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t('tahfiz.muridTahfiz.attendanceHistory.tidakAdaDataUntuk')} {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell header>{t('tahfiz.muridTahfiz.attendanceHistory.tanggal')}</TableCell>
            <TableCell header>{t('tahfiz.muridTahfiz.attendanceHistory.mataPelajaran')}</TableCell>
            <TableCell header className="hidden sm:table-cell">{t('tahfiz.muridTahfiz.attendanceHistory.ustadz')}</TableCell>
            <TableCell header className="hidden lg:table-cell">{t('tahfiz.muridTahfiz.attendanceHistory.kelas')}</TableCell>
            <TableCell header className="hidden lg:table-cell">{t('tahfiz.muridTahfiz.attendanceHistory.waktu')}</TableCell>
            <TableCell header>{t('tahfiz.muridTahfiz.attendanceHistory.status')}</TableCell>
            <TableCell header className="hidden md:table-cell">{t('tahfiz.muridTahfiz.attendanceHistory.metode')}</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSessions.map((sesi) => {
            const { mapel, ustadz, waktu, kelas } = getJadwalInfo(sesi.jadwalId);
            const attendance = getAttendanceStatus(sesi.id);

            return (
              <TableRow key={sesi.id}>
                <TableCell>
                  <div className="font-medium text-slate-900">
                    {new Date(sesi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-xs text-slate-500 sm:hidden mt-0.5">
                    {waktu}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-900">{mapel}</div>
                  <div className="text-xs text-slate-500 sm:hidden mt-0.5">
                    {ustadz}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-slate-700">{ustadz}</span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-slate-700">{kelas}</span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-slate-700">{waktu}</span>
                </TableCell>
                <TableCell>
                  {attendance ? (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      attendance.status === 'hadir' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      attendance.status === 'izin' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      attendance.status === 'sakit' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {attendance.status.toUpperCase()}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                      ALFA
                    </span>
                  )}
                  <div className="text-xs text-slate-500 md:hidden mt-1">
                    {attendance ? (attendance.method === 'qr' ? t('tahfiz.muridTahfiz.attendanceHistory.qrCode') : t('tahfiz.muridTahfiz.attendanceHistory.manual')) : '-'}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {attendance ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {attendance.method === 'qr' ? t('tahfiz.muridTahfiz.attendanceHistory.qrCode') : t('tahfiz.muridTahfiz.attendanceHistory.manual')}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default AttendanceHistoryTableTahfiz;

