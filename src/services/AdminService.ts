import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  user_type: 'admin' | 'customer' | 'restaurant_owner';
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
  username: string;
  avatar_url: string;
}

export interface AdminStats {
  usersCount: number;
  ordersCount: number;
  totalSales: number;
  restaurantsCount: number;
  activeRestaurants: number;
  pendingOrders: number;
  pendingRestaurants: number;
  pendingFoods: number;
  completedOrders: number;
  totalRefunds: number;
  totalTransactions: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  activeUsers: number;
}

export interface SalesData {
  day: string;
  amount: number;
}

export interface TopRestaurant {
  id: string;
  name: string;
  avg_rating: number;
  logo_url?: string;
}

const admins = [
  { id: 'a9773c9a-9c5f-4c1d-b717-999e8b98c9c4', name: 'عبدالرحمن' },
  { id: 'b9773c9a-9c5f-4c1d-b717-999e8b98c9c4', name: 'محمد' }
];

export class AdminService {
  private static admins = admins;

  static isAdmin(userId: string): boolean {
    return this.admins.some(admin => admin.id === userId);
  }

  static async getAdminById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching admin:', error);
      return null;
    }
  }

  // جلب إحصائيات لوحة التحكم
  static async getDashboardStats(): Promise<AdminStats> {
    try {
      // جلب عدد المستخدمين
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // جلب عدد الطلبات
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // جلب إجمالي المبيعات
      const { data: salesData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      const totalSales = salesData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // جلب عدد المطاعم
      const { count: restaurantsCount } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true });

      // جلب عدد المطاعم النشطة
      const { count: activeRestaurants } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // جلب الطلبات المعلقة
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      // جلب المطاعم المعلقة
      const { count: pendingRestaurants } = await supabase
        .from('pending_restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // جلب الأطعمة المعلقة
      const { count: pendingFoods } = await supabase
        .from('pending_foods')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // جلب المبالغ المستردة
      const { data: refundData } = await supabase
        .from('refund_transactions')
        .select('amount')
        .eq('status', 'completed');

      const totalRefunds = refundData?.reduce((sum, refund) => sum + (refund.amount || 0), 0) || 0;

      return {
        usersCount: usersCount || 0,
        ordersCount: ordersCount || 0,
        totalSales,
        restaurantsCount: restaurantsCount || 0,
        activeRestaurants: activeRestaurants || 0,
        pendingOrders: pendingOrders || 0,
        pendingRestaurants: pendingRestaurants || 0,
        pendingFoods: pendingFoods || 0,
        completedOrders: salesData?.length || 0,
        totalRefunds,
        // إضافة الخصائص المفقودة
        totalTransactions: ordersCount || 0,
        totalRevenue: totalSales,
        newUsersThisMonth: 0, // يمكن حسابه لاحقاً
        activeUsers: usersCount || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        usersCount: 0,
        ordersCount: 0,
        totalSales: 0,
        restaurantsCount: 0,
        activeRestaurants: 0,
        pendingOrders: 0,
        pendingRestaurants: 0,
        pendingFoods: 0,
        completedOrders: 0,
        totalRefunds: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        newUsersThisMonth: 0,
        activeUsers: 0
      };
    }
  }

  // جلب بيانات المبيعات
  static async getSalesData(period: string = 'week'): Promise<any[]> {
    try {
      let startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setDate(startDate.getDate() - 30);
      }

      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching sales data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching sales data:', error);
      return [];
    }
  }

  // جلب أفضل المطاعم
  static async getTopRestaurants(limit: number = 5): Promise<TopRestaurant[]> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, avg_rating, logo_url')
        .order('avg_rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top restaurants:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching top restaurants:', error);
      return [];
    }
  }

  // جلب جميع المستخدمين
  static async getAllUsers(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return (data || []).map(user => ({
        id: user.id,
        email: user.email || '',
        full_name: user.full_name || '',
        user_type: user.user_type as 'admin' | 'customer' | 'restaurant_owner',
        phone: user.phone || '',
        address: user.address || '',
        created_at: user.created_at,
        updated_at: user.updated_at,
        username: user.username || '',
        avatar_url: user.avatar_url || ''
      }));
    } catch (error) {
      console.error('Exception fetching users:', error);
      return [];
    }
  }

  // تعطيل أو تفعيل المستخدم
  static async toggleUserStatus(userId: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) {
        console.error('Error toggling user status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception toggling user status:', error);
      return false;
    }
  }

  // جلب جميع المطاعم المعلقة
  static async getPendingRestaurants() {
    try {
      const { data, error } = await supabase
        .from('pending_restaurants')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending restaurants:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching pending restaurants:', error);
      return [];
    }
  }

  // الموافقة على مطعم
  static async approveRestaurant(restaurantId: string) {
    try {
      // جلب بيانات المطعم المعلق
      const { data: pendingRestaurant, error: pendingError } = await supabase
        .from('pending_restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (pendingError || !pendingRestaurant) {
        throw new Error('المطعم المعلق غير موجود');
      }

      // إنشاء المطعم الجديد
      const { data: newRestaurant, error: createError } = await supabase
        .from('restaurants')
        .insert({
          name: pendingRestaurant.name,
          description: pendingRestaurant.description,
          address: pendingRestaurant.address,
          phone: pendingRestaurant.phone,
          email: pendingRestaurant.email,
          cuisine_type: [pendingRestaurant.cuisine_type],
          logo_url: pendingRestaurant.image_url,
          owner_id: pendingRestaurant.owner_id,
          is_active: true,
          avg_rating: 0
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // حذف المطعم المعلق
      const { error: deleteError } = await supabase
        .from('pending_restaurants')
        .delete()
        .eq('id', restaurantId);

      if (deleteError) {
        throw deleteError;
      }

      // إرسال إشعار للمالك
      await supabase
        .from('notifications')
        .insert({
          user_id: pendingRestaurant.owner_id,
          notification_type: 'success',
          title: 'تمت الموافقة على مطعمك',
          message: `تمت الموافقة على مطعمك ${pendingRestaurant.name} بنجاح`,
          reference_id: newRestaurant.id
        });

      return { success: true };
    } catch (error) {
      console.error('Error approving restaurant:', error);
      return { success: false, error };
    }
  }

  // رفض مطعم
  static async rejectRestaurant(restaurantId: string, reason: string) {
    try {
      // جلب بيانات المطعم المعلق
      const { data: pendingRestaurant, error: pendingError } = await supabase
        .from('pending_restaurants')
        .select('owner_id, name')
        .eq('id', restaurantId)
        .single();

      if (pendingError || !pendingRestaurant) {
        throw new Error('المطعم المعلق غير موجود');
      }

      // تحديث حالة المطعم المعلق إلى مرفوض
      const { error: updateError } = await supabase
        .from('pending_restaurants')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', restaurantId);

      if (updateError) {
        throw updateError;
      }

      // إرسال إشعار للمالك
      await supabase
        .from('notifications')
        .insert({
          user_id: pendingRestaurant.owner_id,
          notification_type: 'error',
          title: 'تم رفض مطعمك',
          message: `تم رفض مطعمك ${pendingRestaurant.name} بسبب: ${reason}`,
          reference_id: restaurantId
        });

      return { success: true };
    } catch (error) {
      console.error('Error rejecting restaurant:', error);
      return { success: false, error };
    }
  }
}
