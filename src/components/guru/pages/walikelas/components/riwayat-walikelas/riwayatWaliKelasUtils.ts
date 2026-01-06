import {
  User,
  Kelas,
  Jurusan,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi
} from '../../../../../../types';
import { generateRaportData } from '../../../../../../utils/raport';
import { isMaxTingkatSync } from '../../../../../../utils/jenjangPendidikanUtils';

interface RiwayatWaliKelasItem {
  kelasId: string;
  tahunAjaran: string;
  semester: number;
}

export const getAvailableTahunAjaran = (
  riwayatWaliKelas: RiwayatWaliKelasItem[],
  tahunAjaran: TahunAjaran[],
  nilai: Nilai[],
  jadwalPelajaran: JadwalPelajaran[],
  guruId: string
) => {
  // Get all kelas IDs from riwayat (guru pernah menjadi wali kelas di kelas-kelas ini)
  const kelasIdsFromRiwayat = new Set(riwayatWaliKelas.map(r => r.kelasId));
  
  // Get tahun ajaran from nilai where kelas is in riwayat (data yang benar-benar ada)
  const tahunFromNilai = new Set(
    nilai
      .filter(n => kelasIdsFromRiwayat.has(n.kelasId))
      .map(n => n.tahunAjaran)
  );
  
  // Get tahun ajaran from jadwal where guru teaches and kelas is in riwayat
  const tahunFromJadwal = new Set(
    jadwalPelajaran
      .filter(j => j.guruId === guruId && kelasIdsFromRiwayat.has(j.kelasId))
      .map(j => j.tahunAjaran)
  );
  
  // Get tahun ajaran from riwayat (historical record)
  const tahunFromRiwayat = new Set(riwayatWaliKelas.map(r => r.tahunAjaran));
  
  // Combine all tahun ajaran - prioritize those with actual data
  const allTahun = new Set([
    ...Array.from(tahunFromNilai), // Tahun ajaran dengan data nilai
    ...Array.from(tahunFromJadwal), // Tahun ajaran dengan data jadwal
    ...Array.from(tahunFromRiwayat) // Tahun ajaran dari riwayat
  ]);
  
  return Array.from(allTahun)
    .map(tahun => tahunAjaran.find(ta => ta.tahun === tahun))
    .filter(ta => ta !== undefined)
    .sort((a, b) => b.tahun.localeCompare(a.tahun)) as TahunAjaran[];
};

