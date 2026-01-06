import React, { useMemo } from 'react';
import { Printer, Download, FileText, User, GraduationCap, Award, BookOpen, Calendar } from 'lucide-react';
import Modal from '../../../../../ui/Modal';
import Button from '../../../../../ui/Button';
import Card from '../../../../../ui/Card';
import { User as UserType } from '../../../../../../types';
import { getGradeColor, getNilaiMinimalSettings } from '../../../../../../utils/nilaiUtils';
import { isMaxTingkatSync, formatTingkatKelas } from '../../../../../../utils/jenjangPendidikanUtils';
import { useKomponenNilai } from '../../../../../../hooks/useKomponenNilai';
import { usePengaturanNilaiMinimal } from '../../../../../../hooks/usePengaturanNilaiMinimal';

interface RaportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: UserType | null;
  targetKelas: any;
  selectedSemester: number;
  selectedTahunAjaran: string;
  generateRaportData: (muridId: string) => any;
  onPrintRaport: (murid: UserType) => void;
  onDownloadRaportPDF: (murid: UserType) => void;
  onExportRaport: (murid: UserType) => void;
}

const RaportDetailModal: React.FC<RaportDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  targetKelas,
  selectedSemester: _selectedSemester,
  selectedTahunAjaran,
  generateRaportData,
  onPrintRaport,
  onDownloadRaportPDF,
  onExportRaport
}) => {
  // Hook harus dipanggil sebelum early return
  const { komponenNilai: semuaKomponen } = useKomponenNilai();
  const { pengaturanNilaiMinimal } = usePengaturanNilaiMinimal();
  const nilaiMinimalSettings = useMemo(() => getNilaiMinimalSettings(), [pengaturanNilaiMinimal]);

  if (!selectedMurid) return null;

  const raportData = generateRaportData(selectedMurid.id);
  if (!raportData) return null;

  // Filter komponen dinamis (yang bukan default: Kehadiran, Tugas, UTS, UAS)
  const komponenDinamis = semuaKomponen.filter(k => 
    !['Kehadiran', 'Tugas', 'UTS', 'UAS'].includes(k.nama) && !k.isDefault
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Student Info Header - Optimized for All Devices */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-400 to-blue-600 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
          <div className="relative p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-white bg-opacity-25 backdrop-blur-sm rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {getInitials(raportData.student.name)}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-emerald-500 rounded-full p-2 sm:p-2.5 border-4 border-white shadow-lg">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>

              {/* Info - Better Grid Layout for Desktop/Tablet */}
              <div className="flex-1 w-full sm:w-auto">
                <h2 className="text-xl sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-center sm:text-left text-white drop-shadow-lg">
                  {raportData.student.name}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-white">
                  <div className="flex items-center justify-start sm:justify-start gap-2 text-sm sm:text-base md:text-lg">
                    <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    </div>
                    <span className="font-medium">NISN: {raportData.student.nisn}</span>
                  </div>
                  <div className="flex items-center justify-start sm:justify-start gap-2 text-sm sm:text-base md:text-lg">
                    <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg">
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    </div>
                    <span className="font-medium">Kelas {raportData.kelas.name}</span>
                  </div>
                  <div className="flex items-center justify-start sm:justify-start gap-2 text-sm sm:text-base md:text-lg">
                    <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg">
                      <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    </div>
                    <span className="font-medium">Semester {raportData.semester} ({raportData.semester === 1 ? 'Ganjil' : 'Genap'})</span>
                  </div>
                  <div className="flex items-center justify-start sm:justify-start gap-2 text-sm sm:text-base md:text-lg">
                    <div className="p-1.5 sm:p-2 bg-white bg-opacity-20 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    </div>
                    <span className="font-medium">Tahun Ajaran: {selectedTahunAjaran || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Grade - Mobile Optimized */}
        <Card className="p-4 sm:p-6 border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 text-center">Ringkasan Prestasi</h4>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="text-center p-3 sm:p-4 bg-white rounded-xl shadow-sm">
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-1 sm:mb-2">
                {raportData.overallGrade.toFixed(1)}
              </div>
              <div className="text-xs sm:text-sm text-indigo-700 font-medium">Rata-rata Nilai</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white rounded-xl shadow-sm">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">
                {raportData.attendanceRate.toFixed(1)}%
              </div>
              <div className="text-xs sm:text-sm text-purple-700 font-medium">Tingkat Kehadiran</div>
            </div>
          </div>
        </Card>

        {/* Keputusan Kenaikan Kelas - Mobile Optimized */}
        {raportData.showKenaikanKelas && (
          <Card className={`p-4 sm:p-6 border-2 ${
            raportData.isNaikKelas 
              ? 'bg-emerald-50 border-emerald-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <h4 className={`font-bold text-center mb-3 sm:mb-4 text-base sm:text-lg ${
              raportData.isNaikKelas ? 'text-emerald-900' : 'text-red-900'
            }`}>
              {isMaxTingkatSync(targetKelas?.tingkat) ? 'KEPUTUSAN KELULUSAN' : 'KEPUTUSAN KENAIKAN KELAS'}
            </h4>
            <div className={`text-center p-3 sm:p-4 rounded-lg ${
              raportData.isNaikKelas 
                ? 'bg-emerald-100 border border-emerald-300' 
                : 'bg-red-100 border border-red-300'
            }`}>
              <p className={`text-xl sm:text-2xl font-bold mb-2 ${
                raportData.isNaikKelas ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {(() => {
                  if (isMaxTingkatSync(targetKelas?.tingkat)) {
                    return raportData.isNaikKelas ? 'LULUS' : 'TIDAK LULUS';
                  } else if (raportData.isNaikKelas) {
                    const nextTingkat = raportData.kelas.tingkat + 1;
                    const nextTingkatLabel = formatTingkatKelas(nextTingkat);
                    return `NAIK KE KELAS SELANJUTNYA`;
                  } else {
                    return 'TIDAK NAIK KELAS';
                  }
                })()}
              </p>
              <p className={`text-xs sm:text-sm ${
                raportData.isNaikKelas ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {raportData.isNaikKelas
                  ? (isMaxTingkatSync(targetKelas?.tingkat) ?
                      `Memenuhi syarat kelulusan dengan nilai rata-rata ≥ ${nilaiMinimalSettings.nilaiAkhirMinimal} dan kehadiran ≥ ${nilaiMinimalSettings.tingkatKehadiranMinimal}%` :
                      `Memenuhi syarat kenaikan kelas dengan nilai rata-rata ≥ ${nilaiMinimalSettings.nilaiAkhirMinimal} dan kehadiran ≥ ${nilaiMinimalSettings.tingkatKehadiranMinimal}%`)
                  : (isMaxTingkatSync(targetKelas?.tingkat) ?
                      `Belum memenuhi syarat kelulusan (nilai rata-rata < ${nilaiMinimalSettings.nilaiAkhirMinimal} atau kehadiran < ${nilaiMinimalSettings.tingkatKehadiranMinimal}%)` :
                      `Belum memenuhi syarat kenaikan kelas (nilai rata-rata < ${nilaiMinimalSettings.nilaiAkhirMinimal} atau kehadiran < ${nilaiMinimalSettings.tingkatKehadiranMinimal}%)`)
                }
              </p>
            </div>
            
            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Rata-rata Nilai</p>
                <p className={`text-base sm:text-lg font-bold ${
                  raportData.overallGrade >= nilaiMinimalSettings.nilaiAkhirMinimal ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {raportData.overallGrade.toFixed(1)} {raportData.overallGrade >= nilaiMinimalSettings.nilaiAkhirMinimal ? '✓' : '✗'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Minimal {nilaiMinimalSettings.nilaiAkhirMinimal}</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-white rounded-lg">
                <p className="text-gray-600 text-xs sm:text-sm mb-1">Tingkat Kehadiran</p>
                <p className={`text-base sm:text-lg font-bold ${
                  raportData.attendanceRate >= nilaiMinimalSettings.tingkatKehadiranMinimal ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {raportData.attendanceRate.toFixed(1)}% {raportData.attendanceRate >= nilaiMinimalSettings.tingkatKehadiranMinimal ? '✓' : '✗'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Minimal {nilaiMinimalSettings.tingkatKehadiranMinimal}%</p>
              </div>
            </div>
          </Card>
        )}

        {/* Grades Table - Mobile Card View */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Detail Nilai per Mata Pelajaran</h4>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left text-sm font-medium">Mata Pelajaran</th>
                  <th className="border border-gray-300 p-2 text-center text-sm font-medium">Kehadiran</th>
                  <th className="border border-gray-300 p-2 text-center text-sm font-medium">Tugas</th>
                  <th className="border border-gray-300 p-2 text-center text-sm font-medium">UTS</th>
                  <th className="border border-gray-300 p-2 text-center text-sm font-medium">UAS</th>
                  {komponenDinamis.map((komponen) => (
                    <th key={komponen.id} className="border border-gray-300 p-2 text-center text-sm font-medium">
                      {komponen.nama}
                    </th>
                  ))}
                  <th className="border border-gray-300 p-2 text-center text-sm font-medium">Nilai Akhir</th>
                  <th className="border border-gray-300 p-2 text-center text-sm font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {raportData.subjects.map((subject: any) => (
                  <tr key={subject.mapelId}>
                    <td className="border border-gray-300 p-2 text-sm">{subject.mapelName}</td>
                    <td className="border border-gray-300 p-2 text-center text-sm">
                      {subject.kehadiran.toFixed(1)}
                    </td>
                    <td className="border border-gray-300 p-2 text-center text-sm">
                      {subject.rataTugas.toFixed(1)}
                    </td>
                    <td className="border border-gray-300 p-2 text-center text-sm">
                      {subject.uts !== null && subject.uts !== undefined ? subject.uts : '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-center text-sm">
                      {subject.uas !== null && subject.uas !== undefined ? subject.uas : '-'}
                    </td>
                    {komponenDinamis.map((komponen) => {
                      const komponenData = subject.komponenDinamis?.find(
                        (kd: any) => kd.komponenNama === komponen.nama
                      );
                      const nilaiKomponen = komponenData?.rataValues;
                      return (
                        <td key={`${subject.mapelId}-${komponen.id}`} className="border border-gray-300 p-2 text-center text-sm">
                          {nilaiKomponen !== undefined && nilaiKomponen !== null ? nilaiKomponen.toFixed(1) : '-'}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 p-2 text-center text-sm font-bold">
                      {subject.nilaiAkhir !== null && subject.nilaiAkhir !== undefined ? subject.nilaiAkhir.toFixed(1) : '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {subject.grade ? (
                        <div className={`inline-flex px-2 py-1 rounded text-xs font-bold ${getGradeColor(subject.grade)}`}>
                          {subject.grade}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-3">
            {raportData.subjects.map((subject: any) => (
              <Card key={subject.mapelId} className="p-4 border-0 shadow-md">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                  <h5 className="font-semibold text-sm sm:text-base text-gray-900">{subject.mapelName}</h5>
                  {subject.grade && (
                    <div className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${getGradeColor(subject.grade)}`}>
                      {subject.grade}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 mb-3">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Kehadiran</p>
                    <p className="text-sm font-semibold text-gray-900">{subject.kehadiran.toFixed(1)}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Tugas</p>
                    <p className="text-sm font-semibold text-gray-900">{subject.rataTugas.toFixed(1)}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">UTS</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {subject.uts !== null && subject.uts !== undefined ? subject.uts : '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">UAS</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {subject.uas !== null && subject.uas !== undefined ? subject.uas : '-'}
                    </p>
                  </div>
                </div>

                {komponenDinamis.length > 0 && (
                  <div className={`grid gap-2 mb-3 ${
                    komponenDinamis.length === 1 
                      ? 'grid-cols-1' 
                      : komponenDinamis.length === 2
                      ? 'grid-cols-2'
                      : komponenDinamis.length === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-2 sm:grid-cols-4'
                  }`}>
                    {komponenDinamis.map((komponen) => {
                      const komponenData = subject.komponenDinamis?.find(
                        (kd: any) => kd.komponenNama === komponen.nama
                      );
                      const nilaiKomponen = komponenData?.rataValues;
                      return (
                        <div key={komponen.id} className="bg-blue-50 p-2 rounded-lg">
                          <p className="text-xs text-blue-600 mb-1">{komponen.nama}</p>
                          <p className="text-sm font-semibold text-blue-900">
                            {nilaiKomponen !== undefined && nilaiKomponen !== null ? nilaiKomponen.toFixed(1) : '-'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Nilai Akhir</span>
                    <span className="text-lg font-bold text-indigo-600">
                      {subject.nilaiAkhir !== null && subject.nilaiAkhir !== undefined ? subject.nilaiAkhir.toFixed(1) : '-'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-20 sm:pb-4 pt-4 sm:pt-6 border-t border-gray-200">
          <Button 
            onClick={() => onPrintRaport(selectedMurid)}
            fullWidth
            className="flex items-center justify-center"
          >
            <Printer size={16} className="mr-2" />
            <span className="text-sm sm:text-base">Print</span>
          </Button>
          <Button 
            onClick={() => onDownloadRaportPDF(selectedMurid)}
            variant="secondary"
            fullWidth
            className="flex items-center justify-center"
          >
            <Download size={16} className="mr-2" />
            <span className="text-sm sm:text-base">PDF</span>
          </Button>
          <Button 
            onClick={() => onExportRaport(selectedMurid)}
            variant="success" 
            fullWidth
            className="flex items-center justify-center"
          >
            <FileText size={16} className="mr-2" />
            <span className="text-sm sm:text-base">Excel</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RaportDetailModal;
