import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, AlertCircle, ArrowLeft } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Badge from '../../../../../ui/Badge';
import { useAuth } from '../../../../../../context/AuthContext';
import { useMurid } from '../../../../../../hooks/useMurid';
import { useKelas } from '../../../../../../hooks/useKelas';
import { useTahunAjaran } from '../../../../../../hooks/useTahunAjaran';
import { useAlumni } from '../../../../../../hooks/useAlumni';
import { useNilaiEkstrakulikulerKelas } from '../../../../../../hooks/useNilaiEkstrakulikulerKelas';
import { User } from '../../../../../../types';
import { 
  getKelasForTahunAjaran, 
  getMuridForSelectedPeriod
} from '../data-murid-kelas/DataMuridKelasUtils';

const NilaiEkstrakulikulerKelas: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { murid: users } = useMurid();
  const { kelas } = useKelas();
  const { activeTahunAjaran: activeTahunAjaranFromHook } = useTahunAjaran();
  const { alumni } = useAlumni();
  
  const [searchTerm, setSearchTerm] = useState('');

  const activeTahunAjaran = activeTahunAjaranFromHook;

  // Get nilai ekstrakulikuler for all murid in the class (only for active tahun ajaran and semester)
  const { nilaiEkstrakulikuler, loading: loadingNilai } = useNilaiEkstrakulikulerKelas(
    activeTahunAjaran && user && (user as any)?.kelasWali
      ? {
          kelasId: (user as any).kelasWali,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );

  if (!user || !(user as any)?.isWaliKelas || !(user as any).kelasWali) {
    return (
      <Card className="text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
        <p className="text-gray-600">Anda tidak memiliki akses sebagai wali kelas.</p>
      </Card>
    );
  }

  let targetKelas = null;
  let kelasError = null;

  try {
    targetKelas = getKelasForTahunAjaran((user as any).kelasWali, activeTahunAjaran?.tahun || '', activeTahunAjaran || undefined, kelas);
  } catch (error) {
    if (error instanceof Error) {
      kelasError = error.message;
    }
  }

  const muridKelas = getMuridForSelectedPeriod(
    targetKelas,
    activeTahunAjaran?.tahun || '',
    activeTahunAjaran || undefined,
    users,
    kelas,
    (user as any).kelasWali,
    alumni
  );

  // Count jumlah ekstrakulikuler per murid
  const muridWithCount = useMemo(() => {
    if (!nilaiEkstrakulikuler) {
      return muridKelas.map(murid => ({
        ...murid,
        jumlahEkstrakulikuler: 0
      }));
    }

    return muridKelas.map(murid => {
      const muridData = nilaiEkstrakulikuler.muridData.find(md => md.muridId === murid.id);
      const count = muridData?.nilaiEkstrakulikuler?.length || 0;
      return {
        ...murid,
        jumlahEkstrakulikuler: count
      };
    });
  }, [muridKelas, nilaiEkstrakulikuler]);

  const filteredMurid = muridWithCount.filter(murid => {
    const muridData = murid as any;
    return murid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (muridData.nisn && muridData.nisn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      murid.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleViewDetail = (murid: User) => {
    navigate(`/dashboard/nilai-ekstrakulikuler-murid/${murid.id}`, {
      state: {
        murid,
        tahunAjaran: activeTahunAjaran?.tahun,
        semester: activeTahunAjaran?.semester,
      }
    });
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="bg-white rounded-lg p-2 sm:p-2.5">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Nilai Ekstrakulikuler</h3>
              <p className="text-xs sm:text-sm text-blue-100">Kelola nilai ekstrakulikuler murid kelas</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          <div className="mb-6">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              Cari Murid
            </label>
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Nama, NISN, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">Periode Aktif</p>
                <p className="text-sm sm:text-base font-medium text-slate-900 mt-1">
                  Kelas: <span className="text-blue-600">{targetKelas?.name || '-'}</span> • {activeTahunAjaran?.tahun || '-'} Semester {activeTahunAjaran?.semester || '-'} ({activeTahunAjaran?.semester === 1 ? 'Ganjil' : 'Genap'})
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">
                  {filteredMurid.length} murid
                </Badge>
                <Badge variant="success">Periode Aktif</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {kelasError ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Konfigurasi Tidak Lengkap</h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-4">
              {kelasError}
            </p>
            <p className="text-sm text-slate-500">
              Silakan hubungi administrator untuk mengkonfigurasi jenjang pendidikan terlebih dahulu.
            </p>
          </div>
        </div>
      ) : !targetKelas ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Kelas Tidak Ditemukan</h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
              Tidak dapat menentukan kelas untuk tahun ajaran aktif. Kemungkinan Anda belum menjadi wali kelas atau sudah tidak menjadi wali kelas pada periode tersebut.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="border-0 shadow-lg hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      NISN
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Nama Murid
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Jumlah Ekstrakulikuler
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {loadingNilai ? (
                    <tr>
                      <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-sm text-slate-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredMurid.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-sm text-slate-500">
                        Tidak ada data murid
                      </td>
                    </tr>
                  ) : (
                    filteredMurid.map((murid, index) => (
                      <tr key={murid.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-slate-900">
                          {index + 1}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-slate-900">
                          {(murid as any).nisn || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-900">
                          {murid.name}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                          <Badge variant={murid.jumlahEkstrakulikuler > 0 ? 'success' : 'secondary'}>
                            {murid.jumlahEkstrakulikuler}
                          </Badge>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewDetail(murid)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card List View */}
          <div className="lg:hidden space-y-3">
            {loadingNilai ? (
              <Card className="border-0 shadow-lg">
                <div className="p-6 text-center text-sm text-slate-500">
                  Memuat data...
                </div>
              </Card>
            ) : filteredMurid.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <div className="p-6 text-center text-sm text-slate-500">
                  Tidak ada data murid
                </div>
              </Card>
            ) : (
              filteredMurid.map((murid, index) => (
                <Card key={murid.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="p-4 space-y-3">
                    {/* Header dengan Nomor dan Nama */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-base truncate">{murid.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">NISN: {(murid as any).nisn || '-'}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant={murid.jumlahEkstrakulikuler > 0 ? 'success' : 'secondary'}>
                          {murid.jumlahEkstrakulikuler}
                        </Badge>
                      </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Jumlah Ekstrakulikuler</span>
                        <span className="text-sm font-semibold text-slate-900">{murid.jumlahEkstrakulikuler} kegiatan</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleViewDetail(murid)}
                      className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium"
                    >
                      Lihat Detail
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NilaiEkstrakulikulerKelas;

