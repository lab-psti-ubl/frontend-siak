export interface QRCodeData {
  identifier: string; // NISN for murid, NIP for guru
  type: 'nisn' | 'nip' | 'unknown';
}

export const parseQRCode = (rawData: string): QRCodeData => {
  const trimmed = rawData.trim();

  if (/^\d{10}$/.test(trimmed)) {
    return { identifier: trimmed, type: 'nisn' };
  }

  if (/^\d{18}$/.test(trimmed)) {
    return { identifier: trimmed, type: 'nip' };
  }

  const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (guidPattern.test(trimmed)) {
    return { identifier: trimmed, type: 'unknown' };
  }

  return { identifier: trimmed, type: 'unknown' };
};

export const isNISN = (identifier: string): boolean => /^\d{10}$/.test(identifier);
export const isNIP = (identifier: string): boolean => /^\d{18}$/.test(identifier);
