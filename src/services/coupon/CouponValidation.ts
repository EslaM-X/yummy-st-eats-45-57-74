
import { supabase } from '@/integrations/supabase/client';
import { Coupon } from './CouponTypes';

export class CouponValidation {
  // تطبيق كوبون والحصول على قيمة الخصم
  static async applyCoupon(couponCode: string, orderAmount: number, userId: string): Promise<{
    success: boolean;
    discount: number;
    coupon?: Coupon;
    message?: string;
  }> {
    try {
      // البحث عن الكوبون
      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();

      if (couponError || !couponData) {
        return {
          success: false,
          discount: 0,
          message: 'كوبون غير صحيح أو منتهي الصلاحية'
        };
      }

      const coupon: Coupon = {
        ...couponData,
        discount_type: couponData.discount_type as 'percentage' | 'fixed_amount'
      };

      // التحقق من انتهاء صلاحية الكوبون
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return {
          success: false,
          discount: 0,
          message: 'انتهت صلاحية هذا الكوبون'
        };
      }

      // التحقق من الحد الأدنى للطلب
      if (orderAmount < coupon.minimum_order) {
        return {
          success: false,
          discount: 0,
          message: `الحد الأدنى للطلب ${coupon.minimum_order} ريال`
        };
      }

      // التحقق من عدد مرات الاستخدام
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return {
          success: false,
          discount: 0,
          message: 'تم استخدام هذا الكوبون بالكامل'
        };
      }

      // التحقق من استخدام المستخدم للكوبون من قبل
      const { data: usageData } = await supabase
        .from('user_coupons')
        .select('*')
        .eq('user_id', userId)
        .eq('coupon_id', coupon.id)
        .not('used_at', 'is', null);

      if (usageData && usageData.length > 0) {
        return {
          success: false,
          discount: 0,
          message: 'تم استخدام هذا الكوبون من قبل'
        };
      }

      // حساب قيمة الخصم
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (orderAmount * coupon.discount_value) / 100;
      } else {
        discount = coupon.discount_value;
      }

      // التأكد من أن الخصم لا يتجاوز قيمة الطلب
      discount = Math.min(discount, orderAmount);

      return {
        success: true,
        discount,
        coupon
      };
    } catch (error) {
      console.error('Error applying coupon:', error);
      return {
        success: false,
        discount: 0,
        message: 'حدث خطأ أثناء تطبيق الكوبون'
      };
    }
  }

  // استخدام كوبون (عند إكمال الطلب)
  static async useCoupon(couponId: string, userId: string, orderId: string, discountAmount: number): Promise<boolean> {
    try {
      // تسجيل استخدام الكوبون
      const { error: usageError } = await supabase
        .from('user_coupons')
        .update({
          used_at: new Date().toISOString(),
          order_id: orderId
        })
        .eq('coupon_id', couponId)
        .eq('user_id', userId);

      if (usageError) {
        console.error('Error recording coupon usage:', usageError);
        return false;
      }

      // إضافة سجل في جدول coupon_usage
      const { error: historyError } = await supabase
        .from('coupon_usage')
        .insert({
          coupon_id: couponId,
          user_id: userId,
          order_id: orderId,
          discount_amount: discountAmount
        });

      if (historyError) {
        console.error('Error creating coupon usage history:', historyError);
        return false;
      }

      // زيادة عداد الاستخدام للكوبون
      const { data: currentCoupon } = await supabase
        .from('coupons')
        .select('used_count')
        .eq('id', couponId)
        .single();

      if (currentCoupon) {
        const { error: updateError } = await supabase
          .from('coupons')
          .update({
            used_count: currentCoupon.used_count + 1
          })
          .eq('id', couponId);

        if (updateError) {
          console.error('Error incrementing coupon usage:', updateError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Exception using coupon:', error);
      return false;
    }
  }
}
