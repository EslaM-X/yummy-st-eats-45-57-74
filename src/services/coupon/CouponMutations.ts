
import { supabase } from '@/integrations/supabase/client';
import { Coupon } from './CouponTypes';

export class CouponMutations {
  // إنشاء كوبون جديد (للإدارة)
  static async createCoupon(couponData: Partial<Coupon>): Promise<Coupon | null> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          code: couponData.code,
          title: couponData.title,
          title_en: couponData.title_en,
          description: couponData.description,
          description_en: couponData.description_en,
          discount_type: couponData.discount_type,
          discount_value: couponData.discount_value,
          minimum_order: couponData.minimum_order || 0,
          max_uses: couponData.max_uses,
          expires_at: couponData.expires_at,
          is_active: true,
          used_count: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating coupon:', error);
        return null;
      }

      return {
        ...data,
        discount_type: data.discount_type as 'percentage' | 'fixed_amount'
      };
    } catch (error) {
      console.error('Exception creating coupon:', error);
      return null;
    }
  }

  // تحديث كوبون
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

      return {
        ...data,
        discount_type: data.discount_type as 'percentage' | 'fixed_amount'
      };
    } catch (error) {
      console.error('Exception updating coupon:', error);
      return null;
    }
  }

  // حذف كوبون
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

  // إضافة كوبون للمستخدم
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
}
