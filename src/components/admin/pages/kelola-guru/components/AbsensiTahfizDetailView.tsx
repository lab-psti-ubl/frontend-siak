import React, { useMemo } from 'react';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import Button from '../../../../ui/Button';
import { Clock, Users, FileText, BookOpen, Camera, AlertCircle } from 'lucide-react';
import { SesiAbsensiTahfiz, TahfizSchedule, User, FotoMengajarTahfiz } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../../hooks/useSantri';
import { useJurnalTahfiz } from '../../../../../hooks/useJurnalTahfiz';
import { useSesiAbsensiTahfiz } from '../../../../../hooks/useSesiAbsensiTahfiz';

interface AbsensiTahfizDetailViewProps {
  sesiId: string;
  jadwalId: string;
  kelasId: string;
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  jadwalTahfiz: TahfizSchedule[];
  kelasTahfiz: TahfizClass[];
  onViewJurnalFile: (file: any) => void;
}

const AbsensiTahfizDetailView: React.FC<AbsensiTahfizDetailViewProps> = ({
  sesiId,
  jadwalId,
  kelasId,
  sesiAbsensiTahfiz,
  jadwalTahfiz,
  kelasTahfiz,
  onViewJurnalFile
}) => {
  const { santri } = useSantri();
  const { sesiAbsensiTahfiz: allSesiAbsensiTahfiz } = useSesiAbsensiTahfiz();
  
  // Check if this is a virtual session (pertemuan yang tidak mengajar)
  const isVirtualSession = sesiId.startsWith('virtual-tahfiz-');
  
  // Extract tanggal from virtual session ID
  // Format: virtual-tahfiz-YYYY-MM-DD-jadwalId
  const virtualSessionDate = isVirtualSession
    ? sesiId.replace('virtual-tahfiz-', '').split('-').slice(0, 3).join('-')
    : null;

  // Gunakan data sesi dari hook (paling baru), fallback ke props
  const sesi = useMemo(() => {
    if (isVirtualSession) {
      // For virtual session, try to find existing sesi by tanggal and jadwalId
      const existingSesi = allSesiAbsensiTahfiz.find(s => 
        s.jadwalId === jadwalId && 
        s.tanggal === virtualSessionDate
      );
      return existingSesi || null;
    }
    const hookSesi = allSesiAbsensiTahfiz.find(s => s.id === sesiId);
    if (hookSesi) return hookSesi;
    return sesiAbsensiTahfiz.find(s => s.id === sesiId);
  }, [allSesiAbsensiTahfiz, sesiAbsensiTahfiz, sesiId, isVirtualSession, jadwalId, virtualSessionDate]);
  
  const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);
  const kelas = kelasTahfiz.find(k => k.id === kelasId);
  
  // For virtual session, use virtual date or current date
  const displayTanggal = sesi?.tanggal || virtualSessionDate || new Date().toISOString().split('T')[0];
  
  // Get jurnal tahfiz for this jadwal and tanggal
  const { jurnalTahfiz } = useJurnalTahfiz({ 
    jadwalId,
    tanggal: displayTanggal,
    kelasId
  });
  
  const pertemuan = useMemo(() => {
    if (!displayTanggal) return undefined;
    const jurnalDoc = jurnalTahfiz.find(j => j.jadwalId === jadwalId && j.kelasId === kelasId);
    return jurnalDoc?.pertemuan?.find(p => p.tanggal === displayTanggal);
  }, [jurnalTahfiz, jadwalId, kelasId, displayTanggal]);
  
  const fotoMengajar: FotoMengajarTahfiz | undefined = pertemuan?.fotoMengajar;
  const jurnal = pertemuan ? {
    judul: pertemuan.judul,
    deskripsi: pertemuan.deskripsi,
    waktuInput: pertemuan.waktuInput,
    file: pertemuan.file
  } : undefined;

  // Get santri for this class
  const santriList = useMemo(() => {
    if (!kelas) return [];
    return kelas.santriIds
      .map(santriId => santri.find(s => s.id === santriId))
      .filter(Boolean) as User[];
  }, [kelas, santri]);

  // Get absensi from sesi.dataAbsensi
  const absensiData = useMemo(() => {
    return sesi?.dataAbsensi || [];
  }, [sesi]);

  const getSantriAbsensi = (santriId: string) => {
    return absensiData.find(a => a.muridId === santriId);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'hadir':
        return 'success';
      case 'izin':
        return 'info';
      case 'sakit':
        return 'warning';
      case 'alfa':
        return 'danger';
      case 'terlambat':
        return 'warning';
      case 'pulang_cepat':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'hadir': 'Hadir',
      'izin': 'Izin',
      'sakit': 'Sakit',
      'alfa': 'Alfa',
      'terlambat': 'Terlambat',
      'pulang_cepat': 'Pulang Cepat',
    };
    return labels[status] || status.toUpperCase();
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

  const hariNames: Record<string, string> = {
    'senin': 'Senin',
    'selasa': 'Selasa',
    'rabu': 'Rabu',
    'kamis': 'Kamis',
    'jumat': 'Jumat',
    'sabtu': 'Sabtu',
    'minggu': 'Minggu',
  };

  const stats = useMemo(() => {
    const hadir = absensiData.filter(a => a.status === 'hadir').length;
    const izin = absensiData.filter(a => a.status === 'izin').length;
    const sakit = absensiData.filter(a => a.status === 'sakit').length;
    const alfa = absensiData.filter(a => a.status === 'alfa').length;
    const terlambat = absensiData.filter(a => a.status === 'terlambat').length;
    const pulangCepat = absensiData.filter(a => a.status === 'pulang_cepat').length;

    return { hadir, izin, sakit, alfa, terlambat, pulangCepat };
  }, [absensiData]);


  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* HEADER CARD */}
      <Card className="bg-gradient-to-br from-blue-50 via-slate-50 to-slate-50 border-blue-200">
        <div className="space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 truncate">
                  Tahfiz Qur'an
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {kelas?.namaKelas || 'Kelas Tahfiz'} • {displayTanggal ? formatTanggal(displayTanggal) : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-blue-200">
            <div className="bg-white bg-opacity-60 rounded-lg p-2 sm:p-3">
              <p className="text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">Hari & Jam</p>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-900 font-semibold">
                <Clock size={14} className="flex-shrink-0 text-blue-600" />
                <span className="truncate">
                  {jadwal ? `${hariNames[jadwal.hari]} ${jadwal.jamMulai}-${jadwal.jamSelesai}` : '-'}
                </span>
              </div>
            </div>
            <div className="bg-white bg-opacity-60 rounded-lg p-2 sm:p-3">
              <p className="text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">Sesi</p>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-900 font-semibold">
                <Clock size={14} className="flex-shrink-0 text-blue-600" />
                <span className="truncate">
                  {sesi ? `${sesi.jamBuka} - ${sesi.jamTutup || 'Aktif'}` : '-'}
                </span>
              </div>
            </div>
            <div className="bg-white bg-opacity-60 rounded-lg p-2 sm:p-3">
              <p className="text-xs font-medium text-slate-600 mb-0.5 sm:mb-1">Total Santri</p>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-900 font-semibold">
                <Users size={14} className="flex-shrink-0 text-blue-600" />
                <span>{santriList.length}</span>
              </div>
            </div>
          </div>

          {/* Jurnal & Foto Section */}
          <div className="pt-3 sm:pt-4 border-t border-blue-200">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
              {sesi?.status === 'ditutup' ? (
                <Badge variant="success" size="sm">
                  Sesi Ditutup
                </Badge>
              ) : sesi ? (
                <Badge variant="info" size="sm">
                  Sesi Aktif
                </Badge>
              ) : (
                <Badge variant="secondary" size="sm">
                  Belum Mengajar
                </Badge>
              )}
                {fotoMengajar ? (
                  <Badge variant="info" size="sm">
                    <Camera size={12} className="mr-1" />
                    Ada Foto
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    <Camera size={12} className="mr-1" />
                    Belum Foto
                  </Badge>
                )}
                {jurnal ? (
                  <button
                    onClick={() => jurnal?.file && onViewJurnalFile(jurnal.file)}
                    className="cursor-pointer"
                  >
                    <Badge variant="success" size="sm">
                      <BookOpen size={12} className="mr-1" />
                      Ada Jurnal
                    </Badge>
                  </button>
                ) : (
                  <Badge variant="default" size="sm">
                    <BookOpen size={12} className="mr-1" />
                    Belum Jurnal
                  </Badge>
                )}
              </div>

              {jurnal && (
                <div className="mt-3 p-3 sm:p-4 bg-white bg-opacity-60 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        {jurnal.judul || 'Jurnal Mengajar'}
                      </p>
                      {jurnal.deskripsi && (
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {jurnal.deskripsi}
                        </p>
                      )}
                    </div>
                    {jurnal.file && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onViewJurnalFile(jurnal.file!)}
                        className="flex items-center gap-2 flex-shrink-0"
                      >
                        <FileText size={14} />
                        <span className="hidden sm:inline">Lihat File</span>
                        <span className="sm:hidden">File</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </Card>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 border-emerald-200">
          <div className="text-center py-2 sm:py-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">{stats.hadir}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Hadir</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-50/50 border-amber-200">
          <div className="text-center py-2 sm:py-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-600">{stats.izin}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Izin</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-sky-50 to-sky-50/50 border-sky-200">
          <div className="text-center py-2 sm:py-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-sky-600">{stats.sakit}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Sakit</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-50/50 border-red-200">
          <div className="text-center py-2 sm:py-3">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{stats.alfa}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">Alfa</p>
          </div>
        </Card>
      </div>

      {/* ATTENDANCE TABLE */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Data Absensi Santri</h3>
        </div>

        {santriList.length === 0 ? (
          <Card>
            <div className="text-center py-8 sm:py-12">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
              <p className="text-slate-600 font-medium text-sm sm:text-base">Tidak ada santri</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Desktop/Tablet Table View */}
            <div className="hidden lg:block border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-50 to-slate-50 border-b-2 border-blue-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Nama Santri</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">NISN</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Waktu</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Metode</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {santriList.map((santriItem, index) => {
                      const attendance = getSantriAbsensi(santriItem.id);

                      return (
                        <tr key={santriItem.id} className="hover:bg-slate-50 transition-colors duration-150">
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-xs">
                                  {santriItem.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-slate-900">{santriItem.name}</span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-slate-600">
                            {(santriItem as any).nisn || '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            {attendance ? (
                              <Badge variant={getStatusBadgeVariant(attendance.status)} size="sm">
                                {getStatusLabel(attendance.status)}
                              </Badge>
                            ) : (
                              <Badge variant="default" size="sm">Belum Absen</Badge>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-slate-600">
                            {attendance ? new Date(attendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                            {attendance ? (
                              <Badge variant={attendance.method === 'qr' ? 'info' : 'default'} size="sm">
                                {attendance.method === 'qr' ? 'QR Code' : 'Manual'}
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm text-slate-600 max-w-xs truncate">
                            {attendance?.keterangan || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {santriList.map((santriItem, index) => {
                const attendance = getSantriAbsensi(santriItem.id);

                return (
                  <Card key={santriItem.id} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">
                          {santriItem.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{santriItem.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">NISN: {(santriItem as any).nisn || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">#{index + 1}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Status</span>
                        {attendance ? (
                          <Badge variant={getStatusBadgeVariant(attendance.status)} size="sm">
                            {getStatusLabel(attendance.status)}
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">Belum Absen</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Waktu</span>
                        <span className="text-xs text-slate-900 font-medium">
                          {attendance ? new Date(attendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Metode</span>
                        {attendance ? (
                          <Badge variant={attendance.method === 'qr' ? 'info' : 'default'} size="sm">
                            {attendance.method === 'qr' ? 'QR Code' : 'Manual'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </div>
                      {attendance?.keterangan && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-xs text-slate-600">Keterangan</span>
                          <p className="text-xs text-slate-900 mt-1">{attendance.keterangan}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AbsensiTahfizDetailView;