export const getAvailableSemesters = (
  tahunAjaranValue: string,
  riwayatWaliKelas: RiwayatWaliKelasItem[],
  tahunAjaran: TahunAjaran[],
  nilai: Nilai[],
  jadwalPelajaran: JadwalPelajaran[],
  guruId: string
) => {
  // SUMBER KEBENARAN UTAMA: Get semester from tahunAjaran data (data resmi dari database)
  // Hanya semester yang benar-benar ada di tabel tahunAjaran untuk tahun ajaran ini yang ditampilkan
  // Contoh: Jika tahun ajaran 2025/2026 hanya memiliki semester 1 di database, 
  // maka hanya semester 1 yang ditampilkan, semester 2 tidak akan muncul
  const semesterFromTahunAjaran = new Set(
    tahunAjaran
      .filter(ta => ta.tahun === tahunAjaranValue)
      .map(ta => ta.semester)
  );
  
  // Jika tidak ada data tahunAjaran untuk tahun ajaran ini, return empty
  if (semesterFromTahunAjaran.size === 0) {
    return [];
  }
  
  // Get kelas IDs from riwayat for this tahun ajaran (guru pernah menjadi wali kelas di kelas-kelas ini)
  const kelasIdsFromRiwayat = new Set(
    riwayatWaliKelas
      .filter(r => r.tahunAjaran === tahunAjaranValue)
      .map(r => r.kelasId)
  );
  
  // Verifikasi tambahan: Cek apakah semester dari tahunAjaran memiliki data aktual
  // (nilai atau jadwal) untuk kelas-kelas yang ada di riwayat
  const semesterFromNilai = new Set(
    nilai
      .filter(n => 
        n.tahunAjaran === tahunAjaranValue && 
        kelasIdsFromRiwayat.has(n.kelasId)
      )
      .map(n => n.semester)
  );
  
  const semesterFromJadwal = new Set(
    jadwalPelajaran
      .filter(j => 
        j.tahunAjaran === tahunAjaranValue && 
        j.guruId === guruId &&
        kelasIdsFromRiwayat.has(j.kelasId)
      )
      .map(j => j.semester)
  );
  
  // Filter: Hanya tampilkan semester yang:
  // 1. Ada di data tahunAjaran (WAJIB - ini sumber kebenaran)
  // 2. DAN ada di riwayat atau memiliki data nilai/jadwal
  // Ini memastikan semester yang ditampilkan sesuai dengan data tahunAjaran di database
  // dan memiliki kaitan dengan riwayat wali kelas guru
  const validSemesters = new Set<number>();
  
  semesterFromTahunAjaran.forEach(sem => {
    // Cek apakah semester ini ada di riwayat atau memiliki data aktual
    const hasRiwayat = riwayatWaliKelas.some(r => 
      r.tahunAjaran === tahunAjaranValue && r.semester === sem
    );
    const hasNilai = semesterFromNilai.has(sem);
    const hasJadwal = semesterFromJadwal.has(sem);
    
    // Jika ada di tahunAjaran DAN (ada di riwayat ATAU ada data nilai/jadwal), maka valid
    if (hasRiwayat || hasNilai || hasJadwal) {
      validSemesters.add(sem);
    }
  });

  // Jika ada valid semesters, gunakan itu
  // Jika tidak ada yang valid tapi ada semester di tahunAjaran, tetap tampilkan
  // (untuk kasus dimana semester sudah ada di tahunAjaran tapi belum ada data nilai/jadwal)
  const finalSemesters = validSemesters.size > 0 
    ? validSemesters 
    : semesterFromTahunAjaran;

  return Array.from(finalSemesters)
    .sort((a, b) => a - b)
    .map(sem => ({
      id: `sem-${sem}`,
      tahun: tahunAjaranValue,
      semester: sem,
      isActive: false,
      tanggalMulai: '',
      tanggalSelesai: ''
    }));
};

export const getKelasForWaliKelas = (
  tahunAjaranValue: string,
  selectedSemester: number,
  riwayatWaliKelas: RiwayatWaliKelasItem[],
  kelas: Kelas[],
  nilai: Nilai[],
  jadwalPelajaran: JadwalPelajaran[],
  guruId: string
) => {
  // First, get all kelas IDs from riwayat where guru was wali kelas (any semester for this tahun ajaran)
  const kelasIdsFromRiwayatForTahun = new Set(
    riwayatWaliKelas
      .filter(r => r.tahunAjaran === tahunAjaranValue)
      .map(r => r.kelasId)
  );
  
  // Get kelas IDs that have actual data (nilai or jadwal) for the selected tahun ajaran and semester
  const kelasIdsWithData = new Set<string>();
  
  // From nilai: kelas that have nilai data in this tahun ajaran and semester
  nilai
    .filter(n =>
      n.tahunAjaran === tahunAjaranValue &&
      n.semester === selectedSemester
    )
    .forEach(n => {
      if (kelasIdsFromRiwayatForTahun.has(n.kelasId)) {
        kelasIdsWithData.add(n.kelasId);
      }
    });
  
  // From jadwal: kelas where guru teaches in this tahun ajaran and semester
  jadwalPelajaran
    .filter(j =>
      j.tahunAjaran === tahunAjaranValue &&
      j.semester === selectedSemester &&
      j.guruId === guruId
    )
    .forEach(j => {
      if (kelasIdsFromRiwayatForTahun.has(j.kelasId)) {
        kelasIdsWithData.add(j.kelasId);
      }
    });
  
  // Also check if kelas has waliKelasId matching this guru (current wali kelas)
  kelas
    .filter(k => k.waliKelasId === guruId && kelasIdsFromRiwayatForTahun.has(k.id))
    .forEach(k => {
      // Verify this kelas has data in the selected tahun ajaran and semester
      const hasNilai = nilai.some(n =>
        n.kelasId === k.id &&
        n.tahunAjaran === tahunAjaranValue &&
        n.semester === selectedSemester
      );
      const hasJadwal = jadwalPelajaran.some(j =>
        j.kelasId === k.id &&
        j.tahunAjaran === tahunAjaranValue &&
        j.semester === selectedSemester
      );
      if (hasNilai || hasJadwal) {
        kelasIdsWithData.add(k.id);
      }
    });

  // Only return kelas that have actual data in the selected tahun ajaran and semester
  return kelas
    .filter(k => kelasIdsWithData.has(k.id))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getMuridForFilter = (
  selectedKelas: string,
  selectedTahunAjaran: string,
  selectedSemester: number,
  users: User[],
  kelas: Kelas[],
  nilai: Nilai[],
  searchQuery: string
) => {
  if (!selectedKelas || !selectedTahunAjaran) {
    return [];
  }

  const muridIds = new Set(
    nilai
      .filter(n =>
        n.kelasId === selectedKelas &&
        n.tahunAjaran === selectedTahunAjaran &&
        n.semester === selectedSemester
      )
      .map(n => n.muridId)
  );

  let murid = users.filter(u =>
    u.role === 'murid' &&
    muridIds.has(u.id)
  );

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    murid = murid.filter(u =>
      u.name.toLowerCase().includes(query) ||
      (u.nisn && u.nisn.includes(query))
    );
  }

  return murid.sort((a, b) => a.name.localeCompare(b.name));
};

