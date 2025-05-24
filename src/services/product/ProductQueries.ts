
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product-service';

export class ProductQueries {
  static async getAllProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
            address,
            logo_url
          ),
          categories:category_id (
            id,
            name
          )
        `)
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching products:', error);
      return [];
    }
  }

  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
            address,
            logo_url
          ),
          categories:category_id (
            id,
            name
          )
        `)
        .eq('id', productId)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching product:', error);
      return null;
    }
  }

  static async getFilteredProducts(filters: {
    category?: string;
    country?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
  } = {}): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
            address,
            logo_url
          ),
          categories:category_id (
            id,
            name
          )
        `)
        .eq('available', true);

      // Apply filters
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.featured) {
        query = query.eq('featured', true);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching filtered products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching filtered products:', error);
      return [];
    }
  }
}
