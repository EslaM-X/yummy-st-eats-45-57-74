
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

  // جلب المطاعم الحقيقية المعتمدة من قاعدة البيانات
  useEffect(() => {
    const fetchRealRestaurants = async () => {
      setLoading(true);
      try {
        const restaurantsData = await RestaurantService.getAllRestaurants();
        
        // تحويل البيانات إلى تنسيق Restaurant مع التأكد من وجود الخصائص المطلوبة
        const formattedRestaurants: (Restaurant & { country?: string })[] = restaurantsData.map(restaurant => ({
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address, // مطلوب في نوع Restaurant
          cuisine: Array.isArray(restaurant.cuisine_type) 
            ? restaurant.cuisine_type.join(', ')
            : restaurant.cuisine_type || 'مأكولات متنوعة',
          rating: restaurant.avg_rating || 0,
          deliveryTime: '30-45 دقيقة',
          imageUrl: restaurant.logo_url || undefined,
          description: restaurant.description || '',
          isNew: false,
          discount: undefined,
          country: 'SA' // افتراضي السعودية
        }));

        setMockRestaurants(formattedRestaurants);
        
        // استخراج أنواع المطاعم
        const cuisines = Array.from(new Set(
          formattedRestaurants.map(r => r.cuisine).filter(Boolean)
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
        restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // تطبيق فلتر نوع المطبخ
    if (cuisineFilter) {
      filtered = filtered.filter(restaurant =>
        restaurant.cuisine.includes(cuisineFilter)
      );
    }

    // تطبيق فلتر التقييم
    if (minRating > 0) {
      filtered = filtered.filter(restaurant => restaurant.rating >= minRating);
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
      case 'newest':
        // ترتيب حسب الأحدث (افتراضي)
        break;
      default:
        // الترتيب الموصى به
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    setFilteredRestaurants(filtered);
  }, [mockRestaurants, searchTerm, cuisineFilter, minRating, showNewOnly, showDiscountOnly, sortBy, countryFilter, isRTL]);

  return {
    mockRestaurants,
    filteredRestaurants,
    setFilteredRestaurants,
    allCuisines,
    loading
  };
};
