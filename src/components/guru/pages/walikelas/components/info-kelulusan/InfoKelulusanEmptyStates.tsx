import React from 'react';
import { GraduationCap, AlertCircle, Calendar } from 'lucide-react';
import Card from '../../../../../ui/Card';
import Badge from '../../../../../ui/Badge';
import { TahunAjaran, Kelas } from '../../../../../../types';
import { getGraduationTingkatLabelSync } from '../../../../../../utils/jenjangPendidikanUtils';

interface EmptyStateProps {
  myKelas?: Kelas;
  activeTahunAjaran?: TahunAjaran;
}

export const AccessDeniedState: React.FC = () => {
  return (
    <Card className="text-center py-12">
      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
      <p className="text-gray-600">Anda tidak memiliki akses sebagai wali kelas.</p>
    </Card>
  );
};

export const OnlyForKelas12State: React.FC = () => {
  return (
    <Card className="text-center py-12">
      <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Hanya untuk Tingkat Akhir</h3>
      <p className="text-gray-600">Menu ini hanya tersedia untuk wali {getGraduationTingkatLabelSync()}.</p>
    </Card>
  );
};

export const SemesterGanjilState: React.FC<EmptyStateProps> = ({ myKelas, activeTahunAjaran }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Info Kelulusan - {myKelas?.name}</h2>
          <p className="text-gray-600">Data kelulusan murid tingkat akhir</p>
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
            <li>• Data kelulusan berdasarkan nilai semester 1 dan 2</li>
            <li>• Menu ini akan aktif saat semester genap tahun ajaran ini</li>
            <li>• Pengumuman kelulusan harus dipublikasikan oleh admin terlebih dahulu</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export const NoPengumumanState: React.FC = () => {
  return (
    <Card className="text-center py-12">
      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Pengumuman</h3>
      <p className="text-gray-600">Pengumuman kelulusan belum dipublikasikan oleh admin.</p>
    </Card>
  );
};
