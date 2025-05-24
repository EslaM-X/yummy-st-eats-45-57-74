
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalRestaurants: number;
  newOrdersToday: number;
  completedOrdersToday: number;
  pendingRestaurants: number;
  pendingFoods: number;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: 'customer' | 'restaurant_owner' | 'admin';
  created_at: string;
  updated_at: string;
  address?: string;
  avatar_url?: string;
}

export interface AdminRestaurant {
  id: string;
  name: string;
  address: string;
  cuisine_type: string[];
  is_active: boolean;
  avg_rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  logo_url?: string;
  owner_id: string;
  phone?: string;
  description?: string;
  delivery_fee: number;
  min_order_amount: number;
  profiles?: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
  };
}

export interface AdminOrder {
  id: string;
  user_id: string;
  restaurant_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  created_at: string;
  delivered_at?: string;
  items: any;
  profiles?: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
  };
  restaurants?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface PendingRestaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  cuisine_type?: string;
  image_url?: string;
  owner_id?: string;
  status: string;
  created_at: string;
  profiles?: any;
}

export interface PendingFood {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  restaurant_id?: string;
  owner_id?: string;
  status: string;
  created_at: string;
  restaurants?: any;
  profiles?: any;
}

export class AdminService {
  // Dashboard Statistics
  static async getDashboardStats(): Promise<AdminStats> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // احصائيات الطلبات
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status, created_at');
      
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      const todayOrders = orders?.filter(order => 
        order.created_at.startsWith(today)
      ) || [];
      
      const newOrdersToday = todayOrders.filter(order => 
        order.status === 'new'
      ).length;
      
      const completedOrdersToday = todayOrders.filter(order => 
        order.status === 'completed'
      ).length;

