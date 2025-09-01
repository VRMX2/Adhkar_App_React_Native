// app/(auth)/login.tsx
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

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Fixed: was useaState
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const handleLogin = async () => {
    console.log("login success");
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Fixed: removed extra space
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
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue your spiritual journey</Text>
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.formContainer}>
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
                  placeholder="Enter your password"
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
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
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
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Create Account</Text>
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
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 30,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: '#059669',
      fontWeight: '500',
    },
    loginButton: {
      backgroundColor: '#059669',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 20,
    },
    loginButtonDisabled: {
      opacity: 0.7,
    },
    loginButtonText: {
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