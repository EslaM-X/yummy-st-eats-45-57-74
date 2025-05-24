
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  usersCount: number;
  ordersCount: number;
  restaurantsCount: number;
  totalSales: number;
  pendingOrders: number;
  pendingRestaurants: number;
  pendingFoods: number;
  activeRestaurants: number;
  completedOrders: number;
  totalRefunds: number;
}

export class AdminService {
  // جلب إحصائيات لوحة الإدارة
  static async getDashboardStats(): Promise<AdminStats> {
    try {
      const [
        { count: usersCount },
        { count: ordersCount },
        { count: restaurantsCount },
        { count: activeRestaurants },
        { data: completedOrdersData },
        { count: pendingOrders },
        { count: pendingRestaurants },
        { count: pendingFoods },
        { data: refundsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('total_amount').eq('payment_status', 'completed'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('pending_restaurants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('pending_foods').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('refund_transactions').select('amount').eq('status', 'completed')
      ]);

      const totalSales = completedOrdersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalRefunds = refundsData?.reduce((sum, refund) => sum + (refund.amount || 0), 0) || 0;
      const completedOrders = completedOrdersData?.length || 0;

      return {
        usersCount: usersCount || 0,
        ordersCount: ordersCount || 0,
        restaurantsCount: restaurantsCount || 0,
        activeRestaurants: activeRestaurants || 0,
        totalSales,
        pendingOrders: pendingOrders || 0,
        pendingRestaurants: pendingRestaurants || 0,
        pendingFoods: pendingFoods || 0,
        completedOrders,
        totalRefunds,
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }

  // جلب جميع المستخدمين مع تفاصيلهم
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // جلب جميع الطلبات مع تفاصيل العملاء والمطاعم
  static async getAllOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_user_id_fkey(id, full_name, phone, email),
          restaurants!orders_restaurant_id_fkey(id, name, address, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // تحديث حالة الطلب
  static async updateOrderStatus(orderId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          ...(status === 'completed' ? { delivered_at: new Date().toISOString() } : {})
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // جلب جميع المطاعم مع تفاصيل أصحابها
  static async getAllRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          profiles!restaurants_owner_id_fkey(id, full_name, phone, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  }

  // تفعيل/إلغاء تفعيل مطعم
  static async toggleRestaurantStatus(restaurantId: string, isActive: boolean) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({ 
          is_active: isActive, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', restaurantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling restaurant status:', error);
      throw error;
    }
  }

  // حذف مطعم
  static async deleteRestaurant(restaurantId: string) {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      throw error;
    }
  }

  // جلب المطاعم المعلقة للموافقة
  static async getPendingRestaurants() {
    try {
      const { data, error } = await supabase
        .from('pending_restaurants')
        .select(`
          *,
          profiles!pending_restaurants_owner_id_fkey(id, full_name, phone, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending restaurants:', error);
      throw error;
    }
  }

  // الموافقة على مطعم معلق
  static async approveRestaurant(pendingId: string, adminNotes?: string) {
    try {
      // جلب بيانات المطعم المعلق
      const { data: pendingRestaurant, error: fetchError } = await supabase
        .from('pending_restaurants')
        .select('*')
        .eq('id', pendingId)
        .single();

      if (fetchError) throw fetchError;

      // إنشاء المطعم في جدول المطاعم الرئيسي
      const { data: restaurant, error: insertError } = await supabase
        .from('restaurants')
        .insert({
          name: pendingRestaurant.name,
          description: pendingRestaurant.description || '',
          address: pendingRestaurant.address || '',
          phone: pendingRestaurant.phone,
          logo_url: pendingRestaurant.image_url,
          cuisine_type: pendingRestaurant.cuisine_type ? [pendingRestaurant.cuisine_type] : [],
          owner_id: pendingRestaurant.owner_id,
          is_active: true,
          rating: 0,
          avg_rating: 0,
          rating_count: 0,
          delivery_fee: 0,
          min_order_amount: 0
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // تحديث حالة المطعم المعلق
      const { error: updateError } = await supabase
        .from('pending_restaurants')
        .update({
          status: 'approved',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingId);

      if (updateError) throw updateError;

      return restaurant;
    } catch (error) {
      console.error('Error approving restaurant:', error);
      throw error;
    }
  }

  // رفض مطعم معلق
  static async rejectRestaurant(pendingId: string, adminNotes: string) {
    try {
      const { data, error } = await supabase
        .from('pending_restaurants')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rejecting restaurant:', error);
      throw error;
    }
  }

  // جلب الأطعمة المعلقة للموافقة
  static async getPendingFoods() {
    try {
      const { data, error } = await supabase
        .from('pending_foods')
        .select(`
          *,
          restaurants!pending_foods_restaurant_id_fkey(id, name),
          profiles!pending_foods_owner_id_fkey(id, full_name, phone, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending foods:', error);
      throw error;
    }
  }

  // الموافقة على طعام معلق
  static async approveFood(pendingId: string, adminNotes?: string) {
    try {
      // جلب بيانات الطعام المعلق
      const { data: pendingFood, error: fetchError } = await supabase
        .from('pending_foods')
        .select('*')
        .eq('id', pendingId)
        .single();

      if (fetchError) throw fetchError;

      // إنشاء المنتج في جدول المنتجات الرئيسي
      const { data: product, error: insertError } = await supabase
        .from('products')
        .insert({
          name: pendingFood.name,
          description: pendingFood.description || '',
          price: pendingFood.price,
          image: pendingFood.image_url,
          restaurant_id: pendingFood.restaurant_id,
          available: true,
          featured: false,
          category_id: null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // تحديث حالة الطعام المعلق
      const { error: updateError } = await supabase
        .from('pending_foods')
        .update({
          status: 'approved',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingId);

      if (updateError) throw updateError;

      return product;
    } catch (error) {
      console.error('Error approving food:', error);
      throw error;
    }
  }

  // رفض طعام معلق
  static async rejectFood(pendingId: string, adminNotes: string) {
    try {
      const { data, error } = await supabase
        .from('pending_foods')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rejecting food:', error);
      throw error;
    }
  }

  // تحديث معلومات المستخدم
  static async updateUser(userId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // حذف مستخدم
  static async deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // جلب إحصائيات المبيعات حسب الفترة
  static async getSalesData(period: 'week' | 'month' | 'year' = 'week') {
    try {
      let dateFrom = new Date();
      
      switch (period) {
        case 'week':
          dateFrom.setDate(dateFrom.getDate() - 7);
          break;
        case 'month':
          dateFrom.setMonth(dateFrom.getMonth() - 1);
          break;
        case 'year':
          dateFrom.setFullYear(dateFrom.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, created_at, payment_status')
        .eq('payment_status', 'completed')
        .gte('created_at', dateFrom.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw error;
    }
  }

  // جلب أفضل المطاعم حسب التقييم
  static async getTopRestaurants(limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, avg_rating, rating_count, logo_url')
        .eq('is_active', true)
        .order('avg_rating', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top restaurants:', error);
      throw error;
    }
  }
}
