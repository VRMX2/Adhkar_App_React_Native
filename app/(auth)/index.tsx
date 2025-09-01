// app/(auth)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { authService } from '@/services/authService';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthIndexScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const isAuthenticated = await authService.isAuthenticated();
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  };

  const gradientColors = isDark 
    ? ['#0F172A', '#1E293B', '#334155']
    : ['#F0FDF4', '#DCFCE7', '#BBF7D0'];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.logoContainer}>
          <View style={[styles.logoBackground, { backgroundColor: isDark ? '#10B981' : '#059669' }]}>
            <Text style={styles.logo}>☪</Text>
          </View>
          <Text style={styles.appName}>Islamic App</Text>
          <Text style={styles.tagline}>Your spiritual companion</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features Include:</Text>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🕌</Text>
            <Text style={styles.featureText}>Prayer times with adhan alerts</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📿</Text>
            <Text style={styles.featureText}>Digital tasbih counter</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📖</Text>
            <Text style={styles.featureText}>Daily adhkar and duas</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🕋</Text>
            <Text style={styles.featureText}>Complete Quran with audio</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
	container: {
      fontFamily: 'PlusJakartaSans-SemiBold',
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 50,
    },
    logoBackground: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    logo: {
      fontSize: 50,
      color: '#FFFFFF',
    },
    appName: {
      fontSize: 32,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 8,
      textAlign: 'center',
    },
    tagline: {
      fontSize: 18,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    featuresContainer: {
      marginBottom: 50,
    },
    featuresTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 24,
      textAlign: 'center',
    },
    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 12,
    },
    featureIcon: {
      fontSize: 24,
      marginRight: 16,
      width: 32,
    },
    featureText: {
      fontSize: 16,
      color: isDark ? '#D1D5DB' : '#4B5563',
      flex: 1,
    },
    buttonContainer: {
      gap: 16,
    },
    primaryButton: {
      backgroundColor: '#059669',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      shadowColor: '#059669',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    primaryButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButton: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#059669',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#059669',
    },
    guestButton: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    guestButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
  });
}