import React, { useState } from 'react';
import { Plus, Trash2, Eye, Phone, Mail, Search, Users, Edit, QrCode, Download } from 'lucide-react';
import { User } from '../../../../types';
import { useUstadz } from '../../../../hooks/useUstadz';
import { apiService } from '../../../../services/apiService';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import { showSuccessToast, showErrorToast } from '../../../ui/ToastContainer';
import TambahUstadzForm from '../../forms/TambahUstadzForm';
import PhotoPreviewModal from '../../../ui/PhotoPreviewModal';
import { useLanguage } from '../../../../context/LanguageContext';
import { generateTeacherAttendanceQRCode, generateQRCodeURL, downloadQRCode } from '../../../../utils/qrCodeGenerator';

const DataUstadz: React.FC = () => {
  const { t, language } = useLanguage();
  const { ustadz, refreshUstadz } = useUstadz();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [selectedUstadz, setSelectedUstadz] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeURL, setQrCodeURL] = useState<string>('');
  const [qrCodeLoading, setQrCodeLoading] = useState(false);

  const filteredUstadz = ustadz.filter(ustadzItem => {
    const matchesSearch = ustadzItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ustadzItem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ((ustadzItem as any).nip && (ustadzItem as any).nip.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleAdd = () => {
    setIsFormOpen(true);
  };

  const handleViewDetail = (ustadzItem: User) => {
    setSelectedUstadz(ustadzItem);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (ustadzItem: User) => {
    setSelectedUstadz(ustadzItem);
    setIsEditFormOpen(true);
  };

  const toggleUstadzStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await apiService.updateUstadzStatus(id, !currentStatus);
      if (response.success) {
        showSuccessToast(t('common.success'), !currentStatus ? t('tahfiz.ustadzBerhasilDiaktifkan') : t('tahfiz.ustadzBerhasilDinonaktifkan'));
        refreshUstadz();
      } else {
        showErrorToast(t('common.error'), response.message || t('tahfiz.gagalMengubahStatusUstadz'));
      }
    } catch (error: any) {
      showErrorToast(t('common.error'), error.message || t('tahfiz.terjadiKesalahanMengubahStatusUstadz'));
    }
  };

  const handleDelete = async (id: string) => {
    const ustadzItem = ustadz.find(u => u.id === id);
    if (!ustadzItem) return;

    showDangerConfirmation(
      t('tahfiz.hapusDataUstadzConfirm'),
      `${t('tahfiz.hapusDataUstadzConfirmText')} "${ustadzItem.name}" ${t('tahfiz.dariDaftarUstadz')}?\n\n${t('tahfiz.tindakanIniTidakAkanMenghapusGuru')}`,
      async () => {
        try {
          const response = await apiService.removeUstadz(id);
          if (response.success) {
            showSuccessToast(t('common.success'), t('tahfiz.ustadzBerhasilDihapus'));
            refreshUstadz();
          } else {
            showErrorToast(t('common.error'), response.message || t('tahfiz.gagalMenghapusUstadz'));
          }
        } catch (error: any) {
          showErrorToast(t('common.error'), error.message || t('tahfiz.terjadiKesalahanMenghapusUstadz'));
        }
      },
      {
        confirmText: t('tahfiz.yaHapus'),
        cancelText: t('common.cancel')
      }
    );
  };

  const getInitials = (name: string) => {
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

  const handleViewQRCode = async (ustadzItem: User) => {
    setSelectedUstadz(ustadzItem);
    setIsQRModalOpen(true);
    setQrCodeLoading(true);
    
    try {
      const nip = (ustadzItem as any).nip || '';
      const qrData = generateTeacherAttendanceQRCode(ustadzItem.id, ustadzItem.name || '', undefined, nip);
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
    if (!selectedUstadz) return;
    
    try {
      const nip = (selectedUstadz as any).nip || '';
      const qrData = generateTeacherAttendanceQRCode(selectedUstadz.id, selectedUstadz.name || '', undefined, nip);
      await downloadQRCode(qrData, `QRCode_${selectedUstadz.name?.replace(/\s+/g, '_') || 'Ustadz'}`);
      showSuccessToast(t('common.success'), t('tahfiz.qrCodeBerhasilDidownload') || 'QR Code berhasil didownload');
    } catch (error: any) {
      showErrorToast(t('common.error'), error.message || t('tahfiz.gagalMendownloadQRCode') || 'Gagal mendownload QR Code');
    }
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-green-700 via-green-700 to-green-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                {t('tahfiz.dataUstadz')}
              </h1>
              <p className="text-sm sm:text-base text-green-100">
                {t('tahfiz.dataUstadzDesc')} {ustadz.length > 0 && `(${ustadz.length} ${t('tahfiz.ustadz')})`}
              </p>
            </div>
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={handleAdd}
                className="flex items-center justify-center text-xs sm:text-sm bg-blue-600"
              >
                <Plus size={14} className="sm:mr-2" />
                <span>{t('tahfiz.tambahUstadz')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      

      {/* Search Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder={t('tahfiz.cariUstadz')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            {t('tahfiz.menampilkan')} <span className="font-semibold text-slate-900">{filteredUstadz.length}</span> {t('tahfiz.dari')} <span className="font-semibold text-slate-900">{ustadz.length}</span> {t('tahfiz.ustadz')}
          </div>
        </div>
      </div>

      {/* Ustadz List - Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{t('tahfiz.daftarUstadz')}</h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableCell header className="text-sm">{t('tahfiz.ustadzLabel')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.kontak')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.nip')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.status')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.aksi')}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUstadz.map((ustadzItem) => (
                <TableRow key={ustadzItem.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="text-sm">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => ustadzItem.profileImage && (setSelectedUstadz(ustadzItem), setIsPhotoPreviewOpen(true))}
                        className={`transition-all ${
                          ustadzItem.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium flex-shrink-0 text-sm hover:shadow-lg hover:scale-110">
                          {ustadzItem.profileImage ? (
                            <img src={ustadzItem.profileImage} alt={ustadzItem.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(ustadzItem.name)
                          )}
                        </div>
                      </button>
                      <div>
                        <p className="font-medium text-slate-900 text-sm truncate">{ustadzItem.name}</p>
                        <p className="text-xs text-slate-500">{(ustadzItem as any).subject || t('tahfiz.ustadz')}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-slate-600 truncate">
                        <Mail size={12} className="mr-2 flex-shrink-0" />
                        <span className="truncate" title={ustadzItem.email}>{ustadzItem.email}</span>
                      </div>
                      {ustadzItem.phone ? (
                        <button
                          onClick={() => handleWhatsAppCall(ustadzItem.phone || '')}
                          className="flex items-center text-sm text-emerald-600 hover:text-emerald-700 transition-colors truncate"
                          title={t('tahfiz.hubungiViaWhatsApp')}
                        >
                          <Phone size={12} className="mr-2 flex-shrink-0" />
                          <span className="truncate">{ustadzItem.phone}</span>
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
                      {(ustadzItem as any).nip || '-'}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleUstadzStatus(ustadzItem.id, (ustadzItem as any).isActive !== false)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                          (ustadzItem as any).isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={(ustadzItem as any).isActive !== false ? t('tahfiz.klikUntukNonaktifkan') : t('tahfiz.klikUntukAktifkan')}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            (ustadzItem as any).isActive !== false ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm font-medium">
                        {(ustadzItem as any).isActive !== false ? (
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
                        onClick={() => handleViewDetail(ustadzItem)}
                        className="!p-2 flex items-center justify-center"
                        title={t('tahfiz.lihatDetail')}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewQRCode(ustadzItem)}
                        className="!p-2 flex items-center justify-center"
                        title={t('tahfiz.lihatqrcode') || 'Lihat QR Code'}
                      >
                        <QrCode size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleEdit(ustadzItem)}
                        className="!p-2 flex items-center justify-center"
                        title={t('tahfiz.edit') || 'Edit'}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(ustadzItem.id)}
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

        {filteredUstadz.length === 0 && (
          <div className="text-center py-12 px-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasil') : t('tahfiz.belumAdaDataUstadz')}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {searchTerm
                ? `${t('tahfiz.tidakDitemukanUstadz')} "${searchTerm}"`
                : t('tahfiz.tambahUstadzPertama')
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAdd} className="text-sm">
                {t('tahfiz.tambahUstadzPertamaButton')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Ustadz List - Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredUstadz.length > 0 ? (
          filteredUstadz.map((ustadzItem) => (
            <div key={ustadzItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-4 space-y-3">
                {/* Ustadz Info Header */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => ustadzItem.profileImage && (setSelectedUstadz(ustadzItem), setIsPhotoPreviewOpen(true))}
                    className={`transition-all flex-shrink-0 ${
                      ustadzItem.profileImage ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium text-sm hover:shadow-lg">
                      {ustadzItem.profileImage ? (
                        <img src={ustadzItem.profileImage} alt={ustadzItem.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(ustadzItem.name)
                      )}
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{ustadzItem.name}</p>
                    <p className="text-xs text-slate-500">{(ustadzItem as any).subject || t('tahfiz.ustadz')}</p>
                    <p className="text-xs text-slate-600 mt-1">{t('tahfiz.nip')}: {(ustadzItem as any).nip || '-'}</p>
                  </div>
                </div>

                {/* Kontak Info */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    <Mail size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600 truncate" title={ustadzItem.email}>{ustadzItem.email}</span>
                  </div>
                  {ustadzItem.phone && (
                    <button
                      onClick={() => handleWhatsAppCall(ustadzItem.phone || '')}
                      className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 transition-colors w-full"
                      title={t('tahfiz.hubungiViaWhatsApp')}
                    >
                      <Phone size={12} className="flex-shrink-0" />
                      <span className="truncate">{ustadzItem.phone}</span>
                    </button>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                  <button
                    onClick={() => toggleUstadzStatus(ustadzItem.id, (ustadzItem as any).isActive !== false)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
                      (ustadzItem as any).isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                    title={(ustadzItem as any).isActive !== false ? t('tahfiz.klikUntukNonaktifkan') : t('tahfiz.klikUntukAktifkan')}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        (ustadzItem as any).isActive !== false ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  {(ustadzItem as any).isActive !== false ? (
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
                    onClick={() => handleViewDetail(ustadzItem)}
                    className="flex-1 text-xs flex items-center justify-center"
                  >
                    <Eye size={12} className="mr-1" />
                    {t('tahfiz.lihat')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleViewQRCode(ustadzItem)}
                    className="flex-1 text-xs flex items-center justify-center"
                  >
                    <QrCode size={12} className="mr-1" />
                    {t('tahfiz.qrCode') || 'QR Code'}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleEdit(ustadzItem)}
                    className="flex-1 text-xs flex items-center justify-center"
                  >
                    <Edit size={12} className="mr-1" />
                    {t('tahfiz.edit') || 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(ustadzItem.id)}
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
              {searchTerm ? t('tahfiz.tidakAdaHasil') : t('tahfiz.belumAdaDataUstadz')}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {searchTerm
                ? `${t('tahfiz.tidakDitemukanUstadz')} "${searchTerm}"`
                : t('tahfiz.tambahUstadzPertama')
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleAdd} className="text-xs flex items-center justify-center">
                <Plus size={14} className="mr-1" />
                {t('tahfiz.tambahUstadz')}
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
          setSelectedUstadz(null);
        }}
        title={t('tahfiz.detailUstadz')}
        size="lg"
      >
        {selectedUstadz && (
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col-2 sm:flex-row items-start sm:items-center gap-4 lg:gap-6 p-4 lg:p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <button
                type="button"
                onClick={() => selectedUstadz.profileImage && setIsPhotoPreviewOpen(true)}
                className={`transition-all flex-shrink-0 ${
                  selectedUstadz.profileImage ? 'cursor-pointer hover:shadow-lg hover:scale-105' : 'cursor-default'
                }`}
              >
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg lg:text-2xl">
                  {selectedUstadz.profileImage ? (
                    <img src={selectedUstadz.profileImage} alt={selectedUstadz.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(selectedUstadz.name)
                  )}
                </div>
              </button>
              <div className="flex-1">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">{selectedUstadz.name}</h3>
                <p className="text-sm lg:text-base text-green-600 font-medium mb-2">{(selectedUstadz as any).subject || t('tahfiz.ustadz')}</p>
                <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-600">
                  <span>{t('tahfiz.nip')}: {(selectedUstadz as any).nip || '-'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-3 lg:space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm lg:text-base border-b border-gray-200 pb-2">{t('tahfiz.informasiKontak')}</h4>
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs lg:text-sm text-gray-700 break-all">{selectedUstadz.email}</span>
                  </div>
                  {selectedUstadz.phone ? (
                    <button
                      onClick={() => handleWhatsAppCall(selectedUstadz.phone || '')}
                      className="flex items-center gap-2 text-xs lg:text-sm text-green-600 hover:text-green-700 transition-colors group w-full"
                      title={t('tahfiz.hubungiViaWhatsApp')}
                    >
                      <Phone size={14} className="flex-shrink-0" />
                      <span className="text-gray-700 group-hover:text-green-700">{selectedUstadz.phone}</span>
                      <span className="text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        (WhatsApp)
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-400">
                      <Phone size={14} />
                      <span>{t('tahfiz.tidakAdaNomorTelepon')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <h4 className="font-semibold text-gray-900 text-sm lg:text-base border-b border-gray-200 pb-2">{t('tahfiz.status')}</h4>
                <div className="space-y-2 lg:space-y-3 text-xs lg:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('tahfiz.status')}:</span>
                    {(selectedUstadz as any).isActive !== false ? (
                      <Badge variant="success">{t('common.active')}</Badge>
                    ) : (
                      <Badge variant="default">{t('common.inactive')}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('tahfiz.bergabung')}:</span>
                    <span className="text-gray-700">
                      {selectedUstadz.createdAt ? new Date(selectedUstadz.createdAt).toLocaleDateString(language === 'ms' ? 'ms-MY' : 'id-ID') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 pt-4 lg:pt-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => selectedUstadz && handleViewQRCode(selectedUstadz)}
                className="text-sm lg:text-base flex items-center justify-center"
              >
                <QrCode size={16} className="mr-2" />
                {t('tahfiz.lihatqrcode') || 'Lihat QR Code'}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedUstadz(null);
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
      <TambahUstadzForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
        }}
        onSuccess={() => {
          refreshUstadz();
        }}
      />

      {/* Edit Form Component */}
      <TambahUstadzForm
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setSelectedUstadz(null);
        }}
        onSuccess={() => {
          refreshUstadz();
          setIsEditFormOpen(false);
          setSelectedUstadz(null);
        }}
        editData={selectedUstadz}
      />

      {/* Photo Preview Modal */}
      <PhotoPreviewModal
        isOpen={isPhotoPreviewOpen}
        onClose={() => setIsPhotoPreviewOpen(false)}
        photoUrl={selectedUstadz?.profileImage || null}
        name={selectedUstadz?.name || ''}
      />

      {/* QR Code Modal */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setQrCodeURL('');
        }}
        title={`${t('tahfiz.qrCode') || 'QR Code'} - ${selectedUstadz?.name || ''}`}
        size="md"
      >
        {selectedUstadz && (
          <div className="text-center space-y-4">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block">
              {qrCodeLoading ? (
                <div className="w-64 h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
              <p className="font-medium">{selectedUstadz.name}</p>
              <p className="text-sm text-gray-600">{t('tahfiz.nip')}: {(selectedUstadz as any).nip || '-'}</p>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">{t('tahfiz.caraPenggunaan') || 'Cara Penggunaan'}:</h4>
              <ul className="text-sm text-yellow-800 space-y-1 text-left">
                <li>• {t('tahfiz.qrCodeUntukAbsensiUstadz') || 'QR Code ini digunakan untuk absensi ustadz'}</li>
                <li>• {t('tahfiz.tunjukkanKeAdmin') || 'Tunjukkan kepada admin saat sesi absensi dibuka'}</li>
                <li>• {t('tahfiz.downloadUntukBackup') || 'Download untuk backup atau print kartu pegawai'}</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleDownloadQRCode}
              fullWidth
              className="justify-center flex items-center"
              disabled={!qrCodeURL || qrCodeLoading}
            >
              <Download size={16} className="mr-2" />
              {t('tahfiz.downloadQRCode') || 'Unduh QR Code'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataUstadz;

