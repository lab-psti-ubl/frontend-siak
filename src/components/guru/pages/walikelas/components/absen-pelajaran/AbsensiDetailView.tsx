import React, { useMemo } from 'react';
import Card from '../../../../../ui/Card';
import Badge from '../../../../../ui/Badge';
import { Calendar, Clock, Users, User as UserIcon } from 'lucide-react';
import { SesiAbsensi, JadwalPelajaran, User, Kelas, MataPelajaran, Absensi, Murid, TahunAjaran } from '../../../../../../types';
import { useAbsensi } from '../../../../../../hooks/useAbsensi';
import { useSesiAbsensi } from '../../../../../../hooks/useSesiAbsensi';
import { useRiwayatKelasMurid } from '../../../../../../hooks/useRiwayatKelasMurid';
import { getMuridByKelasAndTahunAjaran } from '../../../../../../utils/riwayatKelasMuridUtils';

interface AbsensiDetailViewProps {
  sesiId: string;
  jadwalId: string;
  kelasId: string;
  sesiAbsensi: SesiAbsensi[];
  jadwalPelajaran: JadwalPelajaran[];
  users: User[];
  kelas: Kelas[];
  mataPelajaran: MataPelajaran[];
  selectedTahunAjaran?: string;
  selectedSemester?: number;
  tahunAjaran?: TahunAjaran[];
}

