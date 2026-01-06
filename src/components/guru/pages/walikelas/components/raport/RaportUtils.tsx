import {
  User,
  Kelas,
  Jurusan,
  Nilai,
  MataPelajaran,
  TahunAjaran,
  JadwalPelajaran,
  Absensi,
  SesiAbsensi,
  StatusKenaikanKelas,
  StatusBagiRaport,
  Guru,
  RiwayatWaliKelas
} from '../../../../../../types';
import { generateRaportData } from '../../../../../../utils/raport';
import { getMinTingkat, getMaxTingkat, isJurusanRequiredSync } from '../../../../../../utils/jenjangPendidikanUtils';

export const getKelasForTahunAjaran = (
  currentKelasId: string,
  targetTahunAjaran: string,
  activeTahunAjaran: TahunAjaran | undefined,
  kelas: Kelas[],
  nilai?: any[],
  guru?: Guru,
  riwayatWaliKelasData?: RiwayatWaliKelas[]
) => {
  const currentKelas = kelas.find(k => k.id === currentKelasId);
  if (!currentKelas) return null;

  // Jika tahun ajaran yang dipilih sama dengan tahun ajaran aktif, gunakan kelas saat ini
  if (activeTahunAjaran && targetTahunAjaran === activeTahunAjaran.tahun) {
    return currentKelas;
  }

  // Prioritas 1: Cek riwayat wali kelas dari field guru.riwayatKelasWali
  if (guru?.riwayatKelasWali && guru.riwayatKelasWali.length > 0) {
    const riwayatMatch = guru.riwayatKelasWali.find(r => r.tahunAjaran === targetTahunAjaran);
    if (riwayatMatch) {
      const kelasFromRiwayat = kelas.find(k => k.id === riwayatMatch.kelasId);
      if (kelasFromRiwayat) {
        return kelasFromRiwayat;
      }
    }
  }

  // Prioritas 2: Cek riwayat wali kelas dari tabel RiwayatWaliKelas (data kelulusan)
  if (guru && riwayatWaliKelasData && riwayatWaliKelasData.length > 0) {
    const riwayatMatch = riwayatWaliKelasData.find(
      r => r.guruId === guru.id && r.tahunAjaran === targetTahunAjaran
    );
    if (riwayatMatch) {
      const kelasFromRiwayat = kelas.find(k => k.id === riwayatMatch.kelasId);
      if (kelasFromRiwayat) {
        return kelasFromRiwayat;
      }
    }
  }

  // Prioritas 3: Cari berdasarkan data nilai
  // Cari kelas yang memiliki data nilai untuk guru ini pada tahun ajaran target
  if (nilai && nilai.length > 0 && guru) {
    // Ambil semua kelas yang memiliki nilai di tahun ajaran target
    const kelasWithNilai = Array.from(
      new Set(
        nilai
          .filter(n => n.tahunAjaran === targetTahunAjaran)
          .map(n => n.kelasId)
      )
    ).map(kelasId => kelas.find(k => k.id === kelasId)).filter(Boolean);

    // Cek apakah kelas saat ini memiliki nilai di tahun ajaran target
    if (kelasWithNilai.some(k => k?.id === currentKelasId)) {
      return currentKelas;
    }

    // Jika ada tahun ajaran aktif, coba hitung mundur untuk menemukan kelas yang tepat
    if (activeTahunAjaran) {
      try {
        const currentYear = parseInt(activeTahunAjaran.tahun.split('/')[0]);
        const targetYear = parseInt(targetTahunAjaran.split('/')[0]);
        const yearDiff = currentYear - targetYear;
        const targetTingkat = currentKelas.tingkat - yearDiff;

        const minTingkat = getMinTingkat();
        const maxTingkat = getMaxTingkat();

        if (targetTingkat >= minTingkat && targetTingkat <= maxTingkat) {
          // Cari kelas dengan tingkat yang sesuai dan memiliki nilai
          // Untuk SMA/SMK, juga cek jurusanId. Untuk SD/SMP, tidak perlu cek jurusanId
          const matchingKelas = kelasWithNilai.find(k => {
            if (!k || k.tingkat !== targetTingkat) return false;
            
            // Jika jenjang memerlukan jurusan (SMA/SMK), cek jurusanId
            if (isJurusanRequiredSync()) {
              return k.jurusanId === currentKelas.jurusanId;
            }
            
            // Untuk SD/SMP, tidak perlu cek jurusanId
            return true;
          });

          if (matchingKelas) {
            return matchingKelas;
          }
        }
      } catch (error) {
        // Jika error (misalnya jenjang belum dikonfigurasi), lanjut ke metode berikutnya
      }
    }

    // Jika tidak ada tahun ajaran aktif ATAU perhitungan mundur gagal,
    // cari kelas yang paling cocok berdasarkan pola penamaan
    // Untuk SMA/SMK, juga cek jurusanId. Untuk SD/SMP, tidak perlu cek jurusanId
    const matchingByPattern = kelasWithNilai.find(k => {
      if (!k) return false;
      
      // Cek pola penamaan
      const nameMatch = k.name.includes(currentKelas.name.split(' ').pop() || '');
      
      // Jika jenjang memerlukan jurusan (SMA/SMK), cek jurusanId
      if (isJurusanRequiredSync()) {
        return nameMatch && k.jurusanId === currentKelas.jurusanId;
      }
      
      // Untuk SD/SMP, hanya cek pola penamaan
      return nameMatch;
    });

    if (matchingByPattern) {
      return matchingByPattern;
    }

    // Terakhir, kembalikan kelas pertama yang memiliki nilai
    // Untuk SMA/SMK, juga cek jurusanId. Untuk SD/SMP, tidak perlu cek jurusanId
    const matchingByJurusan = kelasWithNilai.find(k => {
      if (!k) return false;
      
      // Jika jenjang memerlukan jurusan (SMA/SMK), cek jurusanId
      if (isJurusanRequiredSync()) {
        return k.jurusanId === currentKelas.jurusanId;
      }
      
      // Untuk SD/SMP, kembalikan kelas pertama yang ditemukan
      return true;
    });

    if (matchingByJurusan) {
      return matchingByJurusan;
    }
  }

  // Jika tidak ada data nilai untuk periode tersebut, return null
  return null;
};

