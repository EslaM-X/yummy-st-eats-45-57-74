
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { RestaurantService } from '@/services/RestaurantService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Plus, Eye, Edit, Settings, TrendingUp, Clock, Star } from 'lucide-react';

const RestaurantDashboardPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      const data = await RestaurantService.getUserRestaurants(user.id);
      setRestaurants(data);
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
                    {restaurant.cover_image_url ? (
                      <img 
                        src={restaurant.cover_image_url} 
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
                        <span className="text-sm">{restaurant.rating}</span>
                      </div>
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {restaurant.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{restaurant.estimated_delivery_time}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <TrendingUp className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          {language === 'en' ? 'Min Order:' : 'أقل طلب:'} {restaurant.minimum_order} ST
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        {language === 'en' ? 'View' : 'عرض'}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        {language === 'en' ? 'Edit' : 'تعديل'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RestaurantDashboardPage;
