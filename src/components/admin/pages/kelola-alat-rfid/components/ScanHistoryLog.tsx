import React from 'react';
import Card from '../../../../ui/Card';
import { ScanLogEntry } from '../utils/rfidMonitoringUtils';

interface ScanHistoryLogProps {
  scanLog: ScanLogEntry[];
}

const ScanHistoryLog: React.FC<ScanHistoryLogProps> = ({ scanLog }) => {
  return (
    <Card className="border-0 shadow-lg h-full w-full flex">
      <div className="flex flex-col h-full w-full">
        <div className="pb-2 sm:pb-3 md:pb-4 border-b border-slate-200 flex-shrink-0">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900">
            Riwayat Scanning
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            {scanLog.length > 0 ? `${scanLog.length} pemindaian terakhir` : 'Tidak ada pemindaian'}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-2.5 md:space-y-3 min-h-0 mt-2 sm:mt-3 md:mt-4">
          {scanLog.length > 0 ? (
            scanLog.map((log) => {
              const isFulfilled = log.tipeAbsen === 'Sudah Terpenuhi';
              return (
                <div
                  key={log.id}
                  className={`p-3 sm:p-3.5 md:p-4 rounded-lg text-sm flex-shrink-0 border-l-4 transition-all hover:shadow-md ${
                    isFulfilled
                      ? 'bg-amber-50 border-amber-400 border border-amber-200'
                      : log.status === 'berhasil'
                      ? 'bg-emerald-50 border-emerald-400 border border-emerald-200'
                      : 'bg-red-50 border-red-400 border border-red-200'
                  }`}
                >
                  <p className={`font-bold text-xs sm:text-sm md:text-base leading-tight ${
                    isFulfilled
                      ? 'text-amber-900'
                      : log.status === 'berhasil'
                      ? 'text-emerald-900'
                      : 'text-red-900'
                  }`}>
                    {log.namaUser}
                  </p>
                  <p className={`text-xs mt-1 sm:mt-1.5 ${
                    isFulfilled
                      ? 'text-amber-700'
                      : log.status === 'berhasil'
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  }`}>
                    <span className="font-semibold">{log.tipeUser}</span>
                    <span className="mx-1 text-slate-400">•</span>
                    <span className="font-medium">{log.tipeAbsen}</span>
                  </p>
                  <p className={`text-xs mt-1.5 sm:mt-2 font-mono ${
                    isFulfilled
                      ? 'text-amber-600'
                      : log.status === 'berhasil'
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}>
                    {log.timestamp}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 sm:py-10 md:py-12 text-slate-400 flex flex-col items-center justify-center h-full">
              <div className="text-3xl sm:text-4xl mb-2">📋</div>
              <p className="text-xs sm:text-sm font-medium">Belum ada pemindaian</p>
              <p className="text-xs text-slate-400 mt-1">Scan kartu untuk memulai</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ScanHistoryLog;
