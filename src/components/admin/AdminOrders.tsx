
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import OrdersFilter from './orders/OrdersFilter';
import OrdersTable from './orders/OrdersTable';
import { Order, OrderItem } from '@/types/admin';
import { AdminService } from '@/services/AdminService';

const AdminOrders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log("Fetching orders from AdminService...");
      
      const data = await AdminService.getAllOrders();
      console.log("Orders data fetched:", data);
      
      if (data && data.length > 0) {
        const formattedOrders = data.map((order) => {
          const formattedItems: OrderItem[] = Array.isArray(order.items) ? 
            order.items.map((item: any) => ({
              name: item.name || 'منتج',
              quantity: item.quantity || 1,
              price: item.price || 0
            })) : [];

          return {
            id: order.id,
            customer: {
              name: order.profiles?.full_name || order.customer_name || 'عميل',
              address: order.delivery_address || 'عنوان التوصيل',
              phone: order.profiles?.phone || order.customer_phone || '05xxxxxxxx',
            },
            restaurant: {
              name: order.restaurants?.name || 'مطعم',
              address: order.restaurants?.address || 'عنوان المطعم',
            },
            items: formattedItems,
            status: mapOrderStatus(order.status),
            paymentMethod: mapPaymentMethod(order.payment_method),
            total: order.total_amount || 0,
            orderDate: formatOrderDate(order.created_at),
            deliveryTime: order.delivered_at ? formatOrderDate(order.delivered_at) : null,
          } as Order;
        });
        
        console.log("Formatted orders:", formattedOrders);
        setOrders(formattedOrders);
      } else {
        console.log("No orders found");
        setOrders([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: "خطأ في تحميل الطلبات",
        description: error.message || "حدث خطأ أثناء تحميل الطلبات",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // تنسيق حالة الطلب للواجهة العربية
  const mapOrderStatus = (status: string): Order['status'] => {
    switch (status?.toLowerCase()) {
      case 'new': return 'جديد';
      case 'preparing': return 'قيد التحضير';
      case 'delivering': return 'قيد التوصيل';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return 'جديد';
    }
  };

  // تنسيق طريقة الدفع للواجهة العربية
  const mapPaymentMethod = (method: string): Order['paymentMethod'] => {
    switch (method?.toLowerCase()) {
      case 'card': return 'بطاقة';
      case 'cash': return 'نقداً عند الاستلام';
      case 'wallet': return 'محفظة إلكترونية';
      default: return 'بطاقة';
    }
  };

  // تنسيق تاريخ الطلب
  const formatOrderDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      return dateString || '';
    }
  };

  // تصفية الطلبات حسب البحث، التبويب والتاريخ
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = selectedTab === 'all' ||
                      (selectedTab === 'new' && order.status === 'جديد') ||
                      (selectedTab === 'preparing' && order.status === 'قيد التحضير') ||
                      (selectedTab === 'delivering' && order.status === 'قيد التوصيل') ||
                      (selectedTab === 'completed' && order.status === 'مكتمل') ||
                      (selectedTab === 'cancelled' && order.status === 'ملغي');
    
    // للتبسيط، لم نقم بتنفيذ تصفية التاريخ الفعلية
    const matchesDate = dateFilter === 'all';
    
    return matchesSearch && matchesTab && matchesDate;
  });

  // دوال للإجراءات
  const handleViewOrder = (orderId: string) => {
    toast({
      title: "عرض تفاصيل الطلب",
      description: `تم فتح تفاصيل الطلب ${orderId}`,
    });
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // تحويل حالة الطلب إلى الصيغة المناسبة لقاعدة البيانات
      let dbStatus = '';
      switch (newStatus) {
        case 'جديد': dbStatus = 'new'; break;
        case 'قيد التحضير': dbStatus = 'preparing'; break;
        case 'قيد التوصيل': dbStatus = 'delivering'; break;
        case 'مكتمل': dbStatus = 'completed'; break;
        case 'ملغي': dbStatus = 'cancelled'; break;
        default: dbStatus = 'new';
      }
      
      console.log(`Updating order ${orderId} status to ${dbStatus}`);
      
      await AdminService.updateOrderStatus(orderId, dbStatus);
      
      // تحديث الحالة محليًا في حالة النجاح
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // عرض رسالة نجاح
      toast({
        title: "تحديث حالة الطلب",
        description: `تم تحديث حالة الطلب ${orderId} إلى ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Error in updating order status:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: error.message || "حدث خطأ أثناء تحديث حالة الطلب",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>الطلبات ({orders.length})</CardTitle>
          <OrdersFilter 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="mr-3 text-lg">جاري تحميل الطلبات...</span>
            </div>
          ) : (
            <OrdersTable 
              orders={filteredOrders} 
              onViewOrder={handleViewOrder}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;
