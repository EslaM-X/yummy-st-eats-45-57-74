
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UserPointsCard from '@/components/rewards/UserPointsCard';
import AvailableRewards from '@/components/rewards/AvailableRewards';
import PointsHistoryList from '@/components/rewards/PointsHistoryList';
import TierCard from '@/components/rewards/TierCard';
import { useToast } from "@/hooks/use-toast";
import { UserReward } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { rewardTiers } from '@/mocks/rewardsData';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { RewardsService } from '@/services/RewardsService';

const RewardsPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("rewards");
  const [userPoints, setUserPoints] = useState<any>(null);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [availableRewards, setAvailableRewards] = useState<UserReward[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Fetch user rewards data
  useEffect(() => {
    if (isLoading) return; // Wait until auth is loaded
    
    if (!isAuthenticated || !user) return; // Only fetch if authenticated
    
    const fetchRewardsData = async () => {
      setIsDataLoading(true);
      try {
        // Fetch user points
        const points = await RewardsService.getUserPoints(user.id);
        if (points) {
          setUserPoints(points);
          
          // Calculate progress
          const progress = RewardsService.calculateProgress(points.total);
          points.nextTier = progress.nextTier;
          points.pointsToNextTier = progress.pointsToNextTier;
          points.progressPercentage = progress.progressPercentage;
        }
        
        // Fetch points history
        const history = await RewardsService.getPointsHistory(user.id);
        setPointsHistory(history);
        
        // Fetch available rewards
        const rewards = await RewardsService.getAvailableRewards();
        setAvailableRewards(rewards);
      } catch (error) {
        console.error('Error fetching rewards data:', error);
        toast({
          title: t('errorOccurred'),
          description: t('errorFetchingData'),
          variant: "destructive",
        });
      } finally {
        setIsDataLoading(false);
      }
    };
    
    fetchRewardsData();
  }, [isAuthenticated, isLoading, user, t, toast]);

  // Handle reward redemption
  const handleRedeemReward = async (reward: UserReward) => {
    if (!user) return;
    
    try {
      const result = await RewardsService.redeemPoints(
        user.id, 
        reward.points, 
        reward.id, 
        reward.name
      );
      
      if (result.success) {
        // Update local state with new points total
        if (userPoints && result.newTotal !== undefined) {
          const updatedPoints = { 
            ...userPoints, 
            total: result.newTotal 
          };
          
          // Recalculate progress
          const progress = RewardsService.calculateProgress(result.newTotal);
          updatedPoints.nextTier = progress.nextTier;
          updatedPoints.pointsToNextTier = progress.pointsToNextTier;
          updatedPoints.progressPercentage = progress.progressPercentage;
          
          setUserPoints(updatedPoints);
        }
        
        // Refresh points history
        const history = await RewardsService.getPointsHistory(user.id);
        setPointsHistory(history);
        
        toast({
          title: t('rewardRedeemed'),
          description: `${reward.name} - ${reward.points} ${t('pointsUnit')}`,
        });
      } else {
        toast({
          title: t('redemptionFailed'),
          description: t('notEnoughPoints'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast({
        title: t('errorOccurred'),
        description: t('errorRedeemingReward'),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-xl">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <Alert className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('loginRequired')}</AlertTitle>
            <AlertDescription>
              {t('loginToAccessRewards')}
            </AlertDescription>
          </Alert>
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
          <h1 className="text-3xl font-bold mb-6 text-center">
            {t('rewardsPageTitle')}
          </h1>

          <div className="mb-10">
            {isDataLoading ? (
              <div className="flex justify-center p-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : userPoints ? (
              <UserPointsCard 
                userPoints={userPoints}
                nextTier={userPoints.nextTier}
                progressPercentage={userPoints.progressPercentage}
                pointsToNextTier={userPoints.pointsToNextTier}
              />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('noRewardsFound')}</AlertTitle>
                <AlertDescription>
                  {t('errorLoadingRewards')}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-10">
            <TabsList className="w-full max-w-md mx-auto mb-8">
              <TabsTrigger value="rewards" className="flex-1">
                {t('availableRewards')}
              </TabsTrigger>
              <TabsTrigger value="tiers" className="flex-1">
                {t('rewardTiers')}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                {t('pointsHistory')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="rewards" className="p-1">
              {isDataLoading ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : (
                <AvailableRewards 
                  rewards={availableRewards} 
                  userPoints={userPoints?.total || 0} 
                  onRedeemReward={handleRedeemReward}
                />
              )}
            </TabsContent>
            
            <TabsContent value="tiers">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {rewardTiers.map((tier, index) => (
                  <TierCard 
                    key={tier.name}
                    tier={tier}
                    isCurrentTier={userPoints?.tier?.name === tier.name}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              {isDataLoading ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : (
                <PointsHistoryList transactions={pointsHistory} />
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-10" />
          
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">{t('howEarnPoints')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-3">{t('orderAndEarn')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {t('earnPointsDescription')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>{t('earnByOrdering')}</li>
                  <li>{t('earnByReviews')}</li>
                  <li>{t('earnByReferrals')}</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-semibold mb-3">{t('redeemRewards')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {t('redeemPointsDescription')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>{t('redeemForDiscounts')}</li>
                  <li>{t('redeemForFreeItems')}</li>
                  <li>{t('redeemForExclusives')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RewardsPage;
