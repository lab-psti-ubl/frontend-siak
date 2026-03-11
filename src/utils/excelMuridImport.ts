import * as XLSX from 'xlsx';
import { User } from '../types';
import { generateQRCodeData } from './qrCodeGenerator';

export interface MuridImportData {
  nama: string;
  email: string;
  nisn: string;
  whatsappOrtu?: string;
  kelasId?: string;
  rfidGuid?: string;
}

export interface ImportResult {
  success: boolean;
  data?: MuridImportData[];
  errors?: string[];
  warnings?: string[];
}

export const validateMuridData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.nama || typeof data.nama !== 'string' || data.nama.trim() === '') {
    errors.push('Nama wajib diisi');
  }

  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('Email wajib diisi');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Format email tidak valid');
  }

  if (!data.nisn || typeof data.nisn !== 'string' || data.nisn.trim() === '') {
    errors.push('NISN wajib diisi');
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
    const validData: MuridImportData[] = [];

    jsonData.forEach((row: any, index: number) => {
      const rowNumber = index + 2;

      const whatsappValue = row.whatsappOrtu || row.WhatsAppOrtu || row.whatsapp_ortu || row.whatsapp || '';
      let whatsappOrtu = String(whatsappValue).trim();

      if (whatsappOrtu && !whatsappOrtu.startsWith('0') && whatsappOrtu.match(/^[8-9]/)) {
        whatsappOrtu = '0' + whatsappOrtu;
      }

      const rfidGuid = row.rfidGuid || row.RFID || row.rfid || row.guid || row.GUID || '';

      const muridData: MuridImportData = {
        nama: row.nama || row.Nama || row.NAMA || '',
        email: row.email || row.Email || row.EMAIL || '',
        nisn: String(row.nisn || row.NISN || row.Nisn || ''),
        whatsappOrtu: whatsappOrtu || undefined,
        kelasId: row.kelasId || row.KelasId || row.kelas_id || '',
        rfidGuid: rfidGuid ? String(rfidGuid).trim() : undefined
      };

      const validation = validateMuridData(muridData);

      if (!validation.isValid) {
        errors.push(`Baris ${rowNumber}: ${validation.errors.join(', ')}`);
      } else {
        validData.push(muridData);
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
  importData: MuridImportData[],
  existingUsers: User[]
): { duplicates: string[]; cleanData: MuridImportData[] } => {
  const duplicates: string[] = [];
  const cleanData: MuridImportData[] = [];
  const existingNISN = new Set(existingUsers.map(u => u.nisn));
  const existingEmail = new Set(existingUsers.map(u => u.email));
  const existingRfid = new Set(existingUsers
    .map(u => (u as any).rfidGuid)
    .filter(guid => guid && guid.trim() !== ''));

  importData.forEach((murid, index) => {
    const rowNumber = index + 2;
    let hasDuplicate = false;

    if (existingNISN.has(murid.nisn)) {
      duplicates.push(`Baris ${rowNumber}: NISN ${murid.nisn} sudah terdaftar`);
      hasDuplicate = true;
    }

    if (existingEmail.has(murid.email)) {
      duplicates.push(`Baris ${rowNumber}: Email ${murid.email} sudah terdaftar`);
      hasDuplicate = true;
    }

    if (murid.rfidGuid && murid.rfidGuid.trim() && existingRfid.has(murid.rfidGuid)) {
      duplicates.push(`Baris ${rowNumber}: GUID/RFID ${murid.rfidGuid} sudah terdaftar`);
      hasDuplicate = true;
    }

    if (!hasDuplicate) {
      cleanData.push(murid);
    }
  });

  return { duplicates, cleanData };
};

export const createMuridFromImport = (
  muridData: MuridImportData,
  defaultKelasId: string
): User => {
  const newId = `murid${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  const kelasId = muridData.kelasId || defaultKelasId;

  let whatsappOrtu = muridData.whatsappOrtu ? String(muridData.whatsappOrtu).trim() : undefined;

  if (whatsappOrtu && !whatsappOrtu.startsWith('0') && whatsappOrtu.match(/^[8-9]/)) {
    whatsappOrtu = '0' + whatsappOrtu;
  }

  return {
    id: newId,
    name: muridData.nama.trim(),
    email: muridData.email.trim(),
    nisn: muridData.nisn.trim(),
    password: 'abc1234',
    kelasId: kelasId,
    whatsappOrtu: whatsappOrtu,
    rfidGuid: muridData.rfidGuid || undefined,
    role: 'murid',
    isActive: true,
    qrCode: generateQRCodeData(newId, muridData.nisn.trim(), muridData.nama.trim(), kelasId),
    createdAt: new Date().toISOString(),
  };
};

export const generateTemplateExcel = (): void => {
  const templateData = [
    {
      nama: 'Contoh Nama Murid',
      email: 'contoh@email.com',
      nisn: '1234567890',
      whatsappOrtu: '081234567890',
      rfidGuid: '001A2B3C4D'
    },
    {
      nama: 'Budi Santoso',
      email: 'budi.santoso@email.com',
      nisn: '9876543210',
      whatsappOrtu: '082345678901',
      rfidGuid: '002E3F5G6H'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  const colWidths = [
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 }
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Data Murid');

  XLSX.writeFile(workbook, 'Template_Import_Murid.xlsx');
};
