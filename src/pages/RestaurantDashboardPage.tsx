
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { RestaurantService } from '@/services/RestaurantService';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Plus, Eye, Edit, Settings, TrendingUp, Clock, Star, ShoppingBag, Trash2 } from 'lucide-react';
import RestaurantEditModal from '@/components/restaurant/RestaurantEditModal';
import RestaurantSettingsModal from '@/components/restaurant/RestaurantSettingsModal';

const RestaurantDashboardPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [settingsRestaurant, setSettingsRestaurant] = useState<any>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    totalRevenue: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    fetchUserRestaurants();
  }, [isAuthenticated, isLoading, navigate, user]);

  const fetchUserRestaurants = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // جلب مطاعم المستخدم
      const restaurantData = await RestaurantService.getUserRestaurants(user.id);
      setRestaurants(restaurantData);

      // جلب الطلبات لمطاعم المستخدم
      if (restaurantData.length > 0) {
        const restaurantIds = restaurantData.map(r => r.id);
        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            *,
            profiles!orders_user_id_fkey(full_name, phone)
          `)
          .in('restaurant_id', restaurantIds)
          .order('created_at', { ascending: false });

        setOrders(ordersData || []);

        // حساب الإحصائيات
        const totalOrders = ordersData?.length || 0;
        const pendingOrders = ordersData?.filter(order => ['new', 'قيد التحضير'].includes(order.status)).length || 0;
        const totalRevenue = ordersData?.filter(order => order.payment_status === 'completed')
          .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
        
        const today = new Date().toDateString();
        const todayRevenue = ordersData?.filter(order => 
          order.payment_status === 'completed' && 
          new Date(order.created_at).toDateString() === today
        ).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        setStats({
          totalOrders,
          pendingOrders,
          todayRevenue,
          totalRevenue
        });
      }
    } catch (error: any) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: language === 'en' ? "Error" : "خطأ",
        description: language === 'en' 
          ? "Failed to load your restaurants" 
          : "فشل في تحميل مطاعمك",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRestaurantStatus = async (restaurantId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: isActive })
        .eq('id', restaurantId)
        .eq('owner_id', user?.id);

      if (error) throw error;

      setRestaurants(prev => prev.map(restaurant => 
        restaurant.id === restaurantId 
          ? { ...restaurant, is_active: isActive }
          : restaurant
      ));

      toast({
        title: language === 'en' ? "Status Updated" : "تم تحديث الحالة",
        description: language === 'en' 
          ? `Restaurant ${isActive ? 'activated' : 'deactivated'} successfully`
          : `تم ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} المطعم بنجاح`,
      });
    } catch (error: any) {
      console.error('Error updating restaurant status:', error);
      toast({
        title: language === 'en' ? "Error" : "خطأ",
        description: error.message || (language === 'en' 
          ? "Failed to update restaurant status" 
          : "فشل في تحديث حالة المطعم"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المطعم؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      const result = await RestaurantService.deleteRestaurant(restaurantId, user?.id || '');
      
      if (result.success) {
        setRestaurants(prev => prev.filter(restaurant => restaurant.id !== restaurantId));
        toast({
          title: "تم حذف المطعم",
          description: "تم حذف المطعم بنجاح",
        });
      } else {
        throw new Error('Failed to delete restaurant');
      }
    } catch (error: any) {
      console.error('Error deleting restaurant:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المطعم",
        variant: "destructive",
      });
    }
  };

  const handleEditRestaurant = (restaurant: any) => {
    setEditingRestaurant(restaurant);
  };

  const handleRestaurantSettings = (restaurant: any) => {
    setSettingsRestaurant(restaurant);
  };

  const pageTitle = language === 'en' ? 'My Restaurants Dashboard' : 'لوحة تحكم مطاعمي';
  const addRestaurantText = language === 'en' ? 'Add New Restaurant' : 'إضافة مطعم جديد';
  const noRestaurantsTitle = language === 'en' ? 'No Restaurants Yet' : 'لا توجد مطاعم بعد';
  const noRestaurantsDesc = language === 'en' ? 'Start by registering your first restaurant' : 'ابدأ بتسجيل مطعمك الأول';

  if (isLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">
              {pageTitle}
            </h1>
            <Button 
              onClick={() => navigate('/register-restaurant')}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              {addRestaurantText}
            </Button>
          </div>

          {/* إحصائيات سريعة */}
          {restaurants.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <ShoppingBag className="h-8 w-8 text-blue-500" />
                    <div className="ml-4 rtl:ml-0 rtl:mr-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الطلبات</p>
                      <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-amber-500" />
                    <div className="ml-4 rtl:ml-0 rtl:mr-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">طلبات معلقة</p>
                      <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    <div className="ml-4 rtl:ml-0 rtl:mr-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">مبيعات اليوم</p>
                      <p className="text-2xl font-bold">{stats.todayRevenue.toFixed(2)} ST</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                    <div className="ml-4 rtl:ml-0 rtl:mr-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المبيعات</p>
                      <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} ST</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {restaurants.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Store className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{noRestaurantsTitle}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{noRestaurantsDesc}</p>
                <Button 
                  onClick={() => navigate('/register-restaurant')}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {addRestaurantText}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {restaurant.logo_url ? (
                      <img 
                        src={restaurant.logo_url} 
                        alt={restaurant.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                        <Store className="h-16 w-16 text-white" />
                      </div>
                    )}
                    <Badge 
                      variant={restaurant.is_active ? "default" : "secondary"}
                      className="absolute top-3 right-3"
                    >
                      {restaurant.is_active 
                        ? (language === 'en' ? 'Active' : 'نشط')
                        : (language === 'en' ? 'Inactive' : 'غير نشط')
                      }
                    </Badge>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{restaurant.name}</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm">{restaurant.avg_rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {restaurant.description || restaurant.address}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>الطلبات: {orders.filter(o => o.restaurant_id === restaurant.id).length}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          المبيعات: {orders.filter(o => o.restaurant_id === restaurant.id && o.payment_status === 'completed')
                            .reduce((sum, order) => sum + (order.total_amount || 0), 0).toFixed(2)} ST
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <Button 
                        variant={restaurant.is_active ? "destructive" : "default"} 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleUpdateRestaurantStatus(restaurant.id, !restaurant.is_active)}
                      >
                        {restaurant.is_active 
                          ? (language === 'en' ? 'Deactivate' : 'إلغاء التفعيل')
                          : (language === 'en' ? 'Activate' : 'تفعيل')
                        }
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditRestaurant(restaurant)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {language === 'en' ? 'Edit' : 'تعديل'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRestaurantSettings(restaurant)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        الإعدادات
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Modal for editing restaurant */}
      {editingRestaurant && (
        <RestaurantEditModal
          restaurant={editingRestaurant}
          onClose={() => setEditingRestaurant(null)}
          onUpdate={fetchUserRestaurants}
        />
      )}
      
      {/* Modal for restaurant settings */}
      {settingsRestaurant && (
        <RestaurantSettingsModal
          restaurant={settingsRestaurant}
          onClose={() => setSettingsRestaurant(null)}
          onUpdate={fetchUserRestaurants}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default RestaurantDashboardPage;
