import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, UserCheck, Settings, Search, Filter, Eye, Phone, Mail, Car as IdCard, Users, Upload, ChevronRight, GripVertical, Sliders, QrCode, Download } from 'lucide-react';
import { User, Kelas } from '../../../../types';
import { useAuth } from '../../../../context/AuthContext';
import { useGurus } from '../../../../hooks/useGurus';
import { useKelas } from '../../../../hooks/useKelas';
import { apiService } from '../../../../services/apiService';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import TambahGuruForm from '../../forms/TambahGuruForm';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import ExcelImportModalGuru from './ExcelImportModalGuru';
import { GuruImportData, createGuruFromImport } from '../../../../utils/excelGuruImport';
import { showSuccessToast, showErrorToast } from '../../../ui/ToastContainer';
import PhotoPreviewModal from '../../../ui/PhotoPreviewModal';
import WaliKelasSettingsModal from './components/WaliKelasSettingsModal';
import { getWaliKelasSettingsSync, getSystemLabel } from '../../../../utils/waliKelasSystemUtils';
import { generateTeacherAttendanceQRCode, generateQRCodeURL, downloadQRCode } from '../../../../utils/qrCodeGenerator';
import { generateAllGuruKartuPegawai } from '../../../../utils/kartuPegawaiUtils';
import { useBackgroundKTA } from '../../../../hooks/useBackgroundKTA';
import { useOnboardingTourContext } from '../../../../context/OnboardingTourContext';

