import React, { useMemo } from 'react';
import { Calendar, Clock, Users, BookOpen, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { JadwalPelajaran } from '../../types';
import { getMinTingkat, getMaxTingkat, formatTingkatKelas, shouldShowJurusanSync } from '../../utils/jenjangPendidikanUtils';
import { useJadwalPelajaran } from '../../hooks/useJadwalPelajaran';
import { useKelas } from '../../hooks/useKelas';
import { useMataPelajaran } from '../../hooks/useMataPelajaran';
import { useTahunAjaran } from '../../hooks/useTahunAjaran';
import { useGurus } from '../../hooks/useGurus';
import { useMurid } from '../../hooks/useMurid';

const JadwalMurid: React.FC = () => {
  const { user } = useAuth();
  const { kelas } = useKelas();
  const { mataPelajaran } = useMataPelajaran();
  const { tahunAjaran, activeTahunAjaran } = useTahunAjaran();
  const { gurus } = useGurus();
  const { murid } = useMurid({ status: 'active' });

  // Combine gurus and murid into users array for compatibility
  const users = useMemo(() => {
    return [...gurus, ...murid];
  }, [gurus, murid]);

  const selectedTahunAjaran = activeTahunAjaran?.tahun || '';
  const selectedSemester = activeTahunAjaran?.semester || 1;

  const availableSemesters = tahunAjaran
    .filter(ta => ta.tahun === selectedTahunAjaran)
    .sort((a, b) => a.semester - b.semester);
  
  // Fungsi untuk menentukan kelas berdasarkan tahun ajaran
  const getKelasForTahunAjaran = (currentKelasId: string, targetTahunAjaran: string) => {
    const currentKelas = kelas.find(k => k.id === currentKelasId);
    if (!currentKelas) return null;

    // Jika tahun ajaran yang dipilih sama dengan tahun ajaran aktif, gunakan kelas saat ini
    if (targetTahunAjaran === activeTahunAjaran?.tahun) {
      return currentKelas;
    }

    // Hitung selisih tahun
    const currentYear = parseInt(activeTahunAjaran?.tahun.split('/')[0] || '2024');
    const targetYear = parseInt(targetTahunAjaran.split('/')[0]);
    const yearDiff = currentYear - targetYear;

    // Hitung tingkat kelas pada tahun ajaran yang dipilih
    const targetTingkat = currentKelas.tingkat - yearDiff;

    // Jika tingkat kelas tidak valid (di luar range jenjang), return null
    const minTingkat = getMinTingkat();
    const maxTingkat = getMaxTingkat();
    if (targetTingkat < minTingkat || targetTingkat > maxTingkat) {
      return null;
    }

    // Cari kelas dengan tingkat yang sesuai
    const showJurusan = shouldShowJurusanSync();

    const targetKelas = kelas.find(k => {
      if (k.tingkat !== targetTingkat) return false;

      if (showJurusan && currentKelas.jurusanId) {
        return k.jurusanId === currentKelas.jurusanId &&
          k.name.includes(currentKelas.name.split(' ').slice(1).join(' '));
      } else {
        return k.name.includes(currentKelas.name.split(' ').slice(1).join(' '));
      }
    });

    return targetKelas || {
      ...currentKelas,
      id: `virtual-${currentKelas.id}-${targetTingkat}`,
      name: `${formatTingkatKelas(targetTingkat)} ${currentKelas.name.split(' ').slice(1).join(' ')}`,
      tingkat: targetTingkat,
      jurusanId: showJurusan ? currentKelas.jurusanId : undefined
    };
  };

  // Dapatkan kelas untuk tahun ajaran yang dipilih
  const targetKelas = user?.kelasId ? getKelasForTahunAjaran(user.kelasId, selectedTahunAjaran) : null;
  
  // Get jadwal pelajaran dengan filter kelas, tahun ajaran, dan semester
  const { jadwalPelajaran } = useJadwalPelajaran(
    targetKelas && selectedTahunAjaran
      ? {
          kelasId: targetKelas.id.startsWith('virtual-') ? user?.kelasId : targetKelas.id,
          tahunAjaran: selectedTahunAjaran,
          semester: selectedSemester,
        }
      : undefined
  );
  
  // Dapatkan jadwal untuk periode yang dipilih
  const mySchedules = jadwalPelajaran;


  if (!activeTahunAjaran) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tahun Ajaran Tidak Aktif</h3>
        <p className="text-gray-600">Tidak ada tahun ajaran yang sedang aktif. Hubungi admin untuk informasi lebih lanjut.</p>
      </Card>
    );
  }

  const getMapelName = (mapelId: string) => {
    return mataPelajaran.find(m => m.id === mapelId)?.name || 'Unknown';
  };

  const getGuruName = (guruId: string) => {
    return users.find(u => u.id === guruId)?.name || 'Unknown';
  };

  const hariOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  const schedulesByDay = hariOrder.reduce((acc, hari) => {
    acc[hari] = mySchedules
      .filter(j => j.hari === hari)
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    return acc;
  }, {} as Record<string, JadwalPelajaran[]>);

  const hariLabels = {
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu',
    minggu: 'Minggu',
  };

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="text-white">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Jadwal Pelajaran</h2>
              <p className="text-xs sm:text-sm">
                Jadwal kelas {targetKelas?.name} untuk {selectedTahunAjaran} Semester {selectedSemester}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Kelas untuk Periode yang Dipilih */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 rounded-lg p-2 mt-0.5">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-base">
                  {targetKelas?.name || 'Kelas tidak ditemukan'}
                </h4>
                <p className="text-sm text-slate-600 mt-0.5">
                  {selectedTahunAjaran} - Semester {selectedSemester} ({selectedSemester === 1 ? 'Ganjil' : 'Genap'})
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Periode Aktif
            </span>
          </div>
        </div>
      </div>

      {!targetKelas ? (
        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Kelas Tidak Ditemukan</h3>
          <p className="text-gray-600">
            Tidak dapat menentukan kelas untuk tahun ajaran {selectedTahunAjaran}.
            Kemungkinan Anda belum masuk sekolah atau sudah lulus pada periode tersebut.
          </p>
        </Card>
      ) : mySchedules.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Jadwal</h3>
          <p className="text-gray-600">
            Jadwal pelajaran untuk kelas {targetKelas.name} pada {selectedTahunAjaran} semester {selectedSemester} belum tersedia.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {hariOrder.map((hari) => {
            const isToday = today === hari;
            return (
              <div
                key={hari}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${
                  isToday ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
                }`}
              >
                {/* Day Header */}
                <div className={`px-5 py-3 border-b flex items-center justify-between ${
                  isToday
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    : 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isToday ? 'bg-white/20' : 'bg-slate-200'
                    }`}>
                      <Calendar className={`w-4 h-4 ${isToday ? 'text-white' : 'text-slate-600'}`} />
                    </div>
                    <h3 className={`text-base font-bold capitalize ${
                      isToday ? 'text-white' : 'text-slate-900'
                    }`}>
                      {hariLabels[hari as keyof typeof hariLabels]}
                    </h3>
                    {isToday && (
                      <span className="bg-white/90 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Hari Ini
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isToday
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {schedulesByDay[hari].length} pelajaran
                  </span>
                </div>

                {/* Schedule List */}
                <div className="p-4">
                  {schedulesByDay[hari].length > 0 ? (
                    <div className="space-y-3">
                      {schedulesByDay[hari].map((jadwal, index) => (
                        <div
                          key={jadwal.id}
                          className={`group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                            isToday
                              ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                         

                          <div className="flex flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start gap-2">
                                <div className={`mt-0.5 p-1.5 rounded-lg ${
                                  isToday ? 'bg-blue-100' : 'bg-slate-200'
                                }`}>
                                  <BookOpen className={`w-4 h-4 ${
                                    isToday ? 'text-blue-600' : 'text-slate-600'
                                  }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-slate-900 text-sm leading-tight">
                                    {getMapelName(jadwal.mataPelajaranId)}
                                  </h4>
                                  <div className="flex items-center mt-1.5 text-xs text-slate-600">
                                    <Users className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                                    <span className="truncate">{getGuruName(jadwal.guruId)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                              isToday
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{jadwal.jamMulai} - {jadwal.jamSelesai}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">Tidak ada pelajaran</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Ringkasan Jadwal</h3>
          <p className="text-sm text-slate-600 mt-0.5">Statistik jadwal pelajaran semester ini</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Mata Pelajaran */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Mata Pelajaran</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {new Set(mySchedules.map(j => j.mataPelajaranId)).size}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Total mata pelajaran</p>
                </div>
                <div className="bg-blue-600 rounded-lg p-3 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Total Jam Pelajaran */}
            <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Jam Pelajaran</p>
                  <p className="text-3xl font-bold text-emerald-900">{mySchedules.length}</p>
                  <p className="text-xs text-emerald-600 mt-1">Total jam per minggu</p>
                </div>
                <div className="bg-emerald-600 rounded-lg p-3 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Hari Aktif */}
            <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Hari Aktif</p>
                  <p className="text-3xl font-bold text-amber-900">
                    {hariOrder.filter(hari => schedulesByDay[hari].length > 0).length}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Hari dengan jadwal</p>
                </div>
                <div className="bg-amber-600 rounded-lg p-3 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Guru Pengajar */}
            <div className="group relative bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 border border-violet-100 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-2">Guru Pengajar</p>
                  <p className="text-3xl font-bold text-violet-900">
                    {new Set(mySchedules.map(j => j.guruId)).size}
                  </p>
                  <p className="text-xs text-violet-600 mt-1">Total guru mengajar</p>
                </div>
                <div className="bg-violet-600 rounded-lg p-3 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JadwalMurid;