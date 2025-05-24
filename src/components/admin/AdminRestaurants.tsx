
import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash, Star, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { AdminService } from '@/services/AdminService';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine_type: string[];
  is_active: boolean;
  avg_rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  logo_url?: string;
  owner_id: string;
  phone?: string;
  description?: string;
  delivery_fee: number;
  min_order_amount: number;
  profiles?: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
  };
}

const AdminRestaurants: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAllRestaurants();
      setRestaurants(data);
    } catch (error: any) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: "خطأ في تحميل المطاعم",
        description: error.message || "حدث خطأ أثناء تحميل المطاعم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter restaurants based on search term and tab
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          restaurant.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (restaurant.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = selectedTab === 'all' ||
                      (selectedTab === 'active' && restaurant.is_active) ||
                      (selectedTab === 'inactive' && !restaurant.is_active);
    
    return matchesSearch && matchesTab;
  });

  const handleToggleStatus = async (restaurantId: string, currentStatus: boolean) => {
    try {
      await AdminService.toggleRestaurantStatus(restaurantId, !currentStatus);
      
      setRestaurants(prev => 
        prev.map(restaurant => 
          restaurant.id === restaurantId 
            ? { ...restaurant, is_active: !currentStatus }
            : restaurant
        )
      );

      toast({
        title: "تم تحديث الحالة",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} المطعم بنجاح`,
      });
    } catch (error: any) {
      console.error('Error updating restaurant status:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: error.message || "حدث خطأ أثناء تحديث حالة المطعم",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المطعم؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }

    try {
      await AdminService.deleteRestaurant(restaurantId);
      setRestaurants(prev => prev.filter(restaurant => restaurant.id !== restaurantId));

      toast({
        title: "تم حذف المطعم",
        description: "تم حذف المطعم بنجاح",
      });
    } catch (error: any) {
      console.error('Error deleting restaurant:', error);
      toast({
        title: "خطأ في حذف المطعم",
        description: error.message || "حدث خطأ أثناء حذف المطعم",
        variant: "destructive",
      });
    }
  };

  // Get status badge style
  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>المطاعم ({restaurants.length})</CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث عن مطعم..."
                className="pl-8 pr-4 w-full"
              />
            </div>
            <Button onClick={fetchRestaurants} variant="outline" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="all">الكل ({restaurants.length})</TabsTrigger>
              <TabsTrigger value="active">نشط ({restaurants.filter(r => r.is_active).length})</TabsTrigger>
              <TabsTrigger value="inactive">غير نشط ({restaurants.filter(r => !r.is_active).length})</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((restaurant) => (
                <Card key={restaurant.id} className="overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    {restaurant.logo_url ? (
                      <img 
                        src={restaurant.logo_url} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                        <div className="text-white text-6xl font-bold">
                          {restaurant.name.charAt(0)}
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(restaurant.is_active)}`}>
                        {restaurant.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 rounded-full px-2 py-1 flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1 rtl:mr-0 rtl:ml-1" />
                      <span className="text-xs font-medium text-white">{restaurant.avg_rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-xs text-gray-300 mr-1 rtl:mr-0 rtl:ml-1">({restaurant.rating_count || 0})</span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 truncate">{restaurant.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{restaurant.id}</p>
                        {restaurant.profiles && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                            المالك: {restaurant.profiles.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {restaurant.cuisine_type && restaurant.cuisine_type.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {restaurant.cuisine_type.slice(0, 2).map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                        {restaurant.cuisine_type.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{restaurant.cuisine_type.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {restaurant.address}
                    </p>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <p>رسوم التوصيل: {restaurant.delivery_fee} ريال</p>
                      <p>الحد الأدنى للطلب: {restaurant.min_order_amount} ريال</p>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      تاريخ الإنضمام: {new Date(restaurant.created_at).toLocaleDateString('ar-SA')}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleToggleStatus(restaurant.id, restaurant.is_active)}
                      >
                        {restaurant.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteRestaurant(restaurant.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 py-8 text-center text-gray-500 dark:text-gray-400">
                لا يوجد مطاعم مطابقة لمعايير البحث
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRestaurants;
