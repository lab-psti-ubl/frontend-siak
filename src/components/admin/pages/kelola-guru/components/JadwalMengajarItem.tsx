import React, { useMemo } from 'react';
import { BookOpen, Clock, AlertCircle, CheckCircle, Image, Camera } from 'lucide-react';
import Badge from '../../../../ui/Badge';
import Button from '../../../../ui/Button';
import { JadwalPelajaran, SesiAbsensi, FotoMengajar, User } from '../../../../../types';
import { Eye } from 'lucide-react';
import { useJurnal } from '../../../../../hooks/useJurnal';

interface JadwalMengajarItemProps {
  jadwal: JadwalPelajaran;
  detailDate: string;
  sesiAbsensi: SesiAbsensi[];
  fotoMengajar: FotoMengajar | undefined;
  selectedGuru: User;
  onViewPhoto: (foto: FotoMengajar) => void;
  onViewDetail: (jadwal: JadwalPelajaran, tanggal: string) => void;
  getMapelName: (mapelId: string) => string;
  getKelasName: (kelasId: string) => string;
}

const JadwalMengajarItem: React.FC<JadwalMengajarItemProps> = ({
  jadwal,
  detailDate,
  sesiAbsensi,
  fotoMengajar,
  selectedGuru,
  onViewPhoto,
  onViewDetail,
  getMapelName,
  getKelasName
}) => {
  const sesiDibuka = sesiAbsensi.find(s =>
    s.jadwalId === jadwal.id &&
    s.tanggal === detailDate &&
    s.createdBy === selectedGuru.id
  );

  // Fetch jurnal from jurnal collection
  const { jurnal: jurnalList } = useJurnal(
    detailDate && jadwal.id
      ? {
          tanggal: detailDate,
          jadwalId: jadwal.id,
          kelasId: jadwal.kelasId,
        }
      : undefined
  );

  const jurnal = useMemo(() => {
    if (!detailDate || !jadwal.id) return undefined;
    
    // Find jurnal document for this jadwalId and kelasId
    const jurnalDoc = jurnalList.find(
      j => j.jadwalId === jadwal.id && j.kelasId === jadwal.kelasId
    );
    
    if (!jurnalDoc) return undefined;
    
    // Check if jurnalDoc has pertemuan array (new structure)
    if (jurnalDoc.pertemuan && Array.isArray(jurnalDoc.pertemuan)) {
      // Find pertemuan with matching tanggal
      const pertemuan = jurnalDoc.pertemuan.find((p: any) => p.tanggal === detailDate);
      return pertemuan ? { ...jurnalDoc, ...pertemuan } : undefined;
    }
    
    // Old structure (backward compatibility)
    if (jurnalDoc.tanggal === detailDate) {
      return jurnalDoc;
    }
    
    return undefined;
  }, [jurnalList, jadwal.id, jadwal.kelasId, detailDate]);

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        sesiDibuka
          ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-300'
          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              sesiDibuka ? 'bg-emerald-100' : 'bg-gray-200'
            }`}>
              <BookOpen className={`w-5 h-5 ${sesiDibuka ? 'text-emerald-600' : 'text-gray-500'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                {getMapelName(jadwal.mataPelajaranId)}
              </h5>
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <span className="px-2 py-1 bg-white rounded border border-gray-200">
                  {getKelasName(jadwal.kelasId)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {jadwal.jamMulai} - {jadwal.jamSelesai}
                </span>
              </div>

              {sesiDibuka && (
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
                      onClick={() => onViewPhoto(fotoMengajar)}
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
                      className="text-xs flex items-center gap-1"
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

              {!sesiDibuka && (
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

          {sesiDibuka && (
            <div className="mt-3 pt-3 border-t border-emerald-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 flex items-center gap-1">
                  <Clock size={11} />
                  Sesi: {sesiDibuka.jamBuka} - {sesiDibuka.jamTutup || 'Aktif'}
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

export default JadwalMengajarItem;
