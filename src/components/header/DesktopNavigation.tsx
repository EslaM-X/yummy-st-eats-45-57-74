
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from "@/components/ui/button";
import { ChefHat, Store } from "lucide-react";

const DesktopNavigation = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isRestaurantOwner } = useUserRole(user);
  
  const navItems = [
    { name: t('home'), href: '/' },
    { name: t('restaurants'), href: '/restaurants' },
    { name: t('products'), href: '/products' },
    { name: t('coupons'), href: '/coupons' },
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
      
      {/* Restaurant Dashboard Link for Restaurant Owners */}
      {isRestaurantOwner && (
        <Link to="/restaurant-dashboard" className="relative group">
          <Button
            variant="outline"
            className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-none transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
            <Store className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            <span>{t('restaurantDashboard')}</span>
          </Button>
        </Link>
      )}
      
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
