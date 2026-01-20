import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/apiService';
import idTranslations from '../locales/id.json';
import msTranslations from '../locales/ms.json';

type Language = 'id' | 'ms';
type Translations = typeof idTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, any>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

const translations: Record<Language, Translations> = {
  id: idTranslations,
  ms: msTranslations,
};

// Helper function to get nested translation value
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return key if translation not found
    }
  }
  return typeof value === 'string' ? value : path;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('id');
  const [isLoading, setIsLoading] = useState(true);

  // Load language from database on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          // If no token, use default language
          setLanguageState('id');
          setIsLoading(false);
          return;
        }

        const response = await apiService.getLanguage();
        if (response.success && response.language) {
          setLanguageState(response.language as Language);
        } else {
          setLanguageState('id'); // Default to Indonesian
        }
      } catch (error) {
        console.error('Error loading language:', error);
        setLanguageState('id'); // Default to Indonesian on error
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      const response = await apiService.updatePengaturanSistem({ language: lang });
      if (response.success) {
        setLanguageState(lang);
      } else {
        throw new Error(response.message || 'Gagal memperbarui bahasa');
      }
    } catch (error: any) {
      console.error('Error updating language:', error);
      throw error;
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const translation = translations[language];
    let text = getNestedValue(translation, key);
    
    // Replace placeholders with actual values if params provided
    if (params && typeof text === 'string') {
      Object.keys(params).forEach((paramKey) => {
        const placeholder = `{${paramKey}}`;
        const value = params[paramKey]?.toString() || '';
        text = text.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
      });
    }
    
    return text;
  };

  const contextValue = React.useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLoading,
    }),
    [language, isLoading]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
