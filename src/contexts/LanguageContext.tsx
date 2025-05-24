
import React, { createContext, useState, useEffect, useContext } from 'react';

// Import English translations
import enCommon from '@/locales/en/common.json';
import enNavigation from '@/locales/en/navigation.json';
import enHome from '@/locales/en/home.json';
import enProducts from '@/locales/en/products.json';
import enCart from '@/locales/en/cart.json';
import enPayment from '@/locales/en/payment.json';
import enRefund from '@/locales/en/refund.json';
import enRestaurants from '@/locales/en/restaurants.json';
import enAddFood from '@/locales/en/add-food.json';
import enRegisterRestaurant from '@/locales/en/register-restaurant.json';
import enFooter from '@/locales/en/footer.json';
import enCoupons from '@/locales/en/coupons.json';

// Import Arabic translations
import arCommon from '@/locales/ar/common.json';
import arNavigation from '@/locales/ar/navigation.json';
import arHome from '@/locales/ar/home.json';
import arProducts from '@/locales/ar/products.json';
import arCart from '@/locales/ar/cart.json';
import arPayment from '@/locales/ar/payment.json';
import arRefund from '@/locales/ar/refund.json';
import arRestaurants from '@/locales/ar/restaurants.json';
import arAddFood from '@/locales/ar/add-food.json';
import arRegisterRestaurant from '@/locales/ar/register-restaurant.json';
import arFooter from '@/locales/ar/footer.json';
import arCoupons from '@/locales/ar/coupons.json';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  toggleLanguage: () => void;
}

// Merge all English translations
const enTranslations = {
  ...enCommon,
  ...enNavigation,
  ...enHome,
  ...enProducts,
  ...enCart,
  ...enPayment,
  ...enRefund,
  ...enRestaurants,
  ...enAddFood,
  ...enRegisterRestaurant,
  ...enFooter,
  ...enCoupons
};

// Merge all Arabic translations
const arTranslations = {
  ...arCommon,
  ...arNavigation,
  ...arHome,
  ...arProducts,
  ...arCart,
  ...arPayment,
  ...arRefund,
  ...arRestaurants,
  ...arAddFood,
  ...arRegisterRestaurant,
  ...arFooter,
  ...arCoupons
};

// Combine translations for all languages
const allAppTranslations: Record<Language, Record<string, string>> = {
  ar: arTranslations,
  en: enTranslations,
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  setLanguage: () => {},
  t: (key: string) => key,
  isRTL: true,
  toggleLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('st-eats-language');
    return (savedLanguage as Language) || 'ar';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('st-eats-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // Add language-specific class for styling
    document.documentElement.classList.remove('lang-ar', 'lang-en');
    document.documentElement.classList.add(`lang-${language}`);
  }, [language, isRTL]);

  const t = (key: string): string => {
    if (!key) return '';
    
    // Access translations from the combined object using the current language
    const langTranslations = allAppTranslations[language];
    const translation = langTranslations?.[key];
    
    // Return translation if found, otherwise return key as fallback
    return translation || key;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
