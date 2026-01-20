import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Search,
  Users,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useUstadz } from '../../../../hooks/useUstadz';
import { useKelasTahfiz, TahfizClass } from '../../../../hooks/useKelasTahfiz';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';

const DataSantriTahfizGuru: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { ustadz } = useUstadz();
  const { kelasTahfiz: classes, loading: classesLoading } = useKelasTahfiz();

  const [searchTerm, setSearchTerm] = useState('');

  const ustadzMap = useMemo(() => {
    const map = new Map<string, any>();
    ustadz.forEach((item) => map.set(item.id, item));
    return map;
  }, [ustadz]);

  // Filter classes to only show classes where the logged-in guru is the ustadz
  const myClasses = useMemo(() => {
    if (!user?.id) return [];
    return classes.filter((cls) => cls.ustadzId === user.id);
  }, [classes, user?.id]);

  const filteredClasses = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return myClasses.filter((cls) => {
      const nama = cls.namaKelas.toLowerCase();
      const ruangan = cls.ruangan.toLowerCase();
      const ustadzName = (ustadzMap.get(cls.ustadzId)?.name || '').toLowerCase();
      return nama.includes(query) || ruangan.includes(query) || ustadzName.includes(query);
    });
  }, [myClasses, searchTerm, ustadzMap]);

  const openDetail = (cls: TahfizClass) => {
    navigate(`/dashboard/data-santri-tahfiz-guru/${cls.id}`);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                {t('tahfiz.dataSantri')}
              </h1>
              <p className="text-sm sm:text-base text-emerald-100">
                {t('tahfiz.guruTahfiz.dataSantriTahfizGuru.subtitle')}
              </p>
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
            <span className="font-semibold text-slate-900">{myClasses.length}</span> {t('tahfiz.guruTahfiz.dataSantriTahfizGuru.kelas')}
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
            <p className="text-sm text-slate-600">Memuat data kelas...</p>
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
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openDetail(cls)}
                            className="!p-2 flex items-center justify-center"
                            title={t('tahfiz.lihatDetailKelas')}
                          >
                            <Eye size={14} className="mr-2" />
                            {t('tahfiz.lihatDetail')}
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
              {searchTerm ? t('tahfiz.ubahKataKunci') : t('tahfiz.guruTahfiz.dataSantriTahfizGuru.belumMemilikiKelas')}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {classesLoading ? (
          <div className="text-center py-12 px-4">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">Memuat data kelas...</p>
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
                        {t('tahfiz.lihatDetail')}
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
                ? t('tahfiz.tidakDitemukanKelas') + ` "${searchTerm}"`
                : t('tahfiz.guruTahfiz.dataSantriTahfizGuru.belumMemilikiKelas')
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSantriTahfizGuru;