      // احصائيات المستخدمين
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // احصائيات المطاعم
      const { count: totalRestaurants } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true });

      // المطاعم المعلقة
      const { count: pendingRestaurants } = await supabase
        .from('pending_restaurants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // الأطعمة المعلقة
      const { count: pendingFoods } = await supabase
        .from('pending_foods')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      return {
        totalOrders,
        totalRevenue,
        totalUsers: totalUsers || 0,
        totalRestaurants: totalRestaurants || 0,
        newOrdersToday,
        completedOrdersToday,
        pendingRestaurants: pendingRestaurants || 0,
        pendingFoods: pendingFoods || 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalRestaurants: 0,
        newOrdersToday: 0,
        completedOrdersToday: 0,
        pendingRestaurants: 0,
        pendingFoods: 0,
      };
    }
  }

  // Orders Management
  static async getAllOrders(): Promise<AdminOrder[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            phone,
            email
          ),
          restaurants:restaurant_id (
            id,
            name,
            address
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  static async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          delivered_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', orderId);

      if (error) throw error;

      // إضافة سجل تتبع
      await supabase
        .from('order_tracking')
        .insert({
          order_id: orderId,
          status,
          notes: `تم تحديث حالة الطلب إلى ${status}`
        });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Users Management
  static async getAllUsers(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Restaurants Management
  static async getAllRestaurants(): Promise<AdminRestaurant[]> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          profiles:owner_id (
            id,
            full_name,
            phone,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
  }

  static async toggleRestaurantStatus(restaurantId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ is_active: isActive })
        .eq('id', restaurantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      throw error;
    }
  }

  static async deleteRestaurant(restaurantId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', restaurantId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      throw error;
    }
  }

  // Pending Content Management
  static async getPendingRestaurants(): Promise<PendingRestaurant[]> {
    try {
      const { data, error } = await supabase
        .from('pending_restaurants')
        .select(`
          *,
          profiles:owner_id (
            id,
            full_name,
            phone,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending restaurants:', error);
      return [];
    }
  }

  static async getPendingFoods(): Promise<PendingFood[]> {
    try {
      const { data, error } = await supabase
        .from('pending_foods')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name
          ),
          profiles:owner_id (
            id,
            full_name,
            phone,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending foods:', error);
      return [];
    }
  }

  static async approveRestaurant(restaurantId: string, notes: string = ''): Promise<void> {
    try {
      // الحصول على بيانات المطعم المعلق
      const { data: pendingRestaurant, error: fetchError } = await supabase
        .from('pending_restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (fetchError || !pendingRestaurant) throw fetchError;

      // إنشاء المطعم في الجدول الرئيسي
      const { error: insertError } = await supabase
        .from('restaurants')
        .insert({
          name: pendingRestaurant.name,
          description: pendingRestaurant.description,
          address: pendingRestaurant.address,
          phone: pendingRestaurant.phone,
          cuisine_type: pendingRestaurant.cuisine_type ? [pendingRestaurant.cuisine_type] : [],
          logo_url: pendingRestaurant.image_url,
          owner_id: pendingRestaurant.owner_id,
          is_active: true
        });

      if (insertError) throw insertError;

      // تحديث حالة الطلب
      const { error: updateError } = await supabase
        .from('pending_restaurants')
        .update({
          status: 'approved',
          admin_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', restaurantId);

      if (updateError) throw updateError;

      // إرسال إشعار للمالك
      if (pendingRestaurant.owner_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: pendingRestaurant.owner_id,
            notification_type: 'approval',
            title: 'تمت الموافقة على مطعمك',
            message: `تمت الموافقة على مطعم ${pendingRestaurant.name} وأصبح نشطاً الآن`,
            reference_id: restaurantId
          });
      }
    } catch (error) {
      console.error('Error approving restaurant:', error);
      throw error;
    }
  }

  static async rejectRestaurant(restaurantId: string, notes: string = ''): Promise<void> {
    try {
      const { data: pendingRestaurant } = await supabase
        .from('pending_restaurants')
        .select('name, owner_id')
        .eq('id', restaurantId)
        .single();

      const { error } = await supabase
        .from('pending_restaurants')
        .update({
          status: 'rejected',
          admin_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', restaurantId);

      if (error) throw error;

      // إرسال إشعار للمالك
      if (pendingRestaurant?.owner_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: pendingRestaurant.owner_id,
            notification_type: 'approval',
            title: 'تم رفض طلب المطعم',
            message: `تم رفض طلب مطعم ${pendingRestaurant.name}. ${notes}`,
            reference_id: restaurantId
          });
      }
    } catch (error) {
      console.error('Error rejecting restaurant:', error);
      throw error;
    }
  }

  static async approveFood(foodId: string, notes: string = ''): Promise<void> {
    try {
      const { data: pendingFood, error: fetchError } = await supabase
        .from('pending_foods')
        .select('*')
        .eq('id', foodId)
        .single();

      if (fetchError || !pendingFood) throw fetchError;

      // إنشاء المنتج في الجدول الرئيسي
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          name: pendingFood.name,
          description: pendingFood.description,
          price: pendingFood.price,
          image: pendingFood.image_url,
          restaurant_id: pendingFood.restaurant_id,
          available: true,
          featured: false
        });

      if (insertError) throw insertError;

      // تحديث حالة الطلب
      const { error: updateError } = await supabase
        .from('pending_foods')
        .update({
          status: 'approved',
          admin_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', foodId);

      if (updateError) throw updateError;

      // إرسال إشعار للمالك
      if (pendingFood.owner_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: pendingFood.owner_id,
            notification_type: 'approval',
            title: 'تمت الموافقة على منتجك',
            message: `تمت الموافقة على منتج ${pendingFood.name} وأصبح متاحاً الآن`,
            reference_id: foodId
          });
      }
    } catch (error) {
      console.error('Error approving food:', error);
      throw error;
    }
  }

  static async rejectFood(foodId: string, notes: string = ''): Promise<void> {
    try {
      const { data: pendingFood } = await supabase
        .from('pending_foods')
        .select('name, owner_id')
        .eq('id', foodId)
        .single();

      const { error } = await supabase
        .from('pending_foods')
        .update({
          status: 'rejected',
          admin_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', foodId);

      if (error) throw error;

      // إرسال إشعار للمالك
      if (pendingFood?.owner_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: pendingFood.owner_id,
            notification_type: 'approval',
            title: 'تم رفض طلب المنتج',
            message: `تم رفض طلب منتج ${pendingFood.name}. ${notes}`,
            reference_id: foodId
          });
      }
    } catch (error) {
      console.error('Error rejecting food:', error);
      throw error;
    }
  }

  // Sales and Analytics
  static async getSalesData(period: string = '7days') {
    try {
      const days = period === '7days' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // تجميع البيانات حسب التاريخ
      const salesByDate = (data || []).reduce((acc: any, order) => {
        const date = order.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, sales: 0, orders: 0 };
        }
        acc[date].sales += order.total_amount;
        acc[date].orders += 1;
        return acc;
      }, {});

      return Object.values(salesByDate);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      return [];
    }
  }

  static async getTopRestaurants() {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id,
          name,
          avg_rating,
          rating_count,
          logo_url
        `)
        .eq('is_active', true)
        .order('avg_rating', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top restaurants:', error);
      return [];
    }
  }

  static async getRecentOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          customer_name,
          restaurants:restaurant_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return [];
    }
  }
}
