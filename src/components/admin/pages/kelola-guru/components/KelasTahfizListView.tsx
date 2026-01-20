import React, { useMemo } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { Users, BookOpen, Eye } from 'lucide-react';
import { User, SesiAbsensiTahfiz, TahfizSchedule } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';

interface KelasTahfizListViewProps {
  kelasTahfiz: TahfizClass[];
  jadwalTahfiz: TahfizSchedule[];
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  selectedYear: string;
  onViewMurid: (kelasId: string) => void;
  onViewTahfiz: (kelasId: string) => void;
}

const KelasTahfizListView: React.FC<KelasTahfizListViewProps> = ({
  kelasTahfiz,
  jadwalTahfiz,
  sesiAbsensiTahfiz,
  selectedYear,
  onViewMurid,
  onViewTahfiz,
}) => {
  const getKelasStats = (kelasId: string) => {
    const kelasData = kelasTahfiz.find(k => k.id === kelasId);
    const jumlahSantri = kelasData?.santriIds.length || 0;

    const kelasJadwal = jadwalTahfiz.filter(j => j.kelasId === kelasId);
    const jadwalIds = kelasJadwal.map(j => j.id);
    const totalPertemuan = sesiAbsensiTahfiz.filter(
      s => jadwalIds.includes(s.jadwalId) && 
           s.tahun === selectedYear && 
           s.status === 'ditutup'
    ).length;

    return { jumlahSantri, totalPertemuan };
  };

  const myKelas = useMemo(() => {
    return kelasTahfiz.filter(k => {
      const jadwalKelas = jadwalTahfiz.filter(j => j.kelasId === k.id);
      return jadwalKelas.length > 0;
    });
  }, [kelasTahfiz, jadwalTahfiz]);

  if (myKelas.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Tidak ada kelas tahfiz</h3>
          <p className="text-xs sm:text-sm text-slate-600 text-center">
            Belum ada kelas tahfiz yang diajar
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
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {myKelas.map((kelasItem, index) => {
                const stats = getKelasStats(kelasItem.id);
                return (
                  <tr key={kelasItem.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{kelasItem.namaKelas}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Ruangan: {kelasItem.ruangan}</p>
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
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          onClick={() => onViewMurid(kelasItem.id)}
                          variant="secondary"
                          className="flex items-center text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                        >
                          <Eye size={14} className="mr-1" />
                          Murid
                        </Button>
                        <Button
                          onClick={() => onViewTahfiz(kelasItem.id)}
                          variant="primary"
                          className="flex items-center text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg"
                        >
                          <BookOpen size={14} className="mr-1" />
                          Tahfiz
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {myKelas.map((kelasItem, index) => {
          const stats = getKelasStats(kelasItem.id);
          return (
            <div key={kelasItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
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

                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-200">
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

                <div className="flex gap-2">
                  <Button
                    onClick={() => onViewMurid(kelasItem.id)}
                    variant="secondary"
                    className="flex-1 flex items-center justify-center text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                  >
                    <Eye size={14} className="mr-1.5" />
                    Lihat Murid
                  </Button>
                  <Button
                    onClick={() => onViewTahfiz(kelasItem.id)}
                    variant="primary"
                    className="flex-1 flex items-center justify-center text-xs px-3 py-2 rounded-lg"
                  >
                    <BookOpen size={14} className="mr-1.5" />
                    Lihat Tahfiz
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default KelasTahfizListView;

