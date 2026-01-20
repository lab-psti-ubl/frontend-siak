import React, { useState, useMemo } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { Download, Printer, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { SesiAbsensiTahfiz, TahfizSchedule } from '../../../../../types';
import { TahfizClass } from '../../../../../hooks/useKelasTahfiz';
import { useSantri } from '../../../../../hooks/useSantri';
import { generateRekapAbsenTahfizData, exportRekapAbsenTahfizToExcel, printRekapAbsenTahfiz } from '../utils/rekapAbsenTahfizUtils';
import RekapAbsenTahfizTable from './RekapAbsenTahfizTable';

interface RekapAbsenTahfizViewProps {
  kelasId: string;
  jadwalId: string;
  sesiAbsensiTahfiz: SesiAbsensiTahfiz[];
  jadwalTahfiz: TahfizSchedule[];
  kelasTahfiz: TahfizClass[];
  selectedYear: string;
}

const RekapAbsenTahfizView: React.FC<RekapAbsenTahfizViewProps> = ({
  kelasId,
  jadwalId,
  sesiAbsensiTahfiz,
  jadwalTahfiz,
  kelasTahfiz,
  selectedYear,
}) => {
  const { santri } = useSantri();
  const [isExporting, setIsExporting] = useState(false);

  const rekapData = useMemo(() => {
    return generateRekapAbsenTahfizData(
      kelasId,
      jadwalId,
      sesiAbsensiTahfiz,
      jadwalTahfiz,
      kelasTahfiz,
      santri,
      selectedYear
    );
  }, [kelasId, jadwalId, sesiAbsensiTahfiz, jadwalTahfiz, kelasTahfiz, santri, selectedYear]);

  const kelasData = kelasTahfiz.find(k => k.id === kelasId);
  const jadwal = jadwalTahfiz.find(j => j.id === jadwalId);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportRekapAbsenTahfizToExcel(
        rekapData,
        kelasData?.namaKelas || '',
        selectedYear
      );
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    printRekapAbsenTahfiz(
      rekapData,
      kelasData?.namaKelas || '',
      selectedYear
    );
  };


  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="space-y-4">
          {/* Top Section */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Title */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  Rekap Absensi Pertemuan Tahfiz
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {kelasData?.namaKelas} - {jadwal ? `${jadwal.hari} ${jadwal.jamMulai}-${jadwal.jamSelesai}` : ''}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={handlePrint}
                variant="secondary"
                className="flex items-center w-full sm:w-auto text-xs sm:text-sm px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-300 justify-center"
              >
                <Printer size={14} className="mr-2" />
                Cetak
              </Button>

              <Button
                onClick={handleExportExcel}
                disabled={isExporting}
                variant="primary"
                className="flex items-center justify-center w-full sm:w-auto text-xs sm:text-sm px-4 py-2"
              >
                <Download size={14} className="mr-2" />
                {isExporting ? 'Mengekspor...' : 'Export Excel'}
              </Button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-200">
            <div className="space-y-2">
              <div className="flex items-center text-xs sm:text-sm">
                <Calendar size={14} className="mr-2 text-blue-600" />
                <span className="text-gray-600">Tahun:</span>
                <span className="ml-2 font-semibold text-gray-900">{selectedYear}</span>
              </div>

              <div className="flex items-center text-xs sm:text-sm">
                <BookOpen size={14} className="mr-2 text-blue-600" />
                <span className="text-gray-600">Kelas:</span>
                <span className="ml-2 font-semibold text-gray-900">{kelasData?.namaKelas || '-'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-xs sm:text-sm">
                <GraduationCap size={14} className="mr-2 text-blue-600" />
                <span className="text-gray-600">Jadwal:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {jadwal ? `${jadwal.hari} ${jadwal.jamMulai}-${jadwal.jamSelesai}` : '-'}
                </span>
              </div>

              <div className="flex items-center text-xs sm:text-sm">
                <BookOpen size={14} className="mr-2 text-blue-600" />
                <span className="text-gray-600">Total Santri:</span>
                <span className="ml-2 font-semibold text-gray-900">{rekapData.students.length}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* STATISTIC GRIDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{rekapData.meetings.length}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Pertemuan</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {rekapData.meetings.filter(m => m.status === 'mengajar').length}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Ustadz Mengajar</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-red-600">
              {rekapData.meetings.filter(m => m.status === 'tidak_mengajar').length}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Tidak Mengajar</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-indigo-600">{rekapData.students.length}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Santri</p>
          </div>
        </Card>
      </div>

      {/* TABLE */}
      <RekapAbsenTahfizTable rekapData={rekapData} />
    </div>
  );
};

export default RekapAbsenTahfizView;

