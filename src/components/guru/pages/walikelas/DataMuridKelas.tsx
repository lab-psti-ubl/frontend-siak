import React, { useState, useEffect } from 'react';
import { Users, Search, AlertCircle } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { useAuth } from '../../../../context/AuthContext';
import { useMurid } from '../../../../hooks/useMurid';
import { useKelas } from '../../../../hooks/useKelas';
import { useAbsensi } from '../../../../hooks/useAbsensi';
import { useTahunAjaran } from '../../../../hooks/useTahunAjaran';
import { useAlumni } from '../../../../hooks/useAlumni';
import { apiService } from '../../../../services/apiService';
import { User } from '../../../../types';
import { generateQRCodeData, generateQRCodeURL, downloadQRCode } from '../../../../utils/qrCodeGenerator';
import DataMuridKelasStatsCards from './components/data-murid-kelas/DataMuridKelasStatsCards';
import DataMuridKelasTable from './components/data-murid-kelas/DataMuridKelasTable';
import DataMuridKelasDetailModal from './components/data-murid-kelas/DataMuridKelasDetailModal';
import DataMuridKelasEditModal from './components/data-murid-kelas/DataMuridKelasEditModal';
import DataMuridKelasQRModal from './components/data-murid-kelas/DataMuridKelasQRModal';
import DataMuridKelasHeader from './components/data-murid-kelas/DataMuridKelasHeader';
import { 
  getKelasForTahunAjaran, 
  getMuridForSelectedPeriod, 
  getAttendanceStats as getAttendanceStatsUtil,
  exportMuridData 
} from './components/data-murid-kelas/DataMuridKelasUtils';

