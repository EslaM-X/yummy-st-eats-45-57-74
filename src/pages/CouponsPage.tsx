
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from "@/hooks/use-toast";
import { Coupon, UserCoupon, CouponService } from '@/services/CouponService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Gift, Clock, Percent, DollarSign, Star, Sparkles, Tag, Trophy } from 'lucide-react';
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
      return `${coupon.discount_value} ST`;
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          {/* Header Section */}
          <div className="text-center mb-16 relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
            </div>
            <div className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
              <h1 className="text-5xl font-bold mb-6 relative">
                كوبونات الخصم الحصرية
                <div className="absolute -top-2 -right-2">
                  <Trophy className="h-6 w-6 text-yellow-500 animate-bounce" />
                </div>
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              استمتع بأفضل العروض والخصومات الحصرية على طلباتك المفضلة
            </p>
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
              </div>
            </div>
          </div>

          {!isAuthenticated && (
            <Alert className="max-w-md mx-auto mb-12 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800 dark:text-orange-200">تسجيل الدخول مطلوب</AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                يجب تسجيل الدخول للحصول على الكوبونات واستخدامها
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-16">
            <TabsList className="w-full max-w-md mx-auto mb-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-orange-200 dark:border-orange-800">
              <TabsTrigger 
                value="available" 
                className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white"
              >
                <Tag className="h-4 w-4 mr-2" />
                الكوبونات المتاحة
              </TabsTrigger>
              {isAuthenticated && (
                <TabsTrigger 
                  value="my-coupons" 
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  كوبوناتي
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="available" className="p-1">
              {isDataLoading ? (
                <div className="flex justify-center p-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">جاري تحميل الكوبونات...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {availableCoupons.map((coupon, index) => (
                    <Card key={coupon.id} className={`group overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 ${
                      coupon.discount_type === 'percentage' 
                        ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20' 
                        : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20'
                    }`}>
                      <CardHeader className="relative pb-2">
                        <div className="absolute top-4 right-4">
                          <div className={`p-3 rounded-full ${
                            coupon.discount_type === 'percentage' 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}>
                            {coupon.discount_type === 'percentage' ? (
                              <Percent className="h-6 w-6 text-white" />
                            ) : (
                              <DollarSign className="h-6 w-6 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="pt-8">
                          <Badge 
                            variant="secondary" 
                            className={`mb-3 text-lg px-4 py-2 font-bold ${
                              coupon.discount_type === 'percentage' 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0' 
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                            }`}
                          >
                            {formatDiscount(coupon)}
                          </Badge>
                          <CardTitle className="text-2xl font-bold mb-2 group-hover:text-orange-600 transition-colors">
                            {coupon.title}
                          </CardTitle>
                          <CardDescription className="text-base leading-relaxed">
                            {coupon.description}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          {coupon.minimum_order > 0 && (
                            <div className="flex items-center text-sm bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                              <DollarSign className="h-4 w-4 mr-2 text-orange-500" />
                              <span>الحد الأدنى للطلب: <strong>{coupon.minimum_order} ST</strong></span>
                            </div>
                          )}
                          {coupon.max_uses && (
                            <div className="flex items-center text-sm bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                              <Tag className="h-4 w-4 mr-2 text-blue-500" />
                              <span>متبقي: <strong>{coupon.max_uses - coupon.used_count}</strong> استخدام</span>
                            </div>
                          )}
                          {coupon.expires_at && (
                            <div className="flex items-center text-sm bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                              <Clock className="h-4 w-4 mr-2 text-red-500" />
                              <span>ينتهي: <strong>{new Date(coupon.expires_at).toLocaleDateString('ar')}</strong></span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-6">
                        <Button 
                          className={`w-full text-lg py-6 font-bold transition-all duration-300 ${
                            !isAuthenticated || userHasCoupon(coupon.id)
                              ? 'bg-gray-400 hover:bg-gray-500'
                              : 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 transform hover:scale-105'
                          }`}
                          disabled={!isAuthenticated || userHasCoupon(coupon.id)}
                          onClick={() => handleClaimCoupon(coupon)}
                        >
                          {!isAuthenticated 
                            ? '🔐 سجل دخولك أولاً' 
                            : userHasCoupon(coupon.id) 
                            ? '✅ تم الحصول عليه' 
                            : '🎁 احصل على الكوبون'
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
                  <div className="flex justify-center p-16">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">جاري تحميل كوبوناتك...</p>
                    </div>
                  </div>
                ) : userCoupons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {userCoupons.map((userCoupon) => (
                      <Card key={userCoupon.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border-0">
                        <CardHeader className="relative pb-2">
                          <div className="absolute top-4 right-4">
                            <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
                              <Gift className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="pt-8">
                            <Badge 
                              variant="secondary" 
                              className="mb-3 text-lg px-4 py-2 font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
                            >
                              {userCoupon.coupon && formatDiscount(userCoupon.coupon)}
                            </Badge>
                            <CardTitle className="text-2xl font-bold mb-2 group-hover:text-green-600 transition-colors">
                              {userCoupon.coupon?.title}
                            </CardTitle>
                            <CardDescription className="text-base leading-relaxed">
                              {userCoupon.coupon?.description}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            {userCoupon.coupon?.minimum_order && userCoupon.coupon.minimum_order > 0 && (
                              <div className="flex items-center text-sm bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                                <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                                <span>الحد الأدنى للطلب: <strong>{userCoupon.coupon.minimum_order} ST</strong></span>
                              </div>
                            )}
                            {userCoupon.coupon?.expires_at && (
                              <div className="flex items-center text-sm bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                                <Clock className="h-4 w-4 mr-2 text-orange-500" />
                                <span>ينتهي: <strong>{new Date(userCoupon.coupon.expires_at).toLocaleDateString('ar')}</strong></span>
                              </div>
                            )}
                            <Badge 
                              variant="outline" 
                              className="w-full justify-center text-green-600 border-green-500 bg-green-50 dark:bg-green-950/20 py-2"
                            >
                              ✨ جاهز للاستخدام
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8">
                      <Gift className="h-16 w-16 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">لا توجد كوبونات بعد</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      لم تحصل على أي كوبونات بعد. تصفح الكوبونات المتاحة واحصل عليها!
                    </p>
                    <Button 
                      onClick={() => setActiveTab('available')}
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3 text-lg"
                    >
                      تصفح الكوبونات المتاحة
                    </Button>
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
