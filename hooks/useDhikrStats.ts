import { useState, useEffect } from 'react';
import { firebaseAdhkarService, UserDhikrStats } from '@/services/adhkarService';
import { useAuth } from '@/contexts/AuthContext';

export const useDhikrStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserDhikrStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    // Set up real-time listener
    const unsubscribe = firebaseAdhkarService.onDhikrStatsChange((newStats) => {
      setStats(newStats);
      setIsLoading(false);
    });

    // Initial load
    loadStats();

    return () => unsubscribe();
  }, [user]);

  const loadStats = async () => {
    try {
      const userStats = await firebaseAdhkarService.getUserDhikrStats();
      setStats(userStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateGoals = async (weeklyGoal: number, monthlyGoal: number) => {
    try {
      await firebaseAdhkarService.setUserGoals(weeklyGoal, monthlyGoal);
      // Stats will be updated automatically through the listener
    } catch (error) {
      console.error('Error updating goals:', error);
      throw error;
    }
  };

  return {
    stats,
    isLoading,
    updateGoals,
    reload: loadStats,
  };
};