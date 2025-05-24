
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Gift, Calendar, Percent, DollarSign, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CouponService, Coupon } from '@/services/CouponService';

const AdminCoupons: React.FC = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    title_en: '',
    description: '',
    description_en: '',
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 0,
    minimum_order: 0,
    max_uses: 0,
    expires_at: '',
    is_active: true
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

  const handleCreateCoupon = async () => {
    setIsCreating(true);
    try {
      const newCoupon = await CouponService.createCoupon({
        ...formData,
        expires_at: formData.expires_at || undefined
      });

      if (newCoupon) {
        toast({
          title: "تم إنشاء الكوبون",
          description: "تم إنشاء الكوبون بنجاح",
        });
        
        resetForm();
        setCreateDialogOpen(false);
        fetchCoupons();
      } else {
        throw new Error('فشل في إنشاء الكوبون');
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الكوبون",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCoupon = async () => {
    if (!editingCoupon) return;
    
    setIsCreating(true);
    try {
      const updatedCoupon = await CouponService.updateCoupon(editingCoupon.id, {
        ...formData,
        expires_at: formData.expires_at || undefined
      });

      if (updatedCoupon) {
        toast({
          title: "تم تحديث الكوبون",
          description: "تم تحديث الكوبون بنجاح",
        });
        
        resetForm();
        setEditDialogOpen(false);
        setEditingCoupon(null);
        fetchCoupons();
      } else {
        throw new Error('فشل في تحديث الكوبون');
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الكوبون",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const success = await CouponService.deleteCoupon(couponId);
      
      if (success) {
        toast({
          title: "تم حذف الكوبون",
          description: "تم حذف الكوبون بنجاح",
        });
        fetchCoupons();
      } else {
        throw new Error('فشل في حذف الكوبون');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
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
      title_en: '',
      description: '',
      description_en: '',
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_order: 0,
      max_uses: 0,
      expires_at: '',
      is_active: true
    });
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      title: coupon.title,
      title_en: coupon.title_en || '',
      description: coupon.description || '',
      description_en: coupon.description_en || '',
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_order: coupon.minimum_order,
      max_uses: coupon.max_uses || 0,
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
      is_active: coupon.is_active
    });
    setEditDialogOpen(true);
  };

  const CouponForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">العنوان بالعربية</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="title_en">العنوان بالإنجليزية</Label>
          <Input
            id="title_en"
            value={formData.title_en}
            onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="description">الوصف بالعربية</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="description_en">الوصف بالإنجليزية</Label>
          <Textarea
            id="description_en"
            value={formData.description_en}
            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="code">رمز الكوبون</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="SAVE20"
            required
          />
        </div>
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
            value={formData.discount_value}
            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
            min="0"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="minimum_order">الحد الأدنى للطلب</Label>
          <Input
            id="minimum_order"
            type="number"
            value={formData.minimum_order}
            onChange={(e) => setFormData({ ...formData, minimum_order: parseFloat(e.target.value) || 0 })}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="max_uses">عدد الاستخدامات القصوى</Label>
          <Input
            id="max_uses"
            type="number"
            value={formData.max_uses}
            onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) || 0 })}
            min="0"
            placeholder="اتركه فارغ للاستخدام اللانهائي"
          />
        </div>
        <div>
          <Label htmlFor="expires_at">تاريخ انتهاء الصلاحية</Label>
          <Input
            id="expires_at"
            type="date"
            value={formData.expires_at}
            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button 
          onClick={isEdit ? handleUpdateCoupon : handleCreateCoupon}
          disabled={isCreating || !formData.title || !formData.code}
          className="flex-1"
        >
          {isCreating ? 'جاري الحفظ...' : (isEdit ? 'تحديث الكوبون' : 'إنشاء الكوبون')}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            resetForm();
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setEditingCoupon(null);
          }}
        >
          إلغاء
        </Button>
      </div>
    </div>
  );

  const activeCoupons = coupons.filter(c => c.is_active);
  const totalUsage = coupons.reduce((sum, c) => sum + c.used_count, 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            إدارة الكوبونات
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">إدارة شاملة لجميع كوبونات الخصم في النظام</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="mr-2 h-5 w-5" />
              إنشاء كوبون جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>إنشاء كوبون جديد</DialogTitle>
            </DialogHeader>
            <CouponForm />
          </DialogContent>
        </Dialog>
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
                <p className="text-3xl font-bold text-purple-600">{coupons.length}</p>
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
                <p className="text-3xl font-bold text-green-600">{activeCoupons.length}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الاستخدامات</p>
                <p className="text-3xl font-bold text-blue-600">{totalUsage}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">متوسط الخصم</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {coupons.length > 0 ? Math.round(coupons.reduce((sum, c) => sum + c.discount_value, 0) / coupons.length) : 0}%
                </p>
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
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">جاري تحميل الكوبونات...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8">
                <Gift className="h-20 w-20 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">لا توجد كوبونات</h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                ابدأ بإنشاء كوبون خصم جديد لعملائك واجعل تجربة التسوق أكثر متعة
              </p>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="mr-2 h-5 w-5" />
                إنشاء كوبون جديد
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <Card key={coupon.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={coupon.is_active ? "default" : "secondary"}
                        className={coupon.is_active ? "bg-green-500" : "bg-gray-500"}
                      >
                        {coupon.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-xl">{coupon.title}</CardTitle>
                    <CardDescription>{coupon.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>الرمز:</span>
                        <Badge variant="outline">{coupon.code}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>الخصم:</span>
                        <span className="font-bold">
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%` 
                            : `${coupon.discount_value} ريال`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>الحد الأدنى:</span>
                        <span>{coupon.minimum_order} ريال</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الاستخدامات:</span>
                        <span>{coupon.used_count} / {coupon.max_uses || '∞'}</span>
                      </div>
                      {coupon.expires_at && (
                        <div className="flex justify-between">
                          <span>ينتهي في:</span>
                          <span>{new Date(coupon.expires_at).toLocaleDateString('ar')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>تعديل الكوبون</DialogTitle>
          </DialogHeader>
          <CouponForm isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
