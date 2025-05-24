
import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  title: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_order: number;
  max_uses?: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  code: string;
}

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  used_at?: string;
  order_id?: string;
  created_at: string;
  coupon?: Coupon;
}

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
      // Get coupon details
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .eq('is_active', true)
        .single();

      if (couponError || !coupon) {
        return { success: false, discount: 0, message: 'كوبون غير صالح أو منتهي الصلاحية' };
      }

      // Check if coupon has expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { success: false, discount: 0, message: 'انتهت صلاحية الكوبون' };
      }

      // Check minimum order amount
      if (orderTotal < coupon.minimum_order) {
        return { 
          success: false, 
          discount: 0, 
          message: `الحد الأدنى للطلب هو ${coupon.minimum_order} ريال` 
        };
      }

      // Check if user already has this coupon
      const { data: userCoupon } = await supabase
        .from('user_coupons')
        .select('*')
        .eq('user_id', userId)
        .eq('coupon_id', couponId)
        .single();

      if (!userCoupon) {
        return { success: false, discount: 0, message: 'ليس لديك هذا الكوبون' };
      }

      if (userCoupon.used_at) {
        return { success: false, discount: 0, message: 'تم استخدام هذا الكوبون من قبل' };
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = orderTotal * (coupon.discount_value / 100);
      } else {
        discount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed order total
      discount = Math.min(discount, orderTotal);

      return {
        success: true,
        discount: discount,
        message: 'تم تطبيق الكوبون بنجاح'
      };
    } catch (error) {
      console.error('Exception applying coupon:', error);
      return { success: false, discount: 0, message: 'حدث خطأ غير متوقع' };
    }
  }

  /**
   * Create new coupon (Admin only)
   */
  static async createCoupon(couponData: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'used_count'>): Promise<Coupon | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          ...couponData,
          used_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating coupon:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception creating coupon:', error);
      return null;
    }
  }

  /**
   * Update coupon (Admin only)
   */
  static async updateCoupon(couponId: string, updates: Partial<Coupon>): Promise<Coupon | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', couponId)
        .select()
        .single();

      if (error) {
        console.error('Error updating coupon:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception updating coupon:', error);
      return null;
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
   * Mark coupon as used
   */
  static async markCouponAsUsed(userId: string, couponId: string, orderId: string): Promise<boolean> {
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

      // Increment coupon usage count
      await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });

      return true;
    } catch (error) {
      console.error('Exception marking coupon as used:', error);
      return false;
    }
  }
}
