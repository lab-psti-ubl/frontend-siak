import React from 'react';
import { Clock, Eye, Edit2 } from 'lucide-react';
import { TableRow, TableCell } from '../../../../ui/Table';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { User, AbsensiGuru, JadwalPelajaran, IzinGuru, TahunAjaran } from '../../../../../types';
import StatusBadgeMapper from './StatusBadgeMapper';
import { getInitials } from '../utils/absenGuruHelpers';
import { getGuruAbsensiForDate, getGuruIzinForDate, getJadwalGuruForDate, getKeteranganAbsensi } from '../utils/absenGuruDataHelpers';
import { useAuth } from '../../../../../context/AuthContext';
import { formatTimeDisplay } from '../../../../../utils/absensiUtils';

interface AbsenGuruTableRowProps {
  guru: User;
  selectedDate: string;
  absensiGuru: AbsensiGuru[];
  izinGuru: IzinGuru[];
  jadwalPelajaran: JadwalPelajaran[];
  activeTahunAjaran: TahunAjaran | undefined;
  onViewDetail: (guru: User) => void;
  onViewAbsen: (guru: User) => void;
  onEditAbsen: (guru: User) => void;
  getMapelName: (mapelId: string) => string;
  getKelasName: (kelasId: string) => string;
}


const isWithinLastSevenDays = (dateString: string): boolean => {
  const selectedDate = new Date(dateString);
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  selectedDate.setHours(0, 0, 0, 0);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  return selectedDate >= sevenDaysAgo;
};

const AbsenGuruTableRow: React.FC<AbsenGuruTableRowProps> = ({
  guru,
  selectedDate,
  absensiGuru,
  izinGuru,
  jadwalPelajaran,
  activeTahunAjaran,
  onViewDetail,
  onViewAbsen,
  onEditAbsen,
  getMapelName,
  getKelasName
}) => {
  const { user } = useAuth();
  const absensi = getGuruAbsensiForDate(absensiGuru, guru.id, selectedDate);
  const izinAktif = getGuruIzinForDate(izinGuru, guru.id, selectedDate);
  const jadwalHariIni = getJadwalGuruForDate(jadwalPelajaran, guru.id, selectedDate, activeTahunAjaran);
  const keteranganAbsensi = getKeteranganAbsensi(absensi, izinAktif);

  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="text-xs lg:text-sm">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs lg:text-sm">
            {getInitials(guru.name)}
          </div>
          <div className="hidden sm:block">
            <p className="font-medium text-gray-900 text-xs lg:text-sm truncate">{guru.name}</p>
            <p className="text-xs text-gray-500">NIP: {guru.nip}</p>
          </div>
          <div className="sm:hidden">
            <p className="font-medium text-gray-900 text-xs truncate">{guru.name}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-xs lg:text-sm">
        <div className="space-y-1">
          {jadwalHariIni.length > 0 ? (
            jadwalHariIni.slice(0, 2).map((jadwal, idx) => (
              <div key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                <span className="font-medium line-clamp-1">{getMapelName(jadwal.mataPelajaranId)}</span>
                <span className="text-blue-600 text-xs block line-clamp-1">{getKelasName(jadwal.kelasId)}</span>
              </div>
            ))
          ) : (
            <span className="text-gray-400 text-xs">Tidak ada</span>
          )}
          {jadwalHariIni.length > 2 && (
            <div className="text-xs text-gray-500 font-medium">+{jadwalHariIni.length - 2} lagi</div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-xs lg:text-sm">
        {absensi ? (
          absensi.jamMasuk ? (
            <div className="flex items-center space-x-1">
              <Clock size={12} className="text-gray-400 hidden lg:block" />
              <span className="font-mono text-xs lg:text-sm font-medium">{formatTimeDisplay(absensi.jamMasuk)}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </TableCell>
      <TableCell className="text-xs lg:text-sm">
        {absensi ? (
          <StatusBadgeMapper status={absensi.statusMasuk} />
        ) : izinAktif ? (
          <Badge variant="info">{izinAktif.jenis.charAt(0).toUpperCase() + izinAktif.jenis.slice(1)}</Badge>
        ) : (
          <Badge variant="danger">Belum</Badge>
        )}
      </TableCell>
      <TableCell className="text-xs lg:text-sm">
        {absensi ? (
          absensi.jamKeluar ? (
            <div className="flex items-center space-x-1">
              <Clock size={12} className="text-gray-400 hidden lg:block" />
              <span className="font-mono text-xs lg:text-sm font-medium">{formatTimeDisplay(absensi.jamKeluar)}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-xs">-</span>
          )
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </TableCell>
      <TableCell className="text-xs lg:text-sm">
        {absensi ? (
          <StatusBadgeMapper status={absensi.statusKeluar} />
        ) : izinAktif ? (
          <Badge variant="info">{izinAktif.jenis.charAt(0).toUpperCase() + izinAktif.jenis.slice(1)}</Badge>
        ) : (
          <Badge variant="default">-</Badge>
        )}
      </TableCell>
      <TableCell className="text-xs lg:text-sm">
        <span className="text-xs lg:text-sm font-medium text-gray-700">{keteranganAbsensi}</span>
      </TableCell>
      <TableCell className="text-xs lg:text-sm">
        <div className="flex flex-col lg:flex-row items-center gap-1 lg:gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onViewDetail(guru)}
            className="!p-1 lg:!p-2 flex items-center text-xs lg:text-sm whitespace-nowrap w-full lg:w-auto justify-center lg:justify-start"
            title="Detail Absensi"
          >
            <Eye size={14} className="mr-1"/>
            <span >Detail</span>
          </Button>
          {isWithinLastSevenDays(selectedDate) && user?.role !== 'kepala_sekolah' && (
            <Button
              size="sm"
              variant="warning"
              onClick={() => onEditAbsen(guru)}
              className="!p-1 lg:!p-2 flex items-center text-xs lg:text-sm whitespace-nowrap w-full lg:w-auto justify-center lg:justify-start"
              title="Edit Absen"
            >
              <Edit2 size={14} className="mr-1"/>
              <span >Edit</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="green"
            onClick={() => onViewAbsen(guru)}
            className="!p-1 lg:!p-2 flex items-center text-xs lg:text-sm whitespace-nowrap w-full lg:w-auto justify-center lg:justify-start"
          >
            <span>Absen Kelas</span>
            
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default AbsenGuruTableRow;
