
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/product-service';

export class CategoryService {
  static async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return (data || []).map(category => ({
        ...category,
        updated_at: category.created_at // Use created_at as fallback for updated_at
      }));
    } catch (error) {
      console.error('Exception fetching categories:', error);
      return [];
    }
  }
}
