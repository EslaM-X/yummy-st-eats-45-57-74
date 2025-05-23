
import { supabase } from '@/integrations/supabase/client';
import { Coupon, UserCoupon, Notification } from '@/types/coupons';

export class CouponService {
  /**
   * Get all active coupons
   */
  static async getActiveCoupons(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching coupons:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception fetching coupons:', error);
      return [];
    }
  }

  /**
   * Get user's available coupons
   */
  static async getUserCoupons(userId: string): Promise<UserCoupon[]> {
    try {
      const { data, error } = await supabase
        .from('user_coupons')
        .select(`
          *,
          coupon:coupons(*)
        `)
        .eq('user_id', userId)
        .is('used_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user coupons:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception fetching user coupons:', error);
      return [];
    }
  }

  /**
   * Add coupon to user account
   */
  static async addCouponToUser(userId: string, couponId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_coupons')
        .insert({
          user_id: userId,
          coupon_id: couponId
        });
      
      if (error) {
        console.error('Error adding coupon to user:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception adding coupon to user:', error);
      return false;
    }
  }

  /**
   * Apply coupon to order
   */
  static async applyCoupon(
    userId: string, 
    couponId: string, 
    orderTotal: number
  ): Promise<{success: boolean, discount: number, message: string}> {
    try {
      const { data, error } = await supabase
        .rpc('apply_coupon', {
          p_user_id: userId,
          p_coupon_id: couponId,
          p_order_total: orderTotal
        });
      
      if (error) {
        console.error('Error applying coupon:', error);
        return { success: false, discount: 0, message: 'حدث خطأ في تطبيق الكوبون' };
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          success: result.success,
          discount: result.discount_amount || 0,
          message: result.message || ''
        };
      }
      
      return { success: false, discount: 0, message: 'لم يتم العثور على نتيجة' };
    } catch (error) {
      console.error('Exception applying coupon:', error);
      return { success: false, discount: 0, message: 'حدث خطأ غير متوقع' };
    }
  }

  /**
   * Mark coupon as used
   */
  static async useCoupon(userId: string, couponId: string, orderId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_coupons')
        .update({
          used_at: new Date().toISOString(),
          order_id: orderId
        })
        .eq('user_id', userId)
        .eq('coupon_id', couponId);
      
      if (error) {
        console.error('Error marking coupon as used:', error);
        return false;
      }
      
      // Update coupon usage count
      const { error: updateError } = await supabase
        .rpc('increment', {
          table_name: 'coupons',
          row_id: couponId,
          column_name: 'used_count'
        });
      
      if (updateError) {
        console.error('Error updating coupon usage count:', updateError);
      }
      
      return true;
    } catch (error) {
      console.error('Exception using coupon:', error);
      return false;
    }
  }

  /**
   * Create new coupon (Admin only)
   */
  static async createCoupon(couponData: Partial<Coupon>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('coupons')
        .insert(couponData);
      
      if (error) {
        console.error('Error creating coupon:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception creating coupon:', error);
      return false;
    }
  }

  /**
   * Update coupon (Admin only)
   */
  static async updateCoupon(couponId: string, couponData: Partial<Coupon>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          ...couponData,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId);
      
      if (error) {
        console.error('Error updating coupon:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception updating coupon:', error);
      return false;
    }
  }

  /**
   * Delete coupon (Admin only)
   */
  static async deleteCoupon(couponId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);
      
      if (error) {
        console.error('Error deleting coupon:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception deleting coupon:', error);
      return false;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception marking notification as read:', error);
      return false;
    }
  }
}
