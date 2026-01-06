import { exportToExcel } from '../../../../../../utils/exportUtils';
import { KelulusanDataItem } from './InfoKelulusanUtils';
import { Kelas, PengumumanKelulusan, User } from '../../../../../../types';

export const exportKelulusanKelas = (
  kelulusanData: KelulusanDataItem[],
  myKelas: Kelas | undefined,
  activePengumuman: PengumumanKelulusan,
  user: User | undefined
) => {
  const data = kelulusanData.map((item, index) => ({
    peringkat: index + 1,
    nisn: item.murid.nisn,
    nama: item.murid.name,
    kelas: myKelas?.name,
    rataRataNilai: item.nilaiAkhir.toFixed(1),
    tingkatKehadiran: `${item.kehadiran.toFixed(1)}%`,
    statusKelulusan: item.isLulus ? 'LULUS' : 'TIDAK LULUS',
    keterangan: item.isLulus ?
      'Memenuhi syarat kelulusan' :
      `${item.nilaiAkhir < 70 ? 'Nilai kurang' : ''}${item.nilaiAkhir < 70 && item.kehadiran < 75 ? ' & ' : ''}${item.kehadiran < 75 ? 'Kehadiran kurang' : ''}`
  }));

  const columns = [
    { header: 'Peringkat', dataKey: 'peringkat', width: 10 },
    { header: 'NISN', dataKey: 'nisn', width: 15 },
    { header: 'Nama', dataKey: 'nama', width: 25 },
    { header: 'Kelas', dataKey: 'kelas', width: 15 },
    { header: 'Rata-rata Nilai', dataKey: 'rataRataNilai', width: 15 },
    { header: 'Tingkat Kehadiran', dataKey: 'tingkatKehadiran', width: 18 },
    { header: 'Status Kelulusan', dataKey: 'statusKelulusan', width: 15 },
    { header: 'Keterangan', dataKey: 'keterangan', width: 25 }
  ];

  const title = `INFO KELULUSAN KELAS\nKelas: ${myKelas?.name}\nTahun Ajaran: ${activePengumuman.tahunAjaran}\nWali Kelas: ${user?.name}`;
  const filename = `kelulusan-${myKelas?.name}-${new Date().toISOString().split('T')[0]}`;

  exportToExcel(data, columns, title, filename);
};
