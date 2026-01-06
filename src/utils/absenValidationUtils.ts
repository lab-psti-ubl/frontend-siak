import { Absensi, PengaturanAbsen } from '../types';

export interface AbsenStatusDetail {
  statusAbsen: 'hadir' | 'terlambat' | 'pulang_cepat';
  keterangan: string;
  isValidAbsen: boolean;
}

export interface AbsenKeteranganResult {
  keterangan: 'Hadir' | 'Izin' | 'Sakit' | 'Bolos' | 'Dispen' | 'Alfa' | '-';
  reason: string;
}

export const getAbsenMasukStatus = (
  waktuAbsen: string,
  pengaturanAbsen: PengaturanAbsen | undefined
): AbsenStatusDetail => {
  if (!pengaturanAbsen) {
    return {
      statusAbsen: 'hadir',
      keterangan: 'Hadir (Pengaturan belum tersedia)',
      isValidAbsen: true
    };
  }

  const [jamMasuk, menitMasuk] = pengaturanAbsen.jamMasuk.split(':').map(Number);
  const [jamAbsen, menitAbsen] = waktuAbsen.split(':').map(Number);

  const jamMasukMs = jamMasuk * 60 + menitMasuk;
  const jamAbsenMs = jamAbsen * 60 + menitAbsen;

  const batasTerlambat = jamMasukMs + pengaturanAbsen.toleransiMasuk;

  if (jamAbsenMs <= batasTerlambat) {
    return {
      statusAbsen: 'hadir',
      keterangan: 'Hadir',
      isValidAbsen: true
    };
  } else {
    return {
      statusAbsen: 'terlambat',
      keterangan: 'Terlambat',
      isValidAbsen: true
    };
  }
};

export const getAbsenPulangStatus = (
  waktuAbsen: string,
  pengaturanAbsen: PengaturanAbsen | undefined
): AbsenStatusDetail => {
  if (!pengaturanAbsen) {
    return {
      statusAbsen: 'hadir',
      keterangan: 'Hadir (Pengaturan belum tersedia)',
      isValidAbsen: true
    };
  }

  const [jamPulang, menitPulang] = pengaturanAbsen.jamPulang.split(':').map(Number);
  const [jamAbsen, menitAbsen] = waktuAbsen.split(':').map(Number);

  const jamPulangMs = jamPulang * 60 + menitPulang;
  const jamAbsenMs = jamAbsen * 60 + menitAbsen;

  const batasPulangAwal = jamPulangMs - pengaturanAbsen.toleransiPulang;

  if (jamAbsenMs >= batasPulangAwal) {
    return {
      statusAbsen: 'hadir',
      keterangan: 'Hadir',
      isValidAbsen: true
    };
  } else {
    return {
      statusAbsen: 'pulang_cepat',
      keterangan: 'Pulang Cepat',
      isValidAbsen: true
    };
  }
};

export const determineKeterangan = (
  masukAbsensi: Absensi | null,
  pulangAbsensi: Absensi | null,
  pengaturanAbsen: PengaturanAbsen | undefined,
  jamPulangJadwal?: string
): AbsenKeteranganResult => {
  if (!masukAbsensi && !pulangAbsensi) {
    return {
      keterangan: '-',
      reason: 'Tidak ada absen masuk dan pulang'
    };
  }

  if (!masukAbsensi) {
    return {
      keterangan: 'Bolos',
      reason: 'Tidak ada absen masuk'
    };
  }

  if (masukAbsensi.status === 'izin') {
    return {
      keterangan: 'Izin',
      reason: 'Izin masuk'
    };
  }

  if (masukAbsensi.status === 'sakit') {
    return {
      keterangan: 'Sakit',
      reason: 'Sakit masuk'
    };
  }

  if (masukAbsensi.status === 'alfa') {
    if (!pulangAbsensi) {
      return {
        keterangan: 'Alfa',
        reason: 'Alfa masuk, belum absen pulang'
      };
    }

    if (pulangAbsensi.status === 'alfa') {
      return {
        keterangan: 'Alfa',
        reason: 'Alfa masuk dan pulang'
      };
    }

    return {
      keterangan: 'Bolos',
      reason: 'Alfa masuk, pulang tidak alfa'
    };
  }

  if (!pulangAbsensi) {
    if ((masukAbsensi.status === 'hadir' || masukAbsensi.status === 'terlambat')) {
      return {
        keterangan: '-',
        reason: 'Masuk hadir/terlambat, belum absen pulang'
      };
    }

    return {
      keterangan: 'Hadir',
      reason: 'Masuk hadir, belum absen pulang'
    };
  }

  if (pulangAbsensi.status === 'izin') {
    return {
      keterangan: 'Dispen',
      reason: 'Izin pulang'
    };
  }

  if (pulangAbsensi.status === 'sakit') {
    return {
      keterangan: 'Dispen',
      reason: 'Sakit pulang'
    };
  }

  if (pulangAbsensi.status === 'alfa') {
    if (masukAbsensi.status === 'hadir' || masukAbsensi.status === 'terlambat') {
      return {
        keterangan: 'Bolos',
        reason: 'Masuk hadir/terlambat, alfa pulang'
      };
    }

    return {
      keterangan: 'Bolos',
      reason: 'Alfa pulang'
    };
  }

  return {
    keterangan: 'Hadir',
    reason: 'Masuk dan pulang hadir atau terlambat/pulang cepat'
  };
};

export const getDisplayStatusAbsen = (
  masukAbsensi: Absensi | null,
  pulangAbsensi: Absensi | null,
  pengaturanAbsen: PengaturanAbsen | undefined,
  tipeAbsen: 'masuk' | 'pulang'
): string => {
  if (tipeAbsen === 'masuk') {
    if (!masukAbsensi) return 'Belum Absen';

    if (masukAbsensi.status === 'hadir') {
      const waktuAbsen = new Date(masukAbsensi.waktu).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const statusDetail = getAbsenMasukStatus(waktuAbsen, pengaturanAbsen);
      return statusDetail.keterangan;
    }

    if (masukAbsensi.status === 'izin') return 'Izin';
    if (masukAbsensi.status === 'sakit') return 'Sakit';
    if (masukAbsensi.status === 'alfa') return 'Alfa';

    return 'Hadir';
  } else {
    if (!pulangAbsensi) return 'Belum Absen';

    if (pulangAbsensi.status === 'hadir') {
      const waktuAbsen = new Date(pulangAbsensi.waktu).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const statusDetail = getAbsenPulangStatus(waktuAbsen, pengaturanAbsen);
      return statusDetail.keterangan;
    }

    if (pulangAbsensi.status === 'izin') return 'Izin';
    if (pulangAbsensi.status === 'sakit') return 'Sakit';
    if (pulangAbsensi.status === 'alfa') return 'Alfa';

    return 'Hadir';
  }
};
