import React, { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';
import Badge from '../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import * as XLSX from 'xlsx';

interface ImportAbsensiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ImportedAbsensiData[]) => void;
  muridList: { id: string; nisn: string; name: string }[];
}

export interface ImportedAbsensiData {
  nisn: string;
  name: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alfa';
  keterangan?: string;
}

const ImportAbsensiModal: React.FC<ImportAbsensiModalProps> = ({
  isOpen,
  onClose,
  onImport,
  muridList
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportedAbsensiData[]>([]);
  const [error, setError] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{
    valid: number;
    invalid: number;
    notFound: number;
  }>({ valid: 0, invalid: 0, notFound: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('File harus berformat Excel (.xlsx atau .xls)');
      return;
    }

    setFile(selectedFile);
    setError('');
    processFile(selectedFile);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

        if (jsonData.length === 0) {
          setError('File Excel kosong');
          return;
        }

        const requiredColumns = ['nisn', 'nama', 'status'];
        const firstRow = jsonData[0];
        const hasRequiredColumns = requiredColumns.every(col =>
          Object.keys(firstRow).some(key => key.toLowerCase() === col)
        );

        if (!hasRequiredColumns) {
          setError('Format Excel tidak sesuai. Kolom yang diperlukan: NISN, Nama, Status');
          return;
        }

        const processedData: ImportedAbsensiData[] = jsonData.map((row: any) => {
          const nisn = String(row.nisn || row.NISN || '').trim();
          const name = String(row.nama || row.Nama || row.name || row.Name || '').trim();
          let status = String(row.status || row.Status || '').toLowerCase().trim();
          const keterangan = String(row.keterangan || row.Keterangan || '').trim();

          if (!['hadir', 'izin', 'sakit', 'alfa'].includes(status)) {
            status = 'alfa';
          }

          return {
            nisn,
            name,
            status: status as 'hadir' | 'izin' | 'sakit' | 'alfa',
            keterangan: keterangan || undefined
          };
        });

        validateData(processedData);
        setPreviewData(processedData);
      } catch (err) {
        setError('Gagal membaca file Excel. Pastikan format file benar.');
        console.error(err);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: ImportedAbsensiData[]) => {
    let valid = 0;
    let invalid = 0;
    let notFound = 0;

    data.forEach(row => {
      if (!row.nisn || !row.name) {
        invalid++;
        return;
      }

      const murid = muridList.find(m => m.nisn === row.nisn);
      if (!murid) {
        notFound++;
      } else {
        valid++;
      }
    });

    setValidationResult({ valid, invalid, notFound });
  };

  const handleImport = () => {
    if (previewData.length === 0) {
      setError('Tidak ada data untuk diimport');
      return;
    }

    const validData = previewData.filter(row => {
      const murid = muridList.find(m => m.nisn === row.nisn);
      return murid && row.nisn && row.name;
    });

    if (validData.length === 0) {
      setError('Tidak ada data valid untuk diimport');
      return;
    }

    onImport(validData);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setError('');
    setValidationResult({ valid: 0, invalid: 0, notFound: 0 });
    onClose();
  };

  const downloadTemplate = () => {
    // Create template with actual student data from the class
    const template = muridList.map(murid => ({
      nisn: murid.nisn,
      nama: murid.name,
      status: 'hadir',
      keterangan: ''
    }));

    // If no students in the class, provide a sample row
    if (template.length === 0) {
      template.push({
        nisn: '1234567890',
        nama: 'Contoh Nama Murid',
        status: 'hadir',
        keterangan: 'Opsional'
      });
    }

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Absensi');
    XLSX.writeFile(wb, 'template-import-absensi.xlsx');
  };

  const getRowStatus = (row: ImportedAbsensiData) => {
    const murid = muridList.find(m => m.nisn === row.nisn);

    if (!row.nisn || !row.name) {
      return { status: 'invalid', message: 'Data tidak lengkap', variant: 'danger' as const };
    }

    if (!murid) {
      return { status: 'notfound', message: 'NISN tidak ditemukan', variant: 'warning' as const };
    }

    return { status: 'valid', message: 'Valid', variant: 'success' as const };
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Data Absensi" size="xl">
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Format File Excel</h4>
          <p className="text-sm text-blue-700 mb-3">
            File Excel harus memiliki kolom berikut:
          </p>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li><strong>nisn</strong> - NISN murid (wajib)</li>
            <li><strong>nama</strong> - Nama murid (wajib)</li>
            <li><strong>status</strong> - Status kehadiran: hadir, izin, sakit, atau alfa (wajib)</li>
            <li><strong>keterangan</strong> - Keterangan tambahan (opsional)</li>
          </ul>
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-xs text-green-700">
              <CheckCircle size={14} className="inline mr-1" />
              Template sudah berisi data NISN dan Nama murid sesuai kelas ini ({muridList.length} murid)
            </p>
          </div>
          <Button
            onClick={downloadTemplate}
            variant="secondary"
            size="sm"
            className="mt-3 flex items-center"
          >
            <FileSpreadsheet size={16} className="mr-2" />
            Download Template dengan Data Murid
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih File Excel
          </label>
          <div className="flex items-center space-x-3">
            <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
              <Upload size={20} className="text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                {file ? file.name : 'Pilih file atau drag & drop di sini'}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {file && (
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                  setValidationResult({ valid: 0, invalid: 0, notFound: 0 });
                }}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {previewData.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 mb-1">Data Valid</p>
                    <p className="text-2xl font-bold text-emerald-900">{validationResult.valid}</p>
                  </div>
                  <CheckCircle className="text-emerald-600" size={24} />
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 mb-1">NISN Tidak Ditemukan</p>
                    <p className="text-2xl font-bold text-yellow-900">{validationResult.notFound}</p>
                  </div>
                  <AlertCircle className="text-yellow-600" size={24} />
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 mb-1">Data Tidak Valid</p>
                    <p className="text-2xl font-bold text-red-900">{validationResult.invalid}</p>
                  </div>
                  <AlertCircle className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Preview Data ({previewData.length} baris)</h4>
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell header>No</TableCell>
                      <TableCell header>NISN</TableCell>
                      <TableCell header>Nama</TableCell>
                      <TableCell header>Status</TableCell>
                      <TableCell header>Keterangan</TableCell>
                      <TableCell header>Validasi</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => {
                      const rowStatus = getRowStatus(row);
                      return (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{row.nisn || '-'}</TableCell>
                          <TableCell>{row.name || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.status === 'hadir' ? 'success' :
                                row.status === 'izin' ? 'warning' :
                                row.status === 'sakit' ? 'info' : 'danger'
                              }
                            >
                              {row.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.keterangan || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={rowStatus.variant}>
                              {rowStatus.message}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button onClick={handleClose} variant="secondary">
            Batal
          </Button>
          <Button
            onClick={handleImport}
            disabled={previewData.length === 0 || validationResult.valid === 0}
          >
            <Upload size={16} className="mr-2" />
            Import Data ({validationResult.valid} valid)
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportAbsensiModal;
