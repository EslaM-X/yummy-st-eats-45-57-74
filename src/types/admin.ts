
// تعريفات إضافية لمساعدة مكون AdminOrders

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    address: string;
    phone: string;
  };
  restaurant: {
    name: string;
    address: string;
  };
  items: OrderItem[];
  status: 'جديد' | 'قيد التحضير' | 'قيد التوصيل' | 'مكتمل' | 'ملغي';
  paymentMethod: 'بطاقة' | 'نقداً عند الاستلام' | 'محفظة إلكترونية';
  total: number;
  orderDate: string;
  deliveryTime: string | null;
}

// تعريفات المطاعم والأطعمة المعلقة
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
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// تعريفات إعدادات الإدارة المُحدثة
export interface AdminSettings {
  general: {
    appName: string;
    adminEmail: string;
    supportPhone: string;
    maxDistance: number;
    defaultLanguage: 'ar' | 'en';
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    orderUpdates: boolean;
    marketingEmails: boolean;
  };
  payment: {
    acceptCreditCards: boolean;
    acceptCashOnDelivery: boolean;
    acceptWallet: boolean;
    commissionRate: number;
    vatRate: number;
  };
  security: {
    twoFactorAuth: boolean;
    requireStrongPasswords: boolean;
    sessionTimeout: number;
  };
}
