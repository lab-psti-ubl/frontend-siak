export interface FileUploadValidation {
  valid: boolean;
  error?: string;
}

export interface FileUploadResult {
  fileName: string;
  base64: string;
  mimeType: string;
}

export const validateImageFile = (file: File): FileUploadValidation => {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png'];

  if (file.size > maxSize) {
    return { valid: false, error: 'Ukuran file maksimal 5MB!' };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Hanya file JPG atau PNG yang diperbolehkan!'
    };
  }

  return { valid: true };
};

export const fileToBase64 = (file: File): Promise<FileUploadResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result as string;
      resolve({
        fileName: file.name,
        base64: base64String,
        mimeType: file.type,
      });
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

export const saveFileToLocalStorage = (
  storageKey: string,
  fileData: FileUploadResult
): void => {
  const data = {
    fileName: fileData.fileName,
    base64: fileData.base64,
    mimeType: fileData.mimeType,
    uploadedAt: new Date().toISOString(),
  };

  localStorage.setItem(storageKey, JSON.stringify(data));
};

export const getFileFromLocalStorage = (storageKey: string): FileUploadResult | null => {
  const data = localStorage.getItem(storageKey);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    return {
      fileName: parsed.fileName,
      base64: parsed.base64,
      mimeType: parsed.mimeType,
    };
  } catch {
    return null;
  }
};

export const removeFileFromLocalStorage = (storageKey: string): void => {
  localStorage.removeItem(storageKey);
};

export const generateStorageKey = (prefix: string, id: string): string => {
  return `${prefix}_${id}_bukti`;
};

export const getBuktiFromLocalStorage = (buktiId: string): FileUploadResult | null => {
  if (!buktiId) return null;

  const muridKey = generateStorageKey('muridIzin', buktiId);
  const guruKey = generateStorageKey('guruIzin', buktiId);

  let fileData = getFileFromLocalStorage(muridKey);
  if (fileData) return fileData;

  fileData = getFileFromLocalStorage(guruKey);
  if (fileData) return fileData;

  return null;
};
