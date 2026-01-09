import { en } from './translations/en';
import { ptBR } from './translations/pt-BR';

export type Language = 'en' | 'pt-BR';

export const translations = {
  en,
  'pt-BR': ptBR,
};

export type TranslationKeys = typeof en;

export const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path;
    }
  }
  
  return typeof result === 'string' ? result : path;
};

export const defaultLanguage: Language = 'pt-BR';

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];
