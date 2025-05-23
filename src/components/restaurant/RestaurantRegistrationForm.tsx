
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store, MapPin, Plus, Utensils, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationFormProps {
  selectedType: string;
  onBack: () => void;
}

const RestaurantRegistrationForm: React.FC<RegistrationFormProps> = ({ 
  selectedType, 
  onBack 
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Define form schema for restaurant registration
  const formSchema = z.object({
    name: z.string().min(2, 'اسم المطعم يجب أن يكون على الأقل حرفين'),
    address: z.string().min(5, 'العنوان يجب أن يكون على الأقل 5 أحرف'),
    phone: z.string().min(8, 'رقم الهاتف يجب أن يكون على الأقل 8 أرقام'),
    email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
    description: z.string().min(10, 'الوصف يجب أن يكون على الأقل 10 أحرف'),
    cuisine: z.string().min(2, 'نوع المطبخ مطلوب'),
    image_url: z.string().url('رابط الصورة غير صحيح').optional().or(z.literal('')),
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      cuisine: "",
      image_url: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('pending_restaurants')
        .insert({
          name: values.name,
          description: values.description,
          address: values.address,
          phone: values.phone,
          email: values.email || null,
          image_url: values.image_url || null,
          cuisine_type: values.cuisine,
          owner_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال طلب تسجيل المطعم للمراجعة. سيتم إشعارك عند الموافقة عليه.",
      });

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error submitting restaurant:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الطلب. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedType === 'food') {
    return (
      <div className="p-6 text-center">
        <div className="flex justify-center mb-6">
          <Utensils className="h-16 w-16 text-yellow-600 dark:text-yellow-500" />
        </div>
        <p className="mb-6">سيتم توجيهك إلى صفحة إضافة الطعام</p>
        <Button 
          type="button"
          onClick={() => navigate('/add-food')}
          className="bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> الذهاب لإضافة طعام
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
        >
          العودة
        </Button>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
          تسجيل مطعم جديد
        </h2>
        <div className="w-20"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base font-semibold">
                      <Store className="w-4 h-4" />
                      اسم المطعم
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="مثال: مطعم الأصالة" 
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cuisine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">نوع المطبخ</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="مثال: مطبخ شامي" 
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="w-4 h-4" />
                    العنوان
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="العنوان الكامل للمطعم" 
                      className="h-12 text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base font-semibold">
                      <Phone className="w-4 h-4" />
                      رقم الهاتف
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="05xxxxxxxx" 
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base font-semibold">
                      <Mail className="w-4 h-4" />
                      البريد الإلكتروني (اختياري)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="restaurant@example.com" 
                        type="email"
                        className="h-12 text-base"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">وصف المطعم</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="min-h-[120px] text-base resize-none" 
                      placeholder="وصف تفصيلي عن المطعم، التخصصات، المميزات..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">رابط صورة المطعم (اختياري)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/restaurant-image.jpg" 
                      className="h-12 text-base"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    جاري الإرسال...
                  </div>
                ) : (
                  'إرسال للمراجعة'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
};

export default RestaurantRegistrationForm;
