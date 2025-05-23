
import { supabase } from '@/integrations/supabase/client';

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  logo_url?: string;
  cuisine_type?: string[];
  delivery_fee?: number;
  min_order_amount?: number;
  rating?: number;
  rating_count?: number;
  is_active?: boolean;
  opening_hours?: any;
  created_at?: string;
  updated_at?: string;
}

export class RestaurantService {
  // Mock data for restaurants
  private static mockRestaurants: Restaurant[] = [
    {
      id: '1',
      name: 'مطعم البرج الذهبي',
      description: 'أفضل المأكولات الشرقية التقليدية',
      address: 'شارع الملك فهد، الرياض',
      phone: '+966501234567',
      logo_url: '/lovable-uploads/restaurant1.jpg',
      cuisine_type: ['شرقي', 'تقليدي'],
      delivery_fee: 5,
      min_order_amount: 30,
      rating: 4.5,
      rating_count: 150,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'مطعم البحر الأزرق',
      description: 'أطباق السمك والمأكولات البحرية الطازجة',
      address: 'كورنيش جدة، جدة',
      phone: '+966507654321',
      logo_url: '/lovable-uploads/restaurant2.jpg',
      cuisine_type: ['بحري', 'أسماك'],
      delivery_fee: 8,
      min_order_amount: 40,
      rating: 4.2,
      rating_count: 89,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  static async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      // محاولة جلب البيانات من قاعدة البيانات أولاً
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.log('Using mock data for restaurants:', error.message);
        return this.mockRestaurants;
      }

      return data || this.mockRestaurants;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return this.mockRestaurants;
    }
  }

  static async getRestaurantById(id: string): Promise<Restaurant | null> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.log('Using mock data for restaurant:', error.message);
        return this.mockRestaurants.find(r => r.id === id) || null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      return this.mockRestaurants.find(r => r.id === id) || null;
    }
  }

  static async getFeaturedRestaurants(): Promise<Restaurant[]> {
    try {
      const allRestaurants = await this.getAllRestaurants();
      return allRestaurants.slice(0, 6); // إرجاع أول 6 مطاعم كمميزة
    } catch (error) {
      console.error('Error fetching featured restaurants:', error);
      return this.mockRestaurants.slice(0, 6);
    }
  }

  static async searchRestaurants(query: string): Promise<Restaurant[]> {
    try {
      const allRestaurants = await this.getAllRestaurants();
      return allRestaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
        restaurant.description?.toLowerCase().includes(query.toLowerCase()) ||
        restaurant.cuisine_type?.some(cuisine =>
          cuisine.toLowerCase().includes(query.toLowerCase())
        )
      );
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return [];
    }
  }

  static async createRestaurant(restaurant: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('restaurants')
        .insert([restaurant]);

      if (error) {
        console.error('Error creating restaurant:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      return false;
    }
  }

  static async updateRestaurant(id: string, updates: Partial<Restaurant>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating restaurant:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return false;
    }
  }

  static async deleteRestaurant(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting restaurant:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      return false;
    }
  }
}
