import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Vibration,
	Platform,
	ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { RotateCcw, Save, History, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { tasbihService } from '@/services/tasbihService';

export default function TasbihScreen() {
  const colorScheme = useColorScheme();
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [selectedDhikr, setSelectedDhikr] = useState('سُبْحَانَ اللّٰهِ');
  const [dailyCount, setDailyCount] = useState(0);

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  const dhikrOptions = [
    { arabic: 'سُبْحَانَ اللّٰهِ', transliteration: 'SubhanAllah', translation: 'Glory be to Allah' },
    { arabic: 'الْحَمْدُ لِلّٰهِ', transliteration: 'Alhamdulillah', translation: 'Praise be to Allah' },
    { arabic: 'اللّٰهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'Allah is the Greatest' },
    { arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ', transliteration: 'La ilaha illa Allah', translation: 'There is no god but Allah' },
    { arabic: 'أَسْتَغْفِرُ اللّٰهَ', transliteration: 'Astaghfirullah', translation: 'I seek forgiveness from Allah' },
  ];

  useEffect(() => {
    loadDailyCount();
    progress.value = withSpring(count / target);
  }, [count, target]);

  const loadDailyCount = async () => {
    try {
      const daily = await tasbihService.getDailyCount();
      setDailyCount(daily);
    } catch (error) {
      console.error('Error loading daily count:', error);
    }
  };

  const handleTasbihPress = () => {
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Animation
    scale.value = withSequence(
      withSpring(0.95, { duration: 100 }),
      withSpring(1, { duration: 200 })
    );

    // Update count
    const newCount = count + 1;
    setCount(newCount);
    
    // Check if target reached
    if (newCount === target) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Vibration.vibrate([0, 100, 100, 100]);
      }
    }

    // Save to daily count
    tasbihService.incrementDailyCount();
    setDailyCount(prev => prev + 1);
  };

  const resetCount = () => {
    setCount(0);
    progress.value = withSpring(0);
  };

  const saveSession = async () => {
    try {
      await tasbihService.saveSession({
        dhikr: selectedDhikr,
        count,
        target,
        date: new Date().toISOString(),
      });
      resetCount();
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value * 100, 100)}%`,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.title}>Digital Tasbih</Text>
          <Text style={styles.subtitle}>Count your dhikr</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.dhikrSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dhikrOptions.map((dhikr, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dhikrOption,
                  selectedDhikr === dhikr.arabic && styles.selectedDhikrOption,
                ]}
                onPress={() => setSelectedDhikr(dhikr.arabic)}
              >
                <Text style={[
                  styles.dhikrArabic,
                  selectedDhikr === dhikr.arabic && styles.selectedDhikrText,
                ]}>
                  {dhikr.arabic}
                </Text>
                <Text style={[
                  styles.dhikrTransliteration,
                  selectedDhikr === dhikr.arabic && styles.selectedDhikrText,
                ]}>
                  {dhikr.transliteration}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
          </View>
          <Text style={styles.progressText}>{count} / {target}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.counterContainer}>
          <Animated.View style={[styles.countButton, animatedButtonStyle]}>
            <TouchableOpacity
              style={styles.countButtonTouchable}
              onPress={handleTasbihPress}
              activeOpacity={0.9}
            >
              <Text style={styles.countText}>{count}</Text>
              <Text style={styles.countLabel}>TAP TO COUNT</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(900).duration(600)} style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={resetCount}>
            <RotateCcw size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={saveSession}>
            <Save size={20} color="#059669" />
            <Text style={[styles.actionButtonText, { color: '#059669' }]}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <History size={20} color="#8B5CF6" />
            <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>History</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1100).duration(600)} style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dailyCount}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{target}</Text>
            <Text style={styles.statLabel}>Target</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.round((count / target) * 100)}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      paddingTop: 20,
      paddingBottom: 20,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    dhikrSelector: {
      marginBottom: 30,
    },
    dhikrOption: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 12,
      alignItems: 'center',
      minWidth: 120,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    selectedDhikrOption: {
      backgroundColor: '#059669',
      borderColor: '#047857',
    },
    dhikrArabic: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 4,
    },
    dhikrTransliteration: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    selectedDhikrText: {
      color: '#FFFFFF',
    },
    progressContainer: {
      marginBottom: 40,
    },
    progressBar: {
      height: 8,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#059669',
    },
    progressText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#D1D5DB' : '#4B5563',
    },
    counterContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    countButton: {
      width: 200,
      height: 200,
    },
    countButtonTouchable: {
      width: '100%',
      height: '100%',
      backgroundColor: '#059669',
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    countText: {
      fontSize: 48,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    countLabel: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '600',
      letterSpacing: 1,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 30,
    },
    actionButton: {
      alignItems: 'center',
      gap: 8,
      padding: 12,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: '#059669',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
    },
  });
}