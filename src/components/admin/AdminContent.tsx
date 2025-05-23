
import React from 'react';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminRestaurants from './AdminRestaurants';
import AdminOrders from './AdminOrders';
import AdminSettings from './AdminSettings';
import AdminRefunds from './AdminRefunds';
import AdminCoupons from './AdminCoupons'; // قسم الكوبونات الجديد
import AdminPendingContent from './AdminPendingContent'; // قسم المراجعة الجديد
import { Card, CardContent } from "@/components/ui/card";

interface AdminContentProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const AdminContent: React.FC<AdminContentProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="container mx-auto px-4 py-6 pb-20 max-w-7xl">
      {activeTab === 'dashboard' && <AdminDashboard />}
      
      {activeTab === 'users' && <AdminUsers />}
      
      {activeTab === 'restaurants' && <AdminRestaurants />}
      
      {activeTab === 'orders' && <AdminOrders />}
      
      {activeTab === 'coupons' && <AdminCoupons />} {/* قسم الكوبونات الجديد */}
      
      {activeTab === 'pending' && <AdminPendingContent />} {/* قسم المراجعة الجديد */}
      
      {activeTab === 'refunds' && <AdminRefunds />}
      
      {activeTab === 'settings' && <AdminSettings />}
      
      {!['dashboard', 'users', 'restaurants', 'orders', 'coupons', 'pending', 'settings', 'refunds', 'payments'].includes(activeTab) && (
        <Card>
          <CardContent className="py-10 text-center">
            <h3 className="text-xl font-bold mb-2">قسم غير متاح</h3>
            <p className="text-muted-foreground mb-4">هذا القسم قيد التطوير حالياً</p>
            <button 
              onClick={() => onTabChange('dashboard')}
              className="bg-primary text-white px-4 py-2 rounded-md"
            >
              العودة للرئيسية
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminContent;
