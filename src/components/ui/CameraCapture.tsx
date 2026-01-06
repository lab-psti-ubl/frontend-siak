// CameraCapture.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle, RefreshCw, Circle } from 'lucide-react';
import { useQRScanner } from '../../context/QRScannerContext';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBase64: string) => void;
  title?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ isOpen, onClose, onCapture, title = 'Ambil Foto' }) => {
  const { setIsCameraCaptureOpen } = useQRScanner();
  const videoRefMobile = useRef<HTMLVideoElement>(null);
  const videoRefDesktop = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Update context when CameraCapture opens/closes
  useEffect(() => {
    setIsCameraCaptureOpen(isOpen);
    return () => {
      setIsCameraCaptureOpen(false);
    };
  }, [isOpen, setIsCameraCaptureOpen]);

  // Get available cameras
  useEffect(() => {
    if (isOpen) {
      const getCameras = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setCameras(videoDevices);
          
          if (videoDevices.length > 0) {
            // Prefer back camera on mobile
            const preferred = videoDevices.find(c => c.label.toLowerCase().includes('back')) || videoDevices[0];
            setSelectedCamera(preferred.deviceId);
          } else {
            setError('Tidak ada kamera ditemukan.');
          }
        } catch (err) {
          console.error('Error getting cameras:', err);
          setError('Gagal mengakses daftar kamera.');
        }
      };
      getCameras();
    }
  }, [isOpen]);

  // Assign stream to video elements when streaming starts
  useEffect(() => {
    if (isStreaming && streamRef.current) {
      // Use requestAnimationFrame to ensure video elements are rendered
      requestAnimationFrame(() => {
        if (videoRefMobile.current && videoRefMobile.current.srcObject !== streamRef.current) {
          videoRefMobile.current.srcObject = streamRef.current;
          videoRefMobile.current.play().catch(err => console.debug('Mobile video play error:', err));
        }
        if (videoRefDesktop.current && videoRefDesktop.current.srcObject !== streamRef.current) {
          videoRefDesktop.current.srcObject = streamRef.current;
          videoRefDesktop.current.play().catch(err => console.debug('Desktop video play error:', err));
        }
      });
    }
  }, [isStreaming]);

  // Start camera stream
  useEffect(() => {
    if (isOpen && selectedCamera && !isStreaming) {
      startCamera();
    }
  }, [isOpen, selectedCamera, isStreaming]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setError('');
    
    try {
      // Stop existing stream first
      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: selectedCamera ? undefined : 'environment'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsStreaming(true);
    } catch (err: any) {
      console.error('Error starting camera:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRefMobile.current) {
      videoRefMobile.current.srcObject = null;
    }
    if (videoRefDesktop.current) {
      videoRefDesktop.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const refreshCamera = async () => {
    if (!selectedCamera) return;
    
    const wasStreaming = isStreaming;
    stopCamera();
    
    // Small delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (wasStreaming) {
      await startCamera();
    }
  };

  const capturePhoto = () => {
    // Use the active video element (mobile or desktop)
    const videoElement = videoRefMobile.current || videoRefDesktop.current;
    if (!videoElement || !canvasRef.current || !isStreaming || isCapturing) return;

    setIsCapturing(true);

    try {
      const video = videoElement;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);
        
        // Call onCapture callback
        onCapture(imageBase64);
        
        // Close modal after capture
        setTimeout(() => {
          handleClose();
        }, 300);
      }
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Gagal mengambil foto.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setError('');
    setSelectedCamera('');
    onClose();
  };


  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Mobile Full Screen Layout */}
      <div className="md:hidden fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header - Mobile */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <button 
            onClick={handleClose}
            className="p-2 bg-black/50 backdrop-blur-sm rounded-full transition-all duration-200 text-white hover:bg-black/70 active:scale-95"
            aria-label="Tutup kamera"
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
              <RefreshCw size={20} className={isStreaming ? 'animate-spin' : ''} />
            </button>
            {cameras.length > 1 && (
              <select
                className="bg-black/50 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                disabled={isStreaming}
              >
                {cameras.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId} className="bg-gray-800">
                    {cam.label.length > 20 ? cam.label.substring(0, 20) + '...' : cam.label || `Kamera ${cam.deviceId.substring(0, 8)}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Camera Preview - Mobile */}
        <div className="relative w-full h-full flex-1 bg-black">
          <video
            ref={videoRefMobile}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover absolute inset-0"
            style={{ 
              transform: 'scaleX(-1)',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              objectFit: 'cover'
            }}
          />

          {/* Title Overlay - Mobile */}
          {title && (
            <div className="absolute top-20 left-4 right-4 z-10 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <p className="text-white text-sm font-semibold text-center">{title}</p>
            </div>
          )}

          {/* Status indicator - Mobile */}
          {isStreaming && (
            <div className="absolute top-36 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-blue-400/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-white">Kamera Aktif</span>
            </div>
          )}

          {/* Capture Guide Overlay - Mobile */}
          {isStreaming && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[85%] h-[70%] max-w-[400px] max-h-[500px] min-w-[250px] min-h-[300px]">
                {/* Corner brackets for photo frame */}
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
              </div>
            </div>
          )}

          {/* Control Buttons - Bottom Overlay Mobile */}
          <div className="absolute bottom-10 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/60 to-transparent px-4 py-6 pb-safe">
            <div className="flex flex-col gap-3">
              {isStreaming ? (
                <>
                  
                  <button
                    onClick={capturePhoto}
                    disabled={isCapturing}
                    className="w-full bg-blue-500 text-white py-3.5 px-6 rounded-xl hover:bg-blue-600 transition-all duration-200 flex items-center justify-center text-sm font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="mr-2" size={18} />
                    {isCapturing ? 'Mengambil Foto...' : 'Ambil Foto'}
                  </button>
                </>
              ) : (
                <button
                  onClick={startCamera}
                  disabled={!selectedCamera}
                  className="w-full bg-green-500 text-white py-3.5 px-6 rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-semibold shadow-lg"
                >
                  <Camera className="mr-2" size={18} />
                  Mulai Kamera
                </button>
              )}
            </div>
          </div>

          {/* Error Display - Mobile */}
          {error && (
            <div className="absolute top-28 left-4 right-4 z-20 bg-red-500/90 backdrop-blur-sm text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-top">
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
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Arahkan kamera dan ambil foto bukti mengajar</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshCamera}
                disabled={!selectedCamera}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 text-gray-500 hover:text-gray-800 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Refresh kamera"
              >
                <RefreshCw size={20} className={isStreaming ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 text-gray-500 hover:text-gray-800 hover:scale-110 active:scale-95"
                aria-label="Tutup kamera"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col md:flex-row md:gap-4 md:p-4 lg:p-6 overflow-hidden">
            {/* Left side - Camera Selection & Controls (Desktop only) */}
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
                    disabled={isStreaming}
                  >
                    {cameras.map((cam) => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label.length > 30 ? cam.label.substring(0, 30) + '...' : cam.label || `Kamera ${cam.deviceId.substring(0, 8)}`}
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
                {isStreaming ? (
                  <>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 py-3.5 px-4 rounded-xl flex items-center justify-center text-sm font-semibold shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <Camera className="mr-2" size={16} />
                      <span className="text-xs">Kamera Aktif</span>
                    </div>
                    <button
                      onClick={capturePhoto}
                      disabled={isCapturing}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <Camera className="mr-2" size={18} />
                      {isCapturing ? 'Mengambil...' : 'Ambil Foto'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startCamera}
                    disabled={!selectedCamera}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
                  >
                    <Camera className="mr-2" size={18} />
                    Mulai Kamera
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
                    disabled={isStreaming}
                  >
                    {cameras.map((cam) => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label.length > 40 ? cam.label.substring(0, 40) + '...' : cam.label || `Kamera ${cam.deviceId.substring(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Camera Preview - Enhanced with modern design */}
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
                  {/* Inner container */}
                  <div 
                    className="relative rounded-lg sm:rounded-xl overflow-hidden bg-black w-full h-full flex items-center justify-center"
                    style={{
                      minHeight: '450px',
                      height: '100%',
                      width: '100%',
                      position: 'relative'
                    }}
                  >
                    {isStreaming ? (
                      <>
                        <video
                          ref={videoRefDesktop}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover absolute inset-0"
                          style={{ 
                            transform: 'scaleX(-1)',
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            objectFit: 'cover'
                          }}
                        />

                        {/* Capture Guide Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="relative w-[75%] h-[70%] sm:w-[70%] sm:h-[65%] max-w-[400px] max-h-[450px] sm:max-w-[450px] sm:max-h-[500px] min-w-[250px] min-h-[300px] md:max-w-[500px] md:max-h-[550px]">
                            {/* Corner brackets for photo frame */}
                            <div className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16">
                              <div className="absolute top-0 left-0 w-full border-t-3 sm:border-t-4 border-blue-400 rounded-tl-lg sm:rounded-tl-xl"></div>
                              <div className="absolute top-0 left-0 h-full border-l-3 sm:border-l-4 border-blue-400 rounded-tl-lg sm:rounded-tl-xl"></div>
                            </div>
                            <div className="absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16">
                              <div className="absolute top-0 right-0 w-full border-t-3 sm:border-t-4 border-blue-400 rounded-tr-lg sm:rounded-tr-xl"></div>
                              <div className="absolute top-0 right-0 h-full border-r-3 sm:border-r-4 border-blue-400 rounded-tr-lg sm:rounded-tr-xl"></div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16">
                              <div className="absolute bottom-0 left-0 w-full border-b-3 sm:border-b-4 border-blue-400 rounded-bl-lg sm:rounded-bl-xl"></div>
                              <div className="absolute bottom-0 left-0 h-full border-l-3 sm:border-l-4 border-blue-400 rounded-bl-lg sm:rounded-bl-xl"></div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16">
                              <div className="absolute bottom-0 right-0 w-full border-b-3 sm:border-b-4 border-blue-400 rounded-br-lg sm:rounded-br-xl"></div>
                              <div className="absolute bottom-0 right-0 h-full border-r-3 sm:border-r-4 border-blue-400 rounded-br-lg sm:rounded-br-xl"></div>
                            </div>
                          </div>
                        </div>

                        {/* Status indicator */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-blue-400/30">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-[10px] sm:text-xs font-medium text-white">Kamera Aktif</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 p-8">
                        <Camera size={64} className="mb-4 opacity-50" />
                        <p className="text-sm font-medium">Kamera belum dimulai</p>
                        <p className="text-xs mt-1 opacity-75">Klik tombol "Mulai Kamera" untuk memulai</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Control Buttons - Mobile only */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 flex-shrink-0 mt-3 sm:mt-4 md:hidden">
                {isStreaming ? (
                  <>
                    <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 py-3 px-4 sm:py-3.5 sm:px-5 rounded-xl flex items-center justify-center text-xs sm:text-sm font-semibold shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2 sm:mr-3"></div>
                      <Camera className="mr-1.5 sm:mr-2" size={16} />
                      <span className="hidden sm:inline">Kamera aktif - </span>
                      <span className="truncate">Siap mengambil foto</span>
                    </div>
                    <button
                      onClick={capturePhoto}
                      disabled={isCapturing}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 sm:py-3.5 sm:px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[100px] sm:min-w-[120px]"
                    >
                      <Circle className="mr-1.5 sm:mr-2" size={16} fill="white" />
                      {isCapturing ? 'Mengambil...' : 'Ambil Foto'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startCamera}
                    disabled={!selectedCamera}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 sm:py-3.5 sm:px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none"
                  >
                    <Camera className="mr-1.5 sm:mr-2" size={16} />
                    Mulai Kamera
                  </button>
                )}
              </div>

              {/* Error Display */}
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
    </>
  );
};

export default CameraCapture;
