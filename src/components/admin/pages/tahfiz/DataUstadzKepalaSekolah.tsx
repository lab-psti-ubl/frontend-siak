import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search, Users } from 'lucide-react';
import { useUstadz } from '../../../../hooks/useUstadz';
import { useKelasTahfiz } from '../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../hooks/useSantri';
import Button from '../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import { useLanguage } from '../../../../context/LanguageContext';

const DataUstadzKepalaSekolah: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { ustadz } = useUstadz();
  const { kelasTahfiz } = useKelasTahfiz();
  const { santri } = useSantri();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUstadz = ustadz.filter(ustadzItem => {
    const matchesSearch = ustadzItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ustadzItem.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ((ustadzItem as any).nip && (ustadzItem as any).nip.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleViewDetail = (ustadzItem: any) => {
    navigate(`/dashboard/data-ustadz-kepala-sekolah/${ustadzItem.id}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-green-700 via-green-700 to-green-500 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                {t('tahfiz.dataUstadzKepalaSekolah')}
              </h1>
              <p className="text-sm sm:text-base text-green-100">
                {t('tahfiz.dataUstadzKepalaSekolahDesc')} {ustadz.length > 0 && `(${ustadz.length} ${t('tahfiz.ustadz')})`}
              </p>
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
                <TableCell header className="text-sm">{t('tahfiz.nip')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.jumlahKelas')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.jumlahSantri')}</TableCell>
                <TableCell header className="text-sm">{t('tahfiz.aksi')}</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUstadz.map((ustadzItem) => {
                const classes = kelasTahfiz.filter(cls => cls.ustadzId === ustadzItem.id);
                const santriIds = new Set<string>();
                classes.forEach(cls => cls.santriIds.forEach(id => santriIds.add(id)));
                const totalSantri = santriIds.size;
                
                return (
                  <TableRow key={ustadzItem.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium flex-shrink-0 text-sm">
                          {ustadzItem.profileImage ? (
                            <img src={ustadzItem.profileImage} alt={ustadzItem.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(ustadzItem.name)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm truncate">{ustadzItem.name}</p>
                          <p className="text-xs text-slate-500 truncate">{ustadzItem.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono truncate">
                        {(ustadzItem as any).nip || '-'}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-xs">
                        {classes.length} {t('tahfiz.kelas')}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold text-xs">
                        {totalSantri} {t('tahfiz.santri')}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleViewDetail(ustadzItem)}
                        className="!p-2 flex items-center justify-center"
                        title={t('tahfiz.lihatDetail')}
                      >
                        <Eye size={14} className="mr-2" />
                        {t('tahfiz.lihatDetailButton')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredUstadz.length === 0 && (
          <div className="text-center py-12 px-6">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasil') : t('tahfiz.belumAdaDataUstadz')}
            </h3>
            <p className="text-sm text-slate-600">
              {searchTerm ? t('tahfiz.tidakDitemukanUstadzDenganKataKunci', { searchTerm }) : t('tahfiz.dataUstadzAkanDitampilkan')}
            </p>
          </div>
        )}
      </div>

      {/* Ustadz List - Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredUstadz.length > 0 ? (
          filteredUstadz.map((ustadzItem) => {
            const classes = kelasTahfiz.filter(cls => cls.ustadzId === ustadzItem.id);
            const santriIds = new Set<string>();
            classes.forEach(cls => cls.santriIds.forEach(id => santriIds.add(id)));
            const totalSantri = santriIds.size;

            return (
              <div key={ustadzItem.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4 space-y-3">
                  {/* Ustadz Info Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                      {ustadzItem.profileImage ? (
                        <img src={ustadzItem.profileImage} alt={ustadzItem.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(ustadzItem.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{ustadzItem.name}</p>
                      <p className="text-xs text-slate-500 truncate">{ustadzItem.email}</p>
                      <p className="text-xs text-slate-600 mt-1">{t('tahfiz.nip')}: {(ustadzItem as any).nip || '-'}</p>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">{t('tahfiz.kelas')}</p>
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-xs w-full">
                        {classes.length} {t('tahfiz.kelas')}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">{t('tahfiz.santri')}</p>
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold text-xs w-full">
                        {totalSantri} {t('tahfiz.santri')}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleViewDetail(ustadzItem)}
                      className="w-full text-xs flex items-center justify-center"
                    >
                      <Eye size={12} className="mr-1" />
                      {t('tahfiz.lihatDetailButton')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 px-4">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-base font-medium text-slate-900 mb-2">
              {searchTerm ? t('tahfiz.tidakAdaHasilPencarian') : t('tahfiz.belumAdaDataUstadz')}
            </h3>
            <p className="text-xs text-slate-600">
              {searchTerm ? t('tahfiz.tidakDitemukanUstadzDenganKataKunci', { searchTerm }) : t('tahfiz.dataUstadzAkanDitampilkan')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataUstadzKepalaSekolah;
