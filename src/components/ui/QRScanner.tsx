// QRScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, StopCircle, X, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useQRScanner } from '../../context/QRScannerContext';

export interface ScanResult {
  user?: any;                    // User object (guru/murid)
  role?: string;                 // 'guru' atau 'murid'
  tipeAbsen?: string;            // Masuk, Keluar, Pulang, Sudah Terpenuhi, dll
  status?: string;               // Status scanning
  timestamp?: string;            // Jam scan
  statusMessage?: string;        // Pesan status
  isError?: boolean;             // Flag error
  errorType?: string;            // Tipe error (not_registered, early_departure, absen_failed)
  departureTime?: string;        // Jam pulang (untuk early departure)
  izinInfo?: {                   // Info izin/sakit/cuti
    jenis: string;
    alasan: string;
    tanggalMulai: string;
    tanggalSelesai: string;
  };
}

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
  scanResult?: ScanResult | null; // Optional: hasil scan untuk ditampilkan
  showResultModal?: boolean;      // Optional: kontrol visibility modal hasil scan
  onCloseResult?: () => void;     // Callback untuk menutup hasil scan
}

// Helper function to format date in Indonesian format
const formatDateIndonesian = (dateString: string): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
};

// Component untuk menampilkan hasil scan
const ScanResultModal: React.FC<{ scanResult: ScanResult | null; showModal: boolean; onClose: () => void }> = ({ scanResult, showModal, onClose }) => {
  if (!showModal || !scanResult) {
    return null;
  }

  const isNotRegistered = scanResult.errorType === 'not_registered';
  const isEarlyDeparture = scanResult.errorType === 'early_departure';
  const isAbsenFailed = scanResult.errorType === 'absen_failed';
  const hasIzinInfo = scanResult.izinInfo && scanResult.role === 'guru';
  const isSuccess = !scanResult.isError && !hasIzinInfo;

  // Get status color classes
  const getStatusClasses = (status?: string) => {
    switch (status) {
      case 'sudah_terpenuhi': 
        return {
          border: 'border-amber-300',
          borderPing: 'border-amber-400',
          bg: 'bg-amber-500',
          bgBox: 'bg-amber-50',
          borderBox: 'border-amber-200',
          text: 'text-amber-700',
          textIcon: 'text-amber-600'
        };
      case 'terlambat': 
        return {
          border: 'border-orange-300',
          borderPing: 'border-orange-400',
          bg: 'bg-orange-500',
          bgBox: 'bg-orange-50',
          borderBox: 'border-orange-200',
          text: 'text-orange-700',
          textIcon: 'text-orange-600'
        };
      case 'pulang_cepat': 
        return {
          border: 'border-cyan-300',
          borderPing: 'border-cyan-400',
          bg: 'bg-cyan-500',
          bgBox: 'bg-cyan-50',
          borderBox: 'border-cyan-200',
          text: 'text-cyan-700',
          textIcon: 'text-cyan-600'
        };
      default: 
        return {
          border: 'border-emerald-300',
          borderPing: 'border-emerald-400',
          bg: 'bg-emerald-500',
          bgBox: 'bg-emerald-50',
          borderBox: 'border-emerald-200',
          text: 'text-emerald-700',
          textIcon: 'text-emerald-600'
        };
    }
  };

  const statusClasses = getStatusClasses(scanResult.status);

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">Detail Absensi</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-all duration-200 text-gray-600 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* 1. Kondisi: QRCode Tidak Terdaftar (not_registered error) */}
          {isNotRegistered && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-red-100 rounded-full p-4">
                  <AlertCircle size={48} className="text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-red-600 mb-2">QRCode Tidak Terdaftar</h3>
                <p className="text-gray-600 mb-4">QR Code tidak terdaftar dalam sistem atau user tidak aktif</p>
              </div>
              {scanResult.statusMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  <p className="text-sm">{scanResult.statusMessage}</p>
                </div>
              )}
            </div>
          )}

          {/* 2. Kondisi: Belum Waktunya Pulang (early_departure error) */}
          {isEarlyDeparture && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-red-100 rounded-full p-4">
                  <X size={48} className="text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-red-600 mb-2">Belum Waktunya Absen Pulang</h3>
                {scanResult.statusMessage && (
                  <p className="text-gray-700 mb-4">{scanResult.statusMessage}</p>
                )}
              </div>
              {scanResult.departureTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Jam Pulang</div>
                  <div className="text-xl font-bold text-blue-700">{scanResult.departureTime}</div>
                </div>
              )}
            </div>
          )}

          {/* 3. Kondisi: Absen Gagal (absen_failed error) */}
          {isAbsenFailed && scanResult.user && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Left Section - Profile */}
                <div className="flex-shrink-0 text-center sm:text-left">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full border-4 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                      {scanResult.user.profileImage ? (
                        <img 
                          src={scanResult.user.profileImage} 
                          alt={scanResult.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">👤</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-gray-800">{scanResult.user.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {scanResult.user.nip ? `NIP: ${scanResult.user.nip}` : `NISN: ${scanResult.user.nisn}`}
                    </p>
                  </div>
                </div>

                {/* Right Section - Information Grid */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {scanResult.user.nip && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">NIP</div>
                      <div className="text-sm font-semibold text-gray-800">{scanResult.user.nip}</div>
                    </div>
                  )}
                  {scanResult.user.nisn && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">NISN</div>
                      <div className="text-sm font-semibold text-gray-800">{scanResult.user.nisn}</div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500 mb-1">Jam Absen</div>
                    <div className="text-sm font-semibold text-gray-800">{scanResult.timestamp || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Status Message Box */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-700 mb-1">Absen Gagal</div>
                    <p className="text-sm text-red-600">{scanResult.statusMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Kondisi: Guru dengan Izin/Sakit/Cuti */}
          {hasIzinInfo && scanResult.user && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Left Section - Profile */}
                <div className="flex-shrink-0 text-center sm:text-left">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full border-4 border-yellow-300 overflow-hidden bg-gray-100 flex items-center justify-center relative">
                      {scanResult.user.profileImage ? (
                        <img 
                          src={scanResult.user.profileImage} 
                          alt={scanResult.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">👤</span>
                      )}
                      {/* Pulsing ping effect */}
                      <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping opacity-75"></div>
                      {/* Icon overlay */}
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <AlertCircle size={16} className="text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-gray-800">{scanResult.user.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">NIP: {scanResult.user.nip}</p>
                  </div>
                </div>

                {/* Right Section - Izin Information Box */}
                <div className="flex-1">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start mb-3">
                      <AlertCircle size={20} className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="font-bold text-yellow-700">
                        {scanResult.user.name} sedang {scanResult.izinInfo?.jenis} hari ini
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Alasan:</span>
                        <span className="ml-2 text-gray-600">{scanResult.izinInfo?.alasan}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Periode:</span>
                        <span className="ml-2 text-gray-600">
                          {scanResult.izinInfo?.tanggalMulai && scanResult.izinInfo?.tanggalSelesai && (
                            <>
                              {formatDateIndonesian(scanResult.izinInfo.tanggalMulai)} - {formatDateIndonesian(scanResult.izinInfo.tanggalSelesai)}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Kondisi: Scan Berhasil (default/success case) */}
          {isSuccess && scanResult.user && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Left Section - Profile */}
                <div className="flex-shrink-0 text-center sm:text-left">
                  <div className="relative inline-block">
                    <div className={`w-24 h-24 rounded-full border-4 ${statusClasses.border} overflow-hidden bg-gray-100 flex items-center justify-center relative`}>
                      {scanResult.user.profileImage ? (
                        <img 
                          src={scanResult.user.profileImage} 
                          alt={scanResult.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">👤</span>
                      )}
                      {/* Pulsing ping effect */}
                      <div className={`absolute inset-0 rounded-full border-4 ${statusClasses.borderPing} animate-ping opacity-75`}></div>
                      {/* Icon overlay */}
                      <div className={`absolute -top-1 -right-1 ${statusClasses.bg} rounded-full p-1`}>
                        <CheckCircle size={16} className="text-white animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-gray-800">{scanResult.user.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {scanResult.user.nip ? `NIP: ${scanResult.user.nip}` : `NISN: ${scanResult.user.nisn}`}
                    </p>
                    {scanResult.user.namaKelas && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {scanResult.user.namaKelas}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Section - Information Grid */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs text-blue-600 mb-1 font-semibold">TIPE USER</div>
                    <div className="text-sm font-bold text-blue-700">
                      {scanResult.role === 'guru' ? 'Guru' : 'Murid'}
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="text-xs text-emerald-600 mb-1 font-semibold">TIPE ABSEN</div>
                    <div className="text-sm font-bold text-emerald-700">{scanResult.tipeAbsen || '-'}</div>
                  </div>
                  <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="text-xs text-amber-600 mb-1 font-semibold">JAM ABSEN</div>
                    <div className="text-sm font-bold text-amber-700">{scanResult.timestamp || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Status Message Box */}
              {scanResult.statusMessage && (
                <div className={`${statusClasses.bgBox} border ${statusClasses.borderBox} rounded-lg p-4`}>
                  <div className="flex items-start">
                    <CheckCircle size={20} className={`${statusClasses.textIcon} mr-2 flex-shrink-0 mt-0.5 animate-pulse`} />
                    <p className={`text-sm ${statusClasses.text}`}>{scanResult.statusMessage}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen, scanResult, showResultModal = false, onCloseResult }) => {
  const { setIsQRScannerOpen } = useQRScanner();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState(false);
  const scanCooldownRef = useRef<number>(0);
  const lastScanDataRef = useRef<string>('');
  const previousViewRef = useRef<'mobile' | 'desktop' | null>(null);

  // Update context when QRScanner opens/closes
  useEffect(() => {
    setIsQRScannerOpen(isOpen);
    return () => {
      setIsQRScannerOpen(false);
    };
  }, [isOpen, setIsQRScannerOpen]);

  // Use different IDs for mobile and desktop to avoid conflicts
  const mobileScannerId = 'qr-reader-mobile';
  const desktopScannerId = 'qr-reader-desktop';

  // Helper function to get current view type
  const getCurrentView = (): 'mobile' | 'desktop' => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'mobile' : 'desktop';
    }
    return 'desktop';
  };

  // Cooldown period in milliseconds (10 seconds to prevent rapid re-scans and duplicate scans)
  const SCAN_COOLDOWN = 2000;

  // Initialize cameras
  useEffect(() => {
    if (isOpen) {
      if (!isInitialized) {
        Html5Qrcode.getCameras().then(devices => {
          if (devices.length > 0) {
            setCameras(devices);
            const preferred = devices.find(c => c.label.toLowerCase().includes('back')) || devices[0];
            setSelectedCamera(preferred.id);
            setIsInitialized(true);
          } else {
            setError('No camera found.');
          }
        }).catch(err => {
          setError('Failed to get cameras. Please allow camera access.');
          console.error(err);
        });
      }
    }
  }, [isOpen, isInitialized]);

  const previousCameraRef = useRef<string>('');

  // Auto-start scanner when camera is selected and modal is open
  useEffect(() => {
    if (isOpen && selectedCamera && isInitialized && !isScanning) {
      // Initialize view ref on first start
      if (previousViewRef.current === null) {
        previousViewRef.current = getCurrentView();
      }
      startScanning();
      previousCameraRef.current = selectedCamera;
    }
  }, [isOpen, selectedCamera, isInitialized]);

  // Restart scanner when camera changes (only if scanner is already running)
  useEffect(() => {
    if (isOpen && selectedCamera && isInitialized && isScanning && previousCameraRef.current && previousCameraRef.current !== selectedCamera) {
      const restart = async () => {
        await stopScanning();
        // Small delay to ensure cleanup is complete
        setTimeout(() => {
          if (isOpen && selectedCamera) {
            startScanning();
            previousCameraRef.current = selectedCamera;
          }
        }, 100);
      };
      restart();
    } else if (selectedCamera) {
      previousCameraRef.current = selectedCamera;
    }
  }, [selectedCamera]);

  // Track window resize to detect view changes and restart scanner
  useEffect(() => {
    if (!isOpen || !selectedCamera || !isInitialized) {
      return;
    }

    // Initialize previous view on first run
    if (previousViewRef.current === null) {
      previousViewRef.current = getCurrentView();
    }

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const currentView = getCurrentView();
        const previousView = previousViewRef.current;
        
        // If view changed and scanner is running, restart scanner
        if (previousView !== null && previousView !== currentView && isScanning) {
          const restart = async () => {
            await stopScanning();
            // Small delay to ensure cleanup is complete and DOM is updated
            setTimeout(() => {
              if (isOpen && selectedCamera) {
                startScanning();
              }
            }, 200);
          };
          restart();
        }
        
        previousViewRef.current = currentView;
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, selectedCamera, isInitialized, isScanning]);

  // Auto-close result modal after 3 seconds
  useEffect(() => {
    if (scanResult && showResultModal) {
      const timer = setTimeout(() => {
        if (onCloseResult) {
          onCloseResult();
        }
      }, 3000); // 3 seconds

      return () => {
        clearTimeout(timer);
      };
    }
  }, [scanResult, showResultModal, onCloseResult]);

  // Cleanup saat component unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanning();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) return;

    setError('');

    // Optimized configuration for better scanning performance
    const isMobile = window.innerWidth < 768;
    
    // Enhanced config with better FPS for faster scanning
    const config = {
      fps: 20, // Increased from 10 to 20 for faster, more responsive scanning (balanced for compatibility)
      aspectRatio: 1.0, // Keep 1.0 for square aspect ratio (better compatibility)
      disableFlip: false, // Allow automatic flip detection
    };

    // Jika scanner sudah ada dan sedang berjalan, hentikan dulu
    if (scannerRef.current && isScanning) {
      await stopScanning();
    }
    
    // Determine the correct ID based on current view
    const currentViewId = isMobile ? mobileScannerId : desktopScannerId;
    scannerRef.current = new Html5Qrcode(currentViewId);

    try {
      await scannerRef.current.start(
        selectedCamera,
        config,
        (decodedText) => {
          const currentTime = Date.now();

          // Validate decoded text before processing
          if (!decodedText || decodedText.trim().length === 0) {
            return;
          }

          // Check for duplicate scan within cooldown period using refs for reliable checking
          if (
            decodedText === lastScanDataRef.current && 
            (currentTime - scanCooldownRef.current) < SCAN_COOLDOWN
          ) {
            // Silently ignore duplicate scans (no console log to reduce noise)
            return;
          }

          // Update last scan data and time using refs BEFORE processing
          // This prevents multiple callbacks from processing the same scan
          lastScanDataRef.current = decodedText;
          scanCooldownRef.current = currentTime;

          // Show success message
          setLastScannedResult(true);

          // Call the onScan callback
          // Note: Scanner continues running, but cooldown prevents duplicate processing
          onScan(decodedText);

          // Hide success message after 2 seconds
          setTimeout(() => {
            setLastScannedResult(false);
          }, 2000);
        },
        (errorMessage) => {
          // Enhanced error handling - log errors but don't stop scanning
          // Only log non-critical errors (scanning errors are normal and expected)
          if (errorMessage && !errorMessage.includes('NotFoundException')) {
            console.debug('QR scanning error (non-critical):', errorMessage);
          }
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      // Enhanced error handling
      console.error('Scanner start error:', err);
      setError('Camera failed to start: ' + (err.message || 'Unknown error'));
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      } catch (err) {
        console.error('Stop error:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const refreshCamera = async () => {
    if (!selectedCamera) return;
    
    const wasScanning = isScanning;
    
    // Stop scanner jika sedang berjalan
    if (wasScanning) {
      await stopScanning();
      // Tunggu sebentar untuk memastikan cleanup selesai
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Reset error
    setError('');
    setLastScannedResult(false);
    
    // Restart scanner
    if (wasScanning) {
      await startScanning();
    }
  };

  const handleClose = async () => {
    if (isScanning) {
      await stopScanning();
    }
    setError('');
    // Reset scan tracking when closing
    setLastScannedResult(false);
    scanCooldownRef.current = 0;
    lastScanDataRef.current = '';
    previousViewRef.current = null; // Reset view ref for next open
    onClose();
  };
 
  if (!isOpen) {
    // Still render result modal even if scanner is closed
    return (
      <>
        <ScanResultModal 
          scanResult={scanResult || null}
          showModal={showResultModal}
          onClose={() => {
            if (onCloseResult) {
              onCloseResult();
            }
          }} 
        />
      </>
    );
  }

  return (
    <>
      {/* Mobile Full Screen Layout */}
      <div className="md:hidden fixed inset-0 bg-black z-50 flex flex-col">
        {/* Minimal Header - Mobile only */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <button 
            onClick={handleClose}
            className="p-2 bg-black/50 backdrop-blur-sm rounded-full transition-all duration-200 text-white hover:bg-black/70 active:scale-95"
            aria-label="Tutup scanner"
          >
            <X size={28} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshCamera}
              disabled={!selectedCamera}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-full transition-all duration-200 text-white hover:bg-black/70 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh kamera"
            >
              <RefreshCw size={20} className={isScanning ? 'animate-spin' : ''} />
            </button>
            {cameras.length > 1 && (
              <select
                className="bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                disabled={isScanning}
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id} className="bg-gray-800">
                    {cam.label.length > 20 ? cam.label.substring(0, 20) + '...' : cam.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Full Screen Camera Preview - Mobile */}
        <div className="relative w-full h-full flex-1 bg-black">
          <style>{`
            #${mobileScannerId} {
              width: 100% !important;
              height: 100% !important;
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
            }
            #${mobileScannerId} video {
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              display: block !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
            }
            #${mobileScannerId} canvas {
              display: none !important;
            }
            #${mobileScannerId} > div {
              width: 100% !important;
              height: 100% !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
            }
            @keyframes scanLine {
              0% {
                top: 0%;
                opacity: 1;
              }
              50% {
                top: calc(100% - 4px);
                opacity: 0.8;
              }
              100% {
                top: 0%;
                opacity: 1;
              }
            }
          `}</style>
          <div className="absolute inset-0 w-full h-full">
            <div
              id={mobileScannerId}
              className="w-full h-full"
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
            ></div>
            
            {/* Scanning Guide Overlay - Mobile */}
            {isScanning && !lastScannedResult && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-[75%] h-[75%] max-w-[400px] max-h-[400px] min-w-[200px] min-h-[200px]">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-12 h-12">
                    <div className="absolute top-0 left-0 w-full border-t-4 border-blue-400 rounded-tl-xl"></div>
                    <div className="absolute top-0 left-0 h-full border-l-4 border-blue-400 rounded-tl-xl"></div>
                  </div>
                  <div className="absolute top-0 right-0 w-12 h-12">
                    <div className="absolute top-0 right-0 w-full border-t-4 border-blue-400 rounded-tr-xl"></div>
                    <div className="absolute top-0 right-0 h-full border-r-4 border-blue-400 rounded-tr-xl"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-12 h-12">
                    <div className="absolute bottom-0 left-0 w-full border-b-4 border-blue-400 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 left-0 h-full border-l-4 border-blue-400 rounded-bl-xl"></div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-12 h-12">
                    <div className="absolute bottom-0 right-0 w-full border-b-4 border-blue-400 rounded-br-xl"></div>
                    <div className="absolute bottom-0 right-0 h-full border-r-4 border-blue-400 rounded-br-xl"></div>
                  </div>
                  {/* Scanning line - Animated up and down */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                      style={{
                        animation: 'scanLine 2s ease-in-out infinite',
                        top: '0%'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Status indicator - Mobile */}
            {isScanning && !lastScannedResult && (
              <div className="absolute top-20 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-blue-400/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white">Scanning...</span>
              </div>
            )}

            {/* Success Overlay - Mobile */}
            {lastScannedResult && (
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/95 via-emerald-500/95 to-green-600/95 backdrop-blur-md flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-2xl max-w-[85%] mx-4 border-2 border-green-200/50">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 p-3 bg-green-100 rounded-full">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-700 mb-2">Scan Berhasil!</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      QR Code berhasil dipindai. Scanner siap untuk scan berikutnya.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Control Buttons - Bottom Overlay Mobile */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-4 py-6 pb-safe">
            <div className="flex flex-col gap-3">
              {isScanning ? (
                <>
                  <div className="bg-white/30 backdrop-blur-sm border border-white/20 text-white py-3.5 px-5 rounded-xl flex items-center justify-center text-sm font-semibold">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-3"></div>
                    <Camera className="mr-2" size={18} />
                    <span>Scanner aktif</span>
                  </div>
                  <button
                    onClick={stopScanning}
                    className="w-full bg-red-500 text-white py-3.5 px-6 rounded-xl hover:bg-red-600 transition-all duration-200 flex items-center justify-center text-sm font-semibold shadow-lg"
                  >
                    <StopCircle className="mr-2" size={18} />
                    Stop
                  </button>
                </>
              ) : (
                <button
                  onClick={startScanning}
                  disabled={!selectedCamera}
                  className="w-full bg-green-500 text-white py-3.5 px-6 rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-semibold shadow-lg"
                >
                  <Camera className="mr-2" size={18} />
                  Start Scanning
                </button>
              )}
            </div>
          </div>

          {/* Error Display - Mobile */}
          {error && (
            <div className="absolute top-24 left-4 right-4 z-20 bg-red-500/90 backdrop-blur-sm text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-top">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">Terjadi Kesalahan</div>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex fixed inset-0 bg-black/60 backdrop-blur-sm justify-center items-center z-50 p-4 lg:p-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-hidden m-0 border border-gray-200/50 flex flex-col">
          {/* Header - Desktop */}
          <div className="flex justify-between items-center px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Camera className="text-blue-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Scan QR Code</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Arahkan kamera ke QR Code untuk memindai</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshCamera}
                disabled={!selectedCamera}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 text-gray-500 hover:text-gray-800 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Refresh kamera"
              >
                <RefreshCw size={20} className={isScanning ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 text-gray-500 hover:text-gray-800 hover:scale-110 active:scale-95"
                aria-label="Tutup scanner"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col md:flex-row md:gap-4 md:p-4 lg:p-6 overflow-hidden">
            {/* Left side - Camera Selection & Controls (only show on desktop) */}
            <div className="hidden md:flex md:w-48 lg:w-56 flex-shrink-0 flex-col gap-4">
              {/* Camera Selection */}
              {cameras.length > 1 ? (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <label htmlFor="camera" className="block text-sm font-semibold text-gray-700 mb-3">
                    Pilih Kamera
                  </label>
                  <select
                    id="camera"
                    className="w-full border-2 border-gray-200 bg-white p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    disabled={isScanning}
                  >
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label.length > 30 ? cam.label.substring(0, 30) + '...' : cam.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Kamera</div>
                  <div className="text-xs text-gray-500">Kamera default terdeteksi</div>
                </div>
              )}

              {/* Control Buttons - Desktop only */}
              <div className="flex flex-col gap-3 flex-shrink-0 mt-auto">
                {isScanning ? (
                  <>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 py-3.5 px-4 rounded-xl flex items-center justify-center text-sm font-semibold shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <Camera className="mr-2" size={16} />
                      <span className="text-xs">Scanning...</span>
                    </div>
                    <button
                      onClick={stopScanning}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 px-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      <StopCircle className="mr-2" size={18} />
                      Stop
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startScanning}
                    disabled={!selectedCamera}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
                  >
                    <Camera className="mr-2" size={18} />
                    Start Scanning
                  </button>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 md:p-0 md:gap-3 lg:gap-4 overflow-hidden">
              {/* Camera Selection - Mobile only */}
              {cameras.length > 1 && (
                <div className="md:hidden bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 mb-3 sm:mb-4 flex-shrink-0">
                  <label htmlFor="camera-mobile" className="block text-sm font-semibold text-gray-700 mb-2">
                    Pilih Kamera
                  </label>
                  <select
                    id="camera-mobile"
                    className="w-full border-2 border-gray-200 bg-white p-2.5 sm:p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300"
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    disabled={isScanning}
                  >
                    {cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label.length > 40 ? cam.label.substring(0, 40) + '...' : cam.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Scanner Preview - Enhanced with modern design - Responsive for mobile/tablet */}
              <div className="relative group w-full flex-1 min-h-[450px] sm:min-h-[500px] md:min-h-[500px] lg:min-h-[600px] flex items-stretch justify-center flex-shrink-0">
                {/* Outer container with gradient border effect */}
                <div 
                  className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-0.5 sm:p-1 shadow-2xl w-full h-full"
                  style={{
                    minHeight: '450px',
                    height: '100%',
                    width: '100%'
                  }}
                >
                  {/* Inner container - Responsive sizing */}
                  <div 
                    className="relative rounded-lg sm:rounded-xl overflow-hidden bg-black w-full h-full flex items-center justify-center"
                    style={{
                      minHeight: '450px',
                      height: '100%',
                      width: '100%',
                      position: 'relative'
                    }}
                  >
                    <style>{`
                      #${desktopScannerId} {
                        width: 100% !important;
                        height: 100% !important;
                        min-height: 450px !important;
                        display: block !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                      }
                      #${desktopScannerId} video {
                        width: 100% !important;
                        height: 100% !important;
                        min-height: 450px !important;
                        object-fit: cover !important;
                        display: block !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                      }
                      #${desktopScannerId} canvas {
                        display: none !important;
                      }
                      #${desktopScannerId} > div {
                        width: 100% !important;
                        height: 100% !important;
                        min-height: 450px !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                      }
                      @media (min-width: 640px) {
                        #${desktopScannerId} {
                          min-height: 500px !important;
                        }
                        #${desktopScannerId} video {
                          min-height: 500px !important;
                        }
                        #${desktopScannerId} > div {
                          min-height: 500px !important;
                        }
                      }
                      @keyframes scanLine {
                        0% {
                          top: 0%;
                          opacity: 1;
                        }
                        50% {
                          top: calc(100% - 4px);
                          opacity: 0.8;
                        }
                        100% {
                          top: 0%;
                          opacity: 1;
                        }
                      }
                    `}</style>
                    <div
                      id={desktopScannerId}
                      className="w-full h-full absolute inset-0"
                      style={{
                        minHeight: '450px',
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                      }}
                    ></div>
                    
                    {/* Scanning Guide Overlay - Modern corner brackets */}
                    {isScanning && !lastScannedResult && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* Corner brackets for scanning guide - Responsive size for mobile/tablet/desktop */}
                        <div className="relative w-[75%] h-[75%] sm:w-[70%] sm:h-[70%] max-w-[400px] max-h-[400px] sm:max-w-[450px] sm:max-h-[450px] min-w-[200px] min-h-[200px] md:max-w-[500px] md:max-h-[500px]">
                          {/* Top-left corner */}
                          <div className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16">
                            <div className="absolute top-0 left-0 w-full border-t-3 sm:border-t-4 border-blue-400 rounded-tl-lg sm:rounded-tl-xl"></div>
                            <div className="absolute top-0 left-0 h-full border-l-3 sm:border-l-4 border-blue-400 rounded-tl-lg sm:rounded-tl-xl"></div>
                          </div>
                          {/* Top-right corner */}
                          <div className="absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16">
                            <div className="absolute top-0 right-0 w-full border-t-3 sm:border-t-4 border-blue-400 rounded-tr-lg sm:rounded-tr-xl"></div>
                            <div className="absolute top-0 right-0 h-full border-r-3 sm:border-r-4 border-blue-400 rounded-tr-lg sm:rounded-tr-xl"></div>
                          </div>
                          {/* Bottom-left corner */}
                          <div className="absolute bottom-0 left-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16">
                            <div className="absolute bottom-0 left-0 w-full border-b-3 sm:border-b-4 border-blue-400 rounded-bl-lg sm:rounded-bl-xl"></div>
                            <div className="absolute bottom-0 left-0 h-full border-l-3 sm:border-l-4 border-blue-400 rounded-bl-lg sm:rounded-bl-xl"></div>
                          </div>
                          {/* Bottom-right corner */}
                          <div className="absolute bottom-0 right-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16">
                            <div className="absolute bottom-0 right-0 w-full border-b-3 sm:border-b-4 border-blue-400 rounded-br-lg sm:rounded-br-xl"></div>
                            <div className="absolute bottom-0 right-0 h-full border-r-3 sm:border-r-4 border-blue-400 rounded-br-lg sm:rounded-br-xl"></div>
                          </div>
                          {/* Animated scanning line - Up and down */}
                          <div className="absolute inset-0 overflow-hidden rounded-lg">
                            <div 
                              className="absolute left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                              style={{
                                animation: 'scanLine 2s ease-in-out infinite',
                                top: '0%'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Overlay - Enhanced */}
                    {lastScannedResult && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/95 via-emerald-500/95 to-green-600/95 backdrop-blur-md flex items-center justify-center rounded-lg sm:rounded-xl animate-in fade-in duration-300">
                        <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl max-w-[90%] sm:max-w-sm mx-4 border-2 border-green-200/50 transform scale-100 animate-in zoom-in duration-300">
                          <div className="flex flex-col items-center text-center">
                            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-100 rounded-full">
                              <CheckCircle size={24} className="sm:w-8 sm:h-8 text-green-600 animate-in zoom-in duration-500" />
                            </div>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-green-700 mb-1.5 sm:mb-2">Scan Berhasil!</h3>
                            <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed px-2">
                              QR Code berhasil dipindai. Scanner siap untuk scan berikutnya.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status indicator dot */}
                    {isScanning && !lastScannedResult && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-blue-400/30">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] sm:text-xs font-medium text-white">Scanning...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Control Buttons - Mobile only */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 flex-shrink-0 mt-3 sm:mt-4 md:hidden">
                {isScanning ? (
                  <>
                    <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 py-3 px-4 sm:py-3.5 sm:px-5 rounded-xl flex items-center justify-center text-xs sm:text-sm font-semibold shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2 sm:mr-3"></div>
                      <Camera className="mr-1.5 sm:mr-2" size={16} />
                      <span className="hidden sm:inline">Scanner aktif - </span>
                      <span className="truncate">Arahkan kamera ke QR Code</span>
                    </div>
                    <button
                      onClick={stopScanning}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 sm:py-3.5 sm:px-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-w-[100px] sm:min-w-[120px]"
                    >
                      <StopCircle className="mr-1.5 sm:mr-2" size={16} />
                      Stop
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startScanning}
                    disabled={!selectedCamera}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 sm:py-3.5 sm:px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
                  >
                    <Camera className="mr-1.5 sm:mr-2" size={16} />
                    Start Scanning
                  </button>
                )}
              </div>

              {/* Error Display - Enhanced */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-3 sm:p-4 text-red-700 shadow-sm animate-in slide-in-from-top duration-300 flex-shrink-0">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <AlertCircle size={18} className="sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 text-red-600" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm mb-1">Terjadi Kesalahan</div>
                      <span className="text-xs sm:text-sm break-words">{error}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Scan Result Modal - Rendered outside QRScanner modal to ensure proper z-index */}
      {/* Modal akan ditampilkan jika scanResult ada (showResultModal default true jika scanResult ada) */}
      <ScanResultModal 
        scanResult={scanResult || null}
        showModal={scanResult ? (showResultModal !== false) : false}
        onClose={() => {
          if (onCloseResult) {
            onCloseResult();
          }
        }} 
      />
    </>
  );
};

export default QRScanner;