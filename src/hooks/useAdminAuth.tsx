
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
        
        // التحقق من جلسة Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setUser(null);
          }
          return;
        }

        if (session?.user) {
          // التحقق من صلاحيات الأدمن من قاعدة البيانات
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Profile error:', profileError);
            if (mounted) {
              setIsAuthenticated(false);
              setIsAdmin(false);
              setUser(null);
            }
            return;
          }

          const isAdminUser = profile?.user_type === 'admin';
          
          if (mounted) {
            setIsAuthenticated(true);
            setIsAdmin(isAdminUser);
            setUser(session.user);
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

    // مراقبة تغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          if (mounted) {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setUser(null);
          }
        } else if (event === 'SIGNED_IN' && session) {
          // إعادة فحص الصلاحيات عند تسجيل الدخول
          setTimeout(() => {
            if (mounted) {
              checkAdminAuth();
            }
          }, 100);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
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
    if (loading) return true; // منع إعادة التوجيه أثناء التحميل
    
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
