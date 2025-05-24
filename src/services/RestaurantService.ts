
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

export class RestaurantService {
  static async getAllRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

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

  static async createRestaurant(restaurantData: Partial<Restaurant>) {
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

  static async updateRestaurant(id: string, updates: Partial<Restaurant>) {
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
