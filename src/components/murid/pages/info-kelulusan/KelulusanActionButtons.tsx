import React from 'react';
import { Eye, FileText } from 'lucide-react';
import Button from '../../../ui/Button';
import Card from '../../../ui/Card';

interface KelulusanActionButtonsProps {
  onViewDetail: () => void;
  onViewRaport: () => void;
}

const KelulusanActionButtons: React.FC<KelulusanActionButtonsProps> = ({
  onViewDetail,
  onViewRaport
}) => {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
        <Button onClick={onViewDetail} size="lg" className="w-full sm:w-auto text-sm sm:text-base justify-center flex items-center">
          <Eye className="w-5 h-5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
          <span className="whitespace-nowrap">Lihat Detail Kelulusan Saya</span>
        </Button>
        <Button onClick={onViewRaport} variant="success" size="lg" className="w-full  sm:w-auto text-sm sm:text-base justify-center flex items-center">
          <FileText className="w-5 h-5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
          <span className="whitespace-nowrap">Lihat Raport Lengkap</span>
        </Button>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 text-center mt-3 sm:mt-3 px-2 sm:px-0">
        Akses raport lengkap Anda untuk melihat detail nilai semua mata pelajaran
      </p>
    </Card>
  );
};

export default KelulusanActionButtons;
