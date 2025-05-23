
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sanitizeMetadata } from './AuthUtils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, Eye, EyeOff, RefreshCw } from "lucide-react";
import { resendConfirmationEmail } from '@/services/authService';

// Register form schema with password confirmation
const registerSchema = z.object({
  email: z.string().email("يجب إدخال بريد إلكتروني صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "يجب تأكيد كلمة المرور"),
  fullName: z.string().min(2, "يجب إدخال الاسم الكامل"),
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
    .max(20, "اسم المستخدم يجب ألا يتجاوز 20 حرفاً")
    .regex(/^[a-zA-Z0-9_]+$/, "اسم المستخدم يجب أن يحتوي على أحرف وأرقام وشرطات سفلية فقط"),
  phone: z.string().optional(),
  userType: z.enum(["customer", "restaurant_owner"])
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [resendingEmail, setResendingEmail] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [duplicateError, setDuplicateError] = useState<{ type: string, message: string } | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();
  const { signUp } = useAuth();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      username: "",
      phone: "",
      userType: "customer"
    }
  });

  // معالجة تسجيل حساب جديد
  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setLoading(true);
    setDuplicateError(null);
    
    try {
      // تجهيز البيانات الوصفية مع معالجة الأحرف غير المتوافقة
      const metadata = sanitizeMetadata({
        full_name: values.fullName,
        username: values.username,
        phone: values.phone || '',
        user_type: values.userType
      });
      
      // استخدام وظيفة signUp من AuthContext
      const { error, data } = await signUp(values.email, values.password, metadata);
      
      if (error) {
        console.error('Signup error:', error);
        
        // التحقق من نوع الخطأ وتقديم رسائل مخصصة للمستخدم
        const errorMessage = error.message || "";
        
        // التحقق من تكرار البريد الإلكتروني
        if (errorMessage.includes('email') && errorMessage.includes('already')) {
          setDuplicateError({
            type: 'email',
            message: 'البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.'
          });
          throw new Error('البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.');
        }
        
        // التحقق من تكرار اسم المستخدم (من خلال خطأ قيود قاعدة البيانات الفريدة)
        if (errorMessage.includes('duplicate key') && errorMessage.includes('username')) {
          setDuplicateError({
            type: 'username',
            message: 'اسم المستخدم مستخدم بالفعل. يرجى اختيار اسم مستخدم آخر.'
          });
          throw new Error('اسم المستخدم مستخدم بالفعل. يرجى اختيار اسم مستخدم آخر.');
        }
        
        throw error;
      }
      
      // حفظ البريد الإلكتروني للمستخدم المسجل للاستخدام في إعادة الإرسال
      setRegisteredEmail(values.email);

      // تحديد نجاح التسجيل
      setRegistrationSuccess(true);
      
      // إعادة تعيين النموذج بعد نجاح التسجيل
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "فشل إنشاء الحساب",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // معالجة إعادة إرسال رسالة التأكيد
  const handleResendConfirmation = async () => {
    if (!registeredEmail) return;
    
    setResendingEmail(true);
    try {
      await resendConfirmationEmail(registeredEmail, toast);
    } catch (error) {
      console.error("Error resending confirmation:", error);
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <Form {...form}>
      {registrationSuccess && (
        <Alert className="mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-600 dark:text-green-400">
            {language === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully'}
          </AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            {language === 'ar' 
              ? 'تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى التحقق من صندوق البريد الوارد والضغط على رابط التأكيد لتفعيل حسابك.' 
              : 'A confirmation email has been sent to your email address. Please check your inbox and click on the confirmation link to activate your account.'}
          </AlertDescription>
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResendConfirmation}
              disabled={resendingEmail}
              className="text-green-600 border-green-300 hover:bg-green-100 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900"
            >
              {resendingEmail ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'ar' ? 'جارٍ إعادة الإرسال...' : 'Resending...'}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'إعادة إرسال رابط التأكيد' : 'Resend confirmation link'}
                </>
              )}
            </Button>
          </div>
        </Alert>
      )}
      
      {duplicateError && (
        <Alert className="mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-600 dark:text-red-400">
            {duplicateError.type === 'email' 
              ? (language === 'ar' ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already in use')
              : (language === 'ar' ? 'اسم المستخدم مستخدم بالفعل' : 'Username already taken')}
          </AlertTitle>
          <AlertDescription className="text-red-600 dark:text-red-400">
            {duplicateError.message}
          </AlertDescription>
        </Alert>
      )}
      
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
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'} 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="text-black dark:text-white pr-10"
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === 'ar' ? 'اسم المستخدم' : 'Username'}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'} 
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
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone (Optional)'}
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder={language === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'} 
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
          name="userType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {language === 'ar' ? 'نوع الحساب' : 'Account Type'}
              </FormLabel>
              <FormControl>
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="text-black dark:text-white">
                    <SelectValue placeholder={language === 'ar' ? 'اختر نوع الحساب' : 'Select account type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">
                      {language === 'ar' ? 'عميل' : 'Customer'}
                    </SelectItem>
                    <SelectItem value="restaurant_owner">
                      {language === 'ar' ? 'صاحب مطعم' : 'Restaurant Owner'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || registrationSuccess}
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
