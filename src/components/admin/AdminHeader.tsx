
import React, { useState } from 'react';
import { Bell, Search, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from '@/components/theme-provider';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
}

interface AdminHeaderProps {
  activeTab: string;
  handleLogout: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, handleLogout }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, text: 'تم إضافة مطعم جديد', time: 'منذ 5 دقائق', read: false },
    { id: 2, text: 'طلب جديد بقيمة 120 ST', time: 'منذ 10 دقائق', read: false },
    { id: 3, text: 'تقرير المبيعات الأسبوعي جاهز', time: 'منذ 30 دقيقة', read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'لوحة التحكم';
      case 'users': return 'المستخدمين';
      case 'restaurants': return 'المطاعم';
      case 'orders': return 'الطلبات';
      case 'coupons': return 'الكوبونات';
      case 'pending': return 'المراجعة';
      case 'refunds': return 'الاستردادات';
      case 'payments': return 'المدفوعات';
      case 'settings': return 'الإعدادات';
      default: return '';
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    toast({
      title: "تغيير المظهر",
      description: theme === 'dark' ? "تم تغيير المظهر إلى الوضع النهاري" : "تم تغيير المظهر إلى الوضع الليلي",
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    toast({
      title: "قراءة الإشعارات",
      description: "تم تعيين جميع الإشعارات كمقروءة",
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm px-4 md:px-6 py-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white font-cairo truncate">
          {getTabTitle(activeTab)}
        </h1>
        {activeTab === 'dashboard' && (
          <Badge variant="outline" className="hidden md:flex bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 border-teal-300 dark:border-teal-700">
            مباشر
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative md:block hidden">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="بحث..."
            className="py-2 pl-10 pr-4 rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white text-sm md:w-[200px] lg:w-[300px] bg-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
        
        {/* Notifications */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-50 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">الإشعارات</h3>
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-gray-600 dark:text-gray-300">
                  تعيين الكل كمقروء
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    لا توجد إشعارات
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      className={`p-3 border-b border-gray-100 dark:border-gray-700 flex items-start gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        !notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className={`mt-1 p-1 rounded-full ${!notif.read ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.text}</p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{notif.time}</span>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" size="sm" className="text-teal-600 dark:text-teal-400 text-sm">
                  عرض كل الإشعارات
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden sm:flex text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        
        <Button variant="ghost" size="icon" onClick={handleLogout} className="hidden sm:flex text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          <LogOut className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 ml-2 md:ml-4">
          <div className="hidden sm:block text-right rtl:text-left">
            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">مدير النظام</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@steat.app</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold">
            م
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
