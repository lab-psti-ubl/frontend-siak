import { RiwayatWaliKelas, Alumni } from '../../../../../types';
import { exportToExcel, formatDateID } from '../../../../../utils/exportUtils';

export const exportRiwayatData = (
  riwayat: RiwayatWaliKelas,
  alumniData: Alumni[],
  userName: string
) => {
  const data = alumniData.map((alumniItem) => ({
    peringkatKelas: alumniItem.peringkatKelas,
    peringkatSekolah: alumniItem.peringkatSekolah,
    nisn: alumniItem.nisn,
    nama: alumniItem.nama,
    kelas: alumniItem.namaKelas,
    jurusan: alumniItem.namaJurusan,
    rataRataNilai: alumniItem.nilaiAkhir.toFixed(1),
    tingkatKehadiran: `${alumniItem.tingkatKehadiran.toFixed(1)}%`,
    tanggalLulus: formatDateID(alumniItem.tanggalLulus),
    status: 'LULUS'
  }));

  const columns = [
    { header: 'Peringkat Kelas', dataKey: 'peringkatKelas', width: 15 },
    { header: 'Peringkat Sekolah', dataKey: 'peringkatSekolah', width: 15 },
    { header: 'NISN', dataKey: 'nisn', width: 15 },
    { header: 'Nama', dataKey: 'nama', width: 25 },
    { header: 'Kelas', dataKey: 'kelas', width: 15 },
    { header: 'Jurusan', dataKey: 'jurusan', width: 20 },
    { header: 'Rata-rata Nilai', dataKey: 'rataRataNilai', width: 15 },
    { header: 'Tingkat Kehadiran', dataKey: 'tingkatKehadiran', width: 18 },
    { header: 'Tanggal Lulus', dataKey: 'tanggalLulus', width: 15 },
    { header: 'Status', dataKey: 'status', width: 10 }
  ];

  const title = `RIWAYAT KELULUSAN\nKelas: ${riwayat.namaKelas}\nTahun Ajaran: ${riwayat.tahunAjaran}\nWali Kelas: ${userName}`;
  const filename = `riwayat-kelulusan-${riwayat.namaKelas.replace(/\s+/g, '-')}-${riwayat.tahunAjaran.replace('/', '-')}`;

  exportToExcel(data, columns, title, filename);
};
