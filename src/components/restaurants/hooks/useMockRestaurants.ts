import { useState, useEffect } from 'react';
import { Restaurant } from '@/types';

// Update mock restaurants to include address field
const allRestaurants: (Restaurant & { country: string })[] = [
  {
    id: '1',
    name: 'مطعم الأصيل',
    cuisine: 'مأكولات شرقية, مشويات',
    rating: 4.8,
    deliveryTime: '20-30 دقيقة',
    imageUrl: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=800',
    isNew: true,
    description: 'تخصص في المأكولات الشرقية التقليدية والمشويات الطازجة',
    country: 'sa',
    address: 'شارع الملك فهد، الرياض'
  },
  {
    id: '2',
    name: 'بيتزا بلس',
    cuisine: 'بيتزا, إيطالي',
    rating: 4.2,
    deliveryTime: '30-40 دقيقة',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800',
    discount: '15%',
    description: 'بيتزا إيطالية أصلية بعجينة طازجة وخبز في الفرن الحجري',
    country: 'ae',
    address: 'شارع الشيخ زايد، دبي'
  },
  {
    id: '3',
    name: 'سوشي توكيو',
    cuisine: 'ياباني, سوشي',
    rating: 4.7,
    deliveryTime: '35-45 دقيقة',
    imageUrl: 'https://images.unsplash.com/photo-1589840700256-699f5e431e2e?auto=format&fit=crop&w=800',
    isNew: true,
    description: 'أطباق سوشي فاخرة محضرة من قبل طهاة يابانيين محترفين',
    country: 'kw',
    address: 'شارع السالم، الكويت'
  },
  {
    id: '4',
    name: 'برجر فاكتوري',
    cuisine: 'أمريكي, برجر',
    rating: 4.5,
    deliveryTime: '20-30 دقيقة',
    imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800',
    discount: '10%',
    description: 'برجر لحم بقري فاخر طازج 100% مع صلصات خاصة وخبز محضر يومياً',
    country: 'qa',
    address: 'الخليج الغربي، الدوحة'
  },
  {
    id: '5',
    name: 'مطعم الطازج',
    cuisine: 'بحري, مأكولات بحرية',
    rating: 4.6,
    deliveryTime: '30-50 دقيقة',
    imageUrl: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800',
    isNew: true,
    description: 'أطباق بحرية طازجة يومياً مع توابل خاصة',
    country: 'eg',
    address: 'شارع النيل، القاهرة'
  }
];

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
  const [mockRestaurants, setMockRestaurants] = useState<(Restaurant & { country: string })[]>(allRestaurants);
  const [filteredRestaurants, setFilteredRestaurants] = useState<(Restaurant & { country: string })[]>(allRestaurants);
  const [allCuisines, setAllCuisines] = useState<string[]>([]);

  useEffect(() => {
    // Extract all unique cuisines
    const cuisines = [...new Set(allRestaurants.map(restaurant => restaurant.cuisine?.split(', ') || []).flat())] as string[];
    setAllCuisines(cuisines);
  }, []);

  useEffect(() => {
    let results = [...mockRestaurants];

    // Apply country filter first
    if (countryFilter) {
      results = results.filter(restaurant => restaurant.country === countryFilter);
    }

    // Apply cuisine filter
    if (cuisineFilter) {
      results = results.filter(restaurant => restaurant.cuisine?.includes(cuisineFilter));
    }

    // Apply rating filter
    if (minRating > 0) {
      results = results.filter(restaurant => restaurant.rating !== undefined && restaurant.rating >= minRating);
    }

    // Apply "New Only" filter
    if (showNewOnly) {
      results = results.filter(restaurant => restaurant.isNew === true);
    }

    // Apply "Discount Only" filter
    if (showDiscountOnly) {
      results = results.filter(restaurant => restaurant.discount !== undefined);
    }

    // Apply search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      results = results.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTermLower) ||
        restaurant.description?.toLowerCase().includes(searchTermLower) ||
        restaurant.cuisine?.toLowerCase().includes(searchTermLower)
      );
    }

    // Apply sorting
    if (sortBy === 'rating') {
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'deliveryTime') {
      results.sort((a, b) => {
        const timeA = parseInt(a.deliveryTime?.split('-')[0] || '0');
        const timeB = parseInt(b.deliveryTime?.split('-')[0] || '0');
        return timeA - timeB;
      });
    } else if (sortBy === 'name') {
      results.sort((a, b) => {
        const nameA = isRTL ? a.name : a.name;
        const nameB = isRTL ? b.name : b.name;
        return nameA.localeCompare(nameB);
      });
    }

    setFilteredRestaurants(results);
  }, [searchTerm, cuisineFilter, minRating, showNewOnly, showDiscountOnly, sortBy, countryFilter, isRTL, mockRestaurants]);

  return { mockRestaurants, filteredRestaurants, setFilteredRestaurants, allCuisines };
};
