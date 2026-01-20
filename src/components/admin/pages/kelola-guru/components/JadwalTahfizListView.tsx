import React, { useState, useMemo } from 'react';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { BookOpen, Clock, Eye, FileText, ClipboardList } from 'lucide-react';
import { SesiAbsensiTahfiz, TahfizSchedule } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';
import MateriTahfizModal from './MateriTahfizModal';

interface JadwalTahfizListViewProps {
  kelasId: string;
  jadwalTahfiz: TahfizSchedule[];
  kelasTahfiz: TahfizClass[];
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  selectedYear: string;
  onViewPertemuan: (kelasId: string, jadwalId: string) => void;
  onViewRekap: (kelasId: string, jadwalId: string) => void;
  onViewMateri: (jadwal: TahfizSchedule, kelas: TahfizClass) => void;
  onViewJurnalFile: (file: any) => void;
}

const JadwalTahfizListView: React.FC<JadwalTahfizListViewProps> = ({
  kelasId,
  jadwalTahfiz,
  kelasTahfiz,
  sesiAbsensiTahfiz,
  selectedYear,
  onViewPertemuan,
  onViewRekap,
  onViewMateri: _onViewMateri,
  onViewJurnalFile,
}) => {
  const [isMateriModalOpen, setIsMateriModalOpen] = useState(false);
  const [selectedJadwalForMateri, setSelectedJadwalForMateri] = useState<TahfizSchedule | null>(null);
  
  const kelasData = kelasTahfiz.find(k => k.id === kelasId);
  
  const kelasSchedules = useMemo(() => {
    return jadwalTahfiz.filter(j => j.kelasId === kelasId);
  }, [jadwalTahfiz, kelasId]);

  const handleViewMateri = (jadwal: TahfizSchedule) => {
    setSelectedJadwalForMateri(jadwal);
    setIsMateriModalOpen(true);
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

  if (kelasSchedules.length === 0) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 flex items-center gap-4 sm:gap-6">
            <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">{kelasData?.namaKelas}</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Belum ada jadwal tahfiz untuk kelas ini</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Tidak ada jadwal tahfiz</h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center">
              Belum ada jadwal tahfiz untuk kelas ini
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 flex items-center gap-4 sm:gap-6">
          <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">{kelasData?.namaKelas}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {kelasSchedules.length} jadwal tahfiz yang diajar
            </p>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200">
              <tr>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">No</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Hari</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Jam</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {kelasSchedules.map((jadwal, index) => {
                const sessionsCount = sesiAbsensiTahfiz.filter(
                  s => s.jadwalId === jadwal.id && 
                       s.tahun === selectedYear && 
                       s.status === 'ditutup'
                ).length;

                return (
                  <tr key={jadwal.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900">{hariNames[jadwal.hari] || jadwal.hari}</p>
                          <Badge variant="info" size="sm">
                            {sessionsCount} Sesi
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-xs sm:text-sm text-slate-900 font-medium">
                          {jadwal.jamMulai} - {jadwal.jamSelesai}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          onClick={() => handleViewMateri(jadwal)}
                          variant="secondary"
                          className="flex items-center text-xs px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                        >
                          <FileText size={13} className="mr-0.5" />
                          Materi
                        </Button>
                        <Button
                          onClick={() => onViewPertemuan(kelasId, jadwal.id)}
                          variant="primary"
                          className="flex items-center text-xs px-2.5 py-1.5 rounded-lg"
                        >
                          <Eye size={13} className="mr-0.5" />
                          Pertemuan
                        </Button>
                        <Button
                          onClick={() => onViewRekap(kelasId, jadwal.id)}
                          variant="secondary"
                          className="flex items-center text-xs px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg"
                        >
                          <ClipboardList size={13} className="mr-0.5" />
                          Rekap
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
        {kelasSchedules.map((jadwal, index) => {
          const sessionsCount = sesiAbsensiTahfiz.filter(
            s => s.jadwalId === jadwal.id && 
                 s.tahun === selectedYear && 
                 s.status === 'ditutup'
          ).length;

          return (
            <div key={jadwal.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{hariNames[jadwal.hari] || jadwal.hari}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-xs text-slate-600">{jadwal.jamMulai} - {jadwal.jamSelesai}</span>
                    </div>
                    <Badge variant="info" size="sm">
                      {sessionsCount} Sesi
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">#{index + 1}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleViewMateri(jadwal)}
                    variant="secondary"
                    className="flex items-center justify-center text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                  >
                    <FileText size={14} className="mr-1.5" />
                    Materi
                  </Button>
                  <Button
                    onClick={() => onViewPertemuan(kelasId, jadwal.id)}
                    variant="primary"
                    className="flex items-center justify-center text-xs px-3 py-2 rounded-lg"
                  >
                    <Eye size={14} className="mr-1.5" />
                    Pertemuan
                  </Button>
                  <Button
                    onClick={() => onViewRekap(kelasId, jadwal.id)}
                    variant="secondary"
                    className="col-span-2 flex items-center justify-center text-xs px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg"
                  >
                    <ClipboardList size={14} className="mr-1.5" />
                    Rekap
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedJadwalForMateri && kelasData && (
        <MateriTahfizModal
          isOpen={isMateriModalOpen}
          onClose={() => {
            setIsMateriModalOpen(false);
            setSelectedJadwalForMateri(null);
          }}
          selectedJadwal={selectedJadwalForMateri}
          kelas={kelasData}
          sesiAbsensiTahfiz={sesiAbsensiTahfiz}
          selectedYear={selectedYear}
          onViewJurnalFile={onViewJurnalFile}
          isAdminView={true}
        />
      )}
    </div>
  );
};

export default JadwalTahfizListView;

