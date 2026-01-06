import React, { useState, useMemo } from 'react';
import { Users, TrendingUp, AlertCircle, Calendar, Download } from 'lucide-react';
import { exportToPDF, exportToExcel, formatDateID } from '../../utils/exportUtils';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../ui/Table';
import { useAuth } from '../../context/AuthContext';
import { useGurus } from '../../hooks/useGurus';
import { useMurid } from '../../hooks/useMurid';
import { useKelas } from '../../hooks/useKelas';
import { useJadwalPelajaran } from '../../hooks/useJadwalPelajaran';
import { useSesiAbsensi } from '../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../hooks/useAbsensi';
import { useMataPelajaran } from '../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { User, Kelas, JadwalPelajaran, SesiAbsensi, Absensi, MataPelajaran, TahunAjaran } from '../../types';

const WaliKelas: React.FC = () => {
  const { user } = useAuth();
  const { gurus } = useGurus();
  const { murid } = useMurid({ kelasId: user?.kelasWali, status: 'active' });
  const { kelas } = useKelas();
  const { activeTahunAjaran } = useTahunAjaran();
  const { jadwalPelajaran } = useJadwalPelajaran(
    user?.kelasWali && activeTahunAjaran
      ? {
          kelasId: user.kelasWali,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );
  const { sesiAbsensi } = useSesiAbsensi();
  const { absensi } = useAbsensi();
  const { mataPelajaran } = useMataPelajaran();
  const { tahunAjaran } = useTahunAjaran();
  
  const [dateFilter, setDateFilter] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Combine gurus and murid into users array for compatibility
  const users = useMemo(() => {
    return [...gurus, ...murid] as User[];
  }, [gurus, murid]);

  if (!user?.isWaliKelas || !user.kelasWali) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
        <p className="text-gray-600">Anda tidak memiliki akses sebagai wali kelas.</p>
      </Card>
    );
  }

  const myKelas = kelas.find(k => k.id === user.kelasWali);
  // murid already filtered by hook based on kelasId and status
  const muridKelas = murid as User[];
  const jadwalKelas = jadwalPelajaran; // Already filtered by hook

  const startDate = new Date(dateFilter.start);
  const endDate = new Date(dateFilter.end);

  const sesiKelas = sesiAbsensi.filter(s => {
    const jadwal = jadwalKelas.find(j => j.id === s.jadwalId);
    const sesiDate = new Date(s.tanggal);
    return jadwal && sesiDate >= startDate && sesiDate <= endDate;
  });

  const getAttendanceStats = (muridId: string) => {
    const muridAbsensi = absensi.filter(a => {
      const sesi = sesiKelas.find(s => s.id === a.sesiId);
      return sesi && a.muridId === muridId;
    });

    const stats = {
      hadir: muridAbsensi.filter(a => a.status === 'hadir').length,
      izin: muridAbsensi.filter(a => a.status === 'izin').length,
      sakit: muridAbsensi.filter(a => a.status === 'sakit').length,
      alfa: muridAbsensi.filter(a => a.status === 'alfa').length,
      total: muridAbsensi.length
    };

    const attendanceRate = stats.total > 0 ? 
      ((stats.hadir / stats.total) * 100).toFixed(1) : '0';

    return { ...stats, attendanceRate: parseFloat(attendanceRate) };
  };

  const overallStats = muridKelas.reduce((acc, murid) => {
    const stats = getAttendanceStats(murid.id);
    acc.totalHadir += stats.hadir;
    acc.totalIzin += stats.izin;
    acc.totalSakit += stats.sakit;
    acc.totalAlfa += stats.alfa;
    acc.totalSesi += stats.total;
    return acc;
  }, {
    totalHadir: 0,
    totalIzin: 0,
    totalSakit: 0,
    totalAlfa: 0,
    totalSesi: 0
  });

  const classAttendanceRate = overallStats.totalSesi > 0 ? 
    ((overallStats.totalHadir / overallStats.totalSesi) * 100).toFixed(1) : '0';

  const exportClassReport = () => {
    const data = muridKelas.map(murid => {
      const stats = getAttendanceStats(murid.id);
      return {
        nisn: murid.nisn,
        nama: murid.name,
        hadir: stats.hadir,
        izin: stats.izin,
        sakit: stats.sakit,
        alfa: stats.alfa,
        totalSesi: stats.total,
        tingkatKehadiran: `${stats.attendanceRate}%`
      };
    });

    const columns = [
      { header: 'NISN', dataKey: 'nisn', width: 15 },
      { header: 'Nama Murid', dataKey: 'nama', width: 25 },
      { header: 'Hadir', dataKey: 'hadir', width: 10 },
      { header: 'Izin', dataKey: 'izin', width: 10 },
      { header: 'Sakit', dataKey: 'sakit', width: 10 },
      { header: 'Alfa', dataKey: 'alfa', width: 10 },
      { header: 'Total Sesi', dataKey: 'totalSesi', width: 12 },
      { header: 'Tingkat Kehadiran', dataKey: 'tingkatKehadiran', width: 18 }
    ];

    const title = `REKAP KEHADIRAN MURID\nKelas: ${myKelas?.name}\nPeriode: ${formatDateID(dateFilter.start)} - ${formatDateID(dateFilter.end)}`;
    const filename = `rekap-kehadiran-${myKelas?.name}-${new Date().toISOString().split('T')[0]}`;
    
    exportToExcel(data, columns, title, filename);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Wali Kelas - {myKelas?.name}</h2>
          <p className="text-gray-600">Pantau kehadiran dan perkembangan murid kelas Anda</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Dari:</label>
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sampai:</label>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button 
            variant="secondary" 
            onClick={() => setDateFilter({
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              end: new Date().toISOString().split('T')[0]
            })}
          >
            30 Hari Terakhir
          </Button>
          <select
            value="custom"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => {
              if (e.target.value === '7') {
                setDateFilter({
                  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0]
                });
              } else if (e.target.value === '30') {
                setDateFilter({
                  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0]
                });
              } else if (e.target.value === '90') {
                setDateFilter({
                  start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0]
                });
              }
            }}
          >
            <option value="custom">Filter Cepat</option>
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="90">3 Bulan Terakhir</option>
          </select>
          <Button onClick={exportClassReport} variant="secondary">
            <Download size={16} className="mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Murid</p>
              <p className="text-2xl font-bold text-gray-900">{muridKelas.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-emerald-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tingkat Kehadiran</p>
              <p className="text-2xl font-bold text-gray-900">{classAttendanceRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Sesi</p>
              <p className="text-2xl font-bold text-gray-900">{sesiKelas.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-500">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Alfa</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalAlfa}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Rekap Kehadiran Murid</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="info">
              Periode: {new Date(dateFilter.start).toLocaleDateString('id-ID')} - {new Date(dateFilter.end).toLocaleDateString('id-ID')}
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
    </div>
  );
};

export default WaliKelas;