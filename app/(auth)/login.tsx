// app/(auth)/login.tsx
import React, { useState, useRef } from 'react';
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
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '@/services/authService';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Animation values
  const shakeAnimation = useSharedValue(0);

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  // Input handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!validateEmail(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Account lockout logic
  const handleFailedLogin = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= 5) {
      setIsLocked(true);
      setLockoutTime(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      Alert.alert(
        'Account Temporarily Locked',
        'Too many failed login attempts. Please try again in 15 minutes or reset your password.',
        [
          { text: 'Reset Password', onPress: handleForgotPassword },
          { text: 'OK' }
        ]
      );
    } else {
      const remainingAttempts = 5 - newAttempts;
      Alert.alert(
        'Login Failed',
        `Invalid credentials. ${remainingAttempts} attempts remaining.`
      );
    }

    // Shake animation and vibration for failed login
    shakeAnimation.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    Vibration.vibrate(100);
  };

  const checkLockout = (): boolean => {
    if (isLocked && Date.now() < lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / (60 * 1000));
      Alert.alert(
        'Account Locked',
        `Please try again in ${remainingTime} minutes.`
      );
      return true;
    } else if (isLocked && Date.now() >= lockoutTime) {
      setIsLocked(false);
      setLoginAttempts(0);
      setLockoutTime(0);
    }
    return false;
  };

  const handleLogin = async () => {
    if (checkLockout()) return;
    if (!validateForm()) {
      const firstError = Object.values(formErrors)[0];
      Alert.alert('Validation Error', firstError);
      return;
    }

    setIsLoading(true);
    
    try {
      const user = await authService.signInWithEmail(
        formData.email.trim().toLowerCase(), 
        formData.password
      );
      
      console.log('Login successful:', user);
      
      // Reset login attempts on successful login
      setLoginAttempts(0);
      setIsLocked(false);
      setLockoutTime(0);
      
      // Show welcome message if user hasn't verified email
      if (!user.isEmailVerified) {
        Alert.alert(
          'Welcome Back!',
          'Please verify your email address to unlock all features. Check your inbox for the verification email.',
          [
            { text: 'Send Again', onPress: handleResendVerification },
            { text: 'Continue', onPress: () => router.replace('/(tabs)') }
          ]
        );
      } else {
        router.replace('/(tabs)');
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      handleFailedLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      Alert.alert(
        'Email Required', 
        'Please enter your email address first, then try the forgot password option.'
      );
      emailRef.current?.focus();
      return;
    }

    if (!validateEmail(formData.email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      emailRef.current?.focus();
      return;
    }

    try {
      setIsLoading(true);
      await authService.sendPasswordResetEmail(formData.email.trim().toLowerCase());
      Alert.alert(
        'Reset Email Sent ✉️',
        `Password reset instructions have been sent to ${formData.email}. Please check your inbox and follow the instructions.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await authService.sendEmailVerification();
      Alert.alert(
        'Verification Email Sent',
        'A new verification email has been sent to your inbox.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send verification email');
    }
  };

  const handleGuestAccess = () => {
    Alert.alert(
      'Continue as Guest',
      'You can explore the app as a guest, but your spiritual progress won\'t be saved and some features will be limited.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue as Guest', onPress: () => router.replace('/(tabs)') }
      ]
    );
  };

  // Animated style for shake effect
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeAnimation.value }],
    };
  });

  const isFormValid = () => {
    return formData.email.trim() && 
           formData.password.trim() && 
           Object.keys(formErrors).length === 0;
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <View style={[styles.logoBackground, { backgroundColor: isDark ? '#10B981' : '#059669' }]}>
                <Text style={styles.logo}>☪</Text>
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Continue your spiritual journey</Text>
              
              {loginAttempts > 0 && !isLocked && (
                <Text style={styles.warningText}>
                  {5 - loginAttempts} attempts remaining
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View 
            entering={FadeInUp.delay(200).duration(600)} 
            style={[styles.formContainer, animatedStyle]}
          >
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                ref={emailRef}
                style={[
                  styles.input,
                  formErrors.email && styles.inputError,
                  isLoading && styles.inputDisabled
                ]}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                autoComplete="email"
              />
              {formErrors.email && (
                <Text style={styles.errorText}>{formErrors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={passwordRef}
                  style={[
                    styles.input, 
                    styles.passwordInput,
                    formErrors.password && styles.inputError,
                    isLoading && styles.inputDisabled
                  ]}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {formErrors.password && (
                <Text style={styles.errorText}>{formErrors.password}</Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton, 
                (!isFormValid() || isLoading || isLocked) && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={!isFormValid() || isLoading || isLocked}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>
                  {isLocked ? 'Account Locked' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.guestButton} 
              onPress={handleGuestAccess}
              disabled={isLoading}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/register')}
              disabled={isLoading}
            >
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityText}>
              🔒 Your data is protected with industry-standard encryption
            </Text>
          </View>
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
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
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
    warningText: {
      fontSize: 14,
      color: '#F59E0B',
      textAlign: 'center',
      marginTop: 8,
      fontWeight: '500',
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
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    inputError: {
      borderColor: '#EF4444',
      borderWidth: 2,
    },
    inputDisabled: {
      opacity: 0.7,
      backgroundColor: isDark ? '#111827' : '#F3F4F6',
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
    errorText: {
      fontSize: 14,
      color: '#EF4444',
      marginTop: 4,
      marginLeft: 4,
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
      shadowColor: '#059669',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    loginButtonDisabled: {
      opacity: 0.6,
      backgroundColor: '#6B7280',
      shadowOpacity: 0,
      elevation: 0,
    },
    loginButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
    securityNotice: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      alignItems: 'center',
    },
	securityText: {
      fontSize: 12,
      color: isDark ? '#6B7280' : '#9CA3AF',
      textAlign: 'center',
    },
  });
}