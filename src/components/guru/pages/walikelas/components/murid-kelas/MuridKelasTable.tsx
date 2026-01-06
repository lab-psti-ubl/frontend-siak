import React from 'react';
import { Eye, Users } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { User } from '../../../../../../types';

interface AttendanceStats {
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  total: number;
  attendanceRate: number;
}

interface MuridKelasTableProps {
  muridKelas: User[];
  getAttendanceStats: (muridId: string) => AttendanceStats;
  onDetailClick: (murid: User) => void;
  selectedTahunAjaran: string;
  selectedSemester: number;
}

const MuridKelasTable: React.FC<MuridKelasTableProps> = ({
  muridKelas,
  getAttendanceStats,
  onDetailClick,
  selectedTahunAjaran,
  selectedSemester
}) => {
  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Rekap Kehadiran Murid</h3>
        <div className="flex items-center space-x-2">
          <Badge variant="info">
            {selectedTahunAjaran} - Semester {selectedSemester}
          </Badge>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableCell header>NISN</TableCell>
            <TableCell header>Nama Murid</TableCell>
            <TableCell header>Hadir</TableCell>
            <TableCell header>Izin</TableCell>
            <TableCell header>Sakit</TableCell>
            <TableCell header>Alfa</TableCell>
            <TableCell header>Total Sesi</TableCell>
            <TableCell header>Tingkat Kehadiran</TableCell>
            <TableCell header>Status</TableCell>
            <TableCell header>Aksi</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {muridKelas.map((murid) => {
            const stats = getAttendanceStats(murid.id);

            return (
              <TableRow key={murid.id}>
                <TableCell>{murid.nisn}</TableCell>
                <TableCell>{murid.name}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-sm">
                    {stats.hadir}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                    {stats.izin}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {stats.sakit}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                    {stats.alfa}
                  </span>
                </TableCell>
                <TableCell>{stats.total}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className={`h-2 rounded-full ${
                          stats.attendanceRate >= 80 ? 'bg-emerald-500' :
                          stats.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {stats.attendanceRate}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      stats.attendanceRate >= 80 ? 'success' :
                      stats.attendanceRate >= 60 ? 'warning' : 'danger'
                    }
                  >
                    {stats.attendanceRate >= 80 ? 'Baik' :
                     stats.attendanceRate >= 60 ? 'Cukup' : 'Perlu Perhatian'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDetailClick(murid)}
                    className="justify-center flex items-center"
                  >
                    <Eye size={14} className="mr-1" />
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {muridKelas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Belum ada murid di kelas ini</p>
        </div>
      )}
    </Card>
  );
};

export default MuridKelasTable;
