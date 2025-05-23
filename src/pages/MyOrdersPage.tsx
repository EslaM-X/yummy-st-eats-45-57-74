
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import OrderTabs from '@/components/orders/OrderTabs';
import OrderList from '@/components/orders/OrderList';
import { useLanguage } from '@/contexts/LanguageContext';
import { OrderService } from '@/services/OrderService';

const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchOrders();
  }, [user, navigate, activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const status = activeTab !== 'all' ? activeTab : undefined;
      const { data, error } = await OrderService.getUserOrders(status);
      
      if (error) throw error;
      
      console.log('Orders fetched:', data);
      
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: language === 'en' ? "Error fetching orders" : "خطأ في جلب الطلبات",
        description: language === 'en' 
          ? "An error occurred while trying to fetch your orders. Please try again." 
          : "حدث خطأ أثناء محاولة جلب طلباتك. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/my-orders/${orderId}`);
  };

  // Updated pageTitle to use a more descriptive variable name
  const ordersPageTitle = language === 'en' ? 'My Orders' : 'طلباتي';

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-grow py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            {ordersPageTitle}
          </h1>

          <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <OrderList 
            orders={orders} 
            onViewOrder={handleViewOrder} 
            loading={loading}
            activeTab={activeTab}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyOrdersPage;
