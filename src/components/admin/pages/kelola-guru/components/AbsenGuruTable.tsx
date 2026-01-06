import React from 'react';
import { Users, Eye, BarChart3 } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { User, AbsensiGuru, JadwalPelajaran, IzinGuru, TahunAjaran } from '../../../../../types';
import AbsenGuruTableRow from './AbsenGuruTableRow';
import AbsenGuruMobileListItem from './AbsenGuruMobileListItem';

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
  searchTerm
}) => {
  return (
    <Card>
      <div className="p-4 lg:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 lg:gap-4">
        <h3 className="text-base lg:text-lg font-semibold text-gray-900">
          Absensi Guru - {new Date(selectedDate).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h3>
        {onViewRekapAbsen && (
          <Button onClick={onViewRekapAbsen} variant="primary" className="flex items-center gap-2 text-sm lg:text-base justify-center">
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Lihat Rekapan</span>
            <span className="sm:hidden">Rekapan</span>
          </Button>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableCell header className="text-xs lg:text-sm">Guru</TableCell>
              <TableCell header className="text-xs lg:text-sm">Jadwal Mengajar</TableCell>
              <TableCell header className="text-xs lg:text-sm">Jam Masuk</TableCell>
              <TableCell header className="text-xs lg:text-sm">Status Masuk</TableCell>
              <TableCell header className="text-xs lg:text-sm">Jam Keluar</TableCell>
              <TableCell header className="text-xs lg:text-sm">Status Keluar</TableCell>
              <TableCell header className="text-xs lg:text-sm">Keterangan</TableCell>
              <TableCell header className="text-xs lg:text-sm">Aksi</TableCell>
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
            />
          ))}
        </div>
      </div>

      {filteredGurus.length === 0 && (
        <div className="text-center py-12 px-4">
          <Users className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-3 lg:mb-4 text-gray-300" />
          <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-1 lg:mb-2">
            {searchTerm ? 'Tidak ada hasil' : 'Belum ada data guru'}
          </h3>
          <p className="text-sm lg:text-base text-gray-600">
            {searchTerm
              ? `Tidak ditemukan guru dengan kata kunci "${searchTerm}"`
              : 'Belum ada data absensi guru untuk tanggal ini'
            }
          </p>
        </div>
      )}
    </Card>
  );
};

export default AbsenGuruTable;
