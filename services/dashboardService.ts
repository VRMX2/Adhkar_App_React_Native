// services/dashboardService.ts
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface UserStats {
  prayersCompleted: number;
  prayersCompletedToday: number;
  dhikrCount: number;
  dhikrCountToday: number;
  quranReadingTime: number;
  quranReadingTimeToday: number;
  streakDays: number;
  lastActiveDate: Date;
  totalDuas: number;
  duasToday: number;
  lastUpdated: Date;
}

export interface DailyStats {
  userId: string;
  date: string;
  prayersCompleted: number;
  dhikrCount: number;
  quranReadingTime: number;
  duasRead: number;
  activities: Activity[];
}

export interface Activity {
  id: string;
  userId: string;
  type: 'prayer' | 'dhikr' | 'quran' | 'dua';
  title: string;
  subtitle: string;
  timestamp: Date;
  metadata?: any;
}

export interface PrayerLog {
  id: string;
  userId: string;
  prayerName: string;
  completedAt: Date;
  date: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Goal {
  id: string;
  userId: string;
  type: 'prayer' | 'dhikr' | 'quran' | 'dua';
  title: string;
  description: string;
  target: number;
  current: number;
  period: 'daily' | 'weekly' | 'monthly';
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to safely convert timestamps to Date objects
const safeToDate = (timestamp: any): Date => {
  if (!timestamp) {
    return new Date();
  }
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }
  
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  return new Date();
};

class DashboardService {
  // Connection timeout for Firebase operations
  private readonly TIMEOUT_MS = 10000; // 10 seconds

