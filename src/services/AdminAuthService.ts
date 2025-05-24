
import { supabase } from '@/integrations/supabase/client';

export interface AdminCredentials {
  email: string;
  password: string;
}

export class AdminAuthService {
  /**
   * تسجيل دخول الأدمن باستخدام Supabase
   */
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // التحقق من صلاحيات الأدمن
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', data.user.id)
          .single();

        if (profileError || profile?.user_type !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('ليس لديك صلاحيات إدارية');
        }

        return { 
          data: { 
            user: data.user, 
            session: data.session 
          }, 
          error: null 
        };
      }

      throw new Error('فشل في تسجيل الدخول');
    } catch (error: any) {
      return { 
        data: null, 
        error: { message: error.message || 'خطأ في تسجيل الدخول' }
      };
    }
  }

  /**
   * تسجيل خروج الأدمن
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error: any) {
      return { error: { message: error.message || 'خطأ في تسجيل الخروج' } };
    }
  }

  /**
   * الحصول على الجلسة الحالية
   */
  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { data, error };
    } catch (error) {
      return { data: { session: null }, error };
    }
  }

  /**
   * التحقق من صلاحية الأدمن
   */
  static async isAdmin(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return false;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      return profile?.user_type === 'admin';
    } catch (error) {
      return false;
    }
  }
}
