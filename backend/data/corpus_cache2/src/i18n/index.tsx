import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Define the shape of the translation messages
interface Messages {
  [key: string]: string;
}

// Define the shape of the LangContext
interface LangContextType {
  lang: string;
  setLang: (newLang: string) => void;
  t: (key: string) => string;
}

// Default messages (will be loaded from JSON files)
const defaultMessages: { [key: string]: Messages } = {
  en: {},
  'zh-TW': {},
};

// Function to guess the default language
export const guessDefaultLang = (): string => {
  // Check timezone for Taipei/Taiwan
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone.includes('Taipei') || timezone.includes('Taiwan')) {
    return 'zh-TW';
  }

  // Check navigator.languages
  if (navigator.languages) {
    for (const navLang of navigator.languages) {
      if (navLang.includes('zh-TW') || navLang.includes('zh-Hant')) {
        return 'zh-TW';
      }
    }
  }

  // Fallback to English
  return 'en';
};

// Create the Language Context
export const LangContext = createContext<LangContextType | undefined>(undefined);

// Language Provider Component
export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<string>(() => {
    // Initialize language from localStorage or guess default
    return localStorage.getItem('lang') || guessDefaultLang();
  });
  const [messages, setMessages] = useState<{ [key: string]: Messages }>(defaultMessages);

  // Load messages for the current language
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const enMessages = await import('./messages.en.json');
        const zhTwMessages = await import('./messages.zh-TW.json');
        setMessages({
          en: enMessages.default,
          'zh-TW': zhTwMessages.default,
        });
      } catch (error) {
        console.error('Failed to load i18n messages:', error);
      }
    };
    loadMessages();
  }, []);

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  // Function to set language and persist
  const setLang = useCallback((newLang: string) => {
    setLangState(newLang);
  }, []);

  // Translation function
  const t = useCallback((key: string): string => {
    return messages[lang]?.[key] || messages.en[key] || key; // Fallback to English, then key itself
  }, [lang, messages]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

// Custom hook to use the language context
export const useLang = (): LangContextType => {
  const context = useContext(LangContext);
  if (context === undefined) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
};
