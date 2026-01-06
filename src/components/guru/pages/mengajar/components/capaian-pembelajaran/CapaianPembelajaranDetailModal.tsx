import React from 'react';
import { X, Edit2, BookOpen, Calendar, GraduationCap } from 'lucide-react';
import Button from '../../../../../ui/Button';
import Badge from '../../../../../ui/Badge';
import { CapaianPembelajaran } from '../../../../../../types';

interface CapaianPembelajaranDetailModalProps {
  isOpen: boolean;
  selectedDetail: CapaianPembelajaran | null;
  getMataPelajaranName: (mapelId: string) => string;
  onClose: () => void;
  onEdit: (item: CapaianPembelajaran) => void;
}

const CapaianPembelajaranDetailModal: React.FC<CapaianPembelajaranDetailModalProps> = ({
  isOpen,
  selectedDetail,
  getMataPelajaranName,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !selectedDetail) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal Panel - Centered */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-600 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Detail Capaian Pembelajaran</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Tutup"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-4 sm:px-6 py-4 sm:py-6">
            <div className="space-y-4 sm:space-y-5">
              {/* Tingkat Kelas dan Mata Pelajaran - 2 cols untuk tablet dan desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Tingkat Kelas */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    <label className="text-xs sm:text-sm font-semibold text-indigo-900 uppercase tracking-wide">
                      Tingkat Kelas
                    </label>
                  </div>
                  <Badge variant="info">
                    <span className="text-sm sm:text-base font-semibold">Tingkat {selectedDetail.tingkat}</span>
                  </Badge>
                </div>

                {/* Mata Pelajaran */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <label className="text-xs sm:text-sm font-semibold text-blue-900 uppercase tracking-wide">
                      Mata Pelajaran
                    </label>
                  </div>
                  <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">
                    {getMataPelajaranName(selectedDetail.mataPelajaranId)}
                  </p>
                </div>
              </div>

              {/* Capaian Pembelajaran */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg p-4 sm:p-5 border border-slate-200">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Capaian Pembelajaran
                </label>
                <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                    {selectedDetail.capaianPembelajaran}
                  </p>
                </div>
              </div>

              {/* Tanggal Dibuat */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  <label className="text-xs sm:text-sm font-semibold text-amber-900 uppercase tracking-wide">
                    Tanggal Dibuat
                  </label>
                </div>
                <p className="text-sm sm:text-base text-gray-700 mt-1">
                  {new Date(selectedDetail.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="w-full sm:flex-1 order-2 sm:order-1"
              >
                Tutup
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  onClose();
                  onEdit(selectedDetail);
                }}
                className="w-full sm:flex-1 order-1 sm:order-2 flex items-center justify-center"
              >
                <Edit2 size={18} className="mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapaianPembelajaranDetailModal;

