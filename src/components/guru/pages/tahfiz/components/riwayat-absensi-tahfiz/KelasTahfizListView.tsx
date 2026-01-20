import React, { useMemo } from 'react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import { Users, BookOpen, Eye, ChevronRight, FileText, User as UserIcon } from 'lucide-react';
import { TahfizSchedule, User, SesiAbsensiTahfiz } from '../../../../../../types';
import { TahfizClass } from '../../../../../../hooks/useKelasTahfiz';

interface KelasTahfizListViewProps {
  mySchedules: TahfizSchedule[];
  kelasTahfiz: TahfizClass[];
  santri: User[];
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  selectedTahun: string;
  onViewPertemuan: (kelasId: string, jadwalId: string) => void;
  onViewRekap: (kelasId: string, jadwalId: string) => void;
  onViewSantri: (kelasId: string) => void;
  onViewMateri: (kelasId: string, jadwalId: string) => void;
}

const KelasTahfizListView: React.FC<KelasTahfizListViewProps> = ({
  mySchedules,
  kelasTahfiz,
  santri,
  sesiAbsensiTahfiz,
  selectedTahun,
  onViewPertemuan,
  onViewRekap,
  onViewSantri,
  onViewMateri,
}) => {
  // Get unique class IDs from schedules
  const uniqueKelasIds = [...new Set(mySchedules.map(s => s.kelasId))];
  const kelasList = uniqueKelasIds
    .map(id => kelasTahfiz.find(k => k.id === id))
    .filter(k => k !== undefined) as TahfizClass[];

  const getJadwalStats = (jadwalId: string, kelasId: string) => {
    // Get jumlah santri from kelas tahfiz
    const kelas = kelasTahfiz.find(k => k.id === kelasId);
    const jumlahSantri = kelas ? kelas.santriIds.length : 0;

    // Get total pertemuan (closed sessions) for this specific jadwal in selected year
    const totalPertemuan = sesiAbsensiTahfiz.filter(
      s => s.jadwalId === jadwalId && s.status === 'ditutup' && s.tahun === selectedTahun
    ).length;

    return { jumlahSantri, totalPertemuan };
  };

  if (kelasList.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Tidak ada kelas tahfiz</h3>
          <p className="text-xs sm:text-sm text-slate-600 text-center">
            Anda belum memiliki jadwal mengajar tahfiz
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
              <tr>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kelas</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Jumlah Santri</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Pertemuan</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Jadwal</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {(() => {
                // Flatten all jadwal with kelas info, sorted properly
                const allJadwalWithKelas = mySchedules
                  .map(jadwal => {
                    const kelas = kelasTahfiz.find(k => k.id === jadwal.kelasId);
                    return { jadwal, kelas };
                  })
                  .filter(item => item.kelas !== undefined)
                  .sort((a, b) => {
                    // Sort by kelas name first, then by hari, then by jamMulai
                    const kelasCompare = (a.kelas!.namaKelas || '').localeCompare(b.kelas!.namaKelas || '');
                    if (kelasCompare !== 0) return kelasCompare;
                    const hariOrder: Record<string, number> = {
                      'senin': 1, 'selasa': 2, 'rabu': 3, 'kamis': 4,
                      'jumat': 5, 'sabtu': 6, 'minggu': 7
                    };
                    const hariCompare = (hariOrder[a.jadwal.hari] || 99) - (hariOrder[b.jadwal.hari] || 99);
                    if (hariCompare !== 0) return hariCompare;
                    return (a.jadwal.jamMulai || '').localeCompare(b.jadwal.jamMulai || '');
                  });

                return allJadwalWithKelas.map((item, index) => {
                  const { jadwal, kelas } = item;
                  const stats = getJadwalStats(jadwal.id, jadwal.kelasId);
                  const hariNames: Record<string, string> = {
                    'senin': 'Senin',
                    'selasa': 'Selasa',
                    'rabu': 'Rabu',
                    'kamis': 'Kamis',
                    'jumat': 'Jumat',
                    'sabtu': 'Sabtu',
                    'minggu': 'Minggu',
                  };

                  return (
                    <tr key={jadwal.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">
                        {index + 1}
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{kelas?.namaKelas}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Ruangan: {kelas?.ruangan}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-slate-900">{stats.jumlahSantri}</span>
                          <span className="text-xs text-slate-500">santri</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="text-xs sm:text-sm font-semibold">{stats.totalPertemuan}</span>
                          <span className="text-xs hidden sm:inline">pertemuan</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-slate-700">
                          <span className="font-medium">{hariNames[jadwal.hari] || jadwal.hari}</span>
                          <span className="text-slate-500 ml-2">{jadwal.jamMulai} - {jadwal.jamSelesai}</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => onViewSantri(kelas!.id)}
                            variant="secondary"
                            className="flex items-center text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                          >
                            <UserIcon size={14} className="mr-1" />
                            Santri
                          </Button>
                          <Button
                            onClick={() => onViewMateri(kelas!.id, jadwal.id)}
                            variant="secondary"
                            className="flex items-center text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg"
                          >
                            <FileText size={14} className="mr-1" />
                            Materi
                          </Button>
                          <Button
                            onClick={() => onViewPertemuan(kelas!.id, jadwal.id)}
                            variant="primary"
                            className="flex items-center text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg"
                          >
                            <Eye size={14} className="mr-1" />
                            Pertemuan
                          </Button>
                          <Button
                            onClick={() => onViewRekap(kelas!.id, jadwal.id)}
                            variant="secondary"
                            className="flex items-center text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg"
                          >
                            <BookOpen size={14} className="mr-1" />
                            Rekap
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {kelasList.map((kelasItem, index) => {
          const kelasSchedules = mySchedules.filter(s => s.kelasId === kelasItem.id);
          const hariNames: Record<string, string> = {
            'senin': 'Senin',
            'selasa': 'Selasa',
            'rabu': 'Rabu',
            'kamis': 'Kamis',
            'jumat': 'Jumat',
            'sabtu': 'Sabtu',
            'minggu': 'Minggu',
          };
          
          return (
            <div key={kelasItem.id} className="space-y-3">
              {/* Header Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{kelasItem.namaKelas}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Ruangan: {kelasItem.ruangan}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">#{index + 1}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Button
                      onClick={() => onViewSantri(kelasItem.id)}
                      variant="secondary"
                      className="w-full flex items-center justify-center text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                    >
                      <UserIcon size={14} className="mr-1.5" />
                      Lihat Data Santri
                    </Button>
                  </div>
                </div>
              </div>

              {/* Jadwal Cards */}
              {kelasSchedules.map((jadwal) => {
                const stats = getJadwalStats(jadwal.id, jadwal.kelasId);
                
                return (
                  <div key={jadwal.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="p-4">
                      <div className="mb-3 pb-3 border-b border-slate-200">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Jadwal</p>
                        <p className="text-sm font-bold text-slate-900">
                          {hariNames[jadwal.hari] || jadwal.hari} - {jadwal.jamMulai} - {jadwal.jamSelesai}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">Jumlah Santri</p>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-bold text-slate-900">{stats.jumlahSantri}</span>
                          </div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-1">Total Pertemuan</p>
                          <span className="text-sm font-bold text-slate-900">{stats.totalPertemuan}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => onViewMateri(kelasItem.id, jadwal.id)}
                          variant="secondary"
                          className="flex items-center justify-center text-xs px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg"
                        >
                          <FileText size={14} className="mr-1.5" />
                          Materi
                        </Button>
                        <Button
                          onClick={() => onViewPertemuan(kelasItem.id, jadwal.id)}
                          variant="primary"
                          className="flex items-center justify-center text-xs px-3 py-2 rounded-lg"
                        >
                          <Eye size={14} className="mr-1.5" />
                          Pertemuan
                        </Button>
                        <Button
                          onClick={() => onViewRekap(kelasItem.id, jadwal.id)}
                          variant="secondary"
                          className="flex items-center justify-center text-xs px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg col-span-2"
                        >
                          <BookOpen size={14} className="mr-1.5" />
                          Rekap Absensi
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default KelasTahfizListView;

