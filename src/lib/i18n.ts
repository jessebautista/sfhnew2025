// Custom i18n implementation
export const LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  ar: { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  zh: { code: 'zh', name: '中文', flag: '🇨🇳', dir: 'ltr' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

// Translation loader function
export async function loadTranslations(lang: LanguageCode = DEFAULT_LANGUAGE) {
  try {
    const translations = await import(`../../public/locales/${lang}/common.json`);
    return translations.default || translations;
  } catch (error) {
    console.warn(`Failed to load translations for ${lang}, falling back to English`, error);
    if (lang !== DEFAULT_LANGUAGE) {
      try {
        return await loadTranslations(DEFAULT_LANGUAGE);
      } catch (fallbackError) {
        console.error('Failed to load default language translations', fallbackError);
        return {};
      }
    }
    return {};
  }
}

// Get language from URL path
export function getLanguageFromURL(pathname: string): LanguageCode {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && Object.keys(LANGUAGES).includes(firstSegment)) {
    return firstSegment as LanguageCode;
  }
  
  return DEFAULT_LANGUAGE;
}

// Get localized path
export function getLocalizedPath(path: string, lang: LanguageCode): string {
  // Remove any existing language prefix
  const cleanPath = path.replace(/^\/(?:en|es|fr|ar|zh)/, '') || '/';
  
  // For default language, don't add prefix
  if (lang === DEFAULT_LANGUAGE) {
    return cleanPath;
  }
  
  // Add language prefix for other languages
  return `/${lang}${cleanPath}`;
}

// Translation function
export function t(key: string, translations: Record<string, any>): string {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) break;
  }
  
  return typeof value === 'string' ? value : key;
}

// Route translations
export const ROUTE_TRANSLATIONS = {
  fr: {
    "about": "a-propos",
    "contact": "contactez-nous",
    "donate": "faire-un-don",
    "news": "actualites",
    "shop": "boutique",
    "pianos": "pianos"
  },
  es: {
    "about": "acerca-de",
    "contact": "contacto",
    "donate": "donar",
    "news": "noticias",
    "shop": "tienda",
    "pianos": "pianos"
  },
  ar: {
    "about": "حول",
    "contact": "اتصال",
    "donate": "تبرع",
    "news": "أخبار",
    "shop": "متجر",
    "pianos": "بيانو"
  },
  zh: {
    "about": "关于我们",
    "contact": "联系我们",
    "donate": "捐赠",
    "news": "新闻",
    "shop": "商店",
    "pianos": "钢琴"
  }
};