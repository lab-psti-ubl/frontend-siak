import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Clock,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { TahfizClass, useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useUstadz } from '../../../../hooks/useUstadz';
import { useJadwalTahfiz } from '../../../../hooks/useJadwalTahfiz';
import { TahfizSchedule, User } from '../../../../types';
import Button from '../../../ui/Button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../../ui/Table';
import Modal from '../../../ui/Modal';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import { showErrorToast, showSuccessToast } from '../../../ui/ToastContainer';
import { apiService } from '../../../../services/apiService';
import TambahJadwalTahfizForm, { JadwalTahfizPayload } from '../../forms/TambahJadwalTahfizForm';
import { useLanguage } from '../../../../context/LanguageContext';

const DataJadwalTahfiz: React.FC = () => {
  const { t } = useLanguage();
  
  const dayOptions = [
    { value: 'senin', label: t('tahfiz.hariSenin') },
    { value: 'selasa', label: t('tahfiz.hariSelasa') },
    { value: 'rabu', label: t('tahfiz.hariRabu') },
    { value: 'kamis', label: t('tahfiz.hariKamis') },
    { value: 'jumat', label: t('tahfiz.hariJumat') },
    { value: 'sabtu', label: t('tahfiz.hariSabtu') },
    { value: 'minggu', label: t('tahfiz.hariMinggu') },
  ];

  const { kelasTahfiz, loading: kelasLoading } = useKelasTahfiz();
  const { ustadz } = useUstadz();
  const { jadwalTahfiz, loading: jadwalLoading, refreshJadwalTahfiz } = useJadwalTahfiz();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingJadwal, setEditingJadwal] = useState<TahfizSchedule | null>(null);
  const [detailJadwal, setDetailJadwal] = useState<TahfizSchedule | null>(null);

  const kelasMap = useMemo(() => {
    const map = new Map<string, TahfizClass>();
    kelasTahfiz.forEach((item) => map.set(item.id, item));
    return map;
  }, [kelasTahfiz]);

  const ustadzMap = useMemo(() => {
    const map = new Map<string, User>();
    ustadz.forEach((item) => map.set(item.id, item));
    return map;
  }, [ustadz]);

  const enrichedJadwal = useMemo(() => {
    return jadwalTahfiz.map((item) => {
      const kelas = kelasMap.get(item.kelasId);
      const ustadzName = kelas ? ustadzMap.get(kelas.ustadzId)?.name || t('tahfiz.belumDiatur') : t('tahfiz.belumDiatur');
      return {
        ...item,
        kelas,
        ustadzName,
      };
    });
  }, [jadwalTahfiz, kelasMap, ustadzMap]);

  const filteredJadwal = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return enrichedJadwal.filter((item) => {
      const kelasName = item.kelas?.namaKelas?.toLowerCase() || '';
      const ruangan = item.kelas?.ruangan?.toLowerCase() || '';
      const ustadzName = item.ustadzName.toLowerCase();
      const hariLabel = dayOptions.find((d) => d.value === item.hari)?.label.toLowerCase() || '';

      return (
        kelasName.includes(query) ||
        ruangan.includes(query) ||
        ustadzName.includes(query) ||
        hariLabel.includes(query)
      );
    });
  }, [enrichedJadwal, searchTerm]);

  const resetForm = () => {
    setEditingJadwal(null);
  };

  const openCreate = () => {
    setFormMode('create');
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (jadwal: TahfizSchedule) => {
    setFormMode('edit');
    setEditingJadwal(jadwal);
    setIsFormOpen(true);
  };

  const handleFormSuccess = async (payload: JadwalTahfizPayload, mode: 'create' | 'edit') => {
    try {
      if (mode === 'create') {
        await apiService.createJadwalTahfiz(payload);
        showSuccessToast(t('common.success'), t('tahfiz.jadwalBerhasilDitambahkan'));
      } else if (payload.id) {
        await apiService.updateJadwalTahfiz(payload.id, payload);
        showSuccessToast(t('common.success'), t('tahfiz.jadwalBerhasilDiperbarui'));
      }

      await refreshJadwalTahfiz();
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('tahfiz.terjadiKesalahanMenyimpanJadwal');
      showErrorToast(t('common.error'), message);
    }
  };

  const handleDelete = (jadwal: TahfizSchedule) => {
    const kelasName = kelasMap.get(jadwal.kelasId)?.namaKelas || 'Kelas';
    const hariLabel = dayOptions.find((d) => d.value === jadwal.hari)?.label || jadwal.hari;

    showDangerConfirmation(
      t('tahfiz.hapusJadwalConfirm'),
      `${t('tahfiz.hapusJadwalConfirmText')} ${kelasName} ${t('tahfiz.hariText')} ${hariLabel}?`,
      async () => {
        try {
          await apiService.deleteJadwalTahfiz(jadwal.id);
          showSuccessToast(t('common.success'), t('tahfiz.jadwalBerhasilDihapus'));
          await refreshJadwalTahfiz();
        } catch (err) {
          const message = err instanceof Error ? err.message : t('tahfiz.gagalMenghapusJadwal');
          showErrorToast(t('common.error'), message);
        }
      },
      {
        confirmText: t('tahfiz.yaHapus'),
        cancelText: t('common.cancel'),
      }
    );
  };

  const renderWaktu = (jadwal: TahfizSchedule) => `${jadwal.jamMulai} - ${jadwal.jamSelesai}`;

  const isLoading = jadwalLoading || kelasLoading;

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
              {t('tahfiz.dataJadwalTahfiz')}
            </h1>
            <p className="text-sm sm:text-base text-emerald-100">
              {t('tahfiz.dataJadwalTahfizDesc')}
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-blue-600 text-emerald-700 hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>{t('tahfiz.tambahJadwal')}</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder={t('tahfiz.cariJadwal')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="text-xs sm:text-sm text-slate-600">
              {t('tahfiz.menampilkan')} <span className="font-semibold text-slate-900">{filteredJadwal.length}</span> {t('tahfiz.dari')}{' '}
              <span className="font-semibold text-slate-900">{jadwalTahfiz.length}</span> {t('tahfiz.jadwal')}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{t('tahfiz.daftarJadwalTahfiz')}</h3>
        </div>
        {isLoading ? (
          <div className="text-center py-12 px-6">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">{t('tahfiz.memuatDataJadwal')}</p>
          </div>
        ) : filteredJadwal.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableCell header className="text-sm">
                    {t('tahfiz.namaKelas')}
                  </TableCell>
                  <TableCell header className="text-sm">
                    {t('tahfiz.ruangan')}
                  </TableCell>
                  <TableCell header className="text-sm">
                    {t('tahfiz.namaUstadz')}
                  </TableCell>
                  <TableCell header className="text-sm">
                    {t('tahfiz.hari')}
                  </TableCell>
                  <TableCell header className="text-sm">
                    {t('tahfiz.waktu')}
                  </TableCell>
                  <TableCell header className="text-sm">
                    {t('tahfiz.aksi')}
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJadwal.map((item) => {
                  const kelas = kelasMap.get(item.kelasId);
                  const hariLabel = dayOptions.find((d) => d.value === item.hari)?.label || item.hari;
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-sm font-medium text-slate-900">{kelas?.namaKelas || '-'}</TableCell>
                      <TableCell className="text-sm">{kelas?.ruangan || '-'}</TableCell>
                      <TableCell className="text-sm">{item.ustadzName}</TableCell>
                      <TableCell className="text-sm capitalize">{hariLabel}</TableCell>
                      <TableCell className="text-sm">{renderWaktu(item)}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDetailJadwal(item)}
                            className="!p-2 flex items-center justify-center"
                            title={t('tahfiz.lihatDetail')}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEdit(item)}
                            className="!p-2 flex items-center justify-center"
                            title={t('tahfiz.editJadwal')}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(item)}
                            className="!p-2 flex items-center justify-center"
                            title={t('tahfiz.hapusJadwal')}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <CalendarClock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasil') : t('tahfiz.belumAdaJadwal')}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {searchTerm ? t('tahfiz.ubahKataKunci') : t('tahfiz.tambahJadwalPertama')}
            </p>
            {!searchTerm && (
              <Button onClick={openCreate} className="text-sm">
                {t('tahfiz.tambahJadwal')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-12 px-4">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">{t('tahfiz.memuatDataJadwal')}</p>
          </div>
        ) : filteredJadwal.length > 0 ? (
          filteredJadwal.map((item) => {
            const kelas = kelasMap.get(item.kelasId);
            const hariLabel = dayOptions.find((d) => d.value === item.hari)?.label || item.hari;
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">{t('tahfiz.kelas')}</p>
                      <h4 className="font-semibold text-slate-900 text-base">{kelas?.namaKelas || '-'}</h4>
                      <p className="text-xs text-slate-600 mt-1">{t('tahfiz.ruangan')}: {kelas?.ruangan || '-'}</p>
                      <p className="text-xs text-slate-600">{t('tahfiz.ustadz')}: {item.ustadzName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                      <CalendarClock size={14} />
                      <span className="capitalize">{hariLabel}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Clock size={14} className="text-emerald-600" />
                    <span>{renderWaktu(item)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDetailJadwal(item)}
                      className="text-xs"
                    >
                      <Eye size={12} className="mr-1" />
                      {t('tahfiz.detail')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEdit(item)}
                      className="text-xs"
                    >
                      <Edit size={12} className="mr-1" />
                      {t('tahfiz.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(item)}
                      className="text-xs"
                    >
                      <Trash2 size={12} className="mr-1" />
                      {t('tahfiz.hapus')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4">
            <CalendarClock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasil') : t('tahfiz.belumAdaJadwal')}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {searchTerm
                ? `${t('tahfiz.tidakDitemukanJadwal')} "${searchTerm}"`
                : t('tahfiz.tambahJadwalPertama')}
            </p>
            {!searchTerm && (
              <Button onClick={openCreate} className="text-sm">
                {t('tahfiz.tambahJadwal')}
              </Button>
            )}
          </div>
        )}
      </div>

      <TambahJadwalTahfizForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          resetForm();
        }}
        onSuccess={handleFormSuccess}
        mode={formMode}
        initialData={editingJadwal}
        kelasTahfiz={kelasTahfiz}
        ustadz={ustadz}
      />

      <Modal
        isOpen={!!detailJadwal}
        onClose={() => setDetailJadwal(null)}
        title={t('tahfiz.detailJadwalTahfiz')}
      >
        {detailJadwal ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">{t('tahfiz.kelas')}</p>
              <p className="text-base font-semibold text-slate-900">
                {kelasMap.get(detailJadwal.kelasId)?.namaKelas || '-'}
              </p>
              <p className="text-sm text-slate-600">
                {t('tahfiz.ruangan')}: {kelasMap.get(detailJadwal.kelasId)?.ruangan || '-'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide">{t('tahfiz.pengampu')}</p>
              <p className="text-sm font-medium text-slate-900">
                {ustadzMap.get(kelasMap.get(detailJadwal.kelasId)?.ustadzId || '')?.name || t('tahfiz.belumDiatur')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide">{t('tahfiz.hari')}</p>
              <p className="text-sm font-medium text-slate-900 capitalize">
                {dayOptions.find((d) => d.value === detailJadwal.hari)?.label || detailJadwal.hari}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide">{t('tahfiz.waktu')}</p>
              <p className="text-sm font-medium text-slate-900">{renderWaktu(detailJadwal)}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setDetailJadwal(null)}>
                {t('common.close')}
              </Button>
              <Button
                onClick={() => {
                  setDetailJadwal(null);
                  openEdit(detailJadwal);
                }}
              >
                {t('tahfiz.editJadwalButton')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">{t('tahfiz.dataJadwalTidakDitemukan')}</p>
        )}
      </Modal>
    </div>
  );
};

export default DataJadwalTahfiz;

