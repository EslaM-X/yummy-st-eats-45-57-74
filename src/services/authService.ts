
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData?: { full_name?: string, phone?: string, username?: string, user_type?: string }) {
    try {
      // التحقق من البريد الإلكتروني
      if (!email || !password) {
        return { data: null, error: new Error('البريد الإلكتروني وكلمة المرور مطلوبان') };
      }
      
      // التحقق من وجود البريد الإلكتروني مسبقاً
      const { data: existingEmailUser } = await supabase.auth.signInWithPassword({ email, password: "temp-check-password" })
        .catch(() => ({ data: null }));
      
      if (existingEmailUser?.user) {
        return { 
          data: null, 
          error: new Error('البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.') 
        };
      }
      
      // التحقق من وجود اسم المستخدم مسبقاً
      if (userData?.username) {
        const { exists, error: usernameError } = await this.checkUsernameExists(userData.username);
        if (usernameError) {
          console.error("Error checking username:", usernameError);
        }
        if (exists) {
          return { 
            data: null, 
            error: new Error('اسم المستخدم مسجل مسبقاً. يرجى اختيار اسم مستخدم آخر.') 
          };
        }
      }
      
      // إنشاء المستخدم
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth?email_confirmed=true`
        }
      });
      
      if (error) {
        // تحويل رسائل خطأ Supabase إلى رسائل عربية مفهومة
        let translatedError: string;
        
        if (error.message.includes('User already registered')) {
          translatedError = 'البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.';
        } else if (error.message.includes('weak password')) {
          translatedError = 'كلمة المرور ضعيفة. يرجى استخدام كلمة مرور أقوى.';
        } else if (error.message.includes('email format')) {
          translatedError = 'صيغة البريد الإلكتروني غير صحيحة.';
        } else if (error.message.includes('duplicate key')) {
          if (error.message.includes('username')) {
            translatedError = 'اسم المستخدم مسجل مسبقاً. يرجى اختيار اسم مستخدم آخر.';
          } else {
            translatedError = 'البيانات المدخلة مستخدمة مسبقاً.';
          }
        } else if (error.message.includes('network')) {
          translatedError = 'حدث خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.';
        } else {
          translatedError = 'حدث خطأ أثناء إنشاء الحساب: ' + error.message;
        }
        
        console.error('Signup error with details:', {
          originalError: error.message,
          translatedError,
          code: error.code,
          status: error.status
        });
        
        return { data: null, error: new Error(translatedError) };
      }
      
      // إذا لم يكن هناك خطأ، فقد تم إنشاء الحساب بنجاح
      return { data, error: null };
    } catch (error: any) {
      console.error('Exception during sign up with full details:', error);
      
      // محاولة استخلاص رسائل خطأ أكثر تفصيلاً
      const errorMessage = error.message || 'حدث خطأ غير معروف أثناء إنشاء الحساب';
      
      return { 
        data: null, 
        error: new Error(`فشل إنشاء الحساب: ${errorMessage}`) 
      };
    }
  },
  
  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      if (!email || !password) {
        return { data: null, error: new Error('البريد الإلكتروني وكلمة المرور مطلوبان') };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        let translatedError: string;
        
        if (error.message.includes('Invalid login credentials')) {
          translatedError = 'بيانات تسجيل الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.';
        } else if (error.message.includes('Email not confirmed')) {
          translatedError = 'لم يتم تأكيد البريد الإلكتروني بعد. يرجى التحقق من بريدك الإلكتروني للحصول على رابط التأكيد.';
        } else if (error.message.includes('network')) {
          translatedError = 'حدث خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.';
        } else {
          translatedError = 'حدث خطأ أثناء تسجيل الدخول: ' + error.message;
        }
        
        console.error('Sign in error with details:', {
          originalError: error.message,
          translatedError,
          code: error.code
        });
        
        return { data: null, error: new Error(translatedError) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Exception during sign in:', error);
      return { data: null, error: new Error(`فشل تسجيل الدخول: ${error.message || 'خطأ غير معروف'}`) };
    }
  },
  
  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        return { error: new Error(`فشل تسجيل الخروج: ${error.message}`) };
      }
      return { error: null };
    } catch (error: any) {
      console.error('Exception during sign out:', error);
      return { error: new Error(`فشل تسجيل الخروج: ${error.message || 'خطأ غير معروف'}`) };
    }
  },
  
  // Reset password
  async resetPassword(email: string) {
    try {
      if (!email) {
        return { data: null, error: new Error('البريد الإلكتروني مطلوب') };
      }
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        let translatedError: string;
        
        if (error.message.includes('email not found')) {
          translatedError = 'البريد الإلكتروني غير مسجل في النظام.';
        } else {
          translatedError = 'حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور: ' + error.message;
        }
        
        return { data: null, error: new Error(translatedError) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Exception during password reset:', error);
      return { data: null, error: new Error(`فشل إرسال رابط إعادة تعيين كلمة المرور: ${error.message || 'خطأ غير معروف'}`) };
    }
  },
  
  // Update user password
  async updatePassword(newPassword: string) {
    try {
      if (!newPassword) {
        return { data: null, error: new Error('كلمة المرور الجديدة مطلوبة') };
      }
      
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        let translatedError: string;
        
        if (error.message.includes('weak password')) {
          translatedError = 'كلمة المرور ضعيفة. يرجى استخدام كلمة مرور أقوى.';
        } else {
          translatedError = 'حدث خطأ أثناء تحديث كلمة المرور: ' + error.message;
        }
        
        return { data: null, error: new Error(translatedError) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Exception during password update:', error);
      return { data: null, error: new Error(`فشل تحديث كلمة المرور: ${error.message || 'خطأ غير معروف'}`) };
    }
  },
  
  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser();
  },
  
  // Get current session
  getSession() {
    return supabase.auth.getSession();
  },
  
  // Check if username exists
  async checkUsernameExists(username: string) {
    try {
      if (!username) {
        return { exists: false, error: new Error('اسم المستخدم مطلوب') };
      }
      
      const { data, error, count } = await supabase
        .from('profiles')
        .select('username', { count: 'exact' })
        .eq('username', username)
        .limit(1);
      
      if (error) {
        console.error('Error checking username:', error);
        return { exists: false, error };
      }
      
      return { exists: (count || 0) > 0, error: null };
    } catch (error: any) {
      console.error('Exception checking username:', error);
      return { exists: false, error };
    }
  }
};

// Function to resend confirmation email
export const resendConfirmationEmail = async (email: string, toast: any) => {
  try {
    if (!email) {
      toast({
        title: "خطأ",
        description: "البريد الإلكتروني مطلوب لإعادة إرسال رابط التأكيد.",
        variant: "destructive",
      });
      return { success: false, error: new Error("البريد الإلكتروني مطلوب") };
    }
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) {
      let translatedError: string;
      
      if (error.message.includes('already confirmed')) {
        translatedError = 'البريد الإلكتروني مؤكد بالفعل. يمكنك تسجيل الدخول.';
      } else if (error.message.includes('not found')) {
        translatedError = 'البريد الإلكتروني غير مسجل في النظام.';
      } else if (error.message.includes('rate limited')) {
        translatedError = 'لقد قمت بإرسال الكثير من الطلبات. يرجى الانتظار قبل المحاولة مرة أخرى.';
      } else {
        translatedError = 'حدث خطأ أثناء إعادة إرسال رابط التأكيد: ' + error.message;
      }
      
      toast({
        title: "فشل إرسال رابط التأكيد",
        description: translatedError,
        variant: "destructive",
      });
      
      throw error;
    }
    
    toast({
      title: "تم إرسال رابط التأكيد",
      description: "تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.",
    });
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error resending confirmation email with details:', error);
    
    toast({
      title: "فشل إرسال رابط التأكيد",
      description: error.message || "حدث خطأ أثناء محاولة إرسال رابط التأكيد. يرجى المحاولة مرة أخرى.",
      variant: "destructive",
    });
    
    return { success: false, error };
  }
};

// Function to setup email confirmation handling
export const setupEmailConfirmation = async () => {
  try {
    // Setup hash change listener for handling the email confirmation
    window.addEventListener('hashchange', async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('#access_token=')) {
        // Extract token from hash
        const accessToken = hash.split('&')[0].replace('#access_token=', '');
        
        if (accessToken) {
          // Set auth session with the token
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: '',
          });
          
          if (error) {
            console.error('Error setting session with details:', error);
            window.location.href = `/auth?error=${encodeURIComponent(error.message)}&error_code=${error.code || 'unknown'}`;
          } else {
            // Redirect to auth page with success flag
            window.location.href = '/auth?email_confirmed=true';
          }
        }
      }
    });
  } catch (error: any) {
    console.error('Error setting up email confirmation with details:', error);
  }
};

export default authService;
