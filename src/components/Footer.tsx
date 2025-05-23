
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import AdPlaceholder from '@/components/AdPlaceholder';

const Footer: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-300 pt-8 sm:pt-12 dark:bg-gray-900 dark:text-gray-400">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <AdPlaceholder className="max-w-lg mx-auto" />
        </div>
        
        <div className="text-center">
          <div className="mb-6">
            <img 
              src="/lovable-uploads/5483091a-e5bd-4397-9e86-24fb0ce87243.png" 
              alt="ST Pizza Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2"
            />
            <h2 className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-500">
              ST<span className="text-teal-400 ml-1">🍕 Eat</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4 md:gap-8 mb-8">
            <div className="text-center md:text-start">
              <h5 className="font-semibold text-base sm:text-lg text-white dark:text-gray-200 mb-3">{t('quickLinks')}</h5>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:text-yellow-500 transition-colors duration-200 text-sm sm:text-base">{t('home')}</Link></li>
                <li><Link to="/restaurants" className="hover:text-yellow-500 transition-colors duration-200 text-sm sm:text-base">{t('restaurants')}</Link></li>
                <li><Link to="/products" className="hover:text-yellow-500 transition-colors duration-200 text-sm sm:text-base">{t('products')}</Link></li>
                <li><Link to="/coupons" className="hover:text-yellow-500 transition-colors duration-200 text-sm sm:text-base">{t('discounts')}</Link></li>
              </ul>
            </div>
            
            <div className="text-center md:text-start">
              <h5 className="font-semibold text-base sm:text-lg text-white dark:text-gray-200 mb-3">{t('legal')}</h5>
              <ul className="space-y-2">
                <li><Link to="/terms-conditions" className="hover:text-yellow-500 transition-colors duration-200 text-sm sm:text-base">{t('termsConditions')}</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-yellow-500 transition-colors duration-200 text-sm sm:text-base">{t('privacyPolicy')}</Link></li>
                <li><Link to="/cookie-policy" className="hover:text-yellow-500 transition-colors duration-200 text-sm sm:text-base">{t('cookiePolicy')}</Link></li>
              </ul>
            </div>
            
            <div className="text-center md:text-start">
              <h5 className="font-semibold text-base sm:text-lg text-white dark:text-gray-200 mb-3">{t('contactUs')}</h5>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-yellow-500 transition-colors duration-200 text-sm sm:text-base">{t('facebook')}</a></li>
                <li><a href="#" className="hover:text-yellow-500 transition-colors duration-200 text-sm sm:text-base">{t('twitter')}</a></li>
                <li><a href="#" className="hover:text-yellow-500 transition-colors duration-200 text-sm sm:text-base">{t('instagram')}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 mt-8 border-t border-gray-700 text-sm">
            <p>
              &copy; {currentYear} ST Eats. {t('allRightsReserved')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
