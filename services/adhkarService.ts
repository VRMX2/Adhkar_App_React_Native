// services/firebaseAdhkarService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { Dhikr, DhikrCategory } from '@/types/dhikr';

export interface UserDhikrProgress {
  dhikrId: string;
  currentCount: number;
  targetCount: number;
  completedAt?: Date;
  startedAt: Date;
  isCompleted: boolean;
  category: DhikrCategory;
}

export interface DhikrSession {
  id: string;
  userId: string;
  dhikrId: string;
  category: DhikrCategory;
  count: number;
  duration: number; // in seconds
  startedAt: Date;
  completedAt: Date;
  isCompleted: boolean;
}

export interface UserDhikrStats {
  totalSessions: number;
  totalDhikrCount: number;
  totalTimeSpent: number; // in minutes
  streakDays: number;
  lastActiveDate: Date;
  favoriteCategories: DhikrCategory[];
  weeklyGoal: number;
  monthlyGoal: number;
  categoriesCompleted: {
    [key in DhikrCategory]: number;
  };
}

class FirebaseAdhkarService {
  private storageKey = 'islamic_app_adhkar';
  private favoritesKey = 'islamic_app_favorites';
  private offlineModeKey = 'islamic_app_offline_mode';

  private defaultAdhkar: Record<DhikrCategory, Dhikr[]> = {
    morning: [
      {
        id: '1',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لا إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
        transliteration: 'Asbahnaa wa asbaha al-mulku lillaahi walhamdu lillaah, laa ilaaha illa Allaahu wahdahu laa shareeka lah, lahu al-mulku wa lahu al-hamdu wa huwa ala kulli shay-in qadeer. Rabbi as-aluka khayra maa fee haadha al-yawmi wa khayra maa ba\'dah, wa a\'oodhu bika min sharri maa fee haadha al-yawmi wa sharri maa ba\'dah. Rabbi a\'oodhu bika min al-kasali wa soo-i al-kibar. Rabbi a\'oodhu bika min \'adhabin fi an-naari wa \'adhabin fi al-qabr.',
        translation: 'We have reached the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this day and the good of what follows it and I take refuge in You from the evil of this day and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.',
        count: 1,
        source: 'Muslim',
        category: 'morning',
      },
      {
        id: '2',
        arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
        transliteration: 'Allaahumma bika asbahnaa wa bika amsaynaa wa bika nahyaa wa bika namootu wa ilayka an-nushoor',
        translation: 'O Allah, by Your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection.',
        count: 1,
        source: 'Abu Dawud, Tirmidhi',
        category: 'morning',
      },
      // ... (include all other adhkar as needed)
    ],
    evening: [
      // ... (include evening adhkar)
    ],
    general: [
      // ... (include general adhkar)
    ],
    sleeping: [
      // ... (include sleeping adhkar)
    ],
  };

  // Check if user is authenticated
  private getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  // Check if app is in offline mode
  private async isOfflineMode(): Promise<boolean> {
    try {
      const offline = await AsyncStorage.getItem(this.offlineModeKey);
      return offline === 'true';
    } catch {
      return false;
    }
  }

  // Set offline mode
  async setOfflineMode(offline: boolean): Promise<void> {
    await AsyncStorage.setItem(this.offlineModeKey, offline.toString());
  }

