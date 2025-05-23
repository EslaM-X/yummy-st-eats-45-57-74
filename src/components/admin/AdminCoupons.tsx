
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Gift, Calendar, Percent, DollarSign, Star } from 'lucide-react';

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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            إدارة الكوبونات
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">إدارة شاملة لجميع كوبونات الخصم في النظام</p>
        </div>
        <Button 
          onClick={handleCreateCoupon}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="mr-2 h-5 w-5" />
          إنشاء كوبون جديد
        </Button>
      </div>

      {/* إحصائيات الكوبونات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الكوبونات</p>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-green-600">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الكوبونات النشطة</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
                <Percent className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المستخدمة هذا الشهر</p>
                <p className="text-3xl font-bold text-blue-600">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 dark:from-yellow-500/20 dark:to-yellow-600/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي التوفير</p>
                <p className="text-3xl font-bold text-yellow-600">0 ST</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة الكوبونات */}
      <Card className="border-0 shadow-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20">
          <div className="flex items-center">
            <Star className="h-6 w-6 text-yellow-500 mr-3" />
            <div>
              <CardTitle className="text-2xl">الكوبونات المتاحة</CardTitle>
              <CardDescription className="text-lg">إدارة جميع كوبونات الخصم في النظام</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8">
              <Gift className="h-20 w-20 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">لا توجد كوبونات</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              ابدأ بإنشاء كوبون خصم جديد لعملائك واجعل تجربة التسوق أكثر متعة
            </p>
            <Button 
              onClick={handleCreateCoupon}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus className="mr-2 h-5 w-5" />
              إنشاء كوبون جديد
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCoupons;
