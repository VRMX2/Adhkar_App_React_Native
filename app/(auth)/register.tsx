// app/(auth)/register.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const handleRegister = async () => {
   console.log('register');
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
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <View style={[styles.logoBackground, { backgroundColor: isDark ? '#10B981' : '#059669' }]}>
                <Text style={styles.logo}>☪</Text>
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join us on your spiritual journey</Text>
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>
                Must be at least 6 characters
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.guestButton} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
		flex: 1,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    keyboardView: {
		flex: 1,
      fontFamily: 'PlusJakartaSans-SemiBold',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
    },
    header: {
      paddingTop: 20,
      marginBottom: 40,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
    },
    backButtonText: {
      fontSize: 20,
      color: isDark ? '#F9FAFB' : '#1F2937',
      fontWeight: '600',
    },
    logoContainer: {
      alignItems: 'center',
    },
    logoBackground: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    logo: {
      fontSize: 40,
      color: '#FFFFFF',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
    },
    formContainer: {
      flex: 1,
      marginBottom: 30,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 16,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    passwordContainer: {
      position: 'relative',
    },
    passwordInput: {
      paddingRight: 50,
    },
    passwordToggle: {
      position: 'absolute',
      right: 16,
      top: 16,
      padding: 4,
    },
    passwordToggleText: {
      fontSize: 20,
    },
    passwordHint: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 4,
      marginLeft: 4,
    },
    registerButton: {
      backgroundColor: '#059669',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 20,
    },
    registerButtonDisabled: {
      opacity: 0.7,
    },
    registerButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
    },
    dividerText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      paddingHorizontal: 16,
    },
    guestButton: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    guestButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 20,
    },
    footerText: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    footerLink: {
      fontSize: 16,
      color: '#059669',
      fontWeight: '600',
    },
  });
}