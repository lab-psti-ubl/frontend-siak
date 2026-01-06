import React from 'react';
import { Calendar } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import { SesiAbsensi, Absensi, Kelas, TahunAjaran } from '../../../../types';

interface AttendanceHistoryTableProps {
  filteredSessions: SesiAbsensi[];
  targetKelas: Kelas | null;
  selectedTahunAjaran: string;
  selectedMonth: number;
  selectedYear: number;
  activeTahunAjaran?: TahunAjaran;
  getJadwalInfo: (jadwalId: string) => { mapel: string; guru: string; waktu: string };
  getAttendanceStatus: (sesiId: string) => Absensi | undefined;
}

const AttendanceHistoryTable: React.FC<AttendanceHistoryTableProps> = ({
  filteredSessions,
  targetKelas,
  selectedTahunAjaran,
  selectedMonth,
  selectedYear,
  activeTahunAjaran,
  getJadwalInfo,
  getAttendanceStatus
}) => {
  if (!targetKelas) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Kelas Tidak Ditemukan</h3>
        <p className="text-sm text-slate-600">
          Tidak dapat menentukan kelas untuk tahun ajaran {selectedTahunAjaran}.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Kemungkinan Anda belum masuk sekolah atau sudah lulus pada periode tersebut.
        </p>
      </div>
    );
  }

  if (filteredSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-sm sm:text-base font-medium text-slate-500">Tidak ada riwayat absensi</p>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {targetKelas ?
            `Tidak ada data untuk ${targetKelas.name} pada ${new Date(selectedYear, selectedMonth - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}` :
            'Pilih periode yang valid untuk melihat data absensi'
          }
        </p>
        {selectedTahunAjaran !== activeTahunAjaran?.tahun && (
          <p className="text-xs text-slate-400 mt-2">
            Data historis mungkin tidak lengkap
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell header>Tanggal</TableCell>
            <TableCell header>Mata Pelajaran</TableCell>
            <TableCell header className="hidden sm:table-cell">Guru</TableCell>
            <TableCell header className="hidden lg:table-cell">Waktu</TableCell>
            <TableCell header>Status</TableCell>
            <TableCell header className="hidden md:table-cell">Metode</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSessions.map((sesi) => {
            const { mapel, guru, waktu } = getJadwalInfo(sesi.jadwalId);
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
                    {guru}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-slate-700">{guru}</span>
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
                    {attendance ? (attendance.method === 'qr' ? 'QR Code' : 'Manual') : '-'}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {attendance ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {attendance.method === 'qr' ? 'QR Code' : 'Manual'}
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

export default AttendanceHistoryTable;
