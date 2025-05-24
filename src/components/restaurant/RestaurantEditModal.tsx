
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RestaurantService } from '@/services/RestaurantService';

interface RestaurantEditModalProps {
  restaurant: any;
  onClose: () => void;
  onUpdate: () => void;
}

const RestaurantEditModal: React.FC<RestaurantEditModalProps> = ({
  restaurant,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    description: restaurant.description || '',
    address: restaurant.address || '',
    phone: restaurant.phone || '',
    delivery_fee: restaurant.delivery_fee || 0,
    min_order_amount: restaurant.min_order_amount || 0,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await RestaurantService.updateRestaurant(restaurant.id, formData);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المطعم بنجاح",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating restaurant:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث المطعم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>تعديل المطعم</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">اسم المطعم</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_fee">رسوم التوصيل</Label>
              <Input
                id="delivery_fee"
                type="number"
                step="0.01"
                value={formData.delivery_fee}
                onChange={(e) => handleChange('delivery_fee', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="min_order_amount">الحد الأدنى للطلب</Label>
              <Input
                id="min_order_amount"
                type="number"
                step="0.01"
                value={formData.min_order_amount}
                onChange={(e) => handleChange('min_order_amount', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantEditModal;
