
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

// تعريف نموذج تسجيل الدخول
const loginSchema = z.object({
  email: z.string().email("يجب إدخال بريد إلكتروني صالح"),
  password: z.string().min(1, "يجب إدخال كلمة المرور")
});

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPassword }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const { signIn } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // معالجة تسجيل الدخول
  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      console.log("Attempting to login with:", values.email);
      
      const { error, data } = await signIn(values.email, values.password);
      
      if (error) {
        // عرض رسالة خطأ واضحة للمستخدم
        toast({
          title: language === 'ar' ? "خطأ في تسجيل الدخول" : "Login Error",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      console.log("Login successful:", data);
      
      // إزالة رسالة النجاح المكررة - سيتم التعامل معها في AuthContext
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Login error in component:", error);
      // تم التعامل مع الخطأ بالفعل أعلاه
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'} 
                  type="email" 
                  className="text-black dark:text-white"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'} 
                    type={showPassword ? "text" : "password"} 
                    className="text-black dark:text-white pr-10"
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 text-gray-500"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading 
            ? (language === 'ar' ? 'جارٍ تسجيل الدخول...' : 'Signing in...') 
            : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
        </Button>
        
        <div className="text-center mt-2">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={onForgotPassword}
          >
            {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
          </button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
