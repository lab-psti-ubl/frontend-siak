import React, { useMemo } from 'react';
import { Clock, Users, Calendar, LogIn, LogOut } from 'lucide-react';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { User, Absensi, PengaturanAbsen } from '../../../../../types';
import { useAbsensi } from '../../../../../hooks/useAbsensi';
import { useMurid } from '../../../../../hooks/useMurid';
import { useKelas } from '../../../../../hooks/useKelas';
import { determineAbsenStatusForMurid, getAbsenStatusBadgeVariant } from '../../../../guru/pages/walikelas/components/absen-kelas/absenKelasStatusHelper';
import { determineKeterangan } from '../../../../../utils/absenValidationUtils';

interface LihatAbsenGuruTableProps {
  selectedGuru: User;
  displayDate: string;
  pengaturanAbsen: PengaturanAbsen[];
  isWaliKelas?: boolean;
}

const LihatAbsenGuruTable: React.FC<LihatAbsenGuruTableProps> = ({
  selectedGuru,
  displayDate,
  pengaturanAbsen,
  isWaliKelas
}) => {
  const activePengaturanAbsen = pengaturanAbsen.find(p => p.isActive);
  
  // Get kelas wali dari guru
  const kelasWaliId = (selectedGuru as any)?.kelasWali;
  
  // Get data kelas
  const { kelas } = useKelas();
  const myKelas = useMemo(() => {
    if (!kelasWaliId) return null;
    return kelas.find(k => k.id === kelasWaliId);
  }, [kelasWaliId, kelas]);
  
  // Get murid di kelas wali
  const { murid } = useMurid({ 
    kelasId: kelasWaliId, 
    status: 'active' 
  });
  
  // Get absensi untuk tanggal dan kelas
  const { absensi } = useAbsensi({ 
    kelasId: kelasWaliId, 
    tanggal: displayDate 
  });
  
  // Function to get attendance status for a murid
  const getAttendanceStatus = (muridId: string, sessionType: 'masuk' | 'pulang'): Absensi | null => {
    if (!absensi || absensi.length === 0) return null;
    
    // Find today's absensi (one record per day in new structure)
    const todayAbsensi = absensi.find((a: Absensi) =>
      a.muridId === muridId &&
      a.tanggal === displayDate &&
      a.kelasId === kelasWaliId
    );

    if (todayAbsensi) {
      // New structure: create virtual object for compatibility
      if (sessionType === 'masuk' && (todayAbsensi.jamMasuk || todayAbsensi.statusMasuk)) {
        return {
          ...todayAbsensi,
          tipeAbsen: 'masuk',
          waktu: todayAbsensi.jamMasuk || todayAbsensi.waktu || '',
          status: todayAbsensi.statusMasuk === 'izin' ? 'izin' :
                  todayAbsensi.statusMasuk === 'sakit' ? 'sakit' :
                  todayAbsensi.statusMasuk === 'alfa' ? 'alfa' :
                  todayAbsensi.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
        };
      } else if (sessionType === 'pulang' && (todayAbsensi.jamKeluar || todayAbsensi.statusKeluar)) {
        return {
          ...todayAbsensi,
          tipeAbsen: 'pulang',
          waktu: todayAbsensi.jamKeluar || todayAbsensi.waktu || '',
          status: todayAbsensi.statusKeluar === 'izin' ? 'izin' :
                  todayAbsensi.statusKeluar === 'sakit' ? 'sakit' :
                  todayAbsensi.statusKeluar === 'alfa' ? 'alfa' :
                  todayAbsensi.statusKeluar === 'pulang_awal' ? 'pulang_cepat' : 'hadir',
        };
      }
    }

    // Backward compatibility: check old structure (separate records)
    return absensi.find((a: Absensi) =>
      a.muridId === muridId &&
      (a.tanggal === displayDate || a.waktu?.startsWith(displayDate)) &&
      a.kelasId === kelasWaliId &&
      a.tipeAbsen === sessionType
    ) || null;
  };

  const getKeteranganBadge = (keterangan: string) => {
    switch (keterangan) {
      case 'Hadir':
        return <Badge variant="success">Hadir</Badge>;
      case 'Izin':
        return <Badge variant="warning">Izin</Badge>;
      case 'Sakit':
        return <Badge variant="info">Sakit</Badge>;
      case 'Alfa':
      case 'Bolos':
        return <Badge variant="danger">Alfa</Badge>;
      case 'Dispen':
        return <Badge variant="info">Dispen</Badge>;
      default:
        return <Badge variant="default">-</Badge>;
    }
  };

  if (!isWaliKelas || !kelasWaliId) {
    return (
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">
            Absensi Kehadiran Siswa - {new Date(displayDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600">
            Guru ini bukan wali kelas, sehingga tidak memiliki data absensi kehadiran siswa
          </p>
        </div>
      </Card>
    );
  }

  if (!myKelas) {
    return (
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">
            Absensi Kehadiran Siswa - {new Date(displayDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600">
            Data kelas tidak ditemukan
          </p>
        </div>
      </Card>
    );
  }

  const muridKelas = murid.filter(m => (m as any).kelasId === kelasWaliId);

  const formattedDate = new Date(displayDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card className="overflow-hidden border-2 border-gray-200 shadow-lg">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 sm:p-6 border-b-2 border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500 flex items-center justify-center shadow-md">
              <Users size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-gray-900">
                Absensi Kehadiran Siswa
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 flex items-center gap-1.5">
                <span className="font-semibold text-purple-600">{myKelas.name}</span>
                <span>•</span>
                <Calendar size={12} className="text-gray-500" />
                <span className="text-gray-500">{formattedDate}</span>
              </p>
            </div>
          </div>
          <Badge variant="info">
            {muridKelas.length} Siswa
          </Badge>
        </div>
      </div>

      {muridKelas.length === 0 ? (
        <div className="p-8 sm:p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Tidak ada siswa di kelas ini
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>No</TableCell>
                  <TableCell header>Nama Murid</TableCell>
                  <TableCell header>NISN</TableCell>
                  <TableCell header>Absen Masuk</TableCell>
                  <TableCell header>Waktu Masuk</TableCell>
                  <TableCell header>Absen Pulang</TableCell>
                  <TableCell header>Waktu Pulang</TableCell>
                  <TableCell header>Keterangan</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {muridKelas.map((murid, index) => {
                  const masukAttendance = getAttendanceStatus(murid.id, 'masuk');
                  const pulangAttendance = getAttendanceStatus(murid.id, 'pulang');

                  const masukStatusInfo = determineAbsenStatusForMurid(masukAttendance, 'masuk', activePengaturanAbsen);
                  const effectivePulangAttendance = pulangAttendance || (masukAttendance && ['izin', 'sakit', 'alfa'].includes(masukAttendance?.status || '') ? masukAttendance : null);
                  const pulangStatusInfo = determineAbsenStatusForMurid(effectivePulangAttendance, 'pulang', activePengaturanAbsen);

                  const keteranganResult = determineKeterangan(masukAttendance, pulangAttendance, activePengaturanAbsen);

                  return (
                    <TableRow key={murid.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-semibold">{murid.name}</TableCell>
                      <TableCell className="text-gray-600">{(murid as any).nisn || '-'}</TableCell>
                      <TableCell>
                        {masukAttendance ? (
                          <Badge variant={getAbsenStatusBadgeVariant(masukStatusInfo.statusAbsen)}>
                            {masukStatusInfo.displayStatus}
                          </Badge>
                        ) : (
                          <Badge variant="default">Belum Absen</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {masukAttendance && masukAttendance.waktu ? (
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-xs sm:text-sm font-mono text-gray-900">
                              {new Date(masukAttendance.waktu).toLocaleTimeString('id-ID', { 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: false 
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {effectivePulangAttendance ? (
                          <Badge variant={getAbsenStatusBadgeVariant(pulangStatusInfo.statusAbsen)}>
                            {pulangStatusInfo.displayStatus}
                          </Badge>
                        ) : (
                          <Badge variant="default">Belum Absen</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {pulangAttendance && pulangAttendance.waktu ? (
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-xs sm:text-sm font-mono text-gray-900">
                              {new Date(pulangAttendance.waktu).toLocaleTimeString('id-ID', { 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: false 
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getKeteranganBadge(keteranganResult.keterangan)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {muridKelas.map((murid, index) => {
              const masukAttendance = getAttendanceStatus(murid.id, 'masuk');
              const pulangAttendance = getAttendanceStatus(murid.id, 'pulang');

              const masukStatusInfo = determineAbsenStatusForMurid(masukAttendance, 'masuk', activePengaturanAbsen);
              const effectivePulangAttendance = pulangAttendance || (masukAttendance && ['izin', 'sakit', 'alfa'].includes(masukAttendance?.status || '') ? masukAttendance : null);
              const pulangStatusInfo = determineAbsenStatusForMurid(effectivePulangAttendance, 'pulang', activePengaturanAbsen);

              const keteranganResult = determineKeterangan(masukAttendance, pulangAttendance, activePengaturanAbsen);

              return (
                <div key={murid.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-400 w-6">#{index + 1}</span>
                        <h5 className="text-sm font-bold text-gray-900 truncate">{murid.name}</h5>
                      </div>
                      <p className="text-xs text-gray-500 ml-8">NISN: {(murid as any).nisn || '-'}</p>
                    </div>
                    <div className="ml-2">
                      {getKeteranganBadge(keteranganResult.keterangan)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {/* Absen Masuk */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <LogIn size={12} className="text-blue-600" />
                        Masuk
                      </div>
                      <div className="mb-1.5">
                        {masukAttendance ? (
                          <Badge variant={getAbsenStatusBadgeVariant(masukStatusInfo.statusAbsen)}>
                            {masukStatusInfo.displayStatus}
                          </Badge>
                        ) : (
                          <Badge variant="default">Belum</Badge>
                        )}
                      </div>
                      {masukAttendance && masukAttendance.waktu ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock size={10} />
                          <span className="font-mono">
                            {new Date(masukAttendance.waktu).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              hour12: false 
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>

                    {/* Absen Pulang */}
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <LogOut size={12} className="text-emerald-600" />
                        Pulang
                      </div>
                      <div className="mb-1.5">
                        {effectivePulangAttendance ? (
                          <Badge variant={getAbsenStatusBadgeVariant(pulangStatusInfo.statusAbsen)}>
                            {pulangStatusInfo.displayStatus}
                          </Badge>
                        ) : (
                          <Badge variant="default">Belum</Badge>
                        )}
                      </div>
                      {pulangAttendance && pulangAttendance.waktu ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock size={10} />
                          <span className="font-mono">
                            {new Date(pulangAttendance.waktu).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              hour12: false 
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
};

export default LihatAbsenGuruTable;
