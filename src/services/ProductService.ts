
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  image?: string;
  restaurant_id?: string;
  category_id?: string;
  available: boolean;
  featured: boolean;
  preparation_time?: number;
  ingredients?: string[];
  nutritional_info?: any;
  created_at: string;
  updated_at: string;
  restaurants?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  categories?: {
    id: string;
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export class ProductService {
  // جلب جميع المنتجات المتاحة
  static async getAllProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
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

  // جلب المنتجات المفلترة
  static async getFilteredProducts(filters: {
    search?: string;
    category?: string;
    restaurant?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
  }): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
            logo_url
          ),
          categories:category_id (
            id,
            name
          )
        `)
        .eq('available', true);

      // تطبيق الفلاتر
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.restaurant) {
        query = query.eq('restaurant_id', filters.restaurant);
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

      const { data, error } = await query.order('created_at', { ascending: false });

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

  // جلب الفئات
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

      return data || [];
    } catch (error) {
      console.error('Exception fetching categories:', error);
      return [];
    }
  }

  // جلب المنتجات المميزة
  static async getFeaturedProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
            logo_url
          ),
          categories:category_id (
            id,
            name
          )
        `)
        .eq('available', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching featured products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching featured products:', error);
      return [];
    }
  }

  // جلب منتجات مطعم محدد
  static async getRestaurantProducts(restaurantId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('available', true)
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

  // البحث في المنتجات
  static async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
            logo_url
          ),
          categories:category_id (
            id,
            name
          )
        `)
        .eq('available', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('name');

      if (error) {
        console.error('Error searching products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception searching products:', error);
      return [];
    }
  }
}
