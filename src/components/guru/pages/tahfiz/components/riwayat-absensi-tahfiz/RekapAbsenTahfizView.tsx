import React, { useMemo, useState } from 'react';
import Card from '../../../../../ui/Card';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { Download, Printer, Calendar, BookOpen, Users } from 'lucide-react';
import { SesiAbsensiTahfiz, TahfizSchedule, User } from '../../../../../../types';
import { TahfizClass } from '../../../../../../hooks/useKelasTahfiz';
import { exportToExcel } from '../../../../../../utils/exportUtils';
import { showSuccessToast, showErrorToast } from '../../../../../../components/ui/ToastContainer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RekapAbsenTahfizViewProps {
  kelasId: string;
  jadwalId: string;
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  santri: User[];
  kelasTahfiz: TahfizClass[];
  jadwalTahfiz: TahfizSchedule[];
}

interface RekapData {
  santriId: string;
  santriName: string;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  total: number;
  persentase: number;
}

interface MeetingInfo {
  pertemuanKe: number;
  tanggal: string;
  sesiId: string;
}

type AttendanceStatus = 'H' | 'A' | 'I' | 'S' | '-';

interface AttendanceMatrix {
  [santriId: string]: {
    [sesiId: string]: AttendanceStatus;
  };
}

const RekapAbsenTahfizView: React.FC<RekapAbsenTahfizViewProps> = ({
  kelasId,
  jadwalId,
  sesiAbsensiTahfiz,
  santri,
  kelasTahfiz,
  jadwalTahfiz,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const kelasData = kelasTahfiz.find(k => k.id === kelasId);
  const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);

  // Get santri list for this class
  const santriList = useMemo(() => {
    if (!kelasData) return [];
    return kelasData.santriIds
      .map(id => santri.find(s => s.id === id))
      .filter(Boolean) as User[];
  }, [kelasData, santri]);

  // Get all closed sessions for this jadwal
  const closedSessions = useMemo(() => {
    return sesiAbsensiTahfiz.filter(s => s.jadwalId === jadwalId && s.status === 'ditutup');
  }, [sesiAbsensiTahfiz, jadwalId]);

  // Tahun ajaran tahfiz (hanya tahun)
  const tahun = useMemo(() => {
    if (closedSessions.length > 0) {
      return closedSessions[0].tahun;
    }
    return '-';
  }, [closedSessions]);

  // Generate rekap data
  const rekapData = useMemo(() => {
    const data: RekapData[] = santriList.map(santriItem => {
      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alfa = 0;

      closedSessions.forEach(session => {
        const absensi = session.dataAbsensi?.find(a => a.muridId === santriItem.id);
        if (absensi) {
          switch (absensi.status) {
            case 'hadir':
              hadir++;
              break;
            case 'izin':
              izin++;
              break;
            case 'sakit':
              sakit++;
              break;
            case 'alfa':
              alfa++;
              break;
          }
        } else {
          alfa++;
        }
      });

      const total = closedSessions.length;
      const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

      return {
        santriId: santriItem.id,
        santriName: santriItem.name,
        hadir,
        izin,
        sakit,
        alfa,
        total,
        persentase,
      };
    });

    return data.sort((a, b) => a.santriName.localeCompare(b.santriName));
  }, [santriList, closedSessions]);

  // Generate meetings (pertemuan) list
  const meetings: MeetingInfo[] = useMemo(() => {
    const sortedSessions = [...closedSessions].sort((a, b) =>
      a.tanggal.localeCompare(b.tanggal)
    );
    return sortedSessions.map((session, idx) => ({
      pertemuanKe: idx + 1,
      tanggal: session.tanggal,
      sesiId: session.id,
    }));
  }, [closedSessions]);

  // Generate attendance matrix (santri x pertemuan)
  const attendanceMatrix: AttendanceMatrix = useMemo(() => {
    const matrix: AttendanceMatrix = {};

    santriList.forEach(santriItem => {
      matrix[santriItem.id] = {};
      meetings.forEach(meeting => {
        const sesi = closedSessions.find(s => s.id === meeting.sesiId);
        const absensi = sesi?.dataAbsensi?.find(a => a.muridId === santriItem.id);

        let status: AttendanceStatus = '-';
        if (absensi) {
          switch (absensi.status) {
            case 'hadir':
              status = 'H';
              break;
            case 'alfa':
              status = 'A';
              break;
            case 'izin':
              status = 'I';
              break;
            case 'sakit':
              status = 'S';
              break;
            default:
              status = '-';
          }
        }

        matrix[santriItem.id][meeting.sesiId] = status;
      });
    });

    return matrix;
  }, [santriList, meetings, closedSessions]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const formatTanggalShort = (tanggal: string) => {
        const date = new Date(tanggal);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
      };

      const columns: { header: string; dataKey: string; width: number }[] = [
        { header: 'No', dataKey: 'no', width: 6 },
        { header: 'Nama Santri', dataKey: 'nama', width: 28 },
        { header: 'NISN', dataKey: 'nisn', width: 16 },
      ];

      meetings.forEach(meeting => {
        columns.push({
          header: `P${meeting.pertemuanKe} (${formatTanggalShort(meeting.tanggal)})`,
          dataKey: `P${meeting.pertemuanKe}`,
          width: 10,
        });
      });

      columns.push(
        { header: 'H', dataKey: 'hadir', width: 6 },
        { header: 'I', dataKey: 'izin', width: 6 },
        { header: 'S', dataKey: 'sakit', width: 6 },
        { header: 'A', dataKey: 'alfa', width: 6 },
        { header: 'Total', dataKey: 'total', width: 8 },
        { header: 'Persentase', dataKey: 'persentase', width: 10 }
      );

      const exportData = santriList.map((santriItem, index) => {
        const stat = rekapData.find(r => r.santriId === santriItem.id);

        const row: Record<string, any> = {
          no: index + 1,
          nama: santriItem.name,
          nisn: (santriItem as any).nisn || '-',
        };

        let hadir = 0;
        let izin = 0;
        let sakit = 0;
        let alfa = 0;

        meetings.forEach(meeting => {
          const status = attendanceMatrix[santriItem.id]?.[meeting.sesiId] || '-';
          row[`P${meeting.pertemuanKe}`] = status;

          if (status === 'H') hadir += 1;
          else if (status === 'I') izin += 1;
          else if (status === 'S') sakit += 1;
          else if (status === 'A') alfa += 1;
        });

        const total = meetings.length;
        const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

        row.hadir = stat?.hadir ?? hadir;
        row.izin = stat?.izin ?? izin;
        row.sakit = stat?.sakit ?? sakit;
        row.alfa = stat?.alfa ?? alfa;
        row.total = stat?.total ?? total;
        row.persentase = `${stat?.persentase ?? persentase}%`;

        return row;
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Rekap_Absensi_Tahfiz_${kelasData?.namaKelas || 'Kelas'}_${timestamp}`;

      exportToExcel(exportData, columns, `Rekap Absensi Tahfiz - ${kelasData?.namaKelas || 'Kelas'}`, filename);
      showSuccessToast('Berhasil', 'Data rekap berhasil diexport ke Excel');
    } catch (error) {
      showErrorToast('Gagal', 'Gagal mengexport data ke Excel');
      console.error('Export Excel error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const formatTanggalShort = (tanggal: string) => {
      const date = new Date(tanggal);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    };

    const doc = new jsPDF({
      orientation: meetings.length > 8 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REKAP ABSENSI PERTEMUAN TAHFIZ', doc.internal.pageSize.getWidth() / 2, 15, {
      align: 'center',
    });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Kelas Tahfiz: ${kelasData?.namaKelas || '-'}`, 14, 25);
    doc.text(`Hari/Jam: ${jadwal ? `${jadwal.hari} ${jadwal.jamMulai} - ${jadwal.jamSelesai}` : '-'}`, 14, 30);
    doc.text(`Tahun: ${tahun}`, 14, 35);

    const headerRow = [
      'No',
      'Nama Santri',
      'NISN',
      ...meetings.map(m => `P${m.pertemuanKe}\n${formatTanggalShort(m.tanggal)}`),
      'H',
      'I',
      'S',
      'A',
      'Total',
      '%',
    ];

    const tableData = santriList.map((santriItem, idx) => {
      const row: any[] = [
        (idx + 1).toString(),
        santriItem.name,
        (santriItem as any).nisn || '-',
      ];

      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alfa = 0;

      meetings.forEach(meeting => {
        const status = attendanceMatrix[santriItem.id]?.[meeting.sesiId] || '-';
        row.push(status);
        if (status === 'H') hadir += 1;
        else if (status === 'I') izin += 1;
        else if (status === 'S') sakit += 1;
        else if (status === 'A') alfa += 1;
      });

      const total = meetings.length;
      const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

      row.push(
        hadir.toString(),
        izin.toString(),
        sakit.toString(),
        alfa.toString(),
        total.toString(),
        `${persentase}%`
      );

      return row;
    });

    autoTable(doc, {
      head: [headerRow],
      body: tableData,
      startY: 42,
      theme: 'grid',
      styles: {
        fontSize: meetings.length > 8 ? 7 : 8,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: meetings.length > 8 ? 32 : 45, halign: 'left' },
        2: { cellWidth: 20, halign: 'center' },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Halaman ${data.pageNumber}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 42;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Keterangan:', 14, finalY + 8);

    doc.setFont('helvetica', 'normal');
    doc.text('H = Hadir', 14, finalY + 13);
    doc.text('A = Alfa', 14, finalY + 18);
    doc.text('I = Izin', 14, finalY + 23);
    doc.text('S = Sakit', 14, finalY + 28);
    doc.text('- = Tidak Ada Absen', 14, finalY + 33);

    doc.save(`Rekap_Absensi_Tahfiz_${kelasData?.namaKelas || 'Kelas'}_${tahun}.pdf`);
  };

  const totalStats = useMemo(() => {
    return rekapData.reduce(
      (acc, item) => ({
        hadir: acc.hadir + item.hadir,
        izin: acc.izin + item.izin,
        sakit: acc.sakit + item.sakit,
        alfa: acc.alfa + item.alfa,
        total: acc.total + item.total,
      }),
      { hadir: 0, izin: 0, sakit: 0, alfa: 0, total: 0 }
    );
  }, [rekapData]);

  const formatTanggalShort = (tanggal: string) => {
    const date = new Date(tanggal);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const config: Record<AttendanceStatus, { bg: string; text: string; label: string }> = {
      H: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Hadir' },
      A: { bg: 'bg-red-100', text: 'text-red-700', label: 'Alfa' },
      I: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Izin' },
      S: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sakit' },
      '-': { bg: 'bg-slate-100', text: 'text-slate-400', label: 'Tidak Ada' },
    };

    const c = config[status];
    return (
      <div className={`inline-flex items-center justify-center min-w-10 px-2 py-1 rounded-md font-semibold text-xs border ${c.bg} ${c.text}`}>
        {status}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  Rekap Absensi Pertemuan Tahfiz
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {kelasData?.namaKelas || 'Kelas'} • {jadwal?.hari ? jadwal.hari.charAt(0).toUpperCase() + jadwal.hari.slice(1) : 'Hari'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportExcel}
                disabled={isExporting}
                variant="primary"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Download size={16} />
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </Button>
              <Button
                onClick={handlePrint}
                variant="secondary"
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              >
                <Printer size={16} />
                Print
              </Button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-200">
            <div className="space-y-2">
              <div className="flex items-center text-xs sm:text-sm">
                <Calendar size={14} className="mr-2 text-blue-600" />
                <span className="text-gray-600">Tahun:</span>
                <span className="ml-2 font-semibold text-gray-900">{tahun}</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm">
                <Users size={14} className="mr-2 text-blue-600" />
                <span className="text-gray-600">Total Santri:</span>
                <span className="ml-2 font-semibold text-gray-900">{santriList.length}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-xs sm:text-sm">
                <BookOpen size={14} className="mr-2 text-blue-600" />
                <span className="text-gray-600">Hari & Jam:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {jadwal
                    ? `${jadwal.hari.charAt(0).toUpperCase() + jadwal.hari.slice(1)}, ${jadwal.jamMulai} - ${jadwal.jamSelesai}`
                    : '-'}
                </span>
              </div>
              <div className="flex items-center text-xs sm:text-sm">
                <Calendar size={14} className="mr-2 text-blue-600" />
                <span className="text-gray-600">Total Pertemuan (Ditutup):</span>
                <span className="ml-2 font-semibold text-gray-900">{closedSessions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <div className="p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Hadir</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{totalStats.hadir}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <div className="p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Izin</p>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{totalStats.izin}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Sakit</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-700">{totalStats.sakit}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <div className="p-4">
            <p className="text-xs sm:text-sm text-slate-600 mb-1">Total Alfa</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-700">{totalStats.alfa}</p>
          </div>
        </Card>
      </div>

      {/* Rekap Table - Matrix per Pertemuan */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              Rekap Kehadiran Santri per Pertemuan
            </h4>
            <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-100 text-emerald-700 font-bold text-xs">H</span>
                <span className="text-gray-600">= Hadir</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 text-red-700 font-bold text-xs">A</span>
                <span className="text-gray-600">= Alfa</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-100 text-amber-700 font-bold text-xs">I</span>
                <span className="text-gray-600">= Izin</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 font-bold text-xs">S</span>
                <span className="text-gray-600">= Sakit</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-400 font-bold text-xs">-</span>
                <span className="text-gray-600">= Tidak Ada Absen</span>
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Table View */}
          <div className="hidden md:block overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-indigo-50 border-r border-gray-300">
                        No
                      </th>
                      <th className="sticky left-12 z-10 px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-indigo-50 border-r border-gray-300 min-w-[200px]">
                        Nama Santri
                      </th>
                      <th className="sticky left-[240px] z-10 px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-indigo-50 border-r border-gray-300 min-w-[140px]">
                        NISN
                      </th>

                      {meetings.map((meeting, idx) => (
                        <th
                          key={meeting.sesiId}
                          className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200"
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <span className="font-bold text-blue-600">{meeting.pertemuanKe}</span>
                            <span className="text-xs text-gray-600">
                              {formatTanggalShort(meeting.tanggal)}
                            </span>
                          </div>
                        </th>
                      ))}

                      {/* Statistik kehadiran per santri */}
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                        H
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                        I
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                        S
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                        A
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-l border-gray-200">
                        %
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {santriList.length === 0 ? (
                      <tr>
                        <td colSpan={3 + meetings.length + 6} className="px-6 py-12 text-center">
                          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500 font-medium text-lg">Tidak ada data santri</p>
                        </td>
                      </tr>
                    ) : (
                      santriList.map((santriItem, idx) => (
                        <tr key={santriItem.id} className="hover:bg-gray-50">
                          <td className="sticky left-0 z-10 px-4 py-4 bg-white border-r border-gray-300">
                            {idx + 1}
                          </td>
                          <td className="sticky left-12 z-10 px-6 py-4 bg-white border-r border-gray-300">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-bold text-gray-900">{santriItem.name}</p>
                                <p className="text-xs text-gray-500">{santriItem.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="sticky left-[240px] z-10 px-6 py-4 bg-white border-r border-gray-300">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                              {(santriItem as any).nisn || '-'}
                            </span>
                          </td>

                          {meetings.map(meeting => {
                            const status = attendanceMatrix[santriItem.id]?.[meeting.sesiId] || '-';
                            return (
                              <td key={meeting.sesiId} className="px-4 py-4 text-center border-l border-gray-200">
                                {getStatusBadge(status)}
                              </td>
                            );
                          })}

                          {(() => {
                            const stat = rekapData.find(r => r.santriId === santriItem.id);
                            if (!stat) return (
                              <>
                                <td className="px-4 py-4 text-center border-l border-gray-200">0</td>
                                <td className="px-4 py-4 text-center border-l border-gray-200">0</td>
                                <td className="px-4 py-4 text-center border-l border-gray-200">0</td>
                                <td className="px-4 py-4 text-center border-l border-gray-200">0</td>
                                <td className="px-4 py-4 text-center border-l border-gray-200">0</td>
                                <td className="px-4 py-4 text-center border-l border-gray-200">0%</td>
                              </>
                            );
                            return (
                              <>
                                <td className="px-4 py-4 text-center border-l border-gray-200 text-xs font-semibold text-emerald-700">
                                  {stat.hadir}
                                </td>
                                <td className="px-4 py-4 text-center border-l border-gray-200 text-xs font-semibold text-amber-700">
                                  {stat.izin}
                                </td>
                                <td className="px-4 py-4 text-center border-l border-gray-200 text-xs font-semibold text-blue-700">
                                  {stat.sakit}
                                </td>
                                <td className="px-4 py-4 text-center border-l border-gray-200 text-xs font-semibold text-red-700">
                                  {stat.alfa}
                                </td>
                                <td className="px-4 py-4 text-center border-l border-gray-200 text-xs font-semibold text-slate-900">
                                  {stat.total}
                                </td>
                                <td className="px-4 py-4 text-center border-l border-gray-200">
                                  <Badge
                                    variant={stat.persentase >= 75 ? 'success' : stat.persentase >= 50 ? 'warning' : 'error'}
                                    className="text-xs"
                                  >
                                    {stat.persentase}%
                                  </Badge>
                                </td>
                              </>
                            );
                          })()}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile: tetap gunakan rekap ringkas per santri */}
          <div className="md:hidden space-y-3 mt-4">
            {rekapData.map((item, index) => (
              <Card key={item.santriId} className="border border-slate-200">
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {item.santriName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{item.santriName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">#{index + 1}</p>
                    </div>
                    <Badge
                      variant={item.persentase >= 75 ? 'success' : item.persentase >= 50 ? 'warning' : 'error'}
                      className="text-xs"
                    >
                      {item.persentase}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200">
                    <div className="text-center">
                      <p className="text-xs text-slate-600 mb-1">Hadir</p>
                      <Badge variant="success" className="text-xs">
                        {item.hadir}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-600 mb-1">Izin</p>
                      <Badge variant="warning" className="text-xs">
                        {item.izin}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-600 mb-1">Sakit</p>
                      <Badge variant="info" className="text-xs">
                        {item.sakit}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-600 mb-1">Alfa</p>
                      <Badge variant="error" className="text-xs">
                        {item.alfa}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 text-center">
                    <p className="text-xs text-slate-600">
                      Total Pertemuan: <span className="font-semibold">{item.total}</span>
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RekapAbsenTahfizView;

