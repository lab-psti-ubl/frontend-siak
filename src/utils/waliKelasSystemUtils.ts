import { WaliKelasSettings } from '../types';
import { apiService } from '../services/apiService';

const DEFAULT_SETTINGS: WaliKelasSettings = {
  system: 'otomatis',
  lastUpdated: new Date().toISOString()
};

// Cache untuk menyimpan settings sementara
let cachedSettings: WaliKelasSettings | null = null;

export const getWaliKelasSettings = async (): Promise<WaliKelasSettings> => {
  try {
    // Return cached settings if available
    if (cachedSettings) {
      return cachedSettings;
    }

    const response = await apiService.getWaliKelasSettings();
    if (response.success && response.settings) {
      cachedSettings = response.settings;
      return response.settings;
    }
  } catch (error) {
    console.error('Error reading wali kelas settings:', error);
  }
  return DEFAULT_SETTINGS;
};

// Synchronous version for backward compatibility (returns cached or default)
export const getWaliKelasSettingsSync = (): WaliKelasSettings => {
  if (cachedSettings) {
    return cachedSettings;
  }
  return DEFAULT_SETTINGS;
};

export const setWaliKelasSettings = async (settings: WaliKelasSettings): Promise<void> => {
  try {
    const response = await apiService.saveWaliKelasSettings({ system: settings.system });
    if (response.success && response.settings) {
      cachedSettings = response.settings;
    } else {
      throw new Error(response.message || 'Gagal menyimpan pengaturan');
    }
  } catch (error) {
    console.error('Error saving wali kelas settings:', error);
    throw error;
  }
};

export const getWaliKelasSystemDescription = (system: string): string => {
  switch (system) {
    case 'otomatis':
      return 'Wali kelas otomatis mengikuti muridnya ke kelas berikutnya saat kenaikan kelas (sistem default).';
    case 'tetap':
      return 'Wali kelas tetap berada di kelas yang sama, tidak pindah ke kelas baru saat kenaikan kelas.';
    case 'hapus':
      return 'Semua wali kelas akan dilepas dari jabatannya saat kenaikan kelas.';
    default:
      return '';
  }
};

export const getSystemLabel = (system: string): string => {
  switch (system) {
    case 'otomatis':
      return 'Sistem Otomatis';
    case 'tetap':
      return 'Sistem Tetap';
    case 'hapus':
      return 'Sistem Hapus';
    default:
      return system;
  }
};
