import React from 'react';
import Modal from '../../../../../ui/Modal';
import { User, Kelas } from '../../../../../../types';
import { KelulusanDataItem } from './InfoKelulusanUtils';
import { getGradeColor, getNilaiMinimalSettings } from '../../../../../../utils/nilaiUtils';

interface InfoKelulusanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMurid: User | null;
  kelulusanData: KelulusanDataItem[];
  myKelas?: Kelas;
}

const InfoKelulusanDetailModal: React.FC<InfoKelulusanDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMurid,
  kelulusanData,
  myKelas
}) => {
  const minimalSettings = getNilaiMinimalSettings();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Kelulusan - ${selectedMurid?.name}`}
      size="xl"
    >
      {selectedMurid && (
        <div className="space-y-4 sm:space-y-5">
          {(() => {
            const data = kelulusanData.find(d => d.murid.id === selectedMurid.id);
            if (!data || !data.raportData) return null;

            const rankIndex = kelulusanData.findIndex(d => d.murid.id === selectedMurid.id);

            return (
              <>
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-teal-600 uppercase tracking-wide mb-1">Nama</p>
                      <p className="text-sm sm:text-base font-bold text-slate-900">{data.murid.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-teal-600 uppercase tracking-wide mb-1">NISN</p>
                      <code className="text-sm sm:text-base font-mono font-bold text-slate-900">{data.murid.nisn}</code>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-teal-600 uppercase tracking-wide mb-1">Kelas</p>
                      <p className="text-sm sm:text-base font-bold text-slate-900">{myKelas?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-teal-600 uppercase tracking-wide mb-1">Peringkat</p>
                      <p className="text-sm sm:text-base font-bold text-slate-900">{rankIndex + 1} dari {kelulusanData.length}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-5 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                  data.isLulus
                    ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50'
                    : 'border-red-300 bg-gradient-to-br from-red-50 to-rose-50'
                }`}>
                  <h4 className={`font-bold text-center mb-4 text-lg sm:text-xl ${
                    data.isLulus ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    STATUS KELULUSAN
                  </h4>
                  <div className={`text-center p-4 sm:p-5 rounded-lg sm:rounded-xl ${
                    data.isLulus ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    <p className={`text-2xl sm:text-3xl font-bold mb-2 ${
                      data.isLulus ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {data.isLulus ? 'LULUS' : 'TIDAK LULUS'}
                    </p>
                    <p className={`text-xs sm:text-sm ${
                      data.isLulus ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {data.isLulus
                        ? `Memenuhi syarat kelulusan dengan nilai rata-rata ≥ ${minimalSettings.nilaiAkhirMinimal} dan kehadiran ≥ ${minimalSettings.tingkatKehadiranMinimal}%`
                        : 'Belum memenuhi syarat kelulusan'
                      }
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white rounded-lg p-3 sm:p-4 text-center border border-slate-200">
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Rata-rata Nilai</p>
                      <p className={`text-lg sm:text-2xl font-bold ${
                        data.nilaiAkhir >= minimalSettings.nilaiAkhirMinimal ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {data.nilaiAkhir.toFixed(1)}
                        <span className="ml-1 text-sm">{data.nilaiAkhir >= minimalSettings.nilaiAkhirMinimal ? '✓' : '✗'}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">Min. {minimalSettings.nilaiAkhirMinimal}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 sm:p-4 text-center border border-slate-200">
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Kehadiran</p>
                      <p className={`text-lg sm:text-2xl font-bold ${
                        data.kehadiran >= minimalSettings.tingkatKehadiranMinimal ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {data.kehadiran.toFixed(1)}%
                        <span className="ml-1 text-sm">{data.kehadiran >= minimalSettings.tingkatKehadiranMinimal ? '✓' : '✗'}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">Min. {minimalSettings.tingkatKehadiranMinimal}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
                  <h4 className="font-bold text-blue-900 mb-3 sm:mb-4 text-sm sm:text-base uppercase tracking-wide">Nilai per Mata Pelajaran</h4>
                  <div className="space-y-2 sm:space-y-2.5">
                    {data.raportData.subjects.map((subject) => (
                      <div key={subject.mapelId} className="flex items-center justify-between p-3 sm:p-3.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-xs sm:text-sm font-medium text-slate-900">{subject.mapelName}</span>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-sm sm:text-base font-bold text-slate-900">
                            {subject.nilaiAkhir?.toFixed(1) || '-'}
                          </span>
                          {subject.grade && (
                            <div className={`px-2 sm:px-2.5 py-1 rounded text-xs sm:text-xs font-bold ${getGradeColor(subject.grade)}`}>
                              {subject.grade}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </Modal>
  );
};

export default InfoKelulusanDetailModal;
