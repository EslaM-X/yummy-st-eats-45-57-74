
export interface Category {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  logo_url?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  available: boolean;
  restaurant_id?: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
  restaurants?: Restaurant;
  categories?: { id: string; name: string; };
  featured?: boolean;
}

export interface ProductFilters {
  category?: string;
  country?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
}
