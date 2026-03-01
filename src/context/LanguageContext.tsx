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

  // Load language from database on mount - always from database, even before login
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        // Always get language from database
        // Use public endpoint if no token (for login page), otherwise use authenticated endpoint
        const response = token 
          ? await apiService.getLanguage()
          : await apiService.getLanguagePublic();
        
        if (response && response.success && response.language) {
          // Validate that the language is 'id' or 'ms'
          const lang = response.language === 'id' || response.language === 'ms' 
            ? (response.language as Language) 
            : 'id';
          setLanguageState(lang);
        } else {
          // If database doesn't have language, default to Indonesian
          setLanguageState('id');
        }
      } catch (error) {
        console.error('Error loading language from database:', error);
        // Default to Indonesian on error
        setLanguageState('id');
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      // Validate language value
      if (lang !== 'id' && lang !== 'ms') {
        throw new Error('Bahasa tidak valid');
      }

      // Save to database first
      const response = await apiService.updatePengaturanSistem({ language: lang });
      if (response.success) {
        // Only update state after successful database save
        setLanguageState(lang);
      } else {
        throw new Error(response.message || 'Gagal memperbarui bahasa di database');
      }
    } catch (error: any) {
      console.error('Error updating language in database:', error);
      throw error;
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const translation = translations[language];
    let text = getNestedValue(translation, key);

    // Fallback to Indonesian if key missing in selected language
    if (text === key && language !== 'id') {
      const fallback = getNestedValue(translations.id, key);
      if (fallback !== key) text = fallback;
    }
    
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
