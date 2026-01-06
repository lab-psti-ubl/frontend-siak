import React from 'react';
import { BookOpen, FileText, Eye, Download, Clock } from 'lucide-react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { Jurnal } from '../../../../../hooks/useJurnal';

interface JurnalMengajarCardProps {
  jurnal: Jurnal | undefined;
  onViewFile: (file: any) => void;
}

const JurnalMengajarCard: React.FC<JurnalMengajarCardProps> = ({
  jurnal,
  onViewFile
}) => {
  if (jurnal) {
    return (
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-md hover:shadow-lg transition-all duration-200">
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-md">
            <BookOpen size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <div>
            <h5 className="text-sm sm:text-base font-bold text-gray-900">Jurnal Mengajar</h5>
            <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1.5">
              <Clock size={12} />
              Diinput: {new Date(jurnal.waktuInput).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-100">
            <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Judul Materi</p>
            <p className="text-sm sm:text-base text-gray-900 font-medium">{jurnal.judul}</p>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-100">
            <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Deskripsi</p>
            <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap leading-relaxed">{jurnal.deskripsi}</p>
          </div>
          {jurnal.file && (
            <div className="bg-white rounded-lg p-3 sm:p-4 border-2 border-green-200">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">File Materi</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-green-600" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-900 font-medium truncate">{jurnal.file.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onViewFile(jurnal.file)}
                    className="flex items-center gap-1.5 text-xs sm:text-sm"
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">Lihat</span>
                    <span className="sm:hidden">Lihat</span>
                  </Button>
                  <a
                    href={jurnal.file.data}
                    download={jurnal.file.name}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 font-medium"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Unduh</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5 bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-500 flex items-center justify-center shadow-md">
          <BookOpen size={20} className="text-white sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-sm sm:text-base font-semibold text-yellow-900">Jurnal Mengajar</p>
          <p className="text-xs sm:text-sm text-yellow-700 mt-0.5">Belum diisi oleh guru</p>
        </div>
      </div>
    </Card>
  );
};

export default JurnalMengajarCard;
