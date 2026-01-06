import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from '../../../../../ui/Badge';

interface AbsenKelasHeaderProps {
  myKelas: any;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isToday: boolean;
  today: string;
}

const AbsenKelasHeader: React.FC<AbsenKelasHeaderProps> = ({
  myKelas,
  selectedDate,
  setSelectedDate,
  isToday,
  today
}) => {
  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleToday = () => {
    setSelectedDate(today);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-90 rounded-lg p-2 sm:p-2.5">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Absen Kelas</h2>
              <p className="text-xs sm:text-sm text-blue-100">{myKelas?.name || 'Pilih Kelas'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Pilih Tanggal
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousDay}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-xs sm:text-sm font-medium"
              />
              <button
                onClick={handleNextDay}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="flex flex-col xs:flex-row gap-2">
            <button
              onClick={handleToday}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                isToday
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:border-slate-300'
              }`}
            >
              Hari Ini
            </button>
            <Badge variant={isToday ? 'success' : 'info'}>
              {formattedDate}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsenKelasHeader;