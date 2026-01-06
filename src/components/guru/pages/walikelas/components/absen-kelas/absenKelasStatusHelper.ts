import { Absensi, PengaturanAbsen } from '../../../../../../types';

export interface AbsenStatusInfo {
  statusAbsen: 'hadir' | 'terlambat' | 'pulang_cepat' | 'tidak_absen' | 'izin' | 'sakit' | 'alfa';
  displayStatus: string;
  isTimeBasedStatus: boolean;
}

export const determineAbsenStatusForMurid = (
  attendance: Absensi | null,
  sessionType: 'masuk' | 'pulang',
  pengaturanAbsen: PengaturanAbsen | undefined
): AbsenStatusInfo => {
  if (!attendance) {
    return {
      statusAbsen: 'tidak_absen',
      displayStatus: 'Belum Absen',
      isTimeBasedStatus: false
    };
  }

  if (attendance.status === 'izin') {
    return {
      statusAbsen: 'izin',
      displayStatus: 'Izin',
      isTimeBasedStatus: false
    };
  }

  if (attendance.status === 'sakit') {
    return {
      statusAbsen: 'sakit',
      displayStatus: 'Sakit',
      isTimeBasedStatus: false
    };
  }

  if (attendance.status === 'alfa') {
    return {
      statusAbsen: 'alfa',
      displayStatus: 'Alfa',
      isTimeBasedStatus: false
    };
  }

  if (attendance.status === 'hadir' && !pengaturanAbsen) {
    return {
      statusAbsen: 'hadir',
      displayStatus: 'Hadir',
      isTimeBasedStatus: false
    };
  }

  if (attendance.status === 'hadir' && pengaturanAbsen) {
    const waktuAbsenTime = new Date(attendance.waktu);
    const jamAbsen = waktuAbsenTime.getHours();
    const menitAbsen = waktuAbsenTime.getMinutes();
    const jamAbsenMs = jamAbsen * 60 + menitAbsen;

    if (sessionType === 'masuk') {
      const [jamMasuk, menitMasuk] = pengaturanAbsen.jamMasuk.split(':').map(Number);
      const jamMasukMs = jamMasuk * 60 + menitMasuk;
      const batasTerlambat = jamMasukMs + pengaturanAbsen.toleransiMasuk;

      if (jamAbsenMs <= batasTerlambat) {
        return {
          statusAbsen: 'hadir',
          displayStatus: 'Hadir',
          isTimeBasedStatus: true
        };
      } else {
        return {
          statusAbsen: 'terlambat',
          displayStatus: 'Terlambat',
          isTimeBasedStatus: true
        };
      }
    } else {
      const [jamPulang, menitPulang] = pengaturanAbsen.jamPulang.split(':').map(Number);
      const jamPulangMs = jamPulang * 60 + menitPulang;
      const batasPulangAwal = jamPulangMs - pengaturanAbsen.toleransiPulang;

      if (jamAbsenMs >= batasPulangAwal) {
        return {
          statusAbsen: 'hadir',
          displayStatus: 'Hadir',
          isTimeBasedStatus: true
        };
      } else {
        return {
          statusAbsen: 'pulang_cepat',
          displayStatus: 'Pulang Cepat',
          isTimeBasedStatus: true
        };
      }
    }
  }

  return {
    statusAbsen: 'hadir',
    displayStatus: 'Hadir',
    isTimeBasedStatus: false
  };
};

export const getAbsenStatusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
  switch (status.toLowerCase()) {
    case 'hadir':
      return 'success';
    case 'terlambat':
    case 'izin':
    case 'pulang_cepat':
      return 'warning';
    case 'sakit':
      return 'info';
    case 'alfa':
    case 'bolos':
      return 'danger';
    default:
      return 'default';
  }
};
