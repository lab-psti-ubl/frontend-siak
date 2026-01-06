import { User, Absensi, SesiAbsensi, TahunAjaran, PengaturanAbsen } from '../../../../../../../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { determineKeterangan } from '../../../../../../../utils/absenValidationUtils';

interface RekapSemesterData {
  murid: User;
  totalHadir: number;
  totalIzin: number;
  totalSakit: number;
  totalAlfa: number;
  totalBolos: number;
  totalDispen: number;
}

const getStatusCode = (status: string): string => {
  const statusMap: Record<string, string> = {
    hadir: 'H',
    izin: 'I',
    sakit: 'S',
    alfa: 'A',
    bolos: 'B',
    dispen: 'D',
  };
  return statusMap[status] || '-';
};

export const getSemesterDateRange = (tahunAjaran: string, semester: number, tahunAjaranData?: TahunAjaran[]): { startDate: Date; endDate: Date } => {
  if (tahunAjaranData) {
    const taData = tahunAjaranData.find(ta => ta.tahun === tahunAjaran && ta.semester === semester);
    if (taData) {
      return {
        startDate: new Date(taData.tanggalMulai),
        endDate: new Date(taData.tanggalSelesai)
      };
    }
  }

  const tahun = parseInt(tahunAjaran.split('/')[0]);

  if (semester === 1) {
    return {
      startDate: new Date(tahun, 6, 1),
      endDate: new Date(tahun, 11, 31)
    };
  } else {
    return {
      startDate: new Date(tahun + 1, 0, 1),
      endDate: new Date(tahun + 1, 5, 30)
    };
  }
};

export const getSemestersForTahunAjaran = (
  tahunAjaran: string,
  tahunAjaranData: TahunAjaran[]
): number[] => {
  const semesters = tahunAjaranData
    .filter(ta => ta.tahun === tahunAjaran)
    .map(ta => ta.semester)
    .sort();

  return semesters.length > 0 ? semesters : [1, 2];
};

export const getRekapSemesterData = (
  muridKelas: User[],
  sesiAbsensi: SesiAbsensi[],
  absensi: Absensi[],
  tahunAjaran: string,
  semester: number,
  tahunAjaranData?: TahunAjaran[],
  pengaturanAbsen?: PengaturanAbsen[]
): RekapSemesterData[] => {
  const { startDate, endDate } = getSemesterDateRange(tahunAjaran, semester, tahunAjaranData);

  const filteredAbsensi = absensi.filter(a => {
    const absenDate = new Date(a.tanggal || a.waktu);
    return absenDate >= startDate && absenDate <= endDate;
  });

  const activePengaturanAbsen = pengaturanAbsen?.find(p => p.isActive);

  return muridKelas.map((murid) => {
    let totalHadir = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalAlfa = 0;
    let totalBolos = 0;
    let totalDispen = 0;

    const muridAbsensi = filteredAbsensi.filter(a => a.muridId === murid.id);

    // Group by tanggal (new structure: one record per day)
    const absensiByDate: Record<string, { masuk?: Absensi; pulang?: Absensi }> = {};

    muridAbsensi.forEach(abs => {
      const dateKey = abs.tanggal || (abs.waktu ? abs.waktu.split('T')[0] : '');
      if (!dateKey) return;

      if (!absensiByDate[dateKey]) {
        absensiByDate[dateKey] = {};
      }

      // New structure: one record contains both masuk and pulang
      if (abs.jamMasuk || abs.statusMasuk) {
        absensiByDate[dateKey].masuk = {
          ...abs,
          tipeAbsen: 'masuk',
          waktu: abs.jamMasuk || abs.waktu || '',
          status: abs.statusMasuk === 'izin' ? 'izin' :
                  abs.statusMasuk === 'sakit' ? 'sakit' :
                  abs.statusMasuk === 'alfa' ? 'alfa' :
                  abs.statusMasuk === 'terlambat' ? 'terlambat' : 'hadir',
        };
      }

      if (abs.jamKeluar || abs.statusKeluar) {
        absensiByDate[dateKey].pulang = {
          ...abs,
          tipeAbsen: 'pulang',
          waktu: abs.jamKeluar || abs.waktu || '',
          status: abs.statusKeluar === 'izin' ? 'izin' :
                  abs.statusKeluar === 'sakit' ? 'sakit' :
                  abs.statusKeluar === 'alfa' ? 'alfa' :
                  abs.statusKeluar === 'pulang_awal' ? 'pulang_cepat' : 'hadir',
        };
      }

      // Backward compatibility: old structure (separate records)
      if (abs.tipeAbsen === 'masuk') {
        absensiByDate[dateKey].masuk = abs;
      } else if (abs.tipeAbsen === 'pulang') {
        absensiByDate[dateKey].pulang = abs;
      }
    });

    // Count only one record per day using determineKeterangan
    Object.values(absensiByDate).forEach(dayAbsensi => {
      const masukAbsensi = dayAbsensi.masuk || null;
      const pulangAbsensi = dayAbsensi.pulang || null;

      // Gunakan determineKeterangan untuk mendapatkan status berdasarkan kombinasi masuk dan pulang
      const keteranganResult = determineKeterangan(masukAbsensi, pulangAbsensi, activePengaturanAbsen);

      // Hitung total berdasarkan keterangan, bukan status absen masuk/pulang
      if (keteranganResult.keterangan === 'Hadir') totalHadir++;
      else if (keteranganResult.keterangan === 'Izin') totalIzin++;
      else if (keteranganResult.keterangan === 'Sakit') totalSakit++;
      else if (keteranganResult.keterangan === 'Alfa') totalAlfa++;
      else if (keteranganResult.keterangan === 'Bolos') totalBolos++;
      else if (keteranganResult.keterangan === 'Dispen') totalDispen++;
    });

    return {
      murid,
      totalHadir,
      totalIzin,
      totalSakit,
      totalAlfa,
      totalBolos,
      totalDispen,
    };
  });
};

