
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
      // حتى يتم إنشاء جداول الكوبونات، سنعيد بيانات تجريبية
      const mockCoupons: Coupon[] = [
        {
          id: '1',
          title: 'خصم 20% على الطلب الأول',
          title_en: '20% OFF First Order',
          description: 'احصل على خصم 20% على طلبك الأول من أي مطعم',
          description_en: 'Get 20% off your first order from any restaurant',
          discount_type: 'percentage',
          discount_value: 20,
          minimum_order: 50,
          max_uses: 100,
          used_count: 15,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'خصم 15 ST',
          title_en: '15 ST Discount',
          description: 'خصم 15 ST على الطلبات التي تزيد عن 100 ST',
          description_en: '15 ST discount on orders over 100 ST',
          discount_type: 'fixed_amount',
          discount_value: 15,
          minimum_order: 100,
          max_uses: 50,
          used_count: 8,
          expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'خصم 10% للعملاء المميزين',
          title_en: '10% OFF for VIP Customers',
          description: 'خصم خاص للعملاء الذين أكملوا أكثر من 5 طلبات',
          description_en: 'Special discount for customers who completed more than 5 orders',
          discount_type: 'percentage',
          discount_value: 10,
          minimum_order: 30,
          used_count: 25,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      return mockCoupons;
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
      // حتى يتم إنشاء جداول الكوبونات، سنعيد بيانات تجريبية
      const mockUserCoupons: UserCoupon[] = [
        {
          id: '1',
          user_id: userId,
          coupon_id: '1',
          created_at: new Date().toISOString(),
          coupon: {
            id: '1',
            title: 'خصم 20% على الطلب الأول',
            title_en: '20% OFF First Order',
            description: 'احصل على خصم 20% على طلبك الأول من أي مطعم',
            description_en: 'Get 20% off your first order from any restaurant',
            discount_type: 'percentage',
            discount_value: 20,
            minimum_order: 50,
            max_uses: 100,
            used_count: 15,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      ];
      
      return mockUserCoupons;
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
      console.log('Adding coupon to user:', { userId, couponId });
      // محاكاة نجاح العملية
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
      // محاكاة تطبيق الكوبون
      const discount = couponId === '1' ? orderTotal * 0.2 : 15;
      return {
        success: true,
        discount: Math.min(discount, orderTotal),
        message: 'تم تطبيق الكوبون بنجاح'
      };
    } catch (error) {
      console.error('Exception applying coupon:', error);
      return { success: false, discount: 0, message: 'حدث خطأ غير متوقع' };
    }
  }
}
