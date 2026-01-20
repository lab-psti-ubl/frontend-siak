import React, { useMemo } from 'react';
import { AlertCircle, Camera, BookOpen, Calendar, Clock, Users } from 'lucide-react';
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
  const { santri } = useSantri();
  const { jurnalTahfiz } = useJurnalTahfiz({ 
    jadwalId: selectedJadwal?.id,
    tanggal: selectedJadwalDate,
    kelasId: selectedJadwal?.kelasId
  });

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
    return date.toLocaleDateString('id-ID', options);
  };

  const hariNames: Record<string, string> = {
    'senin': 'Senin',
    'selasa': 'Selasa',
    'rabu': 'Rabu',
    'kamis': 'Kamis',
    'jumat': 'Jumat',
    'sabtu': 'Sabtu',
    'minggu': 'Minggu',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Jadwal Tahfiz"
      size="xl"
    >
      <div className="space-y-4">
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {kelas?.namaKelas || 'Kelas Tahfiz'}
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
                  <span>Jadwal: <span className="capitalize font-medium">{hariNames[selectedJadwal.hari]}</span> - {selectedJadwal.jamMulai} - {selectedJadwal.jamSelesai}</span>
                </div>
              </div>
            </div>

            {sesiDibuka && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="success" className="text-xs">
                    Sesi Dibuka
                  </Badge>
                  {fotoMengajar ? (
                    <Badge variant="info" className="text-xs">
                      <Camera size={12} className="mr-1" />
                      Ada Foto
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-xs">
                      <Camera size={12} className="mr-1" />
                      Belum Foto
                    </Badge>
                  )}
                  {jurnal ? (
                    <Badge variant="success" className="text-xs cursor-pointer" onClick={() => jurnal?.file && onViewFile(jurnal.file)}>
                      <BookOpen size={12} className="mr-1" />
                      Ada Jurnal
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs">
                      <BookOpen size={12} className="mr-1" />
                      Belum Jurnal
                    </Badge>
                  )}
                </div>

                {jurnal && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {jurnal.judul || 'Jurnal Mengajar'}
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
                  Belum Mengajar
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {sesiDibuka && (
          <Card className="p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Daftar Absensi Santri</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>Nama</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Waktu</TableCell>
                    <TableCell>Metode</TableCell>
                    <TableCell>Keterangan</TableCell>
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
                            <Badge variant="default">Belum Absen</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          {attendance ? new Date(attendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </TableCell>
                        <TableCell>
                          {attendance ? (
                            <Badge variant={attendance.method === 'qr' ? 'info' : 'default'} className="text-xs">
                              {attendance.method === 'qr' ? 'QR Code' : 'Manual'}
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
    </Modal>
  );
};

export default JadwalTahfizDetailModal;

