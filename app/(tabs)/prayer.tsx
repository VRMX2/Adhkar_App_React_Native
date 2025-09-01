import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { MapPin, Bell, Settings } from 'lucide-react-native';
import { prayerService } from '@/services/prayerService';
import { PrayerTimes } from '@/types/prayer';

export default function PrayerScreen() {
  const colorScheme = useColorScheme();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [location, setLocation] = useState<string>('Loading...');
  const [currentPrayer, setCurrentPrayer] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  useEffect(() => {
    loadPrayerTimes();
    const interval = setInterval(updateCurrentPrayer, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadPrayerTimes = async () => {
    try {
      const times = await prayerService.getTodaysPrayerTimes();
      const locationName = await prayerService.getCurrentLocation();
      setPrayerTimes(times);
      setLocation(locationName);
      updateCurrentPrayer();
    } catch (error) {
      console.error('Error loading prayer times:', error);
      Alert.alert('Error', 'Unable to load prayer times. Please check your location settings.');
    }
  };

  const updateCurrentPrayer = () => {
    if (!prayerTimes) return;
    
    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];

    let current = 'Isha'; // Default to last prayer
    
    for (let i = 0; i < prayers.length; i++) {
      const [hours, minutes] = prayers[i].time.split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);

      if (now < prayerTime) {
        current = i > 0 ? prayers[i - 1].name : 'Fajr';
        break;
      }
    }
    
    setCurrentPrayer(current);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    Alert.alert(
      'Notifications',
      notificationsEnabled ? 'Prayer notifications disabled' : 'Prayer notifications enabled'
    );
  };

  if (!prayerTimes) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading prayer times...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr, arabic: 'الفجر' },
    { name: 'Sunrise', time: prayerTimes.sunrise, arabic: 'الشروق' },
    { name: 'Dhuhr', time: prayerTimes.dhuhr, arabic: 'الظهر' },
    { name: 'Asr', time: prayerTimes.asr, arabic: 'العصر' },
    { name: 'Maghrib', time: prayerTimes.maghrib, arabic: 'المغرب' },
    { name: 'Isha', time: prayerTimes.isha, arabic: 'العشاء' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.title}>Prayer Times</Text>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.location}>{location}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={toggleNotifications}
          >
            <Bell 
              size={20} 
              color={notificationsEnabled ? '#059669' : (isDark ? '#6B7280' : '#9CA3AF')} 
            />
            <Text style={[
              styles.notificationText,
              { color: notificationsEnabled ? '#059669' : (isDark ? '#6B7280' : '#9CA3AF') }
            ]}>
              {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.prayersList}>
          {prayers.map((prayer, index) => (
            <Animated.View
              key={prayer.name}
              entering={SlideInRight.delay(200 + index * 100).duration(600)}
            >
              <TouchableOpacity
                style={[
                  styles.prayerCard,
                  currentPrayer === prayer.name && styles.currentPrayerCard,
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.prayerInfo}>
                  <Text style={[
                    styles.prayerName,
                    currentPrayer === prayer.name && styles.currentPrayerText,
                  ]}>
                    {prayer.name}
                  </Text>
                  <Text style={[
                    styles.prayerArabic,
                    currentPrayer === prayer.name && styles.currentPrayerText,
                  ]}>
                    {prayer.arabic}
                  </Text>
                </View>
                <Text style={[
                  styles.prayerTime,
                  currentPrayer === prayer.name && styles.currentPrayerTimeText,
                ]}>
                  {formatTime(prayer.time)}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(1400).duration(600)} style={styles.qiblaContainer}>
          <TouchableOpacity style={styles.qiblaButton}>
            <Settings size={24} color="#059669" />
            <Text style={styles.qiblaText}>Qibla Direction</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    header: {
      paddingTop: 20,
      paddingBottom: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 12,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    location: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    notificationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    notificationText: {
      fontSize: 14,
      fontWeight: '600',
    },
    prayersList: {
      gap: 12,
      marginBottom: 30,
    },
    prayerCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    currentPrayerCard: {
      backgroundColor: '#059669',
      borderColor: '#047857',
    },
    prayerInfo: {
      flex: 1,
    },
    prayerName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 4,
    },
    prayerArabic: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontWeight: '500',
    },
    prayerTime: {
      fontSize: 18,
      fontWeight: '700',
      color: '#059669',
    },
    currentPrayerText: {
      color: '#FFFFFF',
    },
    currentPrayerTimeText: {
      color: '#FFFFFF',
    },
    qiblaContainer: {
      marginBottom: 30,
    },
    qiblaButton: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    qiblaText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#059669',
    },
  });
}