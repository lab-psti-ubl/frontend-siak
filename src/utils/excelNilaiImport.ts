import * as XLSX from 'xlsx';
import { Nilai, NilaiTugas } from '../types';

export interface NilaiImportData {
  nisn: string;
  nama: string;
  tugas: { [key: string]: number };
  uts: number;
  uas: number;
  komponenDinamis?: { [key: string]: { nilai: number; nama: string }[] };
}

interface ParseResult {
  success: boolean;
  data?: NilaiImportData[];
  errors?: string[];
}

export const parseExcelFileNilai = async (file: File, komponenDinamisConfig?: Array<{ id: string; nama: string; persentase: number; hasNilai?: boolean }>): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const errors: string[] = [];
        const validData: NilaiImportData[] = [];

        const headerRow = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;
        const tugasColumns: string[] = [];
        const komponenDinamisColumns: Map<string, string[]> = new Map();

        if (headerRow) {
          for (let col = headerRow.s.c; col <= headerRow.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            const cell = worksheet[cellAddress];
            if (cell && cell.v) {
              const headerValue = String(cell.v).trim();
              const tugasMatch = headerValue.match(/^Tugas\s+(\d+)$/i);

              if (tugasMatch) {
                tugasColumns.push(headerValue);
              } else if (!['NISN', 'Nama', 'Kehadiran', 'Kehadiran (%)', 'UTS', 'UAS', 'Nilai Akhir', 'Grade'].includes(headerValue)) {
                const baseKomponenMatch = headerValue.match(/^(.+?)\s+(\d+)$/);

                if (baseKomponenMatch) {
                  const baseName = baseKomponenMatch[1].trim();
                  if (!komponenDinamisColumns.has(baseName)) {
                    komponenDinamisColumns.set(baseName, []);
                  }
                  komponenDinamisColumns.get(baseName)?.push(headerValue);
                } else {
                  if (!komponenDinamisColumns.has(headerValue)) {
                    komponenDinamisColumns.set(headerValue, []);
                  }
                  komponenDinamisColumns.get(headerValue)?.push(headerValue);
                }
              }
            }
          }
        }

        jsonData.forEach((row: any, index: number) => {
          const rowNumber = index + 2;

          if (!row['NISN'] || !row['Nama']) {
            errors.push(`Baris ${rowNumber}: NISN dan Nama wajib diisi`);
            return;
          }

          const parseNumber = (value: any): number => {
            if (value === undefined || value === null || value === '') {
              return 0;
            }
            const parsed = parseFloat(value);
            if (isNaN(parsed)) {
              return 0;
            }
            return Math.max(0, Math.min(100, parsed));
          };

          const tugasData: { [key: string]: number } = {};

          tugasColumns.forEach(colName => {
            const tugasMatch = colName.match(/^Tugas\s+(\d+)$/i);
            if (tugasMatch) {
              const tugasNum = tugasMatch[1];
              tugasData[`t${tugasNum}`] = parseNumber(row[colName]);
            }
          });

          const komponenDinamisData: { [key: string]: { nilai: number; nama: string }[] } = {};

          komponenDinamisColumns.forEach((columns, baseName) => {
            const nilaiList: { nilai: number; nama: string }[] = [];

            columns.forEach(colName => {
              const nilai = parseNumber(row[colName]);
              if (nilai > 0 || row[colName] !== undefined) {
                nilaiList.push({
                  nilai: nilai,
                  nama: colName
                });
              }
            });

            if (nilaiList.length > 0) {
              komponenDinamisData[baseName] = nilaiList;
            }
          });

          const nilaiData: NilaiImportData = {
            nisn: String(row['NISN']).trim(),
            nama: String(row['Nama']).trim(),
            tugas: tugasData,
            uts: parseNumber(row['UTS']),
            uas: parseNumber(row['UAS']),
            komponenDinamis: Object.keys(komponenDinamisData).length > 0 ? komponenDinamisData : undefined
          };

          validData.push(nilaiData);
        });

        if (validData.length === 0 && errors.length === 0) {
          resolve({
            success: false,
            errors: ['File Excel kosong atau format tidak sesuai']
          });
          return;
        }

        resolve({
          success: true,
          data: validData,
          errors: errors.length > 0 ? errors : undefined
        });

      } catch (error) {
        resolve({
          success: false,
          errors: [`Error membaca file: ${error instanceof Error ? error.message : 'Unknown error'}`]
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        errors: ['Gagal membaca file']
      });
    };

    reader.readAsBinaryString(file);
  });
};

export const generateTemplateExcelNilai = (muridList: any[], mapelName: string, kelasName: string, komponenDinamis?: Array<{ id: string; nama: string; persentase: number; hasNilai?: boolean }>) => {
  const generateBaseTemplateData = (murid?: any) => {
    const baseData: any = {
      'NISN': murid?.nisn || '1234567890',
      'Nama': murid?.name || 'Contoh Murid 1',
      'Tugas 1': 0,
      'Tugas 2': 0,
      'Tugas 3': 0,
      'Tugas 4': 0,
      'Tugas 5': 0
    };

    if (komponenDinamis && komponenDinamis.length > 0) {
      komponenDinamis.forEach(komponen => {
        if (komponen.hasNilai) {
          baseData[`${komponen.nama} 1`] = 0;
          baseData[`${komponen.nama} 2`] = 0;
          baseData[`${komponen.nama} 3`] = 0;
        } else {
          baseData[komponen.nama] = 0;
        }
      });
    }

    baseData['UTS'] = 0;
    baseData['UAS'] = 0;

    return baseData;
  };

  if (!muridList || muridList.length === 0) {
    const defaultData = [generateBaseTemplateData()];

    const ws = XLSX.utils.json_to_sheet(defaultData);
    const dynamicColCount = komponenDinamis ? komponenDinamis.reduce((acc, k) => acc + (k.hasNilai ? 3 : 1), 0) : 0;
    const totalWidths = 9 + dynamicColCount;

    const widths = Array(totalWidths).fill({ wch: 12 });
    widths[0] = { wch: 15 };
    widths[1] = { wch: 25 };

    ws['!cols'] = widths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Nilai');

    XLSX.writeFile(wb, `Template_Nilai_${mapelName.replace(/\s+/g, '_')}.xlsx`);
    return;
  }

  const templateData = muridList.map(murid => generateBaseTemplateData(murid));

  const ws = XLSX.utils.json_to_sheet(templateData);
  const dynamicColCount = komponenDinamis ? komponenDinamis.reduce((acc, k) => acc + (k.hasNilai ? 3 : 1), 0) : 0;
  const totalWidths = 9 + dynamicColCount;

  const widths = Array(totalWidths).fill({ wch: 12 });
  widths[0] = { wch: 15 };
  widths[1] = { wch: 25 };

  ws['!cols'] = widths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Nilai');

  const fileName = `Template_Nilai_${mapelName.replace(/\s+/g, '_')}_${kelasName.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const checkDuplicatesNilai = (
  importData: NilaiImportData[],
  muridList: any[]
): { duplicates: string[], cleanData: NilaiImportData[], notFoundMurid: string[] } => {
  const duplicates: string[] = [];
  const notFoundMurid: string[] = [];
  const cleanData: NilaiImportData[] = [];

  importData.forEach((data) => {
    const murid = muridList.find(m => m.nisn === data.nisn);

    if (!murid) {
      notFoundMurid.push(`NISN ${data.nisn} (${data.nama}) tidak ditemukan dalam data murid`);
    } else {
      cleanData.push(data);
    }
  });

  return { duplicates, cleanData, notFoundMurid };
};
