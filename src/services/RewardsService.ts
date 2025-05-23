
import { supabase } from '@/integrations/supabase/client';
import { UserPoints, UserReward, PointTransaction, RewardTier, Reward, RewardPoints, PointsHistory } from '@/types';
import { rewardTiers } from '@/mocks/rewardsData';

/**
 * Service for handling reward points functionality
 */
export class RewardsService {
  /**
   * Get user points from the database
   */
  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      if (!userId) {
        console.error('User ID is required to fetch points');
        return null;
      }

      const { data, error } = await supabase
        .from('reward_points')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user points:', error);
        return null;
      }
      
      if (!data) {
        // Create initial points record if it doesn't exist
        return await this.initializeUserPoints(userId);
      }
      
      // Convert database record to frontend type
      const userTier = this.getUserTierByName(data.level);
      
      const userPoints: UserPoints = {
        id: data.id,
        user_id: userId,
        total: data.points,
        tier: userTier
      };
      
      // Calculate progress
      const progress = this.calculateProgress(data.points);
      userPoints.nextTier = progress.nextTier;
      userPoints.pointsToNextTier = progress.pointsToNextTier;
      userPoints.progressPercentage = progress.progressPercentage;
      
      return userPoints;
    } catch (error) {
      console.error('Exception fetching user points:', error);
      return null;
    }
  }
  
  /**
   * Initialize user points for new user
   */
  static async initializeUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      const initialPoints = 0;
      const initialTier = rewardTiers[0]; // Bronze
      
      const { data, error } = await supabase
        .from('reward_points')
        .insert({
          user_id: userId,
          points: initialPoints,
          lifetime_points: initialPoints,
          level: initialTier.name
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error initializing user points:', error);
        return null;
      }
      
      const userPoints: UserPoints = {
        id: data.id,
        user_id: data.user_id,
        total: data.points,
        tier: initialTier
      };
      
      // Calculate progress
      const progress = this.calculateProgress(data.points);
      userPoints.nextTier = progress.nextTier;
      userPoints.pointsToNextTier = progress.pointsToNextTier;
      userPoints.progressPercentage = progress.progressPercentage;
      
      return userPoints;
    } catch (error) {
      console.error('Exception initializing user points:', error);
      return null;
    }
  }
  
  /**
   * Add points to user account using the database function
   */
  static async addPoints(
    userId: string, 
    points: number, 
    source: string,
    description: string,
    referenceId?: string
  ): Promise<{success: boolean, newTotal?: number}> {
    try {
      if (!userId) {
        return { success: false };
      }

      // Call the database function to update points
      const { data, error } = await supabase
        .rpc('update_user_points', { 
          user_id_param: userId, 
          points_to_add: points 
        });
      
      if (error) {
        console.error('Error adding points:', error);
        return { success: false };
      }

      // Add transaction to history
      const { error: historyError } = await supabase
        .from('reward_points_history')
        .insert({
          user_id: userId,
          amount: points,
          source,
          description,
          reference_id: referenceId
        });
      
      if (historyError) {
        console.error('Error recording points history:', historyError);
        // Continue anyway, main transaction was successful
      }
      
      return { success: true, newTotal: data };
    } catch (error) {
      console.error('Exception adding points:', error);
      return { success: false };
    }
  }
  
  /**
   * Subtract points when redeeming rewards
   */
  static async redeemPoints(
    userId: string,
    points: number,
    rewardId: string,
    rewardName: string
  ): Promise<{success: boolean, newTotal?: number}> {
    try {
      if (!userId) {
        return { success: false };
      }

      // Call the database function with negative points to subtract
      const { data, error } = await supabase
        .rpc('update_user_points', { 
          user_id_param: userId, 
          points_to_add: -points 
        });
      
      if (error) {
        console.error('Error redeeming points:', error);
        return { success: false };
      }
      
      // Add transaction to history
      const { error: historyError } = await supabase
        .from('reward_points_history')
        .insert({
          user_id: userId,
          amount: -points, // Negative to indicate redemption
          source: 'reward_redemption',
          description: `Redeemed for: ${rewardName}`,
          reference_id: rewardId
        });
      
      if (historyError) {
        console.error('Error recording redemption history:', historyError);
        // Continue anyway, main transaction was successful
      }
      
      return { success: true, newTotal: data };
    } catch (error) {
      console.error('Exception redeeming points:', error);
      return { success: false };
    }
  }
  
  /**
   * Get points history from the database
   */
  static async getPointsHistory(userId: string): Promise<PointTransaction[]> {
    try {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('reward_points_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching points history:', error);
        return [];
      }
      
      // Map database records to frontend type
      return data.map((record: PointsHistory) => ({
        id: record.id,
        type: record.amount > 0 ? 'earned' : 'redeemed',
        points: Math.abs(record.amount),
        description: record.description,
        date: record.created_at ? record.created_at.split('T')[0] : new Date().toISOString().split('T')[0] // Format as YYYY-MM-DD
      }));
    } catch (error) {
      console.error('Exception fetching points history:', error);
      return [];
    }
  }
  
  /**
   * Get available rewards from the database
   */
  static async getAvailableRewards(): Promise<UserReward[]> {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: true });
      
      if (error) {
        console.error('Error fetching rewards:', error);
        return [];
      }
      
      // Map database records to frontend type
      return data.map((reward: Reward) => ({
        id: reward.id,
        name: reward.name,
        description: reward.description || '',
        points: reward.points,
        type: reward.type,
        imageUrl: reward.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800',
        expiryDate: reward.expiry_date ? reward.expiry_date : '2025-12-31'
      }));
    } catch (error) {
      console.error('Exception fetching rewards:', error);
      // If there's an error or no rewards yet, return mock data
      return [
        {
          id: '1',
          name: '10% off next order',
          description: 'Get 10% off your next order',
          points: 200,
          type: 'discount',
          imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800',
          expiryDate: '2025-12-31'
        },
        {
          id: '2',
          name: 'Free dessert',
          description: 'Enjoy a free dessert with your next meal',
          points: 350,
          type: 'freeItem',
          imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800',
          expiryDate: '2025-12-31'
        },
        {
          id: '3',
          name: 'Free delivery for a week',
          description: 'Get free delivery on all orders for a week',
          points: 500,
          type: 'delivery',
          imageUrl: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800',
          expiryDate: '2025-12-31'
        },
        {
          id: '4',
          name: 'VIP restaurant experience',
          description: 'Enjoy a special VIP treatment at selected restaurants',
          points: 1000,
          type: 'exclusive',
          imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800',
          expiryDate: '2025-12-31'
        }
      ];
    }
  }
  
  /**
   * Get user's tier based on points
   */
  static getUserTier(points: number): RewardTier {
    for (let i = rewardTiers.length - 1; i >= 0; i--) {
      if (points >= rewardTiers[i].pointsRequired) {
        return rewardTiers[i];
      }
    }
    return rewardTiers[0]; // Default to Bronze
  }
  
  /**
   * Get user's tier by name
   */
  static getUserTierByName(level: string): RewardTier {
    const tier = rewardTiers.find(t => t.name === level);
    return tier || rewardTiers[0]; // Default to Bronze if not found
  }
  
  /**
   * Calculate progress to next tier
   */
  static calculateProgress(points: number): {
    nextTier: RewardTier | null;
    pointsToNextTier: number;
    progressPercentage: number;
  } {
    // Find current tier and next tier
    let currentTierIndex = -1;
    for (let i = rewardTiers.length - 1; i >= 0; i--) {
      if (points >= rewardTiers[i].pointsRequired) {
        currentTierIndex = i;
        break;
      }
    }

    // If user is at max tier
    if (currentTierIndex === rewardTiers.length - 1) {
      return {
        nextTier: null,
        pointsToNextTier: 0,
        progressPercentage: 100
      };
    }

    const nextTier = rewardTiers[currentTierIndex + 1];
    const currentTierPoints = rewardTiers[currentTierIndex].pointsRequired;
    const pointsToNextTier = nextTier.pointsRequired - points;
    const tierPointsRange = nextTier.pointsRequired - currentTierPoints;
    const progressPercentage = Math.round(((points - currentTierPoints) / tierPointsRange) * 100);

    return {
      nextTier,
      pointsToNextTier,
      progressPercentage
    };
  }
  
  /**
   * Seed rewards data to the database (for development/testing)
   */
  static async seedRewardsData(): Promise<boolean> {
    try {
      const { count, error: countError } = await supabase
        .from('rewards')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error checking rewards count:', countError);
        return false;
      }
      
      // Only seed if there are no rewards yet
      if (count !== null && count > 0) {
        console.log('Rewards data already exists, skipping seed');
        return true;
      }
      
      const seedRewards = [
        {
          name: '10% off next order',
          description: 'Get 10% off your next order',
          points: 200,
          type: 'discount',
          image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800',
          expiry_date: '2025-12-31',
          is_active: true
        },
        {
          name: 'Free dessert',
          description: 'Enjoy a free dessert with your next meal',
          points: 350,
          type: 'freeItem',
          image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800',
          expiry_date: '2025-12-31',
          is_active: true
        },
        {
          name: 'Free delivery for a week',
          description: 'Get free delivery on all orders for a week',
          points: 500,
          type: 'delivery',
          image_url: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800',
          expiry_date: '2025-12-31',
          is_active: true
        },
        {
          name: 'VIP restaurant experience',
          description: 'Enjoy a special VIP treatment at selected restaurants',
          points: 1000,
          type: 'exclusive',
          image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800',
          expiry_date: '2025-12-31',
          is_active: true
        }
      ];
      
      const { error: insertError } = await supabase
        .from('rewards')
        .insert(seedRewards);
      
      if (insertError) {
        console.error('Error seeding rewards data:', insertError);
        return false;
      }
      
      console.log('Successfully seeded rewards data');
      return true;
    } catch (error) {
      console.error('Exception seeding rewards data:', error);
      return false;
    }
  }
}
