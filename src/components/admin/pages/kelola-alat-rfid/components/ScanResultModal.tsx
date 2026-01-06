import React from 'react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
import Card from '../../../../ui/Card';
import { ScanResult } from '../utils/rfidMonitoringUtils';

interface ScanResultModalProps {
  scanResult: ScanResult | null;
  showModal: boolean;
  onClose: () => void;
}

const ScanResultModal: React.FC<ScanResultModalProps> = ({ scanResult, showModal, onClose }) => {
  if (!showModal || !scanResult) {
    return null;
  }

  const isSuccess = !scanResult.isError;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <Card className="w-full max-w-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-6 md:p-8">
          <div className="flex justify-between items-start mb-5 sm:mb-6 md:mb-8 sticky -top-8 -mx-5 sm:-mx-6 md:-mx-8 px-5 sm:px-6 md:px-8 pt-4 pb-4 bg-white border-b border-slate-200">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Detail Absensi</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 ml-4"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </button>
          </div>

          <div>
            {/* Error: Not Registered */}
            {scanResult.isError && scanResult.errorType === 'not_registered' ? (
              <div className="text-center space-y-5 sm:space-y-6 md:space-y-8">
                <div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-red-900 mb-1 sm:mb-2">Kartu Tidak Terdaftar</h3>
                  <p className="text-xs sm:text-sm text-red-700">RFID tidak terdaftar dalam sistem atau user tidak aktif</p>
                </div>

                <div className="p-4 sm:p-5 md:p-6 rounded-lg bg-red-50 text-center border-l-4 border-red-600">
                  <p className="font-bold text-sm sm:text-base md:text-lg text-red-900">
                    {scanResult.statusMessage}
                  </p>
                </div>
              </div>
            ) : scanResult.isError && scanResult.errorType === 'early_departure' ? (
              <div className="text-center space-y-5 sm:space-y-6 md:space-y-8">
                <div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-red-900 mb-1 sm:mb-2">Belum Waktunya Absen Pulang</h3>
                </div>

                <div className="p-4 sm:p-5 md:p-6 rounded-lg bg-red-50 text-center border-l-4 border-red-600 space-y-3 sm:space-y-4">
                  <p className="font-bold text-sm sm:text-base md:text-lg text-red-900">
                    {scanResult.statusMessage}
                  </p>
                  {scanResult.departureTime && (
                    <div className="pt-3 sm:pt-4 border-t border-red-200">
                      <p className="text-xs text-red-700 uppercase font-semibold mb-2">Jam Pulang</p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-900">{scanResult.departureTime}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : scanResult.isError && scanResult.errorType === 'absen_failed' ? (
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-6">
                  {/* Profile Section */}
                  <div className="flex-shrink-0 w-full lg:w-auto flex flex-col items-center">
                    <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden shadow-md border border-gray-300">
                      {scanResult.user?.profileImage ? (
                        <img
                          src={scanResult.user.profileImage}
                          alt={scanResult.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl sm:text-6xl text-gray-400">👤</span>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-4 flex flex-col items-center text-center">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 line-clamp-2">{scanResult.user?.name}</h3>
                      <p className="text-xs text-gray-600 mt-1 font-semibold">
                        {scanResult.role === 'guru' ? `NIP: ${scanResult.user?.nip}` : `NISN: ${scanResult.user?.nisn}`}
                      </p>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1">
                    <div className="text-center mb-4 sm:mb-5 md:mb-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-red-900">Absen Gagal</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                      {scanResult.user?.nip && (
                        <div className="bg-slate-50 p-2.5 sm:p-3 md:p-4 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-600 uppercase font-semibold mb-1">NIP</p>
                          <p className="text-slate-900 font-semibold text-xs sm:text-sm">{scanResult.user.nip}</p>
                        </div>
                      )}
                      {scanResult.user?.nisn && (
                        <div className="bg-slate-50 p-2.5 sm:p-3 md:p-4 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-600 uppercase font-semibold mb-1">NISN</p>
                          <p className="text-slate-900 font-semibold text-xs sm:text-sm">{scanResult.user.nisn}</p>
                        </div>
                      )}
                      <div className="bg-slate-50 p-2.5 sm:p-3 md:p-4 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                        <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Jam</p>
                        <p className="text-slate-900 font-semibold text-xs sm:text-sm">{scanResult.timestamp}</p>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 md:p-5 rounded-lg bg-red-50 text-center border-l-4 border-red-600 mt-4 sm:mt-5">
                      <p className="font-bold text-sm sm:text-base md:text-lg text-red-900">
                        {scanResult.statusMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : scanResult.role === 'guru' && scanResult.izinInfo ? (
              // Show only izin/sakit info for guru with izin/sakit
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-6">
                  {/* Profile Section */}
                  <div className="flex-shrink-0 w-full lg:w-auto flex flex-col items-center">
                    <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center overflow-hidden shadow-md border-2 border-yellow-300">
                      {scanResult.user.profileImage ? (
                        <img
                          src={scanResult.user.profileImage}
                          alt={scanResult.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl sm:text-6xl text-gray-400">👤</span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                        <div className="relative">
                          <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-75"></div>
                          <div className="relative rounded-full p-2 shadow-2xl">
                            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 flex flex-col items-center text-center">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                        {scanResult.user.name}
                      </h3>

                      <p className="text-xs text-gray-600 mt-1 font-semibold">
                        NIP: {scanResult.user.nip}
                      </p>
                    </div>
                  </div>

                  {/* Izin/Sakit Information Only */}
                  <div className="flex-1 space-y-3 sm:space-y-4">
                    <div className="p-4 sm:p-5 md:p-6 rounded-lg border-l-4 bg-yellow-50 border-yellow-500">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600 flex-shrink-0" />
                        <p className="text-base sm:text-lg md:text-xl font-bold text-yellow-900">
                          {scanResult.user.name} sedang {scanResult.izinInfo.jenis === 'izin' ? 'izin' : scanResult.izinInfo.jenis === 'sakit' ? 'sakit' : 'cuti'} hari ini
                        </p>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-yellow-800 mb-1">
                            Alasan:
                          </p>
                          <p className="text-sm sm:text-base text-yellow-900">
                            {scanResult.izinInfo.alasan}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-yellow-800 mb-1">
                            Periode:
                          </p>
                          <p className="text-sm sm:text-base text-yellow-900">
                            {new Date(scanResult.izinInfo.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {new Date(scanResult.izinInfo.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 md:gap-6">
                  {/* Profile Section */}
                  <div className="flex-shrink-0 w-full lg:w-auto flex flex-col items-center">
                    <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden shadow-md border-2 border-blue-300">
                      {scanResult.user.profileImage ? (
                        <img
                          src={scanResult.user.profileImage}
                          alt={scanResult.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl sm:text-6xl text-gray-400">👤</span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                          <div className="relative rounded-full p-2 shadow-2xl">
                            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 flex flex-col items-center text-center">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                        {scanResult.user.name}
                      </h3>

                      <p className="text-xs text-gray-600 mt-1 font-semibold">
                        {scanResult.role === 'guru' ? `NIP: ${scanResult.user.nip}` : `NISN: ${scanResult.user.nisn}`}
                      </p>

                      {scanResult.role === 'murid' && scanResult.user.namaKelas && (
                        <p className="text-xs text-blue-600 mt-2 font-semibold bg-blue-100 px-2 py-1 rounded-md inline-block text-center">
                          {scanResult.user.namaKelas}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2.5 sm:p-3 md:p-4 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700 uppercase font-bold mb-1">Tipe User</p>
                        <p className="text-blue-900 font-bold text-sm sm:text-base">
                          {scanResult.role === 'guru' ? 'Guru' : 'Murid'}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-2.5 sm:p-3 md:p-4 rounded-lg border border-emerald-200">
                        <p className="text-xs text-emerald-700 uppercase font-bold mb-1">Tipe Absen</p>
                        <p className="text-emerald-900 font-bold text-sm sm:text-base">
                          {scanResult.tipeAbsen}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-2.5 sm:p-3 md:p-4 rounded-lg border border-amber-200 col-span-2">
                        <p className="text-xs text-amber-700 uppercase font-bold mb-1">Jam Absen</p>
                        <p className="text-amber-900 font-bold text-sm sm:text-base">
                          {scanResult.timestamp}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`p-3 sm:p-4 md:p-5 rounded-lg border-l-4 flex items-center gap-3 transition-all ${
                        scanResult.status === 'sudah_terpenuhi'
                          ? 'bg-amber-50 border-amber-600'
                          : scanResult.status === 'terlambat'
                          ? 'bg-orange-50 border-orange-600'
                          : scanResult.status === 'pulang_cepat'
                          ? 'bg-cyan-50 border-cyan-600'
                          : 'bg-emerald-50 border-emerald-600'
                      }`}
                    >
                      {isSuccess && (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-emerald-600 animate-pulse" />
                      )}
                      <p
                        className={`font-bold text-xs sm:text-sm md:text-base flex-1 ${
                          scanResult.status === 'sudah_terpenuhi'
                            ? 'text-amber-900'
                            : scanResult.status === 'terlambat'
                            ? 'text-orange-900'
                            : scanResult.status === 'pulang_cepat'
                            ? 'text-cyan-900'
                            : 'text-emerald-900'
                        }`}
                      >
                        {scanResult.statusMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ScanResultModal;
