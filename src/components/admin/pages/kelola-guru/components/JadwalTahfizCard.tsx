import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import Card from '../../../../ui/Card';
import { User, SesiAbsensiTahfiz, TahfizSchedule, FotoMengajarTahfiz } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';
import { useJurnalTahfiz } from '../../../../../hooks/useJurnalTahfiz';
import JadwalTahfizItem from './JadwalTahfizItem';

interface JadwalTahfizCardProps {
  detailDate: string;
  selectedGuru: User;
  jadwalTahfiz: TahfizSchedule[];
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  kelasTahfiz: TahfizClass[];
  onViewPhoto: (foto: FotoMengajarTahfiz) => void;
  onViewJurnalFile: (file: any) => void;
  onViewDetail: (jadwal: TahfizSchedule, tanggal: string) => void;
}

const JadwalTahfizCard: React.FC<JadwalTahfizCardProps> = ({
  detailDate,
  selectedGuru,
  jadwalTahfiz,
  sesiAbsensiTahfiz,
  kelasTahfiz,
  onViewPhoto,
  onViewJurnalFile,
  onViewDetail
}) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ms' ? 'ms-MY' : 'id-ID';
  const getDayNameInIndonesian = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayMap: Record<number, string> = {
      0: 'minggu',
      1: 'senin',
      2: 'selasa',
      3: 'rabu',
      4: 'kamis',
      5: 'jumat',
      6: 'sabtu'
    };
    return dayMap[date.getDay()];
  };

  const dayName = getDayNameInIndonesian(detailDate);

  const jadwalHariIni = jadwalTahfiz.filter(j => j.hari === dayName);

  // Fetch jurnal tahfiz for all jadwal
  const { jurnalTahfiz } = useJurnalTahfiz({ tahun: new Date(detailDate).getFullYear().toString() });

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">{t('detailAbsensiModal.jadwalTahfiz')}</h4>
        <span className="text-xs text-gray-500">
          {new Date(detailDate).toLocaleDateString(dateLocale, {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
          })}
        </span>
      </div>

      {jadwalHariIni.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm font-medium">{t('detailAbsensiModal.tidakAdaJadwalTahfiz')}</p>
          <p className="text-xs mt-1">{t('detailAbsensiModal.tidakAdaJadwalUntukUstadz')}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {jadwalHariIni.map((jadwal, idx) => {
            const kelas = kelasTahfiz.find(k => k.id === jadwal.kelasId);
            const sesiDibuka = sesiAbsensiTahfiz.find(s =>
              s.jadwalId === jadwal.id &&
              s.tanggal === detailDate &&
              s.createdBy === selectedGuru.id
            );
            
            // Get jurnal tahfiz for this jadwal and tanggal
            const jurnalDoc = jurnalTahfiz.find(j => j.jadwalId === jadwal.id && j.kelasId === jadwal.kelasId);
            const pertemuan = jurnalDoc?.pertemuan?.find(p => p.tanggal === detailDate);
            const fotoMengajar = pertemuan?.fotoMengajar;
            const jurnal = pertemuan ? {
              judul: pertemuan.judul,
              deskripsi: pertemuan.deskripsi,
              waktuInput: pertemuan.waktuInput,
              file: pertemuan.file
            } : undefined;

            return (
              <JadwalTahfizItem
                key={idx}
                jadwal={jadwal}
                kelas={kelas}
                detailDate={detailDate}
                sesiAbsensiTahfiz={sesiDibuka}
                fotoMengajar={fotoMengajar}
                jurnal={jurnal}
                selectedGuru={selectedGuru}
                onViewPhoto={onViewPhoto}
                onViewJurnalFile={onViewJurnalFile}
                onViewDetail={onViewDetail}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default JadwalTahfizCard;

