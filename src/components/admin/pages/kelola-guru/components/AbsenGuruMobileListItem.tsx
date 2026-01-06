import React from 'react';
import { Clock, Eye, Edit2, Users } from 'lucide-react';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import { User, AbsensiGuru, JadwalPelajaran, IzinGuru, TahunAjaran } from '../../../../../types';
import StatusBadgeMapper from './StatusBadgeMapper';
import { getInitials } from '../utils/absenGuruHelpers';
import { getGuruAbsensiForDate, getGuruIzinForDate, getJadwalGuruForDate, getKeteranganAbsensi } from '../utils/absenGuruDataHelpers';
import { useAuth } from '../../../../../context/AuthContext';
import { formatTimeDisplay } from '../../../../../utils/absensiUtils';

interface AbsenGuruMobileListItemProps {
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

const AbsenGuruMobileListItem: React.FC<AbsenGuruMobileListItemProps> = ({
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow">
      {/* Header: Nama dan Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
            {getInitials(guru.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate">{guru.name}</p>
            <p className="text-xs text-gray-500 truncate">NIP: {guru.nip}</p>
          </div>
        </div>
      </div>

      {/* Jadwal Mengajar */}
      {jadwalHariIni.length > 0 && (
        <div className="mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-gray-400" />
            <p className="text-xs font-medium text-gray-600">Jadwal Mengajar</p>
          </div>
          <div className="space-y-1.5">
            {jadwalHariIni.slice(0, 2).map((jadwal, idx) => (
              <div key={idx} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded border border-blue-100">
                <p className="font-medium truncate">{getMapelName(jadwal.mataPelajaranId)}</p>
                <p className="text-blue-600 text-xs truncate">{getKelasName(jadwal.kelasId)}</p>
              </div>
            ))}
            {jadwalHariIni.length > 2 && (
              <p className="text-xs text-gray-500 font-medium">+{jadwalHariIni.length - 2} jadwal lagi</p>
            )}
          </div>
        </div>
      )}

      {/* Jam Masuk & Status Masuk */}
      <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Jam Masuk</p>
          {absensi?.jamMasuk ? (
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-gray-400" />
              <span className="font-mono text-sm font-semibold text-gray-900">{formatTimeDisplay(absensi.jamMasuk)}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Status Masuk</p>
          {absensi ? (
            <StatusBadgeMapper status={absensi.statusMasuk} />
          ) : izinAktif ? (
            <Badge variant="info" className="text-xs">{izinAktif.jenis.charAt(0).toUpperCase() + izinAktif.jenis.slice(1)}</Badge>
          ) : (
            <Badge variant="danger" className="text-xs">Belum</Badge>
          )}
        </div>
      </div>

      {/* Jam Keluar & Status Keluar */}
      <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Jam Keluar</p>
          {absensi?.jamKeluar ? (
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-gray-400" />
              <span className="font-mono text-sm font-semibold text-gray-900">{formatTimeDisplay(absensi.jamKeluar)}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Status Keluar</p>
          {absensi ? (
            <StatusBadgeMapper status={absensi.statusKeluar} />
          ) : izinAktif ? (
            <Badge variant="info" className="text-xs">{izinAktif.jenis.charAt(0).toUpperCase() + izinAktif.jenis.slice(1)}</Badge>
          ) : (
            <Badge variant="default" className="text-xs">-</Badge>
          )}
        </div>
      </div>

      {/* Keterangan */}
      <div className="mb-3 pb-3 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-600 mb-1.5">Keterangan</p>
        <p className="text-sm font-medium text-gray-700">{keteranganAbsensi}</p>
      </div>

      {/* Tombol Aksi */}
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onViewDetail(guru)}
          className="!px-3 !py-2 flex items-center justify-center text-xs font-medium"
          title="Detail Absensi"
        >
          <Eye size={14} className="mr-1.5" />
          <span>Detail</span>
        </Button>
        {isWithinLastSevenDays(selectedDate) && user?.role !== 'kepala_sekolah' && (
          <Button
            size="sm"
            variant="warning"
            onClick={() => onEditAbsen(guru)}
            className="!px-3 !py-2 flex items-center justify-center text-xs font-medium"
            title="Edit Absen"
          >
            <Edit2 size={14} className="mr-1.5" />
            <span>Edit</span>
          </Button>
        )}
        <Button
          size="sm"
          variant="green"
          onClick={() => onViewAbsen(guru)}
          className="!px-3 !py-2 flex items-center justify-center text-xs font-medium"
          title="Absen Kelas"
        >
          <span>Absen Kelas</span>
        </Button>
      </div>
    </div>
  );
};

export default AbsenGuruMobileListItem;
