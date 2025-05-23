
import React from 'react';
import { Home, UtensilsCrossed, ShoppingBag, Ticket, Users, ShieldCheck, FileText, Cookie } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

// Define navigation icons
const navIcons: { [key: string]: React.ReactNode } = {
  home: <Home className="h-4 w-4 mr-2" />,
  restaurants: <UtensilsCrossed className="h-4 w-4 mr-2" />,
  products: <ShoppingBag className="h-4 w-4 mr-2" />,
  coupons: <Ticket className="h-4 w-4 mr-2" />,
  addFood: <UtensilsCrossed className="h-4 w-4 mr-2" />,
  privacyPolicy: <ShieldCheck className="h-4 w-4 mr-2" />,
  termsConditions: <FileText className="h-4 w-4 mr-2" />,
  cookiePolicy: <Cookie className="h-4 w-4 mr-2" />,
};

interface NavigationLinksProps {
  closeMenu: () => void;
}

const NavigationLinks: React.FC<NavigationLinksProps> = ({ closeMenu }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Navigation links
  const navigationLinks = [
    { key: "home", title: t('home'), path: "/" },
    { key: "restaurants", title: t('restaurants'), path: "/restaurants" },
    { key: "products", title: t('products'), path: "/products" },
    { key: "coupons", title: t('coupons'), path: "/coupons" },
    { key: "addFood", title: t('addFood'), path: "/add-food" },
    { key: "privacyPolicy", title: t('privacyPolicy'), path: "/privacy-policy" },
    { key: "termsConditions", title: t('termsConditions'), path: "/terms-conditions" },
    { key: "cookiePolicy", title: t('cookiePolicy'), path: "/cookie-policy" },
  ];

  return (
    <div className="flex flex-col gap-1">
      {navigationLinks.map(link => (
        <DropdownMenuItem
          key={link.path}
          className={`
            group cursor-pointer flex items-center gap-2 rounded-lg px-3 py-2
            font-semibold transition-all duration-150 ease-in-out shadow-none relative
            focus:bg-yellow-50 focus:text-yellow-900 dark:focus:bg-yellow-900/20 dark:focus:text-yellow-100
            hover:scale-[1.03] hover:bg-gradient-to-tr hover:from-yellow-400 hover:to-amber-500/80 hover:text-white dark:hover:from-yellow-700 dark:hover:to-yellow-900/80 dark:hover:text-yellow-100
            active:scale-[1.01] active:ring-2 active:ring-yellow-400
            ${link.key === "addFood" ? "bg-gradient-to-tr from-yellow-300 via-yellow-200 to-amber-200 dark:from-yellow-700 dark:to-yellow-900/60 text-amber-700 dark:text-yellow-200 font-bold scale-[1.04] shadow hover:scale-[1.07] my-[3px]" : ""}
          `}
          onClick={() => {
            navigate(link.path);
            closeMenu();
          }}
          style={{ fontWeight: link.key === "addFood" ? 700 : undefined }}
        >
          <span className="flex items-center justify-center bg-yellow-50 dark:bg-yellow-800 rounded-full p-1.5 group-hover:bg-white/20 transition-all duration-200 shadow ring-1 ring-yellow-200 dark:ring-yellow-900">
            {navIcons[link.key] ?? <span className="h-4 w-4 mr-2"></span>}
          </span>
          <span className="text-base font-cairo truncate">{link.title}</span>
        </DropdownMenuItem>
      ))}
    </div>
  );
};

export default NavigationLinks;
