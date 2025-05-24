import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  logo_url?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  available: boolean;
  restaurant_id?: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
  restaurants?: Restaurant;
  categories?: Category;
  featured?: boolean;
}

export class ProductService {
  // جلب جميع المنتجات
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

  // جلب منتج محدد
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

  // إنشاء منتج جديد
  static async createProduct(productData: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception creating product:', error);
      return null;
    }
  }

  // تحديث منتج
  static async updateProduct(productId: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception updating product:', error);
      return null;
    }
  }

  // حذف منتج
  static async deleteProduct(productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception deleting product:', error);
      return false;
    }
  }

  // جلب جميع الفئات
  static async getCategories(): Promise<any[]> {
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

  // جلب المنتجات مع الفلاتر
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
