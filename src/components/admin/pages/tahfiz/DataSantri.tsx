import React, { useState } from 'react';
import { Plus, Trash2, Eye, Phone, Mail, Search, Users, UserPlus, Edit, QrCode, Download } from 'lucide-react';
import { User } from '../../../../types';
import { useSantri } from '../../../../hooks/useSantri';
import { apiService } from '../../../../services/apiService';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import { showSuccessToast, showErrorToast } from '../../../ui/ToastContainer';
import TambahSantriForm from '../../forms/TambahSantriForm';
import PhotoPreviewModal from '../../../ui/PhotoPreviewModal';
import { useLanguage } from '../../../../context/LanguageContext';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { generateQRCodeData, generateQRCodeURL, downloadQRCode } from '../../../../utils/qrCodeGenerator';

const DataSantri: React.FC = () => {
  const { t } = useLanguage();
  const { santri, refreshSantri } = useSantri();
  const { systemType } = usePengaturanSistem();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeURL, setQrCodeURL] = useState<string>('');
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  
  const isTahfizSystem = systemType === 'tahfiz';

  const filteredSantri = santri.filter(santriItem => {
    if (!santriItem) return false;
    const matchesSearch = (santriItem.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (santriItem.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ((santriItem as any).nisn && String((santriItem as any).nisn || '').toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleAdd = () => {
    setIsFormOpen(true);
  };

  const handleAddAllMurid = async () => {
    showDangerConfirmation(
      t('tahfiz.tambahSemuaMuridConfirm'),
      `${t('tahfiz.tambahSemuaMuridConfirmText')}\n\n${t('tahfiz.tindakanIniAkanMenambahkan')}`,
      async () => {
        setIsAddingAll(true);
        try {
          const response = await apiService.addAllMurid();
          if (response.success) {
            showSuccessToast(t('common.success'), response.message || `${t('tahfiz.berhasilMenambahkan')} ${response.count || 0} ${t('tahfiz.santri')}`);
            refreshSantri();
          } else {
            showErrorToast(t('common.error'), response.message || t('tahfiz.gagalMenambahkanSemuaMurid'));
          }
        } catch (error: any) {
          showErrorToast(t('common.error'), error.message || t('tahfiz.terjadiKesalahanMenambahkanSemuaMurid'));
        } finally {
          setIsAddingAll(false);
        }
      },
      {
        confirmText: t('tahfiz.yaTambahSemua'),
        cancelText: t('common.cancel')
      }
    );
  };

  const handleViewDetail = (santriItem: User) => {
    setSelectedSantri(santriItem);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (santriItem: User) => {
    setSelectedSantri(santriItem);
    setIsEditFormOpen(true);
  };

  const toggleSantriStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await apiService.updateSantriStatus(id, !currentStatus);
      if (response.success) {
        showSuccessToast(t('common.success'), !currentStatus ? t('tahfiz.santriBerhasilDiaktifkan') : t('tahfiz.santriBerhasilDinonaktifkan'));
        refreshSantri();
      } else {
        showErrorToast(t('common.error'), response.message || t('tahfiz.gagalMengubahStatusSantri'));
      }
    } catch (error: any) {
      showErrorToast(t('common.error'), error.message || t('tahfiz.terjadiKesalahanMengubahStatusSantri'));
    }
  };

  const handleDelete = async (id: string) => {
    const santriItem = santri.find(s => s.id === id);
    if (!santriItem) return;

    showDangerConfirmation(
      t('tahfiz.hapusDataSantriConfirm'),
      `${t('tahfiz.hapusDataSantriConfirmText')} "${santriItem.name}" ${t('tahfiz.dariDaftarSantri')}\n\n${t('tahfiz.tindakanIniTidakAkanMenghapus')}`,
      async () => {
        try {
          const response = await apiService.removeSantri(id);
          if (response.success) {
            showSuccessToast(t('common.success'), t('tahfiz.santriBerhasilDihapus'));
            refreshSantri();
          } else {
            showErrorToast(t('common.error'), response.message || t('tahfiz.gagalMenghapusSantri'));
          }
        } catch (error: any) {
          showErrorToast(t('common.error'), error.message || t('tahfiz.terjadiKesalahanMenghapusSantri'));
        }
      },
      {
        confirmText: t('tahfiz.yaHapus'),
        cancelText: t('common.cancel')
      }
    );
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleWhatsAppCall = (phone: string) => {
    if (!phone) {
      alert(t('tahfiz.tidakAdaNomorWhatsApp'));
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

  const handleViewQRCode = async (santriItem: User) => {
    setSelectedSantri(santriItem);
    setIsQRModalOpen(true);
    setQrCodeLoading(true);
    
    try {
      const nisn = (santriItem as any).nisn || '';
      const qrData = generateQRCodeData(santriItem.id, nisn, santriItem.name || '', '');
      const url = await generateQRCodeURL(qrData, 400);
      setQrCodeURL(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrCodeURL('');
    } finally {
      setQrCodeLoading(false);
    }
  };

  const handleDownloadQRCode = async () => {
    if (!selectedSantri) return;
    
    try {
      const nisn = (selectedSantri as any).nisn || '';
      const qrData = generateQRCodeData(selectedSantri.id, nisn, selectedSantri.name || '', '');
      await downloadQRCode(qrData, `QRCode_${selectedSantri.name?.replace(/\s+/g, '_') || 'Santri'}`);
      showSuccessToast(t('common.success'), t('tahfiz.qrCodeBerhasilDidownload') || 'QR Code berhasil didownload');
    } catch (error: any) {
      showErrorToast(t('common.error'), error.message || t('tahfiz.gagalMendownloadQRCode') || 'Gagal mendownload QR Code');
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
                {t('tahfiz.dataSantri')}
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                {t('tahfiz.dataSantriDesc')} {santri.length > 0 && `(${santri.length} ${t('tahfiz.santri')})`}
              </p>
            </div>
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              {!isTahfizSystem && (
                <Button
                  onClick={handleAddAllMurid}
                  disabled={isAddingAll}
                  
                  className="flex items-center justify-center text-xs sm:text-sm bg-white hover:bg-blue-700 "
                >
                  {isAddingAll ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      <span className='text-black'>{t('tahfiz.menambahkan')}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} className="sm:mr-2 text-black" />
                      <span className='text-black'>{t('tahfiz.tambahSemuaMurid')}</span>
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={handleAdd}
                className="flex items-center justify-center text-xs sm:text-sm bg-green-600"
              >
                <Plus size={14} className="sm:mr-2" />
                <span>{t('tahfiz.tambahSantri')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder={t('tahfiz.cariSantri')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            {t('tahfiz.menampilkan')} <span className="font-semibold text-slate-900">{filteredSantri.length}</span> {t('tahfiz.dari')} <span className="font-semibold text-slate-900">{santri.length}</span> {t('tahfiz.santri')}
          </div>
        </div>
      </div>

      {/* Santri List - Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{t('tahfiz.daftarSantri')}</h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableCell header className="text-sm">{t('tahfiz.santriLabel')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.kontak')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.nisn')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.status')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.aksi')}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSantri.map((santriItem) => (
                <TableRow key={santriItem.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="text-sm">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => santriItem.profileImage && (setSelectedSantri(santriItem), setIsPhotoPreviewOpen(true))}
                        className={`transition-all ${
                          santriItem.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium flex-shrink-0 text-sm hover:shadow-lg hover:scale-110">
                          {santriItem.profileImage ? (
                            <img src={santriItem.profileImage} alt={santriItem.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(santriItem.name)
                          )}
                        </div>
                      </button>
                      <div>
                        <p className="font-medium text-slate-900 text-sm truncate">{santriItem.name || t('tahfiz.tidakAdaNama')}</p>
                        <p className="text-xs text-slate-500">{t('tahfiz.santriLabel')}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-slate-600 truncate">
                        <Mail size={12} className="mr-2 flex-shrink-0" />
                        <span className="truncate" title={santriItem.email}>{santriItem.email}</span>
                      </div>
                      {(santriItem as any).whatsappOrtu ? (
                        <button
                          onClick={() => handleWhatsAppCall((santriItem as any).whatsappOrtu || '')}
                          className="flex items-center text-sm text-emerald-600 hover:text-emerald-700 transition-colors truncate"
                          title={t('tahfiz.hubungiViaWhatsApp')}
                        >
                          <Phone size={12} className="mr-2 flex-shrink-0" />
                          <span className="truncate">{(santriItem as any).whatsappOrtu}</span>
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
                      {(santriItem as any).nisn || '-'}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleSantriStatus(santriItem.id, (santriItem as any).isActive !== false)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          (santriItem as any).isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            (santriItem as any).isActive !== false ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm font-medium">
                        {(santriItem as any).isActive !== false ? (
                          <Badge variant="success">{t('common.active')}</Badge>
                        ) : (
                          <Badge variant="default">{t('common.inactive')}</Badge>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewDetail(santriItem)}
                        className="!p-2 flex items-center justify-center"
                        title={t('tahfiz.lihatDetail')}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewQRCode(santriItem)}
                        className="!p-2 flex items-center justify-center"
                        title={t('tahfiz.lihatQRCode') || 'Lihat QR Code'}
                      >
                        <QrCode size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleEdit(santriItem)}
                        className="!p-2 flex items-center justify-center"
                        title={t('tahfiz.edit') || 'Edit'}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(santriItem.id)}
                        className="!p-2 flex items-center justify-center"
                        title={t('tahfiz.hapus')}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredSantri.length === 0 && (
          <div className="text-center py-12 px-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasil') : t('tahfiz.belumAdaDataSantri')}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {searchTerm
                ? `${t('tahfiz.tidakDitemukanSantri')} "${searchTerm}"`
                : t('tahfiz.tambahSantriPertama')
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAdd} className="text-sm">
                {t('tahfiz.tambahSantriPertamaButton')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Santri List - Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredSantri.length > 0 ? (
          filteredSantri.map((santriItem) => (
            <div key={santriItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-4 space-y-3">
                {/* Santri Info Header */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => santriItem.profileImage && (setSelectedSantri(santriItem), setIsPhotoPreviewOpen(true))}
                    className={`transition-all flex-shrink-0 ${
                      santriItem.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm hover:shadow-lg">
                      {santriItem.profileImage ? (
                        <img src={santriItem.profileImage} alt={santriItem.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(santriItem.name)
                      )}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{santriItem.name}</p>
                    <p className="text-xs text-slate-500">{t('tahfiz.santriLabel')}</p>
                    <p className="text-xs text-slate-600 mt-1">{t('tahfiz.nisn')}: {(santriItem as any).nisn || '-'}</p>
                  </div>
                </div>

                {/* Kontak Info */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    <Mail size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600 truncate" title={santriItem.email}>{santriItem.email}</span>
                  </div>
                  {(santriItem as any).whatsappOrtu && (
                    <button
                      onClick={() => handleWhatsAppCall((santriItem as any).whatsappOrtu || '')}
                      className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 transition-colors w-full"
                      title={t('tahfiz.hubungiViaWhatsApp')}
                    >
                      <Phone size={12} className="flex-shrink-0" />
                      <span className="truncate">{(santriItem as any).whatsappOrtu}</span>
                    </button>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                  {(santriItem as any).isActive !== false ? (
                    <Badge variant="success">{t('common.active')}</Badge>
                  ) : (
                    <Badge variant="default">{t('common.inactive')}</Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 flex-wrap">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleViewDetail(santriItem)}
                    className="flex-1 text-xs flex items-center justify-center"
                  >
                    <Eye size={12} className="mr-1" />
                    {t('tahfiz.lihat')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleViewQRCode(santriItem)}
                    className="flex-1 text-xs flex items-center justify-center"
                  >
                    <QrCode size={12} className="mr-1" />
                    QR
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleEdit(santriItem)}
                    className="flex-1 text-xs flex items-center justify-center"
                  >
                    <Edit size={12} className="mr-1" />
                    {t('tahfiz.edit') || 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(santriItem.id)}
                    className="flex-1 text-xs flex items-center justify-center"
                  >
                    <Trash2 size={12} className="mr-1" />
                    {t('tahfiz.hapus')}
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasil') : t('tahfiz.belumAdaDataSantri')}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {searchTerm
                ? `${t('tahfiz.tidakDitemukanSantri')} "${searchTerm}"`
                : t('tahfiz.tambahSantriPertama')
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAdd} className="text-xs flex items-center justify-center">
                <Plus size={14} className="mr-1" />
                {t('tahfiz.tambahSantri')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSantri(null);
        }}
        title={t('tahfiz.detailSantri')}
        size="lg"
      >
        {selectedSantri && (
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col-2 sm:flex-row items-start sm:items-center gap-4 lg:gap-6 p-4 lg:p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <button
                type="button"
                onClick={() => selectedSantri.profileImage && setIsPhotoPreviewOpen(true)}
                className={`transition-all flex-shrink-0 ${
                  selectedSantri.profileImage ? 'cursor-pointer hover:shadow-lg hover:scale-105' : 'cursor-default'
                }`}
              >
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg lg:text-2xl">
                  {selectedSantri.profileImage ? (
                    <img src={selectedSantri.profileImage} alt={selectedSantri.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(selectedSantri.name)
                  )}
                </div>
              </button>
              <div className="flex-1">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">{selectedSantri.name}</h3>
                <p className="text-sm lg:text-base text-blue-600 font-medium mb-2">{t('tahfiz.santriLabel')}</p>
                <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-600">
                  <span>{t('tahfiz.nisn')}: {(selectedSantri as any).nisn || '-'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-3 lg:space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm lg:text-base border-b border-gray-200 pb-2">{t('tahfiz.informasiKontak')}</h4>
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs lg:text-sm text-gray-700 break-all">{selectedSantri.email}</span>
                  </div>
                  {(selectedSantri as any).whatsappOrtu ? (
                    <button
                      onClick={() => handleWhatsAppCall((selectedSantri as any).whatsappOrtu || '')}
                      className="flex items-center gap-2 text-xs lg:text-sm text-blue-600 hover:text-blue-700 transition-colors group w-full"
                      title={t('tahfiz.hubungiViaWhatsApp')}
                    >
                      <Phone size={14} className="flex-shrink-0" />
                      <span className="text-gray-700 group-hover:text-blue-700">{(selectedSantri as any).whatsappOrtu}</span>
                      <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        (WhatsApp)
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-400">
                      <Phone size={14} />
                      <span>{t('tahfiz.tidakAdaNomorWhatsAppOrtu')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm lg:text-base border-b border-gray-200 pb-2">{t('tahfiz.status')}</h4>
                <div className="space-y-2 lg:space-y-3 text-xs lg:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('tahfiz.status')}:</span>
                    {(selectedSantri as any).isActive !== false ? (
                      <Badge variant="success">{t('common.active')}</Badge>
                    ) : (
                      <Badge variant="default">{t('common.inactive')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('tahfiz.bergabung')}:</span>
                    <span className="text-gray-700">
                      {selectedSantri.createdAt ? new Date(selectedSantri.createdAt).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 pt-4 lg:pt-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => selectedSantri && handleViewQRCode(selectedSantri)}
                className="text-sm lg:text-base flex items-center justify-center"
              >
                <QrCode size={16} className="mr-2" />
                {t('tahfiz.lihatQRCode') || 'Lihat QR Code'}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedSantri(null);
                }}
                className="text-sm lg:text-base"
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Component */}
      <TambahSantriForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
        }}
        onSuccess={() => {
          refreshSantri();
        }}
      />

      {/* Edit Form Component */}
      <TambahSantriForm
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setSelectedSantri(null);
        }}
        onSuccess={() => {
          refreshSantri();
          setIsEditFormOpen(false);
          setSelectedSantri(null);
        }}
        editData={selectedSantri}
      />

      {/* Photo Preview Modal */}
      <PhotoPreviewModal
        isOpen={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
        photoUrl={selectedSantri?.profileImage || null}
        name={selectedSantri?.name || ''}
      />

      {/* QR Code Modal */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setQrCodeURL('');
        }}
        title={`${t('tahfiz.qrCode') || 'QR Code'} - ${selectedSantri?.name || ''}`}
        size="md"
      >
        {selectedSantri && (
          <div className="text-center space-y-4">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
              {qrCodeLoading ? (
                <div className="w-64 h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : qrCodeURL ? (
                <img 
                  src={qrCodeURL} 
                  alt="QR Code" 
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                  <p>{t('tahfiz.gagalMembuatQRCode') || 'Gagal membuat QR Code'}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">{selectedSantri.name}</p>
              <p className="text-sm text-gray-600">{t('tahfiz.nisn')}: {(selectedSantri as any).nisn || '-'}</p>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">{t('tahfiz.caraPenggunaan') || 'Cara Penggunaan'}:</h4>
              <ul className="text-sm text-yellow-800 space-y-1 text-left">
                <li>• {t('tahfiz.qrCodeUntukAbsensi') || 'QR Code ini digunakan untuk absensi santri'}</li>
                <li>• {t('tahfiz.tunjukkanKeGuru') || 'Tunjukkan kepada guru saat sesi absensi dibuka'}</li>
                <li>• {t('tahfiz.downloadUntukBackup') || 'Download untuk backup atau print kartu pelajar'}</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleDownloadQRCode}
              fullWidth
              className="justify-center flex items-center"
              disabled={!qrCodeURL || qrCodeLoading}
            >
              <Download size={16} className="mr-2" />
              {t('tahfiz.downloadQRCode') || 'Download QR Code'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataSantri;

