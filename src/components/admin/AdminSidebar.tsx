
import React from 'react';
import { BarChart3, Users, Store, ShoppingCart, Settings, LogOut, CreditCard, RefreshCw, Ticket, Clock } from 'lucide-react'; // تم إضافة Ticket و Clock

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
  handleLogout?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  collapsed,
  toggleCollapsed,
  handleLogout
}) => {
  const menu = [
    { id: 'dashboard', name: 'لوحة التحكم', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'users', name: 'المستخدمين', icon: <Users className="h-5 w-5" /> },
    { id: 'restaurants', name: 'المطاعم', icon: <Store className="h-5 w-5" /> },
    { id: 'orders', name: 'الطلبات', icon: <ShoppingCart className="h-5 w-5" /> },
    { id: 'coupons', name: 'الكوبونات', icon: <Ticket className="h-5 w-5" /> }, // قسم جديد للكوبونات
    { id: 'pending', name: 'المراجعة', icon: <Clock className="h-5 w-5" /> }, // قسم جديد للمحتوى المعلق
    { id: 'payments', name: 'المدفوعات', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'refunds', name: 'الاستردادات', icon: <RefreshCw className="h-5 w-5" /> },
    { id: 'settings', name: 'الإعدادات', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <aside 
      className={`fixed bottom-0 z-40 h-screen transition-all duration-300 ease-in-out 
      ${collapsed ? 'w-16' : 'w-64'} bg-gray-800 text-white pt-20 pb-4 shadow-lg flex flex-col 
      justify-between`}
    >
      <div className="px-3">
        <button
          onClick={toggleCollapsed}
          className="absolute left-3 top-3 p-1 rounded-md hover:bg-gray-700 text-gray-300 hover:text-white"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
        </button>

        <ul>
          {menu.map((item) => (
            <li key={item.id} className="mb-1">
              <button
                onClick={() => onTabChange(item.id)}
                className={`flex items-center text-right w-full px-3 py-3 rounded-md transition-colors duration-150 
                ${activeTab === item.id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              >
                <div className={`flex ${collapsed ? 'justify-center w-full' : 'ml-auto'}`}>
                  {item.icon}
                </div>
                {!collapsed && <span className="mr-3">{item.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-3 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center text-right w-full px-3 py-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150"
        >
          <div className={`flex ${collapsed ? 'justify-center w-full' : 'ml-auto'}`}>
            <LogOut className="h-5 w-5" />
          </div>
          {!collapsed && <span className="mr-3">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
