import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(-180);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(50);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(30);
  const backgroundOpacity = useSharedValue(0);
  const loadingProgress = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);
  const breathingScale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);

  const particleAnimations = useRef([...Array(12)].map(() => ({
    opacity: useSharedValue(0),
    translateY: useSharedValue(0),
    translateX: useSharedValue(0),
    scale: useSharedValue(0),
    rotation: useSharedValue(0),
  }))).current;

  const ornamentAnimations = useRef([...Array(6)].map(() => ({
    opacity: useSharedValue(0),
    scale: useSharedValue(0),
    rotation: useSharedValue(0),
  }))).current;

  useEffect(() => {
    const startAnimations = () => {
      backgroundOpacity.value = withTiming(1, { duration: 1000 });

      logoOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));

      logoScale.value = withDelay(
        400,
        withSequence(
          withTiming(0.8, { duration: 200 }),
          withTiming(1.15, { duration: 600 }),
          withTiming(1, { duration: 400 })
        )
      );

      logoRotation.value = withDelay(400, withTiming(0, { duration: 1200 }));

      breathingScale.value = withDelay(
        1500,
        withRepeat(
          withSequence(
            withTiming(1.02, { duration: 2000 }),
            withTiming(1, { duration: 2000 })
          ),
          -1,
          false
        )
      );

      glowIntensity.value = withDelay(
        1500,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 2500 }),
            withTiming(0.3, { duration: 2500 })
          ),
          -1,
          false
        )
      );

      textOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
      textTranslateY.value = withDelay(1000, withTiming(0, { duration: 800 }));

      taglineOpacity.value = withDelay(1400, withTiming(1, { duration: 800 }));
      taglineTranslateY.value = withDelay(1400, withTiming(0, { duration: 800 }));

      loadingProgress.value = withDelay(1800, withTiming(100, { duration: 1500 }));

      shimmerPosition.value = withDelay(
        2000,
        withRepeat(withTiming(1, { duration: 1500 }), -1, false)
      );

      particleAnimations.forEach((particle, index) => {
        const delay = 1200 + index * 80;
        const angle = (index / particleAnimations.length) * Math.PI * 2;
        const radius = 80 + Math.random() * 40;

        particle.opacity.value = withDelay(
          delay,
          withSequence(
            withTiming(0.9, { duration: 400 }),
            withTiming(0, { duration: 2000 })
          )
        );

        particle.scale.value = withDelay(
          delay,
          withSequence(
            withTiming(1.2, { duration: 400 }),
            withTiming(0, { duration: 2000 })
          )
        );

        particle.translateY.value = withDelay(
          delay,
          withTiming(-Math.sin(angle) * radius - 60, { duration: 2400 })
        );

        particle.translateX.value = withDelay(
          delay,
          withTiming(Math.cos(angle) * radius, { duration: 2400 })
        );

        particle.rotation.value = withDelay(delay, withTiming(360, { duration: 2400 }));
      });

      ornamentAnimations.forEach((ornament, index) => {
        const delay = 1600 + index * 120;

        ornament.opacity.value = withDelay(delay, withTiming(0.4, { duration: 600 }));

        ornament.scale.value = withDelay(
          delay,
          withSequence(
            withTiming(1.3, { duration: 400 }),
            withTiming(1, { duration: 300 })
          )
        );

        ornament.rotation.value = withDelay(
          delay,
          withRepeat(withTiming(360, { duration: 8000 }), -1, false)
        );
      });
    };

    startAnimations();
  }, []);

  const backgroundStyle = useAnimatedStyle(() => ({ opacity: backgroundOpacity.value }));

  const logoAnimatedStyle = useAnimatedStyle(() => {
    const glow = interpolate(glowIntensity.value, [0, 1], [0, 20]);
    return {
      opacity: logoOpacity.value,
      transform: [
        { scale: logoScale.value * breathingScale.value },
        { rotate: `${logoRotation.value}deg` },
      ],
      shadowOpacity: glowIntensity.value * 0.4,
      shadowRadius: glow,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    width: `${loadingProgress.value}%`,
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerPosition.value, [-1, 1], [-200, 200]);
    return { transform: [{ translateX }] };
  });

  const createParticleStyle = (index) => useAnimatedStyle(() => ({
    opacity: particleAnimations[index].opacity.value,
    transform: [
      { translateY: particleAnimations[index].translateY.value },
      { translateX: particleAnimations[index].translateX.value },
      { scale: particleAnimations[index].scale.value },
      { rotate: `${particleAnimations[index].rotation.value}deg` },
    ],
  }));

  const createOrnamentStyle = (index) => useAnimatedStyle(() => ({
    opacity: ornamentAnimations[index].opacity.value,
    transform: [
      { scale: ornamentAnimations[index].scale.value },
      { rotate: `${ornamentAnimations[index].rotation.value}deg` },
    ],
  }));

  const gradientColors = isDark
    ? ['#0C0A09', '#1C1917', '#292524', '#1C1917']
    : ['#FFFBEB', '#FEF3C7', '#FDE68A', '#F3E8FF'];

  const particles = ['✦', '◆', '◇', '✧', '⋆', '◈'];
  const ornaments = ['◉', '◎', '○', '◌', '⬟', '⬢'];

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={styles.container}>
        {/* Background */}
        <Animated.View style={[StyleSheet.absoluteFillObject, backgroundStyle]}>
          <LinearGradient
            colors={gradientColors}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Particles */}
        <View style={styles.particlesContainer}>
          {particleAnimations.map((_, index) => (
            <Animated.View
              key={`particle-${index}`}
              style={[styles.particle, createParticleStyle(index), { left: '50%', top: '50%' }]}
            >
              <Text style={[styles.particleText, { color: isDark ? '#FCD34D' : '#8B5CF6' }]}>
                {particles[index % particles.length]}
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* Ornaments */}
        <View style={styles.ornamentsContainer}>
          {ornamentAnimations.map((_, index) => (
            <Animated.View
              key={`ornament-${index}`}
              style={[styles.ornament, createOrnamentStyle(index), { left: `${15 + (index % 3) * 35}%`, top: `${20 + Math.floor(index / 3) * 60}%` }]}
            >
              <Text style={[styles.ornamentText, { color: isDark ? '#F59E0B' : '#7C3AED' }]}>
                {ornaments[index]}
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
              <View style={styles.logoOuterRing}>
                <View style={styles.logoInnerRing}>
                  <LinearGradient
                    colors={isDark ? ['#F59E0B', '#D97706', '#B45309'] : ['#8B5CF6', '#7C3AED', '#6D28D9']}
                    style={styles.logoBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.logo}>☪</Text>
                    <Animated.View style={[styles.shimmer, shimmerAnimatedStyle]} />
                  </LinearGradient>
                </View>
              </View>
            </Animated.View>

            <Animated.View style={textAnimatedStyle}>
              <Text style={[styles.appName, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>Islamic App</Text>
            </Animated.View>

            <Animated.Text style={[styles.tagline, { color: isDark ? '#A3A3A3' : '#6B7280' }, taglineAnimatedStyle]}>
              Your spiritual companion
            </Animated.Text>
          </View>

          {/* Loading */}
          <View style={styles.loadingContainer}>
            <View style={styles.loadingWrapper}>
              <View style={[styles.loadingBar, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                <Animated.View style={loadingAnimatedStyle}>
                  <LinearGradient
                    colors={isDark ? ['#F59E0B', '#D97706', '#F59E0B'] : ['#8B5CF6', '#7C3AED', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loadingProgress}
                  />
                </Animated.View>
              </View>
            </View>
            <Animated.Text style={[styles.loadingText, { color: isDark ? '#6B7280' : '#9CA3AF' }, textAnimatedStyle]}>
              Preparing your spiritual journey...
            </Animated.Text>
          </View>
        </View>

        {/* Bottom Branding */}
        <Animated.View style={[styles.bottomBranding, taglineAnimatedStyle]}>
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.brandingCard}>
            <Text style={[styles.brandingText, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
            <Text style={[styles.brandingTextEn, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              In the name of Allah, the Most Gracious, the Most Merciful
            </Text>
          </BlurView>
        </Animated.View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 80 },
  logoWrapper: { marginBottom: 32 },
  logoOuterRing: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  logoInnerRing: { width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  logoBackground: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logo: { fontSize: 64, color: '#FFFFFF' },
  shimmer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.3)', width: 30 },
  appName: { fontSize: 42, fontWeight: '800', marginBottom: 12, textAlign: 'center', letterSpacing: 2 },
  tagline: { fontSize: 18, fontWeight: '500', textAlign: 'center', fontStyle: 'italic' },
  loadingContainer: { alignItems: 'center', width: '100%', maxWidth: 300 },
  loadingWrapper: { width: '100%', marginBottom: 20 },
  loadingBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  loadingProgress: { height: '100%', borderRadius: 3 },
  loadingText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  bottomBranding: { position: 'absolute', bottom: 50, left: 20, right: 20, alignItems: 'center' },
  brandingCard: { paddingVertical: 20, paddingHorizontal: 24, borderRadius: 20, alignItems: 'center' },
  brandingText: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  brandingTextEn: { fontSize: 13, fontWeight: '400', textAlign: 'center', fontStyle: 'italic' },
  particlesContainer: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  particle: { position: 'absolute', width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  particleText: { fontSize: 18, fontWeight: '300' },
  ornamentsContainer: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  ornament: { position: 'absolute', width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  ornamentText: { fontSize: 24, fontWeight: '200' },
});