const DataMuridKelas: React.FC = () => {
  const { user } = useAuth();
  
  // Use hooks instead of localStorage
  // Fetch all murid (not filtered) because getMuridForSelectedPeriod needs to filter by different kelas for historical periods
  const { murid: users, refreshMurid } = useMurid();
  const { kelas } = useKelas();
  const { absensi } = useAbsensi();
  // useTahunAjaran menggunakan cache global yang menyimpan data lengkap termasuk tanggal akademik (tanggalMulai, tanggalSelesai)
  // Cache ini digunakan untuk mendapatkan bulan dari kalender akademik di modal detail
  const { tahunAjaran, activeTahunAjaran: activeTahunAjaranFromHook } = useTahunAjaran();
  const { alumni } = useAlumni(); // Untuk memastikan murid yang sudah alumni dikeluarkan dari daftar
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMurid, setSelectedMurid] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeURL, setQrCodeURL] = useState<string>('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    nisn: '',
    whatsappOrtu: '',
  });
  
  // Filter state untuk tahun ajaran, semester, dan bulan
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear] = useState<number>(new Date().getFullYear());

  // Initialize selectedTahunAjaran and selectedSemester from activeTahunAjaran
  useEffect(() => {
    if (activeTahunAjaranFromHook) {
      setSelectedTahunAjaran(activeTahunAjaranFromHook.tahun);
      setSelectedSemester(activeTahunAjaranFromHook.semester);
    }
  }, [activeTahunAjaranFromHook]);

  if (!user?.isWaliKelas || !user.kelasWali) {
    return (
      <Card className="text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
        <p className="text-gray-600">Anda tidak memiliki akses sebagai wali kelas.</p>
      </Card>
    );
  }

  const activeTahunAjaran = activeTahunAjaranFromHook || tahunAjaran.find(ta => ta.isActive);

  let targetKelas = null;
  let kelasError = null;

  try {
    targetKelas = getKelasForTahunAjaran(user.kelasWali, selectedTahunAjaran, activeTahunAjaran, kelas);
  } catch (error) {
    if (error instanceof Error) {
      kelasError = error.message;
    }
  }

  const muridKelas = getMuridForSelectedPeriod(
    targetKelas,
    selectedTahunAjaran,
    activeTahunAjaran,
    users,
    kelas,
    user.kelasWali,
    alumni
  );

  const filteredMurid = muridKelas.filter(murid =>
    murid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    murid.nisn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    murid.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceStats = (muridId: string, month?: number, year?: number) => {
    return getAttendanceStatsUtil(
      muridId,
      targetKelas,
      selectedTahunAjaran,
      selectedSemester,
      month || selectedMonth,
      year || selectedYear,
      absensi,
      tahunAjaran
    );
  };

  const handleViewDetail = (murid: User) => {
    setSelectedMurid(murid);
    setIsDetailModalOpen(true);
  };

  const handleEditMurid = (murid: User) => {
    setSelectedMurid(murid);
    setEditFormData({
      name: murid.name,
      email: murid.email,
      nisn: murid.nisn || '',
      whatsappOrtu: murid.whatsappOrtu || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateMurid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMurid) return;

    // Validate required fields
    if (!editFormData.name.trim() || !editFormData.email.trim() || !editFormData.nisn.trim()) {
      alert('Semua field wajib harus diisi!');
      return;
    }

    try {
      const muridData = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        nisn: editFormData.nisn.trim(),
        whatsappOrtu: editFormData.whatsappOrtu.trim() || undefined,
      };

      const response = await apiService.updateMurid(selectedMurid.id, muridData);

      if (response.success) {
        alert('Data murid berhasil diperbarui!');
        // Refresh murid data
        await refreshMurid(true);
        setIsEditModalOpen(false);
        setSelectedMurid(null);
      } else {
        alert(response.message || 'Gagal memperbarui data murid');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message?.includes('NISN sudah terdaftar')) {
        alert('NISN sudah digunakan oleh murid lain!');
      } else if (err.message?.includes('Email sudah terdaftar')) {
        alert('Email sudah digunakan oleh pengguna lain!');
      } else {
        alert(err.message || 'Terjadi kesalahan saat memperbarui data murid');
      }
    }
  };

  const handleDeleteMurid = async (murid: User) => {
    if (confirm(`Apakah Anda yakin ingin menghapus murid ${murid.name}?`)) {
      try {
        const response = await apiService.deleteMurid(murid.id);
        if (response.success) {
          alert('Murid berhasil dihapus!');
          // Refresh murid data
          await refreshMurid(true);
        } else {
          alert(response.message || 'Gagal menghapus murid');
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        alert(err.message || 'Terjadi kesalahan saat menghapus murid');
      }
    }
  };

  const handleViewQR = async (murid: User) => {
    setSelectedMurid(murid);
    const qrData = generateQRCodeData(murid.id, murid.nisn || '', murid.name, murid.kelasId || '');
    const url = await generateQRCodeURL(qrData, 300);
    setQrCodeURL(url);
    setIsQRModalOpen(true);
  };

  const handleDownloadQR = async (murid: User) => {
    const qrData = generateQRCodeData(murid.id, murid.nisn || '', murid.name, murid.kelasId || '');
    await downloadQRCode(qrData, `qr-${murid.name.replace(/\s+/g, '-')}`);
  };

  const handleExportMuridData = () => {
    exportMuridData(
      filteredMurid,
      targetKelas,
      selectedTahunAjaran,
      selectedSemester,
      selectedMonth,
      selectedYear,
      getAttendanceStats
    );
  };


  // Calculate overall stats for the selected period
  const overallStats = filteredMurid.reduce((acc, murid) => {
    const stats = getAttendanceStats(murid.id);
    acc.totalHadir += stats.hadir;
    acc.totalIzin += stats.izin;
    acc.totalSakit += stats.sakit;
    acc.totalAlfa += stats.alfa;
    acc.totalHari += stats.totalHari;
    return acc;
  }, {
    totalHadir: 0,
    totalIzin: 0,
    totalSakit: 0,
    totalAlfa: 0,
    totalHari: 0
  });

  const classAttendanceRate = overallStats.totalHari > 0 ?
    ((overallStats.totalHadir / overallStats.totalHari) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-5 lg:space-y-6">
      <DataMuridKelasHeader
        myKelas={targetKelas}
        onExportData={handleExportMuridData}
      />

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
              Tidak dapat menentukan kelas untuk tahun ajaran {selectedTahunAjaran}. Kemungkinan Anda belum menjadi wali kelas atau sudah tidak menjadi wali kelas pada periode tersebut.
            </p>
          </div>
        </div>
      ) : (
        <>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2 sm:p-2.5">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Daftar Murid Kelas</h3>
              <p className="text-xs sm:text-sm text-blue-100">Kelola data murid Anda</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="flex-1">
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
            <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
              <select
                value={selectedTahunAjaran}
                onChange={(e) => setSelectedTahunAjaran(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                {tahunAjaran.map(ta => (
                  <option key={ta.tahun} value={ta.tahun}>{ta.tahun}</option>
                ))}
              </select>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value={1}>Semester 1 (Ganjil)</option>
                <option value={2}>Semester 2 (Genap)</option>
              </select>
            </div>
          </div>

          <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide">Periode Aktif</p>
                <p className="text-sm sm:text-base font-medium text-slate-900 mt-1">
                  Kelas: <span className="text-blue-600">{targetKelas?.name || '-'}</span> • {selectedTahunAjaran} Semester {selectedSemester}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">
                  {filteredMurid.length} murid
                </Badge>
                {selectedTahunAjaran === activeTahunAjaran?.tahun && selectedSemester === activeTahunAjaran?.semester && (
                  <Badge variant="success">Periode Aktif</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DataMuridKelasStatsCards
        muridKelas={muridKelas}
        overallStats={overallStats}
        classAttendanceRate={classAttendanceRate}
      />

      <DataMuridKelasTable
        muridKelas={muridKelas}
        filteredMurid={filteredMurid}
        searchTerm={searchTerm}
        targetKelas={targetKelas}
        selectedTahunAjaran={selectedTahunAjaran}
        selectedSemester={selectedSemester}
        activeTahunAjaran={activeTahunAjaran}
        getAttendanceStats={getAttendanceStats}
        onViewDetail={handleViewDetail}
        onEditMurid={handleEditMurid}
        onDeleteMurid={handleDeleteMurid}
        onViewQR={handleViewQR}
        onDownloadQR={handleDownloadQR}
      />

        </>
      )}

      {targetKelas && (
        <>
          <DataMuridKelasDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedMurid(null);
            }}
            selectedMurid={selectedMurid}
            targetKelas={targetKelas}
            selectedTahunAjaran={selectedTahunAjaran}
            selectedSemester={selectedSemester}
            tahunAjaran={tahunAjaran}
            absensi={absensi}
            getAttendanceStats={getAttendanceStats}
          />

          <DataMuridKelasEditModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedMurid(null);
            }}
            selectedMurid={selectedMurid}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            onUpdateMurid={handleUpdateMurid}
          />

          <DataMuridKelasQRModal
            isOpen={isQRModalOpen}
            onClose={() => {
              setIsQRModalOpen(false);
              setSelectedMurid(null);
              setQrCodeURL('');
            }}
            selectedMurid={selectedMurid}
            qrCodeURL={qrCodeURL}
            targetKelas={targetKelas}
            kelas={kelas}
            onDownloadQR={handleDownloadQR}
          />
        </>
      )}
    </div>
  );
};

export default DataMuridKelas;