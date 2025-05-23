
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Gift, Calendar, Percent } from 'lucide-react';

const AdminCoupons: React.FC = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCoupon = () => {
    toast({
      title: "قريباً",
      description: "ميزة إدارة الكوبونات ستكون متاحة قريباً",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">إدارة الكوبونات</h2>
        <Button 
          onClick={handleCreateCoupon}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          إنشاء كوبون جديد
        </Button>
      </div>

      {/* إحصائيات الكوبونات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الكوبونات</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">الكوبونات النشطة</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Percent className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">المستخدمة هذا الشهر</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">إجمالي التوفير</p>
                <p className="text-2xl font-bold">0 ريال</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة الكوبونات */}
      <Card>
        <CardHeader>
          <CardTitle>الكوبونات المتاحة</CardTitle>
          <CardDescription>إدارة جميع كوبونات الخصم في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Gift className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد كوبونات</h3>
            <p className="text-gray-600 mb-4">ابدأ بإنشاء كوبون خصم جديد</p>
            <Button 
              onClick={handleCreateCoupon}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              إنشاء كوبون
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoupons;
