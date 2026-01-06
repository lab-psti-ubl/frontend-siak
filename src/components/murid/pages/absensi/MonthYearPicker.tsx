import React from 'react';
import { ChevronDown } from 'lucide-react';

interface MonthYearPickerProps {
  selectedMonth: number;
  selectedYear: number;
  isOpen: boolean;
  onToggle: () => void;
  onMonthSelect: (month: number) => void;
  onYearSelect: (year: number) => void;
  onThisMonth: () => void;
  onClear: () => void;
  availableMonths?: number[];
  availableYears?: number[];
  monthsYears?: Array<{ month: number; year: number }>;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  selectedMonth,
  selectedYear,
  isOpen,
  onToggle,
  onMonthSelect,
  onYearSelect,
  onThisMonth,
  onClear,
  availableMonths = [],
  availableYears = [],
  monthsYears = []
}) => {
  const allMonths = [
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

  // Get available months for the selected year
  const availableMonthsForYear = monthsYears
    .filter(my => my.year === selectedYear)
    .map(my => my.month);

  // Check if a month is available for the current selected year
  const isMonthAvailable = (month: number) => {
    return availableMonthsForYear.includes(month);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full sm:w-auto sm:min-w-[240px] px-4 py-3 border border-slate-300 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <span className="text-sm font-semibold text-slate-900">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </span>
          <ChevronDown size={16} className={`text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/10"
            onClick={onToggle}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-96 bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-2xl z-[110] overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-3 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">Pilih Periode</h4>
            </div>
            <div className="p-5">
              {/* Year Selector */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Tahun</label>
                <div className="flex justify-center space-x-2 flex-wrap gap-2">
                  {availableYears.map(year => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => onYearSelect(year)}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        selectedYear === year
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selector */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Bulan</label>
                <div className="grid grid-cols-4 gap-2">
                  {allMonths.map((month) => {
                    const isAvailable = isMonthAvailable(month.value);
                    return (
                      <button
                        key={month.value}
                        type="button"
                        onClick={() => isAvailable && onMonthSelect(month.value)}
                        disabled={!isAvailable}
                        className={`px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                          selectedMonth === month.value && isAvailable
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md scale-105'
                            : isAvailable
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-sm'
                            : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {month.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 gap-2">
                <button
                  type="button"
                  onClick={onClear}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all duration-200 hover:shadow-sm"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onThisMonth}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Bulan Ini
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MonthYearPicker;
