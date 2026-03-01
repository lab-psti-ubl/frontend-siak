import React, { useMemo, useState } from 'react';
import { AlertCircle, Camera, BookOpen, Calendar, Clock, Users, ZoomIn, X } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';
import Modal from '../../../../ui/Modal';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { TahfizSchedule, User, SesiAbsensiTahfiz, FotoMengajarTahfiz } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../../hooks/useSantri';
import { useJurnalTahfiz } from '../../../../../hooks/useJurnalTahfiz';

interface JadwalTahfizDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJadwal: TahfizSchedule | null;
  selectedGuru: User | null;
  selectedJadwalDate: string;
  onViewFile: (file: any) => void;
  kelasTahfiz: TahfizClass[];
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
}

const JadwalTahfizDetailModal: React.FC<JadwalTahfizDetailModalProps> = ({
  isOpen,
  onClose,
  selectedJadwal,
  selectedGuru,
  selectedJadwalDate,
  onViewFile,
  kelasTahfiz,
  sesiAbsensiTahfiz
}) => {
  // All hooks must be called before any early returns (Rules of Hooks)
  const { t, language } = useLanguage();
  const dateLocale = language === 'ms' ? 'ms-MY' : 'id-ID';
  const { santri } = useSantri();
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<FotoMengajarTahfiz | null>(null);
  // Fetch all jurnal tahfiz and filter client-side to get full document structure
  const { jurnalTahfiz: allJurnalTahfiz } = useJurnalTahfiz({ 
    tahun: new Date(selectedJadwalDate).getFullYear().toString()
  });
  
  // Filter jurnal tahfiz for this specific jadwal, kelas, and tanggal
  const jurnalTahfiz = useMemo(() => {
    if (!selectedJadwal || !allJurnalTahfiz) return [];
    return allJurnalTahfiz.filter(j => 
      j.jadwalId === selectedJadwal.id && 
      j.kelasId === selectedJadwal.kelasId &&
      j.pertemuan && 
      Array.isArray(j.pertemuan) &&
      j.pertemuan.some((p: any) => p.tanggal === selectedJadwalDate)
    );
  }, [allJurnalTahfiz, selectedJadwal, selectedJadwalDate]);

  // Get kelas and sesi - handle null cases
  const kelas = useMemo(() => {
    if (!selectedJadwal) return undefined;
    return kelasTahfiz.find(k => k.id === selectedJadwal.kelasId);
  }, [selectedJadwal, kelasTahfiz]);

  const sesiDibuka = useMemo(() => {
    if (!selectedJadwal || !selectedGuru) return undefined;
    return sesiAbsensiTahfiz.find(s =>
      s.jadwalId === selectedJadwal.id &&
      s.tanggal === selectedJadwalDate &&
      s.createdBy === selectedGuru.id
    );
  }, [selectedJadwal, selectedGuru, selectedJadwalDate, sesiAbsensiTahfiz]);

  // Get jurnal tahfiz pertemuan for this date
  const pertemuan = useMemo(() => {
    if (!selectedJadwal) return undefined;
    const jurnalDoc = jurnalTahfiz.find(j => j.jadwalId === selectedJadwal.id && j.kelasId === selectedJadwal.kelasId);
    return jurnalDoc?.pertemuan?.find(p => p.tanggal === selectedJadwalDate);
  }, [jurnalTahfiz, selectedJadwal, selectedJadwalDate]);

  const fotoMengajar = pertemuan?.fotoMengajar;
  const jurnal = pertemuan ? {
    judul: pertemuan.judul,
    deskripsi: pertemuan.deskripsi,
    waktuInput: pertemuan.waktuInput,
    file: pertemuan.file
  } : undefined;

  // Get santri for this class
  const santriList = useMemo(() => {
    if (!kelas) return [];
    return kelas.santriIds
      .map(santriId => santri.find(s => s.id === santriId))
      .filter(Boolean) as User[];
  }, [kelas, santri]);

  const hariNames: Record<string, string> = useMemo(() => {
    const keys = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const base = new Date(2024, 0, 7);
    const result: Record<string, string> = {};
    keys.forEach((key, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      result[key] = d.toLocaleDateString(dateLocale, { weekday: 'long' });
    });
    return result;
  }, [dateLocale]);

  // Early return after all hooks
  if (!selectedJadwal || !selectedGuru) return null;

  // Get attendance status helper
  const getAttendanceStatus = (santriId: string) => {
    if (!sesiDibuka || !sesiDibuka.dataAbsensi) return undefined;
    return sesiDibuka.dataAbsensi.find(a => a.muridId === santriId);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'hadir':
        return 'success';
      case 'izin':
        return 'info';
      case 'sakit':
        return 'warning';
      case 'alfa':
        return 'danger';
      case 'terlambat':
        return 'warning';
      case 'pulang_cepat':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString(dateLocale, options);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('detailAbsensiModal.detailJadwalTahfiz')}
      size="xl"
    >
      <div className="space-y-4">
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {kelas?.namaKelas || t('detailAbsensiModal.kelasTahfiz')}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formatTanggal(selectedJadwalDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>
                    {sesiDibuka ? `${sesiDibuka.jamBuka} - ${sesiDibuka.jamTutup || 'Aktif'}` : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>{t('detailAbsensiModal.jadwal')}: <span className="capitalize font-medium">{hariNames[selectedJadwal.hari]}</span> - {selectedJadwal.jamMulai} - {selectedJadwal.jamSelesai}</span>
                </div>
              </div>
            </div>

            {sesiDibuka && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="success" className="text-xs">
                    {t('detailAbsensiModal.sesiDibuka')}
                  </Badge>
                  {fotoMengajar ? (
                    <Badge 
                      variant="info" 
                      className="text-xs cursor-pointer hover:bg-blue-600"
                      onClick={() => {
                        setSelectedPhoto(fotoMengajar);
                        setShowPhotoPreview(true);
                      }}
                    >
                      <Camera size={12} className="mr-1" />
                      {t('detailAbsensiModal.adaFoto')}
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-xs">
                      <Camera size={12} className="mr-1" />
                      {t('detailAbsensiModal.belumFoto')}
                    </Badge>
                  )}
                  {jurnal ? (
                    <Badge variant="success" className="text-xs cursor-pointer" onClick={() => jurnal?.file && onViewFile(jurnal.file)}>
                      <BookOpen size={12} className="mr-1" />
                      {t('detailAbsensiModal.adaJurnal')}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs">
                      <BookOpen size={12} className="mr-1" />
                      {t('detailAbsensiModal.belumJurnal')}
                    </Badge>
                  )}
                </div>

                {/* Foto Mengajar Preview */}
                {fotoMengajar && (
                  <div className="mt-3">
                    <Card className="p-3 bg-white border border-gray-200">
                      <h5 className="text-sm font-bold text-gray-900 mb-2">{t('detailAbsensiModal.fotoBuktiMengajar')}</h5>
                      <div 
                        className="relative group text-center bg-white rounded-lg p-3 border-2 border-blue-100 cursor-pointer hover:border-blue-300 transition-all duration-200"
                        onClick={() => {
                          setSelectedPhoto(fotoMengajar);
                          setShowPhotoPreview(true);
                        }}
                      >
                        <img
                          src={fotoMengajar.fotoBase64}
                          alt="Bukti Mengajar"
                          className="max-w-full max-h-48 sm:max-h-64 object-contain rounded-lg mx-auto shadow-sm group-hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center rounded-lg">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-white bg-opacity-90 rounded-full shadow-lg">
                            <ZoomIn size={24} className="text-blue-600" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 group-hover:text-blue-600 transition-colors">
                          {t('detailAbsensiModal.klikUntukPreview')}
                        </p>
                        {fotoMengajar.keterangan && (
                          <p className="text-xs text-gray-600 mt-1">
                            {fotoMengajar.keterangan}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Diambil: {new Date(fotoMengajar.waktuFoto).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </Card>
                  </div>
                )}

                {jurnal && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {jurnal.judul || t('detailAbsensiModal.jurnalMengajar')}
                    </p>
                    {jurnal.deskripsi && (
                      <p className="text-xs text-gray-600">{jurnal.deskripsi}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!sesiDibuka && (
              <div className="pt-3 border-t border-gray-200">
                <Badge variant="danger" className="text-xs flex items-center gap-1 w-fit">
                  <AlertCircle size={12} />
                  {t('detailAbsensiModal.belumMengajar')}
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {sesiDibuka && (
          <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-4">{t('detailAbsensiModal.daftarAbsensiSantri')}</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>{t('detailAbsensiModal.no')}</TableCell>
                    <TableCell>{t('detailAbsensiModal.nama')}</TableCell>
                    <TableCell>{t('detailAbsensiModal.status')}</TableCell>
                    <TableCell>{t('detailAbsensiModal.waktu')}</TableCell>
                    <TableCell>{t('detailAbsensiModal.metode')}</TableCell>
                    <TableCell>{t('detailAbsensiModal.keterangan')}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {santriList.map((santriItem, index) => {
                    const attendance = getAttendanceStatus(santriItem.id);

                    return (
                      <TableRow key={santriItem.id}>
                        <TableCell className="text-xs sm:text-sm">{index + 1}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{santriItem.name}</TableCell>
                        <TableCell>
                          {attendance ? (
                            <Badge variant={getStatusBadgeVariant(attendance.status)}>
                              {attendance.status.toUpperCase()}
                            </Badge>
                          ) : (
                            <Badge variant="default">{t('detailAbsensiModal.belumAbsen')}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {attendance ? new Date(attendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </TableCell>
                        <TableCell>
                          {attendance ? (
                            <Badge variant={attendance.method === 'qr' ? 'info' : 'default'} className="text-xs">
                              {attendance.method === 'qr' ? t('detailAbsensiModal.qrCode') : t('detailAbsensiModal.manual')}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {attendance?.keterangan || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <Modal
          isOpen={showPhotoPreview}
          onClose={() => {
            setShowPhotoPreview(false);
            setSelectedPhoto(null);
          }}
          title={t('detailAbsensiModal.previewFotoBuktiMengajar')}
          size="lg"
        >
          <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
              <img
                src={selectedPhoto.fotoBase64}
                alt="Foto Bukti Mengajar"
                className="max-w-full max-h-[500px] object-contain rounded-lg"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {selectedPhoto.keterangan && (
                <div>
                  <p className="text-xs font-semibold text-gray-700">{t('detailAbsensiModal.keterangan')}:</p>
                  <p className="text-sm text-gray-900">{selectedPhoto.keterangan}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-700">{t('detailAbsensiModal.waktuFoto')}:</p>
                <p className="text-sm text-gray-900">
                  {new Date(selectedPhoto.waktuFoto).toLocaleString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowPhotoPreview(false);
                  setSelectedPhoto(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
              >
                <X size={16} />
                {t('detailAbsensiModal.tutup')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default JadwalTahfizDetailModal;

