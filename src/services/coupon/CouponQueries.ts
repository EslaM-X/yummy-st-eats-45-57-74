
import { supabase } from '@/integrations/supabase/client';
import { Coupon, UserCoupon, CouponUsage } from './CouponTypes';

export class CouponQueries {
  // جلب جميع الكوبونات النشطة
  static async getActiveCoupons(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gte.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active coupons:', error);
        return [];
      }

      return (data || []).map(coupon => ({
        ...coupon,
        discount_type: coupon.discount_type as 'percentage' | 'fixed_amount'
      }));
    } catch (error) {
      console.error('Exception fetching active coupons:', error);
      return [];
    }
  }

  // جلب كوبونات المستخدم
  static async getUserCoupons(userId: string): Promise<UserCoupon[]> {
    try {
      const { data, error } = await supabase
        .from('user_coupons')
        .select(`
          *,
          coupon:coupon_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user coupons:', error);
        return [];
      }

      return (data || []).map(userCoupon => ({
        ...userCoupon,
        coupon: {
          ...userCoupon.coupon,
          discount_type: userCoupon.coupon.discount_type as 'percentage' | 'fixed_amount'
        }
      })) as UserCoupon[];
    } catch (error) {
      console.error('Exception fetching user coupons:', error);
      return [];
    }
  }

  // جلب تاريخ استخدام الكوبونات
  static async getCouponUsageHistory(couponId?: string): Promise<CouponUsage[]> {
    try {
      let query = supabase
        .from('coupon_usage')
        .select('*')
        .order('used_at', { ascending: false });

      if (couponId) {
        query = query.eq('coupon_id', couponId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching coupon usage history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching coupon usage history:', error);
      return [];
    }
  }
}
