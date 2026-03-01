import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
  Camera,
  CheckCircle,
  XCircle,
  SwitchCamera,
  AlertCircle,
  User,
  Loader,
  X,
} from 'lucide-react';
import {
  loadFaceDetectionModels,
  extractFaceDescriptor,
  dataURLToImage,
  base64ToDescriptor,
  validateFaceInImage,
  drawFaceDetection,
  getSimilarityThresholdForFaceRatio,
  getAverageSimilarityToDescriptors,
  passesMinDescriptorsAboveThreshold,
} from '../../../../utils/faceDetection';

interface FaceDetectionCameraProps {
  registeredFaces: string[]; // Base64 encoded face descriptors
  onFaceMatch: (photo: string, confidence: number) => void;
  onError: (error: string) => void;
  isActive: boolean;
}

const FaceDetectionCamera: React.FC<FaceDetectionCameraProps> = ({
  registeredFaces,
  onFaceMatch,
  onError,
  isActive,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<string>('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCooldown, setVerificationCooldown] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const initializeFaceDetection = async () => {
      setIsLoadingModels(true);
      try {
        const loaded = await loadFaceDetectionModels();
        setModelsLoaded(loaded);
        if (!loaded) {
          onError('Gagal memuat model deteksi wajah. Silakan refresh halaman.');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error initializing face detection:', error);
        onError('Gagal menginisialisasi deteksi wajah.');
      } finally {
        setIsLoadingModels(false);
      }
    };

    initializeFaceDetection();
  }, [onError]);

  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) => {
      const videoDevices = mediaDevices.filter(({ kind }) => kind === 'videoinput');
      setDevices(videoDevices);

      if (videoDevices.length > 0 && !currentDeviceId) {
        const frontCamera = videoDevices.find(
          (device) =>
            device.label.toLowerCase().includes('front') ||
            device.label.toLowerCase().includes('user')
        );
        setCurrentDeviceId(frontCamera ? frontCamera.deviceId : videoDevices[0].deviceId);
      }
    },
    [currentDeviceId]
  );

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  const performRealTimeDetection = useCallback(async () => {
    if (
      !webcamRef.current ||
      !modelsLoaded ||
      !isCapturing ||
      isProcessing ||
      isVerifying ||
      verificationCooldown
    )
      return;

    try {
      const video = webcamRef.current.video as HTMLVideoElement | null;
      if (!video || video.readyState !== 4) return;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const imageElement = await dataURLToImage(imageDataUrl);

      const validation = await validateFaceInImage(imageElement);

      if (validation.isValid) {
        const faceRatio = validation.faceRatio ?? 0.5;
        const matchThreshold = getSimilarityThresholdForFaceRatio(faceRatio);

        setDetectionStatus('✅ Wajah terdeteksi - Siap untuk verifikasi');
        setFaceDetected(true);

        if (canvasRef.current) {
          await drawFaceDetection(imageElement, canvasRef.current, faceRatio);
        }

        if (!isVerifying && !verificationCooldown) {
          setIsVerifying(true);
          setDetectionStatus('🔍 Memverifikasi wajah...');

          try {
            const currentDescriptor = await extractFaceDescriptor(imageElement);
            if (!currentDescriptor) {
              setDetectionStatus('❌ Gagal mengekstrak data wajah');
            } else if (!registeredFaces.length) {
              setDetectionStatus('❌ Tidak ada data wajah guru yang terdaftar');
            } else {
              const registeredDescriptors = registeredFaces.map((b64) => base64ToDescriptor(b64));
              const avgSimilarity = getAverageSimilarityToDescriptors(
                currentDescriptor,
                registeredDescriptors
              );
              const isMatch = passesMinDescriptorsAboveThreshold(
                currentDescriptor,
                registeredDescriptors,
                matchThreshold
              );

              if (isMatch) {
                setDetectionStatus(
                  `✅ Verifikasi berhasil! Confidence: ${(avgSimilarity * 100).toFixed(1)}%`
                );
                setVerificationCooldown(true);
                setTimeout(() => {
                  onFaceMatch(imageDataUrl, avgSimilarity);
                }, 600);
                setTimeout(() => {
                  setVerificationCooldown(false);
                  setDetectionStatus('🔍 Mencari wajah berikutnya...');
                }, 3000);
              } else {
                const percent = (avgSimilarity * 100).toFixed(1);
                setDetectionStatus(
                  `❌ Wajah tidak cocok (${percent}% - perlu min 2 descriptor di atas threshold)`
                );
                setVerificationCooldown(true);
                setTimeout(() => {
                  setVerificationCooldown(false);
                  setDetectionStatus('🔍 Mencari wajah...');
                }, 2000);
              }
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error in auto verification:', error);
            setDetectionStatus('❌ Error verifikasi wajah');
            setVerificationCooldown(true);
            setTimeout(() => {
              setVerificationCooldown(false);
              setDetectionStatus('🔍 Mencari wajah...');
            }, 2000);
          } finally {
            setIsVerifying(false);
          }
        }
      } else {
        setDetectionStatus(validation.message);
        setFaceDetected(false);
        if (canvasRef.current) {
          const overlayCtx = canvasRef.current.getContext('2d');
          if (overlayCtx) {
            overlayCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in real-time detection:', error);
    }
  }, [
    modelsLoaded,
    isCapturing,
    isProcessing,
    isVerifying,
    verificationCooldown,
    registeredFaces,
    onFaceMatch,
  ]);

  useEffect(() => {
    if (isCapturing && modelsLoaded) {
      const id = window.setInterval(performRealTimeDetection, 300);
      detectionIntervalRef.current = id;
    } else if (detectionIntervalRef.current) {
      window.clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isCapturing, modelsLoaded, performRealTimeDetection]);

  const videoConstraints = {
    width: 640,
    height: 480,
    deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
    facingMode: currentDeviceId ? undefined : facingMode,
  };

  const startCamera = () => {
    if (!modelsLoaded) {
      onError('Model deteksi wajah belum dimuat. Silakan tunggu atau refresh halaman.');
      return;
    }

    if (registeredFaces.length === 0) {
      onError(
        'Wajah Anda belum terdaftar dalam sistem. Silakan hubungi admin untuk mendaftarkan wajah Anda agar dapat menggunakan fitur ini.'
      );
      return;
    }

    setIsCapturing(true);
    setDetectionStatus('Memulai deteksi wajah...');
    setFaceDetected(false);
  };

  const stopCamera = () => {
    setIsCapturing(false);
    setDetectionStatus('');
    setFaceDetected(false);
    setIsVerifying(false);
    setVerificationCooldown(false);

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const switchCamera = () => {
    if (devices.length > 1) {
      const currentIndex = devices.findIndex((device) => device.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      setCurrentDeviceId(devices[nextIndex].deviceId);
    } else {
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    }
  };

  const handleUserMediaError = (error: string | DOMException) => {
    // eslint-disable-next-line no-console
    console.error('Camera error:', error);
    let errorMessage = 'Tidak dapat mengakses kamera. ';

    if (typeof error === 'string') {
      errorMessage += error;
    } else if (error.name === 'NotAllowedError') {
      errorMessage += 'Izin kamera ditolak. Silakan berikan izin kamera dan refresh halaman.';
    } else if (error.name === 'NotFoundError') {
      errorMessage += 'Kamera tidak ditemukan.';
    } else {
      errorMessage += `Error: ${error.message}`;
    }

    onError(errorMessage);
    setIsCapturing(false);
  };

  if (!isActive) return null;

  return (
    <div className="space-y-4">
      {isLoadingModels && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
            <div>
              <p className="font-medium text-blue-800">Memuat Model Deteksi Wajah...</p>
              <p className="text-sm text-blue-600">Mohon tunggu, sedang mengunduh model AI</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-purple-500" />
          <div>
            <p className="font-medium text-purple-800">Verifikasi Wajah Aktif</p>
            <p className="text-sm text-purple-600">
              Sistem akan mencocokkan wajah Anda dengan data terdaftar (
              {registeredFaces.length}
              {' '}
              sampel wajah)
            </p>
          </div>
        </div>
      </div>

      {!isCapturing ? (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-purple-500" />
          <h3 className="text-xl font-bold text-gray-800 mb-3">Absen Guru dengan Wajah</h3>
          <p className="text-gray-600 mb-6">
            Klik tombol di bawah untuk membuka kamera dan memverifikasi wajah Anda.
          </p>

          {registeredFaces.length === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">Wajah Belum Terdaftar</p>
                  <p className="text-sm text-red-600">
                    Silakan hubungi admin untuk mendaftarkan wajah Anda terlebih dahulu.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              disabled={!modelsLoaded || isLoadingModels || registeredFaces.length === 0}
              className="px-8 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-medium flex items-center space-x-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
              <span>
                {isLoadingModels
                  ? 'Memuat Model...'
                  : registeredFaces.length === 0
                    ? 'Wajah Belum Terdaftar'
                    : 'Mulai Verifikasi Wajah'}
              </span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-bold text-gray-800">Verifikasi Wajah</h3>
            </div>
            <div className="flex space-x-2">
              {devices.length > 1 && (
                <button
                  type="button"
                  onClick={switchCamera}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  title="Ganti Kamera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={stopCamera}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                title="Tutup Kamera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-xl overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMediaError={handleUserMediaError}
                className="w-full h-64 sm:h-80 object-cover"
                mirrored={false}
              />

              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              <div className="absolute top-2 left-2 right-2 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                    isVerifying
                      ? 'bg-purple-500/90 text-white'
                      : faceDetected
                        ? 'bg-green-500/90 text-white'
                        : 'bg-blue-500/90 text-white'
                  }`}
                >
                  {detectionStatus || '🔍 Mencari wajah...'}
                </span>
              </div>

              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div
                  className={`w-48 h-48 border-4 rounded-full border-dashed transition-colors ${
                    isVerifying
                      ? 'border-purple-400 animate-pulse'
                      : faceDetected
                        ? 'border-green-400'
                        : 'border-white/50'
                  }`}
                />
              </div>

              <div className="absolute bottom-2 left-2 right-2 text-center">
                <div
                  className={`px-6 py-2 rounded-full font-medium backdrop-blur-sm transition-all ${
                    isVerifying
                      ? 'bg-purple-500/90 text-white'
                      : faceDetected
                        ? 'bg-green-500/90 text-white'
                        : 'bg-blue-500/90 text-white'
                  }`}
                >
                  {isVerifying ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      <span>Memverifikasi...</span>
                    </div>
                  ) : faceDetected ? (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Wajah Terdeteksi - Verifikasi Otomatis</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader className="w-4 h-4" />
                      <span>Posisikan Wajah di Tengah</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {devices.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-600">
                  Kamera aktif:
                  {' '}
                  {devices.find((d) => d.deviceId === currentDeviceId)?.label || 'Default Camera'}
                </p>
                {devices.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Gunakan tombol ganti kamera untuk beralih antar kamera
                  </p>
                )}
                <p className="text-xs text-green-600 mt-1 font-medium">
                  🤖 Verifikasi Otomatis Aktif - Tidak perlu klik tombol
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceDetectionCamera;

