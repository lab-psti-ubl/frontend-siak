import React from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

interface MonthYearPickerProps {
  selectedMonth: number;
  selectedYear: number;
  isOpen: boolean;
  onToggle: () => void;
  onMonthSelect: (month: number) => void;
  onYearSelect: (year: number) => void;
  onSetThisMonth: () => void;
  onClear: () => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  selectedMonth,
  selectedYear,
  isOpen,
  onToggle,
  onMonthSelect,
  onYearSelect,
  onSetThisMonth,
  onClear,
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = [
    { short: 'Jan', full: 'Januari', value: 1 },
    { short: 'Feb', full: 'Februari', value: 2 },
    { short: 'Mar', full: 'Maret', value: 3 },
    { short: 'Apr', full: 'April', value: 4 },
    { short: 'May', full: 'Mei', value: 5 },
    { short: 'Jun', full: 'Juni', value: 6 },
    { short: 'Jul', full: 'Juli', value: 7 },
    { short: 'Aug', full: 'Agustus', value: 8 },
    { short: 'Sep', full: 'September', value: 9 },
    { short: 'Oct', full: 'Oktober', value: 10 },
    { short: 'Nov', full: 'November', value: 11 },
    { short: 'Dec', full: 'Desember', value: 12 }
  ];

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center justify-between gap-2.5 w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
      >
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0" />
        <span className="text-xs sm:text-sm font-medium text-slate-700">
          {monthNames[selectedMonth - 1]} {selectedYear}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={onToggle}
          />
          <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Pilih Tahun</p>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {years.map(year => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => onYearSelect(year)}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                        selectedYear === year
                          ? 'bg-blue-600 text-white shadow-md hover:shadow-lg hover:bg-blue-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 sm:pt-5">
                <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Pilih Bulan</p>
                <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                  {months.map((month) => (
                    <button
                      key={month.value}
                      type="button"
                      onClick={() => onMonthSelect(month.value)}
                      className={`px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                        selectedMonth === month.value
                          ? 'bg-blue-600 text-white shadow-md hover:shadow-lg hover:bg-blue-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {month.short}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={onClear}
                  className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onSetThisMonth}
                  className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  Bulan Ini
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthYearPicker;
