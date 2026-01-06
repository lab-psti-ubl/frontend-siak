import React from 'react';
import { GraduationCap, Calendar } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { TahunAjaran } from '../../../../types';
import { getGraduationTingkatLabelSync } from '../../../../utils/jenjangPendidikanUtils';

interface NotKelas12Props {
  dummy?: boolean;
}

export const NotKelas12: React.FC<NotKelas12Props> = () => {
  return (
    <Card className="text-center py-12">
      <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Hanya untuk Tingkat Akhir</h3>
      <p className="text-gray-600">Menu ini hanya tersedia untuk murid {getGraduationTingkatLabelSync()}.</p>
    </Card>
  );
};

interface NotSemesterGenapProps {
  activeTahunAjaran: TahunAjaran | undefined;
}

export const NotSemesterGenap: React.FC<NotSemesterGenapProps> = ({ activeTahunAjaran }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Info Kelulusan</h2>
          <p className="text-gray-600">Informasi kelulusan dan peringkat Anda</p>
        </div>
        {activeTahunAjaran && (
          <Badge variant="info">
            {activeTahunAjaran.tahun} - Semester {activeTahunAjaran.semester}
          </Badge>
        )}
      </div>

      <Card className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Kelulusan di Semester Ganjil</h3>
        <p className="text-gray-600">
          Info kelulusan hanya tersedia pada semester genap (semester 2).
          Saat ini adalah semester {activeTahunAjaran?.semester || 1} tahun ajaran {activeTahunAjaran?.tahun || ''}.
        </p>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Informasi:</h4>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• Kelulusan ditentukan pada akhir semester genap</li>
            <li>• Pengumuman kelulusan akan tersedia saat semester 2</li>
            <li>• Nilai semester 1 dan 2 akan dievaluasi untuk kelulusan</li>
            <li>• Pantau terus prestasi Anda di semester ini</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export const NoPengumuman: React.FC = () => {
  return (
    <Card className="text-center py-12">
      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Pengumuman</h3>
      <p className="text-gray-600">Pengumuman kelulusan belum dipublikasikan oleh sekolah.</p>
    </Card>
  );
};
