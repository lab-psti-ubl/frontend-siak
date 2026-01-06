import { User, Kelas, TahunAjaran, RiwayatKelasMurid, Nilai } from '../../../../types';
import { generateRaportData } from '../../../../utils/raport';
import { getKelasIdByMuridAndTahunAjaran } from '../../../../utils/riwayatKelasMuridUtils';

export const getKelasForTahunAjaran = (
  currentKelasId: string,
  targetTahunAjaran: string,
  activeTahunAjaran: TahunAjaran | undefined,
  kelas: Kelas[],
  muridId?: string,
  riwayatKelasMurid?: RiwayatKelasMurid[],
  nilai?: Nilai[]
) => {
  const currentKelas = kelas.find(k => k.id === currentKelasId);
  if (!currentKelas) return null;

  if (targetTahunAjaran === activeTahunAjaran?.tahun) {
    return currentKelas;
  }

  if (muridId && riwayatKelasMurid) {
    // Pass nilai data as fallback to getKelasIdByMuridAndTahunAjaran
    const historicalKelasId = getKelasIdByMuridAndTahunAjaran(
      muridId,
      targetTahunAjaran,
      riwayatKelasMurid,
      currentKelasId,
      nilai
    );
    const kelasFromRiwayat = kelas.find(k => k.id === historicalKelasId);
    if (kelasFromRiwayat) {
      return kelasFromRiwayat;
    }
  }

  return null;
};

export const generateMuridTerbaikData = (
  users: User[],
  targetKelas: any,
  selectedSemester: number,
  selectedTahunAjaran: string,
  allUsers: User[],
  kelas: Kelas[],
  jurusan: any[],
  nilai: any[],
  mataPelajaran: any[],
  tahunAjaran: TahunAjaran[],
  jadwalPelajaran: any[],
  absensi: any[],
  sesiAbsensi: any[],
  activeTahunAjaran?: TahunAjaran
) => {
  if (!targetKelas) return [];

  // Untuk periode aktif, gunakan data kelas saat ini
  // Untuk periode historis, gunakan data nilai untuk menemukan semua murid yang ada di kelas tersebut
  let muridIds: Set<string>;
  
  if (selectedTahunAjaran === activeTahunAjaran?.tahun) {
    // Periode aktif: gunakan kelasId saat ini
    muridIds = new Set(
      users
        .filter(u => u.role === 'murid' && u.kelasId === targetKelas.id && u.isActive !== false)
        .map(u => u.id)
    );
  } else {
    // Periode historis: gunakan data nilai untuk menemukan murid yang ada di kelas tersebut
    // Cari dari semester yang dipilih terlebih dahulu
    let nilaiFiltered = nilai.filter(n => 
      n.kelasId === targetKelas.id && 
      n.tahunAjaran === selectedTahunAjaran &&
      n.semester === selectedSemester
    );

    // Jika tidak ada data untuk semester yang dipilih, cari dari semester lain di tahun ajaran yang sama
    if (nilaiFiltered.length === 0) {
      nilaiFiltered = nilai.filter(n => 
        n.kelasId === targetKelas.id && 
        n.tahunAjaran === selectedTahunAjaran
      );
    }

    muridIds = new Set(nilaiFiltered.map(n => n.muridId));
  }

  if (muridIds.size === 0) {
    return [];
  }

  // Generate raport data untuk semua murid yang ditemukan
  const muridKelasData = Array.from(muridIds)
    .map(muridId => {
      const murid = allUsers.find(u => u.id === muridId);
      if (!murid || murid.role !== 'murid') return null;

      const muridRaportData = generateRaportData(
        murid.id,
        selectedSemester,
        allUsers,
        kelas,
        jurusan,
        nilai,
        mataPelajaran,
        tahunAjaran.filter(ta => ta.tahun === selectedTahunAjaran),
        jadwalPelajaran,
        absensi,
        sesiAbsensi,
        undefined // statusBagiRaport not needed for murid terbaik calculation
      );

      return {
        murid,
        nilaiAkhir: muridRaportData?.overallGrade || 0,
        kehadiran: muridRaportData?.attendanceRate || 0,
        isNaikKelas: muridRaportData?.isNaikKelas || false
      };
    })
    .filter((data): data is NonNullable<typeof data> => data !== null)
    .sort((a, b) => b.nilaiAkhir - a.nilaiAkhir)
    .slice(0, 3);

  return muridKelasData;
};