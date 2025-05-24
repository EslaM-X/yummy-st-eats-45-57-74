
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { AdminAuthService } from '@/services/AdminAuthService';

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isRTL } = useLanguage();
  const { theme } = useTheme();

  // التحقق من وجود جلسة نشطة
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await AdminAuthService.getSession();
      if (data?.session) {
        navigate('/admin');
      }
    };
    
    checkSession();
  }, [navigate]);

  // استرجاع البريد الإلكتروني المحفوظ
  useEffect(() => {
    const savedEmail = localStorage.getItem('adminEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await AdminAuthService.signIn(email, password);

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        // حفظ البريد الإلكتروني إذا تم اختيار "تذكرني"
        if (rememberMe) {
          localStorage.setItem('adminEmail', email);
        } else {
          localStorage.removeItem('adminEmail');
        }

        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في لوحة الإدارة",
          variant: "default",
        });
        
        navigate('/admin');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "بيانات تسجيل الدخول غير صحيحة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg animate-fade-in border-t-4 border-teal-500 dark:border-teal-400">
          <CardHeader className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center shadow-md transform hover:scale-105 transition-transform duration-300">
              <span className="text-3xl font-bold text-white">ST</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">تسجيل دخول الأدمن</CardTitle>
            <CardDescription className="text-base text-gray-600 dark:text-gray-300">
              يرجى تسجيل الدخول للوصول إلى لوحة الإدارة
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <label htmlFor="email" className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <User className="absolute top-1/2 transform -translate-y-1/2 right-3 rtl:right-auto rtl:left-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@steat.sa"
                      required
                      className="w-full pr-10 rtl:pr-4 rtl:pl-10 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute top-1/2 transform -translate-y-1/2 right-3 rtl:right-auto rtl:left-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="StEatAdmin2025#"
                    required
                    className="w-full pr-10 rtl:pr-4 rtl:pl-10 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute top-1/2 transform -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-teal-600 shadow-sm focus:border-teal-300 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                  />
                  <label htmlFor="remember-me" className="text-gray-700 dark:text-gray-300">تذكرني</label>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">بيانات تسجيل الدخول:</h4>
                <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  <p><strong>البريد الإلكتروني:</strong> admin@steat.sa</p>
                  <p><strong>كلمة المرور:</strong> StEatAdmin2025#</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 transition-colors text-white" 
                disabled={isLoading}
              >
                {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                هل تحتاج إلى مساعدة؟ <a href="#" className="text-teal-600 hover:underline dark:text-teal-400">تواصل مع الدعم الفني</a>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginPage;
