
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product-service';

export class ProductMutations {
  static async createProduct(productData: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: productData.name!,
          price: productData.price!,
          description: productData.description,
          category_id: productData.category_id,
          restaurant_id: productData.restaurant_id,
          available: productData.available ?? true,
          featured: productData.featured ?? false
        }])
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
}
