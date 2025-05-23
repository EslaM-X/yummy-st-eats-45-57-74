
import { supabase } from "@/integrations/supabase/client";

export class RestaurantService {
  // Get all restaurants
  static async getAllRestaurants(countryCode?: string) {
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      // Filter by country if provided
      if (countryCode) {
        // This is a simplified approach - actual implementation depends on your data structure
        query = query.ilike('address', `%${countryCode}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching restaurants:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception fetching restaurants:', error);
      return [];
    }
  }
  
  // Get featured restaurants
  static async getFeaturedRestaurants(countryCode?: string) {
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('rating_count', { ascending: false })
        .limit(6);
      
      // Filter by country if provided
      if (countryCode) {
        // This is a simplified approach
        query = query.ilike('address', `%${countryCode}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching featured restaurants:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception fetching featured restaurants:', error);
      return [];
    }
  }
  
  // Get restaurant details by ID
  static async getRestaurantById(restaurantId: string) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();
      
      if (error) {
        console.error('Error fetching restaurant details:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception fetching restaurant details:', error);
      return null;
    }
  }
  
  // Get products by restaurant ID
  static async getRestaurantProducts(restaurantId: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching restaurant products:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception fetching restaurant products:', error);
      return [];
    }
  }
}
