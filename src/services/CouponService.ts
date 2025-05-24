
import { CouponQueries } from './coupon/CouponQueries';
import { CouponMutations } from './coupon/CouponMutations';
import { CouponValidation } from './coupon/CouponValidation';

// Re-export types for backward compatibility
export type { Coupon, UserCoupon, CouponUsage } from './coupon/CouponTypes';

export class CouponService {
  // Query operations
  static getActiveCoupons = CouponQueries.getActiveCoupons;
  static getUserCoupons = CouponQueries.getUserCoupons;
  static getCouponUsageHistory = CouponQueries.getCouponUsageHistory;

  // Mutation operations
  static createCoupon = CouponMutations.createCoupon;
  static updateCoupon = CouponMutations.updateCoupon;
  static deleteCoupon = CouponMutations.deleteCoupon;
  static addCouponToUser = CouponMutations.addCouponToUser;

  // Validation operations
  static applyCoupon = CouponValidation.applyCoupon;
  static useCoupon = CouponValidation.useCoupon;
}
