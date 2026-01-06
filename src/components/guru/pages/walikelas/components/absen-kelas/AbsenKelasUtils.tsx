import { User, SesiAbsensi, Absensi, PengaturanAbsen } from '../../../../../../types';

/**
 * Cek apakah tanggal tertentu ada di database (ada dokumen Absensi untuk tanggal tersebut)
 * Jika ada setidaknya satu data absensi untuk tanggal tersebut, berarti tanggal ada di database
 */
export const isTanggalExistsInDatabase = (
  absensi: Absensi[],
  tanggal: string,
  kelasId?: string,
  tahunAjaranId?: string,
  semester?: number
): boolean => {
  const absensiForDate = absensi.filter(a => {
    let match = a.tanggal === tanggal;
    if (kelasId && match) {
      match = a.kelasId === kelasId;
    }
    if (tahunAjaranId && match) {
      match = a.tahunAjaranId === tahunAjaranId;
    }
    if (semester !== undefined && match) {
      match = a.semester === semester;
    }
    return match;
  });
  return absensiForDate.length > 0;
};

export const isSessionExpired = (
  sessionType: 'masuk' | 'pulang',
  pengaturanAbsen: PengaturanAbsen[]
): boolean => {
  const activePengaturanAbsen = pengaturanAbsen.find(p => p.isActive);
  if (!activePengaturanAbsen) return false;

  const jamAbsen = sessionType === 'masuk' ? activePengaturanAbsen.jamMasuk : activePengaturanAbsen.jamPulang;
  const [jam, menit] = jamAbsen.split(':').map(Number);

  const batasWaktu = new Date();
  batasWaktu.setHours(jam, menit + 15, 0);

  const now = new Date();
  return now.getTime() >= batasWaktu.getTime();
};

export const getSessionStats = (
  sessionType: 'masuk' | 'pulang',
  session: SesiAbsensi | undefined,
  muridKelas: User[],
  absensi: Absensi[],
  selectedDate?: string
) => {
  // Use selectedDate if provided, otherwise use session.tanggal, otherwise return empty stats
  const targetDate = selectedDate || session?.tanggal;
  if (!targetDate) return { hadir: 0, total: muridKelas.length, attended: 0, izin: 0, sakit: 0, alfa: 0 };

  // For absen kelas, we use non-session based attendance (daily attendance)
  // Filter absensi by tanggal (absensi sudah filtered by kelasId from hook)
  const absensiForDate = absensi.filter((a: Absensi) => a.tanggal === targetDate);
  
  // Create a map for quick lookup: muridId -> absensi record
  const absensiMap = new Map<string, Absensi>();
  absensiForDate.forEach(a => {
    absensiMap.set(a.muridId, a);
  });
  
  // Initialize counters
  let hadir = 0;
  let izin = 0;
  let sakit = 0;
  let alfa = 0;
  let attended = 0;
  
  // Iterate through each student to count their attendance status
  muridKelas.forEach(murid => {
    const absensiRecord = absensiMap.get(murid.id);
    
    if (!absensiRecord) {
      // No attendance record - count as alfa
      alfa++;
      return;
    }
    
    // Check if attendance exists for this session type
    let hasSessionAttendance = false;
    let attendanceStatus: string | undefined;
    
    if (sessionType === 'masuk') {
      // Check for masuk attendance
      hasSessionAttendance = !!(absensiRecord.jamMasuk || absensiRecord.statusMasuk || absensiRecord.tipeAbsen === 'masuk');
      // Get status from new structure (statusMasuk) or legacy structure (status)
      attendanceStatus = absensiRecord.statusMasuk || absensiRecord.status;
    } else {
      // Check for pulang attendance
      hasSessionAttendance = !!(absensiRecord.jamKeluar || absensiRecord.statusKeluar || absensiRecord.tipeAbsen === 'pulang');
      // Get status from new structure (statusKeluar) or legacy structure (status)
      attendanceStatus = absensiRecord.statusKeluar || absensiRecord.status;
    }
    
    if (!hasSessionAttendance) {
      // Has record but no data for this session type - count as alfa
      alfa++;
      return;
    }
    
    // Count based on status
    attended++;
    
    if (attendanceStatus === 'izin') {
      izin++;
    } else if (attendanceStatus === 'sakit') {
      sakit++;
    } else if (attendanceStatus === 'alfa') {
      alfa++;
    } else {
      // hadir, tepat_waktu, terlambat, pulang_cepat, pulang_awal, tidak_masuk, tidak_keluar are all counted as hadir
      hadir++;
    }
  });
  
  return {
    hadir,
    izin,
    sakit,
    alfa,
    total: muridKelas.length,
    attended
  };
};

export const sendWhatsAppNotification = (
  murid: User, 
  status: string, 
  sessionType: string,
  myKelas: any,
  selectedDate: string
) => {
  if (!murid.whatsappOrtu) {
    alert('Nomor WhatsApp orang tua tidak tersedia untuk murid ini');
    return;
  }

  let formattedPhone = murid.whatsappOrtu.replace(/\D/g, '');
  
  if (!formattedPhone.startsWith('62') && formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('62') && !formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone;
  }

  const statusText = status === 'hadir' ? 'HADIR' : 
                    status === 'izin' ? 'IZIN' : 
                    status === 'sakit' ? 'SAKIT' : 'ALFA';
  
  const sessionText = sessionType === 'masuk' ? 'MASUK SEKOLAH' : 'PULANG SEKOLAH';
  const currentTime = new Date().toLocaleTimeString('id-ID');
  const currentDate = new Date(selectedDate).toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const message = `*NOTIFIKASI ABSENSI SEKOLAH*

Yth. Orang Tua/Wali dari *${murid.name}*

Kami informasikan bahwa putra/putri Anda:
📋 *Nama:* ${murid.name}
🆔 *NISN:* ${murid.nisn}
🏫 *Kelas:* ${myKelas?.name}
📅 *Tanggal:* ${currentDate}
⏰ *Waktu:* ${currentTime}
📍 *Jenis Absen:* ${sessionText}

*STATUS: ${statusText}*

${status === 'alfa' ? 
  '⚠️ *PERHATIAN:* Putra/putri Anda tidak hadir tanpa keterangan. Mohon segera menghubungi wali kelas untuk konfirmasi.' :
  status === 'izin' || status === 'sakit' ?
  '📝 Putra/putri Anda telah dikonfirmasi ' + status + ' oleh wali kelas.' :
  '✅ Putra/putri Anda telah hadir di sekolah.'
}

Terima kasih atas perhatiannya.

_Pesan otomatis dari Sistem Absensi Sekolah_`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

export const showNotification = (
  type: 'success' | 'error' | 'warning', 
  title: string, 
  message: string, 
  duration: number = 5000
) => {
  const existingNotifications = document.querySelectorAll('.custom-notification');
  existingNotifications.forEach(notification => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  });

  const notification = document.createElement('div');
  notification.className = `custom-notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center max-w-sm transition-all duration-300 transform translate-x-0`;
  
  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
  notification.className += ` ${bgColor} text-white`;
  
  const icon = type === 'success' 
    ? '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>'
    : type === 'error'
    ? '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>'
    : '<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
  
  notification.innerHTML = `
    ${icon}
    <div>
      <div class="font-medium">${title}</div>
      <div class="text-sm opacity-90">${message}</div>
    </div>
    <button class="ml-4 text-white hover:text-gray-200 transition-colors" onclick="this.parentElement.remove()">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
      </svg>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, duration);
};