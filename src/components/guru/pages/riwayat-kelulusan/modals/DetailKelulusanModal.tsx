import React from 'react';
import { Download, GraduationCap, Calendar, BookOpen } from 'lucide-react';
import { RiwayatWaliKelas, Alumni } from '../../../../../types';
import Modal from '../../../../ui/Modal';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import AlumniTable from '../components/AlumniTable';
import { calculatePersentaseKelulusan } from '../utils/riwayatKelulusanUtils';

interface DetailKelulusanModalProps {
  isOpen: boolean;
  onClose: () => void;
  riwayat: RiwayatWaliKelas | null;
  alumni: Alumni[];
  onExport: () => void;
  onViewRaport: (alumniItem: Alumni) => void;
  onPrintRaport: (alumniItem: Alumni) => void;
  onDownloadRaport: (alumniItem: Alumni) => void;
}

const DetailKelulusanModal: React.FC<DetailKelulusanModalProps> = ({
  isOpen,
  onClose,
  riwayat,
  alumni,
  onExport,
  onViewRaport,
  onPrintRaport,
  onDownloadRaport
}) => {
  if (!riwayat) return null;

  const tingkatKelulusan = calculatePersentaseKelulusan(
    riwayat.jumlahMuridLulus,
    riwayat.jumlahMuridTidakLulus
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
        {/* Header Section - Mobile Optimized */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 rounded-2xl shadow-lg">
          <div className="absolute inset-0 bg-black opacity-5"></div>
          <div className="relative p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-slate-500 rounded-2xl border-2 border-slate-400 shadow-md flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {getInitials(riwayat.namaKelas)}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-slate-600 rounded-full p-2 sm:p-2.5 border-2 border-white shadow-md">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>

              {/* Info - Better Grid Layout for Desktop/Tablet */}
              <div className="flex-1 w-full sm:w-auto">
                <h2 className="text-xl sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-center sm:text-left text-white">
                  {riwayat.namaKelas}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-slate-100">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                    <div className="p-1.5 sm:p-2 bg-white bg-opacity-10 rounded-lg">
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="font-medium">Tahun Ajaran: {riwayat.tahunAjaran}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                    <div className="p-1.5 sm:p-2 bg-white bg-opacity-10 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="font-medium">
                      {new Date(riwayat.tanggalKelulusan).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 text-center border border-slate-200 shadow-sm bg-white">
            <div className="text-2xl sm:text-3xl font-bold text-slate-700 mb-1 sm:mb-2">
              {riwayat.jumlahMuridLulus}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-medium">Murid Lulus</div>
          </Card>

          <Card className="p-4 sm:p-5 text-center border border-slate-200 shadow-sm bg-white">
            <div className="text-2xl sm:text-3xl font-bold text-slate-700 mb-1 sm:mb-2">
              {riwayat.jumlahMuridTidakLulus}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-medium">Murid Tidak Lulus</div>
          </Card>

          <Card className="p-4 sm:p-5 text-center border border-slate-200 shadow-sm bg-white">
            <div className="text-2xl sm:text-3xl font-bold text-slate-700 mb-1 sm:mb-2">
              {tingkatKelulusan}%
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-medium">Tingkat Kelulusan</div>
          </Card>
        </div>

        {/* Alumni List Section */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <h4 className="font-semibold text-gray-900 text-base sm:text-lg">Daftar Alumni</h4>
            <Button
              size="sm"
              variant="secondary"
              onClick={onExport}
              className="w-full sm:w-auto justify-center flex items-center"
            >
              <Download size={14} className="mr-1" />
              <span className="text-xs sm:text-sm">Export Data</span>
            </Button>
          </div>

          <AlumniTable
            alumni={alumni}
            onViewRaport={onViewRaport}
            onPrintRaport={onPrintRaport}
            onDownloadRaport={onDownloadRaport}
          />
        </div>
      </div>
    </Modal>
  );
};

export default DetailKelulusanModal;
