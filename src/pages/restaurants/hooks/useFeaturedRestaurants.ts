
import { useState, useEffect } from 'react';
import { Restaurant } from '@/types';

// Mock featured restaurants data with country codes
const allFeaturedRestaurants: (Restaurant & { country: string })[] = [
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
    address: 'شارع الخليج، الكويت'
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
];

export const useFeaturedRestaurants = (globalSelectedCountry: string | undefined) => {
  const [featuredRestaurants, setFeaturedRestaurants] = useState<(Restaurant & { country: string })[]>([]);

  // Filter featured restaurants based on selected country
  useEffect(() => {
    if (globalSelectedCountry) {
      setFeaturedRestaurants(allFeaturedRestaurants.filter(r => r.country === globalSelectedCountry));
    } else {
      setFeaturedRestaurants(allFeaturedRestaurants);
    }
  }, [globalSelectedCountry]);

  return { featuredRestaurants };
};
