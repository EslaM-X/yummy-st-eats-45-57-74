
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coupon } from '@/types/coupons';
import { CouponService } from '@/services/CouponService';
import { Plus, Edit, Trash2, Calendar, Users, Percent, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminCoupons: React.FC = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: '',
    minimum_order: '',
    max_uses: '',
    expires_at: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await CouponService.getActiveCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الكوبونات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const couponData = {
        title: formData.title,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        minimum_order: formData.minimum_order ? parseFloat(formData.minimum_order) : 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at || null,
        is_active: true
      };

      let success = false;
      if (editingCoupon) {
        success = await CouponService.updateCoupon(editingCoupon.id, couponData);
      } else {
        success = await CouponService.createCoupon(couponData);
      }

      if (success) {
        toast({
          title: editingCoupon ? "تم تحديث الكوبون" : "تم إنشاء الكوبون",
          description: editingCoupon ? "تم تحديث الكوبون بنجاح" : "تم إنشاء الكوبون بنجاح",
        });
        resetForm();
        fetchCoupons();
      } else {
        throw new Error('فشل في العملية');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: editingCoupon ? "فشل في تحديث الكوبون" : "فشل في إنشاء الكوبون",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      title: coupon.title,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      minimum_order: coupon.minimum_order.toString(),
      max_uses: coupon.max_uses?.toString() || '',
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
    
    try {
      const success = await CouponService.deleteCoupon(couponId);
      if (success) {
        toast({
          title: "تم حذف الكوبون",
          description: "تم حذف الكوبون بنجاح",
        });
        fetchCoupons();
      } else {
        throw new Error('فشل في الحذف');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الكوبون",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      minimum_order: '',
      max_uses: '',
      expires_at: ''
    });
    setEditingCoupon(null);
    setIsDialogOpen(false);
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    } else {
      return `${coupon.discount_value} ريال`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">إدارة الكوبونات</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة كوبون جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}</DialogTitle>
              <DialogDescription>
                {editingCoupon ? 'قم بتعديل بيانات الكوبون' : 'أدخل بيانات الكوبون الجديد'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان الكوبون</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">نوع الخصم</Label>
                  <Select 
                    value={formData.discount_type} 
                    onValueChange={(value: 'percentage' | 'fixed_amount') => 
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية</SelectItem>
                      <SelectItem value="fixed_amount">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="discount_value">قيمة الخصم</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimum_order">الحد الأدنى للطلب</Label>
                  <Input
                    id="minimum_order"
                    type="number"
                    step="0.01"
                    value={formData.minimum_order}
                    onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max_uses">عدد الاستخدامات القصوى</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="expires_at">تاريخ الانتهاء</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingCoupon ? 'تحديث' : 'إنشاء'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="mb-2">
                    {coupon.discount_type === 'percentage' ? (
                      <Percent className="h-3 w-3 mr-1" />
                    ) : (
                      <DollarSign className="h-3 w-3 mr-1" />
                    )}
                    {formatDiscount(coupon)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(coupon)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{coupon.title}</CardTitle>
                <CardDescription className="text-sm">{coupon.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  {coupon.minimum_order > 0 && (
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 ml-1" />
                      الحد الأدنى: {coupon.minimum_order} ريال
                    </div>
                  )}
                  {coupon.max_uses && (
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 ml-1" />
                      متبقي: {coupon.max_uses - coupon.used_count} / {coupon.max_uses}
                    </div>
                  )}
                  {coupon.expires_at && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 ml-1" />
                      ينتهي: {new Date(coupon.expires_at).toLocaleDateString('ar')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
