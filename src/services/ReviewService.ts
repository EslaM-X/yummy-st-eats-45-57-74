
// Mock Review Service لتجنب أخطاء قاعدة البيانات
interface Review {
  id: string;
  user_id: string;
  restaurant_id?: string;
  product_id?: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name?: string;
}

export class ReviewService {
  private static mockReviews: Review[] = [
    {
      id: '1',
      user_id: 'user1',
      restaurant_id: 'rest1',
      rating: 5,
      comment: 'مطعم ممتاز والطعام لذيذ جداً',
      created_at: new Date().toISOString(),
      user_name: 'أحمد محمد'
    },
    {
      id: '2',
      user_id: 'user2',
      product_id: 'prod1',
      rating: 4,
      comment: 'طعم رائع وتوصيل سريع',
      created_at: new Date().toISOString(),
      user_name: 'سارة أحمد'
    }
  ];

  static async getRestaurantReviews(restaurantId: string): Promise<Review[]> {
    try {
      return this.mockReviews.filter(review => review.restaurant_id === restaurantId);
    } catch (error) {
      console.error('Error fetching restaurant reviews:', error);
      return [];
    }
  }

  static async getProductReviews(productId: string): Promise<Review[]> {
    try {
      return this.mockReviews.filter(review => review.product_id === productId);
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return [];
    }
  }

  static async addReview(review: Omit<Review, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const newReview: Review = {
        ...review,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };

      this.mockReviews.push(newReview);
      return true;
    } catch (error) {
      console.error('Error adding review:', error);
      return false;
    }
  }

  static async updateReview(reviewId: string, updates: Partial<Review>): Promise<boolean> {
    try {
      const index = this.mockReviews.findIndex(review => review.id === reviewId);
      if (index !== -1) {
        this.mockReviews[index] = { ...this.mockReviews[index], ...updates };
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating review:', error);
      return false;
    }
  }

  static async deleteReview(reviewId: string): Promise<boolean> {
    try {
      const index = this.mockReviews.findIndex(review => review.id === reviewId);
      if (index !== -1) {
        this.mockReviews.splice(index, 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting review:', error);
      return false;
    }
  }

  static async getAverageRating(itemId: string, type: 'restaurant' | 'product'): Promise<number> {
    try {
      const reviews = this.mockReviews.filter(review => 
        type === 'restaurant' ? review.restaurant_id === itemId : review.product_id === itemId
      );

      if (reviews.length === 0) return 0;

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      return Number((totalRating / reviews.length).toFixed(1));
    } catch (error) {
      console.error('Error calculating average rating:', error);
      return 0;
    }
  }
}
