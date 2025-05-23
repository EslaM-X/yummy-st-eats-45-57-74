
import { supabase } from '@/integrations/supabase/client';
import { UserPoints, UserReward, PointTransaction, RewardTier } from '@/types';
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
   * Add points to user account
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

      // First, get current points
      const { data: currentData, error: fetchError } = await supabase
        .from('reward_points')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error fetching current points:', fetchError);
        return { success: false };
      }

      let newTotal = points;
      let lifetimePoints = points;
      
      // Update existing record or create new one
      if (currentData) {
        newTotal = currentData.points + points;
        lifetimePoints = currentData.lifetime_points + points;
        
        const { error: updateError } = await supabase
          .from('reward_points')
          .update({ 
            points: newTotal,
            lifetime_points: lifetimePoints,
            level: this.calculateLevel(lifetimePoints),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentData.id);
        
        if (updateError) {
          console.error('Error updating points:', updateError);
          return { success: false };
        }
      } else {
        // Create new record if it doesn't exist
        const { error: insertError } = await supabase
          .from('reward_points')
          .insert({
            user_id: userId,
            points: points,
            lifetime_points: points,
            level: this.calculateLevel(points)
          });
        
        if (insertError) {
          console.error('Error creating points record:', insertError);
          return { success: false };
        }
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
      
      return { success: true, newTotal };
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

      // First check if user has enough points
      const { data: currentData, error: fetchError } = await supabase
        .from('reward_points')
        .select('points')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (fetchError || !currentData) {
        console.error('Error fetching current points:', fetchError);
        return { success: false };
      }
      
      if (currentData.points < points) {
        return { success: false }; // Not enough points
      }
      
      // Update points (subtract)
      const newTotal = currentData.points - points;
      const { error: updateError } = await supabase
        .from('reward_points')
        .update({ 
          points: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error redeeming points:', updateError);
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
      
      return { success: true, newTotal };
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
      return data.map(record => ({
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
   * Calculate level name based on lifetime points
   */
  static calculateLevel(lifetimePoints: number): string {
    if (lifetimePoints >= 2500) {
      return 'platinumTier';
    } else if (lifetimePoints >= 1000) {
      return 'goldTier';
    } else if (lifetimePoints >= 500) {
      return 'silverTier';
    } else {
      return 'bronzeTier';
    }
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
   * Get available rewards
   */
  static async getAvailableRewards(): Promise<UserReward[]> {
    // In a full implementation, this would fetch from a rewards table
    // For now, returning mock data since there's no rewards table yet
    return Promise.resolve([
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
    ]);
  }
}
