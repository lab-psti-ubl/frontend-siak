import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { User, Absensi, SesiAbsensi } from '../../../../../../../types';

interface AbsenHarianData {
  murid: User;
  masukStatus?: string;
  masukWaktu?: string;
  pulangStatus?: string;
  pulangWaktu?: string;
  keterangan: string;
}

const getStatusLabel = (status: string | undefined): string => {
  if (!status) return '-';
  // Status sudah dalam bentuk display status (Hadir, Terlambat, Pulang Cepat, Izin, Sakit, Alfa)
  // Jadi kita bisa langsung return status tersebut
  return status;
};

export const generateAbsenHarianPDF = (
  data: AbsenHarianData[],
  namaKelas: string,
  waliKelasName: string,
  tanggal: string,
  hari: string
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = margin;

  const dateObj = new Date(tanggal);
  const tanggalFormatted = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.setFontSize(14);
  doc.text('REKAP ABSENSI HARIAN SISWA', pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(10);
  doc.text(`Kelas: ${namaKelas}`, margin, y);
  y += 4;
  doc.text(`Wali Kelas: ${waliKelasName}`, margin, y);
  y += 4;
  doc.text(`Tanggal: ${tanggalFormatted}`, margin, y);
  y += 6;

  doc.setFontSize(9);
  const tableData: any[] = [];

  data.forEach((item, index) => {
    tableData.push([
      index + 1,
      item.murid.name,
      item.murid.nisn || '-',
      getStatusLabel(item.masukStatus),
      item.masukWaktu || '-',
      getStatusLabel(item.pulangStatus),
      item.pulangWaktu || '-',
      item.keterangan
    ]);
  });

  (doc as any).autoTable({
    head: [['No', 'Nama Murid', 'NISN', 'Absen Masuk', 'Waktu Masuk', 'Absen Pulang', 'Waktu Pulang', 'Keterangan']],
    body: tableData,
    startY: y,
    margin: margin,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'center', cellWidth: 25 },
      6: { halign: 'center', cellWidth: 25 },
      7: { halign: 'center', cellWidth: 26 },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  const fileName = `Absen_Harian_${namaKelas}_${tanggalFormatted.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

export const generateAbsenHarianExcel = (
  data: AbsenHarianData[],
  namaKelas: string,
  waliKelasName: string,
  tanggal: string,
  hari: string
) => {
  const dateObj = new Date(tanggal);
  const tanggalFormatted = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const wb = XLSX.utils.book_new();
  const wsData: any[] = [];

  wsData.push(['REKAP ABSENSI HARIAN SISWA']);
  wsData.push([]);
  wsData.push([`Kelas: ${namaKelas}`]);
  wsData.push([`Wali Kelas: ${waliKelasName}`]);
  wsData.push([`Tanggal: ${tanggalFormatted}`]);
  wsData.push([`Hari: ${hari.charAt(0).toUpperCase() + hari.slice(1)}`]);
  wsData.push([]);

  const headers = ['No', 'Nama Murid', 'NISN', 'Absen Masuk', 'Waktu Masuk', 'Absen Pulang', 'Waktu Pulang', 'Keterangan'];
  wsData.push(headers);

  data.forEach((item, index) => {
    wsData.push([
      index + 1,
      item.murid.name,
      item.murid.nisn || '-',
      getStatusLabel(item.masukStatus),
      item.masukWaktu || '-',
      getStatusLabel(item.pulangStatus),
      item.pulangWaktu || '-',
      item.keterangan
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths: XLSX.ColInfo[] = [
    { wch: 4 },
    { wch: 25 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 }
  ];

  ws['!cols'] = colWidths;

  const headerRowIndex = 8;
  for (let i = 0; i < headers.length; i++) {
    const cellRef = XLSX.utils.encode_col(i) + (headerRowIndex + 1);
    if (!ws[cellRef]) ws[cellRef] = {};
    if (!ws[cellRef].s) ws[cellRef].s = {};
    ws[cellRef].s.fill = { type: 'solid', fgColor: { rgb: 'FF3B82F6' } };
    ws[cellRef].s.font = { bold: true, color: { rgb: 'FFFFFFFF' } };
    ws[cellRef].s.alignment = { horizontal: 'center', vertical: 'center' };
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Absen Harian');
  const fileName = `Absen_Harian_${namaKelas}_${tanggalFormatted.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
