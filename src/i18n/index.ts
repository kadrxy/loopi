import { getLocales } from 'expo-localization';
import i18n, { changeLanguage, use as registerPlugin } from 'i18next';
import { useCallback } from 'react';
import { initReactI18next, useTranslation } from 'react-i18next';

import { en } from './en';
import { tr } from './tr';

export type TKey = keyof typeof tr;
export type Lang = 'tr' | 'en';

export function deviceLang(): Lang {
  return getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en';
}

let initialized = false;

export function initI18n(lang: Lang) {
  if (!initialized) {
    registerPlugin(initReactI18next).init({
      resources: { tr: { translation: tr }, en: { translation: en } },
      lng: lang,
      fallbackLng: 'tr',
      interpolation: { escapeValue: false },
      initAsync: false,
    });
    initialized = true;
  } else if (i18n.language !== lang) {
    changeLanguage(lang);
  }
}

/** Typed translate function: only keys that exist in the dictionaries compile. */
export function useT() {
  const { t } = useTranslation();
  const translate = t as unknown as (key: string, vars?: Record<string, string | number>) => string;
  return useCallback((key: TKey, vars?: Record<string, string | number>) => translate(key, vars), [translate]);
}
