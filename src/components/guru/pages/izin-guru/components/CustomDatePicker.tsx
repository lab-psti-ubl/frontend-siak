import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  disabledDates?: string[];
  placeholder?: string;
  rangeStart?: string;
  rangeEnd?: string;
  activeIzinRanges?: Array<{ start: string; end: string }>;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  disabledDates = [],
  placeholder = 'Pilih tanggal',
  rangeStart,
  rangeEnd,
  activeIzinRanges = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1));
  };

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSelectDate = (day: number) => {
    const selectedDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const dateString = formatDateToString(selectedDate);

    if (disabledDates.includes(dateString)) {
      return;
    }

    if (minDate && dateString < minDate) {
      return;
    }

    if (maxDate && dateString > maxDate) {
      return;
    }

    onChange(dateString);
    setIsOpen(false);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysInMonth = getDaysInMonth(displayMonth);
  const firstDayOfMonth = getFirstDayOfMonth(displayMonth);
  const daysArray = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isDateInPast = (dateString: string) => {
    const today = formatDateToString(new Date());
    return dateString < today;
  };

  const isDateWithActiveIzin = (dateString: string) => {
    return activeIzinRanges.some(range => dateString >= range.start && dateString <= range.end);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const dateString = formatDateToString(date);

    if (disabledDates.includes(dateString)) {
      return true;
    }

    if (maxDate && dateString > maxDate) {
      return true;
    }

    return false;
  };

  return (
    <div className="relative" ref={pickerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 bg-white flex justify-between items-center"
      >
        <span className={value ? 'text-gray-900 font-medium' : 'text-gray-500'}>
          {formatDateDisplay(value)}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-72" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-semibold text-gray-900">
              {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const isDisabled = isDateDisabled(day);
              const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
              const dateString = formatDateToString(date);
              const isInPast = isDateInPast(dateString);
              const hasActiveIzin = isDateWithActiveIzin(dateString);
              const isStartDate = rangeStart === dateString;
              const isEndDate = rangeEnd === dateString;
              const isInRange = rangeStart && rangeEnd && dateString >= rangeStart && dateString <= rangeEnd;

              let borderClasses = '';
              if (hasActiveIzin) {
                if (dateString === activeIzinRanges.find(r => r.start === dateString)?.start && dateString === activeIzinRanges.find(r => r.end === dateString)?.end) {
                  borderClasses = 'rounded-lg';
                } else if (activeIzinRanges.some(r => r.start === dateString)) {
                  borderClasses = 'rounded-l-lg';
                } else if (activeIzinRanges.some(r => r.end === dateString)) {
                  borderClasses = 'rounded-r-lg';
                }
              } else if (isInRange || isStartDate || isEndDate) {
                if (isStartDate && !isEndDate) {
                  borderClasses = 'rounded-l-lg';
                } else if (isEndDate && !isStartDate) {
                  borderClasses = 'rounded-r-lg';
                } else if (isStartDate && isEndDate) {
                  borderClasses = 'rounded-lg';
                }
              }

              let disabledReason = '';
              if (hasActiveIzin) disabledReason = 'Tanggal dalam periode izin aktif';
              else if (isInPast) disabledReason = 'Tanggal telah berlalu';
              else if (minDate && dateString < minDate) disabledReason = 'Tidak bisa memilih sebelum tanggal mulai';
              else if (maxDate && dateString > maxDate) disabledReason = 'Tanggal tidak boleh melebihi tanggal selesai';
              else if (isDisabled) disabledReason = 'Tanggal sudah memiliki pengajuan izin';

              const isBeforeMinDate = minDate && dateString < minDate;

              return (
                <button
                  key={day}
                  onClick={() => !isDisabled && !isInPast && !hasActiveIzin && !isBeforeMinDate && handleSelectDate(day)}
                  disabled={isDisabled || isInPast || hasActiveIzin || (maxDate ? dateString > maxDate : false) || isBeforeMinDate}
                  className={`
                    aspect-square flex items-center justify-center text-sm font-medium
                    relative group transition-colors
                    ${hasActiveIzin
                      ? 'bg-blue-300 text-blue-900 font-semibold cursor-not-allowed ' + borderClasses
                      : isInPast
                        ? 'bg-gray-300 text-gray-400 cursor-not-allowed rounded-lg border border-gray-300'
                        : isBeforeMinDate
                          ? 'bg-gray-300 text-gray-400 cursor-not-allowed rounded-lg border border-gray-300'
                          : (maxDate && dateString > maxDate)
                            ? 'bg-gray-300 text-gray-400 cursor-not-allowed rounded-lg border border-gray-300'
                            : isStartDate || isEndDate
                              ? 'bg-blue-500 text-white font-semibold ' + borderClasses
                              : isInRange
                                ? 'bg-blue-200 text-gray-900'
                                : 'bg-white text-gray-900 hover:bg-blue-50 border border-gray-200 rounded-lg'
                    }
                  `}
                  title={disabledReason}
                >
                  {day}
                </button>
              );
            })}
          </div>

         

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-3 px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-gray-400 rounded-lg"
          >
            Tutup
          </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
