import * as XLSX from 'xlsx';
import { User } from '../types';
import { generateQRCodeData } from './qrCodeGenerator';

export interface GuruImportData {
  nama: string;
  email: string;
  nip: string;
  phone?: string;
  subject?: string;
}

export interface ImportResult {
  success: boolean;
  data?: GuruImportData[];
  errors?: string[];
  warnings?: string[];
}

const formatPhoneNumber = (value: any): string => {
  if (!value) return '';

  let phoneStr = String(value).trim();

  if (phoneStr.includes('E') || phoneStr.includes('e')) {
    const num = Number(value);
    if (!isNaN(num)) {
      phoneStr = num.toFixed(0);
    }
  }

  phoneStr = phoneStr.replace(/\D/g, '');

  if (phoneStr && !phoneStr.startsWith('0')) {
    phoneStr = '0' + phoneStr;
  }

  return phoneStr;
};

export const validateGuruData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
    errors.push('Nama wajib diisi');
  }

  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('Email wajib diisi');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Format email tidak valid');
  }

  if (!data.nip || typeof data.nip !== 'string' || data.nip.trim() === '') {
    errors.push('NIP wajib diisi');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const parseExcelFile = async (file: File): Promise<ImportResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        errors: ['File Excel tidak memiliki sheet']
      };
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    if (jsonData.length === 0) {
      return {
        success: false,
        errors: ['File Excel tidak memiliki data']
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const validData: GuruImportData[] = [];

    jsonData.forEach((row: any, index: number) => {
      const rowNumber = index + 2;

      const phoneRaw = row.phone || row.Phone || row.PHONE || row.telepon || row.hp || '';

      const guruData: GuruImportData = {
        nama: row.nama || row.Nama || row.NAMA || '',
        email: row.email || row.Email || row.EMAIL || '',
        nip: String(row.nip || row.NIP || row.Nip || ''),
        phone: formatPhoneNumber(phoneRaw),
        subject: row.posisi || row.Posisi || row.POSISI || row.subject || row.Subject || ''
      };

      const validation = validateGuruData(guruData);

      if (!validation.isValid) {
        errors.push(`Baris ${rowNumber}: ${validation.errors.join(', ')}`);
      } else {
        validData.push(guruData);
      }
    });

    if (errors.length > 0 && validData.length === 0) {
      return {
        success: false,
        errors
      };
    }

    return {
      success: true,
      data: validData,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      success: false,
      errors: [`Error membaca file: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

export const checkDuplicates = (
  importData: GuruImportData[],
  existingUsers: User[]
): { duplicates: string[]; cleanData: GuruImportData[] } => {
  const duplicates: string[] = [];
  const cleanData: GuruImportData[] = [];
  const existingNIP = new Set(existingUsers.map(u => u.nip));
  const existingEmail = new Set(existingUsers.map(u => u.email));

  importData.forEach((guru, index) => {
    const rowNumber = index + 2;
    let hasDuplicate = false;

    if (existingNIP.has(guru.nip)) {
      duplicates.push(`Baris ${rowNumber}: NIP ${guru.nip} sudah terdaftar`);
      hasDuplicate = true;
    }

    if (existingEmail.has(guru.email)) {
      duplicates.push(`Baris ${rowNumber}: Email ${guru.email} sudah terdaftar`);
      hasDuplicate = true;
    }

    if (!hasDuplicate) {
      cleanData.push(guru);
    }
  });

  return { duplicates, cleanData };
};

export const createGuruFromImport = (guruData: GuruImportData): User => {
  const newId = `guru${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: newId,
    name: guruData.nama.trim(),
    email: guruData.email.trim(),
    nip: guruData.nip.trim(),
    password: 'abc1234',
    phone: guruData.phone?.trim(),
    subject: guruData.subject?.trim(),
    role: 'guru',
    isActive: true,
    isWaliKelas: false,
    qrCode: generateQRCodeData(newId, guruData.nip.trim(), guruData.nama.trim()),
    createdAt: new Date().toISOString(),
  };
};

export const generateTemplateExcel = (): void => {
  const templateData = [
    {
      nama: 'Contoh Nama Guru',
      email: 'contoh.guru@email.com',
      nip: '198501012010011001',
      phone: '081234567890',
      posisi: 'Guru'
    },
    {
      nama: 'Siti Rahayu',
      email: 'siti.rahayu@email.com',
      nip: '199002152015012001',
      phone: '082345678901',
      posisi: 'TU'
    },
    {
      nama: 'Budi Santoso',
      email: 'budi.santoso@email.com',
      nip: '199505102018011001',
      phone: '083456789012',
      posisi: 'Staff'
    },
    {
      nama: 'Rina Wati',
      email: 'rina.wati@email.com',
      nip: '199912122020012001',
      phone: '084567890123',
      posisi: 'Magang'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  const colWidths = [
    { wch: 25 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Data Guru');

  XLSX.writeFile(workbook, 'Template_Import_Guru.xlsx');
};
