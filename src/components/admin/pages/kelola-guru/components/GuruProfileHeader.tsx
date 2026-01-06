import React from 'react';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import { User } from '../../../../../types';
import { getInitials } from '../utils/absenGuruHelpers';

interface GuruProfileHeaderProps {
  guru: User;
  getKelasName: (kelasId: string) => string;
}

const GuruProfileHeader: React.FC<GuruProfileHeaderProps> = ({
  guru,
  getKelasName
}) => {
  return (
    
      
     
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-50 border-l-4 border-l-blue-500">
  <div className="flex flex-row items-center gap-3 sm:gap-4">
    
    {/* Avatar Inisial */}
    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full 
                    flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
      {guru.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
    </div>

    {/* Data Guru di Kanan */}
    <div className="flex flex-col flex-1">
      <h3 className="text-base sm:text-2xl font-bold text-gray-900">{guru.name}</h3>
      <p className="text-xs sm:text-sm text-blue-600 font-medium">NIP: {guru.nip}</p>
       {guru.isWaliKelas && (
        <p className="text-xs sm:text-sm text-blue-600 font-medium">Wali Kelas {getKelasName(guru.kelasWali || '')}</p>
         
        )}
    </div>

  </div>
</Card>
    
  );
};

export default GuruProfileHeader;
