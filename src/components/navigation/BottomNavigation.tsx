
import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home,
  UtensilsCrossed,
  ShoppingBag,
  Ticket,
  User
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import BottomNavItem from './BottomNavItem';

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { cartItems } = useCart();
  
  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { icon: Home, label: t('home'), path: '/' },
    { icon: UtensilsCrossed, label: t('restaurants'), path: '/restaurants' },
    { icon: ShoppingBag, label: t('products'), path: '/products' },
    { icon: Ticket, label: t('coupons'), path: '/coupons' },
    { icon: User, label: t('profile'), path: '/profile' },
  ];

  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="bg-background/80 backdrop-blur-lg border-t border-border px-2 py-1">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <BottomNavItem
              key={item.path}
              path={item.path}
              label={item.label}
              icon={item.icon}
              isActive={location.pathname === item.path}
              showBadge={item.path === '/profile' && !!user}
              badgeCount={item.path === '/cart' ? cartItemsCount : undefined}
            />
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNavigation;
