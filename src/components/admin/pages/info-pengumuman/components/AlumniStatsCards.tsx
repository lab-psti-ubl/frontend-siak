import React from 'react';
import { GraduationCap, Users, TrendingUp, Award } from 'lucide-react';
import Card from '../../../../ui/Card';
import { Alumni } from '../../../../../types';

interface AlumniStatsCardsProps {
  alumni: Alumni[];
}

const AlumniStatsCards: React.FC<AlumniStatsCardsProps> = ({ alumni }) => {
  const calculateStats = () => {
    const totalAlumni = alumni.length;
    const uniqueTahunLulus = new Set(alumni.map(a => a.tahunLulus)).size;
    const rataRataNilai = alumni.length > 0 ? 
      (alumni.reduce((sum, a) => sum + a.nilaiAkhir, 0) / alumni.length).toFixed(1) : '0';
    const alumniTerbaik = alumni.filter(a => a.nilaiAkhir >= 85).length;

    return {
      totalAlumni,
      uniqueTahunLulus,
      rataRataNilai: parseFloat(rataRataNilai),
      alumniTerbaik
    };
  };

  const stats = calculateStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <Card className="p-6 text-center border-l-4 border-l-blue-500">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.totalAlumni}</p>
        <p className="text-sm text-gray-600">Total Alumni</p>
      </Card>

      <Card className="p-6 text-center border-l-4 border-l-emerald-500">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <GraduationCap className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.uniqueTahunLulus}</p>
        <p className="text-sm text-gray-600">Angkatan</p>
      </Card>

      <Card className="p-6 text-center border-l-4 border-l-purple-500">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-6 h-6 text-purple-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.rataRataNilai}</p>
        <p className="text-sm text-gray-600">Rata-rata Nilai</p>
      </Card>

      <Card className="p-6 text-center border-l-4 border-l-orange-500">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Award className="w-6 h-6 text-orange-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{stats.alumniTerbaik}</p>
        <p className="text-sm text-gray-600">Alumni Terbaik (≥85)</p>
      </Card>
    </div>
  );
};

export default AlumniStatsCards;