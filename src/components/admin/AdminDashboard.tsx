
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
import { Users, ShoppingBag, TrendingUp, Store, AlertCircle, CheckCircle } from 'lucide-react';
import { AdminService } from '@/services/AdminService';
import { useToast } from '@/hooks/use-toast';

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
    activeRestaurants: 0,
    pendingOrders: 0,
    pendingRestaurants: 0,
    pendingFoods: 0,
    completedOrders: 0,
    totalRefunds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState<Alert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // جلب الإحصائيات العامة
      const dashboardStats = await AdminService.getDashboardStats();
      setStats(dashboardStats);

      // جلب بيانات المبيعات الأسبوعية
      const weeklyOrders = await AdminService.getSalesData('week');
      
      // تجميع المبيعات حسب اليوم
      const salesByDay = weeklyOrders.reduce((acc, order) => {
        const day = new Date(order.created_at).toLocaleDateString('ar-SA', { weekday: 'long' });
        acc[day] = (acc[day] || 0) + (order.total_amount || 0);
        return acc;
      }, {} as Record<string, number>);

      const formattedSalesData = Object.entries(salesByDay).map(([day, amount]) => ({
        day,
        amount
      }));

      setSalesData(formattedSalesData);

      // جلب أفضل المطاعم
      const restaurants = await AdminService.getTopRestaurants(5);
      setTopRestaurants(restaurants);

      // إنشاء تنبيهات النظام
      const alerts: Alert[] = [
        { type: "info", title: 'مرحباً بك', message: 'تم تحديث لوحة الإدارة بالبيانات الحقيقية' }
      ];

      if (dashboardStats.pendingOrders > 0) {
        alerts.push({
          type: "warning",
          title: "طلبات معلقة",
          message: `يوجد ${dashboardStats.pendingOrders} طلب جديد يحتاج للمعالجة`
        });
      }

      if (dashboardStats.pendingRestaurants > 0) {
        alerts.push({
          type: "warning",
          title: "مطاعم معلقة",
          message: `يوجد ${dashboardStats.pendingRestaurants} مطعم ينتظر الموافقة`
        });
      }

      if (dashboardStats.pendingFoods > 0) {
        alerts.push({
          type: "warning",
          title: "أطعمة معلقة",
          message: `يوجد ${dashboardStats.pendingFoods} منتج ينتظر الموافقة`
        });
      }

      setSystemAlerts(alerts);

      toast({
        title: "تم تحديث البيانات",
        description: "تم جلب أحدث البيانات من قاعدة البيانات بنجاح",
      });

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setSystemAlerts([{
        type: "error",
        title: "خطأ في تحميل البيانات",
        message: error.message || "حدث خطأ أثناء جلب إحصائيات لوحة التحكم"
      }]);
      
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message || "حدث خطأ أثناء جلب البيانات",
        variant: "destructive",
      });
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
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
        >
          تحديث البيانات
        </button>
      </div>
      
      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          trend={`${stats.completedOrders} طلب مكتمل`}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBgColor="bg-green-100 dark:bg-green-900/30"
          iconTextColor="text-green-700 dark:text-green-400"
        />
        <StatCard
          title="المطاعم"
          value={stats.restaurantsCount.toLocaleString()}
          trend={`${stats.activeRestaurants} مطعم نشط`}
          icon={<Store className="h-5 w-5" />}
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          iconTextColor="text-purple-700 dark:text-purple-400"
        />
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="الطلبات المكتملة"
          value={stats.completedOrders.toLocaleString()}
          trend="إجمالي الطلبات المنجزة"
          icon={<CheckCircle className="h-5 w-5" />}
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
          iconTextColor="text-emerald-700 dark:text-emerald-400"
        />
        <StatCard
          title="المبالغ المستردة"
          value={`${stats.totalRefunds.toLocaleString()} ريال`}
          trend="إجمالي المبالغ المستردة"
          icon={<AlertCircle className="h-5 w-5" />}
          iconBgColor="bg-red-100 dark:bg-red-900/30"
          iconTextColor="text-red-700 dark:text-red-400"
        />
        <StatCard
          title="المحتوى المعلق"
          value={(stats.pendingRestaurants + stats.pendingFoods).toLocaleString()}
          trend={`${stats.pendingRestaurants} مطاعم، ${stats.pendingFoods} أطعمة`}
          icon={<AlertCircle className="h-5 w-5" />}
          iconBgColor="bg-orange-100 dark:bg-orange-900/30"
          iconTextColor="text-orange-700 dark:text-orange-400"
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
