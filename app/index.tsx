import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'react-native';
import SplashScreen from '@/components/SplashScreen';
import { authService } from '@/services/authService';

export default function Index() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Set status bar for splash screen
    StatusBar.setBarStyle('light-content', true);
    
    // Check authentication status when app starts
    checkAuthAndNavigate();
  }, []);

  const checkAuthAndNavigate = async () => {
    try {
      // Show splash screen for minimum duration
      const startTime = Date.now();
      const minSplashDuration = 3000; // 3 seconds minimum
      
      const isAuthenticated = await authService.isAuthenticated();
      
      // Calculate remaining time to show splash
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minSplashDuration - elapsedTime);
      
      setTimeout(() => {
        if (!isNavigating) {
          setIsNavigating(true);
          
          if (isAuthenticated) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)');
          }
        }
      }, remainingTime);
      
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Default to auth screen on error after splash duration
      setTimeout(() => {
        if (!isNavigating) {
          setIsNavigating(true);
          router.replace('/(auth)');
        }
      }, 3000);
    }
  };

  return <SplashScreen />;
}