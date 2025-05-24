
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RestaurantSettingsModalProps {
  restaurant: any;
  onClose: () => void;
  onUpdate: () => void;
}

const RestaurantSettingsModal: React.FC<RestaurantSettingsModalProps> = ({
  restaurant,
  onClose,
  onUpdate
}) => {
  const [settings, setSettings] = useState({
    is_active: restaurant.is_active || false,
    opening_hours: restaurant.opening_hours || {},
  });
  const [openingHours, setOpeningHours] = useState(
    restaurant.opening_hours ? JSON.stringify(restaurant.opening_hours, null, 2) : ''
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);

    try {
      let parsedHours = {};
      if (openingHours.trim()) {
        try {
          parsedHours = JSON.parse(openingHours);
        } catch (error) {
          throw new Error('تنسيق ساعات العمل غير صحيح. يرجى استخدام تنسيق JSON صحيح.');
        }
      }

      const { error } = await supabase
        .from('restaurants')
        .update({
          is_active: settings.is_active,
          opening_hours: parsedHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurant.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات المطعم بنجاح",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating restaurant settings:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الإعدادات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader>
          <DialogTitle>إعدادات المطعم</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الإعدادات العامة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">تفعيل المطعم</Label>
                <Switch
                  id="is_active"
                  checked={settings.is_active}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ساعات العمل</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="opening_hours">ساعات العمل (JSON)</Label>
              <Textarea
                id="opening_hours"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder={`مثال:
{
  "sunday": { "open": "09:00", "close": "23:00" },
  "monday": { "open": "09:00", "close": "23:00" },
  "tuesday": { "open": "09:00", "close": "23:00" },
  "wednesday": { "open": "09:00", "close": "23:00" },
  "thursday": { "open": "09:00", "close": "23:00" },
  "friday": { "open": "09:00", "close": "23:00" },
  "saturday": { "open": "09:00", "close": "23:00" }
}`}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                استخدم تنسيق JSON لتحديد ساعات العمل لكل يوم
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantSettingsModal;
