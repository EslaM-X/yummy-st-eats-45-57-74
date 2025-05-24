
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AdminAuthService } from '@/services/AdminAuthService';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const checkAdminAuth = async () => {
      try {
        setLoading(true);
        
        const { data } = await AdminAuthService.getSession();
        
        if (data?.session?.user) {
          const isAdminUser = data.session.user.user_metadata?.user_type === 'admin';
          
          if (mounted) {
            setIsAuthenticated(true);
            setIsAdmin(isAdminUser);
            setUser(data.session.user);
          }
        } else {
          if (mounted) {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Admin authentication error:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    checkAdminAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await AdminAuthService.signOut();
      
      if (error) {
        throw error;
      }
      
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      
      toast({
        title: "تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
      });
      
      navigate('/admin-login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "خطأ في تسجيل الخروج",
        description: error.message || "حدث خطأ أثناء تسجيل الخروج. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const checkAndRedirect = () => {
    if (loading) return true;
    
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
    user,
    handleLogout,
    checkAndRedirect
  };
};
