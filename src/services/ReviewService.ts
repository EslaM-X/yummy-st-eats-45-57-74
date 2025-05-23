
import { supabase } from '@/integrations/supabase/client';

/**
 * خدمة التعامل مع التقييمات في التطبيق
 */
export const ReviewService = {
  /**
   * جلب تقييمات المنتج
   */
  async getProductReviews(product_id: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles(id, full_name, avatar_url)
        `)
        .eq('product_id', product_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error(`Error fetching reviews for product ${product_id}:`, error);
      return { data: [], error };
    }
  },

  /**
   * جلب تقييمات المطعم
   */
  async getRestaurantReviews(restaurant_id: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles(id, full_name, avatar_url)
        `)
        .eq('restaurant_id', restaurant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error(`Error fetching reviews for restaurant ${restaurant_id}:`, error);
      return { data: [], error };
    }
  },

  /**
   * إضافة تقييم لمنتج
   */
  async addProductReview(product_id: string, rating: number, comment?: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id,
          rating,
          comment
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding product review:', error);
      return { data: null, error };
    }
  },

  /**
   * إضافة تقييم لمطعم
   */
  async addRestaurantReview(restaurant_id: string, rating: number, comment?: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          restaurant_id,
          rating,
          comment
        })
        .select()
        .single();

      if (error) throw error;

      // تحديث متوسط تقييم المطعم
      await this.updateRestaurantAverageRating(restaurant_id);

      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding restaurant review:', error);
      return { data: null, error };
    }
  },

  /**
   * حذف تقييم
   */
  async deleteReview(review_id: string) {
    try {
      // جلب معلومات التقييم قبل الحذف لمعرفة ما إذا كان للمنتج أو للمطعم
      const { data: review_data } = await supabase
        .from('reviews')
        .select('restaurant_id')
        .eq('id', review_id)
        .maybeSingle();

      const restaurant_id = review_data?.restaurant_id;
      
      // حذف التقييم
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', review_id);

      if (error) throw error;

      // إذا كان التقييم لمطعم، تحديث متوسط تقييم المطعم
      if (restaurant_id) {
        await this.updateRestaurantAverageRating(restaurant_id);
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error(`Error deleting review with ID ${review_id}:`, error);
      return { success: false, error };
    }
  },

  /**
   * تحديث متوسط تقييم المطعم
   */
  async updateRestaurantAverageRating(restaurant_id: string) {
    try {
      // حساب متوسط التقييم
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('restaurant_id', restaurant_id);

      if (error) throw error;

      if (!data || data.length === 0) {
        return;
      }

      const avg_rating = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
      const rating_count = data.length;

      // تحديث المطعم
      const { error: update_error } = await supabase
        .from('restaurants')
        .update({
          avg_rating: parseFloat(avg_rating.toFixed(1)),
          rating_count
        })
        .eq('id', restaurant_id);

      if (update_error) throw update_error;
    } catch (error) {
      console.error(`Error updating average rating for restaurant ${restaurant_id}:`, error);
    }
  }
};
