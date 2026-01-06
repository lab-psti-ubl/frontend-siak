import React from 'react';
import { BookOpen } from 'lucide-react';
import Card from '../../../../../ui/Card';

interface NilaiKelasEmptyStateProps {
  message: string;
  description: string;
}

const NilaiKelasEmptyState: React.FC<NilaiKelasEmptyStateProps> = ({ message, description }) => {
  return (
    <Card className="text-center py-12 sm:py-16 lg:py-20">
      <div className="flex justify-center mb-4 sm:mb-6">
        <div className="bg-slate-100 rounded-full p-4 sm:p-5 lg:p-6">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-slate-400" />
        </div>
      </div>
      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
        {message}
      </h3>
      <p className="text-sm sm:text-base text-gray-600">
        {description}
      </p>
    </Card>
  );
};

export default NilaiKelasEmptyState;
