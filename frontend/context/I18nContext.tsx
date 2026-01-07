'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

type Messages = {
  [key: string]: any;
};

type I18nContextType = {
  locale: string;
  messages: Messages;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [locale, setLocale] = useState('es');
  const [messages, setMessages] = useState<Messages>({});

  useEffect(() => {
    // Detectar locale desde pathname
    const detectedLocale = pathname.startsWith('/en') ? 'en' : 'es';
    setLocale(detectedLocale);

    // Cargar mensajes correspondientes
    import(`@/messages/${detectedLocale}.json`)
      .then((module) => setMessages(module.default))
      .catch((err) => console.error('Error loading messages:', err));
  }, [pathname]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Fallback: devolver la key si no existe traducción
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
