import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, AlertCircle, ArrowLeft, BookOpen } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { useAuth } from '../../../../context/AuthContext';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useAlumni } from '../../../../hooks/useAlumni';
import { useKokulikuler } from '../../../../hooks/useKokulikuler';
import { apiService } from '../../../../services/apiService';
import { User } from '../../../../types';
import { 
  getKelasForTahunAjaran, 
  getMuridForSelectedPeriod
} from './components/data-murid-kelas/DataMuridKelasUtils';
import DetailKokulikulerMurid from './components/kokulikuler/DetailKokulikulerMurid';

const KokulikulerKelas: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { murid: users } = useMurid();
  const { kelas } = useKelas();
  const { tahunAjaran, activeTahunAjaran: activeTahunAjaranFromHook } = useTahunAjaran();
  const { alumni } = useAlumni();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const activeTahunAjaran = activeTahunAjaranFromHook || tahunAjaran.find(ta => ta.isActive);

  // Get kokulikuler data for the class
  const { kokulikuler, loading: loadingKokulikuler, refreshKokulikuler } = useKokulikuler(
    activeTahunAjaran && user && (user as any)?.kelasWali
      ? {
          kelasId: (user as any).kelasWali,
          tahunAjaran: activeTahunAjaran.tahun,
          semester: activeTahunAjaran.semester,
        }
      : undefined
  );

  // Removed auto-initialization useEffect
  // Data will only be created/updated when user explicitly saves kokulikuler data

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

  // Only show active students
  const activeMuridKelas = muridKelas.filter(m => (m as any).isActive !== false);

  // Map murid with kokulikuler data
  const muridWithKokulikuler = useMemo(() => {
    if (!kokulikuler) {
      return activeMuridKelas.map(m => ({
        ...m,
        kokulikuler: '',
      }));
    }

    return activeMuridKelas.map(m => {
      const muridData = kokulikuler.muridData.find(md => md.muridId === m.id);
      return {
        ...m,
        kokulikuler: muridData?.kokulikuler || '',
      };
    });
  }, [activeMuridKelas, kokulikuler]);

  const filteredMurid = muridWithKokulikuler.filter(murid => {
    const muridData = murid as any;
    return murid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (muridData.nisn && muridData.nisn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      murid.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      murid.kokulikuler.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleViewDetail = (murid: User & { kokulikuler: string }) => {
    setSelectedMurid(murid);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedMurid(null);
  };

  const handleSaveKokulikuler = async (muridId: string, kokulikulerValue: string) => {
    try {
      if (!activeTahunAjaran) return;

      // Always use updateKokulikulerMurid - backend will create data if it doesn't exist
      await apiService.updateKokulikulerMurid({
        kelasId: (user as any).kelasWali,
        tahunAjaran: activeTahunAjaran.tahun,
        semester: activeTahunAjaran.semester,
        muridId,
        kokulikuler: kokulikulerValue,
        waliKelasId: user.id, // Pass waliKelasId so backend can create data if needed
      });

      await refreshKokulikuler();
      handleCloseDetail();
    } catch (error: any) {
      alert(error.message || 'Gagal menyimpan kokulikuler');
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-purple-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="bg-white rounded-lg p-2 sm:p-2.5">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Kokulikuler</h3>
              <p className="text-xs sm:text-sm text-purple-100">Kelola kokulikuler murid kelas</p>
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
                placeholder="Nama, NISN, email, atau kokulikuler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-sm sm:text-base placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              />
            </div>
          </div>

          <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">Periode Aktif</p>
                <p className="text-sm sm:text-base font-medium text-slate-900 mt-1">
                  Kelas: <span className="text-purple-600">{targetKelas?.name || '-'}</span> • {activeTahunAjaran?.tahun || '-'} Semester {activeTahunAjaran?.semester || '-'} ({activeTahunAjaran?.semester === 1 ? 'Ganjil' : 'Genap'})
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
                      Kokulikuler
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {loadingKokulikuler ? (
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
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-600 max-w-md truncate">
                          {murid.kokulikuler || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewDetail(murid)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium"
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
            {loadingKokulikuler ? (
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
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-base truncate">{murid.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">NISN: {(murid as any).nisn || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Kokulikuler</span>
                        <p className="text-sm text-slate-900 line-clamp-2">
                          {murid.kokulikuler || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleViewDetail(murid)}
                      className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors text-sm font-medium"
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

      {/* Detail Modal */}
      {selectedMurid && (
        <DetailKokulikulerMurid
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          murid={selectedMurid}
          onSave={handleSaveKokulikuler}
        />
      )}
    </div>
  );
};

export default KokulikulerKelas;

