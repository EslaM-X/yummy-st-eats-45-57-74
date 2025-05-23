
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PendingRestaurant, PendingFood } from '@/types/admin';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Clock, Store, UtensilsCrossed } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const AdminPendingContent: React.FC = () => {
  const { toast } = useToast();
  const [pendingRestaurants, setPendingRestaurants] = useState<PendingRestaurant[]>([]);
  const [pendingFoods, setPendingFoods] = useState<PendingFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPendingContent();
  }, []);

  const fetchPendingContent = async () => {
    setIsLoading(true);
    try {
      // Fetch pending restaurants using direct query
      const { data: restaurants, error: restaurantsError } = await supabase
        .rpc('get_pending_restaurants');

      if (restaurantsError) {
        console.error('Error fetching restaurants:', restaurantsError);
        // Fallback to direct table query
        const { data: fallbackRestaurants } = await supabase
          .from('pending_restaurants')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setPendingRestaurants(fallbackRestaurants as PendingRestaurant[] || []);
      } else {
        setPendingRestaurants(restaurants as PendingRestaurant[] || []);
      }

      // Fetch pending foods using direct query
      const { data: foods, error: foodsError } = await supabase
        .rpc('get_pending_foods');

      if (foodsError) {
        console.error('Error fetching foods:', foodsError);
        // Fallback to direct table query
        const { data: fallbackFoods } = await supabase
          .from('pending_foods')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        setPendingFoods(fallbackFoods as PendingFood[] || []);
      } else {
        setPendingFoods(foods as PendingFood[] || []);
      }

    } catch (error) {
      console.error('Error fetching pending content:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل المحتوى المعلق",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurantAction = async (
    restaurantId: string, 
    action: 'approved' | 'rejected',
    notes: string = ''
  ) => {
    try {
      // Update pending restaurant status
      const { error: updateError } = await supabase
        .rpc('update_pending_restaurant_status', {
          restaurant_id: restaurantId,
          new_status: action,
          notes: notes
        });

      if (updateError) {
        console.error('Error using RPC, trying direct update:', updateError);
        
        // Fallback to direct update
        const { error: directError } = await supabase
          .from('pending_restaurants')
          .update({
            status: action,
            admin_notes: notes,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', restaurantId);

        if (directError) throw directError;
      }

      // If approved, copy to main restaurants table
      if (action === 'approved') {
        const restaurant = pendingRestaurants.find(r => r.id === restaurantId);
        if (restaurant) {
          const { error: insertError } = await supabase
            .from('restaurants')
            .insert({
              name: restaurant.name,
              description: restaurant.description || '',
              address: restaurant.address || '',
              phone: restaurant.phone,
              logo_url: restaurant.image_url,
              cuisine_type: restaurant.cuisine_type ? [restaurant.cuisine_type] : [],
              owner_id: restaurant.owner_id,
              is_active: true
            });

          if (insertError) {
            console.error('Error inserting approved restaurant:', insertError);
            throw insertError;
          }
        }
      }

      toast({
        title: action === 'approved' ? "تمت الموافقة" : "تم الرفض",
        description: `تم ${action === 'approved' ? 'قبول' : 'رفض'} طلب المطعم`,
      });

      fetchPendingContent();
    } catch (error) {
      console.error('Error handling restaurant action:', error);
      toast({
        title: "خطأ",
        description: "فشل في معالجة الطلب",
        variant: "destructive",
      });
    }
  };

  const handleFoodAction = async (
    foodId: string, 
    action: 'approved' | 'rejected',
    notes: string = ''
  ) => {
    try {
      // Update pending food status
      const { error: updateError } = await supabase
        .rpc('update_pending_food_status', {
          food_id: foodId,
          new_status: action,
          notes: notes
        });

      if (updateError) {
        console.error('Error using RPC, trying direct update:', updateError);
        
        // Fallback to direct update
        const { error: directError } = await supabase
          .from('pending_foods')
          .update({
            status: action,
            admin_notes: notes,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', foodId);

        if (directError) throw directError;
      }

      // If approved, copy to main products table
      if (action === 'approved') {
        const food = pendingFoods.find(f => f.id === foodId);
        if (food) {
          const { error: insertError } = await supabase
            .from('products')
            .insert({
              name: food.name,
              description: food.description || '',
              price: food.price,
              category_id: null, // Will need to map categories properly
              image: food.image_url,
              restaurant_id: food.restaurant_id,
              available: true
            });

          if (insertError) {
            console.error('Error inserting approved food:', insertError);
            throw insertError;
          }
        }
      }

      toast({
        title: action === 'approved' ? "تمت الموافقة" : "تم الرفض",
        description: `تم ${action === 'approved' ? 'قبول' : 'رفض'} طلب الطعام`,
      });

      fetchPendingContent();
    } catch (error) {
      console.error('Error handling food action:', error);
      toast({
        title: "خطأ",
        description: "فشل في معالجة الطلب",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">المحتوى المعلق للمراجعة</h2>

      <Tabs defaultValue="restaurants" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="restaurants" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            المطاعم ({pendingRestaurants.length})
          </TabsTrigger>
          <TabsTrigger value="foods" className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            الأطعمة ({pendingFoods.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants" className="space-y-4">
          {pendingRestaurants.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مطاعم معلقة</h3>
                <p className="text-gray-600">جميع طلبات المطاعم تمت مراجعتها</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingRestaurants.map((restaurant) => (
                <Card key={restaurant.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        معلق
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(restaurant.created_at).toLocaleDateString('ar')}
                      </span>
                    </div>
                    <CardTitle>{restaurant.name}</CardTitle>
                    <CardDescription>{restaurant.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      {restaurant.address && (
                        <p><strong>العنوان:</strong> {restaurant.address}</p>
                      )}
                      {restaurant.phone && (
                        <p><strong>الهاتف:</strong> {restaurant.phone}</p>
                      )}
                      {restaurant.email && (
                        <p><strong>البريد:</strong> {restaurant.email}</p>
                      )}
                      {restaurant.cuisine_type && (
                        <p><strong>نوع المطبخ:</strong> {restaurant.cuisine_type}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">ملاحظات الإدارة:</label>
                      <Textarea
                        value={adminNotes[restaurant.id] || ''}
                        onChange={(e) => setAdminNotes({
                          ...adminNotes,
                          [restaurant.id]: e.target.value
                        })}
                        placeholder="أضف ملاحظات..."
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleRestaurantAction(
                          restaurant.id, 
                          'approved', 
                          adminNotes[restaurant.id] || ''
                        )}
                      >
                        <Check className="h-4 w-4 ml-1" />
                        موافقة
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleRestaurantAction(
                          restaurant.id, 
                          'rejected', 
                          adminNotes[restaurant.id] || ''
                        )}
                      >
                        <X className="h-4 w-4 ml-1" />
                        رفض
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="foods" className="space-y-4">
          {pendingFoods.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <UtensilsCrossed className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد أطعمة معلقة</h3>
                <p className="text-gray-600">جميع طلبات الأطعمة تمت مراجعتها</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingFoods.map((food) => (
                <Card key={food.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        معلق
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(food.created_at).toLocaleDateString('ar')}
                      </span>
                    </div>
                    <CardTitle>{food.name}</CardTitle>
                    <CardDescription>{food.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <p><strong>السعر:</strong> {food.price} ريال</p>
                      {food.category && (
                        <p><strong>الفئة:</strong> {food.category}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">ملاحظات الإدارة:</label>
                      <Textarea
                        value={adminNotes[food.id] || ''}
                        onChange={(e) => setAdminNotes({
                          ...adminNotes,
                          [food.id]: e.target.value
                        })}
                        placeholder="أضف ملاحظات..."
                        className="min-h-[80px]"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleFoodAction(
                          food.id, 
                          'approved', 
                          adminNotes[food.id] || ''
                        )}
                      >
                        <Check className="h-4 w-4 ml-1" />
                        موافقة
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleFoodAction(
                          food.id, 
                          'rejected', 
                          adminNotes[food.id] || ''
                        )}
                      >
                        <X className="h-4 w-4 ml-1" />
                        رفض
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPendingContent;
