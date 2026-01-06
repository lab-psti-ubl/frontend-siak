import React from 'react';
import { FileText } from 'lucide-react';
import Card from '../../../../../ui/Card';

const SuratIzinEmptyState: React.FC = () => {
  return (
    <Card>
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Riwayat Verifikasi</h3>
      </div>
      <div className="text-center py-12 px-4">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Belum ada surat yang diverifikasi</h3>
        <p className="text-sm text-gray-600">Surat izin yang telah diverifikasi akan muncul di sini</p>
      </div>
    </Card>
  );
};

export default SuratIzinEmptyState;
