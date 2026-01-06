import React, { useMemo } from 'react';
import { Printer, Download, FileText, User, GraduationCap, Award, BookOpen } from 'lucide-react';
import { User as UserType, Alumni } from '../../../../../types';
import { RaportData } from '../../../../../utils/raport';
import Modal from '../../../../ui/Modal';
import Button from '../../../../ui/Button';
import Badge from '../../../../ui/Badge';
import Card from '../../../../ui/Card';
import { getGradeColor } from '../../../../../utils/nilaiUtils';

interface RaportAlumniModalProps {
  isOpen: boolean;
  onClose: () => void;
  murid: UserType | null;
  raportData: RaportData | null;
  alumniData: Alumni | null;
  onPrint: () => void;
  onDownload: () => void;
  onExport: () => void;
}

const RaportAlumniModal: React.FC<RaportAlumniModalProps> = ({
  isOpen,
  onClose,
  murid,
  raportData,
  alumniData,
  onPrint,
  onDownload,
  onExport
}) => {

  if (!murid || !raportData) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Get all dynamic components from subjects
  const semuaKomponenFromSubjects = useMemo(() => {
    const komponenSet = new Set<string>();
    raportData.subjects.forEach((subject: any) => {
      if (subject.komponenDinamis) {
        subject.komponenDinamis.forEach((kd: any) => {
          komponenSet.add(kd.komponenNama);
        });
      }
    });
    return Array.from(komponenSet);
  }, [raportData.subjects]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Student Info Header - Optimized for All Devices */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 rounded-2xl shadow-lg">
          <div className="absolute inset-0 bg-black opacity-5"></div>
          <div className="relative p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-slate-500 rounded-2xl border-2 border-slate-400 shadow-md flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {getInitials(raportData.student.name)}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-slate-600 rounded-full p-2 sm:p-2.5 border-2 border-white shadow-md">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>

              {/* Info - Better Grid Layout for Desktop/Tablet */}
              <div className="flex-1 w-full sm:w-auto">
                <h2 className="text-xl sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-center sm:text-left text-white">
                  {raportData.student.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-slate-100">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                    <div className="p-1.5 sm:p-2 bg-white bg-opacity-10 rounded-lg">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="font-medium">NISN: {raportData.student.nisn}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                    <div className="p-1.5 sm:p-2 bg-white bg-opacity-10 rounded-lg">
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="font-medium">Kelas {raportData.kelas.name}</span>
                  </div>
                  {alumniData && (
                    <>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                        <div className="p-1.5 sm:p-2 bg-white bg-opacity-10 rounded-lg">
                          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="font-medium">Peringkat: {alumniData.peringkatKelas} (Sekolah: #{alumniData.peringkatSekolah})</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                    <Badge variant="success" className="text-xs sm:text-sm">LULUS</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Grade - Mobile Optimized */}
        <Card className="p-4 sm:p-6 border border-slate-200 shadow-sm bg-white">
          <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-4 text-center">Ringkasan Prestasi</h4>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-2xl sm:text-3xl font-bold text-slate-700 mb-1 sm:mb-2">
                {raportData.overallGrade.toFixed(1)}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium">Rata-rata Nilai</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-2xl sm:text-3xl font-bold text-slate-700 mb-1 sm:mb-2">
                {raportData.attendanceRate.toFixed(1)}%
              </div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium">Tingkat Kehadiran</div>
            </div>
          </div>
        </Card>

        {/* Keputusan Kelulusan - Mobile Optimized */}
        <Card className="p-4 sm:p-6 border border-slate-200 shadow-sm bg-slate-50">
          <h4 className="font-semibold text-center mb-3 sm:mb-4 text-base sm:text-lg text-slate-900">
            STATUS KELULUSAN
          </h4>
          <div className="text-center p-3 sm:p-4 rounded-lg bg-white border border-slate-200">
            <p className="text-xl sm:text-2xl font-bold mb-2 text-slate-700">
              LULUS
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Memenuhi syarat kelulusan dengan nilai rata-rata ≥ 70 dan kehadiran ≥ 75%
            </p>
          </div>
          
          <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="text-center p-2 sm:p-3 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-600 text-xs sm:text-sm mb-1">Rata-rata Nilai</p>
              <p className="text-base sm:text-lg font-bold text-slate-700">
                {raportData.overallGrade.toFixed(1)} ✓
              </p>
              <p className="text-xs text-slate-500 mt-1">Minimal 70</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-white rounded-lg border border-slate-200">
              <p className="text-slate-600 text-xs sm:text-sm mb-1">Tingkat Kehadiran</p>
              <p className="text-base sm:text-lg font-bold text-slate-700">
                {raportData.attendanceRate.toFixed(1)}% ✓
              </p>
              <p className="text-xs text-slate-500 mt-1">Minimal 75%</p>
            </div>
          </div>
        </Card>

        {/* Grades Table - Mobile Card View */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Detail Nilai per Mata Pelajaran</h4>
          
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
                  {semuaKomponenFromSubjects.map((komponen) => (
                    <th key={komponen} className="border border-gray-300 p-2 text-center text-sm font-medium">
                      {komponen}
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
                    {semuaKomponenFromSubjects.map((komponen) => {
                      const komponenData = subject.komponenDinamis?.find(
                        (kd: any) => kd.komponenNama === komponen
                      );
                      const nilaiKomponen = komponenData?.rataValues;
                      return (
                        <td key={`${subject.mapelId}-${komponen}`} className="border border-gray-300 p-2 text-center text-sm">
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
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                  <h5 className="font-semibold text-sm sm:text-base text-slate-900">{subject.mapelName}</h5>
                  {subject.grade && (
                    <div className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${getGradeColor(subject.grade)}`}>
                      {subject.grade}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-3 mb-3">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Kehadiran</p>
                    <p className="text-sm font-semibold text-slate-900">{subject.kehadiran.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Tugas</p>
                    <p className="text-sm font-semibold text-slate-900">{subject.rataTugas.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">UTS</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {subject.uts !== null && subject.uts !== undefined ? subject.uts : '-'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">UAS</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {subject.uas !== null && subject.uas !== undefined ? subject.uas : '-'}
                    </p>
                  </div>
                </div>

                {semuaKomponenFromSubjects.length > 0 && (
                  <div className={`grid gap-2 mb-3 ${
                    semuaKomponenFromSubjects.length === 1 
                      ? 'grid-cols-1' 
                      : semuaKomponenFromSubjects.length === 2
                      ? 'grid-cols-2'
                      : semuaKomponenFromSubjects.length === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-2 sm:grid-cols-4'
                  }`}>
                    {semuaKomponenFromSubjects.map((komponen) => {
                      const komponenData = subject.komponenDinamis?.find(
                        (kd: any) => kd.komponenNama === komponen
                      );
                      const nilaiKomponen = komponenData?.rataValues;
                      return (
                        <div key={komponen} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-600 mb-1">{komponen}</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {nilaiKomponen !== undefined && nilaiKomponen !== null ? nilaiKomponen.toFixed(1) : '-'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Nilai Akhir</span>
                    <span className="text-lg font-bold text-slate-700">
                      {subject.nilaiAkhir !== null && subject.nilaiAkhir !== undefined ? subject.nilaiAkhir.toFixed(1) : '-'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 sm:pt-6 border-t border-slate-200">
          <Button 
            onClick={onPrint}
            fullWidth
            className="flex items-center justify-center"
          >
            <Printer size={16} className="mr-2" />
            <span className="text-sm sm:text-base">Print</span>
          </Button>
          <Button 
            onClick={onDownload}
            variant="secondary"
            fullWidth
            className="flex items-center justify-center"
          >
            <Download size={16} className="mr-2" />
            <span className="text-sm sm:text-base">PDF</span>
          </Button>
          <Button 
            onClick={onExport}
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

export default RaportAlumniModal;
