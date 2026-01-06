import React from 'react';
import { GraduationCap } from 'lucide-react';
import Card from '../../../../../ui/Card';
import { PengumumanKelulusan } from '../../../../../../types';

interface InfoKelulusanPengumumanCardProps {
  pengumuman: PengumumanKelulusan;
}

const InfoKelulusanPengumumanCard: React.FC<InfoKelulusanPengumumanCardProps> = ({ pengumuman }) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 sm:px-6 py-4 border-b border-teal-100">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white rounded-lg p-2 sm:p-2.5">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Pengumuman Kelulusan</h3>
            <p className="text-xs sm:text-sm text-teal-100 mt-0.5">Status Pengumuman Aktif</p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="space-y-3 sm:space-y-4">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Dipublikasikan Pada</p>
            <p className="text-sm sm:text-base font-medium text-slate-900">
              {new Date(pengumuman.publishedAt || '').toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Tahun Ajaran</p>
            <p className="text-sm sm:text-base font-medium text-slate-900">{pengumuman.tahunAjaran}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoKelulusanPengumumanCard;
