import * as faceapi from 'face-api.js';

// Configuration for face detection
const FACE_DETECTION_OPTIONS = {
  inputSize: 416,
  scoreThreshold: 0.5,
  minConfidence: 0.6,
  maxResults: 1,
};

let modelsLoaded = false;
let isLoadingModels = false;

export const loadFaceDetectionModels = async (): Promise<boolean> => {
  if (modelsLoaded) return true;
  if (isLoadingModels) {
    while (isLoadingModels) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return modelsLoaded;
  }

  try {
    isLoadingModels = true;
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model';

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading face detection models:', error);
    modelsLoaded = false;
    return false;
  } finally {
    isLoadingModels = false;
  }
};

export const extractFaceDescriptor = async (
  imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
): Promise<Float32Array | null> => {
  try {
    if (!modelsLoaded) {
      const loaded = await loadFaceDetectionModels();
      if (!loaded) {
        throw new Error('Face detection models not loaded');
      }
    }

    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions(FACE_DETECTION_OPTIONS))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return null;
    }

    return detection.descriptor;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error extracting face descriptor:', error);
    return null;
  }
};

export const compareFaceDescriptors = (descriptor1: Float32Array, descriptor2: Float32Array): number => {
  try {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    const similarity = 1 - distance;
    return Math.max(0, Math.min(1, similarity));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error comparing face descriptors:', error);
    return 0;
  }
};

/** Threshold similarity default (62%) saat ukuran wajah 70–90% di frame. */
export const FACE_MATCH_THRESHOLD = 0.62;

/**
 * Threshold similarity dinamis berdasarkan persentase ukuran wajah di frame.
 * - Wajah 70–90% → 62%
 * - Wajah 50–69% → 58%
 * - Wajah 40–49% → 55%
 * - Wajah &lt; 40% (min 3%) → 50%
 * @param faceRatio Nilai 0–1 (luas wajah / luas gambar)
 */
export const getSimilarityThresholdForFaceRatio = (faceRatio: number): number => {
  if (faceRatio >= 0.25) return 0.62;
  if (faceRatio >= 0.20) return 0.58;
  if (faceRatio >= 0.15) return 0.55;
  if (faceRatio >= 0.1) return 0.52;
  return 0.5;
};

/**
 * Rata-rata similarity wajah saat ini ke semua descriptor guru.
 */
export const getAverageSimilarityToDescriptors = (
  currentDescriptor: Float32Array,
  referenceDescriptors: Float32Array[]
): number => {
  if (!referenceDescriptors.length) return 0;
  let sum = 0;
  for (let i = 0; i < referenceDescriptors.length; i += 1) {
    sum += compareFaceDescriptors(currentDescriptor, referenceDescriptors[i]);
  }
  return sum / referenceDescriptors.length;
};

/** Minimum jumlah descriptor yang harus di atas threshold agar dianggap match (mis. 2 dari 3). */
export const MIN_DESCRIPTORS_ABOVE_THRESHOLD = 2;

/**
 * Jumlah descriptor referensi yang punya similarity >= threshold terhadap wajah saat ini.
 * Untuk aturan "min 2 dari 3": match hanya jika return >= min(MIN_DESCRIPTORS_ABOVE_THRESHOLD, referenceDescriptors.length).
 */
export const countDescriptorsAboveThreshold = (
  currentDescriptor: Float32Array,
  referenceDescriptors: Float32Array[],
  threshold: number
): number => {
  let count = 0;
  for (let i = 0; i < referenceDescriptors.length; i += 1) {
    if (compareFaceDescriptors(currentDescriptor, referenceDescriptors[i]) >= threshold) {
      count += 1;
    }
  }
  return count;
};

/**
 * Dianggap match hanya jika similarity dengan min 2 dari 3 (atau semua jika < 2) descriptor guru di atas threshold.
 * Jika guru punya 1 descriptor: perlu 1 di atas threshold.
 * Jika guru punya 2+: perlu min 2 di atas threshold.
 */
export const passesMinDescriptorsAboveThreshold = (
  currentDescriptor: Float32Array,
  referenceDescriptors: Float32Array[],
  threshold: number
): boolean => {
  if (!referenceDescriptors.length) return false;
  const required = Math.min(MIN_DESCRIPTORS_ABOVE_THRESHOLD, referenceDescriptors.length);
  const count = countDescriptorsAboveThreshold(currentDescriptor, referenceDescriptors, threshold);
  return count >= required;
};

export const dataURLToImage = (dataURL: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataURL;
  });

export const descriptorToBase64 = (descriptor: Float32Array): string => {
  const buffer = descriptor.buffer;
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToDescriptor = (base64: string): Float32Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Float32Array(bytes.buffer);
};

export type ValidateFaceResult = {
  isValid: boolean;
  message: string;
  /** Persentase luas wajah di frame (0–1), hanya ada saat isValid true */
  faceRatio?: number;
};

export const validateFaceInImage = async (
  imageElement: HTMLImageElement
): Promise<ValidateFaceResult> => {
  try {
    if (!modelsLoaded) {
      const loaded = await loadFaceDetectionModels();
      if (!loaded) {
        return { isValid: false, message: 'Model deteksi wajah belum dimuat' };
      }
    }

    const detection = await faceapi
      .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions(FACE_DETECTION_OPTIONS));

    if (!detection) {
      return {
        isValid: false,
        // message: 'Tidak ada wajah yang terdeteksi. Pastikan wajah terlihat jelas.',
        message: '',
      };
    }

    const faceBox = detection.box;
    const faceArea = faceBox.width * faceBox.height;
    const imageArea = imageElement.width * imageElement.height;
    const faceRatio = faceArea / imageArea;

    if (faceRatio < 0.03) {
      return { isValid: false, message: 'Wajah terlalu kecil. Dekatkan wajah ke kamera.' };
    }

    if (faceRatio > 0.9) {
      return { isValid: false, message: 'Wajah terlalu besar. Jauhkan sedikit dari kamera.' };
    }

    if (detection.score < FACE_DETECTION_OPTIONS.minConfidence) {
      return {
        isValid: false,
        message: 'Wajah tidak terdeteksi dengan jelas. Pastikan pencahayaan cukup.',
      };
    }

    const allDetections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions(FACE_DETECTION_OPTIONS));

    if (allDetections.length > 1) {
      return {
        isValid: false,
        message: 'Terdeteksi lebih dari satu wajah. Pastikan hanya satu wajah dalam foto.',
      };
    }

    return { isValid: true, message: 'Wajah terdeteksi dengan baik', faceRatio };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error validating face in image:', error);
    return { isValid: false, message: 'Terjadi kesalahan saat memvalidasi wajah' };
  }
};

/**
 * Menggambar kotak deteksi wajah dan persentase ukuran wajah di bawah kotak hijau.
 * @param faceRatioOptional Jika diberikan, akan ditampilkan di bawah kotak sebagai "Ukuran wajah: X%"
 */
export const drawFaceDetection = async (
  imageElement: HTMLImageElement,
  canvas: HTMLCanvasElement,
  faceRatioOptional?: number
): Promise<boolean> => {
  try {
    if (!modelsLoaded) {
      const loaded = await loadFaceDetectionModels();
      if (!loaded) return false;
    }

    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions(FACE_DETECTION_OPTIONS))
      .withFaceLandmarks();

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imageArea = imageElement.width * imageElement.height;

    detections.forEach((detection) => {
      const box = detection.detection.box;
      const faceArea = box.width * box.height;
      const faceRatio = faceRatioOptional ?? faceArea / imageArea;
      const facePercent = (faceRatio * 100).toFixed(1);

      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = '#00ff00';
      ctx.font = '16px Arial';
      ctx.fillText(`${(detection.detection.score * 100).toFixed(1)}%`, box.x, box.y - 10);

      // Persentase ukuran wajah di frame, di bawah kotak hijau
      ctx.fillStyle = '#00cc00';
      ctx.font = 'bold 14px Arial';
      const sizeLabel = `Ukuran wajah: ${facePercent}%`;
      const textY = box.y + box.height + 18;
      ctx.fillText(sizeLabel, box.x, textY);

      const landmarks = detection.landmarks;
      ctx.fillStyle = '#ff0000';
      landmarks.positions.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    return detections.length > 0;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error drawing face detection:', error);
    return false;
  }
};

