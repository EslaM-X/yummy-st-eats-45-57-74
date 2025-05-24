
import { supabase } from '@/integrations/supabase/client';

export interface OrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  notes?: string;
}

export interface CreateOrderData {
  restaurant_id: string;
  items: OrderItem[];
  total_amount: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_notes?: string;
  payment_method: 'card' | 'cash';
  coupon_id?: string;
  discount_amount?: number;
}

export class OrderService {
  // جلب طلبات المستخدم مع فلتر اختياري للحالة
  static async getUserOrders(status?: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      let query = supabase
        .from('orders')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
            logo_url,
            phone,
            address
          ),
          order_items:order_items (
            id,
            product_name,
            product_price,
            quantity,
            notes
          )
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching orders:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching orders:', error);
      return { data: null, error };
    }
  }
  
  // جلب طلب محدد بالمعرف
  static async getOrderById(orderId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants:restaurant_id (
            id, 
            name,
            logo_url,
            phone,
            address
          ),
          order_items:order_items (
            id,
            product_id,
            product_name,
            product_price,
            quantity,
            notes
          ),
          order_tracking:order_tracking (
            id,
            status,
            notes,
            created_at
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching order details:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching order details:', error);
      return { data: null, error };
    }
  }
  
  // إلغاء طلب
  static async cancelOrder(orderId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // التحقق من حالة الطلب أولاً
      const { data: order } = await supabase
        .from('orders')
        .select('status, restaurant_id')
        .eq('id', orderId)
        .eq('user_id', user.user.id)
        .single();

      if (!order) {
        throw new Error('الطلب غير موجود');
      }

      if (order.status === 'completed' || order.status === 'cancelled') {
        throw new Error('لا يمكن إلغاء هذا الطلب');
      }

      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user.user.id);
      
      if (error) {
        console.error('Error cancelling order:', error);
        return { success: false, error };
      }
      
      // إضافة سجل تتبع
      await supabase
        .from('order_tracking')
        .insert({
          order_id: orderId,
          status: 'cancelled',
          notes: 'تم إلغاء الطلب من قبل العميل'
        });

      // إشعار المطعم بالإلغاء
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id')
        .eq('id', order.restaurant_id)
        .single();

      if (restaurant?.owner_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: restaurant.owner_id,
            notification_type: 'info',
            title: 'تم إلغاء طلب',
            message: `تم إلغاء طلب رقم ${orderId} من قبل العميل`,
            reference_id: orderId
          });
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Exception cancelling order:', error);
      return { success: false, error };
    }
  }
  
  // إنشاء طلب جديد
  static async createOrder(orderData: CreateOrderData) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // تحويل OrderItem[] إلى JSON متوافق
      const itemsAsJson = orderData.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        notes: item.notes || ''
      }));

      // إنشاء الطلب
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.user.id,
          restaurant_id: orderData.restaurant_id,
          total_amount: orderData.total_amount,
          status: 'new',
          payment_method: orderData.payment_method,
          payment_status: 'pending',
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          delivery_address: orderData.delivery_address,
          delivery_notes: orderData.delivery_notes,
          items: itemsAsJson as any
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        return { data: null, error: orderError };
      }

      // إضافة عناصر الطلب
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        notes: item.notes
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // حذف الطلب في حالة فشل إضافة العناصر
        await supabase.from('orders').delete().eq('id', order.id);
        return { data: null, error: itemsError };
      }

      // إضافة سجل تتبع أولي
      await supabase
        .from('order_tracking')
        .insert({
          order_id: order.id,
          status: 'new',
          notes: 'تم إنشاء الطلب بنجاح'
        });

      // معالجة الكوبون إذا كان موجود
      if (orderData.coupon_id && orderData.discount_amount) {
        await this.processCouponUsage(
          user.user.id,
          orderData.coupon_id,
          order.id,
          orderData.discount_amount
        );
      }

      // إنشاء معاملة مالية
      await supabase
        .from('transactions')
        .insert({
          user_id: user.user.id,
          order_id: order.id,
          amount: orderData.total_amount,
          transaction_type: 'order_payment',
          payment_method: orderData.payment_method,
          status: 'pending'
        });

      // إرسال إشعار للمطعم
      await this.notifyRestaurantNewOrder(orderData.restaurant_id, order.id);

      // إرسال إشعار للعميل
      await supabase
        .from('notifications')
        .insert({
          user_id: user.user.id,
          notification_type: 'success',
          title: 'تم إنشاء الطلب',
          message: `تم إنشاء طلبك بنجاح. رقم الطلب: ${order.id}`,
          reference_id: order.id
        });
      
      return { data: order, error: null };
    } catch (error) {
      console.error('Exception creating order:', error);
      return { data: null, error };
    }
  }

  // معالجة استخدام الكوبون
  private static async processCouponUsage(
    userId: string,
    couponId: string,
    orderId: string,
    discountAmount: number
  ) {
    try {
      // تحديث كوبون المستخدم كمستخدم
      await supabase
        .from('user_coupons')
        .update({
          used_at: new Date().toISOString(),
          order_id: orderId
        })
        .eq('user_id', userId)
        .eq('coupon_id', couponId);

      // إضافة سجل استخدام الكوبون
      await supabase
        .from('coupon_usage')
        .insert({
          user_id: userId,
          coupon_id: couponId,
          order_id: orderId,
          discount_amount: discountAmount
        });

      // زيادة عداد استخدام الكوبون
      await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });
    } catch (error) {
      console.error('Error processing coupon usage:', error);
    }
  }

  // إرسال إشعار للمطعم بطلب جديد
  private static async notifyRestaurantNewOrder(restaurantId: string, orderId: string) {
    try {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id, name')
        .eq('id', restaurantId)
        .single();

      if (restaurant?.owner_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: restaurant.owner_id,
            notification_type: 'info',
            title: 'طلب جديد',
            message: `لديك طلب جديد رقم ${orderId} في مطعم ${restaurant.name}`,
            reference_id: orderId
          });
      }
    } catch (error) {
      console.error('Error notifying restaurant:', error);
    }
  }

  // جلب حالة الطلب مع التتبع
  static async getOrderTracking(orderId: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { data, error } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching order tracking:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Exception fetching order tracking:', error);
      return { data: null, error };
    }
  }

  // طلب استرداد
  static async requestRefund(orderId: string, reason: string) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // التحقق من الطلب
      const { data: order } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('id', orderId)
        .eq('user_id', user.user.id)
        .single();

      if (!order) {
        throw new Error('الطلب غير موجود');
      }

      if (order.status !== 'completed') {
        throw new Error('يمكن طلب الاسترداد للطلبات المكتملة فقط');
      }

      // إنشاء طلب استرداد
      const { data, error } = await supabase
        .from('refund_transactions')
        .insert({
          user_id: user.user.id,
          order_id: orderId,
          amount: order.total_amount,
          reason: reason,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating refund request:', error);
        return { success: false, error };
      }

      // إرسال إشعار للإدارة
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          notification_type: 'info',
          title: 'طلب استرداد جديد',
          message: `طلب استرداد جديد للطلب رقم ${orderId}`,
          reference_id: data.id
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      return { success: true, data, error: null };
    } catch (error) {
      console.error('Exception requesting refund:', error);
      return { success: false, error };
    }
  }

  // جلب المفضلة
  static async getFavoriteRestaurants() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return [];
      }

      // جلب المطاعم المفضلة بناءً على تاريخ الطلبات
      const { data, error } = await supabase
        .from('orders')
        .select(`
          restaurant_id,
          restaurants:restaurant_id (
            id,
            name,
            logo_url,
            avg_rating,
            cuisine_type,
            delivery_fee
          )
        `)
        .eq('user_id', user.user.id)
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching favorite restaurants:', error);
        return [];
      }

      // تجميع المطاعم وحساب عدد الطلبات
      const restaurantCounts = data.reduce((acc: any, order) => {
        const restaurantId = order.restaurant_id;
        if (!acc[restaurantId]) {
          acc[restaurantId] = {
            restaurant: order.restaurants,
            orderCount: 0
          };
        }
        acc[restaurantId].orderCount++;
        return acc;
      }, {});

      // ترتيب حسب عدد الطلبات
      return Object.values(restaurantCounts)
        .sort((a: any, b: any) => b.orderCount - a.orderCount)
        .slice(0, 5)
        .map((item: any) => item.restaurant);
    } catch (error) {
      console.error('Exception fetching favorite restaurants:', error);
      return [];
    }
  }
}
