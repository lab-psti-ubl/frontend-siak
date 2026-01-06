import React from 'react';
import { BookOpen } from 'lucide-react';
import Modal from '../../../../ui/Modal';
import Card from '../../../../ui/Card';
import Badge from '../../../../ui/Badge';
import { User } from '../../../../../types';
import { getGradeColor, getNilaiMinimalSettings } from '../../../../../utils/nilaiUtils';
import { usePengaturanNilaiMinimal } from '../../../../../hooks/usePengaturanNilaiMinimal';

interface KelulusanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  kelulusanData: any[];
}

const KelulusanDetailModal: React.FC<KelulusanDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  kelulusanData
}) => {
  // Load nilai minimal settings from database
  usePengaturanNilaiMinimal();
  
  if (!selectedMurid) return null;

  const data = kelulusanData.find(d => d.murid.id === selectedMurid.id);
  if (!data || !data.raportData) return null;

  const minimalSettings = getNilaiMinimalSettings();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Kelulusan - ${selectedMurid.name}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nama:</span>
              <span className="ml-2 font-medium">{data.murid.name}</span>
            </div>
            <div>
              <span className="text-gray-600">NISN:</span>
              <span className="ml-2 font-medium">{data.murid.nisn}</span>
            </div>
            <div>
              <span className="text-gray-600">Kelas:</span>
              <span className="ml-2 font-medium">{data.kelas?.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Peringkat:</span>
              <span className="ml-2 font-medium">
                {kelulusanData.findIndex(d => d.murid.id === selectedMurid.id) + 1} dari {kelulusanData.length}
              </span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border-2 ${
          data.isLulus ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'
        }`}>
          <h4 className={`font-bold text-center mb-4 text-lg ${
            data.isLulus ? 'text-emerald-900' : 'text-red-900'
          }`}>
            STATUS KELULUSAN
          </h4>
          <div className={`text-center p-4 rounded-lg ${
            data.isLulus ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            <p className={`text-2xl font-bold mb-2 ${
              data.isLulus ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {data.isLulus ? 'LULUS' : 'TIDAK LULUS'}
            </p>
            <p className={`text-sm ${
              data.isLulus ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {data.isLulus
                ? `Memenuhi syarat kelulusan dengan nilai rata-rata ≥ ${minimalSettings.nilaiAkhirMinimal} dan kehadiran ≥ ${minimalSettings.tingkatKehadiranMinimal}%`
                : 'Belum memenuhi syarat kelulusan'
              }
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600">Rata-rata Nilai</p>
              <p className={`text-lg font-bold ${
                data.nilaiAkhir >= minimalSettings.nilaiAkhirMinimal ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {data.nilaiAkhir.toFixed(1)} {data.nilaiAkhir >= minimalSettings.nilaiAkhirMinimal ? '✓' : '✗'}
              </p>
              <p className="text-xs text-gray-500">Minimal {minimalSettings.nilaiAkhirMinimal}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Tingkat Kehadiran</p>
              <p className={`text-lg font-bold ${
                data.kehadiran >= minimalSettings.tingkatKehadiranMinimal ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {data.kehadiran.toFixed(1)}% {data.kehadiran >= minimalSettings.tingkatKehadiranMinimal ? '✓' : '✗'}
              </p>
              <p className="text-xs text-gray-500">Minimal {minimalSettings.tingkatKehadiranMinimal}%</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">Detail Nilai per Mata Pelajaran</h4>
          <div className="space-y-2">
            {data.raportData.subjects.map((subject: any) => (
              <div key={subject.mapelId} className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm font-medium">{subject.mapelName}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">
                    {subject.nilaiAkhir?.toFixed(1) || '-'}
                  </span>
                  {subject.grade && (
                    <div className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(subject.grade)}`}>
                      {subject.grade}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default KelulusanDetailModal;