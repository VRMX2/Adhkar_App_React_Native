import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Clock, BookOpen, Circle, Heart, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { prayerService } from '@/services/prayerService';
import { PrayerTimes } from '@/types/prayer';

export default function Dashboard() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string>('');
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  useEffect(() => {
    loadPrayerTimes();
    const interval = setInterval(updateNextPrayer, 60000);
    return () => clearInterval(interval);
  }, []);

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
        setTimeUntilNext(`${diffHours}h ${remainingMins}m`);
        return;
      }
    }
    
    // If no prayer today, next is tomorrow's Fajr
    setNextPrayer('Fajr');
    setTimeUntilNext('Tomorrow');
  };

  const quickActions = [
    {
      title: 'Prayer Times',
      subtitle: `Next: ${nextPrayer} in ${timeUntilNext}`,
      icon: Clock,
      color: '#059669',
      onPress: () => router.push('/prayer'),
    },
    {
      title: 'Morning Adhkar',
      subtitle: 'Start your day with remembrance',
      icon: BookOpen,
      color: '#F59E0B',
      onPress: () => router.push('/adhkar'),
    },
    {
      title: 'Tasbih Counter',
      subtitle: 'Digital misbaha for dhikr',
      icon: Circle,
      color: '#8B5CF6',
      onPress: () => router.push('/tasbih'),
    },
    {
      title: 'Favorites',
      subtitle: 'Your saved duas and adhkar',
      icon: Heart,
      color: '#EF4444',
      onPress: () => router.push('/adhkar'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <Text style={styles.greeting}>Assalamu Alaikum</Text>
          <Text style={styles.userName}>Abdullah</Text>
          <View style={styles.dateContainer}>
            <Calendar size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(300).duration(600)} 
          style={styles.nextPrayerCard}
        >
          <Text style={styles.nextPrayerTitle}>Next Prayer</Text>
          <Text style={styles.nextPrayerName}>{nextPrayer}</Text>
          <Text style={styles.nextPrayerTime}>{timeUntilNext}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.title}
                entering={FadeInDown.delay(700 + index * 100).duration(600)}
              >
                <TouchableOpacity
                  style={[styles.actionCard, { borderLeftColor: action.color }]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionIconContainer}>
                    <action.icon 
                      size={24} 
                      color={action.color} 
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1100).duration(600)}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>5</Text>
              <Text style={styles.progressLabel}>Prayers Completed</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>247</Text>
              <Text style={styles.progressLabel}>Tasbih Count</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>12</Text>
              <Text style={styles.progressLabel}>Duas Read</Text>
            </View>
          </View>
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
    header: {
      paddingTop: 20,
      paddingBottom: 30,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 4,
    },
    userName: {
      fontSize: 18,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 12,
    },
    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    date: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    nextPrayerCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      marginBottom: 30,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    nextPrayerTitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 8,
    },
    nextPrayerName: {
      fontSize: 32,
      fontWeight: '700',
      color: '#059669',
      marginBottom: 4,
    },
    nextPrayerTime: {
      fontSize: 18,
      color: isDark ? '#D1D5DB' : '#4B5563',
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 16,
    },
    quickActionsContainer: {
      gap: 12,
      marginBottom: 30,
    },
    actionCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    actionIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    actionContent: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 2,
    },
    actionSubtitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    progressContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    progressItem: {
      alignItems: 'center',
    },
    progressNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: '#059669',
      marginBottom: 4,
    },
    progressLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
  });
}