const ManajemenGuru: React.FC = () => {
  const { user } = useAuth();
  const { refreshTour } = useOnboardingTourContext();
  const { gurus, loading: gurusLoading, refreshGurus } = useGurus();
  const { kelas, refreshKelas } = useKelas();
  const { backgroundKTA } = useBackgroundKTA();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [isWaliKelasSettingsOpen, setIsWaliKelasSettingsOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<User | null>(null);
  const [selectedGuru, setSelectedGuru] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [qrCodeURL, setQrCodeURL] = useState<string>('');
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const [isDownloadingAllKTA, setIsDownloadingAllKTA] = useState(false);
  const [ktaDownloadProgress, setKtaDownloadProgress] = useState({ current: 0, total: 0 });
  const [isOrientationModalOpen, setIsOrientationModalOpen] = useState(false);
  const [selectedOrientation, setSelectedOrientation] = useState<'potrait' | 'landscape'>('potrait');

  const isKepalaSekolah = user?.role === 'kepala_sekolah';

  const filteredGurus = gurus.filter(guru => {
    const matchesSearch = guru.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guru.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (guru.nip && guru.nip.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && guru.isActive !== false) ||
                         (statusFilter === 'inactive' && guru.isActive === false);
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (guru: User) => {
    setEditingGuru(guru);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingGuru(null);
    setIsFormOpen(true);
  };

  const handleViewDetail = (guru: User) => {
    setSelectedGuru(guru);
    setIsDetailModalOpen(true);
  };

  // Generate QR Code when selected guru changes
  useEffect(() => {
    const generateQR = async () => {
      if (selectedGuru && selectedGuru.nip) {
        setQrCodeLoading(true);
        try {
          const qrData = generateTeacherAttendanceQRCode(selectedGuru.id, selectedGuru.name, selectedGuru.kelasWali, selectedGuru.nip);
          const url = await generateQRCodeURL(qrData, 300);
          setQrCodeURL(url);
        } catch (error) {
          console.error('Error generating QR code:', error);
          setQrCodeURL('');
        }
        setQrCodeLoading(false);
      } else {
        setQrCodeURL('');
        setQrCodeLoading(false);
      }
    };

    generateQR();
  }, [selectedGuru]);

  const handleDownloadQR = async () => {
    if (selectedGuru && selectedGuru.nip) {
      try {
        const qrData = generateTeacherAttendanceQRCode(selectedGuru.id, selectedGuru.name, selectedGuru.kelasWali, selectedGuru.nip);
        await downloadQRCode(qrData, `qr-code-guru-${selectedGuru.name.replace(/\s+/g, '-')}`);
        showSuccessToast('Berhasil', 'QR Code berhasil didownload');
      } catch (error) {
        console.error('Error downloading QR code:', error);
        showErrorToast('Error', 'Gagal mendownload QR Code');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const guru = gurus.find(u => u.id === id);
    if (!guru) return;

    showDangerConfirmation(
      'Hapus Data Guru',
      `Apakah Anda yakin ingin menghapus guru "${guru.name}"?\n\nTindakan ini tidak dapat dibatalkan dan akan:\n• Menghapus semua data guru\n• Melepas jabatan wali kelas jika ada\n• Menghapus assignment mata pelajaran`,
      async () => {
        try {
          const response = await apiService.deleteGuru(id);
          if (response.success) {
            showSuccessToast('Berhasil', 'Guru berhasil dihapus');
            refreshGurus();
            refreshKelas();
          } else {
            showErrorToast('Error', response.message || 'Gagal menghapus guru');
          }
        } catch (error: any) {
          showErrorToast('Error', error.message || 'Terjadi kesalahan saat menghapus guru');
        }
      },
      {
        confirmText: 'Ya, Hapus Guru',
        cancelText: 'Batal'
      }
    );
  };

  const getKelasName = (kelasId: string) => {
    const kelasItem = kelas.find(k => k.id === kelasId);
    return kelasItem?.name || 'Tidak ada';
  };

  const toggleGuruStatus = async (id: string) => {
    const guru = gurus.find(u => u.id === id);
    if (!guru) return;

    try {
      const response = await apiService.updateGuru(id, {
        isActive: guru.isActive === false ? true : false,
      });
      if (response.success) {
        showSuccessToast('Berhasil', `Guru berhasil ${response.guru?.isActive ? 'diaktifkan' : 'dinonaktifkan'}`);
        refreshGurus();
      } else {
        showErrorToast('Error', response.message || 'Gagal mengubah status guru');
      }
    } catch (error: any) {
      showErrorToast('Error', error.message || 'Terjadi kesalahan saat mengubah status guru');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleImportExcel = async (importedData: GuruImportData[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const data of importedData) {
        try {
          const guruData = createGuruFromImport(data);
          const response = await apiService.createGuru(guruData);
          if (response.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        showSuccessToast('Import Berhasil', `Berhasil mengimport ${successCount} guru${errorCount > 0 ? `, ${errorCount} gagal` : ''}`);
        refreshGurus();
        refreshKelas();
        // Refresh tour untuk menampilkan modal berikutnya
        // Note: refreshTour() akan otomatis di-skip jika user klik "Nanti Saja" di menu ini
        setTimeout(() => {
          refreshTour();
        }, 100);
      } else {
        showErrorToast('Import Gagal', 'Tidak ada guru yang berhasil diimport');
      }
    } catch (error: any) {
      showErrorToast('Error', error.message || 'Terjadi kesalahan saat import guru');
    }
  };

  const handleWhatsAppCall = (phone: string) => {
    if (!phone) {
      alert('Nomor telepon tidak tersedia');
      return;
    }
    
    let formattedPhone = phone.replace(/\D/g, '');
    
    if (!formattedPhone.startsWith('62') && formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('62') && !formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone;
    }
    
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const activeGuruCount = gurus.filter(g => g.isActive !== false).length;
  const waliKelasCount = gurus.filter(g => g.isWaliKelas).length;

  const handleOpenOrientationModal = () => {
    setIsOrientationModalOpen(true);
  };

  const handleDownloadAllKTA = async (orientation: 'potrait' | 'landscape') => {
    if (gurus.length === 0) {
      showErrorToast('Error', 'Tidak ada guru yang dapat didownload');
      return;
    }

    setIsOrientationModalOpen(false);
    setIsDownloadingAllKTA(true);
    setKtaDownloadProgress({ current: 0, total: gurus.length });

    try {
      // Create kelas map for quick lookup
      const kelasMap = new Map<string, Kelas>();
      kelas.forEach(k => {
        kelasMap.set(k.id, k);
      });

      const backgroundDepan = backgroundKTA?.backgroundDepanGuruBase64;
      const backgroundBelakang = backgroundKTA?.backgroundBelakangGuruBase64;

      await generateAllGuruKartuPegawai(
        gurus,
        kelasMap,
        backgroundDepan,
        backgroundBelakang,
        orientation,
        (current, total) => {
          setKtaDownloadProgress({ current, total });
        }
      );

      showSuccessToast('Berhasil', `Berhasil download ${gurus.length} KTA guru`);
    } catch (error) {
      console.error('Error downloading all KTA:', error);
      showErrorToast('Error', 'Gagal mendownload semua KTA guru. Silakan coba lagi.');
    } finally {
      setIsDownloadingAllKTA(false);
      setKtaDownloadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-700 to-blue-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Data Guru
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Kelola data guru dan wali kelas {gurus.length > 0 && `(${gurus.length} guru)`}
              </p>
            </div>
            {!isKepalaSekolah && (
              <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  variant="secondary"
                  className="flex items-center justify-center text-xs sm:text-sm"
                >
                  <Upload size={14} className="sm:mr-2" />
                  <span>Import Excel</span>
                </Button>
                <Button
                  onClick={handleAdd}
                  className="flex items-center justify-center text-xs sm:text-sm bg-green-600"
                >
                  <Plus size={14} className="sm:mr-2" />
                  <span >Tambah Guru</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Total Guru</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{gurus.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Guru Aktif</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{activeGuruCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-500 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <p className="text-xs sm:text-sm ml-2 text-slate-600">Wali Kelas</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{waliKelasCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Cari nama, email, atau NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            Menampilkan <span className="font-semibold text-slate-900">{filteredGurus.length}</span> dari <span className="font-semibold text-slate-900">{gurus.length}</span> guru
          </div>
        </div>
      </div>

      {/* Download KTA Section - Above Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Download Kartu Pegawai</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Download semua KTA guru dalam format ZIP</p>
            </div>
            <Button
              onClick={handleOpenOrientationModal}
              disabled={isDownloadingAllKTA || gurus.length === 0}
              variant="secondary"
              className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap"
            >
              {isDownloadingAllKTA ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="hidden sm:inline">
                    Downloading... ({ktaDownloadProgress.current}/{ktaDownloadProgress.total})
                  </span>
                  <span className="sm:hidden">
                    {ktaDownloadProgress.current}/{ktaDownloadProgress.total}
                  </span>
                </>
              ) : (
                <>
                  <Download size={14} className="sm:w-4 sm:h-4" />
                  <span>Download Semua KTA</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Guru List - Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Daftar Guru</h3>
            {!isKepalaSekolah && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsWaliKelasSettingsOpen(true)}
                className="flex items-center gap-2"
                title="Pengaturan sistem wali kelas"
              >
                <Sliders size={14} />
                <span className="text-xs">Pengaturan Wali Kelas</span>
                <Badge variant="info" className="text-xs ml-1">
                  {getSystemLabel(getWaliKelasSettingsSync().system)}
                </Badge>
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableCell header className="text-sm">Guru</TableCell>
                <TableCell header className="text-sm">Kontak</TableCell>
                <TableCell header className="text-sm">NIP</TableCell>
                <TableCell header className="text-sm">Status</TableCell>
                <TableCell header className="text-sm">Wali Kelas</TableCell>
                <TableCell header className="text-sm">Aksi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGurus.map((guru) => (
                <TableRow key={guru.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="text-sm">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => guru.profileImage && (setSelectedGuru(guru), setIsPhotoPreviewOpen(true))}
                        className={`transition-all ${
                          guru.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium flex-shrink-0 text-sm hover:shadow-lg hover:scale-110">
                          {guru.profileImage ? (
                            <img src={guru.profileImage} alt={guru.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(guru.name)
                          )}
                        </div>
                      </button>
                      <div>
                        <p className="font-medium text-slate-900 text-sm truncate">{guru.name}</p>
                        <p className="text-xs text-slate-500">{guru.subject || 'Guru'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-slate-600 truncate">
                        <Mail size={12} className="mr-2 flex-shrink-0" />
                        <span className="truncate" title={guru.email}>{guru.email}</span>
                      </div>
                      {guru.phone ? (
                        <button
                          onClick={() => handleWhatsAppCall(guru.phone || '')}
                          className="flex items-center text-sm text-emerald-600 hover:text-emerald-700 transition-colors truncate"
                          title="Hubungi via WhatsApp"
                        >
                          <Phone size={12} className="mr-2 flex-shrink-0" />
                          <span className="truncate">{guru.phone}</span>
                        </button>
                      ) : (
                        <div className="flex items-center text-sm text-slate-400">
                          <Phone size={12} className="mr-2" />
                          <span>-</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono truncate">
                      {guru.nip}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center space-x-2">
                      {!isKepalaSekolah && (
                        <button
                          onClick={() => toggleGuruStatus(guru.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            guru.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              guru.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                      <span className="text-sm font-medium">
                        {guru.isActive !== false ? (
                          <Badge variant="success">Aktif</Badge>
                        ) : (
                          <Badge variant="default">Tidak Aktif</Badge>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {guru.isWaliKelas ? (
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="text-emerald-600 flex-shrink-0" />
                        <Badge variant="info" className="text-xs truncate">{getKelasName(guru.kelasWali || '')}</Badge>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewDetail(guru)}
                        className="!p-2 flex items-center justify-center"
                        title="Lihat detail"
                      >
                        <Eye size={14} />
                      </Button>
                      {!isKepalaSekolah && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(guru)}
                            className="!p-2 flex items-center justify-center"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(guru.id)}
                            className="!p-2 flex items-center justify-center"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredGurus.length === 0 && (
          <div className="text-center py-12 px-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? 'Tidak ada hasil' : 'Belum ada data guru'}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {searchTerm
                ? `Tidak ditemukan guru dengan kata kunci "${searchTerm}"`
                : 'Tambahkan guru pertama untuk memulai'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAdd} className="text-sm">
               
                Tambah Guru Pertama
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Guru List - Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredGurus.length > 0 ? (
          filteredGurus.map((guru) => (
            <div key={guru.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-4 space-y-3">
                {/* Guru Info Header */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => guru.profileImage && (setSelectedGuru(guru), setIsPhotoPreviewOpen(true))}
                    className={`transition-all flex-shrink-0 ${
                      guru.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm hover:shadow-lg">
                      {guru.profileImage ? (
                        <img src={guru.profileImage} alt={guru.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(guru.name)
                      )}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{guru.name}</p>
                    <p className="text-xs text-slate-500">{guru.subject || 'Guru'}</p>
                    <p className="text-xs text-slate-600 mt-1">NIP: {guru.nip}</p>
                  </div>
                  <div className="flex items-start gap-1">
                    {!isKepalaSekolah && (
                      <button
                        onClick={() => toggleGuruStatus(guru.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none flex-shrink-0 ${
                          guru.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            guru.isActive !== false ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Kontak Info */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    <Mail size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600 truncate" title={guru.email}>{guru.email}</span>
                  </div>
                  {guru.phone && (
                    <button
                      onClick={() => handleWhatsAppCall(guru.phone || '')}
                      className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 transition-colors w-full"
                      title="Hubungi via WhatsApp"
                    >
                      <Phone size={12} className="flex-shrink-0" />
                      <span className="truncate">{guru.phone}</span>
                    </button>
                  )}
                </div>

                {/* Status & Wali Kelas */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                  {guru.isActive !== false ? (
                    <Badge variant="success" className="text-xs">Aktif</Badge>
                  ) : (
                    <Badge variant="default" className="text-xs">Tidak Aktif</Badge>
                  )}
                  {guru.isWaliKelas && (
                    <Badge variant="info" className="text-xs">{getKelasName(guru.kelasWali || '')}</Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleViewDetail(guru)}
                    className="flex-1 text-xs flex items-center justify-center"
                  >
                    <Eye size={12} className="mr-1" />
                    Lihat
                  </Button>
                  {!isKepalaSekolah && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(guru)}
                        className="flex-1 text-xs flex items-center justify-center"
                      >
                        <Pencil size={12} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(guru.id)}
                        className="flex-1 text-xs flex items-center justify-center"
                      >
                        <Trash2 size={12} className="mr-1" />
                        Hapus
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {searchTerm ? 'Tidak ada hasil' : 'Belum ada data guru'}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {searchTerm
                ? `Tidak ditemukan guru dengan kata kunci "${searchTerm}"`
                : 'Tambahkan guru pertama untuk memulai'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAdd} className="text-xs  flex items-center justify-center">
                <Plus size={14} className="mr-1" />
                Tambah Guru
              </Button>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedGuru(null);
          setQrCodeURL('');
          setQrCodeLoading(false);
        }}
        title="Detail Guru"
        size="lg"
      >
        {selectedGuru && (
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col-2 sm:flex-row items-start sm:items-center gap-4 lg:gap-6 p-4 lg:p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <button
                type="button"
                onClick={() => selectedGuru.profileImage && setIsPhotoPreviewOpen(true)}
                className={`transition-all flex-shrink-0 ${
                  selectedGuru.profileImage ? 'cursor-pointer hover:shadow-lg hover:scale-105' : 'cursor-default'
                }`}
              >
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg lg:text-2xl">
                  {selectedGuru.profileImage ? (
                    <img src={selectedGuru.profileImage} alt={selectedGuru.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(selectedGuru.name)
                  )}
                </div>
              </button>
              <div className="flex-1">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">{selectedGuru.name}</h3>
                <p className="text-sm lg:text-base text-blue-600 font-medium mb-2">{selectedGuru.subject || 'Guru'}</p>
                <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-600">
                  <IdCard size={14} />
                  <span>NIP: {selectedGuru.nip}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-3 lg:space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm lg:text-base border-b border-gray-200 pb-2">Informasi Kontak</h4>
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs lg:text-sm text-gray-700 break-all">{selectedGuru.email}</span>
                  </div>
                  {selectedGuru.phone ? (
                    <button
                      onClick={() => handleWhatsAppCall(selectedGuru.phone || '')}
                      className="flex items-center gap-2 text-xs lg:text-sm text-green-600 hover:text-green-700 transition-colors group w-full"
                      title="Hubungi via WhatsApp"
                    >
                      <Phone size={14} className="flex-shrink-0" />
                      <span className="text-gray-700 group-hover:text-green-700">{selectedGuru.phone}</span>
                      <span className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        (WhatsApp)
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-400">
                      <Phone size={14} />
                      <span>Tidak ada nomor telepon</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm lg:text-base border-b border-gray-200 pb-2">Status & Jabatan</h4>
                <div className="space-y-2 lg:space-y-3 text-xs lg:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    {selectedGuru.isActive !== false ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="default">Tidak Aktif</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Wali Kelas:</span>
                    {selectedGuru.isWaliKelas ? (
                      <Badge variant="info">{getKelasName(selectedGuru.kelasWali || '')}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bergabung:</span>
                    <span className="text-gray-700">
                      {selectedGuru.createdAt ? new Date(selectedGuru.createdAt).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            {selectedGuru.nip && (
              <div className="pt-4 lg:pt-6 border-t border-gray-200">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-sm lg:text-base flex items-center gap-2">
                    <QrCode size={18} className="text-blue-600" />
                    QR Code Guru
                  </h4>
                  <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl lg:rounded-2xl border-2 border-blue-200 p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 lg:gap-6">
                      {/* QR Code Display */}
                      <div className="relative inline-block flex-shrink-0">
                        {/* Decorative corners */}
                        <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-blue-600 rounded-tl-lg"></div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-blue-600 rounded-tr-lg"></div>
                        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-blue-600 rounded-bl-lg"></div>
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-blue-600 rounded-br-lg"></div>

                        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-lg border-2 border-slate-200">
                          {qrCodeLoading ? (
                            <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 flex items-center justify-center">
                              <div className="relative">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
                                <QrCode className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600 animate-pulse" />
                              </div>
                            </div>
                          ) : qrCodeURL ? (
                            <img
                              src={qrCodeURL}
                              alt="QR Code Guru"
                              className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 object-contain mx-auto"
                            />
                          ) : (
                            <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 flex items-center justify-center text-slate-400">
                              <QrCode size={64} strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* QR Code Info */}
                      <div className="flex-1 text-center lg:text-left space-y-3 lg:space-y-4">
                        <div>
                          <p className="text-sm lg:text-base font-semibold text-gray-900 mb-1">
                            Kode Identifikasi Guru
                          </p>
                          <p className="text-xs lg:text-sm text-gray-600">
                            QR Code ini dapat digunakan untuk absensi dan identifikasi guru
                          </p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4 space-y-2">
                          <div className="flex items-center justify-center lg:justify-start gap-2 text-xs lg:text-sm">
                            <IdCard size={14} className="text-blue-600 flex-shrink-0" />
                            <span className="text-gray-700 font-mono font-medium">
                              NIP: {selectedGuru.nip}
                            </span>
                          </div>
                          <div className="flex items-center justify-center lg:justify-start gap-2 text-xs lg:text-sm text-gray-600">
                            <UserCheck size={14} className="flex-shrink-0" />
                            <span>{selectedGuru.name}</span>
                          </div>
                        </div>

                        {/* Download Button */}
                        <Button
                          onClick={handleDownloadQR}
                          variant="secondary"
                          className="w-full lg:w-auto flex items-center justify-center gap-2 text-sm lg:text-base"
                          disabled={qrCodeLoading || !qrCodeURL}
                        >
                          <Download size={16} />
                          Download QR Code
                        </Button>

                        {/* Info Box */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
                          <p className="text-xs lg:text-sm text-amber-800 font-medium mb-1">
                            Cara Penggunaan:
                          </p>
                          <ul className="text-xs lg:text-sm text-amber-700 space-y-1">
                            <li>• QR Code ini digunakan untuk absensi guru</li>
                            <li>• Tunjukkan kepada admin saat absensi dibuka</li>
                            <li>• Download untuk backup atau print kartu pegawai</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 pt-4 lg:pt-6 border-t border-gray-200">
              {!isKepalaSekolah && (
                <Button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleEdit(selectedGuru);
                  }}
                  fullWidth
                  className="text-sm lg:text-base"
                >
                  
                  Edit Data
                </Button>
              )}
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedGuru(null);
                }}
                className="text-sm lg:text-base"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Component */}
      <TambahGuruForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGuru(null);
        }}
        editingGuru={editingGuru}
        onSuccess={() => {
          refreshGurus();
          refreshKelas();
          // Refresh tour untuk menampilkan modal berikutnya
          // Note: refreshTour() akan otomatis di-skip jika user klik "Nanti Saja" di menu ini
          setTimeout(() => {
            refreshTour();
          }, 1000);
        }}
      />

      {/* Excel Import Modal */}
      <ExcelImportModalGuru
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportExcel}
        existingUsers={gurus}
      />

      {/* Photo Preview Modal */}
      <PhotoPreviewModal
        isOpen={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
        photoUrl={selectedGuru?.profileImage || null}
        name={selectedGuru?.name || ''}
      />

      {/* Wali Kelas Settings Modal */}
      <WaliKelasSettingsModal
        isOpen={isWaliKelasSettingsOpen}
        onClose={() => setIsWaliKelasSettingsOpen(false)}
      />

      {/* Orientation Selection Modal */}
      <Modal
        isOpen={isOrientationModalOpen}
        onClose={() => setIsOrientationModalOpen(false)}
        title="Pilih Orientasi KTA"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Pilih orientasi untuk semua kartu pegawai yang akan didownload:
          </p>

          <div className="space-y-3">
            <label className="block cursor-pointer">
              <input
                type="radio"
                name="orientation"
                value="potrait"
                checked={selectedOrientation === 'potrait'}
                onChange={(e) => setSelectedOrientation(e.target.value as 'potrait' | 'landscape')}
                className="hidden"
              />
              <div className={`p-4 rounded-lg border-2 transition-all ${
                selectedOrientation === 'potrait'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOrientation === 'potrait' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                  }`}>
                    {selectedOrientation === 'potrait' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Potrait</p>
                    <p className="text-xs text-slate-600">Kartu tegak (tinggi lebih besar dari lebar)</p>
                  </div>
                </div>
              </div>
            </label>

            <label className="block cursor-pointer">
              <input
                type="radio"
                name="orientation"
                value="landscape"
                checked={selectedOrientation === 'landscape'}
                onChange={(e) => setSelectedOrientation(e.target.value as 'potrait' | 'landscape')}
                className="hidden"
              />
              <div className={`p-4 rounded-lg border-2 transition-all ${
                selectedOrientation === 'landscape'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOrientation === 'landscape' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                  }`}>
                    {selectedOrientation === 'landscape' && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Landscape</p>
                    <p className="text-xs text-slate-600">Kartu mendatar (lebar lebih besar dari tinggi)</p>
                  </div>
                </div>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={() => setIsOrientationModalOpen(false)}
              variant="secondary"
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={() => handleDownloadAllKTA(selectedOrientation)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Download
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManajemenGuru;