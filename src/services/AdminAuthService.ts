
import { supabase } from '@/integrations/supabase/client';

export interface AdminCredentials {
  email: string;
  password: string;
}

export class AdminAuthService {
  // بيانات تسجيل دخول الأدمن المؤقتة (يجب تغييرها في الإنتاج)
  private static readonly ADMIN_CREDENTIALS: AdminCredentials = {
    email: 'admin@steat.app',
    password: 'StEat2024!'
  };

  /**
   * تسجيل دخول الأدمن
   */
  static async signIn(email: string, password: string) {
    try {
      // التحقق من بيانات الاعتماد
      if (email !== this.ADMIN_CREDENTIALS.email || password !== this.ADMIN_CREDENTIALS.password) {
        throw new Error('بيانات تسجيل الدخول غير صحيحة');
      }

      // إنشاء جلسة مؤقتة للأدمن
      const adminSession = {
        user: {
          id: 'admin-user-id',
          email: email,
          role: 'admin'
        },
        access_token: 'admin-temp-token',
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 ساعة
      };

      // حفظ الجلسة في localStorage
      localStorage.setItem('admin_session', JSON.stringify(adminSession));
      
      return { 
        data: { 
          user: adminSession.user, 
          session: adminSession 
        }, 
        error: null 
      };
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
  static getSession() {
    try {
      const sessionData = localStorage.getItem('admin_session');
      if (!sessionData) return { data: { session: null }, error: null };

      const session = JSON.parse(sessionData);
      
      // التحقق من انتهاء صلاحية الجلسة
      if (Date.now() > session.expires_at) {
        localStorage.removeItem('admin_session');
        return { data: { session: null }, error: null };
      }

      return { data: { session }, error: null };
    } catch (error) {
      return { data: { session: null }, error: null };
    }
  }

  /**
   * التحقق من صلاحية الأدمن
   */
  static isAdmin(): boolean {
    const { data } = this.getSession();
    return data.session?.user?.role === 'admin';
  }
}
