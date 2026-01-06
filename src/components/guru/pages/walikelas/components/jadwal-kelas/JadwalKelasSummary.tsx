import React from 'react';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';
import { JadwalPelajaran } from '../../../../../../types';
import { hariOrder } from './JadwalKelasUtils';

interface JadwalKelasSummaryProps {
  jadwalKelas: JadwalPelajaran[];
  schedulesByDay: Record<string, JadwalPelajaran[]>;
}

const JadwalKelasSummary: React.FC<JadwalKelasSummaryProps> = ({
  jadwalKelas,
  schedulesByDay
}) => {
  const stats = [
    {
      label: 'Mata Pelajaran',
      value: new Set(jadwalKelas.map(j => j.mataPelajaranId)).size,
      icon: BookOpen,
      bg: 'from-blue-50 to-blue-50/50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      value_text: 'text-blue-900'
    },
    {
      label: 'Jam Pelajaran',
      value: jadwalKelas.length,
      icon: Clock,
      bg: 'from-emerald-50 to-emerald-50/50',
      border: 'border-emerald-200',
      text: 'text-emerald-600',
      value_text: 'text-emerald-900'
    },
    {
      label: 'Guru Pengajar',
      value: new Set(jadwalKelas.map(j => j.guruId)).size,
      icon: Users,
      bg: 'from-cyan-50 to-cyan-50/50',
      border: 'border-cyan-200',
      text: 'text-cyan-600',
      value_text: 'text-cyan-900'
    },
    {
      label: 'Hari Aktif',
      value: hariOrder.filter(hari => schedulesByDay[hari].length > 0).length,
      icon: Calendar,
      bg: 'from-amber-50 to-amber-50/50',
      border: 'border-amber-200',
      text: 'text-amber-600',
      value_text: 'text-amber-900'
    }
  ];

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6 border-b border-slate-200 bg-slate-50">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">Ringkasan Jadwal Kelas</h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">Statistik keseluruhan jadwal pelajaran</p>
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`group bg-gradient-to-br ${stat.bg} rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 border ${stat.border} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className={`text-xs sm:text-sm font-semibold ${stat.text} uppercase tracking-wide`}>
                      {stat.label}
                    </p>
                    <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${stat.value_text} mt-2`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.text} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JadwalKelasSummary;
