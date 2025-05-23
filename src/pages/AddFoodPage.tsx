import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface FormData {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  restaurantId: string;
}

const AddFoodPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    restaurantId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string; }[]>([]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name');

        if (error) {
          console.error('Error fetching restaurants:', error);
          toast({
            title: "خطأ",
            description: "فشل في تحميل المطاعم",
            variant: "destructive",
          });
          return;
        }

        setRestaurants(data || []);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل المطاعم",
          variant: "destructive",
        });
      }
    };

    fetchRestaurants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      if (!formData.name || !formData.price || !formData.category) {
        toast({
          title: "خطأ",
          description: "الرجاء ملء جميع الحقول المطلوبة",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (isNaN(parseFloat(formData.price))) {
        toast({
          title: "خطأ",
          description: "السعر يجب أن يكون رقمًا",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Submit to pending_foods table instead of direct approval
      const { error } = await supabase
        .from('pending_foods')
        .insert({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          image_url: formData.imageUrl || null,
          restaurant_id: formData.restaurantId || null,
          owner_id: user.id,
          status: 'pending' // Will be reviewed by admin
        });

      if (error) throw error;

      toast({
        title: "تم إرسال طلبك بنجاح!",
        description: "سيتم مراجعة طلب إضافة الطعام من قبل الإدارة قريباً",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        imageUrl: '',
        restaurantId: ''
      });

      // Redirect to coupons page instead of rewards
      setTimeout(() => {
        navigate('/coupons');
      }, 2000);

    } catch (error: any) {
      console.error('Error adding food:', error);
      toast({
        title: "فشل في إضافة الطعام",
        description: error.message || "حدث خطأ أثناء إضافة الطعام",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6">إضافة طعام جديد</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">اسم الطعام</Label>
              <Input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="price">السعر</Label>
              <Input
                type="number"
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">الفئة</Label>
              <Input
                type="text"
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="imageUrl">رابط الصورة</Label>
              <Input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="restaurantId">المطعم (اختياري)</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, restaurantId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المطعم" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "جاري الإرسال..." : "إضافة الطعام"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AddFoodPage;
