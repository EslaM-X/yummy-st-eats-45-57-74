
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  image?: string;
  restaurant_id: string;
  category_id?: string;
  available: boolean;
  featured: boolean;
  ingredients?: string[];
  nutritional_info?: any;
  preparation_time?: number;
  created_at: string;
  updated_at: string;
  restaurant?: {
    id: string;
    name: string;
    logo_url?: string;
  };
  categories?: {
    id: string;
    name: string;
  };
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  image?: string;
  restaurant_id: string;
  category_id?: string;
  ingredients?: string[];
  preparation_time?: number;
}

export class ProductService {
  // جلب جميع المنتجات المتاحة
  static async getAllProducts(filters: {
    restaurant_id?: string;
    category_id?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
  } = {}) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          restaurant:restaurant_id (
            id,
            name,
            logo_url,
            avg_rating,
            delivery_fee
          ),
          categories:category_id (
            id,
            name
          )
        `)
        .eq('available', true);

      // تطبيق الفلاتر
      if (filters.restaurant_id) {
        query = query.eq('restaurant_id', filters.restaurant_id);
      }

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query.order('featured', { ascending: false });

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
  static async getProductById(productId: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          restaurant:restaurant_id (
            id,
            name,
            logo_url,
            address,
            phone,
            avg_rating,
            delivery_fee,
            min_order_amount
          ),
          categories:category_id (
            id,
            name
          )
        `)
        .eq('id', productId)
        .eq('available', true)
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

  // جلب المنتجات المميزة
  static async getFeaturedProducts(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          restaurant:restaurant_id (
            id,
            name,
            logo_url,
            avg_rating
          )
        `)
        .eq('available', true)
        .eq('featured', true)
        .limit(limit)
        .order('created_at', { ascending: false });

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

  // جلب المنتجات الأكثر مبيعاً
  static async getBestSellingProducts(limit: number = 10) {
    try {
      // جلب المنتجات الأكثر طلباً من order_items
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product_name,
          sum:quantity.sum(),
          products:product_id (
            *,
            restaurant:restaurant_id (
              id,
              name,
              logo_url
            )
          )
        `)
        .not('products', 'is', null)
        .limit(limit);

      if (error) {
        console.error('Error fetching best selling products:', error);
        return [];
      }

      // تجميع البيانات وترتيبها
      const productSales = data.reduce((acc: any, item) => {
        if (item.products && item.product_id) {
          if (!acc[item.product_id]) {
            acc[item.product_id] = {
              ...item.products,
              total_sales: 0
            };
          }
          acc[item.product_id].total_sales += item.sum || 0;
        }
        return acc;
      }, {});

      return Object.values(productSales)
        .sort((a: any, b: any) => b.total_sales - a.total_sales)
        .slice(0, limit);
    } catch (error) {
      console.error('Exception fetching best selling products:', error);
      return [];
    }
  }

  // إنشاء منتج جديد (يذهب للموافقة)
  static async createProduct(productData: CreateProductData) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // التحقق من ملكية المطعم
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id')
        .eq('id', productData.restaurant_id)
        .eq('owner_id', user.user.id)
        .single();

      if (!restaurant) {
        throw new Error('غير مصرح لك بإضافة منتجات لهذا المطعم');
      }

      // إنشاء طلب منتج معلق
      const { data, error } = await supabase
        .from('pending_foods')
        .insert({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category_id,
          image_url: productData.image,
          restaurant_id: productData.restaurant_id,
          owner_id: user.user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        return { data: null, error };
      }

      // إرسال إشعار للإدارة
      await this.notifyAdminsNewProduct(data.id, productData.name);

      return { data, error: null };
    } catch (error) {
      console.error('Exception creating product:', error);
      return { data: null, error };
    }
  }

  // تحديث منتج (للمطاعم)
  static async updateProduct(productId: string, updates: Partial<CreateProductData>) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // التحقق من ملكية المنتج
      const { data: product } = await supabase
        .from('products')
        .select(`
          *,
          restaurant:restaurant_id (owner_id)
        `)
        .eq('id', productId)
        .single();

      if (!product || product.restaurant?.owner_id !== user.user.id) {
        throw new Error('غير مصرح لك بتعديل هذا المنتج');
      }

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('Error updating product:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Exception updating product:', error);
      return { data: null, error };
    }
  }

  // حذف منتج
  static async deleteProduct(productId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // التحقق من ملكية المنتج
      const { data: product } = await supabase
        .from('products')
        .select(`
          *,
          restaurant:restaurant_id (owner_id)
        `)
        .eq('id', productId)
        .single();

      if (!product || product.restaurant?.owner_id !== user.user.id) {
        throw new Error('غير مصرح لك بحذف هذا المنتج');
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Exception deleting product:', error);
      return { success: false, error };
    }
  }

  // تبديل حالة التوفر
  static async toggleProductAvailability(productId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // جلب المنتج الحالي
      const { data: product } = await supabase
        .from('products')
        .select(`
          *,
          restaurant:restaurant_id (owner_id)
        `)
        .eq('id', productId)
        .single();

      if (!product || product.restaurant?.owner_id !== user.user.id) {
        throw new Error('غير مصرح لك بتعديل هذا المنتج');
      }

      const { data, error } = await supabase
        .from('products')
        .update({ available: !product.available })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('Error toggling product availability:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Exception toggling product availability:', error);
      return { data: null, error };
    }
  }

  // جلب منتجات المطعم (للمالك)
  static async getRestaurantProducts(restaurantId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // التحقق من ملكية المطعم
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id')
        .eq('id', restaurantId)
        .eq('owner_id', user.user.id)
        .single();

      if (!restaurant) {
        throw new Error('غير مصرح لك بالوصول لهذا المطعم');
      }

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
        .order('created_at', { ascending: false });

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
  static async searchProducts(searchTerm: string, filters: any = {}) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          restaurant:restaurant_id (
            id,
            name,
            logo_url,
            avg_rating
          ),
          categories:category_id (
            id,
            name
          )
        `)
        .eq('available', true);

      // البحث في الاسم والوصف والمكونات
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // فلاتر إضافية
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.restaurant_id) {
        query = query.eq('restaurant_id', filters.restaurant_id);
      }

      if (filters.min_price !== undefined) {
        query = query.gte('price', filters.min_price);
      }

      if (filters.max_price !== undefined) {
        query = query.lte('price', filters.max_price);
      }

      const { data, error } = await query
        .order('featured', { ascending: false })
        .limit(filters.limit || 50);

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

  // جلب فئات المنتجات
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

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

  // دوال مساعدة
  private static async notifyAdminsNewProduct(productId: string, productName: string) {
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          notification_type: 'approval',
          title: 'طلب منتج جديد',
          message: `تم تقديم طلب منتج جديد: ${productName}`,
          reference_id: productId
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }
}
