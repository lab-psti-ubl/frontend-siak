export type DocumentType = 'surat_izin_izin' | 'surat_izin_sakit' | 'surat_izin_dispen' | 'surat_izin_cuti' | 'raport';

export interface VerificationPageConfig {
  title: string;
  message: string;
  icon: string;
  backgroundColor: string;
  messageColor: string;
  timestamp: string;
  documentType?: DocumentType;
  userName?: string;
  userNIP?: string;
  userNISN?: string;
  userKelas?: string;
  signatureTitle?: string;
}

export const getDocumentTypeLabel = (documentType?: DocumentType): string => {
  switch (documentType) {
    case 'raport':
      return 'Laporan Hasil Belajar';
    case 'surat_izin_izin':
      return 'Surat Izin';
    case 'surat_izin_sakit':
      return 'Surat Sakit';
    case 'surat_izin_dispen':
      return 'Surat Izin Dispen';
    case 'surat_izin_cuti':
      return 'Surat Cuti';
    default:
      return 'Dokumen Terverifikasi';
  }
};

export const getDocumentTypeDetailLabel = (documentType?: DocumentType): string => {
  switch (documentType) {
    case 'raport':
      return 'Laporan Hasil Belajar Siswa';
    case 'surat_izin_izin':
      return 'Surat Izin Siswa';
    case 'surat_izin_sakit':
      return 'Surat Sakit Siswa';
    case 'surat_izin_dispen':
      return 'Surat Izin Dispen Siswa';
    case 'surat_izin_cuti':
      return 'Surat Cuti Guru';
    default:
      return 'Dokumen Terverifikasi';
  }
};

export const openVerificationPage = (
  suratId: string,
  message: string = 'Telah ditanda tangani oleh sistem secara digital dan dinyatakan sah',
  documentType: DocumentType = 'surat_izin_izin',
  userInfo?: {
    name?: string;
    nip?: string;
    nisn?: string;
    kelas?: string;
    signatureTitle?: string;
  }
) => {
  const titleMap: Record<DocumentType, string> = {
    'surat_izin_izin': 'Verifikasi Surat Izin',
    'surat_izin_sakit': 'Verifikasi Surat Sakit',
    'surat_izin_dispen': 'Verifikasi Surat Izin Dispen',
    'surat_izin_cuti': 'Verifikasi Surat Cuti',
    'raport': 'Verifikasi Laporan Hasil Belajar'
  };

  // Determine current language (default to Indonesian) for proper day name formatting
  let language: 'id' | 'ms' = 'id';
  try {
    const storedLanguage = (localStorage.getItem('language') || '').toLowerCase();
    if (storedLanguage === 'ms' || storedLanguage === 'id') {
      language = storedLanguage as 'id' | 'ms';
    }
  } catch {
    // ignore and keep default
  }

  const locale = language === 'ms' ? 'ms-MY' : 'id-ID';

  const timestamp = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const params = new URLSearchParams();
  params.append('verification', suratId);
  params.append('message', message);
  params.append('documentType', documentType);
  params.append('timestamp', timestamp);
  params.append('lang', language);

  if (userInfo?.name) {
    params.append('userName', userInfo.name);
  }
  if (userInfo?.nip) {
    params.append('userNIP', userInfo.nip);
  }
  if (userInfo?.nisn) {
    params.append('userNISN', userInfo.nisn);
  }
  if (userInfo?.kelas) {
    params.append('userKelas', userInfo.kelas);
  }
  if (userInfo?.signatureTitle) {
    params.append('signatureTitle', userInfo.signatureTitle);
  }

  const newWindow = window.open(`/verification?${params.toString()}`, '_blank');

  if (!newWindow) {
    alert('Mohon izinkan pop-up untuk membuka halaman verifikasi');
  }
};

export const getVerificationUrl = (
  suratId: string,
  userInfo?: {
    name?: string;
    nip?: string;
    nisn?: string;
    kelas?: string;
  },
  documentType?: DocumentType
): string => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams();

  // Determine current language for correct day name formatting on verification page
  let language: 'id' | 'ms' = 'id';
  try {
    const storedLanguage = (localStorage.getItem('language') || '').toLowerCase();
    if (storedLanguage === 'ms' || storedLanguage === 'id') {
      language = storedLanguage as 'id' | 'ms';
    }
  } catch {
    // ignore and keep default
  }

  params.append('verification', suratId);
  params.append('message', 'Telah ditanda tangani oleh sistem secara digital dan dinyatakan sah');

  if (documentType) {
    params.append('documentType', documentType);
  }

  // Pass language to verification page so it can display the day correctly
  params.append('lang', language);

  if (userInfo?.name) {
    params.append('userName', userInfo.name);
  }

  if (userInfo?.nip) {
    params.append('userNIP', userInfo.nip);
  }

  if (userInfo?.nisn) {
    params.append('userNISN', userInfo.nisn);
  }

  if (userInfo?.kelas) {
    params.append('userKelas', userInfo.kelas);
  }

  return `${baseUrl}/verification?${params.toString()}`;
};
