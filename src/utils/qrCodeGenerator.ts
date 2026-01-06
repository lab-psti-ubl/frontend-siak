import QRCode from 'qrcode';
import { User } from '../types';

export interface QRCodeData {
  type: 'student_attendance';
  id: string;
  nisn: string;
  name: string;
  kelasId: string;
  timestamp: number;
  version: string;
}

export interface AdminAttendanceQRCodeData {
  type: 'admin_attendance';
  adminId: string;
  adminName: string;
  timestamp: number;
  version: string;
}

export interface TeacherAttendanceQRCodeData {
  type: 'teacher_attendance';
  guruId: string;
  guruName: string;
  kelasWaliId?: string;
  timestamp: number;
  version: string;
}

export interface SubjectQRCodeData {
  type: 'subject_attendance';
  sesiId: string;
  jadwalId: string;
  mataPelajaranId: string;
  guruId: string;
  kelasId: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  timestamp: number;
  version: string;
}

// Helper function to get user by NISN
export const getUserByNISN = (nisn: string): User | null => {
  try {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find(u => u.nisn === nisn && u.role === 'murid') || null;
  } catch (error) {
    console.error('Error fetching user by NISN:', error);
    return null;
  }
};

// Helper function to get user by NIP
export const getUserByNIP = (nip: string): User | null => {
  try {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find(u => u.nip === nip && u.role === 'guru') || null;
  } catch (error) {
    console.error('Error fetching user by NIP:', error);
    return null;
  }
};

// Generate QR code with only NISN (for students)
export const generateQRCodeData = (muridId: string, nisn: string, name: string, kelasId: string): string => {
  // Only return NISN as simple string
  return (nisn || '').trim();
};

// Generate QR code with only NIP (for teachers)
export const generateTeacherAttendanceQRCode = (guruId: string, guruName: string, kelasWaliId?: string, nip?: string): string => {
  // Only return NIP as simple string
  return (nip || '').trim();
};

export const normalizeStudentQRCode = (existingQRCode?: string | null, nisn?: string): string => {
  const fallback = (nisn || '').trim();

  if (!existingQRCode) {
    return fallback;
  }

  const trimmed = existingQRCode.trim();
  if (!trimmed) {
    return fallback;
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (typeof parsed === 'string' && /^\d+$/.test(parsed)) {
      return parsed;
    }

    if (parsed?.nisn && typeof parsed.nisn === 'string') {
      return parsed.nisn.trim();
    }
  } catch (error) {
    // Ignore JSON parse errors for legacy QR code values
  }

  return fallback;
};

export const normalizeTeacherQRCode = (existingQRCode?: string | null, nip?: string): string => {
  const fallback = (nip || '').trim();

  if (!existingQRCode) {
    return fallback;
  }

  const trimmed = existingQRCode.trim();
  if (!trimmed) {
    return fallback;
  }

  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.nip && typeof parsed.nip === 'string') {
      return parsed.nip.trim();
    }
  } catch (error) {
    // Ignore JSON parse errors for legacy QR code values
  }

  return fallback || trimmed;
};

export const generateAdminAttendanceQRCode = (adminId: string, adminName: string): string => {
  const qrData: AdminAttendanceQRCodeData = {
    type: 'admin_attendance',
    adminId,
    adminName,
    timestamp: Date.now(),
    version: '1.0'
  };
  return JSON.stringify(qrData);
};

export const generateSubjectQRCodeData = (
  sesiId: string,
  jadwalId: string, 
  mataPelajaranId: string,
  guruId: string,
  kelasId: string,
  tanggal: string,
  jamMulai: string,
  jamSelesai: string
): string => {
  const qrData: SubjectQRCodeData = {
    type: 'subject_attendance',
    sesiId,
    jadwalId,
    mataPelajaranId,
    guruId,
    kelasId,
    tanggal,
    jamMulai,
    jamSelesai,
    timestamp: Date.now(),
    version: '1.0'
  };
  return JSON.stringify(qrData);
};

export const generateQRCodeURL = async (data: string, size: number = 300): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: size,
      height: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      type: 'image/png'
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

interface ParsedStudentQRCodeResult {
  isValid: boolean;
  type?: 'student_attendance';
  muridId?: string;
  nisn?: string;
  name?: string;
  kelasId?: string;
  timestamp?: number;
  version?: string;
  requiresLookup?: boolean;
  rawValue?: string;
}

interface ParsedTeacherQRCodeResult {
  isValid: boolean;
  type?: 'teacher_attendance';
  guruId?: string;
  guruName?: string;
  kelasWaliId?: string;
  timestamp?: number;
  version?: string;
  requiresLookup?: boolean;
  rawValue?: string;
  nip?: string;
}

