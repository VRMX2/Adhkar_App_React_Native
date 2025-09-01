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
  ImageBackground,
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
  Extrapolate,
  withSpring
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
  Bell,
  Settings,
  Moon,
  Sun,
  Compass,
  Target,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { prayerService } from '@/services/prayerService';
import { PrayerTimes } from '@/types/prayer';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function Dashboard() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  const styles = createStyles(isDarkMode);

  const headerScrollOffset = useSharedValue(0);
  const cardScale = useSharedValue(1);

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
    
    setNextPrayer('Fajr');
    setTimeUntilNext('Tomorrow');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const quickActions = [
    {
      title: 'Prayer Times',
      subtitle: `Next: ${nextPrayer}`,
      icon: Clock,
      gradient: ['#00D4AA', '#00B894'],
      shadowColor: '#00D4AA',
      onPress: () => router.push('/prayer'),
    },
    {
      title: 'Adhkar',
      subtitle: 'Daily remembrance',
      icon: Sunrise,
      gradient: ['#FDCB6E', '#E17055'],
      shadowColor: '#FDCB6E',
      onPress: () => router.push('/adhkar'),
    },
    {
      title: 'Tasbih',
      subtitle: 'Digital counter',
      icon: Circle,
      gradient: ['#A29BFE', '#6C5CE7'],
      shadowColor: '#A29BFE',
      onPress: () => router.push('/tasbih'),
    },
    {
      title: 'Quran',
      subtitle: 'Read and listen',
      icon: BookOpen,
      gradient: ['#74B9FF', '#0984E3'],
      shadowColor: '#74B9FF',
      onPress: () => router.push('/quran'),
    },
    {
      title: 'Qibla',
      subtitle: 'Find direction',
      icon: Compass,
      gradient: ['#FD79A8', '#E84393'],
      shadowColor: '#FD79A8',
      onPress: () => router.push('/qibla'),
    },
    {
      title: 'Goals',
      subtitle: 'Track progress',
      icon: Target,
      gradient: ['#55A3FF', '#1E40AF'],
      shadowColor: '#55A3FF',
      onPress: () => router.push('/goals'),
    },
  ];

  const stats = [
    { 
      icon: Clock, 
      value: '5', 
      label: 'Prayers Today', 
      progress: 100, 
      color: '#00D4AA',
      trend: '+2%',
      isPositive: true 
    },
    { 
      icon: Circle, 
      value: '247', 
      label: 'Tasbih Count', 
      progress: 75, 
      color: '#A29BFE',
      trend: '+15%',
      isPositive: true 
    },
    { 
      icon: BookOpen, 
      value: '12', 
      label: 'Duas Read', 
      progress: 60, 
      color: '#FDCB6E',
      trend: '+8%',
      isPositive: true 
    },
    { 
      icon: Award, 
      value: '42', 
      label: 'Streak Days', 
      progress: 90, 
      color: '#FD79A8',
      trend: '+3',
      isPositive: true 
    },
  ];

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getHijriDate = () => {
    // This would typically come from an Islamic calendar API
    return "15 Sha'ban 1445 AH";
  };

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
        
        {/* Floating Particles Background */}
        <View style={styles.particlesContainer}>
          {[...Array(6)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                { 
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: isDarkMode ? 0.1 : 0.05,
                }
              ]}
              entering={FadeIn.delay(i * 200).duration(2000)}
            />
          ))}
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>السلام عليكم</Text>
              <Animated.Text style={[styles.userName, titleAnimatedStyle]}>
                Abdullah Rahman
              </Animated.Text>
              <Text style={styles.subtitle}>May Allah bless your day</Text>
            </View>
            
            <View style={styles.headerIcons}>
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
              
              <TouchableOpacity style={styles.iconButton}>
                <Settings size={20} color={isDarkMode ? '#F1F5F9' : '#475569'} />
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
              <Text style={styles.hijriDate}>{getHijriDate()}</Text>
            </View>
            
            <View style={styles.locationSection}>
              <View style={styles.locationRow}>
                <MapPin size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                <Text style={styles.location}>New York, NY</Text>
              </View>
              <Text style={styles.coordinates}>40.7128° N, 74.0060° W</Text>
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
          <LinearGradient
            colors={['#00D4AA', '#00B894', '#00A085']}
            style={styles.heroPrayerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Geometric Pattern Overlay */}
            <View style={styles.patternOverlay}>
              <View style={[styles.geometricShape, styles.shape1]} />
              <View style={[styles.geometricShape, styles.shape2]} />
              <View style={[styles.geometricShape, styles.shape3]} />
            </View>
            
            <View style={styles.heroPrayerContent}>
              <View style={styles.heroPrayerLeft}>
                <View style={styles.prayerBadge}>
                  <Text style={styles.prayerBadgeText}>Next Prayer</Text>
                </View>
                <Text style={styles.heroPrayerName}>{nextPrayer}</Text>
                <Text style={styles.heroPrayerTime}>{timeUntilNext}</Text>
                
                <View style={styles.prayerProgress}>
                  <View style={styles.progressDots}>
                    {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer, index) => (
                      <View 
                        key={prayer}
                        style={[
                          styles.progressDot,
                          { opacity: prayer === nextPrayer ? 1 : 0.3 }
                        ]} 
                      />
                    ))}
                  </View>
                </View>
              </View>
              
              <View style={styles.heroPrayerRight}>
                <View style={styles.heroPrayerIconContainer}>
                  <Clock size={32} color="#FFFFFF" strokeWidth={2} />
                </View>
                <Text style={styles.currentPrayerTime}>
                  {prayerTimes?.[nextPrayer.toLowerCase()] || '--:--'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Quick Access</Text>
              <Text style={styles.sectionSubtitle}>Navigate to your daily worship</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
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
                    <View style={styles.actionCardPattern}>
                      <View style={styles.patternCircle1} />
                      <View style={styles.patternCircle2} />
                    </View>
                    
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
            {stats.map((stat, index) => (
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
                            width: `${stat.progress}%`,
                            backgroundColor: stat.color
                          }
                        ]} 
                        entering={FadeIn.delay(500 + index * 100).duration(1000)}
                      />
                    </View>
                    <Text style={styles.progressPercentage}>{stat.progress}%</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Islamic Quote Card */}
        <Animated.View 
          entering={FadeInDown.delay(1000).duration(800).springify()}
          style={styles.modernQuoteCard}
        >
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.modernQuoteGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.quotePattern}>
              <View style={styles.quoteShape1} />
              <View style={styles.quoteShape2} />
            </View>
            
            <View style={styles.modernQuoteContent}>
              <View style={styles.quoteIconContainer}>
                <Text style={styles.arabicQuote}>﴿</Text>
              </View>
              
              <Text style={styles.modernQuoteText}>
                "And whoever relies upon Allah - then He is sufficient for him. 
                Indeed, Allah will accomplish His purpose."
              </Text>
              
              <View style={styles.quoteSourceContainer}>
                <View style={styles.quoteLine} />
                <Text style={styles.modernQuoteSource}>Quran 65:3</Text>
                <View style={styles.quoteLine} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
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
    particlesContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    particle: {
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? '#64748B' : '#CBD5E1',
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
    patternOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    geometricShape: {
      position: 'absolute',
      borderRadius: 50,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    shape1: {
      width: 100,
      height: 100,
      top: -20,
      right: -30,
    },
    shape2: {
      width: 60,
      height: 60,
      bottom: 20,
      left: -10,
    },
    shape3: {
      width: 40,
      height: 40,
      top: 60,
      right: 80,
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
    prayerProgress: {
      marginTop: 8,
    },
    progressDots: {
      flexDirection: 'row',
      gap: 8,
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FFFFFF',
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
    actionCardPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    patternCircle1: {
      position: 'absolute',
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255,255,255,0.1)',
      top: -10,
      right: -10,
    },
    patternCircle2: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.08)',
      bottom: 10,
      left: -5,
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
    modernQuoteCard: {
      marginHorizontal: 24,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 12,
      overflow: 'hidden',
    },
    modernQuoteGradient: {
      borderRadius: 24,
      padding: 32,
      position: 'relative',
      minHeight: 180,
    },
    quotePattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    quoteShape1: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255,255,255,0.05)',
      top: -40,
      left: -40,
    },
    quoteShape2: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.08)',
      bottom: -20,
      right: -20,
    },
    modernQuoteContent: {
      alignItems: 'center',
      zIndex: 1,
    },
    quoteIconContainer: {
      marginBottom: 20,
    },
    arabicQuote: {
      fontSize: 48,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: '#FFFFFF',
      opacity: 0.9,
    },
    modernQuoteText: {
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-Medium',
      color: '#FFFFFF',
      lineHeight: 26,
      textAlign: 'center',
      marginBottom: 24,
      letterSpacing: 0.2,
    },
    quoteSourceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    quoteLine: {
      width: 24,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
    modernQuoteSource: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: '#FFFFFF',
      textAlign: 'center',
      opacity: 0.9,
    },
    bottomSpacing: {
      height: 40,
	},
})
}