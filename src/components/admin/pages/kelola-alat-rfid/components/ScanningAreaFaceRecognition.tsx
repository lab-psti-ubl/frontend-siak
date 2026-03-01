import React, { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, Loader, User, AlertCircle } from 'lucide-react';
import Card from '../../../../ui/Card';
import {
  loadFaceDetectionModels,
  extractFaceDescriptor,
  dataURLToImage,
  validateFaceInImage,
  drawFaceDetection,
  getSimilarityThresholdForFaceRatio,
  getAverageSimilarityToDescriptors,
  passesMinDescriptorsAboveThreshold,
} from '../../../../../utils/faceDetection';
import { ScanResult } from '../utils/rfidMonitoringUtils';
import { useGuruFaceDescriptors, GuruFaceRecord } from '../../../../../hooks/useGuruFaceDescriptors';

interface ScanningAreaFaceRecognitionProps {
  onAttendanceResult: (result: ScanResult) => void;
}
const FACE_RESCAN_COOLDOWN_MS = 10 * 60 * 1000; // 10 menit

const ScanningAreaFaceRecognition: React.FC<ScanningAreaFaceRecognitionProps> = ({
  onAttendanceResult,
}) => {
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const { guruFaces, isLoading: isLoadingFaces, errorMessage } = useGuruFaceDescriptors();
  const [detectionStatus, setDetectionStatus] = useState<string>('Menyiapkan kamera untuk verifikasi wajah...');
  const [faceDetected, setFaceDetected] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [lastFaceScanTimes, setLastFaceScanTimes] = useState<Record<string, number>>({});

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);

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

  useEffect(() => {
    const initModels = async () => {
      setIsLoadingModels(true);
      try {
        const loaded = await loadFaceDetectionModels();
        setModelsLoaded(loaded);
        if (!loaded) {
          // Jika model gagal dimuat, error akan ditampilkan di area kamera
          // melalui status komponen ini.
        }
      } catch (error) {
        console.error('Error loading face models for kiosk:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    initModels();
  }, []);

  const performDetection = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded || !guruFaces.length || isVerifying || cooldown) {
      return;
    }

    const nowTs = Date.now();
    // Hard throttle: jangan proses lebih sering dari setiap 800ms
    if (nowTs - lastDetectionTimeRef.current < 800) {
      return;
    }
    lastDetectionTimeRef.current = nowTs;

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

      if (!validation.isValid) {
        setDetectionStatus(validation.message);
        setFaceDetected(false);
        if (canvasRef.current) {
          const overlayCtx = canvasRef.current.getContext('2d');
          if (overlayCtx) {
            overlayCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
        return;
      }

      const faceRatio = validation.faceRatio ?? 0.5;
      const matchThreshold = getSimilarityThresholdForFaceRatio(faceRatio);

      setFaceDetected(true);
      setDetectionStatus('✅ Wajah terdeteksi - Mencari guru yang cocok...');

      if (canvasRef.current) {
        await drawFaceDetection(imageElement, canvasRef.current, faceRatio);
      }

      setIsVerifying(true);

      const currentDescriptor = await extractFaceDescriptor(imageElement);
      if (!currentDescriptor) {
        setDetectionStatus('❌ Gagal mengekstrak data wajah');
        setIsVerifying(false);
        return;
      }

      // Aturan ketat: hanya guru yang punya min 2 descriptor di atas threshold; lalu pilih yang rata-rata similarity tertinggi
      const gurusPassingMinDescriptors = guruFaces.filter((guru) =>
        passesMinDescriptorsAboveThreshold(
          currentDescriptor,
          guru.faceDescriptors,
          matchThreshold
        )
      );

      let bestGuru: GuruFaceRecord | null = null;
      let bestAvgSimilarity = 0;
      gurusPassingMinDescriptors.forEach((guru) => {
        const avgSim = getAverageSimilarityToDescriptors(currentDescriptor, guru.faceDescriptors);
        if (avgSim > bestAvgSimilarity) {
          bestAvgSimilarity = avgSim;
          bestGuru = guru;
        }
      });

      // Jika tidak ada guru yang lolos atau similarity terbaik rendah, abaikan untuk mengurangi false positive
      if (!bestGuru || bestAvgSimilarity < matchThreshold) {
        setDetectionStatus(
          '❌ Wajah tidak cocok, Silahkan Tunggu'
        );
        setIsVerifying(false);
        return;
      }

      const matchedGuru = bestGuru as GuruFaceRecord;

      {
        const now = new Date();
        const nowMs = now.getTime();

        // Cegah duplikat scan wajah yang sama dalam 10 menit
        const lastScanTime = lastFaceScanTimes[matchedGuru.guruId];
        if (lastScanTime && nowMs - lastScanTime < FACE_RESCAN_COOLDOWN_MS) {
          const remainingMs = FACE_RESCAN_COOLDOWN_MS - (nowMs - lastScanTime);
          const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

          setDetectionStatus(
            `⏳ ${matchedGuru.name} sudah melakukan scan. Dapat scan lagi sekitar ${remainingMinutes} menit.`
          );
          setCooldown(true);
          setTimeout(() => {
            setCooldown(false);
            setDetectionStatus('🔍 Mencari wajah berikutnya...');
          }, 2000);
          return;
        }

        const timestamp = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        setDetectionStatus(
          `✅ Terverifikasi sebagai ${matchedGuru.name} (${(bestAvgSimilarity * 100).toFixed(1)}%)`
        );
        setCooldown(true);

        setLastFaceScanTimes((prev) => ({
          ...prev,
          [matchedGuru.guruId]: nowMs,
        }));

        const scanResult: ScanResult = {
          user: {
            id: matchedGuru.guruId,
            name: matchedGuru.name,
            nip: matchedGuru.nip,
          },
          role: 'guru',
          tipeAbsen: 'Masuk/Pulang',
          status: 'tepat_waktu',
          timestamp,
          statusMessage: `Verifikasi wajah berhasil untuk ${matchedGuru.name}`,
        };

        onAttendanceResult(scanResult);

        setTimeout(() => {
          setCooldown(false);
          setDetectionStatus('🔍 Mencari wajah berikutnya...');
        }, 3000);
      }
    } catch (error) {
      console.error('Error in kiosk face detection:', error);
      setDetectionStatus('❌ Terjadi kesalahan saat verifikasi wajah');
      setCooldown(true);
      setTimeout(() => {
        setCooldown(false);
        setDetectionStatus('🔍 Mencari wajah...');
      }, 2000);
    } finally {
      setIsVerifying(false);
    }
  }, [modelsLoaded, guruFaces, isVerifying, cooldown, lastFaceScanTimes, onAttendanceResult]);

  useEffect(() => {
    if (!modelsLoaded || !guruFaces.length) return;

    // Interval agak lebih longgar (600ms) karena sudah ada throttle di dalam performDetection.
    const id = window.setInterval(performDetection, 600);
    detectionIntervalRef.current = id;

    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
      }
    };
  }, [modelsLoaded, guruFaces, performDetection]);

  const isReady = modelsLoaded && guruFaces.length > 0 && !errorMessage;
  const isFaceMismatch = detectionStatus.includes('Wajah tidak cocok');

  return (
    <Card className="border-0 shadow-lg h-full w-full flex overflow-hidden">
      <div className="p-2 sm:p-3 md:p-4 lg:p-5 text-center bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-xl h-full w-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
          <div className="text-left">
            <p className="text-xs sm:text-sm text-slate-300">Mode</p>
            <p className="text-sm sm:text-base font-semibold text-slate-50">
              Face Recognition
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm text-slate-300">Waktu</p>
            <p className="text-sm sm:text-base font-mono font-semibold text-slate-50">
              {currentTime}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2 sm:gap-3 overflow-hidden min-h-0">
          {/* Wrapper kamera: full section kanan kiri atas bawah */}
          <div
            className={`relative rounded-xl overflow-hidden shadow-2xl border flex-1 w-full min-h-0 ${
              isFaceMismatch ? 'bg-red-950 border-red-500/60' : 'bg-black border-blue-500/60'
            }`}
          >
            {isReady ? (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  mirrored={false}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                <div className="absolute top-3 left-0 right-0 flex justify-center">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                      isVerifying
                        ? 'bg-purple-600/90 text-white'
                        : isFaceMismatch
                          ? 'bg-red-600/90 text-white'
                          : faceDetected
                            ? 'bg-emerald-600/90 text-white'
                            : 'bg-slate-700/80 text-slate-100'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    {detectionStatus}
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`w-48 h-48 border-4 rounded-full border-dashed transition-colors ${
                      isVerifying
                        ? 'border-purple-400 animate-pulse'
                        : isFaceMismatch
                          ? 'border-red-400 animate-pulse'
                          : faceDetected
                            ? 'border-emerald-400'
                            : 'border-slate-300/60'
                    }`}
                  />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 gap-3">
                {isLoadingModels || isLoadingFaces ? (
                  <>
                    <div className="w-10 h-10 border-4 border-slate-300 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm sm:text-base">
                      {isLoadingModels
                        ? 'Memuat model deteksi wajah...'
                        : 'Memuat data wajah guru...'}
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-10 h-10 text-amber-400" />
                    <p className="text-sm sm:text-base max-w-md">{errorMessage}</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-700/80 border border-blue-400 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              {isReady ? (
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              ) : (
                <Loader className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-spin" />
              )}
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-blue-50 truncate">
                {isReady
                  ? `Siap untuk verifikasi wajah. Terdaftar ${guruFaces.length} guru.`
                  : 'Menyiapkan sistem face recognition untuk kiosk...'}
              </p>
              <p className="text-[9px] sm:text-[10px] text-blue-100/80 mt-0.5 line-clamp-1">
                Guru cukup berdiri di depan kamera; sistem akan mengenali dan mencatat absensi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ScanningAreaFaceRecognition;

