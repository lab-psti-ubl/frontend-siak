import React, { useState, useRef } from 'react';
import { Upload, Download, X, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import Card from '../../../../../ui/Card';
import {
  parseExcelFileNilai,
  generateTemplateExcelNilai,
  NilaiImportData,
  checkDuplicatesNilai
} from '../../../../../../utils/excelNilaiImport';

interface ImportNilaiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: NilaiImportData[]) => void;
  muridList: any[];
  mapelName: string;
  kelasName: string;
  komponenDinamis?: Array<{ id: string; nama: string; persentase: number; hasNilai?: boolean }>;
}

const ImportNilaiModal: React.FC<ImportNilaiModalProps> = ({
  isOpen,
  onClose,
  onImport,
  muridList,
  mapelName,
  kelasName,
  komponenDinamis
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<NilaiImportData[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setErrors(['File harus berformat Excel (.xlsx atau .xls)']);
        return;
      }
      setFile(selectedFile);
      setErrors([]);
      setWarnings([]);
      setPreviewData(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrors([]);
    setWarnings([]);

    try {
      const result = await parseExcelFileNilai(file);

      if (!result.success || !result.data) {
        setErrors(result.errors || ['Gagal memproses file']);
        setIsProcessing(false);
        return;
      }

      const { duplicates, cleanData, notFoundMurid } = checkDuplicatesNilai(result.data, muridList);

      const allWarnings = [...duplicates, ...notFoundMurid];

      if (allWarnings.length > 0) {
        setWarnings(allWarnings);
      }

      if (cleanData.length === 0) {
        setErrors(['Tidak ada data valid untuk diimport. Pastikan NISN murid sesuai dengan data di kelas ini.']);
        setIsProcessing(false);
        return;
      }

      setPreviewData(cleanData);
      if (result.errors && result.errors.length > 0) {
        setWarnings([...allWarnings, ...result.errors]);
      }

    } catch (error) {
      setErrors([`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (previewData && previewData.length > 0) {
      onImport(previewData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData(null);
    setErrors([]);
    setWarnings([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDownloadTemplate = () => {
    generateTemplateExcelNilai(muridList, mapelName, kelasName, komponenDinamis);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Nilai dari Excel">
      <div className="space-y-6">
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">Informasi Import</h4>
              <p className="text-sm text-blue-800 mb-2">
                <strong>Mata Pelajaran:</strong> {mapelName}<br />
                <strong>Kelas:</strong> {kelasName}
              </p>
              <h5 className="font-medium text-blue-900 mb-1 mt-3">Petunjuk Import</h5>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Download template Excel (NISN dan Nama sudah otomatis terisi)</li>
                <li>Isi nilai di kolom yang tersedia</li>
                <li>Kolom nilai: Tugas 1-5 (atau lebih), Komponen Dinamis, UTS, UAS</li>
                <li>Bisa menambah kolom tugas baru (misal: Tugas 6, Tugas 7, dst)</li>
                <li>Format kolom tugas: "Tugas 1", "Tugas 2", "Tugas 3", dst</li>
                {komponenDinamis && komponenDinamis.length > 0 && (
                  <>
                    <li className="font-medium mt-2 ml-0 list-none">Komponen Nilai Dinamis:</li>
                    {komponenDinamis.map((k, idx) => (
                      <li key={idx} className="ml-6">
                        {k.hasNilai ? `${k.nama} 1, ${k.nama} 2, ${k.nama} 3 (nilai ganda)` : `${k.nama} (nilai tunggal)`}
                      </li>
                    ))}
                  </>
                )}
                <li>Jika nilai kosong atau tidak diisi, otomatis akan menjadi 0</li>
                <li>Upload file Excel yang sudah diisi</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Button
            variant="success"
            onClick={handleDownloadTemplate}
            className="w-full justify-center flex items-center"
          >
            <Download size={18} className="mr-2" />
            Download Template Excel
          </Button>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="excel-file-input-nilai"
            />
            <label htmlFor="excel-file-input-nilai" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">
                {file ? file.name : 'Klik untuk pilih file Excel'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Format: .xlsx atau .xls
              </p>
            </label>
          </div>

          {file && !previewData && (
            <Button
              onClick={handleProcessFile}
              disabled={isProcessing}
              className="w-full justify-center flex items-center"
            >
              <FileText size={18} className="mr-2" />
              {isProcessing ? 'Memproses...' : 'Proses File'}
            </Button>
          )}
        </div>

        {errors.length > 0 && (
          <Card className="bg-red-50 border-red-200">
            <div className="flex items-start space-x-3">
              <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-2">Error</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {warnings.length > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900 mb-2">Peringatan</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {previewData && previewData.length > 0 && (
          <Card className="bg-emerald-50 border-emerald-200">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-emerald-900">Preview Data</h4>
                  <p className="text-sm text-emerald-800">
                    Ditemukan {previewData.length} murid yang siap diimport
                  </p>
                </div>
              </div>

              <div className="border border-emerald-200 rounded-lg overflow-hidden bg-white">
                <div className="max-h-64 overflow-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-emerald-100 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-emerald-900 font-medium whitespace-nowrap">No</th>
                        <th className="px-2 py-2 text-left text-emerald-900 font-medium whitespace-nowrap">NISN</th>
                        <th className="px-2 py-2 text-left text-emerald-900 font-medium whitespace-nowrap">Nama</th>
                        {previewData.length > 0 && Object.keys(previewData[0].tugas).sort((a, b) => {
                          const numA = parseInt(a.replace('t', ''));
                          const numB = parseInt(b.replace('t', ''));
                          return numA - numB;
                        }).map(key => (
                          <th key={key} className="px-2 py-2 text-center text-emerald-900 font-medium whitespace-nowrap">
                            {key.toUpperCase()}
                          </th>
                        ))}
                        {previewData.length > 0 && previewData[0].komponenDinamis && Object.keys(previewData[0].komponenDinamis).map(kompName => (
                          <th key={kompName} className="px-2 py-2 text-center text-emerald-900 font-medium whitespace-nowrap bg-emerald-200">
                            {kompName}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center text-emerald-900 font-medium whitespace-nowrap">UTS</th>
                        <th className="px-2 py-2 text-center text-emerald-900 font-medium whitespace-nowrap">UAS</th>
                      </tr>
                    </thead>
                    <tbody className="text-emerald-800">
                      {previewData.slice(0, 10).map((nilai, index) => (
                        <tr key={index} className="border-t border-emerald-100 hover:bg-emerald-50">
                          <td className="px-2 py-2 whitespace-nowrap">{index + 1}</td>
                          <td className="px-2 py-2 whitespace-nowrap">{nilai.nisn}</td>
                          <td className="px-2 py-2 whitespace-nowrap">{nilai.nama}</td>
                          {Object.keys(nilai.tugas).sort((a, b) => {
                            const numA = parseInt(a.replace('t', ''));
                            const numB = parseInt(b.replace('t', ''));
                            return numA - numB;
                          }).map(key => (
                            <td key={key} className="px-2 py-2 text-center whitespace-nowrap">
                              {nilai.tugas[key]}
                            </td>
                          ))}
                          {nilai.komponenDinamis && Object.entries(nilai.komponenDinamis).map(([kompName, nilaiArray]) => (
                            <td key={kompName} className="px-2 py-2 text-center whitespace-nowrap bg-emerald-50">
                              {nilaiArray.map(n => n.nilai).join(', ')}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center whitespace-nowrap">{nilai.uts}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{nilai.uas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 10 && (
                  <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 text-center">
                    <p className="text-xs text-emerald-700">
                      ... dan {previewData.length - 10} murid lainnya
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="pb-14 sm:pb-0 flex space-x-3">
          <Button
            variant="danger"
            onClick={handleClose}
            className="flex-1 justify-center"
          >
            Batal
          </Button>
          {previewData && previewData.length > 0 && (
            <Button
              onClick={handleImport}
              className="flex-1 justify-center flex items-center"
            >
              <CheckCircle size={18} className="mr-2" />
              Import {previewData.length} Siswa
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImportNilaiModal;
