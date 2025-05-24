
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
   * جلب جميع الكوبونات النشطة
   */
  static async getActiveCoupons(): Promise<Coupon[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coupons:', error);
        return [];
      }

      return (data || []).map(coupon => ({
        ...coupon,
        discount_type: coupon.discount_type as 'percentage' | 'fixed_amount'
      }));
    } catch (error) {
      console.error('Exception fetching coupons:', error);
      return [];
    }
  }

  /**
   * جلب كوبونات المستخدم المتاحة
   */
  static async getUserCoupons(userId?: string): Promise<UserCoupon[]> {
    try {
      if (!userId) {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return [];
        userId = user.user.id;
      }

      const { data, error } = await supabase
        .from('user_coupons')
        .select(`
          *,
          coupon:coupon_id (*)
        `)
        .eq('user_id', userId)
        .is('used_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user coupons:', error);
        return [];
      }

      // فلترة الكوبونات المنتهية الصلاحية وتطبيق نوع البيانات الصحيح
      const validCoupons = (data || []).filter(userCoupon => {
        const coupon = userCoupon.coupon;
        if (!coupon) return false;
        
        // التحقق من انتهاء الصلاحية
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          return false;
        }
        
        // التحقق من حد الاستخدام
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
          return false;
        }
        
        return coupon.is_active;
      }).map(userCoupon => ({
        ...userCoupon,
        coupon: userCoupon.coupon ? {
          ...userCoupon.coupon,
          discount_type: userCoupon.coupon.discount_type as 'percentage' | 'fixed_amount'
        } : undefined
      }));

      return validCoupons;
    } catch (error) {
      console.error('Exception fetching user coupons:', error);
      return [];
    }
  }

  /**
   * إضافة كوبون لحساب المستخدم
   */
  static async addCouponToUser(userId: string, couponCode: string): Promise<{success: boolean, message: string}> {
    try {
      // البحث عن الكوبون بالكود
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();

      if (couponError || !coupon) {
        return { success: false, message: 'كود الكوبون غير صحيح أو منتهي الصلاحية' };
      }

      // التحقق من انتهاء الصلاحية
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { success: false, message: 'انتهت صلاحية هذا الكوبون' };
      }

      // التحقق من حد الاستخدام
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return { success: false, message: 'تم استنفاد عدد مرات استخدام هذا الكوبون' };
      }

      // التحقق من عدم وجود الكوبون مسبقاً للمستخدم
      const { data: existingCoupon } = await supabase
        .from('user_coupons')
        .select('id')
        .eq('user_id', userId)
        .eq('coupon_id', coupon.id)
        .single();

      if (existingCoupon) {
        return { success: false, message: 'لديك هذا الكوبون بالفعل' };
      }

      // إضافة الكوبون للمستخدم
      const { error } = await supabase
        .from('user_coupons')
        .insert({
          user_id: userId,
          coupon_id: coupon.id
        });

      if (error) {
        console.error('Error adding coupon to user:', error);
        return { success: false, message: 'حدث خطأ أثناء إضافة الكوبون' };
      }

      // إرسال إشعار للمستخدم
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          notification_type: 'coupon',
          title: 'تم إضافة كوبون جديد',
          message: `تم إضافة كوبون "${coupon.title}" بنجاح`,
          reference_id: coupon.id
        });

      return { success: true, message: 'تم إضافة الكوبون بنجاح' };
    } catch (error) {
      console.error('Exception adding coupon to user:', error);
      return { success: false, message: 'حدث خطأ غير متوقع' };
    }
  }

  /**
   * تطبيق كوبون على طلب
   */
  static async applyCoupon(
    userId: string, 
    couponId: string, 
    orderTotal: number
  ): Promise<{success: boolean, discount: number, message: string}> {
    try {
      // الحصول على تفاصيل الكوبون
      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .eq('is_active', true)
        .single();

      if (couponError || !couponData) {
        return { success: false, discount: 0, message: 'كوبون غير صالح أو منتهي الصلاحية' };
      }

      const coupon: Coupon = {
        ...couponData,
        discount_type: couponData.discount_type as 'percentage' | 'fixed_amount'
      };

      // التحقق من انتهاء الصلاحية
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { success: false, discount: 0, message: 'انتهت صلاحية الكوبون' };
      }

      // التحقق من الحد الأدنى للطلب
      if (orderTotal < coupon.minimum_order) {
        return { 
          success: false, 
          discount: 0, 
          message: `الحد الأدنى للطلب هو ${coupon.minimum_order} ريال` 
        };
      }

      // التحقق من وجود الكوبون للمستخدم وعدم استخدامه
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

      // حساب قيمة الخصم
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = orderTotal * (coupon.discount_value / 100);
      } else {
        discount = coupon.discount_value;
      }

      // التأكد من عدم تجاوز قيمة الخصم قيمة الطلب
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
   * إنشاء كوبون جديد (للإدارة فقط)
   */
  static async createCoupon(couponData: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'used_count'>): Promise<Coupon | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const { data, error } = await supabase
        .from('coupons')
        .insert({
          ...couponData,
          used_count: 0,
          created_by: user.user.id
        })
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

  /**
   * تحديث كوبون (للإدارة فقط)
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

      return {
        ...data,
        discount_type: data.discount_type as 'percentage' | 'fixed_amount'
      };
    } catch (error) {
      console.error('Exception updating coupon:', error);
      return null;
    }
  }

  /**
   * حذف كوبون (للإدارة فقط)
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
   * وضع علامة على الكوبون كمستخدم
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

      // زيادة عداد استخدام الكوبون
      await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });

      return true;
    } catch (error) {
      console.error('Exception marking coupon as used:', error);
      return false;
    }
  }

  /**
   * جلب إحصائيات الكوبونات (للإدارة)
   */
  static async getCouponStats() {
    try {
      const { data: coupons } = await supabase
        .from('coupons')
        .select('*');

      const totalCoupons = coupons?.length || 0;
      const activeCoupons = coupons?.filter(c => c.is_active).length || 0;
      const totalUsage = coupons?.reduce((sum, c) => sum + c.used_count, 0) || 0;

      const { count: distributedCoupons } = await supabase
        .from('user_coupons')
        .select('*', { count: 'exact', head: true });

      return {
        totalCoupons,
        activeCoupons,
        distributedCoupons: distributedCoupons || 0,
        totalUsage
      };
    } catch (error) {
      console.error('Error fetching coupon stats:', error);
      return {
        totalCoupons: 0,
        activeCoupons: 0,
        distributedCoupons: 0,
        totalUsage: 0
      };
    }
  }

  /**
   * توزيع كوبون على جميع المستخدمين (للإدارة)
   */
  static async distributeCouponToAllUsers(couponId: string): Promise<{success: boolean, message: string}> {
    try {
      // جلب جميع المستخدمين
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'customer');

      if (!users || users.length === 0) {
        return { success: false, message: 'لا يوجد مستخدمين لتوزيع الكوبون عليهم' };
      }

      // إنشاء كوبونات للمستخدمين
      const userCoupons = users.map(user => ({
        user_id: user.id,
        coupon_id: couponId
      }));

      const { error } = await supabase
        .from('user_coupons')
        .insert(userCoupons);

      if (error) {
        console.error('Error distributing coupon:', error);
        return { success: false, message: 'حدث خطأ أثناء توزيع الكوبون' };
      }

      // إرسال إشعارات للمستخدمين
      const { data: coupon } = await supabase
        .from('coupons')
        .select('title')
        .eq('id', couponId)
        .single();

      if (coupon) {
        const notifications = users.map(user => ({
          user_id: user.id,
          notification_type: 'coupon',
          title: 'كوبون خصم جديد',
          message: `تم إضافة كوبون "${coupon.title}" إلى حسابك`,
          reference_id: couponId
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      return { 
        success: true, 
        message: `تم توزيع الكوبون على ${users.length} مستخدم بنجاح` 
      };
    } catch (error) {
      console.error('Exception distributing coupon:', error);
      return { success: false, message: 'حدث خطأ غير متوقع' };
    }
  }
}
