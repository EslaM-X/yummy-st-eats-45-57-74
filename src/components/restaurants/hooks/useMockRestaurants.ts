
import { useState, useEffect } from 'react';
import { Restaurant } from '@/types';
import { RestaurantService } from '@/services/RestaurantService';

export const useMockRestaurants = (
  searchTerm: string,
  cuisineFilter: string,
  minRating: number,
  showNewOnly: boolean,
  showDiscountOnly: boolean,
  sortBy: string,
  countryFilter: string | undefined,
  isRTL: boolean
) => {
  const [mockRestaurants, setMockRestaurants] = useState<(Restaurant & { country?: string })[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<(Restaurant & { country?: string })[]>([]);
  const [allCuisines, setAllCuisines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب المطاعم الحقيقية من قاعدة البيانات
  useEffect(() => {
    const fetchRealRestaurants = async () => {
      setLoading(true);
      try {
        const restaurantsData = await RestaurantService.getAllRestaurants();
        
        // تحويل البيانات إلى تنسيق Restaurant مع التأكد من وجود الخصائص المطلوبة
        const formattedRestaurants: (Restaurant & { country?: string })[] = restaurantsData.map(restaurant => ({
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          cuisine: Array.isArray(restaurant.cuisine_type) 
            ? restaurant.cuisine_type.join(', ')
            : restaurant.cuisine_type || 'مأكولات متنوعة',
          rating: restaurant.avg_rating || 0,
          deliveryTime: '30-45 دقيقة', // يمكن حسابه بناءً على الموقع
          imageUrl: restaurant.logo_url || undefined,
          description: restaurant.description || '',
          isNew: this.isNewRestaurant(restaurant.created_at),
          discount: this.calculateDiscount(restaurant.delivery_fee),
          country: 'SA', // افتراضي السعودية
          // خصائص إضافية من قاعدة البيانات
          deliveryFee: restaurant.delivery_fee || 0,
          minimumOrder: restaurant.min_order_amount || 0,
          phone: restaurant.phone,
          isActive: restaurant.is_active,
          avgRating: restaurant.avg_rating || 0,
          ratingCount: restaurant.rating_count || 0
        }));

        setMockRestaurants(formattedRestaurants);
        
        // استخراج أنواع المطاعم الفريدة
        const cuisines = Array.from(new Set(
          formattedRestaurants
            .map(r => r.cuisine)
            .filter(Boolean)
            .flatMap(cuisine => cuisine.split(', '))
        ));
        setAllCuisines(cuisines);
        
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setMockRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRealRestaurants();
  }, []);

  // تطبيق الفلاتر والترتيب
  useEffect(() => {
    let filtered = [...mockRestaurants];

    // تطبيق فلتر البحث
    if (searchTerm) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // تطبيق فلتر نوع المطبخ
    if (cuisineFilter) {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisine.toLowerCase().includes(cuisineFilter.toLowerCase())
      );
    }

    // تطبيق فلتر التقييم
    if (minRating > 0) {
      filtered = filtered.filter(restaurant => restaurant.rating >= minRating);
    }

    // تطبيق فلتر المطاعم الجديدة
    if (showNewOnly) {
      filtered = filtered.filter(restaurant => restaurant.isNew);
    }

    // تطبيق فلتر المطاعم التي لديها خصومات
    if (showDiscountOnly) {
      filtered = filtered.filter(restaurant => restaurant.discount && restaurant.discount > 0);
    }

    // تطبيق فلتر الدولة
    if (countryFilter) {
      filtered = filtered.filter(restaurant => restaurant.country === countryFilter);
    }

    // تطبيق الترتيب
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        filtered.sort((a, b) => {
          if (isRTL) {
            return a.name.localeCompare(b.name, 'ar');
          }
          return a.name.localeCompare(b.name);
        });
        break;
      case 'delivery_fee':
        filtered.sort((a, b) => (a.deliveryFee || 0) - (b.deliveryFee || 0));
        break;
      case 'newest':
        // ترتيب حسب الأحدث (المطاعم الجديدة أولاً)
        filtered.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return b.rating - a.rating; // ثم حسب التقييم
        });
        break;
      case 'discount':
        filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      default:
        // الترتيب الموصى به (حسب التقييم والشعبية)
        filtered.sort((a, b) => {
          // المطاعم الجديدة والمميزة أولاً
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          // ثم حسب التقييم
          return b.rating - a.rating;
        });
        break;
    }

    setFilteredRestaurants(filtered);
  }, [mockRestaurants, searchTerm, cuisineFilter, minRating, showNewOnly, showDiscountOnly, sortBy, countryFilter, isRTL]);

  // دالة للتحقق من كون المطعم جديد (أقل من 30 يوم)
  const isNewRestaurant = (createdAt: string): boolean => {
    const restaurantDate = new Date(createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return restaurantDate > thirtyDaysAgo;
  };

  // دالة لحساب الخصم بناءً على رسوم التوصيل
  const calculateDiscount = (deliveryFee: number): number | undefined => {
    // إذا كانت رسوم التوصيل 0 أو أقل من 5، اعتبر ذلك خصم
    if (deliveryFee === 0) return 100; // توصيل مجاني
    if (deliveryFee < 5) return Math.round((5 - deliveryFee) / 5 * 100);
    return undefined;
  };

  return {
    mockRestaurants,
    filteredRestaurants,
    setFilteredRestaurants,
    allCuisines,
    loading
  };
};
