import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../services/apiService';
import { isSystemActive } from '../utils/systemActivationUtils';
import { warmupFaceRecognitionCache } from '../hooks/useFaceRecognitionCache';
import { prewarmPengaturanCache } from '../hooks/usePengaturanSistem';

export interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isLoading: boolean;
  requiresActivation: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresActivation, setRequiresActivation] = useState(false);

  const checkActivationStatus = React.useCallback(async (user: User) => {
    try {
      const isActive = await isSystemActive();
      if (user.role === 'admin' && !isActive) {
        setRequiresActivation(true);
      } else {
        setRequiresActivation(false);
      }
    } catch (error) {
      console.error('Error checking activation status:', error);
      // On error, assume activation is required for admin
      if (user.role === 'admin') {
        setRequiresActivation(true);
      }
    }
  }, []);

  useEffect(() => {
    // Check if user is logged in from localStorage and validate/refresh token
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('currentUser');
      const savedToken = localStorage.getItem('authToken');
      
      if (savedUser && savedToken) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Validate token by trying to refresh it (this handles expired tokens too)
          try {
            const refreshResult = await apiService.refreshToken();
            if (refreshResult.success && refreshResult.token) {
              // Token refreshed successfully, user is still logged in
              setUser(parsedUser);
              checkActivationStatus(parsedUser);
              
              // Pre-warm face recognition cache untuk admin di background
              if (parsedUser.role === 'admin') {
                warmupFaceRecognitionCache().catch((error) => {
                  console.error('[Auth] Error warming up face recognition cache on init:', error);
                });
              }
              
              setIsLoading(false);
              return;
            }
          } catch (refreshError) {
            console.error('Token refresh failed on init:', refreshError);
          }
          
          // If refresh failed, try to validate token by getting current user
          try {
            const currentUserResult = await apiService.getCurrentUser();
            if (currentUserResult.success && currentUserResult.user) {
              // Token is valid, update user data
              const updatedUser = currentUserResult.user;
              setUser(updatedUser);
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              checkActivationStatus(updatedUser);
              
              // Pre-warm face recognition cache untuk admin di background
              if (updatedUser.role === 'admin') {
                warmupFaceRecognitionCache().catch((error) => {
                  console.error('[Auth] Error warming up face recognition cache on init:', error);
                });
              }
              
              setIsLoading(false);
              return;
            }
          } catch (validateError) {
            console.error('Token validation failed on init:', validateError);
          }
          
          // If both refresh and validation failed, clear auth data
          localStorage.removeItem('currentUser');
          apiService.removeToken();
          setUser(null);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('currentUser');
          apiService.removeToken();
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();

    // Listen for localStorage changes to update user (e.g., after profile update)
    const handleStorageChange = (e: CustomEvent) => {
      if (e.detail?.key === 'currentUser' && e.detail?.value) {
        setUser(e.detail.value);
      }
    };

    // Also listen for regular storage events (from other tabs)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'currentUser' && e.newValue) {
        try {
          const parsedUser = JSON.parse(e.newValue);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user from storage event:', error);
        }
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange as EventListener);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [checkActivationStatus]);

  // Wrapper function to update user in context (data dari MongoDB cache, tidak perlu localStorage)
  const updateUser = React.useCallback((newUser: User | null) => {
    setUser(newUser);
    // Data sudah di cache MongoDB melalui hooks, tidak perlu localStorage
    // Custom event tetap dipanggil untuk backward compatibility dengan komponen yang masih listen
    if (newUser) {
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: 'currentUser', value: newUser }
      }));
    }
  }, []);

  const login = React.useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);

    try {
      const result = await apiService.login(email, password);

      // Type guard: check if result has user property
      if (result.success && 'user' in result && result.user) {
        const user = result.user;
        setUser(user);
        // Keep localStorage for backward compatibility during migration
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Token is already stored by apiService.login()
        // No need to store it again here

        // Pre-fetch systemType from server and populate cache
        // so Dashboard/Sidebar render the correct menu immediately.
        const systemTypeFetch = apiService.getSystemType().then((res) => {
          if (res.success && res.systemType) {
            prewarmPengaturanCache(res.systemType);
          }
        }).catch(() => { /* non-blocking */ });

        if (user.role === 'admin') {
          try {
            const isActive = await isSystemActive();
            setRequiresActivation(!isActive);
          } catch (error) {
            console.error('Error checking activation after login:', error);
            setRequiresActivation(true);
          }

          warmupFaceRecognitionCache().then((success) => {
            if (success) {
              console.log('[Auth] Face recognition cache warmed up successfully');
            } else {
              console.warn('[Auth] Failed to warm up face recognition cache');
            }
          }).catch((error) => {
            console.error('[Auth] Error warming up face recognition cache:', error);
          });
        } else {
          setRequiresActivation(false);
        }

        // Wait for systemType to be cached before completing login
        await systemTypeFetch;

        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        const errorMessage = 'message' in result ? result.message : 'Email atau password salah';
        return { 
          success: false, 
          message: errorMessage || 'Email atau password salah' 
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      return { 
        success: false, 
        message: error.message || 'Terjadi kesalahan saat login' 
      };
    }
  }, []);

  const logout = React.useCallback(() => {
    // Clear all caches first to ensure no user data persists
    // Use dynamic import to avoid circular dependency issues
    import('../utils/clearAllCaches').then(({ clearAllCaches }) => {
      clearAllCaches();
    }).catch((error) => {
      console.error('Error clearing caches:', error);
    });
    
    // Clear user state and authentication data
    setUser(null);
    setRequiresActivation(false);
    localStorage.removeItem('currentUser');
    // Remove token via apiService
    apiService.removeToken();
    sessionStorage.removeItem('app_session_active');
    sessionStorage.removeItem('gst_modal_shown');
  }, []);

  const contextValue = React.useMemo(() => ({
    user,
    setUser: updateUser,
    login,
    logout,
    isLoading,
    requiresActivation
  }), [user, updateUser, login, logout, isLoading, requiresActivation]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};