const AbsensiDetailView: React.FC<AbsensiDetailViewProps> = ({
  sesiId,
  jadwalId,
  kelasId,
  sesiAbsensi,
  jadwalPelajaran,
  users,
  kelas,
  mataPelajaran,
  selectedTahunAjaran,
  selectedSemester,
  tahunAjaran = [],
}) => {
  const { absensi } = useAbsensi();
  const { sesiAbsensi: allSesiAbsensi } = useSesiAbsensi();
  const { riwayatKelasMurid } = useRiwayatKelasMurid();

  // Combine prop sesiAbsensi with hook data to ensure we have all sessions
  const combinedSesiAbsensi = useMemo(() => {
    const propSesiIds = new Set(sesiAbsensi.map(s => s.id));
    const hookSesi = allSesiAbsensi.filter(s => !propSesiIds.has(s.id));
    return [...sesiAbsensi, ...hookSesi];
  }, [sesiAbsensi, allSesiAbsensi]);

  // Get current sesi from combined list
  const activeSesi = useMemo(() => {
    return combinedSesiAbsensi.find(s => s.id === sesiId);
  }, [combinedSesiAbsensi, sesiId]);

  const isVirtualSession = sesiId.startsWith('virtual-');

  const sesi = activeSesi || sesiAbsensi.find(s => s.id === sesiId);
  const jadwal = jadwalPelajaran.find(j => j.id === jadwalId);
  const kelasData = kelas.find(k => k.id === kelasId);
  const mapel = mataPelajaran.find(m => m.id === jadwal?.mataPelajaranId);
  const guru = users.find(u => u.id === jadwal?.guruId);

  const virtualSessionDate = isVirtualSession
    ? sesiId.split('-').slice(-3).join('-')
    : null;

  let muridList: Murid[];

  if (sesi?.tahunAjaranId && riwayatKelasMurid.length > 0) {
    muridList = getMuridByKelasAndTahunAjaran(
      kelasId,
      sesi.tahunAjaranId,
      users,
      riwayatKelasMurid
    ) as Murid[];
  } else {
    muridList = users.filter(u => u.role === 'murid' && (u as Murid).kelasId === kelasId) as Murid[];
  }

  // Get absensi from sesi.dataAbsensi (absensi pelajaran) - PRIMARY SOURCE
  // Also check Absensi collection as fallback for backward compatibility
  const absensiData = useMemo(() => {
    // Primary: Get from sesi.dataAbsensi (absensi pelajaran)
    const absensiFromSesi = sesi?.dataAbsensi || [];
    
    // Fallback: Get from Absensi collection (for backward compatibility)
    const absensiFromCollection = absensi.filter(a => a.sesiId === sesiId);
    
    // Combine both sources, prioritize sesi.dataAbsensi
    const combined: Absensi[] = [];
    const muridIdsProcessed = new Set<string>();
    
    // First, add from sesi.dataAbsensi (absensi pelajaran) - PRIMARY SOURCE
    absensiFromSesi.forEach(absenPelajaran => {
      combined.push({
        id: absenPelajaran.id,
        sesiId: sesiId,
        muridId: absenPelajaran.muridId,
        tanggal: sesi?.tanggal || virtualSessionDate || '',
        kelasId: kelasId,
        tipeAbsen: 'masuk',
        status: absenPelajaran.status,
        waktu: absenPelajaran.waktu,
        keterangan: absenPelajaran.keterangan,
        method: absenPelajaran.method,
        tahunAjaranId: sesi?.tahunAjaranId || '',
        semester: sesi?.semester || selectedSemester || 1,
        statusAbsen: absenPelajaran.statusAbsen,
        keteranganAbsensi: absenPelajaran.keteranganAbsensi,
      } as Absensi);
      muridIdsProcessed.add(absenPelajaran.muridId);
    });
    
    // Then add from Absensi collection for murid that don't have absensi in sesi (backward compatibility)
    absensiFromCollection.forEach(absen => {
      if (!muridIdsProcessed.has(absen.muridId)) {
        combined.push(absen);
      }
    });
    
    return combined;
  }, [sesi, absensi, sesiId, virtualSessionDate, kelasId, selectedSemester]);

  const getMuridAbsensi = (muridId: string) => {
    return absensiData.find(a => a.muridId === muridId);
  };

  const hariNames: Record<string, string> = {
    'senin': 'Senin',
    'selasa': 'Selasa',
    'rabu': 'Rabu',
    'kamis': 'Kamis',
    'jumat': 'Jumat',
    'sabtu': 'Sabtu',
    'minggu': 'Minggu',
  };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hadir':
        return <Badge variant="success">Hadir</Badge>;
      case 'izin':
        return <Badge variant="warning">Izin</Badge>;
      case 'sakit':
        return <Badge variant="info">Sakit</Badge>;
      case 'alfa':
        return <Badge variant="error">Alfa</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const calculateStats = () => {
    const hadir = absensiData.filter(a => a.status === 'hadir').length;
    const izin = absensiData.filter(a => a.status === 'izin').length;
    const sakit = absensiData.filter(a => a.status === 'sakit').length;
    const alfa = absensiData.filter(a => a.status === 'alfa').length;

    return { hadir, izin, sakit, alfa };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">{mapel?.name}</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {kelasData?.name} - {formatTanggal(sesi?.tanggal || virtualSessionDate || '')}
              </p>
              {isVirtualSession && (
                <div className="mt-2">
                  <Badge variant="error" className="text-xs">Guru Tidak Mengajar</Badge>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-5 border-t border-blue-200">
            <div>
              <p className="text-xs sm:text-sm text-slate-600 mb-2">Hari & Jam</p>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {hariNames[jadwal?.hari || '']}, {jadwal?.jamMulai} - {jadwal?.jamSelesai}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-600 mb-2">Guru Pengajar</p>
              <div className="flex items-center gap-2">
                <UserIcon size={16} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-semibold text-slate-900">{guru?.name}</p>
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-600 mb-2">Total Murid</p>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-semibold text-slate-900">{muridList.length} murid</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{stats.hadir}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Hadir</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.izin}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Izin</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.sakit}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Sakit</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.alfa}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">Alfa</p>
          </div>
        </Card>
      </div>

      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900">Data Absensi Murid</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
              <tr>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama Murid</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">NISN</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {muridList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 sm:px-6 py-8 sm:py-12 text-center">
                    <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
                    <p className="text-slate-600 font-medium text-sm sm:text-base">Tidak ada murid</p>
                  </td>
                </tr>
              ) : (
                muridList.map((murid, index) => {
                  const absensiMurid = getMuridAbsensi(murid.id);
                  return (
                    <tr key={murid.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">
                        {index + 1}
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex-shrink-0 h-9 w-9 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                            <UserIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{murid.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{murid.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold border border-blue-200">
                          {murid.nisn}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {absensiMurid ? getStatusBadge(absensiMurid.status) : <Badge variant="secondary" className="text-xs">-</Badge>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Data Absensi Murid</h3>
        </div>
        <div className="space-y-3">
          {muridList.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-600 font-medium text-sm">Tidak ada murid</p>
              </div>
            </div>
          ) : (
            muridList.map((murid, index) => {
              const absensiMurid = getMuridAbsensi(murid.id);
              return (
                <div key={murid.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{murid.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{murid.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 font-medium">NISN:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                          {murid.nisn}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-medium">Status:</span>
                      {absensiMurid ? getStatusBadge(absensiMurid.status) : <Badge variant="secondary" className="text-xs">-</Badge>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AbsensiDetailView;