export const getMuridForSelectedPeriod = (
  targetKelas: any,
  selectedTahunAjaran: string,
  activeTahunAjaran: TahunAjaran | undefined,
  users: User[],
  kelas: Kelas[],
  userKelasWali: string,
  nilai?: any[]
) => {
  if (!targetKelas) return [];

  // Jika tahun ajaran yang dipilih adalah tahun ajaran aktif, gunakan data saat ini
  // Termasuk murid yang sudah tidak aktif (alumni)
  if (selectedTahunAjaran === activeTahunAjaran?.tahun) {
    return users.filter(u => u.role === 'murid' && u.kelasId === userKelasWali);
  }

  // Untuk tahun ajaran historis, gunakan data nilai untuk menentukan murid yang berada di kelas tersebut
  if (nilai && nilai.length > 0) {
    // Ambil murid unik dari data nilai untuk tahun ajaran dan kelas yang dipilih
    const muridIds = new Set(
      nilai
        .filter(n =>
          n.kelasId === targetKelas.id &&
          n.tahunAjaran === selectedTahunAjaran
        )
        .map(n => n.muridId)
    );

    // Jika ditemukan murid dari nilai, return mereka
    if (muridIds.size > 0) {
      return users.filter(u =>
        u.role === 'murid' &&
        muridIds.has(u.id)
      );
    }
  }

  // Jika tidak ada data nilai untuk periode tersebut, return empty array
  return [];
};

export const generateMuridTerbaikData = (
  muridKelas: User[],
  selectedSemester: number,
  selectedTahunAjaran: string,
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
  return muridKelas.map(murid => {
    const muridRaportData = generateRaportData(
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
    return {
      murid,
      nilaiAkhir: muridRaportData?.overallGrade || 0,
      kehadiran: muridRaportData?.attendanceRate || 0,
      isNaikKelas: muridRaportData?.isNaikKelas || false
    };
  })
  .sort((a, b) => b.nilaiAkhir - a.nilaiAkhir)
  .slice(0, 3);
};

export const checkRaportAccess = (
  targetKelas: any,
  selectedSemester: number,
  selectedTahunAjaran: string,
  statusKenaikanKelas: StatusKenaikanKelas[],
  statusBagiRaport: StatusBagiRaport[]
) => {
  const statusKenaikan = targetKelas ? statusKenaikanKelas.find(s =>
    s.kelasIds.includes(targetKelas.id) &&
    s.tahunAjaran === selectedTahunAjaran &&
    s.semester === selectedSemester
  ) : null;

  const statusBagiRaportData = targetKelas ? statusBagiRaport.find(s =>
    s.kelasId === targetKelas.id &&
    s.tahunAjaran === selectedTahunAjaran &&
    s.semester === selectedSemester
  ) : null;

  const canDistribute = selectedSemester === 2 ? !!statusKenaikan : !!statusBagiRaportData;
  const isDistributed = selectedSemester === 2 ? 
    (statusKenaikan?.publishedKelasIds?.includes(targetKelas.id) || false) : 
    (statusBagiRaportData?.isPublished || false);

  return {
    statusKenaikan,
    statusBagiRaportData,
    canDistribute,
    isDistributed
  };
};