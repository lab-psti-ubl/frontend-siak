import React from 'react';
import { UserCircle, ListChecks, BarChart3 } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import { User, AbsensiGuru, IzinGuru, JadwalPelajaran, SesiAbsensi, FotoMengajar, TahunAjaran } from '../../../../../types';
import GuruProfileHeader from './GuruProfileHeader';
import AbsensiInfoCard from './AbsensiInfoCard';
import JadwalMengajarCard from './JadwalMengajarCard';
import LihatKehadiranView from './LihatKehadiranView';
import LihatPertemuanView from './LihatPertemuanView';
import RekapMengajarGuruModal from './RekapMengajarGuruModal';
import { getGuruAbsensiForDate, getGuruIzinForDate } from '../utils/absenGuruDataHelpers';

interface DetailAbsensiModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGuru: User | null;
  detailDate: string;
  onDetailDateChange: (date: string) => void;
  detailView: 'default' | 'kehadiran' | 'pertemuan';
  onDetailViewChange: (view: 'default' | 'kehadiran' | 'pertemuan') => void;
  isRekapMengajarOpen: boolean;
  onRekapMengajarOpen: (open: boolean) => void;
  absensiGuru: AbsensiGuru[];
  izinGuru: IzinGuru[];
  jadwalPelajaran: JadwalPelajaran[];
  sesiAbsensi: SesiAbsensi[];
  pengaturanAbsen: any[];
  tahunAjaran: TahunAjaran[];
  mataPelajaran: any[];
  kelas: any[];
  onViewPhoto: (foto: FotoMengajar) => void;
  onViewJadwalDetail: (jadwal: JadwalPelajaran, tanggal: string) => void;
  onViewJurnalFile: (file: any) => void;
  getMapelName: (mapelId: string) => string;
  getKelasName: (kelasId: string) => string;
  tahunAjaranAktif?: string;
  semesterAktif?: number;
}

const DetailAbsensiModal: React.FC<DetailAbsensiModalProps> = ({
  isOpen,
  onClose,
  selectedGuru,
  detailDate,
  onDetailDateChange,
  detailView,
  onDetailViewChange,
  isRekapMengajarOpen,
  onRekapMengajarOpen,
  absensiGuru,
  izinGuru,
  jadwalPelajaran,
  sesiAbsensi,
  pengaturanAbsen,
  tahunAjaran,
  mataPelajaran,
  kelas,
  onViewPhoto,
  onViewJadwalDetail,
  onViewJurnalFile,
  getMapelName,
  getKelasName,
  tahunAjaranAktif,
  semesterAktif
}) => {
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Detail Absensi - ${selectedGuru?.name}`}
        size="xl"
      >
        {selectedGuru && detailView === 'default' && (
          <div className="space-y-4 sm:space-y-6">
            <GuruProfileHeader
              guru={selectedGuru}
              getKelasName={getKelasName}
            />

            <div className="p-3 sm:p-4  bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm sm:text-base text-blue-900 mb-3">Filter Tanggal</h4>
              <div className="flex flex-col gap-3">
                <div className="flex flex-row items-center gap-2 sm:gap-3">
                  <label className="text-xs sm:text-sm font-medium text-blue-700 whitespace-nowrap flex-shrink-0">Tanggal:</label>
                  <input
                    type="date"
                    value={detailDate}
                    onChange={(e) => onDetailDateChange(e.target.value)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 min-w-0"
                  />
                   <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDetailDateChange(new Date().toISOString().split('T')[0])}
                    className="text-xs sm:text-sm flex-shrink-0 whitespace-nowrap"
                  >
                    Hari Ini
                  </Button>
                </div>
               
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onDetailViewChange('kehadiran')}
                    className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1"
                  >
                    <UserCircle size={14} className="sm:w-4 sm:h-4" />
                    <span className="truncate">Lihat Kehadiran</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="info"
                    onClick={() => onDetailViewChange('pertemuan')}
                    className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1"
                  >
                    <ListChecks size={14} className="sm:w-4 sm:h-4" />
                    <span className="truncate">Lihat Pertemuan</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onRekapMengajarOpen(true)}
                    className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1"
                  >
                    <BarChart3 size={14} className="sm:w-4 sm:h-4" />
                    <span className="truncate">Rekap Mengajar</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <AbsensiInfoCard
                detailDate={detailDate}
                absensi={getGuruAbsensiForDate(absensiGuru, selectedGuru.id, detailDate)}
                izinAktif={getGuruIzinForDate(izinGuru, selectedGuru.id, detailDate)}
              />

              <JadwalMengajarCard
                detailDate={detailDate}
                selectedGuru={selectedGuru}
                jadwalPelajaran={jadwalPelajaran}
                sesiAbsensi={sesiAbsensi}
                absensiGuru={absensiGuru}
                onViewPhoto={onViewPhoto}
                onViewDetail={onViewJadwalDetail}
                getMapelName={getMapelName}
                getKelasName={getKelasName}
                tahunAjaranAktif={tahunAjaranAktif}
                semesterAktif={semesterAktif}
              />
            </div>
          </div>
        )}

        {selectedGuru && detailView === 'kehadiran' && (
          <LihatKehadiranView
            guru={selectedGuru}
            absensiGuru={absensiGuru}
            pengaturanAbsen={pengaturanAbsen}
            izinGuru={izinGuru}
          />
        )}

        {selectedGuru && detailView === 'pertemuan' && (
          <LihatPertemuanView
            guru={selectedGuru}
          />
        )}
      </Modal>

      {selectedGuru && (
        <Modal
          isOpen={isRekapMengajarOpen}
          onClose={() => onRekapMengajarOpen(false)}
          title="Rekap Mengajar Guru"
          size="full"
        >
          <RekapMengajarGuruModal
            guru={selectedGuru}
            jadwalPelajaran={jadwalPelajaran}
            sesiAbsensi={sesiAbsensi}
            tahunAjaran={tahunAjaran}
            kelas={kelas}
            mataPelajaran={mataPelajaran}
          />
        </Modal>
      )}
    </>
  );
};

export default DetailAbsensiModal;