export const generateRekapRaportData = (
  muridList: User[],
  selectedSemester: number,
  selectedTahunAjaran: string,
  selectedKelas: string,
  users: User[],
  kelas: Kelas[],
  jurusan: Jurusan[],
  nilai: Nilai[],
  mataPelajaran: MataPelajaran[],
  tahunAjaran: TahunAjaran[],
  jadwalPelajaran: JadwalPelajaran[],
  absensi: Absensi[],
  sesiAbsensi: SesiAbsensi[]
) => {
  const kelasData = kelas.find(k => k.id === selectedKelas);
  const isMaxTingkat = kelasData ? isMaxTingkatSync(kelasData.tingkat) : false;

  return muridList.map(murid => {
    const raportData = generateRaportData(
      murid.id,
      selectedSemester,
      users,
      kelas,
      jurusan,
      nilai,
      mataPelajaran,
      tahunAjaran.filter(ta => ta.tahun === selectedTahunAjaran),
      jadwalPelajaran,
      absensi,
      sesiAbsensi
    );

    const jurusanData = kelasData ? jurusan.find(j => j.id === kelasData.jurusanId) : null;

    return {
      murid,
      kelasData,
      jurusanData,
      nilaiAkhir: raportData?.overallGrade || 0,
      attendanceRate: raportData?.attendanceRate || 0,
      isNaikKelas: raportData?.isNaikKelas || false,
      isMaxTingkat, // Add flag to indicate if this is max tingkat
      semester: selectedSemester,
      raportData
    };
  }).sort((a, b) => b.nilaiAkhir - a.nilaiAkhir);
};

export const getRekapRaportStats = (rekapData: any[]) => {
  if (rekapData.length === 0) {
    return {
      totalMurid: 0,
      rataRataNilai: 0,
      muridNaik: 0,
      muridTidakNaik: 0,
      persentaseNaik: 0,
      isMaxTingkat: false
    };
  }

  const totalNilai = rekapData.reduce((sum, item) => sum + item.nilaiAkhir, 0);
  const rataRataNilai = totalNilai / rekapData.length;
  const muridNaik = rekapData.filter(item => item.isNaikKelas).length;
  const muridTidakNaik = rekapData.length - muridNaik;
  const persentaseNaik = (muridNaik / rekapData.length) * 100;
  
  // Check if this is max tingkat (use first item since all should have same kelas)
  const isMaxTingkat = rekapData.length > 0 ? (rekapData[0].isMaxTingkat || false) : false;

  return {
    totalMurid: rekapData.length,
    rataRataNilai,
    muridNaik,
    muridTidakNaik,
    persentaseNaik,
    isMaxTingkat
  };
};
