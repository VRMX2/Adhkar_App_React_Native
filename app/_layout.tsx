import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useColorScheme, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans-ExtraLight': require('../assets/fonts/PlusJakartaSans-ExtraLight.ttf'),
    'PlusJakartaSans-Light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    // Arabic fonts for better Islamic text support
    'Amiri-Regular': require('../assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Bold': require('../assets/fonts/Amiri-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Add a small delay for smooth transition
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 500);
    }
  }, [fontsLoaded, fontError]);

	if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Animated.View 
      style={{ flex: 1 }}
      entering={FadeIn.duration(800)}
    >
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          contentStyle: {
            backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
          },
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            animation: 'none',
          }} 
        />
        <Stack.Screen 
          name="prayer/[id]" 
          options={{ 
            title: 'Prayer Details',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: 'Settings',
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="qibla" 
          options={{ 
            title: 'Qibla Compass',
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="goals" 
          options={{ 
            title: 'Spiritual Goals',
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="+not-found" 
          options={{ 
            title: 'Not Found',
          }} 
        />
      </Stack>
      
      <StatusBar 
        style={isDark ? 'light' : 'dark'} 
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
    </Animated.View>
  );
}