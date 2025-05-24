
import { supabase } from '@/integrations/supabase/client';

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  cover_image_url?: string;
  cuisine_type: string;
  rating: number;
  delivery_fee: number;
  minimum_order: number;
  estimated_delivery_time: string;
  is_active: boolean;
  opening_hours: any;
  location_id?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// Database types to match Supabase schema exactly
interface DatabaseRestaurant {
  id?: string;
  name: string; // Required field
  description?: string;
  address: string; // Required field
  phone?: string;
  logo_url?: string;
  cuisine_type?: string[];
  avg_rating?: number;
  delivery_fee?: number;
  min_order_amount?: number;
  is_active?: boolean;
  opening_hours?: any;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  rating?: number;
  rating_count?: number;
}

export class RestaurantService {
  // جلب جميع المطاعم النشطة والمعتمدة فقط
  static async getAllRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('avg_rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
  }

  static async getRestaurantById(id: string) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      return null;
    }
  }

  static async getUserRestaurants(userId: string) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user restaurants:', error);
      return [];
    }
  }

  // إنشاء مطعم جديد في جدول الانتظار
  static async createRestaurant(restaurantData: DatabaseRestaurant) {
    try {
      // إنشاء طلب مطعم في جدول الانتظار بدلاً من إنشاءه مباشرة
      const { data, error } = await supabase
        .from('pending_restaurants')
        .insert({
          name: restaurantData.name,
          description: restaurantData.description || '',
          address: restaurantData.address,
          phone: restaurantData.phone,
          email: restaurantData.email || '',
          cuisine_type: Array.isArray(restaurantData.cuisine_type) 
            ? restaurantData.cuisine_type[0] 
            : restaurantData.cuisine_type,
          image_url: restaurantData.logo_url,
          owner_id: restaurantData.owner_id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating restaurant:', error);
      return { data: null, error };
    }
  }

  static async updateRestaurant(id: string, updates: Partial<DatabaseRestaurant>) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return { data: null, error };
    }
  }

  // دالة لجلب مطاعم المستخدم مع تفاصيل إضافية
  static async getRestaurantDetails(restaurantId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          products(count)
        `)
        .eq('id', restaurantId)
        .eq('owner_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      return null;
    }
  }

  // دالة لحذف مطعم (للمالكين)
  static async deleteRestaurant(restaurantId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId)
        .eq('owner_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      return { success: false, error };
    }
  }
}
