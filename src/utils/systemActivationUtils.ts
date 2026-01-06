import { SystemActivation } from '../types';
import { apiService } from '../services/apiService';

// Cache for system activation status
let activationCache: SystemActivation | null = null;
let activationCacheTime: number = 0;
const CACHE_DURATION = 60000; // 1 minute

export async function initializeSystemActivation(): Promise<SystemActivation> {
  try {
    const result = await apiService.initializeSystemActivation();
    if (result.success && result.activation) {
      activationCache = result.activation;
      activationCacheTime = Date.now();
      return result.activation;
    }
    throw new Error('Failed to initialize system activation');
  } catch (error) {
    console.error('Error initializing system activation:', error);
    // Fallback to default
    const defaultActivation: SystemActivation = {
    id: 'system-activation-1',
    isSystemActive: false,
    createdAt: new Date().toISOString(),
  };
    return defaultActivation;
  }
}

export async function checkSystemActivation(): Promise<SystemActivation> {
  // Check cache first
  if (activationCache && (Date.now() - activationCacheTime) < CACHE_DURATION) {
    return activationCache;
}

  try {
    const result = await apiService.getSystemActivation();
    if (result.success && result.activation) {
      activationCache = result.activation;
      activationCacheTime = Date.now();
      return result.activation;
    }
    throw new Error('Failed to check system activation');
  } catch (error) {
    console.error('Error checking system activation:', error);
    // Return cached value if available, otherwise return default
    if (activationCache) {
      return activationCache;
  }
  return initializeSystemActivation();
}
}

export async function isSystemActive(): Promise<boolean> {
  try {
    const result = await apiService.checkSystemActive();
    if (result.success && result.isSystemActive !== undefined) {
      // Update cache
      if (activationCache) {
        activationCache.isSystemActive = result.isSystemActive;
      }
      return result.isSystemActive;
    }
    // Fallback: check activation object
    const activation = await checkSystemActivation();
  return activation.isSystemActive;
  } catch (error) {
    console.error('Error checking if system is active:', error);
    // Fallback to cached value or false
    if (activationCache) {
      return activationCache.isSystemActive;
    }
    return false;
  }
}

// Synchronous version for backward compatibility (uses cache)
export function isSystemActiveSync(): boolean {
  if (activationCache) {
    return activationCache.isSystemActive;
  }
  return false;
}

export async function activateSystem(
  password: string, 
  adminId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await apiService.activateSystem(password, adminId);
    
    if (result.success) {
      // Update cache
      if (activationCache) {
        activationCache.isSystemActive = true;
        activationCache.activatedAt = new Date().toISOString();
        activationCache.activatedBy = adminId || 'admin';
      }
    }
    
    return {
      success: result.success,
      message: result.message || (result.success ? 'Sistem berhasil diaktifkan!' : 'Gagal mengaktifkan sistem'),
    };
  } catch (error: any) {
    console.error('Error activating system:', error);
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat mengaktifkan sistem',
  };
  }
}

// Legacy functions for backward compatibility
export function getGSTAttempts(): number {
  // This is now handled by the backend, but we keep the function for compatibility
  return 0;
}

export function incrementGSTAttempts(): void {
  // This is now handled by the backend
}

export function clearGSTAttempts(): void {
  // This is now handled by the backend
}

export function canAttemptGSTPassword(): boolean {
  return true;
}

export function getRemainingGSTAttempts(): number {
  return Infinity;
}
