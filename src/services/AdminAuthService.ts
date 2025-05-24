
import { supabase } from '@/integrations/supabase/client';

export interface AdminCredentials {
  email: string;
  password: string;
}

// بيانات الأدمن الجديدة
const ADMIN_CREDENTIALS = {
  email: 'admin@steat.sa',
  password: 'StEatAdmin2025#'
};

export class AdminAuthService {
  /**
   * تسجيل دخول الأدمن
   */
  static async signIn(email: string, password: string) {
    try {
      // التحقق من بيانات الأدمن
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        // إنشاء جلسة مؤقتة للأدمن
        const adminSession = {
          user: {
            id: 'admin-user-id',
            email: ADMIN_CREDENTIALS.email,
            user_metadata: { user_type: 'admin' }
          },
          session: {
            access_token: 'admin-temp-token',
            expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 ساعة
          }
        };

        // حفظ بيانات الجلسة
        localStorage.setItem('admin_session', JSON.stringify(adminSession));
        
        return { 
          data: adminSession, 
          error: null 
        };
      } else {
        return { 
          data: null, 
          error: { message: 'بيانات تسجيل الدخول غير صحيحة' }
        };
      }
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
      localStorage.removeItem('admin_session');
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'خطأ في تسجيل الخروج' } };
    }
  }

  /**
   * الحصول على الجلسة الحالية
   */
  static async getSession() {
    try {
      const session = localStorage.getItem('admin_session');
      if (session) {
        const parsedSession = JSON.parse(session);
        
        // التحقق من انتهاء صلاحية الجلسة
        if (parsedSession.session.expires_at > Date.now()) {
          return { 
            data: { session: parsedSession }, 
            error: null 
          };
        } else {
          localStorage.removeItem('admin_session');
          return { 
            data: { session: null }, 
            error: null 
          };
        }
      }
      
      return { 
        data: { session: null }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: { session: null }, 
        error 
      };
    }
  }

  /**
   * التحقق من صلاحية الأدمن
   */
  static async isAdmin(): Promise<boolean> {
    try {
      const { data } = await this.getSession();
      return data?.session?.user?.user_metadata?.user_type === 'admin';
    } catch (error) {
      return false;
    }
  }
}
