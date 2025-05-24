
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/products/SearchBar';
import FilterSection from '@/components/products/FilterSection';
import ProductsGrid from '@/components/products/ProductsGrid';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/types';
import AdPlaceholder from '@/components/AdPlaceholder';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSelectedCountry } from '@/components/header/HeaderActionButtons';
import { useToast } from "@/hooks/use-toast";

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Use the global country selector from the header
  const { selectedCountry: globalSelectedCountry } = useSelectedCountry();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const categoriesData = await ProductService.getCategories();
        if (categoriesData && categoriesData.length > 0) {
          // Extract category names for the filter
          const categoryNames = categoriesData.map(cat => cat.name);
          setCategories(categoryNames);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: t('error'),
          description: t('errorFetchingCategories'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, [t, toast]);

  // Filter and sort products with visual feedback
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsUpdating(true);
        
        // Use the local selectedCountry if set, otherwise use the global one
        const countryToUse = selectedCountry || globalSelectedCountry;
        
        // Get filtered products
        const filteredProducts = await ProductService.getFilteredProducts({
          search: searchTerm,
          category: selectedCategory,
          country: countryToUse
        });
        
        // Map products to match Product type
        const mappedProducts: Product[] = filteredProducts.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.image_url,
          restaurant: product.restaurants ? product.restaurants.name : t('unknown'),
          category: product.categories ? product.categories.name : t('other'),
          isAvailable: product.available,
          isFeatured: product.featured,
          available: product.available,
          bestseller: product.featured,
          discount_percent: product.discount_percent,
          ingredients: product.ingredients || [],
          discount_price: product.price * (1 - (product.discount_percent || 0) / 100)
        }));
        
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: t('error'),
          description: t('errorFetchingProducts'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsUpdating(false);
      }
    };
    
    fetchProducts();
  }, [searchTerm, selectedCategory, sortBy, selectedCountry, globalSelectedCountry, t, toast]);
  
  // Listen for country change events from header with improved visual feedback
  useEffect(() => {
    const handleCountryChanged = () => {
      // Show loading state
      setIsUpdating(true);
      
      // When country changed from header, clear the local filter
      setSelectedCountry(undefined);
    };
    
    window.addEventListener('country-changed', handleCountryChanged);
    return () => {
      window.removeEventListener('country-changed', handleCountryChanged);
    };
  }, []);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('');
    setSelectedCountry(undefined);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <Header />
      <main className={`flex-grow py-10 transition-opacity duration-300 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4 relative inline-block">
              <span className="relative z-10">{t('productsPageTitle')}</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-yellow-300/30 dark:bg-yellow-800/30 -z-0 transform -rotate-1"></span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('productsPageSubtitle')}
            </p>
          </div>

          {/* Search and filters */}
          <div className="mb-8 space-y-4">
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            
            <FilterSection 
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              categories={categories}
              handleClearFilters={handleClearFilters}
              selectedCountry={selectedCountry}
              setSelectedCountry={setSelectedCountry}
              isFiltersOpen={isFiltersOpen}
              setIsFiltersOpen={setIsFiltersOpen}
            />
          </div>

          {/* Ad Placeholder */}
          <div className="my-8">
            <AdPlaceholder />
          </div>

          {/* Products grid */}
          <ProductsGrid 
            products={products} 
            isLoading={isLoading} 
            handleClearFilters={handleClearFilters} 
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
