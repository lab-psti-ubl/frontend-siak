import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Power, PowerOff, Copy, CheckCircle, Pencil } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';
import { AlatRFID } from '../../../../types';
import TambahAlatRFIDModal, { JenisAbsenAlat } from './TambahAlatRFIDModal';
import EditAlatRFIDModal from './EditAlatRFIDModal';
import { showToast } from '../../../ui/ToastContainer';
import { apiService } from '../../../../services/apiService';
import { usePengaturanSistem } from '../../../../hooks/usePengaturanSistem';
import { useLanguage } from '../../../../context/LanguageContext';

const ManajemenAlatRFID: React.FC = () => {
  const { t } = useLanguage();
  const [alatRfid, setAlatRfid] = useState<AlatRFID[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAlat, setSelectedAlat] = useState<AlatRFID | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const { enableEarlyDeparture, updateEnableEarlyDeparture } = usePengaturanSistem();

  useEffect(() => {
    fetchAlatRFID();
  }, []);

  const fetchAlatRFID = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAllAlatRFID();
      if (response.success && response.alatRfid) {
        setAlatRfid(response.alatRfid);
      }
    } catch (error) {
      console.error('Error fetching alat RFID:', error);
      showToast(t('manajemenAlatRFID.gagalMemuat'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAlat = async (namaAlat: string, lokasi: string, jenisAbsen: JenisAbsenAlat = 'rfid') => {
    try {
      const response = await apiService.createAlatRFID({
        namaAlat,
        lokasi,
        status: 'aktif',
        jenisAbsen,
      });

      if (response.success) {
        setShowModal(false);
        showToast(t('manajemenAlatRFID.alatBerhasilDitambahkan', { nama: namaAlat }), 'success');
        fetchAlatRFID();
      } else {
        showToast(response.message || t('manajemenAlatRFID.gagalMenambahkan'), 'error');
      }
    } catch (error: any) {
      console.error('Error adding alat RFID:', error);
      showToast(error.message || t('manajemenAlatRFID.gagalMenambahkan'), 'error');
    }
  };

  const handleEditAlat = async (id: string, namaAlat: string, lokasi: string, jenisAbsen: JenisAbsenAlat = 'rfid') => {
    try {
      const response = await apiService.updateAlatRFID(id, {
        namaAlat,
        lokasi,
        jenisAbsen,
      });

      if (response.success) {
        setShowEditModal(false);
        setSelectedAlat(null);
        showToast(t('manajemenAlatRFID.alatBerhasilDiperbarui', { nama: namaAlat }), 'success');
        fetchAlatRFID();
      } else {
        showToast(response.message || t('manajemenAlatRFID.gagalMemperbarui'), 'error');
      }
    } catch (error: any) {
      console.error('Error updating alat RFID:', error);
      showToast(error.message || t('manajemenAlatRFID.gagalMemperbarui'), 'error');
    }
  };

  const openEditModal = (alat: AlatRFID) => {
    setSelectedAlat(alat);
    setShowEditModal(true);
  };

  const handleDeleteAlat = async (id: string) => {
    const alatToDelete = alatRfid.find(a => a.id === id);
    if (!window.confirm(t('manajemenAlatRFID.confirmHapus', { nama: alatToDelete?.namaAlat || '' }))) {
      return;
    }

    try {
      const response = await apiService.deleteAlatRFID(id);
      if (response.success) {
        showToast(t('manajemenAlatRFID.alatBerhasilDihapus', { nama: alatToDelete?.namaAlat || '' }), 'success');
        fetchAlatRFID();
      } else {
        showToast(response.message || t('manajemenAlatRFID.gagalMenghapus'), 'error');
      }
    } catch (error: any) {
      console.error('Error deleting alat RFID:', error);
      showToast(error.message || t('manajemenAlatRFID.gagalMenghapus'), 'error');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const response = await apiService.toggleStatusAlatRFID(id);
      if (response.success) {
        fetchAlatRFID();
      } else {
        showToast(response.message || t('manajemenAlatRFID.gagalMengubahStatus'), 'error');
      }
    } catch (error: any) {
      console.error('Error toggling status alat RFID:', error);
      showToast(error.message || t('manajemenAlatRFID.gagalMengubahStatus'), 'error');
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    showToast(t('manajemenAlatRFID.tokenBerhasilDisalin'), 'success');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const openMonitoring = (alatId: string, token: string) => {
    const alat = alatRfid.find(a => a.id === alatId);

    if (!alat) {
      showToast(t('manajemenAlatRFID.alatTidakDitemukan'), 'error');
      return;
    }

    if (alat.status === 'nonaktif') {
      showToast(t('manajemenAlatRFID.alatDinonaktifkan'), 'error');
      return;
    }

    // Open monitoring in a new tab
    const monitoringUrl = `/rfid-monitoring?alatId=${encodeURIComponent(alatId)}&token=${encodeURIComponent(token)}`;
    window.open(monitoringUrl, '_blank');
  };

  const handleToggleEarlyDeparture = async () => {
    const newState = !enableEarlyDeparture;

    try {
      await updateEnableEarlyDeparture(newState);
      showToast(
        newState
          ? 'Pulang cepat diaktifkan - murid dapat absen pulang kapan saja'
          : 'Pulang cepat dinonaktifkan - murid hanya dapat absen pulang 15 menit sebelum jam pulang',
        'success'
      );
    } catch (error: any) {
      console.error('Error updating early departure:', error);
      showToast('Gagal mengubah pengaturan pulang cepat', 'error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('manajemenAlatRFID.title')}</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('manajemenAlatRFID.subtitle')}</p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto flex items-center justify-center sm:justify-start"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">{t('manajemenAlatRFID.tambahAlat')}</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-0 shadow-lg">
          <div className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">{t('manajemenAlatRFID.totalAlat')}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{alatRfid.length}</p>
          </div>
        </Card>
        <Card className="border-0 shadow-lg">
          <div className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">{t('manajemenAlatRFID.alatAktif')}</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">
              {alatRfid.filter(a => a.status === 'aktif').length}
            </p>
          </div>
        </Card>
        <Card className="border-0 shadow-lg">
          <div className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">{t('manajemenAlatRFID.alatNonaktif')}</p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">
              {alatRfid.filter(a => a.status === 'nonaktif').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Table - Desktop View */}
      <Card className="border-0 shadow-lg hidden lg:block">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">{t('manajemenAlatRFID.memuatData')}</p>
            </div>
          ) : alatRfid.length > 0 ? (
            <>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">{t('manajemenAlatRFID.namaAlat')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">{t('manajemenAlatRFID.lokasi')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">{t('manajemenAlatRFID.jenisAbsen')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">{t('manajemenAlatRFID.tokenAkses')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">{t('manajemenAlatRFID.status')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">{t('common.aksi')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {alatRfid.map((alat) => (
                      <tr key={alat.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{alat.namaAlat}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-700">{alat.lokasi}</span>
                        </td>
                        <td className="py-3 px-4">
                          {alat.jenisAbsen === 'facerecognition' ? (
                            <Badge variant="warning">
                              {t('manajemenAlatRFID.faceRecognitionOption')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              RFID
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 text-sm font-mono">{alat.token.substring(0, 8)}...</span>
                            <button
                              onClick={() => handleCopyToken(alat.token)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title={t('manajemenAlatRFID.salinToken')}
                            >
                              {copiedToken === alat.token ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={alat.status === 'aktif' ? 'success' : 'warning'}>
                            {alat.status === 'aktif' ? t('manajemenAlatRFID.aktif') : t('manajemenAlatRFID.tidakAktif')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openMonitoring(alat.id, alat.token)}
                              disabled={alat.status === 'nonaktif'}
                              className={`p-2 rounded transition-colors ${
                                alat.status === 'nonaktif'
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'hover:bg-blue-100 text-blue-600'
                              }`}
                              title={alat.status === 'nonaktif' ? t('manajemenAlatRFID.alatHarusAktif') : t('manajemenAlatRFID.bukaMonitoring')}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(alat)}
                              className="p-2 hover:bg-indigo-100 text-indigo-600 rounded transition-colors"
                              title={t('manajemenAlatRFID.edit')}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(alat.id)}
                              className={`p-2 rounded transition-colors ${
                                alat.status === 'aktif'
                                  ? 'hover:bg-orange-100 text-orange-600'
                                  : 'hover:bg-emerald-100 text-emerald-600'
                              }`}
                              title={alat.status === 'aktif' ? t('manajemenAlatRFID.matikan') : t('manajemenAlatRFID.aktifkan')}
                            >
                              {alat.status === 'aktif' ? (
                                <Power className="w-4 h-4" />
                              ) : (
                                <PowerOff className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteAlat(alat.id)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                              title={t('manajemenAlatRFID.hapus')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Eye className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('manajemenAlatRFID.belumAdaAlat')}</h3>
              <p className="text-gray-600 mb-6">{t('manajemenAlatRFID.mulaiDenganMenambah')}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <Card className="border-0 shadow-lg">
            <div className="p-4 sm:p-6">
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">{t('manajemenAlatRFID.memuatData')}</p>
              </div>
            </div>
          </Card>
        ) : alatRfid.length > 0 ? (
          <>
            {/* Pulang Cepat Toggle - Mobile */}
            <Card className="border-0 shadow-lg">
              <div className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-1">Pulang Cepat</span>
                    <span className="text-xs text-gray-500">
                      {enableEarlyDeparture ? 'Murid dapat absen pulang kapan saja' : 'Murid hanya dapat absen pulang 15 menit sebelum jam pulang'}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleEarlyDeparture}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                      enableEarlyDeparture ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                    title={enableEarlyDeparture ? 'Nonaktifkan untuk batasan 15 menit sebelum pulang' : 'Aktifkan untuk absen pulang tanpa batasan waktu'}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        enableEarlyDeparture ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>

            {/* Alat RFID Cards */}
            {alatRfid.map((alat) => (
              <Card key={alat.id} className="border-0 shadow-lg">
                <div className="p-4">
                  {/* Header with Nama and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{alat.namaAlat}</h3>
                      <p className="text-sm text-gray-600 mt-1 truncate">{alat.lokasi}</p>
                    </div>
                      <div className="flex flex-wrap gap-1.5 ml-2 flex-shrink-0">
                        <Badge
                          variant={alat.jenisAbsen === 'facerecognition' ? 'warning' : 'secondary'}
                          size="sm"
                        >
                          {alat.jenisAbsen === 'facerecognition' ? 'Face Recognition' : 'RFID'}
                        </Badge>
                        <Badge variant={alat.status === 'aktif' ? 'success' : 'warning'} size="sm">
                          {alat.status === 'aktif' ? t('manajemenAlatRFID.aktif') : t('manajemenAlatRFID.tidakAktif')}
                        </Badge>
                      </div>
                  </div>

                  {/* Token Section */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">{t('manajemenAlatRFID.tokenAkses')}</p>
                        <p className="text-sm font-mono text-gray-900 break-all">{alat.token}</p>
                      </div>
                      <button
                        onClick={() => handleCopyToken(alat.token)}
                        className="ml-2 p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        title={t('manajemenAlatRFID.salinToken')}
                      >
                        {copiedToken === alat.token ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openMonitoring(alat.id, alat.token)}
                      disabled={alat.status === 'nonaktif'}
                      className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        alat.status === 'nonaktif'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>{t('manajemenAlatRFID.monitoring')}</span>
                    </button>
                    <button
                      onClick={() => openEditModal(alat)}
                      className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>{t('manajemenAlatRFID.edit')}</span>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(alat.id)}
                      className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        alat.status === 'aktif'
                          ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 active:bg-orange-200'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:bg-emerald-200'
                      }`}
                    >
                      {alat.status === 'aktif' ? (
                        <>
                          <Power className="w-4 h-4" />
                          <span>{t('manajemenAlatRFID.matikan')}</span>
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-4 h-4" />
                          <span>{t('manajemenAlatRFID.aktifkan')}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteAlat(alat.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('manajemenAlatRFID.hapus')}</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </>
        ) : (
          <Card className="border-0 shadow-lg">
            <div className="p-4 sm:p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Eye className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('manajemenAlatRFID.belumAdaAlat')}</h3>
                <p className="text-gray-600 mb-6 text-sm">{t('manajemenAlatRFID.mulaiDenganMenambah')}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <TambahAlatRFIDModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddAlat}
        />
      )}
      {showEditModal && selectedAlat && (
        <EditAlatRFIDModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAlat(null);
          }}
          alat={selectedAlat}
          onSubmit={(id, namaAlat, lokasi, jenisAbsen) => handleEditAlat(id, namaAlat, lokasi, jenisAbsen)}
        />
      )}
    </div>
  );
};

export default ManajemenAlatRFID;
