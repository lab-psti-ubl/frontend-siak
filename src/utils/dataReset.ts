// Utility untuk reset data ke kondisi awal
export const resetToSeedData = () => {
  // Hapus semua data dari localStorage
  const keysToReset = [
    'users', 'jurusan', 'kelas', 'mataPelajaran', 'jadwalPelajaran', 
    'tahunAjaran', 'sesiAbsensi', 'absensi', 'suratIzin', 'absensiGuru', 
    'izinGuru', 'guruMapel', 'nilai', 'infoSekolah', 'pengumumanKelulusan', 
    'statusKenaikanKelas', 'statusBagiRaport', 'alumni', 'riwayatWaliKelas',
    'pengaturanAbsen', 'pengaturanSKS', 'pengaturanIstirahat', 'currentUser'
  ];
  
  keysToReset.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Trigger storage events untuk memperbarui komponen
  keysToReset.forEach(key => {
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key, value: null }
    }));
  });
  
  console.log('Data berhasil direset ke kondisi awal');
};

// Fungsi untuk mendeteksi apakah aplikasi baru saja dimuat
export const isAppFreshLoad = () => {
  const sessionKey = 'app_session_active';
  const isActive = sessionStorage.getItem(sessionKey);
  
  if (!isActive) {
    // Tandai bahwa aplikasi sedang aktif
    sessionStorage.setItem(sessionKey, 'true');
    return true; // Fresh load
  }
  
  return false; // Bukan fresh load
};

// Fungsi untuk membersihkan session saat aplikasi ditutup
export const setupAppCleanup = () => {
  // Cleanup saat tab/window ditutup
  const handleBeforeUnload = () => {
    sessionStorage.removeItem('app_session_active');
  };
  
  // Cleanup saat visibility berubah (tab tidak aktif)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      sessionStorage.removeItem('app_session_active');
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Cleanup listeners saat komponen unmount
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};