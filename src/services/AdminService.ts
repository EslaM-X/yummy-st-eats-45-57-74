
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  usersCount: number;
  ordersCount: number;
  restaurantsCount: number;
  totalSales: number;
  pendingOrders: number;
  pendingRestaurants: number;
  pendingFoods: number;
}

export class AdminService {
  // جلب إحصائيات لوحة الإدارة
  static async getDashboardStats(): Promise<AdminStats> {
    try {
      const [
        { count: usersCount },
        { count: ordersCount },
        { count: restaurantsCount },
        { data: salesData },
        { count: pendingOrders },
        { count: pendingRestaurants },
        { count: pendingFoods }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').eq('payment_status', 'completed'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('pending_restaurants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('pending_foods').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      const totalSales = salesData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      return {
        usersCount: usersCount || 0,
        ordersCount: ordersCount || 0,
        restaurantsCount: restaurantsCount || 0,
        totalSales,
        pendingOrders: pendingOrders || 0,
        pendingRestaurants: pendingRestaurants || 0,
        pendingFoods: pendingFoods || 0,
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }

  // جلب جميع المستخدمين
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // جلب جميع الطلبات
  static async getAllOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_user_id_fkey(full_name, phone),
          restaurants!orders_restaurant_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
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
        .update({ status, updated_at: new Date().toISOString() })
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

  // جلب المطاعم المعلقة للموافقة
  static async getPendingRestaurants() {
    try {
      const { data, error } = await supabase
        .from('pending_restaurants')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
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
          description: pendingRestaurant.description,
          address: pendingRestaurant.address,
          phone: pendingRestaurant.phone,
          logo_url: pendingRestaurant.image_url,
          cuisine_type: pendingRestaurant.cuisine_type ? [pendingRestaurant.cuisine_type] : [],
          owner_id: pendingRestaurant.owner_id,
          is_active: true
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
          reviewed_at: new Date().toISOString()
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
          reviewed_at: new Date().toISOString()
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
}
