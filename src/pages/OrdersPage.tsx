
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from "@/hooks/use-toast";
import { OrderService } from '@/services/OrderService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import OrderTabs from '@/components/orders/OrderTabs';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import EmptyOrderState from '@/components/orders/EmptyOrderState';
import { formatDate } from '@/utils/formatUtils';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchOrders();
  }, [user, navigate, activeTab]);

  const fetchOrders = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const ordersData = await OrderService.getUserOrders(user.id);
      
      setOrders(ordersData || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "خطأ في جلب الطلبات",
        description: "حدث خطأ أثناء محاولة جلب طلباتك. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/my-orders/${orderId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-grow py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            قائمة الطلبات
          </h1>

          <OrderTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {loading ? (
            // Loading skeleton for table
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : orders.length > 0 ? (
            // Orders table
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">رقم الطلب</TableHead>
                    <TableHead className="font-semibold">المطعم</TableHead>
                    <TableHead className="font-semibold">التاريخ</TableHead>
                    <TableHead className="font-semibold">المبلغ</TableHead>
                    <TableHead className="font-semibold">الحالة</TableHead>
                    <TableHead className="text-center font-semibold">التفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                      <TableCell>{order.restaurants?.name || 'مطعم'}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{order.total_amount} ST</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOrder(order.id)}
                          className="text-yellow-700 border-yellow-700 hover:bg-yellow-50 hover:text-yellow-800 dark:text-yellow-500 dark:border-yellow-500 dark:hover:bg-yellow-950"
                        >
                          عرض التفاصيل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyOrderState activeTab={activeTab} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrdersPage;
