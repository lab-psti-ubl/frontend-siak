import React from 'react';
import { Calendar } from 'lucide-react';
import Card from '../../../../ui/Card';
import { JadwalPelajaran, User, SesiAbsensi, AbsensiGuru, FotoMengajar } from '../../../../../types';
import JadwalMengajarItem from './JadwalMengajarItem';

interface JadwalMengajarCardProps {
  detailDate: string;
  selectedGuru: User;
  jadwalPelajaran: JadwalPelajaran[];
  sesiAbsensi: SesiAbsensi[];
  absensiGuru: AbsensiGuru[];
  onViewPhoto: (foto: FotoMengajar) => void;
  onViewDetail: (jadwal: JadwalPelajaran, tanggal: string) => void;
  getMapelName: (mapelId: string) => string;
  getKelasName: (kelasId: string) => string;
  tahunAjaranAktif?: string;
  semesterAktif?: number;
}

const JadwalMengajarCard: React.FC<JadwalMengajarCardProps> = ({
  detailDate,
  selectedGuru,
  jadwalPelajaran,
  sesiAbsensi,
  absensiGuru,
  onViewPhoto,
  onViewDetail,
  getMapelName,
  getKelasName,
  tahunAjaranAktif,
  semesterAktif
}) => {
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
  const effectiveTahunAjaran = tahunAjaranAktif || new Date().getFullYear().toString();
  const effectiveSemester = semesterAktif !== undefined ? semesterAktif : 1;

  const jadwalHariIni = jadwalPelajaran.filter(j =>
    j.guruId === selectedGuru.id &&
    dayName === j.hari &&
    j.tahunAjaran === effectiveTahunAjaran &&
    j.semester === effectiveSemester
  );

  const absensiHariIni = absensiGuru.find(a =>
    a.guruId === selectedGuru.id &&
    a.tanggal === detailDate
  );

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Jadwal Mengajar</h4>
        <span className="text-xs text-gray-500">
          {new Date(detailDate).toLocaleDateString('id-ID', {
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
          <p className="text-sm font-medium">Tidak ada jadwal mengajar</p>
          <p className="text-xs mt-1">Hari ini tidak ada jadwal untuk guru ini</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {jadwalHariIni.map((jadwal, idx) => {
            const fotoMengajar = absensiHariIni?.fotoMengajar?.find(f => f.jadwalId === jadwal.id);

            return (
              <JadwalMengajarItem
                key={idx}
                jadwal={jadwal}
                detailDate={detailDate}
                sesiAbsensi={sesiAbsensi}
                fotoMengajar={fotoMengajar}
                selectedGuru={selectedGuru}
                onViewPhoto={onViewPhoto}
                onViewDetail={onViewDetail}
                getMapelName={getMapelName}
                getKelasName={getKelasName}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default JadwalMengajarCard;
