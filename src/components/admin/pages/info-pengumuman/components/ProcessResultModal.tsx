import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../../ui/Table';
import { getGraduationKelasTextSync, getNonMaxTingkatLabel } from '../../../../../utils/jenjangPendidikanUtils';

interface ProcessResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  processResults: {
    success: boolean;
    kenaikanResults: any[];
    kelulusanResults: any[];
    newAlumniCount: number;
    message: string;
  };
}

const ProcessResultModal: React.FC<ProcessResultModalProps> = ({
  isOpen,
  onClose,
  processResults
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hasil Proses Kenaikan Kelas & Kelulusan"
      size="xl"
    >
      <div className="space-y-6">
        <div className={`p-4 border rounded-lg ${
          processResults.success ? 
            'bg-emerald-50 border-emerald-200' : 
            'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            {processResults.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 mr-3" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            )}
            <div>
              <h3 className={`font-medium ${
                processResults.success ? 'text-emerald-900' : 'text-red-900'
              }`}>
                {processResults.success ? 'Proses Berhasil Diselesaikan!' : 'Proses Gagal!'}
              </h3>
              <p className={`text-sm ${
                processResults.success ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {processResults.message}
              </p>
            </div>
          </div>
        </div>

        {processResults.success && (processResults.kenaikanResults.length > 0 || processResults.kelulusanResults.length > 0) && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Ringkasan Hasil:</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 text-center border-l-4 border-l-emerald-500">
                <p className="text-2xl font-bold text-emerald-600">
                  {processResults.kenaikanResults.filter(r => r.isNaikKelas).length}
                </p>
                <p className="text-sm text-emerald-700">Naik Kelas</p>
              </Card>
              <Card className="p-4 text-center border-l-4 border-l-red-500">
                <p className="text-2xl font-bold text-red-600">
                  {processResults.kenaikanResults.filter(r => !r.isNaikKelas).length}
                </p>
                <p className="text-sm text-red-700">Tidak Naik Kelas</p>
              </Card>
              <Card className="p-4 text-center border-l-4 border-l-purple-500">
                <p className="text-2xl font-bold text-purple-600">
                  {processResults.kelulusanResults.filter(r => r.isLulus).length}
                </p>
                <p className="text-sm text-purple-700">Lulus</p>
              </Card>
              <Card className="p-4 text-center border-l-4 border-l-orange-500">
                <p className="text-2xl font-bold text-orange-600">
                  {processResults.newAlumniCount}
                </p>
                <p className="text-sm text-orange-700">Alumni Baru</p>
              </Card>
            </div>

            {/* Hasil Kenaikan Kelas */}
            {processResults.kenaikanResults.length > 0 && (
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-3">Hasil Kenaikan Kelas ({getNonMaxTingkatLabel()}):</h5>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell header>Nama Murid</TableCell>
                        <TableCell header>Kelas Lama</TableCell>
                        <TableCell header>Kelas Baru</TableCell>
                        <TableCell header>Nilai Akhir</TableCell>
                        <TableCell header>Kehadiran</TableCell>
                        <TableCell header>Status</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processResults.kenaikanResults.map((result) => (
                        <TableRow key={result.muridId}>
                          <TableCell>
                            <div className="font-medium">{result.namaLengkap}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">{result.kelasLama}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.isNaikKelas ? 'success' : 'danger'}>
                              {result.kelasBaru}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-center font-bold">
                              {result.nilaiAkhir.toFixed(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              {result.kehadiran.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.isNaikKelas ? 'success' : 'danger'}>
                              {result.isNaikKelas ? 'NAIK KELAS' : 'TIDAK NAIK'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Hasil Kelulusan */}
            {processResults.kelulusanResults.length > 0 && (
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-3">Hasil Kelulusan ({getGraduationKelasText(true)}):</h5>
                <div className="max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell header>Nama Murid</TableCell>
                        <TableCell header>Kelas</TableCell>
                        <TableCell header>Nilai Akhir</TableCell>
                        <TableCell header>Kehadiran</TableCell>
                        <TableCell header>Status</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processResults.kelulusanResults.map((result) => (
                        <TableRow key={result.muridId}>
                          <TableCell>
                            <div className="font-medium">{result.namaLengkap}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="info">{result.kelas}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-center font-bold">
                              {result.nilaiAkhir.toFixed(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              {result.kehadiran.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.isLulus ? 'success' : 'danger'}>
                              {result.isLulus ? 'LULUS' : 'TIDAK LULUS'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {processResults.success && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Yang Telah Dilakukan Sistem:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• ✅ Mengevaluasi semua murid berdasarkan nilai rata-rata ≥ 70 dan kehadiran ≥ 75%</li>
              <li>• ✅ Memindahkan murid yang naik kelas ke tingkat berikutnya</li>
              <li>• ✅ Menghapus murid yang lulus dari sistem aktif dan menambahkan ke alumni</li>
              <li>• ✅ Murid yang tidak lulus tetap di kelas yang sama</li>
              <li>• ✅ Murid yang tidak naik kelas tetap di tingkat yang sama</li>
              <li>• ✅ Membuat kelas baru otomatis jika diperlukan</li>
              <li>• ✅ Membuat dan mengaktifkan tahun ajaran baru</li>
              <li>• ✅ Menonaktifkan tahun ajaran sebelumnya</li>
              <li>• ✅ Melepas jabatan wali kelas dari guru {getGraduationKelasTextSync()}</li>
              <li>• ⚠️ Kelas yang belum tersedia perlu dibuat manual oleh admin</li>
              <li>• ⚠️ Guru bekas wali {getGraduationKelasTextSync()} dapat diatur ulang sebagai wali kelas lain</li>
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProcessResultModal;