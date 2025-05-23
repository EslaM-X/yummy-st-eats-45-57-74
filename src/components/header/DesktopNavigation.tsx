
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";

const DesktopNavigation = () => {
  const { t } = useLanguage();
  
  const navItems = [
    { name: t('home'), href: '/' },
    { name: t('restaurants'), href: '/restaurants' },
    { name: t('products'), href: '/products' },
    { name: 'الكوبونات', href: '/coupons' }, // تم استبدال المكافآت بالكوبونات
  ];

  return (
    <nav className="hidden lg:flex items-center space-x-6 rtl:space-x-reverse">
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
        >
          {item.name}
        </Link>
      ))}
      
      {/* زر إضافة طعام مميز وجذاب */}
      <Link to="/add-food" className="relative group">
        <Button
          className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white border-none transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
          <ChefHat className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 animate-pulse" />
          <span>{t('addFood')}</span>
        </Button>
      </Link>
    </nav>
  );
};

export default DesktopNavigation;
