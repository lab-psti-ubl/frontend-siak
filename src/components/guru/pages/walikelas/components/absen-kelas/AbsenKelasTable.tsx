import React, { useState, useEffect } from 'react';
import { Users, Calendar, MessageCircle, Phone, Eye, FileText, BarChart3 } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../../ui/Table';
import { User, Absensi, Murid } from '../../../../../../types';
import { getDisplayStatusAbsen, determineKeterangan } from '../../../../../../utils/absenValidationUtils';
import { determineAbsenStatusForMurid, getAbsenStatusBadgeVariant } from './absenKelasStatusHelper';
import { useAuth } from '../../../../../../context/AuthContext';
import RekapAbsenBulanModal from './RekapAbsenBulanModal';
import { generateAbsenHarianPDF, generateAbsenHarianExcel } from './utils/exportAbsenHarianUtils';
import { useKelas } from '../../../../../../hooks/useKelas';
import { useSesiAbsensi } from '../../../../../../hooks/useSesiAbsensi';
import { useAbsensi } from '../../../../../../hooks/useAbsensi';
import { usePengaturanAbsen } from '../../../../../../hooks/usePengaturanAbsen';
import { useTahunAjaran } from '../../../../../../hooks/useTahunAjaran';

interface AbsenKelasTableProps {
  muridKelas: User[];
  selectedDate: string;
  refreshKey: number;
  getAttendanceStatus: (muridId: string, sessionType: 'masuk' | 'pulang') => Absensi | null;
  sendWhatsAppNotification: (murid: User, status: string, sessionType: string) => void;
}

