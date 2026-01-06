import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

interface MonthYearPickerKehadiranProps {
  selectedMonth: number;
  selectedYear: number;
  isOpen: boolean;
  onToggle: () => void;
  onMonthSelect: (month: number) => void;
  onYearSelect: (year: number) => void;
  onThisMonth: () => void;
  onClear: () => void;
  availableMonths: number[];
  availableYears: number[];
  monthsYears: Array<{month: number; year: number}>;
}

const MonthYearPickerKehadiran: React.FC<MonthYearPickerKehadiranProps> = ({
  selectedMonth,
  selectedYear,
  isOpen,
  onToggle,
  onMonthSelect,
  onYearSelect,
  onThisMonth,
  onClear,
  availableMonths,
  availableYears,
  monthsYears,
}) => {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  const displayMonth = monthNames[selectedMonth - 1];

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };

    const handleScroll = () => {
      onToggle();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onToggle]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-600" />
          <span className="text-slate-700 font-medium">
            {displayMonth} {selectedYear}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-transparent"
            onClick={onToggle}
          />
          <div
            ref={dropdownRef}
            className="fixed w-[calc(100%-2rem)] sm:w-80 bg-white border border-slate-300 rounded-lg shadow-xl z-[110] p-4"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="space-y-4">
              {/* Year Selector Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Tahun
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-medium text-slate-700">{selectedYear}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isYearDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {availableYears.map(year => (
                        <button
                          key={year}
                          onClick={() => {
                            onYearSelect(year);
                            setIsYearDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 transition-colors ${
                            selectedYear === year
                              ? 'bg-blue-600 text-white font-medium'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Month Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Bulan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((month, idx) => {
                    const monthNum = idx + 1;
                    const isAvailable = monthsYears.some(my => my.month === monthNum && my.year === selectedYear);

                    return (
                      <button
                        key={monthNum}
                        onClick={() => isAvailable && onMonthSelect(monthNum)}
                        disabled={!isAvailable}
                        className={`px-3 py-2 rounded-lg font-medium text-xs transition-colors ${
                          selectedMonth === monthNum && isAvailable
                            ? 'bg-blue-600 text-white'
                            : isAvailable
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                        }`}
                      >
                        {month.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={onThisMonth}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                >
                  Bulan Ini
                </button>
                <button
                  onClick={onClear}
                  className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-200 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MonthYearPickerKehadiran;
