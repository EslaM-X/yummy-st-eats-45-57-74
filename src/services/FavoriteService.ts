
// Mock Favorite Service لتجنب أخطاء قاعدة البيانات
interface Favorite {
  id: string;
  user_id: string;
  restaurant_id?: string;
  product_id?: string;
  created_at: string;
}

export class FavoriteService {
  private static mockFavorites: Favorite[] = [];

  static async getUserFavorites(userId: string): Promise<Favorite[]> {
    // إرجاع المفضلات الوهمية للمستخدم
    return this.mockFavorites.filter(fav => fav.user_id === userId);
  }

  static async addToFavorites(userId: string, itemId: string, type: 'restaurant' | 'product'): Promise<boolean> {
    try {
      const favorite: Favorite = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: userId,
        [type === 'restaurant' ? 'restaurant_id' : 'product_id']: itemId,
        created_at: new Date().toISOString()
      };

      this.mockFavorites.push(favorite);
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }

  static async removeFromFavorites(userId: string, itemId: string, type: 'restaurant' | 'product'): Promise<boolean> {
    try {
      const index = this.mockFavorites.findIndex(fav => 
        fav.user_id === userId && 
        (type === 'restaurant' ? fav.restaurant_id === itemId : fav.product_id === itemId)
      );

      if (index !== -1) {
        this.mockFavorites.splice(index, 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }

  static async isFavorite(userId: string, itemId: string, type: 'restaurant' | 'product'): Promise<boolean> {
    try {
      return this.mockFavorites.some(fav => 
        fav.user_id === userId && 
        (type === 'restaurant' ? fav.restaurant_id === itemId : fav.product_id === itemId)
      );
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }

  static async getFavoriteRestaurants(userId: string): Promise<string[]> {
    try {
      return this.mockFavorites
        .filter(fav => fav.user_id === userId && fav.restaurant_id)
        .map(fav => fav.restaurant_id!);
    } catch (error) {
      console.error('Error getting favorite restaurants:', error);
      return [];
    }
  }

  static async getFavoriteProducts(userId: string): Promise<string[]> {
    try {
      return this.mockFavorites
        .filter(fav => fav.user_id === userId && fav.product_id)
        .map(fav => fav.product_id!);
    } catch (error) {
      console.error('Error getting favorite products:', error);
      return [];
    }
  }
}
