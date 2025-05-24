
import { ProductQueries } from './product/ProductQueries';
import { ProductMutations } from './product/ProductMutations';
import { CategoryService } from './product/CategoryService';
import { Product, Category, ProductFilters } from '@/types/product-service';

export class ProductService {
  // Product queries
  static getAllProducts = ProductQueries.getAllProducts;
  static getProductById = ProductQueries.getProductById;
  static getFilteredProducts = ProductQueries.getFilteredProducts;

  // Product mutations
  static createProduct = ProductMutations.createProduct;
  static updateProduct = ProductMutations.updateProduct;
  static deleteProduct = ProductMutations.deleteProduct;

  // Category operations
  static getCategories = CategoryService.getCategories;
}

// Export functions for backward compatibility
export const getCategories = ProductService.getCategories;
export const getFilteredProducts = ProductService.getFilteredProducts;

// Export types
export type { Product, Category, ProductFilters };
