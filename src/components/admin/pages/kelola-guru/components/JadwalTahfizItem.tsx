import React from 'react';
import { BookOpen, Clock, AlertCircle, CheckCircle, Image, Camera, Eye } from 'lucide-react';
import Badge from '../../../../ui/Badge';
import Button from '../../../../ui/Button';
import { SesiAbsensiTahfiz, FotoMengajarTahfiz, User, TahfizSchedule, JurnalMengajar } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';

interface JadwalTahfizItemProps {
  jadwal: TahfizSchedule;
  kelas: TahfizClass | undefined;
  detailDate: string;
  sesiAbsensiTahfiz: SesiAbsensiTahfiz | undefined;
  fotoMengajar: FotoMengajarTahfiz | undefined;
  jurnal?: JurnalMengajar;
  selectedGuru: User;
  onViewPhoto: (foto: FotoMengajarTahfiz) => void;
  onViewJurnalFile: (file: any) => void;
  onViewDetail: (jadwal: TahfizSchedule, tanggal: string) => void;
}

const JadwalTahfizItem: React.FC<JadwalTahfizItemProps> = ({
  jadwal,
  kelas,
  detailDate,
  sesiAbsensiTahfiz,
  fotoMengajar,
  jurnal,
  selectedGuru,
  onViewPhoto,
  onViewJurnalFile,
  onViewDetail
}) => {

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        sesiAbsensiTahfiz
          ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-300'
          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              sesiAbsensiTahfiz ? 'bg-emerald-100' : 'bg-gray-200'
            }`}>
              <BookOpen className={`w-5 h-5 ${sesiAbsensiTahfiz ? 'text-emerald-600' : 'text-gray-500'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                Tahfiz Qur'an
              </h5>
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <span className="px-2 py-1 bg-white rounded border border-gray-200">
                  {kelas?.namaKelas || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {jadwal.jamMulai} - {jadwal.jamSelesai}
                </span>
              </div>

              {sesiAbsensiTahfiz && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge
                    variant="success"
                    className="text-xs flex items-center gap-1"
                  >
                    <CheckCircle size={12} />
                    Hadir Mengajar
                  </Badge>

                  {fotoMengajar ? (
                    <Badge
                      variant="info"
                      className="text-xs flex items-center gap-1 cursor-pointer hover:bg-blue-600"
                      onClick={() => fotoMengajar && onViewPhoto(fotoMengajar)}
                    >
                      <Image size={12} />
                      Bukti Foto
                    </Badge>
                  ) : (
                    <Badge
                      variant="warning"
                      className="text-xs flex items-center gap-1"
                    >
                      <Camera size={12} />
                      Belum Foto
                    </Badge>
                  )}

                  {jurnal ? (
                    <Badge
                      variant="success"
                      className="text-xs flex items-center gap-1 cursor-pointer hover:bg-green-600"
                      onClick={() => jurnal.file && onViewJurnalFile(jurnal.file)}
                    >
                      <BookOpen size={12} />
                      Jurnal
                    </Badge>
                  ) : (
                    <Badge
                      variant="default"
                      className="text-xs flex items-center gap-1"
                    >
                      <BookOpen size={12} />
                      Belum Jurnal
                    </Badge>
                  )}
                </div>
              )}

              {!sesiAbsensiTahfiz && (
                <Badge
                  variant="danger"
                  className="text-xs flex items-center gap-1 w-fit"
                >
                  <AlertCircle size={12} />
                  Belum Mengajar
                </Badge>
              )}
            </div>
          </div>

          {sesiAbsensiTahfiz && (
            <div className="mt-3 pt-3 border-t border-emerald-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 flex items-center gap-1">
                  <Clock size={11} />
                  Sesi: {sesiAbsensiTahfiz.jamBuka} - {sesiAbsensiTahfiz.jamTutup || 'Aktif'}
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onViewDetail(jadwal, detailDate)}
                  className="!px-3 !py-1 text-xs flex items-center gap-1"
                >
                  <Eye size={12} />
                  Detail
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JadwalTahfizItem;

