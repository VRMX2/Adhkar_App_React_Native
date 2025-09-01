import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { authService } from '@/services/authService';
import { AuthModal } from '@/components/AuthModal';

export default function AuthScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
	const [showAuthModal, setShowAuthModal] = useState(false);

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

  const handleAuthSuccess = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.logoContainer}>
          <Text style={styles.logo}>☪</Text>
          <Text style={styles.appName}>Islamic App</Text>
          <Text style={styles.tagline}>Your spiritual companion</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.featuresContainer}>
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

        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowAuthModal(true)}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

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
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 60,
    },
    logo: {
      fontSize: 80,
      marginBottom: 16,
    },
    appName: {
      fontSize: 32,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 8,
    },
    tagline: {
      fontSize: 18,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    featuresContainer: {
      marginBottom: 60,
    },
    featuresTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 20,
      textAlign: 'center',
    },
    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 20,
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
    },
    primaryButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#059669',
    },
  });
}