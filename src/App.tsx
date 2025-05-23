
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from '@/components/ScrollToTop';

// Pages
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import RestaurantsPage from './pages/RestaurantsPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import RegisterRestaurantPage from './pages/RegisterRestaurantPage';
import CouponsPage from './pages/CouponsPage'; // تم استبدال RewardsPage بـ CouponsPage
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import AddFoodPage from './pages/AddFoodPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import OrdersPage from './pages/OrdersPage';

// Components
import MobileNavBar from './components/MobileNavBar';
import { useAuth } from './contexts/AuthContext';

function App() {
  const [showMobileNav, setShowMobileNav] = useState(true);
  const { user, isLoading } = useAuth();

  // إخفاء شريط التنقل في الجوال للصفحات المحددة
  useEffect(() => {
    const hideNavOnPages = ['/admin', '/admin-login', '/reset-password'];
    const checkPath = () => {
      const currentPath = window.location.pathname;
      const shouldHide = hideNavOnPages.some(page => currentPath.startsWith(page));
      setShowMobileNav(!shouldHide);
    };

    checkPath(); // التحقق عند التحميل
    window.addEventListener('popstate', checkPath); // التحقق عند تغيير المسار

    return () => {
      window.removeEventListener('popstate', checkPath);
    };
  }, []);

  // عارض التحميل الأولي
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route 
          path="/checkout" 
          element={user ? <CheckoutPage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/register-restaurant" 
          element={user ? <RegisterRestaurantPage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/profile" 
          element={user ? <ProfilePage /> : <Navigate to="/auth" />} 
        />
        <Route path="/coupons" element={<CouponsPage />} /> {/* تم استبدال /rewards بـ /coupons */}
        {/* إعادة توجيه المكافآت إلى الكوبونات للحفاظ على الروابط القديمة */}
        <Route path="/rewards" element={<Navigate to="/coupons" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/add-food" element={<AddFoodPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-conditions" element={<TermsConditionsPage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route 
          path="/my-orders" 
          element={user ? <MyOrdersPage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/order/:orderId" 
          element={user ? <OrderDetailsPage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/orders" 
          element={user ? <OrdersPage /> : <Navigate to="/auth" />} 
        />
        {/* تم حذف مسار /team */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {showMobileNav && <MobileNavBar />}
      <Toaster />
    </Router>
  );
}

export default App;
