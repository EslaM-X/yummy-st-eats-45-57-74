
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData?: { full_name?: string, phone?: string, username?: string, user_type?: string }) {
    try {
      // Improved signup flow with client-side validation
      if (!email || !password) {
        return { data: null, error: new Error('Email and password are required') };
      }
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth?email_confirmed=true`
        }
      });
      
      if (error) {
        // Check if error is related to existing user
        if (error.message.includes('User already registered')) {
          return { 
            data: null, 
            error: new Error('البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.') 
          };
        }
        throw error;
      }
      
      // Note: We don't need to manually create a profile here
      // The database trigger will handle this automatically
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      return { data: null, error };
    }
  },
  
  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    } catch (error) {
      console.error('Exception during sign in:', error);
      return { data: null, error };
    }
  },
  
  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Exception during sign out:', error);
      return { error };
    }
  },
  
  // Reset password
  async resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { data, error };
    } catch (error) {
      console.error('Exception during password reset:', error);
      return { data: null, error };
    }
  },
  
  // Update user password
  async updatePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      return { data, error };
    } catch (error) {
      console.error('Exception during password update:', error);
      return { data: null, error };
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
      const { data, error, count } = await supabase
        .from('profiles')
        .select('username', { count: 'exact' })
        .eq('username', username)
        .limit(1);
      
      return { exists: (count || 0) > 0, error };
    } catch (error) {
      console.error('Exception checking username:', error);
      return { exists: false, error };
    }
  }
};

// Function to resend confirmation email
export const resendConfirmationEmail = async (email: string, toast: any) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) throw error;
    
    toast({
      title: "تم إرسال رابط التأكيد",
      description: "تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.",
    });
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error resending confirmation email:', error);
    
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
            console.error('Error setting session:', error);
            window.location.href = `/auth?error=${error.message}`;
          } else {
            // Redirect to auth page with success flag
            window.location.href = '/auth?email_confirmed=true';
          }
        }
      }
    });
  } catch (error) {
    console.error('Error setting up email confirmation:', error);
  }
};

export default authService;
