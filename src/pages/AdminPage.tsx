
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminContent from '@/components/admin/AdminContent';
import AdminFooter from '@/components/admin/AdminFooter';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading, user, handleLogout, checkAndRedirect } = useAdminAuth();

  // التحقق من صلاحيات المستخدم مرة واحدة فقط
  useEffect(() => {
    if (!loading && !hasCheckedAuth) {
      const isAuthorized = checkAndRedirect();
      setHasCheckedAuth(true);
      
      if (!isAuthorized) {
        return; // سيتم إعادة التوجيه تلقائياً
      }
    }
  }, [loading, hasCheckedAuth, checkAndRedirect]);

  // التحقق من حجم الشاشة عند التحميل وعند تغييرها
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // طي الشريط الجانبي تلقائيًا على الشاشات الصغيرة
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    
    // فحص مبدئي
    checkScreenSize();
    
    // إضافة مستمع للحدث
    window.addEventListener('resize', checkScreenSize);
    
    // التنظيف
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarCollapsed]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // طي الشريط الجانبي تلقائيًا على الهواتف المحمولة عند تغيير التبويبات
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  };

  // عرض شاشة التحميل أثناء فحص المصادقة
  if (loading || !hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // عدم عرض أي محتوى إذا لم يكن المستخدم مخولاً
  if (!isAdmin || !isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full">
        <AdminLayout
          activeTab={activeTab}
          onTabChange={handleTabChange}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          isMobile={isMobile}
          handleLogout={handleLogout}
        >
          <div className="flex flex-col min-h-screen">
            <AdminHeader 
              activeTab={activeTab}
              handleLogout={handleLogout}
            />
            
            <div className="flex-grow">
              <AdminContent 
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
            
            <AdminFooter />
          </div>
        </AdminLayout>
      </div>
    </SidebarProvider>
  );
};

export default AdminPage;
