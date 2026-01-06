import { exportToExcel, formatDateID } from '../../../../../utils/exportUtils';
import { Alumni, ProfilSekolah } from '../../../../../types';
import { shouldShowJurusanSync } from '../../../../../utils/jenjangPendidikanUtils';

interface AlumniExportFilters {
  searchTerm: string;
  tahunLulusFilter: string;
  jurusanFilter: string;
  kelasFilter: string;
}

export const exportAlumniData = (alumni: Alumni[], filters: AlumniExportFilters, profilSekolah?: ProfilSekolah | null) => {
  const schoolName = profilSekolah?.namaSekolah || 'Sekolah';
  const showJurusan = shouldShowJurusanSync();

  const data = alumni.map((alumniItem) => {
    const baseData: any = {
      peringkatSekolah: alumniItem.peringkatSekolah,
      peringkatKelas: alumniItem.peringkatKelas,
      nisn: alumniItem.nisn,
      nama: alumniItem.nama,
      kelas: alumniItem.namaKelas,
    };

    if (showJurusan) {
      baseData.jurusan = alumniItem.namaJurusan || '-';
    }

    return {
      ...baseData,
      tahunLulus: alumniItem.tahunLulus,
      rataRataNilai: alumniItem.nilaiAkhir.toFixed(1),
      tingkatKehadiran: `${alumniItem.tingkatKehadiran.toFixed(1)}%`,
      tanggalLulus: formatDateID(alumniItem.tanggalLulus),
      waliKelas: alumniItem.namaWaliKelasSebelumnya || '-',
      nipWaliKelas: alumniItem.nipWaliKelasSebelumnya || '-'
    };
  });

  const baseColumns = [
    { header: 'Peringkat Sekolah', dataKey: 'peringkatSekolah', width: 15 },
    { header: 'Peringkat Kelas', dataKey: 'peringkatKelas', width: 15 },
    { header: 'NISN', dataKey: 'nisn', width: 15 },
    { header: 'Nama', dataKey: 'nama', width: 25 },
    { header: 'Kelas', dataKey: 'kelas', width: 15 }
  ];

  const jurusanColumn = showJurusan ? [{ header: 'Jurusan', dataKey: 'jurusan', width: 20 }] : [];

  const endColumns = [
    { header: 'Tahun Lulus', dataKey: 'tahunLulus', width: 12 },
    { header: 'Rata-rata Nilai', dataKey: 'rataRataNilai', width: 15 },
    { header: 'Tingkat Kehadiran', dataKey: 'tingkatKehadiran', width: 18 },
    { header: 'Tanggal Lulus', dataKey: 'tanggalLulus', width: 15 },
    { header: 'Wali Kelas', dataKey: 'waliKelas', width: 20 },
    { header: 'NIP Wali Kelas', dataKey: 'nipWaliKelas', width: 18 }
  ];

  const columns = [...baseColumns, ...jurusanColumn, ...endColumns];

  let title = `DATA ALUMNI ${schoolName.toUpperCase()}`;

  if (filters.tahunLulusFilter) {
    title += `\nAngkatan: ${filters.tahunLulusFilter}`;
  }
  if (filters.jurusanFilter) {
    title += `\nJurusan: ${filters.jurusanFilter}`;
  }
  if (filters.kelasFilter) {
    title += `\nKelas: ${filters.kelasFilter}`;
  }
  if (filters.searchTerm) {
    title += `\nPencarian: ${filters.searchTerm}`;
  }

  const filename = `data-alumni-${new Date().toISOString().split('T')[0]}`;

  exportToExcel(data, columns, title, filename);
};