
export interface Coupon {
  id: string;
  title: string;
  description?: string;
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

export interface PendingRestaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  image_url?: string;
  cuisine_type?: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingFood {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
  restaurant_id?: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'coupon' | 'approval';
  is_read: boolean;
  related_id?: string;
  created_at: string;
}

export interface AdminSettings {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
  updated_by?: string;
  updated_at: string;
}
