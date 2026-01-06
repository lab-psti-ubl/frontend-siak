import React from 'react';
import Modal from '../../../ui/Modal';
import Badge from '../../../ui/Badge';
import { getGradeColor, calculateRataKomponen, getMaxKomponenDinamisInfo } from '../../../../utils/nilaiUtils';
import { useKomponenNilai } from '../../../../hooks/useKomponenNilai';
import { Nilai } from '../../../../types';

interface NilaiMuridDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapelName: string;
  guruName: string;
  kelasName: string;
  semester: number;
  tahunAjaran: string;
  kehadiran: number;
  rataTugas: number;
  nilaiMurid: Nilai | undefined;
  allNilaiKelas?: Nilai[]; // All nilai in the same class for max count calculation
}

const NilaiMuridDetailModal: React.FC<NilaiMuridDetailModalProps> = ({
  isOpen,
  onClose,
  mapelName,
  guruName,
  kelasName,
  semester,
  tahunAjaran,
  kehadiran,
  rataTugas,
  nilaiMurid,
  allNilaiKelas = []
}) => {
  const { komponenNilai: semuaKomponen } = useKomponenNilai();

  // Get max komponen dinamis info
  const maxKomponenDinamisInfo = React.useMemo(() => 
    getMaxKomponenDinamisInfo(allNilaiKelas), 
    [allNilaiKelas]
  );

  // Default values
  const defaultKomponen = {
    kehadiran: 20,
    tugas: 30,
    uts: 25,
    uas: 25
  };

  // Get komponen values dari data API
  const KOMPONEN_NILAI = {
    kehadiran: semuaKomponen.find(k => k.nama === 'Kehadiran')?.persentase ?? defaultKomponen.kehadiran,
    tugas: semuaKomponen.find(k => k.nama === 'Tugas')?.persentase ?? defaultKomponen.tugas,
    uts: semuaKomponen.find(k => k.nama === 'UTS')?.persentase ?? defaultKomponen.uts,
    uas: semuaKomponen.find(k => k.nama === 'UAS')?.persentase ?? defaultKomponen.uas,
  };

  const getDynamicKomponen = () => {
    return semuaKomponen.filter(k => !['Kehadiran', 'Tugas', 'UTS', 'UAS'].includes(k.nama));
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Nilai - ${mapelName}`}
      size="xl"
     
    >
      <div className="space-y-6 mb-12">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Mata Pelajaran:</span>
              <span className="font-semibold text-gray-900">{mapelName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Guru:</span>
              <span className="font-semibold text-gray-900">{guruName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Kelas:</span>
              <span className="font-semibold text-gray-900">{kelasName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Semester:</span>
              <span className="font-semibold text-gray-900">{semester} ({tahunAjaran})</span>
            </div>
          </div>
        </div>

        <div className={`grid gap-3 md:gap-4 ${getDynamicKomponen().length > 0 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'}`}>
          <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl text-center border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{kehadiran.toFixed(1)}%</div>
            <div className="text-sm font-medium text-blue-700 mb-2">Kehadiran</div>
            <div className="text-xs text-gray-600 bg-white/60 rounded-lg py-1 px-2">
              {((kehadiran / 100) * KOMPONEN_NILAI.kehadiran).toFixed(1)} poin
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl text-center border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl md:text-3xl font-bold text-emerald-600 mb-1">{rataTugas.toFixed(1)}</div>
            <div className="text-sm font-medium text-emerald-700 mb-2">Rata Tugas</div>
            <div className="text-xs text-gray-600 bg-white/60 rounded-lg py-1 px-2">
              {((rataTugas / 100) * KOMPONEN_NILAI.tugas).toFixed(1)} poin
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl text-center border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">
              {nilaiMurid?.uts !== null ? nilaiMurid?.uts : '-'}
            </div>
            <div className="text-sm font-medium text-orange-700 mb-2">UTS</div>
            <div className="text-xs text-gray-600 bg-white/60 rounded-lg py-1 px-2">
              {nilaiMurid?.uts ? ((nilaiMurid.uts / 100) * KOMPONEN_NILAI.uts).toFixed(1) : '0'} poin
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl text-center border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl md:text-3xl font-bold text-rose-600 mb-1">
              {nilaiMurid?.uas !== null ? nilaiMurid?.uas : '-'}
            </div>
            <div className="text-sm font-medium text-rose-700 mb-2">UAS</div>
            <div className="text-xs text-gray-600 bg-white/60 rounded-lg py-1 px-2">
              {nilaiMurid?.uas ? ((nilaiMurid.uas / 100) * KOMPONEN_NILAI.uas).toFixed(1) : '0'} poin
            </div>
          </div>
          {getDynamicKomponen().map((k, index) => {
            const komponenValues = nilaiMurid?.komponenDinamis?.filter(kd => kd.komponenNama === k.nama) ?? [];
            const maxCount = maxKomponenDinamisInfo[k.nama] || null;
            const rataKomponen = komponenValues.length > 0 ? calculateRataKomponen(komponenValues, maxCount) : null;
            const skorKomponen = rataKomponen ? ((rataKomponen / 100) * k.persentase).toFixed(1) : '0';
            const colorClasses = [
              'from-purple-50 to-purple-100/50 border-purple-100 text-purple-600 text-purple-700',
              'from-violet-50 to-violet-100/50 border-violet-100 text-violet-600 text-violet-700',
              'from-cyan-50 to-cyan-100/50 border-cyan-100 text-cyan-600 text-cyan-700',
              'from-fuchsia-50 to-fuchsia-100/50 border-fuchsia-100 text-fuchsia-600 text-fuchsia-700',
              'from-lime-50 to-lime-100/50 border-lime-100 text-lime-600 text-lime-700',
              'from-indigo-50 to-indigo-100/50 border-indigo-100 text-indigo-600 text-indigo-700'
            ];
            const selectedColor = colorClasses[index % colorClasses.length];
            const [bgGradient, textColor, borderColor] = selectedColor.split(' ').slice(0, 3);
            return (
              <div key={k.id} className={`p-5 bg-gradient-to-br ${bgGradient} rounded-xl text-center border ${borderColor} shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`text-2xl md:text-3xl font-bold mb-1 ${textColor}`}>
                  {rataKomponen !== null ? rataKomponen.toFixed(1) : '-'}
                </div>
                <div className={`text-sm font-medium mb-2 ${textColor}`}>{k.nama}</div>
                <div className="text-xs text-gray-600 bg-white/60 rounded-lg py-1 px-2">
                  {skorKomponen} poin
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative overflow-hidden p-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl text-center shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
          <div className="relative">
            <h4 className="text-lg font-semibold text-white/90 mb-3">Nilai Akhir</h4>
            <div className="text-5xl md:text-6xl font-bold text-white mb-4">
              {nilaiMurid?.nilaiAkhir !== null ? nilaiMurid?.nilaiAkhir?.toFixed(1) : '-'}
            </div>
            {nilaiMurid?.grade && (
              <div className={`inline-flex px-8 py-3 rounded-xl text-xl font-bold shadow-lg ${getGradeColor(nilaiMurid.grade)}`}>
                Grade {nilaiMurid.grade}
              </div>
            )}
          </div>
        </div>

        {nilaiMurid && nilaiMurid.tugas.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full mr-2"></span>
              Riwayat Tugas
            </h4>
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {nilaiMurid.tugas.map((tugas) => (
                <div key={tugas.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 hover:shadow-sm transition-shadow">
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 block mb-1">{tugas.nama}</span>
                    {tugas.keterangan && (
                      <span className="text-sm text-gray-600">({tugas.keterangan})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      {new Date(tugas.tanggal).toLocaleDateString('id-ID')}
                    </span>
                    <Badge variant="success" className="text-base font-bold">{tugas.nilai}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {nilaiMurid && nilaiMurid.komponenDinamis && nilaiMurid.komponenDinamis.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-1 h-5 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full mr-2"></span>
              Riwayat Komponen Nilai Tambahan
            </h4>
            <div className="space-y-4">
              {getDynamicKomponen().map((komp) => {
                const kompValues = nilaiMurid.komponenDinamis?.filter(kd => kd.komponenNama === komp.nama) ?? [];
                if (kompValues.length === 0) return null;

                return (
                  <div key={komp.id}>
                    <h5 className="font-medium text-gray-800 mb-2 text-sm">{komp.nama}</h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {kompValues.map((val) => (
                        <div key={val.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 block text-sm">{val.komponenNama}</span>
                            {val.keterangan && (
                              <span className="text-xs text-gray-600">({val.keterangan})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-gray-500 hidden sm:inline">
                              {new Date(val.tanggal).toLocaleDateString('id-ID')}
                            </span>
                            <Badge variant="success" className="text-sm font-bold">{val.nilai}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full mr-2"></span>
            Rincian Perhitungan Nilai
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
              <span className="text-gray-700">Kehadiran ({KOMPONEN_NILAI.kehadiran}%):</span>
              <span className="font-semibold text-gray-900">
                {kehadiran.toFixed(1)}% × {KOMPONEN_NILAI.kehadiran}% = <span className="text-blue-600">{((kehadiran / 100) * KOMPONEN_NILAI.kehadiran).toFixed(1)}</span> poin
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
              <span className="text-gray-700">Tugas ({KOMPONEN_NILAI.tugas}%):</span>
              <span className="font-semibold text-gray-900">
                {rataTugas.toFixed(1)} × {KOMPONEN_NILAI.tugas}% = <span className="text-emerald-600">{((rataTugas / 100) * KOMPONEN_NILAI.tugas).toFixed(1)}</span> poin
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
              <span className="text-gray-700">UTS ({KOMPONEN_NILAI.uts}%):</span>
              <span className="font-semibold text-gray-900">
                {nilaiMurid?.uts || 0} × {KOMPONEN_NILAI.uts}% = <span className="text-orange-600">{nilaiMurid?.uts ? ((nilaiMurid.uts / 100) * KOMPONEN_NILAI.uts).toFixed(1) : '0'}</span> poin
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
              <span className="text-gray-700">UAS ({KOMPONEN_NILAI.uas}%):</span>
              <span className="font-semibold text-gray-900">
                {nilaiMurid?.uas || 0} × {KOMPONEN_NILAI.uas}% = <span className="text-rose-600">{nilaiMurid?.uas ? ((nilaiMurid.uas / 100) * KOMPONEN_NILAI.uas).toFixed(1) : '0'}</span> poin
              </span>
            </div>
            {getDynamicKomponen().map((k) => {
              const komponenValues = nilaiMurid?.komponenDinamis?.filter(kd => kd.komponenNama === k.nama) ?? [];
              const rataKomponen = komponenValues.length > 0 ? calculateRataKomponen(komponenValues) : null;
              return (
                <div key={k.id} className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                  <span className="text-gray-700">{k.nama} ({k.persentase}%):</span>
                  <span className="font-semibold text-gray-900">
                    {rataKomponen !== null ? rataKomponen.toFixed(1) : '0'} × {k.persentase}% = <span className="text-blue-600">{rataKomponen ? ((rataKomponen / 100) * k.persentase).toFixed(1) : '0'}</span> poin
                  </span>
                </div>
              );
            })}
            <div className="border-t-2 border-amber-300 pt-3 flex justify-between items-center p-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg">
              <span className="font-bold text-gray-900">Total Nilai Akhir:</span>
              <span className="text-xl font-bold text-blue-600">{nilaiMurid?.nilaiAkhir?.toFixed(1) || '0'} poin</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NilaiMuridDetailModal;
