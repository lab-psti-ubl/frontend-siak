import { RiwayatKelasMurid, User } from '../types';

export const getMuridByKelasAndTahunAjaran = (
  kelasId: string,
  tahunAjaranId: string,
  users: User[],
  riwayatKelasMurid: RiwayatKelasMurid[]
): User[] => {
  const muridIdsInKelas = riwayatKelasMurid
    .filter(r => r.kelasId === kelasId && r.tahunAjaran === tahunAjaranId)
    .map(r => r.muridId);

  if (muridIdsInKelas.length === 0) {
    return users.filter(u => u.role === 'murid' && u.kelasId === kelasId);
  }

  return users.filter(u =>
    u.role === 'murid' && muridIdsInKelas.includes(u.id)
  );
};

export const ensureRiwayatKelasMurid = (
  muridId: string,
  kelasId: string,
  tahunAjaranId: string,
  semester: number,
  riwayatKelasMurid: RiwayatKelasMurid[]
): RiwayatKelasMurid[] => {
  const existingRiwayat = riwayatKelasMurid.find(
    r => r.muridId === muridId &&
         r.kelasId === kelasId &&
         r.tahunAjaran === tahunAjaranId &&
         r.semester === semester
  );

  if (existingRiwayat) {
    return riwayatKelasMurid;
  }

  const newRiwayat: RiwayatKelasMurid = {
    id: `riwayat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    muridId,
    kelasId,
    tahunAjaran: tahunAjaranId,
    semester,
    status: 'aktif',
    createdAt: new Date().toISOString()
  };

  return [...riwayatKelasMurid, newRiwayat];
};

export const ensureMultipleRiwayatKelasMurid = (
  muridIds: string[],
  kelasId: string,
  tahunAjaranId: string,
  semester: number,
  riwayatKelasMurid: RiwayatKelasMurid[]
): RiwayatKelasMurid[] => {
  let updatedRiwayat = [...riwayatKelasMurid];

  muridIds.forEach(muridId => {
    const existingRiwayat = updatedRiwayat.find(
      r => r.muridId === muridId &&
           r.kelasId === kelasId &&
           r.tahunAjaran === tahunAjaranId &&
           r.semester === semester
    );

    if (!existingRiwayat) {
      const newRiwayat: RiwayatKelasMurid = {
        id: `riwayat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId,
        kelasId,
        tahunAjaran: tahunAjaranId,
        semester,
        status: 'aktif',
        createdAt: new Date().toISOString()
      };
      updatedRiwayat.push(newRiwayat);
    }
  });

  return updatedRiwayat;
};

export const getKelasIdByMuridAndTahunAjaran = (
  muridId: string,
  tahunAjaranId: string,
  riwayatKelasMurid: RiwayatKelasMurid[],
  currentKelasId: string,
  nilai?: any[]
): string => {
  // Cari dari riwayat kelas terlebih dahulu
  const riwayat = riwayatKelasMurid.find(
    r => r.muridId === muridId && r.tahunAjaran === tahunAjaranId
  );

  if (riwayat) {
    return riwayat.kelasId;
  }

  // Jika tidak ada di riwayat, cari dari data nilai
  if (nilai && nilai.length > 0) {
    const nilaiMurid = nilai.find(n =>
      n.muridId === muridId && n.tahunAjaran === tahunAjaranId
    );
    
    if (nilaiMurid) {
      return nilaiMurid.kelasId;
    }
  }

  // Fallback ke kelas saat ini
  return currentKelasId;
};

export const syncRiwayatKelasMuridFromNilai = (
  nilai: any[],
  riwayatKelasMurid: RiwayatKelasMurid[]
): RiwayatKelasMurid[] => {
  const updatedRiwayat = [...riwayatKelasMurid];
  const existingEntries = new Set(
    riwayatKelasMurid.map(r => `${r.muridId}-${r.kelasId}-${r.tahunAjaran}-${r.semester}`)
  );

  nilai.forEach(n => {
    const key = `${n.muridId}-${n.kelasId}-${n.tahunAjaran}-${n.semester}`;

    if (!existingEntries.has(key)) {
      const newRiwayat: RiwayatKelasMurid = {
        id: `riwayat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId: n.muridId,
        kelasId: n.kelasId,
        tahunAjaran: n.tahunAjaran,
        semester: n.semester,
        status: 'aktif',
        createdAt: new Date().toISOString()
      };
      updatedRiwayat.push(newRiwayat);
      existingEntries.add(key);
    }
  });

  return updatedRiwayat;
};

export const ensureRiwayatKelasMuridFromNilai = (
  muridIds: string[],
  kelasId: string,
  tahunAjaranId: string,
  semester: number,
  riwayatKelasMurid: RiwayatKelasMurid[]
): RiwayatKelasMurid[] => {
  let updatedRiwayat = [...riwayatKelasMurid];

  muridIds.forEach(muridId => {
    const existingRiwayat = updatedRiwayat.find(
      r => r.muridId === muridId &&
           r.kelasId === kelasId &&
           r.tahunAjaran === tahunAjaranId &&
           r.semester === semester
    );

    if (!existingRiwayat) {
      const newRiwayat: RiwayatKelasMurid = {
        id: `riwayat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        muridId,
        kelasId,
        tahunAjaran: tahunAjaranId,
        semester,
        status: 'aktif',
        createdAt: new Date().toISOString()
      };
      updatedRiwayat.push(newRiwayat);
    }
  });

  return updatedRiwayat;
};
