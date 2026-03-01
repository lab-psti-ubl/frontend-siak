import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import Webcam from 'react-webcam';
import {
  X,
  Camera,
  Upload,
  User,
  CheckCircle,
  XCircle,
  SwitchCamera,
  AlertCircle,
  Trash2,
  Eye,
} from 'lucide-react';
import {
  loadFaceDetectionModels,
  extractFaceDescriptor,
  dataURLToImage,
  descriptorToBase64,
  validateFaceInImage,
  drawFaceDetection,
} from '../../../../../utils/faceDetection';

export interface FaceRegistrationTarget {
  id: string;
  name: string;
  nip?: string;
}

interface FaceRegistrationModalProps {
  guru: FaceRegistrationTarget;
  existingFaces: string[];
  onSave: (faceDescriptors: string[]) => void;
  onClose: () => void;
}

const MAX_AUTO_CAPTURE = 3;
const AUTO_CAPTURE_INTERVAL_MS = 3000;
const INITIAL_CAPTURE_DELAY_MS = 2000;

const FaceRegistrationModal: React.FC<FaceRegistrationModalProps> = ({
  guru,
  existingFaces,
  onSave,
  onClose,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [faceDescriptors, setFaceDescriptors] = useState<string[]>(existingFaces);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoSavedRef = useRef(false);

  useEffect(() => {
    const initializeFaceDetection = async () => {
      setIsLoadingModels(true);
      try {
        const loaded = await loadFaceDetectionModels();
        setModelsLoaded(loaded);
        if (!loaded) {
          setError('Gagal memuat model deteksi wajah. Silakan refresh halaman.');
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error initializing face detection:', err);
        setError('Gagal menginisialisasi deteksi wajah.');
      } finally {
        setIsLoadingModels(false);
      }
    };

    initializeFaceDetection();
  }, []);

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
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }
  }, [handleDevices]);

  const videoConstraints: MediaTrackConstraints = {
    width: 640,
    height: 480,
    deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
    facingMode: currentDeviceId ? undefined : facingMode,
  };

  const startCamera = () => {
    if (!modelsLoaded) {
      setError('Model deteksi wajah belum dimuat. Silakan tunggu atau refresh halaman.');
      return;
    }

    setError('');
    setSuccess('');
    setIsCapturing(true);
  };

  const stopCamera = () => {
    setIsCapturing(false);
  };

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded) return;

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 640,
        height: 480,
      });

      if (!imageSrc) {
        throw new Error('Gagal mengambil foto dari kamera');
      }

      const imageElement = await dataURLToImage(imageSrc);
      const validation = await validateFaceInImage(imageElement);
      if (!validation.isValid) {
        setError(validation.message);
        return;
      }

      const descriptor = await extractFaceDescriptor(imageElement);
      if (!descriptor) {
        setError(
          'Gagal mengekstrak data wajah. Pastikan wajah terlihat jelas dan pencahayaan cukup.'
        );
        return;
      }

      const descriptorBase64 = descriptorToBase64(descriptor);

      setCapturedPhotos((prev) => [...prev, imageSrc]);
      setFaceDescriptors((prev) => [...prev, descriptorBase64]);

      setSuccess(
        `Wajah berhasil dideteksi dan disimpan! Total: ${faceDescriptors.length + 1} wajah terdaftar.`
      );

      if (canvasRef.current) {
        await drawFaceDetection(imageElement, canvasRef.current);
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error capturing and processing face:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses wajah');
    } finally {
      setIsProcessing(false);
    }
  }, [faceDescriptors.length, modelsLoaded]);

  // Auto-capture: ambil gambar otomatis saat kamera aktif, maksimal 3 gambar
  useEffect(() => {
    if (
      !isCapturing ||
      !modelsLoaded ||
      capturedPhotos.length >= MAX_AUTO_CAPTURE ||
      isProcessing
    ) {
      return;
    }

    const tryCapture = () => {
      if (
        capturedPhotos.length >= MAX_AUTO_CAPTURE ||
        isProcessing ||
        !webcamRef.current
      ) {
        return;
      }
      capturePhoto();
    };

    const initialTimeout = setTimeout(tryCapture, INITIAL_CAPTURE_DELAY_MS);
    const interval = setInterval(tryCapture, AUTO_CAPTURE_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [
    isCapturing,
    modelsLoaded,
    capturedPhotos.length,
    isProcessing,
    capturePhoto,
  ]);

  // Auto-save wajah ketika sudah 3 gambar dari kamera
  useEffect(() => {
    if (
      capturedPhotos.length === MAX_AUTO_CAPTURE &&
      faceDescriptors.length > 0 &&
      !hasAutoSavedRef.current
    ) {
      hasAutoSavedRef.current = true;
      setIsCapturing(false);
      onSave(faceDescriptors);
    }
  }, [capturedPhotos.length, faceDescriptors, onSave]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !modelsLoaded) return;

      setIsProcessing(true);
      setError('');
      setSuccess('');

      try {
        if (!file.type.startsWith('image/')) {
          throw new Error('Silakan pilih file gambar yang valid (JPG, PNG, GIF)');
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Ukuran file maksimal 5MB');
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const imageSrc = e.target?.result as string;
            const imageElement = await dataURLToImage(imageSrc);

            const validation = await validateFaceInImage(imageElement);
            if (!validation.isValid) {
              setError(validation.message);
              return;
            }

            const descriptor = await extractFaceDescriptor(imageElement);
            if (!descriptor) {
              setError(
                'Gagal mengekstrak data wajah dari foto. Pastikan foto menampilkan wajah dengan jelas.'
              );
              return;
            }

            const descriptorBase64 = descriptorToBase64(descriptor);

            setCapturedPhotos((prev) => [...prev, imageSrc]);
            setFaceDescriptors((prev) => [...prev, descriptorBase64]);

            setSuccess(
              `Wajah berhasil dideteksi dari foto! Total: ${
                faceDescriptors.length + 1
              } wajah terdaftar.`
            );
          } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat memproses foto');
          } finally {
            setIsProcessing(false);
          }
        };

        reader.onerror = () => {
          setError('Gagal membaca file foto');
          setIsProcessing(false);
        };

        reader.readAsDataURL(file);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat upload foto');
        setIsProcessing(false);
      }
    },
    [faceDescriptors.length, modelsLoaded]
  );

  const removeFace = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
    setFaceDescriptors((prev) => prev.filter((_, i) => i !== index));
    setSuccess(`Wajah dihapus. Total: ${faceDescriptors.length - 1} wajah terdaftar.`);
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

  const handleSave = () => {
    if (faceDescriptors.length === 0) {
      setError('Silakan daftarkan minimal satu wajah');
      return;
    }
    onSave(faceDescriptors);
  };

  const handleUserMediaError = (err: string | DOMException) => {
    // eslint-disable-next-line no-console
    console.error('Camera error:', err);
    let errorMessage = 'Tidak dapat mengakses kamera. ';

    if (typeof err === 'string') {
      errorMessage += err;
    } else if (err.name === 'NotAllowedError') {
      errorMessage += 'Izin kamera ditolak. Silakan berikan izin kamera dan refresh halaman.';
    } else if (err.name === 'NotFoundError') {
      errorMessage += 'Kamera tidak ditemukan.';
    } else {
      errorMessage += `Error: ${err.message}`;
    }

    setError(errorMessage);
    setIsCapturing(false);
  };

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-500" />
            <div>
              <h3 className="text-xl font-bold text-gray-800">Daftarkan Wajah</h3>
              <p className="text-sm text-gray-600">{guru.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoadingModels && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                <div>
                  <p className="font-medium text-blue-800">Memuat Model Deteksi Wajah...</p>
                  <p className="text-sm text-blue-600">
                    Mohon tunggu, sedang mengunduh model AI untuk deteksi wajah
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-800">Berhasil</p>
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Panduan Pendaftaran Wajah</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Foto akan diambil otomatis saat kamera dibuka (maks. 3 gambar)</li>
                  <li>• Posisikan wajah dari sudut berbeda setiap pengambilan untuk akurasi terbaik</li>
                  <li>• Pastikan wajah terlihat jelas dan pencahayaan cukup</li>
                  <li>• Hindari menggunakan kacamata atau masker saat pendaftaran</li>
                  <li>• Hanya satu wajah yang boleh terlihat dalam setiap foto</li>
                  <li>• Foto akan digunakan untuk verifikasi saat absensi</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-800">Ambil Foto dengan Kamera</h4>

              {!isCapturing ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    Gunakan kamera untuk mengambil foto wajah guru
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={!modelsLoaded || isLoadingModels}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isLoadingModels ? 'Memuat Model...' : 'Buka Kamera'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Kamera aktif
                  </p>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex items-center space-x-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    <X className="w-4 h-4" />
                    <span>Tutup Kamera</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-800">Upload Foto dari File</h4>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={!modelsLoaded || isProcessing}
                />
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Upload foto wajah dari galeri</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!modelsLoaded || isProcessing || isLoadingModels}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isProcessing ? 'Memproses...' : 'Pilih Foto'}</span>
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Format: JPG, PNG, GIF • Maksimal: 5MB
                </p>
              </div>
            </div>
          </div>

          {capturedPhotos.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-4">
                Wajah Terdaftar ({capturedPhotos.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {capturedPhotos.map((photo, index) => (
                  <div key={photo} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
                      <img
                        src={photo}
                        alt={`Wajah ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => removeFace(index)}
                        className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        #
                        {index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {existingFaces.length > 0 && capturedPhotos.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Wajah Sudah Terdaftar</p>
                    <p className="text-sm text-gray-600">
                      {guru.name} sudah memiliki {existingFaces.length} wajah terdaftar dalam sistem
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Apakah yakin ingin menghapus semua data wajah yang terdaftar?')) {
                      setFaceDescriptors([]);
                      setCapturedPhotos([]);
                      onSave([]);
                    }
                  }}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Data</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={faceDescriptors.length === 0}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simpan Wajah (
              {faceDescriptors.length}
              )
            </button>
          </div>
        </div>
      </div>
    </div>

    {isCapturing && (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-xl w-[95vw] max-w-5xl flex flex-col max-h-[95vh] overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
            <h3 className="text-lg font-bold text-gray-800">Preview Kamera - {guru.name}</h3>
            <button
              type="button"
              onClick={stopCamera}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 space-y-3 shrink-0">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 flex flex-col p-4 pt-0">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden flex-1 min-h-[70vh]">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMediaError={handleUserMediaError}
                className="w-full h-full min-h-[70vh] object-cover"
                mirrored={false}
              />

              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              <div className="absolute top-2 right-2 flex space-x-2">
                {devices.length > 1 && (
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="absolute bottom-2 left-2 right-2 text-center space-y-1">
                <span className="bg-blue-500/90 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm block">
                  Foto diambil otomatis (maks. 3 gambar). Posisikan wajah di tengah frame.
                </span>
                {capturedPhotos.length < MAX_AUTO_CAPTURE && (
                  <span className="block text-white text-xs">
                    {isProcessing
                      ? 'Memproses wajah...'
                      : `Gambar ${capturedPhotos.length}/${MAX_AUTO_CAPTURE}`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={stopCamera}
                className="flex items-center space-x-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <X className="w-4 h-4" />
                <span>Tutup Kamera</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default FaceRegistrationModal;

