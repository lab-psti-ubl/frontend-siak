import React, { useState, useEffect } from 'react';
import { Calendar, Clock, LogIn, LogOut, User as UserIcon, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Badge from '../../../../ui/Badge';
import Card from '../../../../ui/Card';
import { User, AbsensiGuru, IzinGuru, PengaturanAbsen } from '../../../../../types';
import { getGuruAbsensiForDate, getGuruIzinForDate, getKeteranganAbsensi, isTanggalExistsInDatabase } from '../utils/absenGuruDataHelpers';
import LihatAbsenGuruTable from './LihatAbsenGuruTable';
import { formatTimeDisplay } from '../../../../../utils/absensiUtils';

interface LihatAbsenGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGuru: User | null;
  selectedDate: string;
  absensiGuru: AbsensiGuru[];
  izinGuru: IzinGuru[];
  pengaturanAbsen: PengaturanAbsen[];
}

const LihatAbsenGuruModal: React.FC<LihatAbsenGuruModalProps> = ({
  isOpen,
  onClose,
  selectedGuru,
  selectedDate,
  absensiGuru,
  izinGuru,
  pengaturanAbsen
}) => {
  const [displayDate, setDisplayDate] = useState(selectedDate);
  const today = new Date().toISOString().split('T')[0];
  const isToday = displayDate === today;

  useEffect(() => {
    setDisplayDate(selectedDate);
  }, [selectedDate, isOpen]);

  if (!selectedGuru) return null;

  const absensi = getGuruAbsensiForDate(absensiGuru, selectedGuru.id, displayDate);
  const izinAktif = getGuruIzinForDate(izinGuru, selectedGuru.id, displayDate);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'tepat_waktu': return <Badge variant="success">Tepat Waktu</Badge>;
      case 'terlambat': return <Badge variant="warning">Terlambat</Badge>;
      case 'pulang_awal': return <Badge variant="warning">Pulang Awal</Badge>;
      case 'tidak_masuk': return <Badge variant="danger">Tidak Masuk</Badge>;
      case 'tidak_keluar': return <Badge variant="danger">Tidak Keluar</Badge>;
      case 'izin': return <Badge variant="info">Izin</Badge>;
      case 'sakit': return <Badge variant="secondary">Sakit</Badge>;
      case 'alfa': return <Badge variant="danger">Alfa</Badge>;
      case 'hadir': return <Badge variant="success">Hadir</Badge>;
      default: return <Badge variant="default">{(status || '-').replace(/_/g, ' ')}</Badge>;
    }
  };

  const tanggalExists = isTanggalExistsInDatabase(absensiGuru, displayDate);
  const keterangan = getKeteranganAbsensi(absensi || undefined, izinAktif, tanggalExists);
  const keteranganVariant = 
    keterangan === 'Hadir' ? 'success' :
    keterangan === 'Izin' ? 'info' :
    keterangan === 'Sakit' ? 'secondary' :
    keterangan === 'Dispen' ? 'info' :
    (keterangan === 'Bolos' || keterangan === 'Alfa' || keterangan === '-') ? 'danger' :
    'default';

  const formattedDate = new Date(displayDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const shortDate = new Date(displayDate).toLocaleDateString('id-ID', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Absensi Guru"
      size="xl"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section - Guru Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg sm:text-xl shadow-lg">
                <UserIcon size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {selectedGuru.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  {selectedGuru.email || selectedGuru.nip || 'Guru'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Date Picker Section */}
        <Card className="p-4 sm:p-5 border-2 border-gray-200 hover:border-blue-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                Pilih Tanggal
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="date"
                  value={displayDate}
                  onChange={(e) => setDisplayDate(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base font-medium transition-all"
                />
                <Badge 
                  variant={isToday ? "success" : "info"}
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <Calendar size={14} />
                  <span className="font-medium">{shortDate}</span>
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 sm:mt-2 font-medium">
                {formattedDate}
              </p>
            </div>
          </div>
        </Card>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Status Masuk Card */}
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 border-2 border-blue-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
                  <LogIn size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Status Masuk
                  </div>
                  {absensi?.jamMasuk && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={12} className="text-gray-500" />
                      <span className="text-xs sm:text-sm text-gray-600 font-mono font-semibold">
                        {formatTimeDisplay(absensi.jamMasuk)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              {absensi ? (
                getStatusBadge(absensi.statusMasuk || 'tidak_masuk')
              ) : izinAktif ? (
                getStatusBadge(izinAktif.jenis === 'sakit' ? 'sakit' : 'izin')
              ) : (
                <Badge variant="danger" className="text-xs sm:text-sm px-3 py-1.5">
                  Belum Masuk
                </Badge>
              )}
            </div>
          </Card>

          {/* Status Keluar Card */}
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 border-2 border-emerald-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md">
                  <LogOut size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Status Keluar
                  </div>
                  {absensi?.jamKeluar && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={12} className="text-gray-500" />
                      <span className="text-xs sm:text-sm text-gray-600 font-mono font-semibold">
                        {formatTimeDisplay(absensi.jamKeluar)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              {izinAktif ? (
                getStatusBadge(izinAktif.jenis === 'sakit' ? 'sakit' : 'izin')
              ) : absensi ? (
                getStatusBadge(absensi.statusKeluar || 'tidak_keluar')
              ) : (
                <Badge variant="default" className="text-xs sm:text-sm px-3 py-1.5">
                  Belum Keluar
                </Badge>
              )}
            </div>
          </Card>
        </div>

        {/* Keterangan Card */}
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 border-2 border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-500 flex items-center justify-center shadow-md">
                <Info size={20} className="text-white sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Keterangan Absensi
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Status akhir kehadiran
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end sm:justify-start">
              <Badge 
                variant={keteranganVariant as any}
                className="text-xs sm:text-sm px-4 py-2 font-semibold"
              >
                {keterangan}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Absensi Siswa Table Section */}
        <div className="mt-4 sm:mt-6">
          <LihatAbsenGuruTable
            selectedGuru={selectedGuru}
            displayDate={displayDate}
            pengaturanAbsen={pengaturanAbsen}
            isWaliKelas={(selectedGuru as any).isWaliKelas}
          />
        </div>
      </div>
    </Modal>
  );
};

export default LihatAbsenGuruModal;

