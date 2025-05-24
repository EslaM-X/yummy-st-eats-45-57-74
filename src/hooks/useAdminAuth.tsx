
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AdminAuthService } from '@/services/AdminAuthService';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        setLoading(true);
        
        const { data } = AdminAuthService.getSession();
        const session = data.session;
        
        if (session?.user) {
          setIsAuthenticated(true);
          setIsAdmin(session.user.role === 'admin');
        } else {
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Admin authentication error:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminAuth();
    
    // فحص دوري للجلسة كل دقيقة
    const interval = setInterval(checkAdminAuth, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await AdminAuthService.signOut();
      
      setIsAuthenticated(false);
      setIsAdmin(false);
      
      toast({
        title: "تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
      });
      
      navigate('/admin-login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const checkAndRedirect = () => {
    if (!isAuthenticated) {
      toast({
        title: "غير مصرح",
        description: "يجب تسجيل الدخول للوصول إلى لوحة الإدارة",
        variant: "destructive",
      });
      navigate('/admin-login');
      return false;
    }
    
    if (!isAdmin) {
      toast({
        title: "وصول مرفوض",
        description: "لا تملك الصلاحية للوصول إلى لوحة الإدارة",
        variant: "destructive",
      });
      navigate('/');
      return false;
    }
    
    return true;
  };

  return { 
    isAuthenticated, 
    isAdmin, 
    loading, 
    handleLogout,
    checkAndRedirect
  };
};
