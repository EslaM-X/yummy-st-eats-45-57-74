
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
  static async getAllRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('avg_rating', { ascending: false });

      if (error) throw error;
      return data;
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

  static async createRestaurant(restaurantData: DatabaseRestaurant) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .insert(restaurantData)
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
}