export const parseQRCodeData = (qrData: string): ParsedStudentQRCodeResult => {
  try {
    let parsed: QRCodeData | null = null;
    try {
      const jsonValue = JSON.parse(qrData);
      if (jsonValue && typeof jsonValue === 'object') {
        parsed = jsonValue as QRCodeData;
      } else {
        throw new Error('Parsed JSON is not an object');
      }
    } catch (jsonError) {
      parsed = null;
    }

    if (parsed && parsed.type === 'student_attendance' && parsed.id && parsed.name) {
      return {
        isValid: true,
        type: 'student_attendance',
        muridId: parsed.id,
        nisn: parsed.nisn || '',
        name: parsed.name,
        kelasId: parsed.kelasId || '',
        timestamp: parsed.timestamp,
        version: parsed.version,
        requiresLookup: false,
        rawValue: parsed.nisn || parsed.id
      };
    }

    const nisn = qrData.trim();
    if (nisn && /^\d+$/.test(nisn)) {
      const user = getUserByNISN(nisn);
      return {
        isValid: true,
        type: 'student_attendance',
        muridId: user?.id || '',
        nisn,
        name: user?.name || '',
        kelasId: user?.kelasId || '',
        timestamp: Date.now(),
        version: '2.0',
        requiresLookup: !user,
        rawValue: nisn
      };
    }

    return { isValid: false };
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return { isValid: false };
  }
};

export const parseAdminAttendanceQRCode = (qrData: string) => {
  try {
    const parsed: AdminAttendanceQRCodeData = JSON.parse(qrData);
    if (parsed.type === 'admin_attendance' && parsed.adminId && parsed.adminName) {
      return {
        isValid: true,
        type: 'admin_attendance',
        adminId: parsed.adminId,
        adminName: parsed.adminName,
        timestamp: parsed.timestamp,
        version: parsed.version
      };
    }
    return { isValid: false };
  } catch (error) {
    console.error('Error parsing admin QR code data:', error);
    return { isValid: false };
  }
};

export const parseTeacherAttendanceQRCode = (qrData: string): ParsedTeacherQRCodeResult => {
  try {
    let parsed: TeacherAttendanceQRCodeData | null = null;
    try {
      const jsonValue = JSON.parse(qrData);
      if (jsonValue && typeof jsonValue === 'object') {
        parsed = jsonValue as TeacherAttendanceQRCodeData;
      } else {
        throw new Error('Parsed JSON is not an object');
      }
    } catch (jsonError) {
      parsed = null;
    }

    if (parsed && parsed.type === 'teacher_attendance' && parsed.guruId && parsed.guruName) {
      const legacyNip = (parsed as any).nip;
      return {
        isValid: true,
        type: 'teacher_attendance',
        guruId: parsed.guruId,
        guruName: parsed.guruName,
        kelasWaliId: parsed.kelasWaliId,
        timestamp: parsed.timestamp,
        version: parsed.version,
        requiresLookup: false,
        rawValue: parsed.guruId,
        nip: legacyNip
      };
    }

    const nip = qrData.trim();
    if (nip) {
      const user = getUserByNIP(nip);
      return {
        isValid: true,
        type: 'teacher_attendance',
        guruId: user?.id || '',
        guruName: user?.name || '',
        kelasWaliId: (user as any)?.kelasWali,
        timestamp: Date.now(),
        version: '2.0',
        requiresLookup: !user,
        rawValue: nip,
        nip
      };
    }

    return { isValid: false };
  } catch (error) {
    console.error('Error parsing teacher QR code data:', error);
    return { isValid: false };
  }
};

export const parseSubjectQRCodeData = (qrData: string) => {
  try {
    const parsed: SubjectQRCodeData = JSON.parse(qrData);
    if (parsed.type === 'subject_attendance' && parsed.sesiId && parsed.jadwalId && parsed.mataPelajaranId) {
      return {
        isValid: true,
        type: 'subject_attendance',
        sesiId: parsed.sesiId,
        jadwalId: parsed.jadwalId,
        mataPelajaranId: parsed.mataPelajaranId,
        guruId: parsed.guruId,
        kelasId: parsed.kelasId,
        tanggal: parsed.tanggal,
        jamMulai: parsed.jamMulai,
        jamSelesai: parsed.jamSelesai,
        timestamp: parsed.timestamp,
        version: parsed.version
      };
    }
    return { isValid: false };
  } catch (error) {
    console.error('Error parsing subject QR code data:', error);
    return { isValid: false };
  }
};

export const downloadQRCode = async (data: string, filename: string) => {
  try {
    const qrCodeDataURL = await generateQRCodeURL(data, 512);
    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading QR code:', error);
  }
};