  // Helper method to run operations with timeout
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number = this.TIMEOUT_MS): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      )
    ]);
  }

  // Initialize user data when they first sign up or sign in
  async initializeUserDashboard(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      console.log('Initializing dashboard for user:', userId);

      // Check if user stats already exist
      const statsRef = doc(db, 'userStats', userId);
      const statsDoc = await this.withTimeout(getDoc(statsRef));
      
      if (!statsDoc.exists()) {
        console.log('Creating initial stats for user:', userId);
        
        const initialStats = {
          prayersCompleted: 0,
          prayersCompletedToday: 0,
          dhikrCount: 0,
          dhikrCountToday: 0,
          quranReadingTime: 0,
          quranReadingTimeToday: 0,
          streakDays: 0,
          lastActiveDate: serverTimestamp(),
          totalDuas: 0,
          duasToday: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        await this.withTimeout(setDoc(statsRef, initialStats));
        console.log('Initial stats created successfully');
      }
      
      // Initialize daily stats for today
      await this.initializeDailyStats(userId);
      
      // Initialize default goals
      await this.initializeDefaultGoals(userId);
      
    } catch (error) {
      console.error('Error initializing user dashboard:', error);
      throw new Error(`Failed to initialize dashboard: ${error.message}`);
    }
  }
  
  // Initialize daily stats for a specific date
  async initializeDailyStats(userId: string, date?: string): Promise<void> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const dailyStatsRef = doc(db, 'dailyStats', `${userId}_${targetDate}`);
      const dailyStatsDoc = await this.withTimeout(getDoc(dailyStatsRef));
      
      if (!dailyStatsDoc.exists()) {
        const initialDailyStats: Partial<DailyStats> = {
          userId,
          date: targetDate,
          prayersCompleted: 0,
          dhikrCount: 0,
          quranReadingTime: 0,
          duasRead: 0,
          activities: [],
        };
        
        await this.withTimeout(setDoc(dailyStatsRef, {
          ...initialDailyStats,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }));
      }
    } catch (error) {
      console.error('Error initializing daily stats:', error);
      // Don't throw here, it's not critical
    }
  }
  
  // Initialize default goals for new users
  async initializeDefaultGoals(userId: string): Promise<void> {
    try {
      // Check if user already has goals
      const existingGoalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', userId),
        limit(1)
      );
      
      const existingGoalsSnapshot = await this.withTimeout(getDocs(existingGoalsQuery));
      
      if (!existingGoalsSnapshot.empty) {
        return; // User already has goals
      }

      const defaultGoals = [
        {
          type: 'prayer',
          title: 'Complete 5 Daily Prayers',
          description: 'Complete all five daily prayers consistently',
          target: 5,
          period: 'daily',
        },
        {
          type: 'dhikr',
          title: 'Daily Dhikr Goal',
          description: 'Complete 100 dhikr daily',
          target: 100,
          period: 'daily',
        },
        {
          type: 'quran',
          title: 'Quran Reading',
          description: 'Read Quran for 30 minutes daily',
          target: 30,
          period: 'daily',
        },
        {
          type: 'dua',
          title: 'Daily Duas',
          description: 'Read 10 duas daily',
          target: 10,
          period: 'daily',
        },
      ];
      
      const batch = writeBatch(db);
      const goalsCollection = collection(db, 'goals');
      
      for (const goal of defaultGoals) {
        const goalRef = doc(goalsCollection);
        batch.set(goalRef, {
          id: goalRef.id,
          userId,
          ...goal,
          current: 0,
          isCompleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      await this.withTimeout(batch.commit());
    } catch (error) {
      console.error('Error initializing default goals:', error);
      // Don't throw here, it's not critical
    }
  }
  
  // Get user statistics
  async getUserStats(userId: string): Promise<UserStats | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      console.log('Fetching stats for user:', userId);
      
      const statsDoc = await this.withTimeout(getDoc(doc(db, 'userStats', userId)));
      
      if (statsDoc.exists()) {
        const data = statsDoc.data();
        console.log('Raw stats data:', data);
        
        const stats: UserStats = {
          prayersCompleted: data.prayersCompleted || 0,
          prayersCompletedToday: data.prayersCompletedToday || 0,
          dhikrCount: data.dhikrCount || 0,
          dhikrCountToday: data.dhikrCountToday || 0,
          quranReadingTime: data.quranReadingTime || 0,
          quranReadingTimeToday: data.quranReadingTimeToday || 0,
          streakDays: data.streakDays || 0,
          lastActiveDate: safeToDate(data.lastActiveDate),
          totalDuas: data.totalDuas || 0,
          duasToday: data.duasToday || 0,
          lastUpdated: safeToDate(data.updatedAt),
        };
        
        console.log('Processed stats:', stats);
        return stats;
      }
      
      console.log('No stats document found for user:', userId);
      return null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }
  }
  
  // Mark prayer as completed
  async markPrayerComplete(userId: string, prayerName: string, location?: { latitude: number; longitude: number }): Promise<void> {
    if (!userId || !prayerName) {
      throw new Error('User ID and prayer name are required');
    }

    try {
      const batch = writeBatch(db);
      const today = new Date().toISOString().split('T')[0];
      
      // Update user stats
      const userStatsRef = doc(db, 'userStats', userId);
      batch.update(userStatsRef, {
        prayersCompleted: increment(1),
        prayersCompletedToday: increment(1),
        lastActiveDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Update daily stats
      const dailyStatsRef = doc(db, 'dailyStats', `${userId}_${today}`);
      batch.update(dailyStatsRef, {
        prayersCompleted: increment(1),
        updatedAt: serverTimestamp(),
      });
      
      // Add prayer log
      const prayerLogRef = doc(collection(db, 'prayerLogs'));
      const prayerLog: Partial<PrayerLog> = {
        id: prayerLogRef.id,
        userId,
        prayerName,
        date: today,
        completedAt: serverTimestamp() as any,
      };
      
      if (location) {
        prayerLog.location = location;
      }
      
      batch.set(prayerLogRef, prayerLog);
      
      await this.withTimeout(batch.commit());
      
      // Add activity (non-blocking)
      this.addActivity(userId, {
        type: 'prayer',
        title: 'Prayer Completed',
        subtitle: `${prayerName} prayer completed`,
        metadata: { prayerName },
      }).catch(err => console.error('Error adding activity:', err));
      
      // Update prayer goals (non-blocking)
      this.updateGoalProgress(userId, 'prayer', 1).catch(err => 
        console.error('Error updating goals:', err)
      );
      
    } catch (error) {
      console.error('Error marking prayer complete:', error);
      throw new Error(`Failed to mark prayer complete: ${error.message}`);
    }
  }
  
  // Update dhikr count
  async updateDhikrCount(userId: string, count: number): Promise<void> {
    if (!userId || typeof count !== 'number' || count < 0) {
      throw new Error('Valid user ID and positive count are required');
    }

    try {
      const batch = writeBatch(db);
      const today = new Date().toISOString().split('T')[0];
      
      // Update user stats
      const userStatsRef = doc(db, 'userStats', userId);
      batch.update(userStatsRef, {
        dhikrCount: increment(count),
        dhikrCountToday: increment(count),
        lastActiveDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Update daily stats
      const dailyStatsRef = doc(db, 'dailyStats', `${userId}_${today}`);
      batch.update(dailyStatsRef, {
        dhikrCount: increment(count),
        updatedAt: serverTimestamp(),
      });
      
      await this.withTimeout(batch.commit());
      
      // Add activity (non-blocking) only for significant counts
      if (count >= 10) {
        this.addActivity(userId, {
          type: 'dhikr',
          title: 'Dhikr Session',
          subtitle: `${count} dhikr completed`,
          metadata: { count },
        }).catch(err => console.error('Error adding activity:', err));
      }
      
      // Update dhikr goals (non-blocking)
      this.updateGoalProgress(userId, 'dhikr', count).catch(err =>
        console.error('Error updating goals:', err)
      );
      
    } catch (error) {
      console.error('Error updating dhikr count:', error);
      throw new Error(`Failed to update dhikr count: ${error.message}`);
    }
  }
  
  // Update Quran reading time
  async updateQuranReadingTime(userId: string, minutes: number): Promise<void> {
    if (!userId || typeof minutes !== 'number' || minutes < 0) {
      throw new Error('Valid user ID and positive minutes are required');
    }

    try {
      const batch = writeBatch(db);
      const today = new Date().toISOString().split('T')[0];
      
      // Update user stats
      const userStatsRef = doc(db, 'userStats', userId);
      batch.update(userStatsRef, {
        quranReadingTime: increment(minutes),
        quranReadingTimeToday: increment(minutes),
        lastActiveDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Update daily stats
      const dailyStatsRef = doc(db, 'dailyStats', `${userId}_${today}`);
      batch.update(dailyStatsRef, {
        quranReadingTime: increment(minutes),
        updatedAt: serverTimestamp(),
      });
      
      await this.withTimeout(batch.commit());
      
      // Add activity (non-blocking)
      this.addActivity(userId, {
        type: 'quran',
        title: 'Quran Reading',
        subtitle: `${minutes} minutes of reading`,
        metadata: { minutes },
      }).catch(err => console.error('Error adding activity:', err));
      
      // Update Quran goals (non-blocking)
      this.updateGoalProgress(userId, 'quran', minutes).catch(err =>
        console.error('Error updating goals:', err)
      );
      
    } catch (error) {
      console.error('Error updating Quran reading time:', error);
      throw new Error(`Failed to update Quran reading time: ${error.message}`);
    }
  }
  
  // Update dua count
  async updateDuaCount(userId: string, count: number = 1): Promise<void> {
    if (!userId || typeof count !== 'number' || count < 0) {
      throw new Error('Valid user ID and positive count are required');
    }

    try {
      const batch = writeBatch(db);
      const today = new Date().toISOString().split('T')[0];
      
      // Update user stats
      const userStatsRef = doc(db, 'userStats', userId);
      batch.update(userStatsRef, {
        totalDuas: increment(count),
        duasToday: increment(count),
        lastActiveDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Update daily stats
      const dailyStatsRef = doc(db, 'dailyStats', `${userId}_${today}`);
      batch.update(dailyStatsRef, {
        duasRead: increment(count),
        updatedAt: serverTimestamp(),
      });
      
      await this.withTimeout(batch.commit());
      
      // Add activity (non-blocking)
      this.addActivity(userId, {
        type: 'dua',
        title: 'Dua Read',
        subtitle: `${count} dua${count > 1 ? 's' : ''} completed`,
        metadata: { count },
      }).catch(err => console.error('Error adding activity:', err));
      
      // Update dua goals (non-blocking)
      this.updateGoalProgress(userId, 'dua', count).catch(err =>
        console.error('Error updating goals:', err)
      );
      
    } catch (error) {
      console.error('Error updating dua count:', error);
      throw new Error(`Failed to update dua count: ${error.message}`);
    }
  }
  
  // Add activity to daily stats
  async addActivity(userId: string, activityData: Omit<Activity, 'id' | 'userId' | 'timestamp'>): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyStatsRef = doc(db, 'dailyStats', `${userId}_${today}`);
      
      const activity: Activity = {
        id: Date.now().toString(),
        userId,
        timestamp: new Date(),
        ...activityData,
      };
      
      const dailyStatsDoc = await this.withTimeout(getDoc(dailyStatsRef));
      if (dailyStatsDoc.exists()) {
        const currentActivities = dailyStatsDoc.data().activities || [];
        const updatedActivities = [activity, ...currentActivities].slice(0, 50); // Keep only last 50 activities
        
        await this.withTimeout(updateDoc(dailyStatsRef, {
          activities: updatedActivities,
          updatedAt: serverTimestamp(),
        }));
      }
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  }
  
  // Get recent activities
  async getRecentActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyStatsRef = doc(db, 'dailyStats', `${userId}_${today}`);
      const dailyStatsDoc = await this.withTimeout(getDoc(dailyStatsRef));
      
      if (dailyStatsDoc.exists()) {
        const activities = dailyStatsDoc.data().activities || [];
        return activities.slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }
  
  // Update goal progress
  async updateGoalProgress(userId: string, goalType: string, progress: number): Promise<void> {
    try {
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', userId),
        where('type', '==', goalType),
        where('period', '==', 'daily'),
        where('isCompleted', '==', false)
      );
      
      const goalsSnapshot = await this.withTimeout(getDocs(goalsQuery));
      
      if (!goalsSnapshot.empty) {
        const batch = writeBatch(db);
        
        goalsSnapshot.forEach((goalDoc) => {
          const goalData = goalDoc.data();
          const newProgress = Math.min(goalData.current + progress, goalData.target);
          const isCompleted = newProgress >= goalData.target;
          
          batch.update(goalDoc.ref, {
            current: newProgress,
            isCompleted,
            updatedAt: serverTimestamp(),
          });
        });
        
        await this.withTimeout(batch.commit());
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  }
  
  // Calculate and update streak
  async updateStreak(userId: string): Promise<void> {
    try {
      const userStatsRef = doc(db, 'userStats', userId);
      const userStatsDoc = await this.withTimeout(getDoc(userStatsRef));
      
      if (!userStatsDoc.exists()) return;
      
      const userData = userStatsDoc.data();
      const lastActiveDate = userData.lastActiveDate ? safeToDate(userData.lastActiveDate) : null;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let newStreakDays = userData.streakDays || 0;
      
      if (!lastActiveDate) {
        newStreakDays = 1;
      } else {
        const lastActiveDateString = lastActiveDate.toISOString().split('T')[0];
        const todayString = today.toISOString().split('T')[0];
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        if (lastActiveDateString === todayString) {
          // Already active today, keep current streak
          return;
        } else if (lastActiveDateString === yesterdayString) {
          // Was active yesterday, increment streak
          newStreakDays += 1;
        } else {
          // Streak broken, reset to 1
          newStreakDays = 1;
        }
      }
      
      await this.withTimeout(updateDoc(userStatsRef, {
        streakDays: newStreakDays,
        updatedAt: serverTimestamp(),
      }));
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }
  
  // Reset daily stats (run daily)
  async resetDailyStats(userId: string): Promise<void> {
    try {
      const userStatsRef = doc(db, 'userStats', userId);
      await this.withTimeout(updateDoc(userStatsRef, {
        prayersCompletedToday: 0,
        dhikrCountToday: 0,
        quranReadingTimeToday: 0,
        duasToday: 0,
        updatedAt: serverTimestamp(),
      }));
      
      // Reset daily goals
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', userId),
        where('period', '==', 'daily')
      );
      
      const goalsSnapshot = await this.withTimeout(getDocs(goalsQuery));
      const batch = writeBatch(db);
      
      goalsSnapshot.forEach((goalDoc) => {
        batch.update(goalDoc.ref, {
          current: 0,
          isCompleted: false,
          updatedAt: serverTimestamp(),
        });
      });
      
      await this.withTimeout(batch.commit());
    } catch (error) {
      console.error('Error resetting daily stats:', error);
    }
  }
  
  // Listen to user stats changes with better error handling
  onUserStatsChanged(userId: string, callback: (stats: UserStats | null) => void): () => void {
    if (!userId) {
      console.error('User ID is required for stats listener');
      callback(null);
      return () => {};
    }

    console.log('Setting up stats listener for user:', userId);
    const userStatsRef = doc(db, 'userStats', userId);
    
    return onSnapshot(
      userStatsRef, 
      (doc) => {
        try {
          if (doc.exists()) {
            const data = doc.data();
            console.log('Stats listener - raw data:', data);
            
            const stats: UserStats = {
              prayersCompleted: data.prayersCompleted || 0,
              prayersCompletedToday: data.prayersCompletedToday || 0,
              dhikrCount: data.dhikrCount || 0,
              dhikrCountToday: data.dhikrCountToday || 0,
              quranReadingTime: data.quranReadingTime || 0,
              quranReadingTimeToday: data.quranReadingTimeToday || 0,
              streakDays: data.streakDays || 0,
              lastActiveDate: safeToDate(data.lastActiveDate),
              totalDuas: data.totalDuas || 0,
              duasToday: data.duasToday || 0,
              lastUpdated: safeToDate(data.updatedAt),
            };
            
            console.log('Stats listener - processed stats:', stats);
            callback(stats);
          } else {
            console.log('Stats listener - no document found');
            callback(null);
          }
        } catch (error) {
          console.error('Error processing stats update:', error);
          callback(null);
        }
      }, 
      (error) => {
        console.error('Error listening to user stats:', error);
        callback(null);
      }
    );
  }
  
  // Get user goals
  async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const goalsSnapshot = await this.withTimeout(getDocs(goalsQuery));
      const goals: Goal[] = [];
      
      goalsSnapshot.forEach((doc) => {
        const data = doc.data();
        goals.push({
          id: data.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          description: data.description,
          target: data.target,
          current: data.current,
          period: data.period,
          isCompleted: data.isCompleted,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt),
        });
      });
      
      return goals;
    } catch (error) {
      console.error('Error getting user goals:', error);
      return [];
    }
  }
}

export const dashboardService = new DashboardService();