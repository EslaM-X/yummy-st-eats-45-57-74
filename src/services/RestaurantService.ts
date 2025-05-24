
import { supabase } from '@/integrations/supabase/client';

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  logo_url?: string;
  cover_image_url?: string;
  cuisine_type: string;
  rating: number;
  delivery_fee: number;
  minimum_order: number;
  estimated_delivery_time: string;
  is_active: boolean;
  opening_hours: any;
  location_id?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseRestaurant {
  id?: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  cuisine_type?: string[];
  avg_rating?: number;
  delivery_fee?: number;
  min_order_amount?: number;
  is_active?: boolean;
  opening_hours?: any;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  rating?: number;
  rating_count?: number;
}

export class RestaurantService {
  // جلب جميع المطاعم النشطة والمعتمدة
  static async getAllRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('avg_rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
  }

  static async getRestaurantById(id: string) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          products:products(
            id,
            name,
            description,
            price,
            discount_price,
            image,
            available,
            featured,
            category_id,
            categories:category_id(name)
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      return null;
    }
  }

  static async getUserRestaurants(userId: string) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          products:products(count),
          orders:orders(count)
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user restaurants:', error);
      return [];
    }
  }

  // إنشاء طلب مطعم جديد (يذهب للموافقة)
  static async createRestaurant(restaurantData: DatabaseRestaurant) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { data, error } = await supabase
        .from('pending_restaurants')
        .insert({
          name: restaurantData.name,
          description: restaurantData.description || '',
          address: restaurantData.address,
          phone: restaurantData.phone,
          email: restaurantData.email || '',
          cuisine_type: Array.isArray(restaurantData.cuisine_type) 
            ? restaurantData.cuisine_type[0] 
            : restaurantData.cuisine_type,
          image_url: restaurantData.logo_url,
          owner_id: user.user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // إرسال إشعار للإدارة
      await this.notifyAdminsNewRestaurant(data.id, restaurantData.name);

      return { data, error: null };
    } catch (error) {
      console.error('Error creating restaurant:', error);
      return { data: null, error };
    }
  }

  static async updateRestaurant(id: string, updates: Partial<DatabaseRestaurant>) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { data, error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id)
        .eq('owner_id', user.user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating restaurant:', error);
      return { data: null, error };
    }
  }

  // جلب تفاصيل مطعم المستخدم
  static async getRestaurantDetails(restaurantId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          products:products(count),
          orders:orders(
            count,
            total_amount.sum()
          )
        `)
        .eq('id', restaurantId)
        .eq('owner_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      return null;
    }
  }

  // حذف مطعم
  static async deleteRestaurant(restaurantId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId)
        .eq('owner_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      return { success: false, error };
    }
  }

  // جلب طلبات المطعم
  static async getRestaurantOrders(restaurantId: string, userId: string, status?: string) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id(full_name, phone),
          order_items:order_items(*)
        `)
        .eq('restaurant_id', restaurantId);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // التحقق من أن المطعم ملك للمستخدم
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id')
        .eq('id', restaurantId)
        .eq('owner_id', userId)
        .single();

      if (!restaurant) {
        throw new Error('غير مصرح لك بالوصول لهذا المطعم');
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching restaurant orders:', error);
      return [];
    }
  }

  // تحديث حالة الطلب
  static async updateOrderStatus(orderId: string, status: string, restaurantId: string, userId: string) {
    try {
      // التحقق من ملكية المطعم
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id')
        .eq('id', restaurantId)
        .eq('owner_id', userId)
        .single();

      if (!restaurant) {
        throw new Error('غير مصرح لك بتحديث هذا الطلب');
      }

      const { error } = await supabase
        .from('orders')
        .update({
          status,
          delivered_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', orderId)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      // إضافة سجل تتبع
      await supabase
        .from('order_tracking')
        .insert({
          order_id: orderId,
          status,
          notes: `تم تحديث حالة الطلب من المطعم إلى ${status}`
        });

      // إرسال إشعار للعميل
      const { data: order } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();

      if (order?.user_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: order.user_id,
            notification_type: 'info',
            title: 'تحديث حالة الطلب',
            message: `تم تحديث حالة طلبك إلى ${this.getStatusInArabic(status)}`,
            reference_id: orderId
          });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error };
    }
  }

  // جلب إحصائيات المطعم
  static async getRestaurantStats(restaurantId: string, userId: string) {
    try {
      // التحقق من ملكية المطعم
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id')
        .eq('id', restaurantId)
        .eq('owner_id', userId)
        .single();

      if (!restaurant) {
        throw new Error('غير مصرح لك بالوصول لهذا المطعم');
      }

      // احصائيات الطلبات
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .eq('restaurant_id', restaurantId);

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;
      const pendingOrders = orders?.filter(order => order.status === 'new').length || 0;

      // احصائيات اليوم
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders?.filter(order => order.created_at.startsWith(today)) || [];
      const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total_amount, 0);

      return {
        totalOrders,
        totalRevenue,
        completedOrders,
        pendingOrders,
        todayOrders: todayOrders.length,
        todayRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      };
    } catch (error) {
      console.error('Error fetching restaurant stats:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        todayOrders: 0,
        todayRevenue: 0,
        averageOrderValue: 0
      };
    }
  }

  // البحث في المطاعم
  static async searchRestaurants(searchTerm: string, filters: any = {}) {
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true);

      // البحث في الاسم والوصف
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // فلتر نوع المطبخ
      if (filters.cuisine_type) {
        query = query.contains('cuisine_type', [filters.cuisine_type]);
      }

      // فلتر التقييم
      if (filters.min_rating) {
        query = query.gte('avg_rating', filters.min_rating);
      }

      const { data, error } = await query.order('avg_rating', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return [];
    }
  }

  // دوال مساعدة
  private static async notifyAdminsNewRestaurant(restaurantId: string, restaurantName: string) {
    try {
      // جلب جميع الإداريين
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          notification_type: 'approval',
          title: 'طلب مطعم جديد',
          message: `تم تقديم طلب مطعم جديد: ${restaurantName}`,
          reference_id: restaurantId
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }

  private static getStatusInArabic(status: string): string {
    const statusMap: { [key: string]: string } = {
      'new': 'جديد',
      'preparing': 'قيد التحضير',
      'delivering': 'قيد التوصيل',
      'completed': 'مكتمل',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  }
}
