import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, Store, UtensilsCrossed, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminService } from '@/services/AdminService';

interface PendingRestaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  cuisine_type?: string;
  image_url?: string;
  owner_id?: string;
  status: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
  } | null;
}

interface PendingFood {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  restaurant_id?: string;
  owner_id?: string;
  status: string;
  created_at: string;
  restaurants?: {
    id: string;
    name: string;
  } | null;
  profiles?: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
  } | null;
}

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
      // Fetch pending restaurants
      const restaurantsData = await AdminService.getPendingRestaurants();
      const formattedRestaurants: PendingRestaurant[] = restaurantsData.map(restaurant => {
        // Check if profiles is valid and not an error object
        const hasValidProfiles = restaurant.profiles && 
          typeof restaurant.profiles === 'object' && 
          !('error' in restaurant.profiles) &&
          restaurant.profiles !== null &&
          'id' in restaurant.profiles;

        const validProfiles = hasValidProfiles ? restaurant.profiles as {
          id: string;
          full_name: string;
          phone: string;
          email: string;
        } : null;

        return {
          id: restaurant.id,
          name: restaurant.name,
          description: restaurant.description || undefined,
          address: restaurant.address || undefined,
          phone: restaurant.phone || undefined,
          email: restaurant.email || undefined,
          cuisine_type: restaurant.cuisine_type || undefined,
          image_url: restaurant.image_url || undefined,
          owner_id: restaurant.owner_id || undefined,
          status: restaurant.status,
          created_at: restaurant.created_at,
          profiles: validProfiles,
        };
      });
      setPendingRestaurants(formattedRestaurants);

      // Fetch pending foods
      const foodsData = await AdminService.getPendingFoods();
      const formattedFoods: PendingFood[] = foodsData.map(food => {
        // Check if profiles is valid and not an error object
        const hasValidProfiles = food.profiles && 
          typeof food.profiles === 'object' && 
          !('error' in food.profiles) &&
          food.profiles !== null &&
          'id' in food.profiles;

        const validProfiles = hasValidProfiles ? food.profiles as {
          id: string;
          full_name: string;
          phone: string;
          email: string;
        } : null;

        // Check if restaurants is valid and not an error object
        const hasValidRestaurants = food.restaurants && 
          typeof food.restaurants === 'object' && 
          !('error' in food.restaurants) &&
          food.restaurants !== null &&
          'id' in food.restaurants;

        const validRestaurants = hasValidRestaurants ? food.restaurants as {
          id: string;
          name: string;
        } : null;

        return {
          id: food.id,
          name: food.name,
          description: food.description || undefined,
          price: food.price,
          category: food.category || undefined,
          image_url: food.image_url || undefined,
          restaurant_id: food.restaurant_id || undefined,
          owner_id: food.owner_id || undefined,
          status: food.status,
          created_at: food.created_at,
          restaurants: validRestaurants,
          profiles: validProfiles,
        };
      });
      setPendingFoods(formattedFoods);

      toast({
        title: "تم تحديث البيانات",
        description: "تم جلب المحتوى المعلق بنجاح",
      });

    } catch (error: any) {
      console.error('Error fetching pending content:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحميل المحتوى المعلق",
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
      if (action === 'approved') {
        await AdminService.approveRestaurant(restaurantId, notes);
      } else {
        await AdminService.rejectRestaurant(restaurantId, notes);
      }

      toast({
        title: action === 'approved' ? "تمت الموافقة" : "تم الرفض",
        description: `تم ${action === 'approved' ? 'قبول' : 'رفض'} طلب المطعم`,
      });

      fetchPendingContent();
    } catch (error: any) {
      console.error('Error handling restaurant action:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في معالجة الطلب",
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
      if (action === 'approved') {
        await AdminService.approveFood(foodId, notes);
      } else {
        await AdminService.rejectFood(foodId, notes);
      }

      toast({
        title: action === 'approved' ? "تمت الموافقة" : "تم الرفض",
        description: `تم ${action === 'approved' ? 'قبول' : 'رفض'} طلب الطعام`,
      });

      fetchPendingContent();
    } catch (error: any) {
      console.error('Error handling food action:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في معالجة الطلب",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="mr-3 text-lg">جاري تحميل المحتوى المعلق...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">المحتوى المعلق للمراجعة</h2>
        <Button onClick={fetchPendingContent} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
          تحديث
        </Button>
      </div>

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
              {pendingRestaurants.map((restaurant) => {
                const profiles = restaurant.profiles;
                
                return (
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
                        {profiles && (
                          <p><strong>المالك:</strong> {profiles.full_name}</p>
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
                );
              })}
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
              {pendingFoods.map((food) => {
                const profiles = food.profiles;
                const restaurants = food.restaurants;
                
                return (
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
                        {restaurants && (
                          <p><strong>المطعم:</strong> {restaurants.name}</p>
                        )}
                        {profiles && (
                          <p><strong>المالك:</strong> {profiles.full_name}</p>
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
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPendingContent;
