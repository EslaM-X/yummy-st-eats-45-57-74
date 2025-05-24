
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from './dashboard/StatCard';
import OrderStatusChart from './dashboard/OrderStatusChart';
import SalesChart from './dashboard/SalesChart';
import TopRestaurants from './dashboard/TopRestaurants';
import SystemAlerts from './dashboard/SystemAlerts';
import RecentOrders from './dashboard/RecentOrders';
import TransactionStats from './dashboard/TransactionStats';
import { Users, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// تعريف نوع Alert
type Alert = {
  type: "error" | "success" | "warning" | "info";
  title: string;
  message: string;
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    usersCount: 0,
    ordersCount: 0,
    totalSales: 0,
    restaurantsCount: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState<Alert[]>([
    { type: "info", title: 'مرحباً بك', message: 'تم ربط لوحة الإدارة بقاعدة البيانات بنجاح' },
  ]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // جلب عدد المستخدمين
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // جلب عدد الطلبات
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // جلب عدد المطاعم
      const { count: restaurantsCount } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true });

      // جلب إجمالي المبيعات
      const { data: salesData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'completed');

      const totalSales = salesData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // جلب الطلبات المعلقة
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      // جلب أفضل المطاعم
      const { data: restaurantsData } = await supabase
        .from('restaurants')
        .select('name, avg_rating, id')
        .order('avg_rating', { ascending: false })
        .limit(5);

      // جلب بيانات المبيعات الأسبوعية
      const { data: weeklyOrders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // تجميع المبيعات حسب اليوم
      const salesByDay = weeklyOrders?.reduce((acc, order) => {
        const day = new Date(order.created_at).toLocaleDateString('ar-SA', { weekday: 'long' });
        acc[day] = (acc[day] || 0) + order.total_amount;
        return acc;
      }, {} as Record<string, number>) || {};

      const formattedSalesData = Object.entries(salesByDay).map(([day, amount]) => ({
        day,
        amount
      }));

      setStats({
        usersCount: usersCount || 0,
        ordersCount: ordersCount || 0,
        totalSales,
        restaurantsCount: restaurantsCount || 0,
        pendingOrders: pendingOrders || 0,
      });

      setTopRestaurants(restaurantsData || []);
      setSalesData(formattedSalesData);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setSystemAlerts(prev => [...prev, {
        type: "error",
        title: "خطأ في تحميل البيانات",
        message: "حدث خطأ أثناء جلب إحصائيات لوحة التحكم"
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة التحكم</h1>
      </div>
      
      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="المستخدمين"
          value={stats.usersCount.toLocaleString()}
          trend={`${stats.usersCount} مستخدم مسجل`}
          icon={<Users className="h-5 w-5" />}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconTextColor="text-blue-700 dark:text-blue-400"
        />
        <StatCard
          title="الطلبات"
          value={stats.ordersCount.toLocaleString()}
          trend={`${stats.pendingOrders} طلب معلق`}
          icon={<ShoppingBag className="h-5 w-5" />}
          iconBgColor="bg-amber-100 dark:bg-amber-900/30"
          iconTextColor="text-amber-700 dark:text-amber-400"
        />
        <StatCard
          title="المبيعات"
          value={`${stats.totalSales.toLocaleString()} ريال`}
          trend={`إجمالي المبيعات المكتملة`}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconTextColor="text-green-700 dark:text-green-400"
        />
        <StatCard
          title="المطاعم"
          value={stats.restaurantsCount.toLocaleString()}
          trend={`مطعم نشط في المنصة`}
          icon={<AlertCircle className="h-5 w-5" />}
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          iconTextColor="text-purple-700 dark:text-purple-400"
        />
      </div>
      
      {/* إحصائيات المعاملات */}
      <TransactionStats />

      {/* المحتوى الرئيسي */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات</TabsTrigger>
          <TabsTrigger value="analytics">الإحصائيات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">حالة الطلبات</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  توزيع الطلبات حسب الحالة لآخر 30 يوم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OrderStatusChart />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">تحليل المبيعات</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  إجماليات المبيعات اليومية لآخر أسبوع
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesChart data={salesData} maxValue={Math.max(...salesData.map(d => d.amount), 1000)} />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">أفضل المطاعم</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  المطاعم الأكثر تقييماً في المنصة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TopRestaurants restaurants={topRestaurants} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">تنبيهات النظام</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  آخر التنبيهات والتحذيرات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemAlerts alerts={systemAlerts} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">آخر المعاملات</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                قائمة بآخر المعاملات المالية على النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentOrders />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">تحليلات متقدمة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border border-dashed rounded-lg">
                <p className="text-gray-600 dark:text-gray-300">قريباً - تحليلات متقدمة للمعاملات والمبيعات</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">التقارير الدورية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border border-dashed rounded-lg">
                <p className="text-gray-600 dark:text-gray-300">قريباً - إمكانية إنشاء وتصدير تقارير متنوعة</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
