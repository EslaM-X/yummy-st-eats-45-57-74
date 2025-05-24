import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  code: string;
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
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface UserCoupon {
  id: string;
  user_id: string;
  coupon_id: string;
  used_at?: string;
  order_id?: string;
  created_at: string;
  coupon: Coupon;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id?: string;
  discount_amount: number;
  used_at: string;
}

export class CouponService {
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
      const { error: updateError } = await supabase
        .from('coupons')
        .update({
          used_count: supabase.sql`used_count + 1`
        })
        .eq('id', couponId);

      if (updateError) {
        console.error('Error incrementing coupon usage:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception using coupon:', error);
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
