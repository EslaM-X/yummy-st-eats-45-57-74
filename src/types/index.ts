// Common interfaces and types used throughout the application

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  image?: string;
  imageUrl?: string;
  category?: string;
  restaurant?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  available?: boolean;
  bestseller?: boolean;
  discount_percent?: number;
  ingredients?: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  address: string;
  phone?: string;
  cuisine_type?: string[];
  opening_hours?: {
    [day: string]: { open: string; close: string }
  };
  rating?: number;
  avg_rating?: number;
  rating_count?: number;
  delivery_fee?: number;
  min_order_amount?: number;
  is_active?: boolean;
  // Additional properties needed for RestaurantCard and other components
  country?: string;
  imageUrl?: string;
  isNew?: boolean;
  discount?: string;
  cuisine?: string;
  deliveryTime?: string;
}

export interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  total_amount: number;
  status: 'new' | 'processing' | 'on_the_way' | 'delivered' | 'cancelled';
  payment_method: 'card' | 'cash';
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
  items: any[];
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_notes?: string;
  restaurants?: Restaurant;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_price: number;
  quantity: number;
  notes?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  username?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  user_type?: 'customer' | 'restaurant_owner' | 'admin';
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transaction_type: 'payment' | 'refund';
  payment_method: string;
  order_id?: string;
  transaction_ref?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface RewardPoints {
  id: string;
  user_id: string;
  points: number;
  lifetime_points: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Location {
  id: string;
  name: string;
  type: 'country' | 'city' | 'area';
  parent_id?: string;
  delivery_available: boolean;
  delivery_fee: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

// Added interfaces for the rewards system
export interface UserReward {
  id: string;
  name: string;
  description: string;
  points: number;
  type: string;
  imageUrl: string;
  expiryDate: string;
}

export interface PointTransaction {
  id: string;
  type: 'earned' | 'redeemed';
  points: number;
  description: string;
  date: string;
}

export interface RewardTier {
  name: string;
  pointsRequired: number;
  icon: string;
  benefits: string[];
}

// Updated UserPoints interface to include progression attributes
export interface UserPoints {
  id: string;
  user_id: string;
  total: number;
  tier: RewardTier;
  nextTier?: RewardTier | null;
  pointsToNextTier?: number;
  progressPercentage?: number;
}
