
import { supabase } from '@/integrations/supabase/client';

export class FavoriteService {
  static async addFavorite(userId: string, productId?: string, restaurantId?: string) {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          product_id: productId,
          restaurant_id: restaurantId
        })
        .select();
      
      if (error) {
        console.error('Error adding favorite:', error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Exception adding favorite:', error);
      return { success: false, error };
    }
  }
  
  static async removeFavorite(userId: string, productId?: string, restaurantId?: string) {
    try {
      let query = supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId);
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('Error removing favorite:', error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Exception removing favorite:', error);
      return { success: false, error };
    }
  }
  
  static async getUserFavorites(userId: string) {
    try {
      const { data: restaurantFavorites, error: restaurantError } = await supabase
        .from('favorites')
        .select(`
          id,
          restaurant_id,
          restaurants (*)
        `)
        .eq('user_id', userId)
        .not('restaurant_id', 'is', null);
      
      const { data: productFavorites, error: productError } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          products (*)
        `)
        .eq('user_id', userId)
        .not('product_id', 'is', null);
      
      if (restaurantError || productError) {
        console.error('Error fetching favorites:', restaurantError || productError);
        return { 
          restaurants: [],
          products: [],
          error: restaurantError || productError
        };
      }
      
      return {
        restaurants: restaurantFavorites || [],
        products: productFavorites || [],
        error: null
      };
    } catch (error) {
      console.error('Exception fetching favorites:', error);
      return { restaurants: [], products: [], error };
    }
  }
  
  static async isFavorite(userId: string, productId?: string, restaurantId?: string) {
    try {
      let query = supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId);
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error checking favorite status:', error);
        return false;
      }
      
      return (data && data.length > 0);
    } catch (error) {
      console.error('Exception checking favorite status:', error);
      return false;
    }
  }
}
