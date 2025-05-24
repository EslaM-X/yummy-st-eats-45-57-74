
import { supabase } from '@/integrations/supabase/client';

export interface OrderItem {
  product_id?: string;
  product_name: string;
  quantity: number;
  product_price: number;
  notes?: string;
}

export interface Order {
  id?: string;
  user_id: string;
  restaurant_id: string;
  items: OrderItem[];
  total_amount: number;
  status?: string;
  payment_method?: string;
  payment_status?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_notes?: string;
  created_at?: string;
  updated_at?: string;
  delivered_at?: string;
}

export interface OrderTracking {
  id: string;
  order_id: string;
  status: string;
  notes?: string;
  created_at: string;
}

export class OrderService {
  // إنشاء طلب جديد
  static async createOrder(orderData: Order): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      console.log('Creating order with data:', orderData);

      // تحويل العناصر إلى JSON
      const orderItems = orderData.items.map(item => ({
        product_id: item.product_id || null,
        product_name: item.product_name,
        quantity: item.quantity,
        product_price: item.product_price,
        notes: item.notes || null
      }));

      // إنشاء الطلب في جدول orders
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.user_id,
          restaurant_id: orderData.restaurant_id,
          items: orderItems,
          total_amount: orderData.total_amount,
          status: orderData.status || 'new',
          payment_method: orderData.payment_method || 'card',
          payment_status: orderData.payment_status || 'pending',
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          delivery_address: orderData.delivery_address,
          delivery_notes: orderData.delivery_notes
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return { success: false, error: orderError.message };
      }

      // إضافة عناصر الطلب في جدول order_items
      if (orderData.items && orderData.items.length > 0) {
        const orderItemsData = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          product_price: item.product_price,
          notes: item.notes
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
          // في حالة فشل إدخال العناصر، يمكننا المتابعة لأن البيانات موجودة في حقل items
        }
      }

      // إضافة سجل تتبع أولي
      await supabase
        .from('order_tracking')
        .insert({
          order_id: order.id,
          status: 'new',
          notes: 'تم إنشاء الطلب'
        });

      console.log('Order created successfully:', order);
      return { success: true, order };
    } catch (error: any) {
      console.error('Exception creating order:', error);
      return { success: false, error: error.message };
    }
  }

  // جلب طلبات المستخدم
  static async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
            logo_url,
            address
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user orders:', error);
        return [];
      }

      return (data || []).map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items : 
               typeof order.items === 'string' ? JSON.parse(order.items) : []
      }));
    } catch (error) {
      console.error('Exception fetching user orders:', error);
      return [];
    }
  }

  // جلب تفاصيل طلب محدد
  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants:restaurant_id (
            id,
            name,
            logo_url,
            address,
            phone
          ),
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            product_price,
            notes
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        return null;
      }

      return {
        ...data,
        items: Array.isArray(data.items) ? data.items : 
               typeof data.items === 'string' ? JSON.parse(data.items) : []
      };
    } catch (error) {
      console.error('Exception fetching order:', error);
      return null;
    }
  }

  // تحديث حالة الطلب
  static async updateOrderStatus(orderId: string, status: string, notes?: string): Promise<boolean> {
    try {
      // تحديث حالة الطلب
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating order status:', orderError);
        return false;
      }

      // إضافة سجل تتبع
      const { error: trackingError } = await supabase
        .from('order_tracking')
        .insert({
          order_id: orderId,
          status,
          notes: notes || `تم تحديث حالة الطلب إلى ${status}`
        });

      if (trackingError) {
        console.error('Error creating tracking record:', trackingError);
        // المتابعة حتى لو فشل التتبع
      }

      return true;
    } catch (error) {
      console.error('Exception updating order status:', error);
      return false;
    }
  }

  // جلب تتبع الطلب
  static async getOrderTracking(orderId: string): Promise<OrderTracking[]> {
    try {
      const { data, error } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching order tracking:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching order tracking:', error);
      return [];
    }
  }

  // إلغاء طلب
  static async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    try {
      const result = await this.updateOrderStatus(orderId, 'cancelled', reason || 'تم إلغاء الطلب بواسطة المستخدم');
      return result;
    } catch (error) {
      console.error('Exception cancelling order:', error);
      return false;
    }
  }

  // جلب طلبات المطعم
  static async getRestaurantOrders(restaurantId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            phone
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching restaurant orders:', error);
        return [];
      }

      return (data || []).map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items : 
               typeof order.items === 'string' ? JSON.parse(order.items) : []
      }));
    } catch (error) {
      console.error('Exception fetching restaurant orders:', error);
      return [];
    }
  }

  // جلب جميع الطلبات (للإدارة)
  static async getAllOrders(): Promise<Order[]> {
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

      if (error) {
        console.error('Error fetching all orders:', error);
        return [];
      }

      return (data || []).map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items : 
               typeof order.items === 'string' ? JSON.parse(order.items) : []
      }));
    } catch (error) {
      console.error('Exception fetching all orders:', error);
      return [];
    }
  }
}
