import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SpmbRegistration } from '../types';
import { getActiveJenjangSync } from './jenjangPendidikanUtils';

type ExportContext = {
  title: string;
  subtitle?: string;
};

const checkbox = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim() !== '' ? '✓' : '';
};

const mapRegistrationsToRows = (registrations: SpmbRegistration[]) =>
  registrations.map((reg, index) => ({
    No: index + 1,
    ID: reg.id,
    'ID Pembukaan': reg.openingId,
    'Tanggal Daftar': reg.createdAt ? new Date(reg.createdAt).toLocaleString('id-ID') : '',
    'Tahun Ajaran': reg.tahunAjaran,
    'Nama Lengkap': reg.namaLengkap,
    'Jenis Kelamin': reg.jenisKelamin === 'L' ? 'Laki-laki' : reg.jenisKelamin === 'P' ? 'Perempuan' : '',
    Umur: reg.umur ?? '',
    NISN: reg.nisn ?? '',
    Email: reg.email ?? '',
    'WA Ortu (Utama)': reg.noWhatsappOrtu,
    'No HP Ortu': reg.noHpOrangTua ?? '',
    'Nama Orang Tua/Wali': reg.namaOrangTua ?? '',
    'NIK Orang Tua/Wali': reg.nikOrangTua ?? '',
    'Pekerjaan Orang Tua/Wali': reg.pekerjaanOrangTua ?? '',
    'Asal Sekolah': reg.asalSekolah,
    Alamat: reg.alamat,
    'NIK Anak': reg.nikAnak ?? '',
    'Nomor KK': reg.nomorKk ?? '',
    'Tempat Lahir': reg.tempatLahir ?? '',
    'Tanggal Lahir': reg.tanggalLahir ?? '',
    'Pilihan Jurusan': reg.pilihanJurusan ?? '',
    'Rata-rata Nilai Rapor': reg.ringkasanNilaiRapor ?? '',
    'Dokumen KK': checkbox(reg.dokumenKk),
    'Dokumen Akta Kelahiran': checkbox(reg.dokumenAktaKelahiran),
    'Dokumen KTP Orang Tua/Wali': checkbox(reg.dokumenKtpOrangTua),
    'Dokumen Kartu Imunisasi': checkbox(reg.dokumenKartuImunisasi),
    'Dokumen Pas Foto': checkbox(reg.dokumenPasFoto),
    'Dokumen Ijazah / SKL': checkbox(reg.dokumenIjazahAtauSkL),
    'Dokumen Rapor': checkbox(reg.dokumenRapor),
    'Dokumen KIP': checkbox(reg.dokumenKip),
    'Dokumen Sertifikat Prestasi': checkbox(reg.dokumenSertifikatPrestasi),
    'Dokumen Surat Keterangan Sehat': checkbox(reg.dokumenSuratKeteranganSehat),
    'Sudah Masuk Kelas': reg.assignedToClass ? '✓' : '',
    'ID Kelas': reg.assignedClassId ?? '',
    Status:
      reg.status === 'pending'
        ? 'Menunggu'
        : reg.status === 'diterima'
        ? 'Diterima'
        : reg.status === 'ditolak'
        ? 'Ditolak'
        : '',
  }));

type Row = Record<string, unknown>;

const filterRowsByJenjang = (
  rows: Row[],
  jenjang: 'SD' | 'SMP' | 'SMA/SMK' | null
) => {
  return rows.map(row => {
    const filtered: Row = { ...row };

    // Hilangkan kolom jurusan untuk jenjang selain SMA/SMK
    if (jenjang !== 'SMA/SMK') {
      delete filtered['Pilihan Jurusan'];
    }

    // Filter kolom dokumen sesuai jenjang
    if (jenjang === 'SD') {
      // SD: tidak perlu ijazah/rapor/KIP/sertifikat/surat sehat
      delete filtered['Dokumen Ijazah / SKL'];
      delete filtered['Dokumen Rapor'];
      delete filtered['Dokumen KIP'];
      delete filtered['Dokumen Sertifikat Prestasi'];
      delete filtered['Dokumen Surat Keterangan Sehat'];
    } else if (jenjang === 'SMP') {
      // SMP: tidak ada imunisasi, tidak ada surat sehat
      delete filtered['Dokumen Kartu Imunisasi'];
      delete filtered['Dokumen Surat Keterangan Sehat'];
    } else if (jenjang === 'SMA/SMK') {
      // SMA/SMK: tidak ada imunisasi
      delete filtered['Dokumen Kartu Imunisasi'];
    }

    return filtered;
  });
};

export const exportSpmbRegistrationsToExcel = (
  filename: string,
  registrations: SpmbRegistration[]
) => {
  if (!registrations || registrations.length === 0) return;

  const rows: Row[] = mapRegistrationsToRows(registrations);
  const jenjang = getActiveJenjangSync();
  const rowsForExport = filterRowsByJenjang(rows, jenjang);

  const worksheet = XLSX.utils.json_to_sheet(rowsForExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, filename);
};

export const exportSpmbRegistrationsToPdf = (
  filename: string,
  registrations: SpmbRegistration[],
  context: ExportContext
) => {
  if (!registrations || registrations.length === 0) return;

  const rows: Row[] = mapRegistrationsToRows(registrations);
  const jenjang = getActiveJenjangSync();
  const rowsForExport = filterRowsByJenjang(rows, jenjang);
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(14);
  doc.text(context.title, 14, 15);

  if (context.subtitle) {
    doc.setFontSize(10);
    doc.text(context.subtitle, 14, 22);
  }

  const headers = Object.keys(rowsForExport[0]);
  const body = rowsForExport.map(row => headers.map(h => (row as any)[h] ?? ''));

  (autoTable as any)(doc, {
    head: [headers],
    body,
    startY: context.subtitle ? 26 : 20,
    styles: {
      fontSize: 8,
    },
    headStyles: {
      fillColor: [25, 118, 210],
    },
  });

  doc.save(filename);
};

