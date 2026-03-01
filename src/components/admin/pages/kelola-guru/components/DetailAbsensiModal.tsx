import React, { useMemo } from 'react';
import { UserCircle, ListChecks, BarChart3 } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import { User, AbsensiGuru, IzinGuru, JadwalPelajaran, SesiAbsensi, FotoMengajar, TahunAjaran, TahfizSchedule } from '../../../../../types';
import GuruProfileHeader from './GuruProfileHeader';
import AbsensiInfoCard from './AbsensiInfoCard';
import JadwalMengajarCard from './JadwalMengajarCard';
import LihatKehadiranView from './LihatKehadiranView';
import LihatPertemuanView from './LihatPertemuanView';
import RekapMengajarGuruModal from './RekapMengajarGuruModal';
import JadwalTahfizCard from './JadwalTahfizCard';
import LihatTahfizView from './LihatTahfizView';
import RekapMengajarTahfizModal from './RekapMengajarTahfizModal';
import JadwalTahfizDetailModal from './JadwalTahfizDetailModal';
import { getGuruAbsensiForDate, getGuruIzinForDate } from '../utils/absenGuruDataHelpers';
import { useUstadz } from '../../../../../hooks/useUstadz';
import { useJadwalTahfiz } from '../../../../../hooks/useJadwalTahfiz';
import { useSesiAbsensiTahfiz } from '../../../../../hooks/useSesiAbsensiTahfiz';
import { useKelasTahfiz } from '../../../../../hooks/useKelasTahfiz';
import { usePengaturanSistem } from '../../../../../hooks/usePengaturanSistem';

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
  const { t } = useLanguage();
  const { ustadz } = useUstadz();
  const { jadwalTahfiz } = useJadwalTahfiz();
  const { sesiAbsensiTahfiz } = useSesiAbsensiTahfiz();
  const { kelasTahfiz } = useKelasTahfiz();
  const { systemType } = usePengaturanSistem();
  const [activeTab, setActiveTab] = React.useState<'akademik' | 'tahfiz'>('akademik');
  
  // Check if system is tahfiz-only
  const isTahfizOnly = systemType === 'tahfiz';
  const [isRekapMengajarTahfizOpen, setIsRekapMengajarTahfizOpen] = React.useState(false);
  const [selectedJadwalTahfiz, setSelectedJadwalTahfiz] = React.useState<TahfizSchedule | null>(null);
  const [selectedJadwalTahfizDate, setSelectedJadwalTahfizDate] = React.useState('');

  // Check if selected guru is an ustadz
  const isUstadz = useMemo(() => {
    if (!selectedGuru) return false;
    return ustadz.some(u => u.id === selectedGuru.id);
  }, [selectedGuru, ustadz]);

  // Get tahfiz classes for this ustadz
  const myKelasTahfiz = useMemo(() => {
    if (!selectedGuru) return [];
    return kelasTahfiz.filter(k => k.ustadzId === selectedGuru.id);
  }, [selectedGuru, kelasTahfiz]);

  // Get tahfiz schedules for this ustadz's classes
  const myJadwalTahfiz = useMemo(() => {
    const myKelasIds = myKelasTahfiz.map(k => k.id);
    return jadwalTahfiz.filter(j => myKelasIds.includes(j.kelasId));
  }, [jadwalTahfiz, myKelasTahfiz]);

  // Reset to appropriate tab when modal closes or guru changes
  React.useEffect(() => {
    if (!isOpen) {
      setActiveTab(isTahfizOnly ? 'tahfiz' : 'akademik');
    }
  }, [isOpen, isTahfizOnly]);

  // Auto switch to tahfiz tab if system is tahfiz-only
  React.useEffect(() => {
    if (isTahfizOnly) {
      setActiveTab('tahfiz');
    } else if (!isUstadz && activeTab === 'tahfiz') {
      setActiveTab('akademik');
    }
  }, [isTahfizOnly, isUstadz, activeTab]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t('detailAbsensiModal.titleWithName', { name: selectedGuru?.name || '' })}
        size="xl"
      >
        {selectedGuru && detailView === 'default' && (
          <div className="space-y-4 sm:space-y-6">
            <GuruProfileHeader
              guru={selectedGuru}
              getKelasName={getKelasName}
            />

            {/* Tabs - Only show if not tahfiz-only system and guru is ustadz */}
            {isUstadz && !isTahfizOnly && (
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('akademik')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'akademik'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('detailAbsensiModal.akademik')}
                </button>
                <button
                  onClick={() => setActiveTab('tahfiz')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'tahfiz'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('detailAbsensiModal.tahfiz')}
                </button>
              </div>
            )}

            {activeTab === 'akademik' && !isTahfizOnly && (
              <>
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm sm:text-base text-blue-900 mb-3">{t('detailAbsensiModal.filterTanggal')}</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-row items-center gap-2 sm:gap-3">
                      <label className="text-xs sm:text-sm font-medium text-blue-700 whitespace-nowrap flex-shrink-0">{t('detailAbsensiModal.tanggal')}:</label>
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
                        {t('detailAbsensiModal.hariIni')}
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
                        <span className="truncate">{t('detailAbsensiModal.lihatKehadiran')}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onDetailViewChange('pertemuan')}
                        className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1"
                      >
                        <ListChecks size={14} className="sm:w-4 sm:h-4" />
                        <span className="truncate">{t('detailAbsensiModal.lihatPertemuan')}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => onRekapMengajarOpen(true)}
                        className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1"
                      >
                        <BarChart3 size={14} className="sm:w-4 sm:h-4" />
                        <span className="truncate">{t('detailAbsensiModal.rekapMengajar')}</span>
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
              </>
            )}

            {activeTab === 'tahfiz' && (isUstadz || isTahfizOnly) && (
              <>
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm sm:text-base text-blue-900 mb-3">{t('detailAbsensiModal.filterTanggal')}</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-row items-center gap-2 sm:gap-3">
                      <label className="text-xs sm:text-sm font-medium text-blue-700 whitespace-nowrap flex-shrink-0">{t('detailAbsensiModal.tanggal')}:</label>
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
                        {t('detailAbsensiModal.hariIni')}
                      </Button>
                    </div>
                   
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onDetailViewChange('pertemuan')}
                        className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1"
                      >
                        <ListChecks size={14} className="sm:w-4 sm:h-4" />
                        <span className="truncate">{t('detailAbsensiModal.lihatTahfiz')}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => setIsRekapMengajarTahfizOpen(true)}
                        className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1"
                      >
                        <BarChart3 size={14} className="sm:w-4 sm:h-4" />
                        <span className="truncate">{t('detailAbsensiModal.rekapMengajarTahfiz')}</span>
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

                  <JadwalTahfizCard
                    detailDate={detailDate}
                    selectedGuru={selectedGuru}
                    jadwalTahfiz={myJadwalTahfiz}
                    sesiAbsensiTahfiz={sesiAbsensiTahfiz}
                    kelasTahfiz={myKelasTahfiz}
                    onViewPhoto={onViewPhoto}
                    onViewJurnalFile={onViewJurnalFile}
                    onViewDetail={(jadwal, tanggal) => {
                      setSelectedJadwalTahfiz(jadwal);
                      setSelectedJadwalTahfizDate(tanggal);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {selectedGuru && detailView === 'kehadiran' && activeTab === 'akademik' && !isTahfizOnly && (
          <LihatKehadiranView
            guru={selectedGuru}
            absensiGuru={absensiGuru}
            pengaturanAbsen={pengaturanAbsen}
            izinGuru={izinGuru}
          />
        )}

        {selectedGuru && detailView === 'pertemuan' && activeTab === 'akademik' && !isTahfizOnly && (
          <LihatPertemuanView
            guru={selectedGuru}
          />
        )}

        {selectedGuru && detailView === 'pertemuan' && activeTab === 'tahfiz' && (isUstadz || isTahfizOnly) && (
          <LihatTahfizView
            guru={selectedGuru}
            jadwalTahfiz={myJadwalTahfiz}
            sesiAbsensiTahfiz={sesiAbsensiTahfiz}
            kelasTahfiz={myKelasTahfiz}
            onViewJurnalFile={onViewJurnalFile}
          />
        )}
      </Modal>

      {selectedGuru && (
        <Modal
          isOpen={isRekapMengajarOpen}
          onClose={() => onRekapMengajarOpen(false)}
          title={t('detailAbsensiModal.rekapMengajarGuru')}
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

      {selectedGuru && (isUstadz || isTahfizOnly) && (
        <Modal
          isOpen={isRekapMengajarTahfizOpen}
          onClose={() => setIsRekapMengajarTahfizOpen(false)}
          title={t('detailAbsensiModal.rekapMengajarTahfizTitle')}
          size="full"
        >
          <RekapMengajarTahfizModal
            guru={selectedGuru}
            jadwalTahfiz={myJadwalTahfiz}
            sesiAbsensiTahfiz={sesiAbsensiTahfiz}
            kelasTahfiz={myKelasTahfiz}
          />
        </Modal>
      )}

      <JadwalTahfizDetailModal
        isOpen={!!selectedJadwalTahfiz}
        onClose={() => {
          setSelectedJadwalTahfiz(null);
          setSelectedJadwalTahfizDate('');
        }}
        selectedJadwal={selectedJadwalTahfiz}
        selectedGuru={selectedGuru}
        selectedJadwalDate={selectedJadwalTahfizDate}
        onViewFile={onViewJurnalFile}
        kelasTahfiz={myKelasTahfiz}
        sesiAbsensiTahfiz={sesiAbsensiTahfiz}
      />
    </>
  );
};

export default DetailAbsensiModal;
