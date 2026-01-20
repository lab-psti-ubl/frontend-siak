import React, { useState } from 'react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { BookOpen, Clock, User, Eye, FileText, ClipboardList } from 'lucide-react';
import { JadwalPelajaran, MataPelajaran, User as UserType, Kelas, SesiAbsensi } from '../../../../../../types';
import MateriGuruModal from './MateriGuruModal';

interface MapelListViewProps {
  kelasId: string;
  kelasSchedules: JadwalPelajaran[];
  mataPelajaran: MataPelajaran[];
  kelas: Kelas[];
  users: UserType[];
  sesiAbsensi: SesiAbsensi[];
  selectedTahunAjaran: string;
  selectedSemester: number;
  onViewPertemuan: (mapelId: string, jadwalId: string) => void;
  onViewRekap: (mapelId: string, jadwalId: string) => void;
  onUpdateJurnal: (jadwalId: string, kelasId: string, tanggal: string, jurnal: any) => Promise<void>;
}

const MapelListView: React.FC<MapelListViewProps> = ({
  kelasId,
  kelasSchedules,
  mataPelajaran,
  kelas,
  users,
  sesiAbsensi,
  selectedTahunAjaran,
  selectedSemester,
  onViewPertemuan,
  onViewRekap,
  onUpdateJurnal,
}) => {
  const [isMateriModalOpen, setIsMateriModalOpen] = useState(false);
  const [selectedMapel, setSelectedMapel] = useState<{ jadwal: JadwalPelajaran; mapel: MataPelajaran; guru: UserType } | null>(null);

  const kelasData = kelas.find(k => k.id === kelasId);

  const hariNames: Record<string, string> = {
    'senin': 'Senin',
    'selasa': 'Selasa',
    'rabu': 'Rabu',
    'kamis': 'Kamis',
    'jumat': 'Jumat',
    'sabtu': 'Sabtu',
    'minggu': 'Minggu',
  };

  const handleViewMateri = (jadwal: JadwalPelajaran, mapel: MataPelajaran, guru: UserType) => {
    setSelectedMapel({ jadwal, mapel, guru });
    setIsMateriModalOpen(true);
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
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">{kelasData?.name}</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Belum ada mata pelajaran untuk kelas ini</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Tidak ada mata pelajaran</h3>
            <p className="text-xs sm:text-sm text-slate-600 text-center">
              Belum ada jadwal mata pelajaran untuk kelas ini
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
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">{kelasData?.name}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {kelasSchedules.length} mata pelajaran di kelas
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
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Kode</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Mata Pelajaran</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tipe</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Jadwal</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Guru</th>
                <th className="px-5 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {kelasSchedules.map((jadwal, index) => {
                const mapel = mataPelajaran.find(m => m.id === jadwal.mataPelajaranId);
                const guru = users.find(u => u.id === jadwal.guruId);

                return (
                  <tr key={jadwal.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-900">{index + 1}</td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs sm:text-sm font-bold border border-blue-200">
                        {mapel?.code || '-'}
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{mapel?.name || '-'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">SKS: {mapel?.sks || 0}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {mapel?.keterangan === 'umum' ? (
                        <Badge variant="info" className="text-xs">Umum</Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">Khusus</Badge>
                      )}
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-900">
                          <Clock size={14} className="text-blue-500 flex-shrink-0" />
                          {hariNames[jadwal.hari]}
                        </div>
                        <div className="text-xs text-slate-600 ml-5">
                          {jadwal.jamMulai} - {jadwal.jamSelesai}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-violet-400 to-teal-500 rounded-lg flex items-center justify-center shadow-sm">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">{guru?.name || '-'}</p>
                      </div>
                    </td>
                    <td className="px-5 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          onClick={() => handleViewMateri(jadwal, mapel!, guru!)}
                          variant="secondary"
                          className="hidden lg:flex items-center text-xs px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                        >
                          <FileText size={13} className="mr-0.5" />
                          Materi
                        </Button>
                        <Button
                          onClick={() => onViewPertemuan(mapel?.id || '', jadwal.id)}
                          variant="primary"
                          className="flex items-center text-xs px-2.5 py-1.5 rounded-lg"
                        >
                          <Eye size={13} className="mr-0.5" />
                          Pertemuan
                        </Button>
                        <Button
                          onClick={() => onViewRekap(mapel?.id || '', jadwal.id)}
                          variant="secondary"
                          className="hidden md:flex items-center text-xs px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg"
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
          const mapel = mataPelajaran.find(m => m.id === jadwal.mataPelajaranId);
          const guru = users.find(u => u.id === jadwal.guruId);

          return (
            <div key={jadwal.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
                        {mapel?.code || '-'}
                      </span>
                      <p className="text-xs text-slate-500">#{index + 1}</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{mapel?.name || '-'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">SKS: {mapel?.sks || 0}</p>
                  </div>
                  {mapel?.keterangan === 'umum' ? (
                    <Badge variant="info" className="text-xs whitespace-nowrap">Umum</Badge>
                  ) : mapel?.keterangan === 'agama' ? (
                    <Badge variant="success" className="text-xs whitespace-nowrap">Agama</Badge>
                  ) : (
                    <Badge variant="warning" className="text-xs whitespace-nowrap">Khusus</Badge>
                  )}
                </div>

                <div className="flex grid-cols-2 space-y-2.5 mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2.5 mr-5">
                    <Clock size={16} className="text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-600">Jadwal</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {hariNames[jadwal.hari]}, {jadwal.jamMulai} - {jadwal.jamSelesai}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <User size={16} className="text-violet-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-600">Guru</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{guru?.name || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewMateri(jadwal, mapel!, guru!)}
                    variant="secondary"
                    className="flex-1 flex items-center justify-center text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg"
                  >
                    <FileText size={14} className="mr-1.5" />
                    Materi
                  </Button>
                  <Button
                    onClick={() => onViewPertemuan(mapel?.id || '', jadwal.id)}
                    variant="primary"
                    className="flex-1 flex items-center justify-center text-xs px-3 py-2 rounded-lg"
                  >
                    <Eye size={14} className="mr-1.5" />
                    Pertemuan
                  </Button>
                  <Button
                    onClick={() => onViewRekap(mapel?.id || '', jadwal.id)}
                    variant="secondary"
                    className="flex-1 flex items-center justify-center text-xs px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg"
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

      {selectedMapel && (
        <MateriGuruModal
          isOpen={isMateriModalOpen}
          onClose={() => {
            setIsMateriModalOpen(false);
            setSelectedMapel(null);
          }}
          selectedSchedules={[selectedMapel.jadwal]}
          mataPelajaran={selectedMapel.mapel}
          guruName={selectedMapel.guru.name}
          sesiAbsensi={sesiAbsensi}
          onUpdateJurnal={onUpdateJurnal}
          isWaliKelasView={true}
        />
      )}
    </div>
  );
};

export default MapelListView;
