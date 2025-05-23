
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from "@/hooks/use-toast";
import { Coupon, UserCoupon } from '@/types/coupons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Gift, Clock, Percent, DollarSign } from 'lucide-react';
import { CouponService } from '@/services/CouponService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CouponsPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("available");
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Fetch coupons data
  useEffect(() => {
    if (isLoading) return;
    
    const fetchCouponsData = async () => {
      setIsDataLoading(true);
      try {
        // Fetch available coupons
        const coupons = await CouponService.getActiveCoupons();
        setAvailableCoupons(coupons);
        
        // Fetch user coupons if authenticated
        if (isAuthenticated && user) {
          const userCouponsData = await CouponService.getUserCoupons(user.id);
          setUserCoupons(userCouponsData);
        }
      } catch (error) {
        console.error('Error fetching coupons data:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ في تحميل الكوبونات',
          variant: "destructive",
        });
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchCouponsData();
  }, [isAuthenticated, isLoading, user, toast]);

  // Handle coupon claim
  const handleClaimCoupon = async (coupon: Coupon) => {
    if (!user) return;
    
    try {
      const success = await CouponService.addCouponToUser(user.id, coupon.id);
      
      if (success) {
        // Refresh user coupons
        const userCouponsData = await CouponService.getUserCoupons(user.id);
        setUserCoupons(userCouponsData);
        
        toast({
          title: 'تم الحصول على الكوبون',
          description: `تم إضافة كوبون "${coupon.title}" إلى حسابك`,
        });
      } else {
        toast({
          title: 'فشل في الحصول على الكوبون',
          description: 'حدث خطأ أثناء محاولة الحصول على الكوبون',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error claiming coupon:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: "destructive",
      });
    }
  };

  // Format discount display
  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    } else {
      return `${coupon.discount_value} ريال`;
    }
  };

  // Check if user already has coupon
  const userHasCoupon = (couponId: string) => {
    return userCoupons.some(uc => uc.coupon_id === couponId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-xl">جاري التحميل...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">
              كوبونات الخصم
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              احصل على خصومات رائعة على طلباتك
            </p>
          </div>

          {!isAuthenticated && (
            <Alert className="max-w-md mx-auto mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>تسجيل الدخول مطلوب</AlertTitle>
              <AlertDescription>
                يجب تسجيل الدخول للحصول على الكوبونات واستخدامها
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-10">
            <TabsList className="w-full max-w-md mx-auto mb-8">
              <TabsTrigger value="available" className="flex-1">
                الكوبونات المتاحة
              </TabsTrigger>
              {isAuthenticated && (
                <TabsTrigger value="my-coupons" className="flex-1">
                  كوبوناتي
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="available" className="p-1">
              {isDataLoading ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableCoupons.map((coupon) => (
                    <Card key={coupon.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30">
                        <div className="flex items-center justify-between">
                          <Gift className="h-8 w-8 text-yellow-600" />
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {coupon.discount_type === 'percentage' ? (
                              <Percent className="h-3 w-3 mr-1" />
                            ) : (
                              <DollarSign className="h-3 w-3 mr-1" />
                            )}
                            {formatDiscount(coupon)}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{coupon.title}</CardTitle>
                        <CardDescription>{coupon.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-2 text-sm">
                          {coupon.minimum_order > 0 && (
                            <p className="text-gray-600 dark:text-gray-400">
                              الحد الأدنى للطلب: {coupon.minimum_order} ريال
                            </p>
                          )}
                          {coupon.max_uses && (
                            <p className="text-gray-600 dark:text-gray-400">
                              متبقي: {coupon.max_uses - coupon.used_count} استخدام
                            </p>
                          )}
                          {coupon.expires_at && (
                            <p className="text-gray-600 dark:text-gray-400 flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              ينتهي: {new Date(coupon.expires_at).toLocaleDateString('ar')}
                            </p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          disabled={!isAuthenticated || userHasCoupon(coupon.id)}
                          onClick={() => handleClaimCoupon(coupon)}
                        >
                          {!isAuthenticated 
                            ? 'سجل دخولك أولاً' 
                            : userHasCoupon(coupon.id) 
                            ? 'تم الحصول عليه' 
                            : 'احصل على الكوبون'
                          }
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {isAuthenticated && (
              <TabsContent value="my-coupons">
                {isDataLoading ? (
                  <div className="flex justify-center p-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  </div>
                ) : userCoupons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userCoupons.map((userCoupon) => (
                      <Card key={userCoupon.id} className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                          <div className="flex items-center justify-between">
                            <Gift className="h-8 w-8 text-green-600" />
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {userCoupon.coupon && formatDiscount(userCoupon.coupon)}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">{userCoupon.coupon?.title}</CardTitle>
                          <CardDescription>{userCoupon.coupon?.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-2 text-sm">
                            {userCoupon.coupon?.minimum_order && userCoupon.coupon.minimum_order > 0 && (
                              <p className="text-gray-600 dark:text-gray-400">
                                الحد الأدنى للطلب: {userCoupon.coupon.minimum_order} ريال
                              </p>
                            )}
                            {userCoupon.coupon?.expires_at && (
                              <p className="text-gray-600 dark:text-gray-400 flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                ينتهي: {new Date(userCoupon.coupon.expires_at).toLocaleDateString('ar')}
                              </p>
                            )}
                            <Badge variant="outline" className="text-green-600">
                              جاهز للاستخدام
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Gift className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد كوبونات</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      لم تحصل على أي كوبونات بعد. تصفح الكوبونات المتاحة واحصل عليها!
                    </p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CouponsPage;
