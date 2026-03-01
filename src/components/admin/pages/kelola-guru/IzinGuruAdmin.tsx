import React, { useState, useEffect } from 'react';
import { FileText, Check, X, Clock, Eye, Calendar, Download, Search } from 'lucide-react';
import { exportToExcel, formatDateID } from '../../../../utils/exportUtils';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';
import Modal from '../../../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { IzinGuru, User, AbsensiGuru } from '../../../../types';
import { showSuccessNotification, showErrorNotification } from '../../../../utils/notificationUtils';
import { showSuccessConfirmation, showDangerConfirmation } from '../../../../utils/confirmationUtils';
import IzinDetailContent from '../../../shared/modals/IzinDetailContent';
import { apiService } from '../../../../services/apiService';
import { useGurus } from '../../../../hooks/useGurus';

const IzinGuruAdmin: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { systemType } = usePengaturanSistem();
  const { gurus: gurusData } = useGurus();
  const isTahfiz = systemType === 'tahfiz';
  const dateLocale = language === 'ms' ? 'ms-MY' : 'id-ID';
  
  const [izinGuru, setIzinGuru] = useState<IzinGuru[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIzin, setSelectedIzin] = useState<IzinGuru | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keterangan, setKeterangan] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'menunggu' | 'diterima' | 'ditolak'>('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    // Combine gurus with murid (if needed) for users array
    setUsers([...gurusData]);
  }, [gurusData]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [izinGuruResponse] = await Promise.all([
        apiService.getAllIzinGuru(),
      ]);

      if (izinGuruResponse.success && izinGuruResponse.izinGuru) {
        setIzinGuru(izinGuruResponse.izinGuru);
      }
    } catch (error) {
      console.error('Error fetching Izin Guru Admin data:', error);
      showErrorNotification('Error', t('verifikasiIzinGuru.memuatData'));
    } finally {
      setIsLoading(false);
    }
  };

  const gurus = users.filter(u => u.role === 'guru');

  const filteredIzin = izinGuru.filter(izin => {
    const guru = gurus.find(g => g.id === izin.guruId);
    const matchStatus = filterStatus === 'semua' || izin.status === filterStatus;
    const matchSearch = !searchTerm || 
                       (guru?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       ((guru as any)?.nip?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       izin.alasan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const izinDate = new Date(izin.createdAt.split('T')[0]);
    const startDate = new Date(dateFilter.start);
    const endDate = new Date(dateFilter.end);
    endDate.setHours(23, 59, 59, 999);
    const matchDate = izinDate >= startDate && izinDate <= endDate;
    
    return matchStatus && matchSearch && matchDate;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleVerify = async (izinId: string, status: 'diterima' | 'ditolak') => {
    const izin = izinGuru.find(i => i.id === izinId);
    if (!izin) return;

    const guru = users.find(u => u.id === izin.guruId);
    const actionText = status === 'diterima' ? 'menyetujui' : 'menolak';
    const statusText = status === 'diterima' ? 'disetujui' : 'ditolak';
    
    const confirmationFunction = status === 'diterima' ? showSuccessConfirmation : showDangerConfirmation;
    
    confirmationFunction(
      `${status === 'diterima' ? 'Setujui' : 'Tolak'} Pengajuan ${izin.jenis.charAt(0).toUpperCase() + izin.jenis.slice(1)}`,
      `Apakah Anda yakin ingin ${actionText} pengajuan ${izin.jenis} dari ${guru?.name}?\n\nPeriode: ${new Date(izin.tanggalMulai).toLocaleDateString(dateLocale)} - ${new Date(izin.tanggalSelesai).toLocaleDateString(dateLocale)}\nAlasan: ${izin.alasan}${status === 'diterima' ? '\n\n✓ Absensi guru akan otomatis diperbarui untuk periode ini' : ''}`,
      async () => {
        try {
          // Update izin via API
          const updateData = {
            status,
            keterangan,
            verifiedBy: user?.id,
            verifiedAt: new Date().toISOString()
          };

          const updateResponse = await apiService.updateIzinGuru(izinId, updateData);
          
          if (!updateResponse.success) {
            showErrorNotification('Gagal Verifikasi', updateResponse.message || 'Gagal memperbarui status izin');
            return;
          }

          // Absensi guru akan otomatis diupdate di server side ketika izin diterima

          // Refresh data
          await fetchAllData();

          setSelectedIzin(null);
          setIsModalOpen(false);
          setKeterangan('');
          
          showSuccessNotification(
            `Pengajuan ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
            `Pengajuan ${izin.jenis} dari ${guru?.name} telah ${statusText}.`
          );
        } catch (error: any) {
          console.error('Error verifying izin:', error);
          showErrorNotification('Error', error.message || 'Terjadi kesalahan saat memverifikasi izin');
        }
      },
      {
        confirmText: `Ya, ${status === 'diterima' ? 'Setujui' : 'Tolak'} Pengajuan`,
        cancelText: 'Batal',
        confirmVariant: status === 'diterima' ? 'success' : 'danger'
      }
    );
  };

  const openDetailModal = (izin: IzinGuru) => {
    setSelectedIzin(izin);
    setIsModalOpen(true);
    setKeterangan('');
  };

  const getGuruName = (guruId: string) => {
    return users.find(u => u.id === guruId)?.name || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu':
        return <Badge variant="warning">MENUNGGU</Badge>;
      case 'diterima':
        return <Badge variant="success">DITERIMA</Badge>;
      case 'ditolak':
        return <Badge variant="danger">DITOLAK</Badge>;
      default:
        return <Badge variant="default">{status.toUpperCase()}</Badge>;
    }
  };

  const getJenisBadge = (jenis: string) => {
    switch (jenis) {
      case 'izin':
        return <Badge variant="warning">IZIN</Badge>;
      case 'sakit':
        return <Badge variant="info">SAKIT</Badge>;
      case 'cuti':
        return <Badge variant="secondary">CUTI</Badge>;
      default:
        return <Badge variant="default">{jenis.toUpperCase()}</Badge>;
    }
  };

  const exportIzinReport = () => {
    const data = filteredIzin.map(izin => {
      const guru = users.find(u => u.id === izin.guruId);
      return {
        namaGuru: guru?.name || 'Unknown',
        nip: (guru as any)?.nip || 'Unknown',
        jenis: izin.jenis.toUpperCase(),
        tanggalMulai: formatDateID(izin.tanggalMulai),
        tanggalSelesai: formatDateID(izin.tanggalSelesai),
        alasan: izin.alasan,
        status: izin.status.toUpperCase(),
        tanggalPengajuan: formatDateID(izin.createdAt),
        tanggalVerifikasi: izin.verifiedAt ? formatDateID(izin.verifiedAt) : '-',
        keterangan: izin.keterangan || '-'
      };
    });

    const columns = [
      { header: 'Nama Guru', dataKey: 'namaGuru', width: 25 },
      { header: 'NIP', dataKey: 'nip', width: 18 },
      { header: 'Jenis', dataKey: 'jenis', width: 12 },
      { header: 'Tanggal Mulai', dataKey: 'tanggalMulai', width: 15 },
      { header: 'Tanggal Selesai', dataKey: 'tanggalSelesai', width: 15 },
      { header: 'Alasan', dataKey: 'alasan', width: 30 },
      { header: 'Status', dataKey: 'status', width: 12 },
      { header: 'Tanggal Pengajuan', dataKey: 'tanggalPengajuan', width: 15 },
      { header: 'Tanggal Verifikasi', dataKey: 'tanggalVerifikasi', width: 15 },
      { header: 'Keterangan', dataKey: 'keterangan', width: 25 }
    ];

    const title = `LAPORAN IZIN GURU\nPeriode: ${formatDateID(dateFilter.start)} - ${formatDateID(dateFilter.end)}`;
    const filename = `laporan-izin-guru-${new Date().toISOString().split('T')[0]}`;
    
    exportToExcel(data, columns, title, filename);
  };

  const pendingCount = izinGuru.filter(i => i.status === 'menunggu').length;
  const approvedCount = izinGuru.filter(i => i.status === 'diterima').length;
  const rejectedCount = izinGuru.filter(i => i.status === 'ditolak').length;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('verifikasiIzinGuru.memuatData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{isTahfiz ? t('verifikasiIzinGuru.titleTahfiz') : t('verifikasiIzinGuru.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{isTahfiz ? t('verifikasiIzinGuru.subtitleTahfiz') : t('verifikasiIzinGuru.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="px-3 py-2 bg-orange-100 text-orange-800 rounded-full text-center sm:text-left text-sm font-medium">
            {pendingCount} {t('verifikasiIzinGuru.menungguVerifikasi')}
          </div>
          <Button 
            onClick={exportIzinReport} 
            variant="success" 
            className="flex items-center justify-center w-full sm:w-auto"
          >
            <Download size={16} className="mr-2" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 text-center border-l-4 border-l-orange-500">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{pendingCount}</p>
          <p className="text-xs sm:text-sm text-gray-600">{t('verifikasiIzinGuru.menungguPengesahan')}</p>
        </Card>

        <Card className="p-4 sm:p-6 text-center border-l-4 border-l-emerald-500">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{approvedCount}</p>
          <p className="text-xs sm:text-sm text-gray-600">{t('verifikasiIzinGuru.disetujui')}</p>
        </Card>

        <Card className="p-4 sm:p-6 text-center border-l-4 border-l-red-500">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{rejectedCount}</p>
          <p className="text-xs sm:text-sm text-gray-600">{t('verifikasiIzinGuru.ditolak')}</p>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('verifikasiIzinGuru.cariGuru')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={isTahfiz ? t('verifikasiIzinGuru.cariGuruPlaceholderTahfiz') : t('verifikasiIzinGuru.cariGuruPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('verifikasiIzinGuru.status')}</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-base"
            >
              <option value="semua">{t('verifikasiIzinGuru.semuaStatus')}</option>
              <option value="menunggu">{t('verifikasiIzinGuru.menunggu')}</option>
              <option value="diterima">{t('verifikasiIzinGuru.disetujui')}</option>
              <option value="ditolak">{t('verifikasiIzinGuru.ditolak')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('verifikasiIzinGuru.dariTanggal')}</label>
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('verifikasiIzinGuru.sampaiTanggal')}</label>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
          </div>
        </div>
        
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-xs sm:text-sm text-gray-600">
            {t('verifikasiIzinGuru.menampilkanPengajuan', { count: filteredIzin.length })}
          </div>
          <Button 
            variant="danger" 
            onClick={() => {
              setDateFilter({
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              });
              setSearchTerm('');
              setFilterStatus('semua');
            }}
            className="w-full sm:w-auto"
          >
            {t('verifikasiIzinGuru.resetFilter')}
          </Button>
        </div>
      </Card>

      {/* Data Table - Desktop View */}
      <Card className="hidden lg:block">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('verifikasiIzinGuru.daftarPengajuanIzin')}</h3>
        </div>

        <div className="overflow-x-auto">
          {filteredIzin.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>{t('verifikasiIzinGuru.guru')}</TableCell>
                  <TableCell header>{t('verifikasiIzinGuru.jenisPeriode')}</TableCell>
                  <TableCell header>{t('verifikasiIzinGuru.alasan')}</TableCell>
                  <TableCell header>{t('verifikasiIzinGuru.status')}</TableCell>
                  <TableCell header>{t('verifikasiIzinGuru.tanggalPengajuan')}</TableCell>
                  <TableCell header>{t('common.aksi')}</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIzin.map((izin) => (
                  <TableRow key={izin.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {getInitials(getGuruName(izin.guruId))}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{getGuruName(izin.guruId)}</p>
                          <p className="text-sm text-gray-500">NIP: {(users.find(u => u.id === izin.guruId) as any)?.nip || 'Unknown'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getJenisBadge(izin.jenis)}
                        <div className="text-sm text-gray-600">
                          <div>{new Date(izin.tanggalMulai).toLocaleDateString(dateLocale)}</div>
                          {izin.tanggalMulai !== izin.tanggalSelesai && (
                            <div className="text-gray-500">s/d {new Date(izin.tanggalSelesai).toLocaleDateString(dateLocale)}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 line-clamp-2" title={izin.alasan}>
                          {izin.alasan}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(izin.status)}
                        {izin.verifiedAt && (
                          <div className="text-xs text-gray-500">
                            {new Date(izin.verifiedAt).toLocaleDateString(dateLocale)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(izin.createdAt).toLocaleDateString(dateLocale)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => openDetailModal(izin)}
                        className="!p-2 flex items-center justify-center"
                      >
                        <Eye className="mr-2" size={16} /> {t('verifikasiIzinGuru.detailButton')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'semua' ? t('verifikasiIzinGuru.tidakAdaHasil') : t('verifikasiIzinGuru.belumAdaPengajuan')}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'semua' 
                  ? t('verifikasiIzinGuru.tidakDitemukanFilter')
                  : t('verifikasiIzinGuru.belumAdaPengajuanDariGuru')
                }
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Mobile Card View */}
      <Card className="lg:hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('verifikasiIzinGuru.daftarPengajuanIzin')}</h3>
        </div>
        
        {filteredIzin.length > 0 ? (
          <div className="space-y-3 p-4 sm:p-6">
            {filteredIzin.map((izin) => (
              <Card 
                key={izin.id} 
                className="overflow-hidden border border-gray-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300 bg-white group"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Header with Guru Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-semibold text-base shadow-lg shadow-blue-500/30">
                          {getInitials(getGuruName(izin.guruId))}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-base truncate leading-tight mb-0.5">
                          {getGuruName(izin.guruId)}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          NIP: {(users.find(u => u.id === izin.guruId) as any)?.nip || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 transform group-hover:scale-105 transition-transform duration-200">
                      {getStatusBadge(izin.status)}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                  {/* Jenis & Periode */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      {getJenisBadge(izin.jenis)}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100/50 px-3 py-1.5 rounded-lg border border-gray-200/50">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="font-medium">
                        {new Date(izin.tanggalMulai).toLocaleDateString(dateLocale, { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}
                      </span>
                      {izin.tanggalMulai !== izin.tanggalSelesai && (
                        <>
                          <span className="text-gray-400 mx-1">-</span>
                          <span className="font-medium">
                            {new Date(izin.tanggalSelesai).toLocaleDateString(dateLocale, { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Alasan */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-100 shadow-sm">
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText size={12} className="text-gray-500" />
                      Alasan
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">
                      {izin.alasan}
                    </p>
                  </div>

                  {/* Footer Info */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-gray-400" />
                          <span>
                            <span className="font-medium text-gray-600">Pengajuan:</span>{' '}
                            {new Date(izin.createdAt).toLocaleDateString(dateLocale, { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        {izin.verifiedAt && (
                          <div className="flex items-center gap-2">
                            <Check size={12} className="text-gray-400" />
                            <span>
                              <span className="font-medium text-gray-600">Verifikasi:</span>{' '}
                              {new Date(izin.verifiedAt).toLocaleDateString(dateLocale, { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => openDetailModal(izin)}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 font-medium shadow-sm border border-gray-200 hover:border-gray-300 transition-all duration-200"
                      >
                        <Eye size={16} />
                        <span>{t('verifikasiIzinGuru.detailButton')}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'semua' ? t('verifikasiIzinGuru.tidakAdaHasil') : t('verifikasiIzinGuru.belumAdaPengajuan')}
            </h3>
            <p className="text-sm text-gray-600">
              {searchTerm || filterStatus !== 'semua' 
                ? 'Tidak ditemukan pengajuan izin untuk filter yang dipilih'
                : 'Belum ada pengajuan izin dari guru'
              }
            </p>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIzin(null);
          setKeterangan('');
        }}
        title=""
        size="xl"
      >
        {selectedIzin && (
          <div className="space-y-0">
            <IzinDetailContent
              izin={selectedIzin}
              user={users.find(u => u.id === selectedIzin.guruId) || null}
              showVerificationStatus={true}
            />

            {/* Form Verifikasi untuk Admin */}
            {selectedIzin.status === 'menunggu' && (
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('verifikasiIzinGuru.verifikasiPengajuan')}</h4>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('verifikasiIzinGuru.keteranganAdmin')}
                  </label>
                  <textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    rows={3}
                    placeholder={t('verifikasiIzinGuru.keteranganPlaceholder')}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="success"
                    fullWidth
                    onClick={() => handleVerify(selectedIzin.id, 'diterima')}
                    className="flex items-center justify-center"
                  >
                    <Check size={16} className="mr-2" />
                    {t('verifikasiIzinGuru.setujuiPengajuan')}
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => handleVerify(selectedIzin.id, 'ditolak')}
                    className="flex items-center justify-center"
                  >
                    <X size={16} className="mr-2" />
                    {t('verifikasiIzinGuru.tolakPengajuan')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IzinGuruAdmin;