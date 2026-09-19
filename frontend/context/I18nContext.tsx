'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import esMessages from '@/messages/es.json';

type Messages = {
  [key: string]: any;
};

type I18nContextType = {
  locale: string;
  messages: Messages;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const localeFromPathname = (pathname: string): string | null => {
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  if (pathname === '/es' || pathname.startsWith('/es/')) return 'es';
  return null;
};

const localeFromCookie = (): string => {
  const cookie = document.cookie
    .split(';')
    .find((c) => c.trim().startsWith('NEXT_LOCALE='));
  const value = cookie?.split('=')[1];
  return value === 'en' ? 'en' : 'es';
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pathLocale = localeFromPathname(pathname);
  const [cookieLocale, setCookieLocale] = useState('es');
  // Español viene estático para que el HTML servido traiga los textos reales
  const [messages, setMessages] = useState<Messages>(esMessages as Messages);
  const locale = pathLocale ?? cookieLocale;

  useEffect(() => {
    if (!pathLocale) setCookieLocale(localeFromCookie());
  }, [pathLocale]);

  useEffect(() => {
    if (locale === 'es') {
      setMessages(esMessages as Messages);
      return;
    }

    let active = true;
    import(`@/messages/${locale}.json`).then((module) => {
      if (active) setMessages(module.default);
    });

    return () => {
      active = false;
    };
  }, [locale]);

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
