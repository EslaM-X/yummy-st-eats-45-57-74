
import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  user_id: string;
  product_id?: string;
  restaurant_id?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const ReviewService = {
  // Mock implementation since reviews table doesn't exist
  async getReviews(itemId: string, type: 'product' | 'restaurant'): Promise<Review[]> {
    console.log('Reviews feature not implemented yet');
    return [];
  },

  async addReview(userId: string, itemId: string, type: 'product' | 'restaurant', rating: number, comment: string): Promise<boolean> {
    console.log('Add review not implemented yet');
    return false;
  },

  async getUserReviews(userId: string): Promise<Review[]> {
    console.log('Get user reviews not implemented yet');
    return [];
  }
};
