import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Eye, UserPlus, Mail, Phone, Users, Search, CheckSquare, Square } from 'lucide-react';
import { User } from '../../../../types';
import { useUstadz } from '../../../../hooks/useUstadz';
import { useSantri } from '../../../../hooks/useSantri';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useKelas } from '../../../../hooks/useKelas';
import { apiService } from '../../../../services/apiService';
import Button from '../../../ui/Button';
import Modal from '../../../ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import Badge from '../../../ui/Badge';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import { showSuccessToast, showErrorToast } from '../../../ui/ToastContainer';
import { useLanguage } from '../../../../context/LanguageContext';

const DetailKelasTahfiz: React.FC = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ustadz } = useUstadz();
  const { santri, refreshSantri } = useSantri();
  const { kelasTahfiz, loading: classesLoading, refreshKelasTahfiz } = useKelasTahfiz();
  const { kelas } = useKelas();

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [santriSearch, setSantriSearch] = useState('');
  const [santriDetail, setSantriDetail] = useState<User | null>(null);

  const toggleSantriStatus = async (santriId: string, currentStatus: boolean) => {
    try {
      const response = await apiService.updateSantriStatus(santriId, !currentStatus);
      if (response.success) {
        showSuccessToast(t('common.success'), !currentStatus ? t('tahfiz.santriBerhasilDiaktifkan') : t('tahfiz.santriBerhasilDinonaktifkan'));
        await refreshSantri();
      } else {
        showErrorToast(t('common.error'), response.message || t('tahfiz.gagalMengubahStatusSantri'));
      }
    } catch (error: any) {
      showErrorToast(t('common.error'), error.message || t('tahfiz.terjadiKesalahanMengubahStatusSantri'));
    }
  };

  const selectedClass = useMemo(
    () => kelasTahfiz.find((cls) => cls.id === id) || null,
    [kelasTahfiz, id]
  );

  const ustadzMap = useMemo(() => {
    const map = new Map<string, User>();
    ustadz.forEach((item) => map.set(item.id, item));
    return map;
  }, [ustadz]);

  const assignedSantri = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.santriIds
      .map((santriId) => santri.find((s) => s.id === santriId))
      .filter(Boolean) as User[];
  }, [selectedClass, santri]);

  const filteredSantriForAssign = useMemo(() => {
    const query = santriSearch.toLowerCase();
    return santri.filter((item) => {
      const name = (item?.name || '').toLowerCase();
      const email = (item?.email || '').toLowerCase();
      const nisn = String((item as any)?.nisn || '').toLowerCase();
      const whatsappOrtu = String((item as any)?.whatsappOrtu || '').toLowerCase();
      return name.includes(query) || email.includes(query) || nisn.includes(query) || whatsappOrtu.includes(query);
    });
  }, [santri, santriSearch]);

  // Create kelas map for quick lookup
  const kelasMap = useMemo(() => {
    const map = new Map<string, string>();
    kelas.forEach((k) => map.set(k.id, k.name));
    return map;
  }, [kelas]);

  // Group santri by kelas
  const groupedSantriForAssign = useMemo(() => {
    const groups: Array<{ kelasId: string | null; kelasName: string; santri: User[] }> = [];
    const kelasGroups = new Map<string, User[]>();
    const umumGroup: User[] = [];

    filteredSantriForAssign.forEach((item) => {
      const isFromMurid = (item as any).isFromMurid === true;
      const kelasId = (item as any).kelasId;

      if (isFromMurid && kelasId) {
        // Group by kelas
        if (!kelasGroups.has(kelasId)) {
          kelasGroups.set(kelasId, []);
        }
        kelasGroups.get(kelasId)!.push(item);
      } else {
        // Add to umum group
        umumGroup.push(item);
      }
    });

    // Convert kelas groups to array and sort by kelas name
    kelasGroups.forEach((santriList, kelasId) => {
      const kelasName = kelasMap.get(kelasId) || t('tahfiz.kelasTidakDiketahui');
      groups.push({
        kelasId,
        kelasName,
        santri: santriList.sort((a, b) => a.name.localeCompare(b.name)),
      });
    });

    // Sort groups by kelas name
    groups.sort((a, b) => a.kelasName.localeCompare(b.kelasName));

    // Add umum group at the end if it has items
    if (umumGroup.length > 0) {
      umumGroup.sort((a, b) => a.name.localeCompare(b.name));
      groups.push({
        kelasId: null,
        kelasName: t('tahfiz.umum'),
        santri: umumGroup,
      });
    }

    return groups;
  }, [filteredSantriForAssign, kelasMap]);

  // Check if all santri in a group are selected
  const isGroupAllSelected = (santriList: User[]) => {
    return santriList.length > 0 && santriList.every((s) => selectedSantriIds.includes(s.id));
  };

  // Toggle select all for a group
  const toggleSelectAllGroup = (santriList: User[]) => {
    const allSelected = isGroupAllSelected(santriList);
    if (allSelected) {
      // Deselect all in this group
      setSelectedSantriIds((prev) => prev.filter((id) => !santriList.some((s) => s.id === id)));
    } else {
      // Select all in this group
      const newIds = santriList.map((s) => s.id);
      setSelectedSantriIds((prev) => {
        const existingIds = new Set(prev);
        newIds.forEach((id) => existingIds.add(id));
        return Array.from(existingIds);
      });
    }
  };

  const openAssignSantri = () => {
    if (!selectedClass) return;
    setSelectedSantriIds(selectedClass.santriIds);
    setSantriSearch('');
    setIsAssignOpen(true);
  };

  const handleAssignSantri = async () => {
    if (!selectedClass) return;
    try {
      const response = await apiService.updateKelasTahfiz(selectedClass.id, {
        santriIds: Array.from(new Set(selectedSantriIds)),
      });
      if (response.success) {
        await refreshKelasTahfiz();
        showSuccessToast(t('common.success'), t('tahfiz.santriBerhasilDiperbarui'));
        setIsAssignOpen(false);
      } else {
        showErrorToast(t('common.error'), response.message || t('tahfiz.gagalMemperbaruiSantri'));
      }
    } catch (error: any) {
      showErrorToast(t('common.error'), error.message || t('tahfiz.terjadiKesalahanMemperbaruiSantri'));
    }
  };

  const handleRemoveSantriFromClass = async (santriId: string) => {
    if (!selectedClass) return;
    showDangerConfirmation(
      t('tahfiz.hapusSantriDariKelas'),
      `${t('tahfiz.hapusSantriDariKelasConfirm')} "${selectedClass.namaKelas}"?`,
      async () => {
        try {
          const updatedSantriIds = selectedClass.santriIds.filter((id) => id !== santriId);
          const response = await apiService.updateKelasTahfiz(selectedClass.id, {
            santriIds: updatedSantriIds,
          });
          if (response.success) {
            await refreshKelasTahfiz();
            showSuccessToast(t('common.success'), t('tahfiz.santriBerhasilDihapusDariKelas'));
          } else {
            showErrorToast(t('common.error'), response.message || t('tahfiz.gagalMenghapusSantriDariKelas'));
          }
        } catch (error: any) {
          showErrorToast(t('common.error'), error.message || t('tahfiz.terjadiKesalahanMenghapusSantriDariKelas'));
        }
      },
      {
        confirmText: t('tahfiz.yaHapus'),
        cancelText: t('common.cancel'),
      }
    );
  };

  const toggleSelectSantri = (santriId: string) => {
    setSelectedSantriIds((prev) =>
      prev.includes(santriId) ? prev.filter((id) => id !== santriId) : [...prev, santriId]
    );
  };

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-600">{t('tahfiz.memuatDataKelas')}</p>
        </div>
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.kelasTidakDitemukan')}</h3>
          <p className="text-sm text-slate-600 mb-4">{t('tahfiz.kelasYangAndaCariTidakAda')}</p>
          <Button onClick={() => navigate('/dashboard/data-kelas-tahfiz')}>
            {t('tahfiz.kembaliKeDaftarKelas')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/dashboard/data-kelas-tahfiz')}
                variant="secondary"
                className="!p-2 bg-white/20 hover:bg-white/30 text-white border-0"
                title={t('common.back')}
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                  {t('tahfiz.detailKelas')} {selectedClass.namaKelas}
                </h1>
                <p className="text-sm sm:text-base text-emerald-100">
                  {t('tahfiz.kelolaSantriDiKelas')}
                </p>
              </div>
            </div>
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <Button
                onClick={openAssignSantri}
                className="flex items-center justify-center text-xs sm:text-sm bg-blue-600 text-emerald-700 hover:bg-blue-700"
              >
                <UserPlus size={14} className="mr-2" />
                <span>{t('tahfiz.masukkanSantri')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Class Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 mb-2">{t('tahfiz.namaKelas')}</p>
          <p className="text-lg font-semibold text-slate-900">{selectedClass.namaKelas}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 mb-2">{t('tahfiz.ruangan')}</p>
          <p className="text-lg font-semibold text-slate-900">{selectedClass.ruangan}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 mb-2">{t('tahfiz.ustadz')}</p>
          <p className="text-lg font-semibold text-slate-900">
            {ustadzMap.get(selectedClass.ustadzId)?.name || t('tahfiz.belumDiatur')}
          </p>
        </div>
      </div>

      {/* Santri Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {t('tahfiz.santriDiKelas')} ({assignedSantri.length} {t('tahfiz.santri')})
          </h3>
        </div>

        {/* Desktop Table View */}
        {assignedSantri.length > 0 ? (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableCell header className="text-sm">
                      {t('tahfiz.namaSantri')}
                    </TableCell>
                    <TableCell header className="text-sm">
                      {t('tahfiz.kontak')}
                    </TableCell>
                    <TableCell header className="text-sm">
                      {t('tahfiz.status')}
                    </TableCell>
                    <TableCell header className="text-sm">
                      {t('tahfiz.aksi')}
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedSantri.map((santriItem) => (
                    <TableRow key={santriItem.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-sm font-medium text-slate-900">{santriItem.name}</TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-slate-600">
                            <Mail size={12} className="mr-2" />
                            <span className="truncate">{santriItem.email || '-'}</span>
                          </div>
                          {(santriItem as any).whatsappOrtu && (
                            <div className="flex items-center text-xs text-slate-600">
                              <Phone size={12} className="mr-2" />
                              <span>{(santriItem as any).whatsappOrtu}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleSantriStatus(santriItem.id, (santriItem as any).isActive !== false)
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                              (santriItem as any).isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                (santriItem as any).isActive !== false ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-medium">
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
                            onClick={() => setSantriDetail(santriItem)}
                            className="!p-2 flex items-center justify-center"
                            title={t('tahfiz.lihatDetail')}
                          >
                            <Eye size={14} className="mr-2"/>{t('tahfiz.detail')}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRemoveSantriFromClass(santriItem.id)}
                            className="!p-2 flex items-center justify-center"
                            title={t('tahfiz.hapus')}
                          >
                            <Trash2 size={14} className="mr-2"/>{t('tahfiz.hapus')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {assignedSantri.map((santriItem) => (
                <div key={santriItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-slate-900 text-sm truncate">{santriItem.name}</h5>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs">
                        <Mail size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 truncate">{santriItem.email || '-'}</span>
                      </div>
                      {(santriItem as any).whatsappOrtu && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600">{(santriItem as any).whatsappOrtu}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          toggleSantriStatus(santriItem.id, (santriItem as any).isActive !== false)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                          (santriItem as any).isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            (santriItem as any).isActive !== false ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-medium">
                        {(santriItem as any).isActive !== false ? (
                          <Badge variant="success">{t('common.active')}</Badge>
                        ) : (
                          <Badge variant="default">{t('common.inactive')}</Badge>
                        )}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSantriDetail(santriItem)}
                        className="flex-1 text-xs flex items-center justify-center"
                      >
                        <Eye size={12} className="mr-1" />
                        {t('tahfiz.detail')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveSantriFromClass(santriItem.id)}
                        className="flex-1 text-xs flex items-center justify-center"
                      >
                        <Trash2 size={12} className="mr-1" />
                        {t('tahfiz.hapus')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 px-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">{t('tahfiz.belumAdaSantri')}</h3>
            <p className="text-sm text-slate-600 mb-4">{t('tahfiz.tambahkanSantriKeKelas')}</p>
            <Button onClick={openAssignSantri} className="text-sm bg-blue-600">
              {t('tahfiz.masukkanSantri')}
            </Button>
          </div>
        )}
      </div>

      {/* Assign Santri Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title={t('tahfiz.masukkanSantriKeKelas')}
        size="xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={santriSearch}
              onChange={(e) => setSantriSearch(e.target.value)}
              placeholder={t('tahfiz.cariSantriDetail')}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-6 max-h-[600px] overflow-y-auto">
            {groupedSantriForAssign.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500 border border-slate-200 rounded-lg">
                {t('tahfiz.tidakAdaSantriYangCocok')}
              </div>
            ) : (
              groupedSantriForAssign.map((group) => (
                <div key={group.kelasId || 'umum'} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Group Header */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">{group.kelasName}</h4>
                    <button
                      type="button"
                      onClick={() => toggleSelectAllGroup(group.santri)}
                      className="flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {isGroupAllSelected(group.santri) ? (
                        <CheckSquare size={16} className="text-emerald-600" />
                      ) : (
                        <Square size={16} className="text-slate-400" />
                      )}
                      <span>{t('tahfiz.pilihSemua')}</span>
                    </button>
                  </div>

                  {/* Group Table */}
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white">
                        <TableCell header className="text-sm w-12">
                          <span className="sr-only">{t('tahfiz.pilihSemua')}</span>
                        </TableCell>
                        <TableCell header className="text-sm">
                          {t('tahfiz.namaSantri')}
                        </TableCell>
                        <TableCell header className="text-sm">
                          {t('tahfiz.email')}
                        </TableCell>
                        <TableCell header className="text-sm">
                          {t('tahfiz.nomorTelepon')}
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.santri.map((santriItem) => {
                        const checked = selectedSantriIds.includes(santriItem.id);
                        const handleToggle = () => toggleSelectSantri(santriItem.id);
                        return (
                          <TableRow
                            key={santriItem.id}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={handleToggle}
                          >
                            <TableCell className="text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggle();
                                }}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                              </button>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-900">{santriItem.name}</TableCell>
                            <TableCell className="text-sm">{santriItem.email || '-'}</TableCell>
                            <TableCell className="text-sm">{(santriItem as any).whatsappOrtu || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsAssignOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button className="bg-emerald-600" onClick={handleAssignSantri}>
              {t('tahfiz.simpan')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Santri Detail Modal */}
      <Modal
        isOpen={!!santriDetail}
        onClose={() => setSantriDetail(null)}
        title={t('tahfiz.detailSantriModal')}
        size="sm"
      >
        {santriDetail && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">{t('tahfiz.nama')}</p>
              <p className="font-semibold text-slate-900">{santriDetail.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('tahfiz.email')}</p>
              <p className="text-slate-800">{santriDetail.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t('tahfiz.nisn')}</p>
              <p className="text-slate-800">{(santriDetail as any).nisn || '-'}</p>
            </div>
            {(santriDetail as any).whatsappOrtu && (
              <div>
                <p className="text-xs text-slate-500">{t('tahfiz.kontak')}</p>
                <p className="text-slate-800">{(santriDetail as any).whatsappOrtu}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DetailKelasTahfiz;

