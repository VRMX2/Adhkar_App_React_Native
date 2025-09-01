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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate
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
  Menu,
  Bell
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { prayerService } from '@/services/prayerService';
import { PrayerTimes } from '@/types/prayer';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const headerScrollOffset = useSharedValue(0);
  const headerHeight = useSharedValue(220);

  useEffect(() => {
    loadPrayerTimes();
    const interval = setInterval(updateNextPrayer, 60000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        headerScrollOffset.value,
        [0, 100],
        [220, 120],
        Extrapolate.CLAMP
      ),
      paddingTop: interpolate(
        headerScrollOffset.value,
        [0, 100],
        [60, 20],
        Extrapolate.CLAMP
      ),
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      fontSize: interpolate(
        headerScrollOffset.value,
        [0, 100],
        [32, 24],
        Extrapolate.CLAMP
      ),
    };
  });

  const loadPrayerTimes = async () => {
    try {
      const times = await prayerService.getTodaysPrayerTimes();
      setPrayerTimes(times);
      updateNextPrayer();
    } catch (error) {
      console.error('Error loading prayer times:', error);
    }
  };

  const updateNextPrayer = () => {
    if (!prayerTimes) return;
    
    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);

      if (prayerTime > now) {
        setNextPrayer(prayer.name);
        const diffMs = prayerTime.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        
        if (diffHours > 0) {
          setTimeUntilNext(`${diffHours}h ${remainingMins}m`);
        } else {
          setTimeUntilNext(`${remainingMins}m`);
        }
        return;
      }
    }
    
    // If all prayers have passed, show first prayer of next day
    setNextPrayer('Fajr');
    setTimeUntilNext('Tomorrow');
  };

  const quickActions = [
    {
      title: 'Prayer Times',
      subtitle: `Next: ${nextPrayer}`,
      icon: Clock,
      gradient: ['#10B981', '#059669'],
      onPress: () => router.push('/prayer'),
    },
    {
      title: 'Adhkar',
      subtitle: 'Daily remembrance',
      icon: Sunrise,
      gradient: ['#F59E0B', '#D97706'],
      onPress: () => router.push('/adhkar'),
    },
    {
      title: 'Tasbih',
      subtitle: 'Digital counter',
      icon: Circle,
      gradient: ['#8B5CF6', '#7C3AED'],
      onPress: () => router.push('/tasbih'),
    },
    {
      title: 'Quran',
      subtitle: 'Read and listen',
      icon: BookOpen,
      gradient: ['#3B82F6', '#2563EB'],
      onPress: () => router.push('/quran'),
    },
  ];

  const stats = [
    { icon: Clock, value: '5', label: 'Prayers Today', progress: 100, color: '#10B981' },
    { icon: Circle, value: '33', label: 'Tasbih Count', progress: 66, color: '#8B5CF6' },
    { icon: BookOpen, value: '7', label: 'Duas Read', progress: 47, color: '#F59E0B' },
    { icon: Star, value: '28', label: 'Streak Days', progress: 80, color: '#EF4444' },
  ];

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={isDark ? ['#1F2937', '#111827'] : ['#FFFFFF', '#F8FAFC']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Assalamu Alaikum</Text>
              <Animated.Text style={[styles.userName, titleAnimatedStyle]}>
                Abdullah
              </Animated.Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Bell size={22} color={isDark ? '#D1D5DB' : '#4B5563'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Menu size={22} color={isDark ? '#D1D5DB' : '#4B5563'} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.dateLocationContainer}>
            <View style={styles.dateTimeContainer}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              </View>
              <View style={styles.dateContainer}>
                <Calendar size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <Text style={styles.date}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            
            <View style={styles.locationContainer}>
              <MapPin size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text style={styles.location}>New York, NY</Text>
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
        {/* Next Prayer Card */}
        <Animated.View 
          entering={FadeInDown.duration(700)} 
          style={styles.nextPrayerCard}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.nextPrayerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.nextPrayerContent}>
              <View style={styles.nextPrayerLeft}>
                <Text style={styles.nextPrayerTitle}>Next Prayer</Text>
                <Text style={styles.nextPrayerName}>{nextPrayer}</Text>
                <Text style={styles.nextPrayerTime}>{timeUntilNext}</Text>
              </View>
              <View style={styles.nextPrayerIcon}>
                <Clock size={28} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.title}
                entering={SlideInRight.delay(index * 100).duration(600)}
                style={styles.actionCardContainer}
              >
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={action.onPress}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.actionCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.actionIconContainer}>
                      <action.icon size={22} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Today's Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Details</Text>
              <ChevronRight size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <Animated.View
                key={stat.label}
                entering={FadeInDown.delay(400 + index * 100).duration(600)}
                style={styles.statCard}
              >
                <View style={styles.statCardContent}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                    <stat.icon size={18} color={stat.color} strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${stat.progress}%`,
                          backgroundColor: stat.color
                        }
                      ]} 
                    />
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Islamic Quote */}
        <Animated.View 
          entering={FadeInDown.delay(800).duration(600)}
          style={styles.quoteCard}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.quoteGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.quoteIcon}>
              <Text style={styles.quoteIconText}>❝</Text>
            </View>
            <Text style={styles.quoteText}>
              "And whoever relies upon Allah - then He is sufficient for him. 
              Indeed, Allah will accomplish His purpose."
            </Text>
            <Text style={styles.quoteSource}>— Quran 65:3</Text>
          </LinearGradient>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F8FAFC',
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
    },
    greeting: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 4,
    },
    userName: {
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      letterSpacing: -0.5,
    },
    headerIcons: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    dateLocationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 16,
    },
    dateTimeContainer: {
      alignItems: 'flex-start',
    },
    timeContainer: {
      marginBottom: 4,
    },
    timeText: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    date: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingBottom: 4,
    },
    location: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    scrollView: {
      flex: 1,
      marginTop: 220,
    },
    scrollContent: {
      paddingTop: 20,
      paddingBottom: 40,
    },
    nextPrayerCard: {
      marginHorizontal: 24,
      marginBottom: 32,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    nextPrayerGradient: {
      borderRadius: 20,
      padding: 24,
    },
    nextPrayerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    nextPrayerLeft: {
      flex: 1,
    },
    nextPrayerTitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 8,
      fontWeight: '500',
    },
    nextPrayerName: {
      fontSize: 32,
      fontWeight: '800',
      color: '#FFFFFF',
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    nextPrayerTime: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '600',
    },
    nextPrayerIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      marginBottom: 32,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      letterSpacing: -0.5,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    viewAllText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      gap: 12,
    },
    actionCardContainer: {
      width: (width - 52) / 2,
    },
    actionCard: {
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      overflow: 'hidden',
    },
    actionCardGradient: {
      borderRadius: 16,
      padding: 20,
      minHeight: 140,
      justifyContent: 'space-between',
    },
    actionIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginBottom: 16,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    actionSubtitle: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.8)',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      gap: 12,
    },
	statCard: {
      width: (width - 52) / 2,
      borderRadius: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#F1F5F9',
    },
    statCardContent: {
      padding: 20,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
      marginBottom: 12,
    },
    progressBar: {
      height: 4,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    quoteCard: {
      marginHorizontal: 24,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
      overflow: 'hidden',
    },
    quoteGradient: {
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
    },
    quoteIcon: {
      marginBottom: 12,
    },
    quoteIconText: {
      fontSize: 32,
      color: '#FFFFFF',
      opacity: 0.8,
    },
    quoteText: {
      fontSize: 16,
      color: '#FFFFFF',
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 12,
      fontWeight: '500',
    },
    quoteSource: {
      fontSize: 14,
      color: '#FFFFFF',
      textAlign: 'center',
      opacity: 0.9,
      fontWeight: '600',
    },
  });
}