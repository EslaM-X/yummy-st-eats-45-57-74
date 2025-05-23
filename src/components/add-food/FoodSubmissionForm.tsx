
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, DollarSign, FileText, Tag } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'اسم الطعام يجب أن يكون على الأقل حرفين'),
  description: z.string().min(10, 'الوصف يجب أن يكون على الأقل 10 أحرف'),
  price: z.string().min(1, 'السعر مطلوب').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'السعر يجب أن يكون رقم موجب'),
  category: z.string().min(1, 'الفئة مطلوبة'),
  restaurant_id: z.string().optional(),
  image_url: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const FoodSubmissionForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [restaurants, setRestaurants] = React.useState<Array<{id: string, name: string}>>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      category: '',
      restaurant_id: '',
      image_url: '',
    },
  });

  React.useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const onSubmit = async (values: FormData) => {
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
        .from('pending_foods')
        .insert({
          name: values.name,
          description: values.description,
          price: parseFloat(values.price),
          category: values.category,
          restaurant_id: values.restaurant_id || null,
          image_url: values.image_url || null,
          owner_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال طلب إضافة الطعام للمراجعة. سيتم إشعارك عند الموافقة عليه.",
      });

      form.reset();
    } catch (error) {
      console.error('Error submitting food:', error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الطلب. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'وجبات رئيسية',
    'مقبلات',
    'حلويات',
    'مشروبات',
    'سلطات',
    'بيتزا',
    'برغر',
    'مأكولات بحرية',
    'دجاج',
    'لحوم',
    'نباتي',
    'أخرى'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full">
                <Upload className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
              إضافة طعام جديد
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
              شارك طعامك المفضل مع المجتمع
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <FileText className="h-4 w-4" />
                          اسم الطعام
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="مثال: شاورما الدجاج" 
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
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <DollarSign className="h-4 w-4" />
                          السعر (ريال سعودي)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="25.00" 
                            type="number" 
                            step="0.01" 
                            min="0"
                            className="h-12 text-base"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <Tag className="h-4 w-4" />
                          الفئة
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="اختر الفئة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="restaurant_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          المطعم (اختياري)
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="اختر المطعم (اختياري)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {restaurants.map((restaurant) => (
                              <SelectItem key={restaurant.id} value={restaurant.id}>
                                {restaurant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel className="text-base font-semibold">
                        وصف الطعام
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="وصف تفصيلي للطعام، المكونات، طريقة التحضير..."
                          className="min-h-[120px] text-base resize-none"
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
                      <FormLabel className="text-base font-semibold">
                        رابط الصورة (اختياري)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
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
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FoodSubmissionForm;
