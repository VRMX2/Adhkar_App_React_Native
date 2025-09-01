import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, 
  FadeInLeft, 
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { authService } from '@/services/authService';
import { AuthModal } from '@/components/AuthModal';

export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  // Animation values
  const logoBreathing = useSharedValue(1);
  const cardGlow = useSharedValue(0);
  const buttonPulse = useSharedValue(1);

  useEffect(() => {
    checkAuthStatus();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Logo breathing effect
    logoBreathing.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );

    // Card glow effect
    cardGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0.3, { duration: 3000 })
      ),
      -1,
      false
    );

    // Button pulse effect
    buttonPulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      false
    );
  };

  const checkAuthStatus = async () => {
    const isAuthenticated = await authService.isAuthenticated();
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  };

  const handleAuthSuccess = () => {
    router.replace('/(tabs)');
  };

  const logoBreathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoBreathing.value }],
  }));

  const cardGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: cardGlow.value * 0.3,
    shadowRadius: cardGlow.value * 20,
  }));

  const buttonPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonPulse.value }],
  }));

  const gradientColors = isDark 
    ? ['#0C0A09', '#1C1917', '#292524']
    : ['#FFFBEB', '#FEF3C7', '#F3E8FF'];

  const features = [
    {
      icon: '🕌',
      title: 'Prayer Times',
      description: 'Accurate prayer times with beautiful adhan alerts',
      gradient: isDark ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#7C3AED'],
    },
    {
      icon: '📿',
      title: 'Digital Tasbih',
      description: 'Interactive dhikr counter with customizable goals',
      gradient: isDark ? ['#10B981', '#059669'] : ['#06B6D4', '#0891B2'],
    },
    {
      icon: '📖',
      title: 'Daily Adhkar',
      description: 'Morning and evening remembrances with audio',
      gradient: isDark ? ['#8B5CF6', '#7C3AED'] : ['#EC4899', '#DB2777'],
    },
    {
      icon: '🕋',
      title: 'Holy Quran',
      description: 'Complete Quran with recitation and translations',
      gradient: isDark ? ['#EF4444', '#DC2626'] : ['#F59E0B', '#D97706'],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Background ornaments */}
      <View style={styles.backgroundOrnaments}>
        {[...Array(15)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.ornamentDot,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.1,
                backgroundColor: isDark ? '#F59E0B' : '#8B5CF6',
              }
            ]}
          />
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(200)} 
          style={styles.headerSection}
        >
          <Animated.View style={[styles.logoContainer, logoBreathingStyle]}>
            <LinearGradient
              colors={isDark ? ['#F59E0B', '#D97706', '#B45309'] : ['#8B5CF6', '#7C3AED', '#6D28D9']}
              style={styles.logoBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logo}>☪</Text>
            </LinearGradient>
          </Animated.View>

          <View style={styles.titleContainer}>
            <Text style={styles.appName}>Islamic App</Text>
            <View style={styles.titleUnderline}>
              <LinearGradient
                colors={isDark ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.underlineGradient}
              />
            </View>
            <Text style={styles.tagline}>Your spiritual companion</Text>
          </View>
        </Animated.View>

        {/* Features Section */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(400)} 
          style={styles.featuresSection}
        >
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.featuresCard, cardGlowStyle]}>
            <Text style={styles.featuresTitle}>Spiritual Features</Text>
            <Text style={styles.featuresSubtitle}>Everything you need for your Islamic journey</Text>
            
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInLeft.duration(600).delay(600 + index * 100)}
                  style={styles.featureCard}
                >
                  <LinearGradient
                    colors={feature.gradient}
                    style={styles.featureIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                  </LinearGradient>
                  
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </BlurView>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInRight.duration(800).delay(800)} 
          style={styles.actionSection}
        >
          <Animated.View style={buttonPulseStyle}>
            <TouchableOpacity
              style={styles.primaryButtonContainer}
              onPress={() => setShowAuthModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isDark ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#7C3AED']}
                style={styles.primaryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                  <Text style={styles.primaryButtonIcon}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <BlurView intensity={15} tint={isDark ? 'dark' : 'light'} style={styles.secondaryButtonBlur}>
              <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
              <Text style={styles.secondaryButtonIcon}>👁</Text>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom Quote */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(1000)} 
          style={styles.quoteSection}
        >
          <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.quoteCard}>
            <Text style={styles.quoteArabic}>
              وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا
            </Text>
            <Text style={styles.quoteEnglish}>
              "And whoever fears Allah, He will make for him a way out"
            </Text>
            <Text style={styles.quoteReference}>— Quran 65:2</Text>
          </BlurView>
        </Animated.View>
      </ScrollView>

      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    backgroundOrnaments: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'none',
    },
    ornamentDot: {
      position: 'absolute',
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 40,
      paddingTop: 20,
    },
    logoContainer: {
      marginBottom: 24,
      shadowColor: isDark ? '#F59E0B' : '#8B5CF6',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 20,
    },
    logoBackground: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    logo: {
      fontSize: 50,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    titleContainer: {
      alignItems: 'center',
    },
    appName: {
      fontSize: 36,
      fontWeight: '800',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 8,
      letterSpacing: 1,
      textShadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    titleUnderline: {
      height: 3,
      width: 60,
      borderRadius: 2,
      marginBottom: 12,
      overflow: 'hidden',
    },
    underlineGradient: {
      flex: 1,
    },
    tagline: {
      fontSize: 16,
      color: isDark ? '#A3A3A3' : '#6B7280',
      fontWeight: '500',
      fontStyle: 'italic',
      letterSpacing: 0.5,
    },
    featuresSection: {
      marginBottom: 40,
    },
    featuresCard: {
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      shadowColor: isDark ? '#F59E0B' : '#8B5CF6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 8,
    },
    featuresTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    featuresSubtitle: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      marginBottom: 24,
      fontStyle: 'italic',
    },
    featuresGrid: {
      gap: 16,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    featureIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    featureIcon: {
      fontSize: 22,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    featureDescription: {
      fontSize: 13,
      color: isDark ? '#A3A3A3' : '#6B7280',
      lineHeight: 18,
      letterSpacing: 0.2,
    },
    actionSection: {
      gap: 16,
      marginBottom: 32,
    },
    primaryButtonContainer: {
      borderRadius: 16,
      shadowColor: isDark ? '#F59E0B' : '#8B5CF6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    primaryButton: {
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 24,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    primaryButtonIcon: {
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    secondaryButton: {
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    secondaryButtonBlur: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      gap: 8,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F59E0B' : '#8B5CF6',
      letterSpacing: 0.3,
    },
    secondaryButtonIcon: {
      fontSize: 16,
    },
    quoteSection: {
      alignItems: 'center',
    },
    quoteCard: {
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      maxWidth: '90%',
    },
    quoteArabic: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      textAlign: 'center',
      marginBottom: 12,
      lineHeight: 28,
      letterSpacing: 1,
    },
    quoteEnglish: {
      fontSize: 14,
      color: isDark ? '#A3A3A3' : '#6B7280',
      textAlign: 'center',
      marginBottom: 8,
      fontStyle: 'italic',
      lineHeight: 20,
    },
    quoteReference: {
      fontSize: 12,
      color: isDark ? '#71717A' : '#9CA3AF',
      fontWeight: '500',
      letterSpacing: 0.5,
    },
  });
}