const AbsenKelasTable: React.FC<AbsenKelasTableProps> = ({
  muridKelas,
  selectedDate,
  refreshKey,
  getAttendanceStatus,
  sendWhatsAppNotification
}) => {
  const { user } = useAuth();
  const { pengaturanAbsen, activePengaturanAbsen } = usePengaturanAbsen();
  const { kelas } = useKelas();
  const { sesiAbsensi } = useSesiAbsensi();
  const { absensi, refreshAbsensi } = useAbsensi({ kelasId: muridKelas[0]?.kelasId, tanggal: selectedDate });
  const { tahunAjaran: tahunAjaranData } = useTahunAjaran();
  const [showRekapModal, setShowRekapModal] = useState(false);
  
  // Refresh absensi when refreshKey changes (triggered from parent)
  useEffect(() => {
    if (refreshKey > 0) {
      refreshAbsensi();
    }
  }, [refreshKey, refreshAbsensi]);

  const myKelas = kelas.find(k => k.id === (muridKelas[0] as Murid)?.kelasId);
  const waliKelasName = user?.name || 'Wali Kelas';

  const getHari = (dateStr: string): string => {
    const date = new Date(dateStr);
    const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return hariList[date.getDay()];
  };

  const prepareExportData = () => {
    return muridKelas.map((murid) => {
      const masukAttendance = getAttendanceStatus(murid.id, 'masuk');
      const pulangAttendance = getAttendanceStatus(murid.id, 'pulang');
      
      // Gunakan determineAbsenStatusForMurid untuk mendapatkan status yang benar (termasuk Terlambat/Pulang Cepat)
      const masukStatusInfo = determineAbsenStatusForMurid(masukAttendance, 'masuk', activePengaturanAbsen);
      const effectivePulangAttendance = pulangAttendance || (masukAttendance && ['izin', 'sakit', 'alfa'].includes(masukAttendance.status) ? masukAttendance : null);
      const pulangStatusInfo = determineAbsenStatusForMurid(effectivePulangAttendance, 'pulang', activePengaturanAbsen);
      
      const keteranganResult = determineKeterangan(masukAttendance, pulangAttendance, activePengaturanAbsen);

      return {
        murid,
        masukStatus: masukAttendance ? masukStatusInfo.displayStatus : undefined,
        masukWaktu: masukAttendance ? new Date(masukAttendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined,
        pulangStatus: effectivePulangAttendance ? pulangStatusInfo.displayStatus : undefined,
        pulangWaktu: pulangAttendance ? new Date(pulangAttendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined,
        keterangan: keteranganResult.keterangan
      };
    });
  };

  const handleExportPDF = () => {
    const exportData = prepareExportData();
    generateAbsenHarianPDF(exportData, myKelas?.name || 'Kelas', waliKelasName, selectedDate, getHari(selectedDate));
  };

  const handleExportExcel = () => {
    const exportData = prepareExportData();
    generateAbsenHarianExcel(exportData, myKelas?.name || 'Kelas', waliKelasName, selectedDate, getHari(selectedDate));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hadir':
      case 'Hadir':
        return <Badge variant="success">HADIR</Badge>;
      case 'terlambat':
      case 'Terlambat':
        return <Badge variant="warning">TERLAMBAT</Badge>;
      case 'pulang_cepat':
      case 'Pulang Cepat':
        return <Badge variant="warning">PULANG CEPAT</Badge>;
      case 'izin':
      case 'Izin':
        return <Badge variant="warning">IZIN</Badge>;
      case 'sakit':
      case 'Sakit':
        return <Badge variant="info">SAKIT</Badge>;
      case 'alfa':
      case 'Alfa':
        return <Badge variant="danger">ALFA</Badge>;
      default:
        return <Badge variant="default">BELUM ABSEN</Badge>;
    }
  };

  const getKeteranganBadge = (keterangan: string) => {
    switch (keterangan) {
      case 'Hadir':
        return <Badge variant="success">HADIR</Badge>;
      case 'Izin':
        return <Badge variant="warning">IZIN</Badge>;
      case 'Sakit':
        return <Badge variant="info">SAKIT</Badge>;
      case 'Bolos':
        return <Badge variant="danger">BOLOS</Badge>;
      case 'Dispen':
        return <Badge variant="warning">DISPEN</Badge>;
      case 'Alfa':
        return <Badge variant="danger">ALFA</Badge>;
      case '-':
        return <Badge variant="default">-</Badge>;
      default:
        return <Badge variant="default">-</Badge>;
    }
  };

  const batasTerlambat = activePengaturanAbsen
    ? (() => {
        const [jam, menit] = activePengaturanAbsen.jamMasuk.split(':').map(Number);
        const batas = new Date();
        batas.setHours(jam, menit + activePengaturanAbsen.toleransiMasuk, 0);
        return batas.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
      })()
    : null;

  const batasPulangAwal = activePengaturanAbsen
    ? (() => {
        const [jam, menit] = activePengaturanAbsen.jamPulang.split(':').map(Number);
        const batas = new Date();
        batas.setHours(jam, menit - activePengaturanAbsen.toleransiPulang, 0);
        return batas.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
      })()
    : null;

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-90 rounded-lg p-2 sm:p-2.5">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Rekap Absensi</h3>
                <p className="text-xs sm:text-sm text-blue-100">{new Date(selectedDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          {activePengaturanAbsen && (
            <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-900">
                <span className="font-semibold">Jam Kerja:</span> {activePengaturanAbsen.jamMasuk} - {activePengaturanAbsen.jamPulang} |
                <span className="font-semibold ml-2">Terlambat setelah:</span> {batasTerlambat} |
                <span className="font-semibold ml-2">Pulang cepat sebelum:</span> {batasPulangAwal}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 mb-5 sm:flex-row sm:gap-3 sm:mb-6">

  {/* PDF + EXCEL */}
  <div className="flex gap-2 order-1 sm:order-none w-full sm:w-auto">
    <Button
      onClick={handleExportPDF}
      variant="danger"
      size="sm"
      className="w-1/2 sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-2.5"
    >
      <FileText className="w-4 h-4" />
      <span>PDF</span>
    </Button>

    <Button
      onClick={handleExportExcel}
      variant="success"
      size="sm"
      className="w-1/2 sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-2.5"
    >
      <BarChart3 className="w-4 h-4" />
      <span>Excel</span>
    </Button>
  </div>

  {/* ABSENSI */}
  <Button
    onClick={() => setShowRekapModal(true)}
    variant="primary"
    size="sm"
    className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-2.5 order-2 sm:order-none"
  >
    <Eye className="w-4 h-4" />
    <span>Lihat Absensi</span>
  </Button>

</div>



          {muridKelas.length > 0 ? (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Nama Murid</TableCell>
              <TableCell header>NISN</TableCell>
              <TableCell header>Absen Masuk</TableCell>
              <TableCell header>Waktu Masuk</TableCell>
              <TableCell header>Absen Pulang</TableCell>
              <TableCell header>Waktu Pulang</TableCell>
              <TableCell header>Keterangan</TableCell>
              <TableCell header>Notifikasi Ortu</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {muridKelas.map((murid) => {
              const masukAttendance = getAttendanceStatus(murid.id, 'masuk');
              const pulangAttendance = getAttendanceStatus(murid.id, 'pulang');

              const masukStatusInfo = determineAbsenStatusForMurid(masukAttendance, 'masuk', activePengaturanAbsen);
              const effectivePulangAttendance = pulangAttendance || (masukAttendance && ['izin', 'sakit', 'alfa'].includes(masukAttendance.status) ? masukAttendance : null);
              const pulangStatusInfo = determineAbsenStatusForMurid(effectivePulangAttendance, 'pulang', activePengaturanAbsen);

              const keteranganResult = determineKeterangan(masukAttendance, pulangAttendance, activePengaturanAbsen);

              return (
                <TableRow key={`${murid.id}-${refreshKey}`}>
                  <TableCell>{murid.name}</TableCell>
                  <TableCell>{murid.nisn}</TableCell>
                  <TableCell>
                    {masukAttendance ? (
                      <Badge variant={getAbsenStatusBadgeVariant(masukStatusInfo.statusAbsen)}>
                        {masukStatusInfo.displayStatus}
                      </Badge>
                    ) : (
                      <Badge variant="default">Belum Absen</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {masukAttendance ?
                      new Date(masukAttendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) :
                      '-'
                    }
                  </TableCell>
                  <TableCell>
                    {effectivePulangAttendance ? (
                      <Badge variant={getAbsenStatusBadgeVariant(pulangStatusInfo.statusAbsen)}>
                        {pulangStatusInfo.displayStatus}
                      </Badge>
                    ) : (
                      <Badge variant="default">Belum Absen</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {pulangAttendance ?
                      new Date(pulangAttendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) :
                      '-'
                    }
                  </TableCell>
                  <TableCell>
                    {getKeteranganBadge(keteranganResult.keterangan)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {masukAttendance && murid.whatsappOrtu && (
                        <Button
                          size="sm"
                          variant={pulangAttendance ? "secondary" : "success"}
                          onClick={() => sendWhatsAppNotification(murid, masukAttendance.status, 'masuk')}
                          className={`${pulangAttendance ? 'bg-gray-500 hover:bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} !p-1 flex items-center py-8`}
                          title="Kirim notifikasi WhatsApp ke orang tua"
                          disabled={!!pulangAttendance}
                        >
                          <MessageCircle size={12} />
                          masuk
                        </Button>
                      )}
                      {pulangAttendance && murid.whatsappOrtu && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => sendWhatsAppNotification(murid, pulangAttendance.status, 'pulang')}
                          className="bg-green-600 hover:bg-green-700 !p-1 flex items-center"
                          title="Kirim notifikasi WhatsApp ke orang tua"
                        >
                          <Phone size={12} />
                          pulang
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
              </div>

              <div className="sm:hidden space-y-3">
                {muridKelas.map((murid) => {
                  const masukAttendance = getAttendanceStatus(murid.id, 'masuk');
                  const pulangAttendance = getAttendanceStatus(murid.id, 'pulang');

                  const masukStatusInfo = determineAbsenStatusForMurid(masukAttendance, 'masuk', activePengaturanAbsen);
                  const effectivePulangAttendance = pulangAttendance || (masukAttendance && ['izin', 'sakit', 'alfa'].includes(masukAttendance.status) ? masukAttendance : null);
                  const pulangStatusInfo = determineAbsenStatusForMurid(effectivePulangAttendance, 'pulang', activePengaturanAbsen);

                  const keteranganResult = determineKeterangan(masukAttendance, pulangAttendance, activePengaturanAbsen);

                  return (
                    <div key={`${murid.id}-${refreshKey}`} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 hover:border-slate-300 transition-all duration-200">
                      <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{murid.name}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{murid.nisn}</p>
                        </div>
                        <div>
                          {getKeteranganBadge(keteranganResult.keterangan)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Absen Masuk</span>
                          <div className="space-y-1">
                            {masukAttendance ? (
                              <>
                                <div>
                                  <Badge variant={getAbsenStatusBadgeVariant(masukStatusInfo.statusAbsen)}>
                                    {masukStatusInfo.displayStatus}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-700 font-mono">
                                  {new Date(masukAttendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </p>
                              </>
                            ) : (
                              <Badge variant="default">Belum</Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Absen Pulang</span>
                          <div className="space-y-1">
                            {effectivePulangAttendance ? (
                              <>
                                <div>
                                  <Badge variant={getAbsenStatusBadgeVariant(pulangStatusInfo.statusAbsen)}>
                                    {pulangStatusInfo.displayStatus}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-700 font-mono">
                                  {pulangAttendance ? new Date(pulangAttendance.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                                </p>
                              </>
                            ) : (
                              <Badge variant="default">Belum</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {(murid.whatsappOrtu && masukAttendance) || (murid.whatsappOrtu && pulangAttendance) ? (
                        <div className="pt-2 border-t border-slate-200 flex gap-2">
                          {masukAttendance && murid.whatsappOrtu && (
                            <Button
                              size="sm"
                              variant={pulangAttendance ? "secondary" : "success"}
                              onClick={() => sendWhatsAppNotification(murid, masukAttendance.status, 'masuk')}
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
                              disabled={!!pulangAttendance}
                            >
                              <MessageCircle size={14} />
                              Masuk
                            </Button>
                          )}
                          {pulangAttendance && murid.whatsappOrtu && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => sendWhatsAppNotification(murid, pulangAttendance.status, 'pulang')}
                              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
                            >
                              <Phone size={14} />
                              Pulang
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300" />
              <p className="text-sm sm:text-base font-semibold text-slate-600">Belum ada murid di kelas ini</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Tambahkan murid untuk memulai absensi</p>
            </div>
          )}
        </div>
      </div>

      <RekapAbsenBulanModal
        isOpen={showRekapModal}
        onClose={() => setShowRekapModal(false)}
        muridKelas={muridKelas}
        namaKelas={myKelas?.name}
        waliKelasName={waliKelasName}
        sesiAbsensi={sesiAbsensi}
        absensi={absensi}
        kelasId={(muridKelas[0] as Murid)?.kelasId || ''}
        tahunAjaranData={tahunAjaranData}
        pengaturanAbsen={pengaturanAbsen}
      />
    </>
  );
};

export default AbsenKelasTable;