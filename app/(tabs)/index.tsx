import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { 
  Clock, 
  BookOpen, 
  Circle, 
  Heart, 
  Calendar, 
  MapPin, 
  Star, 
  Sunrise,
  ChevronRight,
  Bell,
  Settings,
  Moon,
  Sun,
  Compass,
  Target,
  TrendingUp,
  Award,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';

const { width, height } = Dimensions.get('window');

// Define types for better type safety
interface QuickAction {
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  gradient: string[];
  onPress: () => void;
}

interface StatData {
  icon: React.ComponentType<any>;
  value: string;
  label: string;
  progress: number;
  color: string;
  trend: string;
  isPositive: boolean;
}

export default function Dashboard() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, error: authError } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    userStats,
    prayerTimes,
    nextPrayer,
    timeUntilNext,
    location,
    isLoading: dashboardLoading,
    error: dashboardError,
    markPrayerComplete,
    updateDhikrCount,
    updateQuranTime,
    updateDuaCount,
    refreshData,
  } = useDashboard();

  const styles = createStyles(isDarkMode);
  const headerScrollOffset = useSharedValue(0);
  const isLoading = authLoading || dashboardLoading;
  const error = authError || dashboardError;

  // Debug logging
  useEffect(() => {
    console.log('Dashboard render state:', {
      authLoading,
      dashboardLoading,
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userId: user?.uid,
      error: error
    });
  }, [authLoading, dashboardLoading, isLoading, isAuthenticated, user, error]);

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        headerScrollOffset.value,
        [0, 120],
        [280, 140],
        Extrapolate.CLAMP
      ),
      paddingTop: interpolate(
        headerScrollOffset.value,
        [0, 120],
        [60, 20],
        Extrapolate.CLAMP
      ),
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      headerScrollOffset.value,
      [0, 80, 120],
      [1, 0.8, 0.6],
      Extrapolate.CLAMP
    );
    
    return {
      fontSize: interpolate(
        headerScrollOffset.value,
        [0, 120],
        [36, 26],
        Extrapolate.CLAMP
      ),
      opacity,
    };
  });

  const handlePrayerPress = (prayerName: string) => {
    Alert.alert(
      `Mark ${prayerName} Complete`,
      `Did you complete the ${prayerName} prayer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            try {
              await markPrayerComplete(prayerName);
              Alert.alert('Success', `${prayerName} prayer marked as complete!`);
            } catch (error) {
              console.error('Prayer completion error:', error);
              Alert.alert('Error', 'Failed to mark prayer as complete');
            }
          }
        }
      ]
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('Error', 'Failed to refresh data. Please check your connection.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Prayer Times',
      subtitle: nextPrayer ? `Next: ${nextPrayer}` : 'Loading...',
      icon: Clock,
      gradient: ['#00D4AA', '#00B894'],
      onPress: () => router.push('/prayer'),
    },
    {
      title: 'Adhkar',
      subtitle: 'Daily remembrance',
      icon: Sunrise,
      gradient: ['#FDCB6E', '#E17055'],
      onPress: () => router.push('/adhkar'),
    },
    {
      title: 'Tasbih',
      subtitle: 'Digital counter',
      icon: Circle,
      gradient: ['#A29BFE', '#6C5CE7'],
      onPress: () => router.push('/tasbih'),
    },
    {
      title: 'Quran',
      subtitle: 'Read and listen',
      icon: BookOpen,
      gradient: ['#74B9FF', '#0984E3'],
      onPress: () => router.push('/quran'),
    },
    {
      title: 'Qibla',
      subtitle: 'Find direction',
      icon: Compass,
      gradient: ['#FD79A8', '#E84393'],
      onPress: () => router.push('/qibla'),
    },
    {
      title: 'Goals',
      subtitle: 'Track progress',
      icon: Target,
      gradient: ['#55A3FF', '#1E40AF'],
      onPress: () => router.push('/goals'),
    },
  ];

  const getStatsData = (): StatData[] => {
    if (!userStats) return [];

    return [
      { 
        icon: Clock, 
        value: userStats.prayersCompletedToday.toString(), 
        label: 'Prayers Today', 
        progress: (userStats.prayersCompletedToday / 5) * 100, 
        color: '#00D4AA',
        trend: '+' + Math.max(0, userStats.prayersCompletedToday - 3).toString(),
        isPositive: true 
      },
      { 
        icon: Circle, 
        value: userStats.dhikrCountToday.toString(), 
        label: 'Dhikr Count', 
        progress: Math.min(100, (userStats.dhikrCountToday / 100) * 100), 
        color: '#A29BFE',
        trend: '+' + Math.floor((userStats.dhikrCountToday / (userStats.dhikrCount || 1)) * 100) + '%',
        isPositive: true 
      },
      { 
        icon: BookOpen, 
        value: userStats.duasToday.toString(), 
        label: 'Duas Read', 
        progress: Math.min(100, (userStats.duasToday / 10) * 100), 
        color: '#FDCB6E',
        trend: '+' + Math.max(0, userStats.duasToday - 5).toString(),
        isPositive: true 
      },
      { 
        icon: Award, 
        value: userStats.streakDays.toString(), 
        label: 'Streak Days', 
        progress: Math.min(100, (userStats.streakDays / 30) * 100), 
        color: '#FD79A8',
        trend: '+' + Math.max(0, userStats.streakDays - 30).toString(),
        isPositive: true 
      },
    ];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLocationText = () => {
    if (!location) return 'Getting location...';
    return 'Bab Ezzouar, Algiers';
  };

  const getCurrentPrayerTime = () => {
    if (!prayerTimes || !nextPrayer) return '--:--';
    const prayerKey = nextPrayer.toLowerCase() as keyof typeof prayerTimes;
    return prayerTimes[prayerKey] || '--:--';
  };

  // Show loading state first (before authentication check)
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#00D4AA' : '#0984E3'} />
        <Text style={[styles.loadingText, { color: isDarkMode ? '#F1F5F9' : '#0F172A' }]}>
          Loading your dashboard...
        </Text>
        <Text style={[styles.loadingSubtext, { color: isDarkMode ? '#64748B' : '#94A3B8' }]}>
          This may take a few moments
        </Text>
      </SafeAreaView>
    );
  }

  // Show authentication error if user is not authenticated (only after loading is complete)
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={isDarkMode ? '#EF4444' : '#DC2626'} />
          <Text style={[styles.errorTitle, { color: isDarkMode ? '#F1F5F9' : '#0F172A' }]}>
            Authentication Required
          </Text>
          <Text style={[styles.errorText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
            Please sign in to view your dashboard
          </Text>
          {error && (
            <Text style={[styles.errorDetail, { color: isDarkMode ? '#EF4444' : '#DC2626' }]}>
              {error}
            </Text>
          )}
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => router.push('/auth/signin')}
          >
            <Text style={styles.errorButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={isDarkMode 
            ? ['#0F172A', '#1E293B', '#334155'] 
            : ['#FFFFFF', '#F8FAFC', '#E2E8F0']
          }
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>السلام عليكم</Text>
              <Animated.Text style={[styles.userName, titleAnimatedStyle]}>
                {user?.displayName || user?.email?.split('@')[0] || 'Brother'}
              </Animated.Text>
              <Text style={styles.subtitle}>May Allah bless your day</Text>
            </View>
            
            <View style={styles.headerIcons}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleRefresh}
                disabled={isRefreshing}
              >
                <Animated.View
                  style={[
                    { transform: [{ rotate: isRefreshing ? '360deg' : '0deg' }] }
                  ]}
                >
                  <RefreshCw size={20} color={isDarkMode ? '#F1F5F9' : '#475569'} />
                </Animated.View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={toggleDarkMode}
              >
                {isDarkMode ? (
                  <Sun size={20} color="#FCD34D" />
                ) : (
                  <Moon size={20} color="#6366F1" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.iconButton, styles.notificationButton]}>
                <Bell size={20} color={isDarkMode ? '#F1F5F9' : '#475569'} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.dateLocationSection}>
            <View style={styles.timeSection}>
              <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
              <View style={styles.dateRow}>
                <Calendar size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                <Text style={styles.gregorianDate}>{formatDate(new Date())}</Text>
              </View>
              <Text style={styles.hijriDate}>{prayerTimes?.hijriDate || 'Loading...'}</Text>
            </View>
            
            <View style={styles.locationSection}>
              <View style={styles.locationRow}>
                <MapPin size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                <Text style={styles.location}>{getLocationText()}</Text>
              </View>
              {location && (
                <Text style={styles.coordinates}>
                  {location.coords.latitude.toFixed(4)}°, {location.coords.longitude.toFixed(4)}°
                </Text>
              )}
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={(event) => {
          headerScrollOffset.value = event.nativeEvent.contentOffset.y;
        }}
      >
        {/* Next Prayer Hero Card */}
        <Animated.View 
          entering={FadeInDown.duration(800).springify()} 
          style={styles.heroPrayerCard}
        >
          <TouchableOpacity
            onPress={() => nextPrayer && handlePrayerPress(nextPrayer)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#00D4AA', '#00B894', '#00A085']}
              style={styles.heroPrayerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroPrayerContent}>
                <View style={styles.heroPrayerLeft}>
                  <View style={styles.prayerBadge}>
                    <Text style={styles.prayerBadgeText}>Next Prayer</Text>
                  </View>
                  <Text style={styles.heroPrayerName}>{nextPrayer || 'Loading...'}</Text>
                  <Text style={styles.heroPrayerTime}>{timeUntilNext || 'Calculating...'}</Text>
                </View>
                
                <View style={styles.heroPrayerRight}>
                  <View style={styles.heroPrayerIconContainer}>
                    <Clock size={32} color="#FFFFFF" strokeWidth={2} />
                  </View>
                  <Text style={styles.currentPrayerTime}>
                    {getCurrentPrayerTime()}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Quick Access</Text>
              <Text style={styles.sectionSubtitle}>Navigate to your daily worship</Text>
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}
          >
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.title}
                entering={SlideInRight.delay(index * 100).duration(700).springify()}
                style={styles.actionCardWrapper}
              >
                <TouchableOpacity
                  style={styles.modernActionCard}
                  onPress={action.onPress}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.modernActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.modernActionContent}>
                      <View style={styles.modernActionIcon}>
                        <action.icon size={24} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                      
                      <View style={styles.actionTextContainer}>
                        <Text style={styles.modernActionTitle}>{action.title}</Text>
                        <Text style={styles.modernActionSubtitle}>{action.subtitle}</Text>
                      </View>
                      
                      <View style={styles.actionArrow}>
                        <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Statistics Dashboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Today's Progress</Text>
              <Text style={styles.sectionSubtitle}>Your spiritual journey metrics</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <TrendingUp size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              <Text style={styles.viewAllText}>Analytics</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsGrid}>
            {getStatsData().map((stat, index) => (
              <Animated.View
                key={stat.label}
                entering={FadeInDown.delay(200 + index * 150).duration(700).springify()}
                style={styles.modernStatCard}
              >
                <LinearGradient
                  colors={isDarkMode 
                    ? ['#1E293B', '#334155'] 
                    : ['#FFFFFF', '#F8FAFC']
                  }
                  style={styles.statCardGradient}
                >
                  <View style={styles.statCardHeader}>
                    <View style={[styles.modernStatIcon, { backgroundColor: `${stat.color}15` }]}>
                      <stat.icon size={20} color={stat.color} strokeWidth={2.5} />
                    </View>
                    
                    <View style={styles.trendContainer}>
                      <TrendingUp size={12} color={stat.isPositive ? '#10B981' : '#EF4444'} />
                      <Text style={[
                        styles.trendText,
                        { color: stat.isPositive ? '#10B981' : '#EF4444' }
                      ]}>
                        {stat.trend}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.statMainContent}>
                    <Text style={[styles.modernStatValue, { color: stat.color }]}>
                      {stat.value}
                    </Text>
                    <Text style={styles.modernStatLabel}>{stat.label}</Text>
                  </View>
                  
                  <View style={styles.modernProgressContainer}>
                    <View style={styles.modernProgressBar}>
                      <Animated.View 
                        style={[
                          styles.modernProgressFill, 
                          { 
                            width: `${Math.min(100, stat.progress)}%`,
                            backgroundColor: stat.color
                          }
                        ]} 
                        entering={FadeIn.delay(500 + index * 100).duration(1000)}
                      />
                    </View>
                    <Text style={styles.progressPercentage}>{Math.round(stat.progress)}%</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <Animated.View 
            entering={FadeInDown.duration(500)}
            style={styles.errorContainer}
          >
            <AlertCircle size={24} color="#EF4444" />
            <Text style={styles.errorText}>
              {error}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRefresh}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// Styles function moved to the correct position
function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-Medium',
      marginTop: 16,
    },
    loadingSubtext: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Regular',
      marginTop: 8,
      textAlign: 'center',
    },
    errorTitle: {
      fontSize: 24,
      fontFamily: 'PlusJakartaSans-Bold',
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorDetail: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Regular',
      marginTop: 8,
      textAlign: 'center',
    },
    errorButton: {
      backgroundColor: '#0984E3',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 16,
    },
    errorButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      paddingHorizontal: 24,
      overflow: 'hidden',
    },
    headerContent: {
      flex: 1,
      justifyContent: 'space-between',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: 20,
    },
    headerLeft: {
      flex: 1,
    },
    greeting: {
      fontSize: 18,
      fontFamily: 'PlusJakartaSans-Medium',
      color: isDark ? '#94A3B8' : '#64748B',
      marginBottom: 6,
    },
    userName: {
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: isDark ? '#F1F5F9' : '#0F172A',
      letterSpacing: -0.8,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Regular',
      color: isDark ? '#64748B' : '#94A3B8',
    },
    headerIcons: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(248,250,252,0.1)' : 'rgba(15,23,42,0.08)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(248,250,252,0.1)' : 'rgba(15,23,42,0.05)',
    },
    notificationButton: {
      position: 'relative',
    },
    notificationDot: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
    },
    dateLocationSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 20,
    },
    timeSection: {
      flex: 1,
    },
    currentTime: {
      fontSize: 32,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: isDark ? '#F1F5F9' : '#0F172A',
      marginBottom: 8,
      letterSpacing: -1,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    gregorianDate: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Medium',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    hijriDate: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-Regular',
      color: isDark ? '#64748B' : '#94A3B8',
    },
    locationSection: {
      alignItems: 'flex-end',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    location: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    coordinates: {
      fontSize: 11,
      fontFamily: 'PlusJakartaSans-Regular',
      color: isDark ? '#64748B' : '#94A3B8',
    },
    scrollView: {
      flex: 1,
      marginTop: 280,
    },
    scrollContent: {
      paddingTop: 24,
      paddingBottom: 100,
    },
    heroPrayerCard: {
      marginHorizontal: 24,
      marginBottom: 32,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 25,
      elevation: 15,
    },
    heroPrayerGradient: {
      borderRadius: 24,
      padding: 28,
      minHeight: 200,
      position: 'relative',
      overflow: 'hidden',
    },
    heroPrayerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1,
    },
    heroPrayerLeft: {
      flex: 1,
    },
    prayerBadge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    prayerBadgeText: {
      fontSize: 12,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroPrayerName: {
      fontSize: 42,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#FFFFFF',
      marginBottom: 8,
      letterSpacing: -1.5,
    },
    heroPrayerTime: {
      fontSize: 18,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: 'rgba(255,255,255,0.9)',
      marginBottom: 20,
    },
    heroPrayerRight: {
      alignItems: 'center',
    },
    heroPrayerIconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    currentPrayerTime: {
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#FFFFFF',
    },
    section: {
      marginBottom: 36,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingHorizontal: 24,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 24,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: isDark ? '#F1F5F9' : '#0F172A',
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Regular',
      color: isDark ? '#64748B' : '#94A3B8',
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(248,250,252,0.05)' : 'rgba(15,23,42,0.05)',
    },
    viewAllText: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    quickActionsContainer: {
      paddingLeft: 24,
      paddingRight: 12,
      gap: 16,
    },
    actionCardWrapper: {
      width: width * 0.75,
    },
    modernActionCard: {
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
      overflow: 'hidden',
    },
    modernActionGradient: {
      borderRadius: 20,
      padding: 20,
      minHeight: 120,
      position: 'relative',
    },
    modernActionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    modernActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginRight: 16,
    },
    actionTextContainer: {
      flex: 1,
    },
    modernActionTitle: {
      fontSize: 18,
      fontFamily: 'PlusJakartaSans-Bold',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    modernActionSubtitle: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-Medium',
      color: 'rgba(255,255,255,0.8)',
    },
    actionArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      gap: 16,
    },
    modernStatCard: {
      width: (width - 64) / 2,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 16,
      elevation: 8,
      overflow: 'hidden',
    },
    statCardGradient: {
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(248,250,252,0.1)' : 'rgba(15,23,42,0.08)',
    },
    statCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modernStatIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    trendText: {
      fontSize: 12,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    statMainContent: {
      marginBottom: 16,
    },
    modernStatValue: {
      fontSize: 32,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      marginBottom: 4,
      letterSpacing: -1,
    },
    modernStatLabel: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Medium',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    modernProgressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modernProgressBar: {
      flex: 1,
      height: 6,
      backgroundColor: isDark ? '#334155' : '#E2E8F0',
      borderRadius: 3,
      overflow: 'hidden',
    },
    modernProgressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressPercentage: {
      fontSize: 12,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: isDark ? '#94A3B8' : '#64748B',
    },
    errorContainer: {
      marginHorizontal: 24,
      padding: 20,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.2)',
      alignItems: 'center',
		gap: 12,
      flexDirection: 'row',
    },
    errorText: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Medium',
      color: '#EF4444',
      textAlign: 'center',
      flex: 1,
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: '#EF4444',
      borderRadius: 12,
    },
    retryButtonText: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: '#FFFFFF',
    },
    bottomSpacing: {
      height: 40,
    },
  });
}