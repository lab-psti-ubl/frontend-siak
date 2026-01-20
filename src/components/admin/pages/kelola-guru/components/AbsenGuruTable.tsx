import React from 'react';
import { Users, Eye, BarChart3 } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { User, AbsensiGuru, JadwalPelajaran, IzinGuru, TahunAjaran } from '../../../../../types';
import AbsenGuruTableRow from './AbsenGuruTableRow';
import AbsenGuruMobileListItem from './AbsenGuruMobileListItem';
import { useLanguage } from '../../../../../context/LanguageContext';

interface AbsenGuruTableProps {
  filteredGurus: User[];
  selectedDate: string;
  absensiGuru: AbsensiGuru[];
  izinGuru: IzinGuru[];
  jadwalPelajaran: JadwalPelajaran[];
  activeTahunAjaran: TahunAjaran | undefined;
  onViewDetail: (guru: User) => void;
  onViewAbsen: (guru: User) => void;
  onEditAbsen: (guru: User) => void;
  onViewRekapAbsen?: () => void;
  getMapelName: (mapelId: string) => string;
  getKelasName: (kelasId: string) => string;
  searchTerm: string;
  systemType: string;
  dateLocale: string;
}

const AbsenGuruTable: React.FC<AbsenGuruTableProps> = ({
  filteredGurus,
  selectedDate,
  absensiGuru,
  izinGuru,
  jadwalPelajaran,
  activeTahunAjaran,
  onViewDetail,
  onViewAbsen,
  onEditAbsen,
  onViewRekapAbsen,
  getMapelName,
  getKelasName,
  searchTerm,
  systemType,
  dateLocale
}) => {
  const { t, language } = useLanguage();
  
  return (
    <Card>
      <div className="p-4 lg:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 lg:gap-4">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900">
          {systemType === 'tahfiz' ? t('absenGuru.absensiUstadz') : t('absenGuru.absensiGuru')} - {new Date(selectedDate).toLocaleDateString(dateLocale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h3>
        {onViewRekapAbsen && (
          <Button onClick={onViewRekapAbsen} variant="primary" className="flex items-center gap-2 text-sm lg:text-base justify-center">
            <BarChart3 size={16} />
            <span className="hidden sm:inline">{t('absenGuru.lihatRekapan')}</span>
            <span className="sm:hidden">{t('absenGuru.rekapan')}</span>
          </Button>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableCell header className="text-xs lg:text-sm">
                {systemType === 'tahfiz' ? t('absenGuru.ustadzLabel') : t('absenGuru.guruLabel')}
              </TableCell>
              <TableCell header className="text-xs lg:text-sm">{t('absenGuru.jadwalMengajar')}</TableCell>
              <TableCell header className="text-xs lg:text-sm">{t('absenGuru.jamMasuk')}</TableCell>
              <TableCell header className="text-xs lg:text-sm">{t('absenGuru.statusMasuk')}</TableCell>
              <TableCell header className="text-xs lg:text-sm">{t('absenGuru.jamKeluar')}</TableCell>
              <TableCell header className="text-xs lg:text-sm">{t('absenGuru.statusKeluar')}</TableCell>
              <TableCell header className="text-xs lg:text-sm">{t('absenGuru.keterangan')}</TableCell>
              <TableCell header className="text-xs lg:text-sm">{t('absenGuru.aksi')}</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGurus.map((guru) => (
              <AbsenGuruTableRow
                key={guru.id}
                guru={guru}
                selectedDate={selectedDate}
                absensiGuru={absensiGuru}
                izinGuru={izinGuru}
                jadwalPelajaran={jadwalPelajaran}
                activeTahunAjaran={activeTahunAjaran}
                onViewDetail={onViewDetail}
                onViewAbsen={onViewAbsen}
                onEditAbsen={onEditAbsen}
                getMapelName={getMapelName}
                getKelasName={getKelasName}
                systemType={systemType}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden px-4 pt-4">
        <div className="space-y-3">
          {filteredGurus.map((guru) => (
            <AbsenGuruMobileListItem
              key={guru.id}
              guru={guru}
              selectedDate={selectedDate}
              absensiGuru={absensiGuru}
              izinGuru={izinGuru}
              jadwalPelajaran={jadwalPelajaran}
              activeTahunAjaran={activeTahunAjaran}
              onViewDetail={onViewDetail}
              onViewAbsen={onViewAbsen}
              onEditAbsen={onEditAbsen}
              getMapelName={getMapelName}
              getKelasName={getKelasName}
              systemType={systemType}
            />
          ))}
        </div>
      </div>

      {filteredGurus.length === 0 && (
        <div className="text-center py-12 px-4">
          <Users className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 lg:mb-4 text-gray-300" />
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-1 lg:mb-2">
            {searchTerm ? (language === 'ms' ? 'Tiada hasil' : 'Tidak ada hasil') : (systemType === 'tahfiz' ? t('absenGuru.belumAdaDataUstadz') : t('absenGuru.belumAdaDataGuru'))}
          </h3>
          <p className="text-sm lg:text-base text-gray-600">
            {searchTerm
              ? t('absenGuru.tidakDitemukan', { searchTerm, term: systemType === 'tahfiz' ? t('absenGuru.ustadz') : t('absenGuru.guru') })
              : (systemType === 'tahfiz' ? t('absenGuru.belumAdaDataAbsensiUstadz') : t('absenGuru.belumAdaDataAbsensiGuru'))
            }
          </p>
        </div>
      )}
    </Card>
  );
};

export default AbsenGuruTable;
