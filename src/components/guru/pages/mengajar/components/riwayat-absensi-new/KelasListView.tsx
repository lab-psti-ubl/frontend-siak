import React, { useMemo } from 'react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import { Users, BookOpen, Eye, ChevronRight } from 'lucide-react';
import { JadwalPelajaran, User, Kelas, SesiAbsensi, RiwayatKelasMurid, TahunAjaran } from '../../../../../../types';

interface KelasListViewProps {
  mySchedules: JadwalPelajaran[];
  kelas: Kelas[];
  users: User[];
  sesiAbsensi: SesiAbsensi[];
  selectedTahunAjaran: string;
  selectedSemester: number;
  riwayatKelasMurid: RiwayatKelasMurid[];
  tahunAjaran: TahunAjaran[];
  onViewMurid: (kelasId: string) => void;
  onViewMapel: (kelasId: string) => void;
}

const KelasListView: React.FC<KelasListViewProps> = ({
  mySchedules,
  kelas,
  users,
  sesiAbsensi,
  selectedTahunAjaran,
  selectedSemester,
  riwayatKelasMurid,
  tahunAjaran,
  onViewMurid,
  onViewMapel,
}) => {
  // Filter schedules to ensure they match selected tahun ajaran and semester
  // This is an additional safety check to ensure only relevant classes are shown
  const filteredSchedules = useMemo(() => {
    if (!selectedTahunAjaran || !selectedSemester) {
      return mySchedules;
    }
    return mySchedules.filter(
      s =>
        s.tahunAjaran === selectedTahunAjaran &&
        s.semester === selectedSemester
    );
  }, [mySchedules, selectedTahunAjaran, selectedSemester]);

  // Get unique class IDs from filtered schedules only
  const uniqueKelasIds = [...new Set(filteredSchedules.map(s => s.kelasId))];
  const kelasList = uniqueKelasIds
    .map(id => kelas.find(k => k.id === id))
    .filter(k => k !== undefined) as Kelas[];

  // Find tahunAjaranId based on selected tahun and semester
  const selectedTahunAjaranData = tahunAjaran.find(
    ta => ta.tahun === selectedTahunAjaran && ta.semester === selectedSemester
  );

  const getKelasStats = (kelasId: string) => {
    // Get jumlah murid from RiwayatKelasMurid based on selected tahun ajaran ID and semester
    let jumlahMurid = 0;
    if (selectedTahunAjaranData) {
      jumlahMurid = riwayatKelasMurid.filter(
        rkm => rkm.kelasId === kelasId &&
               rkm.tahunAjaran === selectedTahunAjaranData.id &&
               rkm.semester === selectedSemester
      ).length;
    }

    // If no riwayat data found, fallback to current murid in kelas
    if (jumlahMurid === 0) {
      jumlahMurid = users.filter(u => u.role === 'murid' && (u as any).kelasId === kelasId).length;
    }

    const kelasSchedules = filteredSchedules.filter(s => s.kelasId === kelasId);
    const jadwalIds = kelasSchedules.map(s => s.id);
    const totalPertemuan = sesiAbsensi.filter(s => jadwalIds.includes(s.jadwalId) && s.status === 'ditutup').length;

    return { jumlahMurid, totalPertemuan };
  };

  if (kelasList.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Tidak ada kelas yang diajar</h3>
          <p className="text-xs sm:text-sm text-slate-600 text-center">
            Anda belum memiliki jadwal mengajar di semester ini
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
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Jumlah Murid</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Total Pertemuan</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {kelasList.map((kelasItem, index) => {
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
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{kelasItem.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Tingkat {kelasItem.tingkat}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">{stats.jumlahMurid}</span>
                        <span className="text-xs text-slate-500">murid</span>
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
                          onClick={() => onViewMapel(kelasItem.id)}
                          variant="primary"
                          className="flex items-center text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg"
                        >
                          <BookOpen size={14} className="mr-1" />
                          Mapel
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
        {kelasList.map((kelasItem, index) => {
          const stats = getKelasStats(kelasItem.id);
          return (
            <div key={kelasItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{kelasItem.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Tingkat {kelasItem.tingkat}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">#{index + 1}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-200">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Jumlah Murid</p>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-bold text-slate-900">{stats.jumlahMurid}</span>
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
                    onClick={() => onViewMapel(kelasItem.id)}
                    variant="primary"
                    className="flex-1 flex items-center justify-center text-xs px-3 py-2 rounded-lg"
                  >
                    <BookOpen size={14} className="mr-1.5" />
                    Lihat Mapel
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

export default KelasListView;
