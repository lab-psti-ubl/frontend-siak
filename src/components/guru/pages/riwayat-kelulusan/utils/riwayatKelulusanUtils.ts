import { RiwayatWaliKelas, Alumni, User, Murid } from '../../../../../types';

export const getTotalStats = (myRiwayat: RiwayatWaliKelas[]) => {
  return myRiwayat.reduce((acc, riwayat) => {
    acc.totalKelas++;
    acc.totalMuridLulus += riwayat.jumlahMuridLulus;
    acc.totalMuridTidakLulus += riwayat.jumlahMuridTidakLulus;
    return acc;
  }, {
    totalKelas: 0,
    totalMuridLulus: 0,
    totalMuridTidakLulus: 0
  });
};

export const getAlumniForRiwayat = (
  riwayat: RiwayatWaliKelas,
  alumni: Alumni[],
  userId: string
) => {
  return alumni.filter(a =>
    a.kelasId === riwayat.kelasId &&
    a.tahunLulus === riwayat.tahunAjaran &&
    a.waliKelasSebelumnya === userId
  ).sort((a, b) => a.peringkatKelas - b.peringkatKelas);
};

export const calculatePersentaseKelulusan = (jumlahLulus: number, jumlahTidakLulus: number): string => {
  const total = jumlahLulus + jumlahTidakLulus;
  return total > 0 ? ((jumlahLulus / total) * 100).toFixed(1) : '0';
};

export const findOriginalMurid = (alumniItem: Alumni, users: User[]): Murid => {
  const foundUser = users.find(u => u.id === alumniItem.muridId);

  if (foundUser && foundUser.role === 'murid') {
    return foundUser as Murid;
  }

  return {
    id: alumniItem.muridId,
    name: alumniItem.nama,
    nisn: alumniItem.nisn,
    kelasId: alumniItem.kelasId,
    role: 'murid' as const,
    email: `${alumniItem.nisn}@alumni.school.id`,
    password: '',
    qrCode: '',
    createdAt: alumniItem.tanggalLulus,
    isActive: false
  };
};