export const generateRekapSemesterPDF = (
  data: RekapSemesterData[],
  namaKelas: string,
  tahunAjaran: string,
  semester: number,
  waliKelasName: string,
  tanggalMulai?: string,
  tanggalSelesai?: string
) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  const semesterLabel = semester === 1 ? 'Ganjil' : 'Genap';

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  doc.setFontSize(16);
  doc.text('REKAP ABSENSI SEMESTER', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`Kelas: ${namaKelas}`, 20, 30);
  doc.text(`Tahun Ajaran: ${tahunAjaran}`, 20, 37);
  doc.text(`Semester: ${semesterLabel}`, 20, 44);
  doc.text(`Periode: ${formatDate(tanggalMulai)} s/d ${formatDate(tanggalSelesai)}`, 20, 51);
  doc.text(`Wali Kelas: ${waliKelasName}`, 20, 58);

  const tableData = data.map((d, idx) => [
    idx + 1,
    d.murid.name || '-',
    d.murid.nisn || '-',
    d.totalHadir,
    d.totalIzin,
    d.totalSakit,
    d.totalAlfa,
    d.totalBolos,
    d.totalDispen,
  ]);

  (doc as any).autoTable({
    head: [['No', 'Nama Murid', 'NISN', 'Hadir', 'Izin', 'Sakit', 'Alfa', 'Bolos', 'Dispen']],
    body: tableData,
    startY: 67,
    margin: { left: 15, right: 15 },
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'center', cellWidth: 55 },
      3: { halign: 'center', cellWidth: 20, fillColor: [220, 237, 200] },
      4: { halign: 'center', cellWidth: 15, fillColor: [255, 243, 224] },
      5: { halign: 'center', cellWidth: 15, fillColor: [227, 242, 253] },
      6: { halign: 'center', cellWidth: 15, fillColor: [255, 205, 210] },
      7: { halign: 'center', cellWidth: 15, fillColor: [255, 224, 178] },
      8: { halign: 'center', cellWidth: 15, fillColor: [243, 229, 245] },
    },
  });

  const filename = `Rekap_Absensi_${namaKelas}_Semester_${semesterLabel}_${tahunAjaran}.pdf`;
  doc.save(filename);
};

export const generateRekapSemesterExcel = (
  data: RekapSemesterData[],
  namaKelas: string,
  tahunAjaran: string,
  semester: number,
  waliKelasName: string,
  tanggalMulai?: string,
  tanggalSelesai?: string
) => {
  const semesterLabel = semester === 1 ? 'Ganjil' : 'Genap';

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const excelData = [
    ['REKAP ABSENSI SEMESTER'],
    [],
    ['Kelas:', namaKelas],
    ['Tahun Ajaran:', tahunAjaran],
    ['Semester:', semesterLabel],
    ['Periode:', `${formatDate(tanggalMulai)} s/d ${formatDate(tanggalSelesai)}`],
    ['Wali Kelas:', waliKelasName],
    [],
    ['No', 'Nama Murid', 'NISN', 'H', 'I', 'S', 'A', 'B', 'D'],
    ...data.map((d, idx) => [
      idx + 1,
      d.murid.name || '-',
      d.murid.nisn || '-',
      d.totalHadir,
      d.totalIzin,
      d.totalSakit,
      d.totalAlfa,
      d.totalBolos,
      d.totalDispen,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(excelData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 15 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Semester');

  const filename = `Rekap_Absensi_${namaKelas}_Semester_${semesterLabel}_${tahunAjaran}.xlsx`;
  XLSX.writeFile(wb, filename);
};
