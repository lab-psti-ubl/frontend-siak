import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Eye,
  Edit,
  Search,
  Users,
} from 'lucide-react';
import { useUstadz } from '../../../../hooks/useUstadz';
import { useKelasTahfiz, TahfizClass } from '../../../../hooks/useKelasTahfiz';
import { apiService } from '../../../../services/apiService';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import { showDangerConfirmation } from '../../../../utils/confirmationUtils';
import { showSuccessToast, showErrorToast } from '../../../ui/ToastContainer';
import TambahKelasTahfizForm from '../../forms/TambahKelasTahfizForm';
import { useLanguage } from '../../../../context/LanguageContext';

const DataKelasTahfiz: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { ustadz } = useUstadz();
  const { kelasTahfiz: classes, loading: classesLoading, refreshKelasTahfiz } = useKelasTahfiz();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingClass, setEditingClass] = useState<TahfizClass | null>(null);

  const ustadzMap = useMemo(() => {
    const map = new Map<string, any>();
    ustadz.forEach((item) => map.set(item.id, item));
    return map;
  }, [ustadz]);

  const filteredClasses = classes.filter((cls) => {
    const query = searchTerm.toLowerCase();
    const nama = cls.namaKelas.toLowerCase();
    const ruangan = cls.ruangan.toLowerCase();
    const ustadzName = (ustadzMap.get(cls.ustadzId)?.name || t('tahfiz.belumDiatur')).toLowerCase();
    return nama.includes(query) || ruangan.includes(query) || ustadzName.includes(query);
  });


  const openCreateForm = () => {
    setFormMode('create');
    setEditingClass(null);
    setIsFormOpen(true);
  };

  const openEditForm = (cls: TahfizClass) => {
    setFormMode('edit');
    setEditingClass(cls);
    setIsFormOpen(true);
  };

  const handleFormSuccess = async (data: TahfizClass, mode: 'create' | 'edit') => {
    try {
      if (mode === 'create') {
        await apiService.createKelasTahfiz({
          id: data.id,
          namaKelas: data.namaKelas,
          ruangan: data.ruangan,
          ustadzId: data.ustadzId,
          santriIds: data.santriIds || [],
        });
      } else {
        await apiService.updateKelasTahfiz(data.id, {
          namaKelas: data.namaKelas,
          ruangan: data.ruangan,
          ustadzId: data.ustadzId,
        });
      }
      await refreshKelasTahfiz();
      setIsFormOpen(false);
      setEditingClass(null);
    } catch (error: any) {
      showErrorToast(t('common.error'), error.message || t('common.error'));
    }
  };

  const handleDeleteClass = (cls: TahfizClass) => {
    showDangerConfirmation(
      t('tahfiz.hapusKelasConfirm'),
      `${t('tahfiz.hapusKelasConfirmText')} "${cls.namaKelas}"?`,
      async () => {
        try {
          const response = await apiService.deleteKelasTahfiz(cls.id);
          if (response.success) {
            await refreshKelasTahfiz();
            showSuccessToast(t('common.success'), t('tahfiz.kelasBerhasilDihapus'));
          } else {
            showErrorToast(t('common.error'), response.message || t('tahfiz.gagalMenghapusKelas'));
          }
        } catch (error: any) {
          showErrorToast(t('common.error'), error.message || t('tahfiz.terjadiKesalahanMenghapusKelas'));
        }
      },
      {
        confirmText: t('tahfiz.yaHapus'),
        cancelText: t('common.cancel'),
      }
    );
  };

  const openDetail = (cls: TahfizClass) => {
    navigate(`/dashboard/data-kelas-tahfiz/${cls.id}`);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                {t('tahfiz.dataKelasTahfiz')}
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                {t('tahfiz.dataKelasTahfizDesc')}
              </p>
            </div>
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={openCreateForm} className="flex items-center justify-center text-xs sm:text-sm bg-blue-600 text-emerald-700 hover:bg-blue-700">
                <Plus size={14} className="sm:mr-2" />
                <span>{t('tahfiz.tambahKelas')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder={t('tahfiz.cariKelas')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            {t('tahfiz.menampilkan')} <span className="font-semibold text-slate-900">{filteredClasses.length}</span> {t('tahfiz.dari')}{' '}
            <span className="font-semibold text-slate-900">{classes.length}</span> {t('tahfiz.kelas')}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{t('tahfiz.daftarKelasRuangan')}</h3>
        </div>
        {classesLoading ? (
          <div className="text-center py-12 px-6">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">{t('tahfiz.memuatDataKelas')}</p>
          </div>
        ) : (
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
                  {t('tahfiz.jumlahSantri')}
                </TableCell>
                <TableCell header className="text-sm">
                  {t('tahfiz.aksi')}
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((cls) => {
                const ustadzName = ustadzMap.get(cls.ustadzId)?.name || t('tahfiz.belumDiatur');
                return (
                  <TableRow key={cls.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-sm font-medium text-slate-900">{cls.namaKelas}</TableCell>
                    <TableCell className="text-sm">{cls.ruangan}</TableCell>
                    <TableCell className="text-sm">{ustadzName}</TableCell>
                    <TableCell className="text-sm">{cls.santriIds.length} {t('tahfiz.santri')}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openDetail(cls)}
                          className="!p-2 flex items-center justify-center"
                          title={t('tahfiz.lihatDetailKelas')}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEditForm(cls)}
                          className="!p-2 flex items-center justify-center"
                          title={t('tahfiz.editKelas')}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteClass(cls)}
                          className="!p-2 flex items-center justify-center"
                          title={t('tahfiz.hapusKelas')}
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
        )}
        {!classesLoading && filteredClasses.length === 0 && (
          <div className="text-center py-12 px-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasil') : t('tahfiz.belumAdaDataKelas')}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {searchTerm ? t('tahfiz.ubahKataKunci') : t('tahfiz.tambahKelasPertama')}
            </p>
            {!searchTerm && (
              <Button onClick={openCreateForm} className="text-sm">
                {t('tahfiz.tambahKelas')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {classesLoading ? (
          <div className="text-center py-12 px-4">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">{t('tahfiz.memuatDataKelas')}</p>
          </div>
        ) : filteredClasses.length > 0 ? (
          filteredClasses.map((cls) => {
            const ustadzName = ustadzMap.get(cls.ustadzId)?.name || t('tahfiz.belumDiatur');
            return (
              <div key={cls.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4 space-y-3">
                  {/* Class Info Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-base truncate">{cls.namaKelas}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{t('tahfiz.ruangan')}: {cls.ruangan}</p>
                      </div>
                    </div>
                    
                    {/* Info Details */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs">
                        <Users size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600">{t('tahfiz.ustadz')}:</span>
                        <span className="text-slate-900 font-medium truncate">{ustadzName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Users size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600">{t('tahfiz.jumlahSantri')}:</span>
                        <span className="text-slate-900 font-medium">{cls.santriIds.length} {t('tahfiz.santri')}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDetail(cls)}
                        className="flex-1 text-xs flex items-center justify-center"
                      >
                        <Eye size={12} className="mr-1" />
                        {t('tahfiz.detail')}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditForm(cls)}
                        className="flex-1 text-xs flex items-center justify-center"
                      >
                        <Edit size={12} className="mr-1" />
                        {t('tahfiz.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClass(cls)}
                        className="flex-1 text-xs flex items-center justify-center"
                      >
                        <Trash2 size={12} className="mr-1" />
                        {t('tahfiz.hapus')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasil') : t('tahfiz.belumAdaDataKelas')}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {searchTerm
                ? `${t('tahfiz.tidakDitemukanKelas')} "${searchTerm}"`
                : t('tahfiz.tambahKelasPertama')
              }
            </p>
            {!searchTerm && (
              <Button onClick={openCreateForm} className="text-sm">
                {t('tahfiz.tambahKelasPertamaButton')}
              </Button>
            )}
          </div>
        )}
      </div>

      <TambahKelasTahfizForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingClass(null);
        }}
        onSuccess={handleFormSuccess}
        mode={formMode}
        initialData={editingClass}
      />

    </div>
  );
};

export default DataKelasTahfiz;

