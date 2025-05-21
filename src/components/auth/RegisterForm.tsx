
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';

// Register form schema
const registerSchema = z.object({
  email: z.string().email("يجب إدخال بريد إلكتروني صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  fullName: z.string().min(2, "يجب إدخال الاسم الكامل"),
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(20, "اسم المستخدم يجب ألا يتجاوز 20 حرفاً")
    .regex(/^[a-zA-Z0-9_]+$/, "اسم المستخدم يجب أن يحتوي على أحرف وأرقام وشرطات سفلية فقط"),
  phone: z.string().optional(),
  userType: z.enum(["customer", "restaurant_owner"])
});

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const { signUp } = useAuth();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      username: "",
      phone: "",
      userType: "customer"
    }
  });

  // معالجة تسجيل حساب جديد
  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setLoading(true);
    try {
      console.log("Attempting to register user with data:", { 
        email: values.email, 
        fullName: values.fullName,
        username: values.username,
        phone: values.phone,
        userType: values.userType 
      });
      
      // استخدام وظيفة signUp من AuthContext بدلاً من الاتصال المباشر بـ Supabase
      const { error, data } = await signUp(values.email, values.password, {
        full_name: values.fullName,
        username: values.username,
        phone: values.phone,
        user_type: values.userType
      });
      
      if (error) throw error;
      
      console.log("Registration successful:", data);
      
      // تسجيل نجاح إنشاء الحساب
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.",
      });
      
      if (data.user && !data.session) {
        // الحساب يحتاج إلى تأكيد بالبريد الإلكتروني
        if (onSuccess) {
          onSuccess();
        }
      } else if (data.session) {
        // تم تسجيل الدخول تلقائياً
        window.location.href = '/';
      }
    } catch (error: any) {
      // معالجة الأخطاء
      console.error("Registration error:", error);
      let errorMessage = error.message || "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.";
      
      // رسائل خطأ أكثر تحديداً
      if (error.message?.includes("unique constraint")) {
        errorMessage = "البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل";
      }
      
      toast({
        title: "فشل إنشاء الحساب",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
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
                <Input 
                  placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'} 
                  type="password" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === 'ar' ? 'اسم المستخدم' : 'Username'}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone (Optional)'}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={language === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === 'ar' ? 'نوع الحساب' : 'Account Type'}
              </FormLabel>
              <FormControl>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="customer">
                    {language === 'ar' ? 'عميل' : 'Customer'}
                  </option>
                  <option value="restaurant_owner">
                    {language === 'ar' ? 'صاحب مطعم' : 'Restaurant Owner'}
                  </option>
                </select>
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
            ? (language === 'ar' ? 'جارٍ إنشاء الحساب...' : 'Creating account...') 
            : (language === 'ar' ? 'إنشاء حساب' : 'Register')}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
