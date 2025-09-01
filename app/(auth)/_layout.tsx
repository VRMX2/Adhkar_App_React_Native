import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? '#111827' : '#F9FAFB',
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{
            title: 'Welcome',
          }}
        />
        <Stack.Screen 
          name="login" 
          options={{
            title: 'Sign In',
            presentation: 'card',
          }}
        />
        <Stack.Screen 
          name="register" 
          options={{
            title: 'Create Account',
            presentation: 'card',
          }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}