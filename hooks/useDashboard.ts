import { useState, useEffect, useCallback } from 'react';
import { dashboardService, UserStats } from '@/services/dashboardService';
import { prayerTimesService, PrayerTimes } from '@/services/prayerTimesService';
import { useAuth } from '@/hooks/useAuth';
import * as Location from 'expo-location';

interface DashboardData {
  userStats: UserStats | null;
  prayerTimes: PrayerTimes | null;
  nextPrayer: string;
  timeUntilNext: string;
  location: Location.LocationObject | null;
  isLoading: boolean;
  error: string | null;
}

export const useDashboard = (): DashboardData & {
  markPrayerComplete: (prayerName: string) => Promise<void>;
  updateDhikrCount: (count: number) => Promise<void>;
  updateQuranTime: (minutes: number) => Promise<void>;
  updateDuaCount: (count?: number) => Promise<void>;
  refreshData: () => Promise<void>;
} => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user location
  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        // Return default location for Algeria (Bab Ezzouar, Algiers)
        const defaultLocation = {
          coords: {
            latitude: 36.7189,
            longitude: 3.1841,
            accuracy: null,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as Location.LocationObject;
        setLocation(defaultLocation);
        return defaultLocation;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000, // 15 second timeout
      });
      setLocation(location);
      return location;
    } catch (err) {
      console.error('Error getting location:', err);
      // Return default location for Algeria (Bab Ezzouar, Algiers)
      const defaultLocation = {
        coords: {
          latitude: 36.7189,
          longitude: 3.1841,
          accuracy: null,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as Location.LocationObject;
      setLocation(defaultLocation);
      return defaultLocation;
    }
  }, []);

  // Calculate next prayer info
  const updateNextPrayerInfo = useCallback((prayerTimes: PrayerTimes) => {
    try {
      const nextPrayerInfo = prayerTimesService.getNextPrayerInfo(prayerTimes);
      setNextPrayer(nextPrayerInfo.nextPrayer);
      setTimeUntilNext(nextPrayerInfo.timeUntilNext);
    } catch (err) {
      console.error('Error updating next prayer info:', err);
      setNextPrayer('Fajr');
      setTimeUntilNext('Loading...');
    }
  }, []);

  // Initialize user dashboard
  const initializeUserData = useCallback(async (userId: string) => {
    try {
      await dashboardService.initializeUserDashboard(userId);
    } catch (err) {
      console.error('Error initializing user dashboard:', err);
    }
  }, []);

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    // Don't load if auth is still loading
    if (authLoading) {
      return;
    }

    // If user is not authenticated, set loading to false and return
    if (!isAuthenticated || !user?.uid) {
      setIsLoading(false);
      setError('User not authenticated');
      return;
    }

    console.log('Loading dashboard data for user:', user.uid);
    setIsLoading(true);
    setError(null);

    try {
      // Initialize user data if needed
      await initializeUserData(user.uid);

      // Get location (this should not block the UI)
      const userLocation = await getUserLocation();
      console.log('Got location:', userLocation.coords);

      // Load prayer times with fallback
      try {
        const prayerTimesData = await prayerTimesService.getPrayerTimes(
          userLocation.coords.latitude,
          userLocation.coords.longitude
        );
        console.log('Got prayer times:', prayerTimesData);
        setPrayerTimes(prayerTimesData);
        updateNextPrayerInfo(prayerTimesData);
      } catch (prayerError) {
        console.error('Prayer times error:', prayerError);
        // Set fallback prayer times
        const fallbackPrayerTimes: PrayerTimes = {
          fajr: '05:30',
          dhuhr: '12:15',
          asr: '15:45',
          maghrib: '18:20',
          isha: '19:45',
          sunrise: '06:45',
          sunset: '18:15',
          date: new Date().toISOString().split('T')[0],
          hijriDate: '15 Sha\'ban 1445 AH',
        };
        setPrayerTimes(fallbackPrayerTimes);
        updateNextPrayerInfo(fallbackPrayerTimes);
      }

      // Load user stats with fallback
      try {
        const stats = await dashboardService.getUserStats(user.uid);
        console.log('Got user stats:', stats);
        setUserStats(stats || {
          prayersCompleted: 0,
          prayersCompletedToday: 0,
          dhikrCount: 0,
          dhikrCountToday: 0,
          quranReadingTime: 0,
          quranReadingTimeToday: 0,
          streakDays: 0,
          lastActiveDate: new Date(),
          totalDuas: 0,
          duasToday: 0,
          lastUpdated: new Date(),
        });
      } catch (statsError) {
        console.error('User stats error:', statsError);
        // Set fallback stats
        setUserStats({
          prayersCompleted: 0,
          prayersCompletedToday: 0,
          dhikrCount: 0,
          dhikrCountToday: 0,
          quranReadingTime: 0,
          quranReadingTimeToday: 0,
          streakDays: 0,
          lastActiveDate: new Date(),
          totalDuas: 0,
          duasToday: 0,
          lastUpdated: new Date(),
        });
      }

      // Update streak (don't wait for this)
      dashboardService.updateStreak(user.uid).catch(err => 
        console.error('Error updating streak:', err)
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error loading dashboard data:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, authLoading, isAuthenticated, getUserLocation, updateNextPrayerInfo, initializeUserData]);

  // Set up real-time listener for user stats
  useEffect(() => {
    if (!user?.uid || !isAuthenticated) return;

    console.log('Setting up stats listener for user:', user.uid);
    
    const unsubscribe = dashboardService.onUserStatsChanged(user.uid, (stats) => {
      console.log('Stats updated:', stats);
      setUserStats(stats);
    });

    return () => {
      console.log('Cleaning up stats listener');
      unsubscribe();
    };
  }, [user?.uid, isAuthenticated]);

  // Initial data load - only when authentication is complete and user is authenticated
  useEffect(() => {
    console.log('Dashboard effect - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'user:', user?.uid);
    
    if (!authLoading) {
      loadDashboardData();
    }
  }, [authLoading, isAuthenticated, user?.uid, loadDashboardData]);

  // Update next prayer info every minute
  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      updateNextPrayerInfo(prayerTimes);
    }, 60000);

    return () => clearInterval(interval);
  }, [prayerTimes, updateNextPrayerInfo]);

  // Prayer completion handler
  const markPrayerComplete = useCallback(async (prayerName: string) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const locationData = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : undefined;

      await dashboardService.markPrayerComplete(user.uid, prayerName, locationData);
      
      // Update streak after prayer completion
      await dashboardService.updateStreak(user.uid);
    } catch (err) {
      console.error('Error marking prayer complete:', err);
      throw err;
    }
  }, [user?.uid, location]);

  // Dhikr count update handler
  const updateDhikrCount = useCallback(async (count: number) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      await dashboardService.updateDhikrCount(user.uid, count);
    } catch (err) {
      console.error('Error updating dhikr count:', err);
      throw err;
    }
  }, [user?.uid]);

  // Quran reading time update handler
  const updateQuranTime = useCallback(async (minutes: number) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      await dashboardService.updateQuranReadingTime(user.uid, minutes);
    } catch (err) {
      console.error('Error updating Quran time:', err);
      throw err;
    }
  }, [user?.uid]);

  // Dua count update handler
  const updateDuaCount = useCallback(async (count: number = 1) => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      await dashboardService.updateDuaCount(user.uid, count);
    } catch (err) {
      console.error('Error updating dua count:', err);
      throw err;
    }
  }, [user?.uid]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  return {
    userStats,
    prayerTimes,
    nextPrayer,
    timeUntilNext,
    location,
    isLoading: isLoading || authLoading, // Include auth loading in dashboard loading
    error,
    markPrayerComplete,
    updateDhikrCount,
    updateQuranTime,
	updateDuaCount,
    refreshData,
  };
};