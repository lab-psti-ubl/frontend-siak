import React, { useState, useEffect } from 'react';

import { Volume2 } from 'lucide-react';
import Card from '../../../../ui/Card';

interface ScanningAreaProps {
  lastScannedGuid: string;
}

const ScanningArea: React.FC<ScanningAreaProps> = ({ lastScannedGuid }) => {
  const getDataType = (data: string): string => {
    if (/^\d{10}$/.test(data)) return 'NISN (Murid)';
    if (/^\d{18}$/.test(data)) return 'NIP (Guru)';
    return 'RFID GUID';
  };
  const [currentTime, setCurrentTime] = useState<string>(
  new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
);
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, 1000);

  return () => clearInterval(timer);
}, []);


  return (
    <Card className="border-0 shadow-lg h-full w-full flex">
      <div className="p-4 sm:p-5 md:p-6 lg:p-8 text-center bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl h-full w-full flex flex-col justify-between">
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6">
            <div className="bg-white/20 p-2 sm:p-3 md:p-4 rounded-full">
              <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white" />
            </div>
          </div>

          <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white tabular-nums">
              {currentTime}
            </div>
            <p className="text-blue-100 text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
              Waktu Saat Ini
            </p>
          </div>

          <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl xl:text-3xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
            Tap your RFID card or scan QR code
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm md:text-base mb-4 sm:mb-5 md:mb-6 lg:mb-8">
            Letakkan kartu RFID atau pindai QR code Anda
          </p>
        </div>

        <div className="flex-shrink-0">
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 sm:p-4 md:p-5 lg:p-6 mb-2 sm:mb-3 md:mb-4 border border-white/20">
            <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-mono font-bold break-all min-h-[1.5rem] sm:min-h-[2rem] flex items-center justify-center">
              {lastScannedGuid || <span className="text-blue-100 text-xs sm:text-sm">(Menunggu scan...)</span>}
            </p>
          </div>

          {lastScannedGuid && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-2.5 lg:py-3 border border-white/15">
              <p className="text-blue-100 text-xs sm:text-sm md:text-base font-medium">
                <span className="text-blue-200 font-semibold">Tipe:</span> {getDataType(lastScannedGuid)}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ScanningArea;
