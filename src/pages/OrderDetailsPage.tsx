
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from "@/hooks/use-toast";
import { OrderService } from '@/services/OrderService';
import { useAuth } from '@/contexts/AuthContext';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import OrderDetailsSkeleton from '@/components/orders/OrderDetailsSkeleton';
import OrderNotFound from '@/components/orders/OrderNotFound';
import RestaurantInfo from '@/components/orders/RestaurantInfo';
import OrderDetailsContent from '@/components/orders/OrderDetailsContent';
import OrderDetailActions from '@/components/orders/OrderDetailActions';
import { useLanguage } from '@/contexts/LanguageContext';

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId, user, navigate]);

  const fetchOrderDetails = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await OrderService.getOrderById(id);
      
      if (error) throw error;
      if (!data) {
        throw new Error(language === 'en' ? 'Order not found' : 'لم يتم العثور على الطلب');
      }
      
      // Log to help debug
      console.log('Order details fetched:', data);
      
      setOrder(data);
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      toast({
        title: language === 'en' ? "Error fetching order details" : "خطأ في جلب تفاصيل الطلب",
        description: error.message || (language === 'en' 
          ? "An error occurred while trying to fetch order details" 
          : "حدث خطأ أثناء محاولة جلب تفاصيل الطلب"),
        variant: "destructive",
      });
      navigate('/my-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !orderId) return;
    
    const confirmMessage = language === 'en' 
      ? 'Are you sure you want to cancel this order?' 
      : 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟';
    
    if (window.confirm(confirmMessage)) {
      try {
        const { success, error } = await OrderService.cancelOrder(orderId);
        
        if (!success || error) {
          throw error || new Error(language === 'en' ? 'Failed to cancel order' : 'فشل إلغاء الطلب');
        }
        
        toast({
          title: language === 'en' ? "Order Cancelled Successfully" : "تم إلغاء الطلب بنجاح",
          description: language === 'en' ? "Your order has been cancelled successfully" : "تم إلغاء طلبك بنجاح",
        });
        
        // Fetch updated order details
        fetchOrderDetails(orderId);
      } catch (error: any) {
        console.error('Error cancelling order:', error);
        toast({
          title: language === 'en' ? "Failed to Cancel Order" : "فشل إلغاء الطلب",
          description: error.message || (language === 'en' 
            ? "An error occurred while trying to cancel the order" 
            : "حدث خطأ أثناء محاولة إلغاء الطلب"),
          variant: "destructive",
        });
      }
    }
  };

  const handleBackToOrders = () => {
    navigate('/my-orders');
  };

  const pageTitle = language === 'en' ? "Order Details" : "تفاصيل الطلب";
  const orderNumberLabel = language === 'en' ? "Order Number: " : "رقم الطلب: ";

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="flex-grow py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <OrderDetailsSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="flex-grow py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <OrderNotFound onBack={handleBackToOrders} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-grow py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  {pageTitle}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {orderNumberLabel}<span className="font-medium">{order.id}</span>
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <OrderStatusBadge status={order.status} className="text-sm" />
              </div>
            </div>
            
            <RestaurantInfo restaurant={order.restaurants || {}} />
            
            <OrderDetailsContent order={order} />
            
            <OrderDetailActions 
              orderStatus={order.status}
              onBack={handleBackToOrders}
              onCancel={handleCancelOrder}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetailsPage;
