// app/+not-found.tsx
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const styles = createStyles(isDark);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.iconContainer}>
            <Text style={styles.icon}>🕌</Text>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.textContainer}>
            <Text style={styles.title}>Page Not Found</Text>
            <Text style={styles.description}>
              This screen doesn't exist. Let's get you back on the right path.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.linkContainer}>
            <Link href="/" style={styles.link}>
              <Text style={styles.linkText}>Return Home</Text>
            </Link>
          </Animated.View>
		</View>
      </SafeAreaView>
    </>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
		backgroundColor: isDark ? '#111827' : '#F9FAFB',
		fontFamily: 'PlusJakartaSans-SemiBold',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
		paddingHorizontal: 20,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    iconContainer: {
		marginBottom: 32,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    icon: {
      fontSize: 80,
		opacity: 0.8,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    textContainer: {
      alignItems: 'center',
		marginBottom: 48,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 12,
		textAlign: 'center',
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    description: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      lineHeight: 24,
		maxWidth: 300,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    linkContainer: {
      width: '100%',
      maxWidth: 280,
    },
    link: {
      backgroundColor: '#059669',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    linkText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });
}