  // Initialize default adhkar in Firebase for new users
  async initializeUserAdhkar(userId: string): Promise<void> {
    try {
      const userAdhkarRef = doc(db, 'userAdhkar', userId);
      const userAdhkarDoc = await getDoc(userAdhkarRef);
      
      if (!userAdhkarDoc.exists()) {
        await setDoc(userAdhkarRef, {
          adhkar: this.defaultAdhkar,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Initialize user stats
      const userStatsRef = doc(db, 'userDhikrStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (!userStatsDoc.exists()) {
        const initialStats: UserDhikrStats = {
          totalSessions: 0,
          totalDhikrCount: 0,
          totalTimeSpent: 0,
          streakDays: 0,
          lastActiveDate: new Date(),
          favoriteCategories: [],
          weeklyGoal: 50,
          monthlyGoal: 200,
          categoriesCompleted: {
            morning: 0,
            evening: 0,
            general: 0,
            sleeping: 0,
          },
        };

        await setDoc(userStatsRef, {
          ...initialStats,
          lastActiveDate: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error initializing user adhkar:', error);
    }
  }

  // Get adhkar by category
  async getAdhkarByCategory(category: DhikrCategory): Promise<Dhikr[]> {
    try {
      const userId = this.getCurrentUserId();
      const isOffline = await this.isOfflineMode();

      if (!userId || isOffline) {
        // Use local storage for offline or unauthenticated users
        const stored = await AsyncStorage.getItem(this.storageKey);
        if (stored) {
          const allAdhkar = JSON.parse(stored);
          return allAdhkar[category] || this.defaultAdhkar[category];
        }
        return this.defaultAdhkar[category];
      }

      // Get from Firebase for authenticated users
      const userAdhkarRef = doc(db, 'userAdhkar', userId);
      const userAdhkarDoc = await getDoc(userAdhkarRef);
      
      if (userAdhkarDoc.exists()) {
        const data = userAdhkarDoc.data();
        return data.adhkar[category] || this.defaultAdhkar[category];
      }

      // Initialize if doesn't exist
      await this.initializeUserAdhkar(userId);
      return this.defaultAdhkar[category];
    } catch (error) {
      console.error('Error getting adhkar:', error);
      return this.defaultAdhkar[category];
    }
  }

  // Get all adhkar
  async getAllAdhkar(): Promise<Record<DhikrCategory, Dhikr[]>> {
    try {
      const userId = this.getCurrentUserId();
      const isOffline = await this.isOfflineMode();

      if (!userId || isOffline) {
        const stored = await AsyncStorage.getItem(this.storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
        return this.defaultAdhkar;
      }

      const userAdhkarRef = doc(db, 'userAdhkar', userId);
      const userAdhkarDoc = await getDoc(userAdhkarRef);
      
      if (userAdhkarDoc.exists()) {
        return userAdhkarDoc.data().adhkar || this.defaultAdhkar;
      }

      await this.initializeUserAdhkar(userId);
      return this.defaultAdhkar;
    } catch (error) {
      console.error('Error getting all adhkar:', error);
      return this.defaultAdhkar;
    }
  }

  // Save custom adhkar
  async saveCustomDhikr(dhikr: Dhikr): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to save custom dhikr');
      }

      const customDhikrRef = collection(db, 'customDhikr');
      await addDoc(customDhikrRef, {
        ...dhikr,
        userId,
        isCustom: true,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving custom dhikr:', error);
      throw error;
    }
  }

  // Get user's custom adhkar
  async getCustomAdhkar(): Promise<Dhikr[]> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return [];

      const customDhikrQuery = query(
        collection(db, 'customDhikr'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(customDhikrQuery);
      const customAdhkar: Dhikr[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        customAdhkar.push({
          id: doc.id,
          arabic: data.arabic,
          transliteration: data.transliteration,
          translation: data.translation,
          count: data.count,
          source: data.source,
          category: data.category,
        });
      });

      return customAdhkar;
    } catch (error) {
      console.error('Error getting custom adhkar:', error);
      return [];
    }
  }

  // Get favorites
  async getFavorites(): Promise<string[]> {
    try {
      const userId = this.getCurrentUserId();
      const isOffline = await this.isOfflineMode();

      if (!userId || isOffline) {
        const stored = await AsyncStorage.getItem(this.favoritesKey);
        return stored ? JSON.parse(stored) : [];
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data().favorites || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  // Add to favorites
  async addFavorite(dhikrId: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const isOffline = await this.isOfflineMode();

      if (!userId || isOffline) {
        const favorites = await this.getFavorites();
        if (!favorites.includes(dhikrId)) {
          favorites.push(dhikrId);
          await AsyncStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
        }
        return;
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayUnion(dhikrId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  }

  // Remove from favorites
  async removeFavorite(dhikrId: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const isOffline = await this.isOfflineMode();

      if (!userId || isOffline) {
        const favorites = await this.getFavorites();
        const updated = favorites.filter(id => id !== dhikrId);
        await AsyncStorage.setItem(this.favoritesKey, JSON.stringify(updated));
        return;
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayRemove(dhikrId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  // Start dhikr session
  async startDhikrSession(dhikrId: string, category: DhikrCategory): Promise<string> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to start dhikr session');
      }

      const sessionRef = collection(db, 'dhikrSessions');
      const sessionDoc = await addDoc(sessionRef, {
        userId,
        dhikrId,
        category,
        count: 0,
        duration: 0,
        startedAt: serverTimestamp(),
        isCompleted: false,
        createdAt: serverTimestamp(),
      });

      return sessionDoc.id;
    } catch (error) {
      console.error('Error starting dhikr session:', error);
      throw error;
    }
  }

  // Update dhikr session progress
  async updateDhikrProgress(sessionId: string, count: number): Promise<void> {
    try {
      const sessionRef = doc(db, 'dhikrSessions', sessionId);
      await updateDoc(sessionRef, {
        count,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating dhikr progress:', error);
    }
  }

  // Complete dhikr session
  async completeDhikrSession(sessionId: string, finalCount: number, duration: number): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const sessionRef = doc(db, 'dhikrSessions', sessionId);
      
      // Update session
      await updateDoc(sessionRef, {
        count: finalCount,
        duration,
        isCompleted: true,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update user stats
      const userStatsRef = doc(db, 'userDhikrStats', userId);
      await updateDoc(userStatsRef, {
        totalSessions: increment(1),
        totalDhikrCount: increment(finalCount),
        totalTimeSpent: increment(Math.floor(duration / 60)), // convert to minutes
        lastActiveDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update daily streak
      await this.updateDailyStreak(userId);
    } catch (error) {
      console.error('Error completing dhikr session:', error);
    }
  }

  // Update daily streak
  private async updateDailyStreak(userId: string): Promise<void> {
    try {
      const userStatsRef = doc(db, 'userDhikrStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (userStatsDoc.exists()) {
        const data = userStatsDoc.data();
        const lastActiveDate = data.lastActiveDate?.toDate();
        const today = new Date();
        
        let newStreak = data.streakDays || 0;
        
        if (lastActiveDate) {
          const daysDiff = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            // Consecutive day - increment streak
            newStreak += 1;
          } else if (daysDiff > 1) {
            // Streak broken - reset to 1
            newStreak = 1;
          }
          // Same day - keep current streak
        } else {
          // First time - start streak
          newStreak = 1;
        }
        
        await updateDoc(userStatsRef, {
          streakDays: newStreak,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating daily streak:', error);
    }
  }

  // Get user dhikr statistics
  async getUserDhikrStats(): Promise<UserDhikrStats | null> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return null;

      const userStatsRef = doc(db, 'userDhikrStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (userStatsDoc.exists()) {
        const data = userStatsDoc.data();
        return {
          totalSessions: data.totalSessions || 0,
          totalDhikrCount: data.totalDhikrCount || 0,
          totalTimeSpent: data.totalTimeSpent || 0,
          streakDays: data.streakDays || 0,
          lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
          favoriteCategories: data.favoriteCategories || [],
          weeklyGoal: data.weeklyGoal || 50,
          monthlyGoal: data.monthlyGoal || 200,
          categoriesCompleted: data.categoriesCompleted || {
            morning: 0,
            evening: 0,
            general: 0,
            sleeping: 0,
          },
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user dhikr stats:', error);
		return null;
    }
  }

  // Get recent dhikr sessions
  async getRecentSessions(limitCount: number = 10): Promise<DhikrSession[]> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return [];

      const sessionsQuery = query(
        collection(db, 'dhikrSessions'),
        where('userId', '==', userId),
        where('isCompleted', '==', true),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(sessionsQuery);
      const sessions: DhikrSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          userId: data.userId,
          dhikrId: data.dhikrId,
          category: data.category,
          count: data.count,
          duration: data.duration,
          startedAt: data.startedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate() || new Date(),
          isCompleted: data.isCompleted,
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  }

  // Search adhkar
  async searchAdhkar(query: string): Promise<Dhikr[]> {
    try {
      const allAdhkar = await this.getAllAdhkar();
      const searchResults: Dhikr[] = [];
      const lowercaseQuery = query.toLowerCase();

      Object.values(allAdhkar).flat().forEach(dhikr => {
        if (
          dhikr.arabic.toLowerCase().includes(lowercaseQuery) ||
          dhikr.transliteration.toLowerCase().includes(lowercaseQuery) ||
          dhikr.translation.toLowerCase().includes(lowercaseQuery) ||
          dhikr.source?.toLowerCase().includes(lowercaseQuery)
        ) {
          searchResults.push(dhikr);
        }
      });

      // Also search custom adhkar
      const customAdhkar = await this.getCustomAdhkar();
      customAdhkar.forEach(dhikr => {
        if (
          dhikr.arabic.toLowerCase().includes(lowercaseQuery) ||
          dhikr.transliteration.toLowerCase().includes(lowercaseQuery) ||
          dhikr.translation.toLowerCase().includes(lowercaseQuery) ||
          dhikr.source?.toLowerCase().includes(lowercaseQuery)
        ) {
          searchResults.push(dhikr);
        }
      });

      return searchResults;
    } catch (error) {
      console.error('Error searching adhkar:', error);
      return [];
    }
  }

  // Set weekly/monthly goals
  async setUserGoals(weeklyGoal: number, monthlyGoal: number): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const userStatsRef = doc(db, 'userDhikrStats', userId);
      await updateDoc(userStatsRef, {
        weeklyGoal,
        monthlyGoal,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting user goals:', error);
    }
  }

  // Sync offline data when coming back online
  async syncOfflineData(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      // Sync favorites
      const localFavorites = await AsyncStorage.getItem(this.favoritesKey);
      if (localFavorites) {
        const favorites = JSON.parse(localFavorites);
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          favorites,
          updatedAt: serverTimestamp(),
        });
      }

      // Clear offline mode
      await this.setOfflineMode(false);
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }

  // Listen to real-time updates
  onDhikrStatsChange(callback: (stats: UserDhikrStats | null) => void): () => void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      callback(null);
      return () => {};
    }

    const userStatsRef = doc(db, 'userDhikrStats', userId);
    return onSnapshot(userStatsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const stats: UserDhikrStats = {
          totalSessions: data.totalSessions || 0,
          totalDhikrCount: data.totalDhikrCount || 0,
          totalTimeSpent: data.totalTimeSpent || 0,
          streakDays: data.streakDays || 0,
          lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
          favoriteCategories: data.favoriteCategories || [],
          weeklyGoal: data.weeklyGoal || 50,
          monthlyGoal: data.monthlyGoal || 200,
          categoriesCompleted: data.categoriesCompleted || {
            morning: 0,
            evening: 0,
            general: 0,
            sleeping: 0,
          },
        };
        callback(stats);
      } else {
        callback(null);
      }
    });
  }

  // Get default adhkar
  getDefaultAdhkar(): Record<DhikrCategory, Dhikr[]> {
    return this.defaultAdhkar;
  }

  // Reset to default (clears all user data)
  async resetToDefault(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      
      // Clear local storage
      await AsyncStorage.multiRemove([this.storageKey, this.favoritesKey]);
      
      if (userId) {
        // Reset Firebase data
        const batch = writeBatch(db);
        
        // Reset user adhkar
        const userAdhkarRef = doc(db, 'userAdhkar', userId);
        batch.set(userAdhkarRef, {
          adhkar: this.defaultAdhkar,
          updatedAt: serverTimestamp(),
        });
        
        // Reset user stats
        const userStatsRef = doc(db, 'userDhikrStats', userId);
        batch.set(userStatsRef, {
          totalSessions: 0,
          totalDhikrCount: 0,
          totalTimeSpent: 0,
          streakDays: 0,
          lastActiveDate: serverTimestamp(),
          favoriteCategories: [],
          weeklyGoal: 50,
          monthlyGoal: 200,
          categoriesCompleted: {
            morning: 0,
            evening: 0,
            general: 0,
            sleeping: 0,
          },
          updatedAt: serverTimestamp(),
        });
        
        // Reset user favorites
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          favorites: [],
          updatedAt: serverTimestamp(),
        });
        
        await batch.commit();
      }
    } catch (error) {
      console.error('Error resetting to default:', error);
    }
  }
}

export const firebaseAdhkarService = new FirebaseAdhkarService();