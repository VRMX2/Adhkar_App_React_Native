import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { authService } from '@/services/authService';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ visible, onClose, onSuccess }: AuthModalProps) {
  const colorScheme = useColorScheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const handleSubmit = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await authService.signUpWithEmail(email, password, name);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        await authService.signInWithEmail(email, password);
        Alert.alert('Success', 'Welcome back!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setShowPassword(false);
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInUp.duration(600)}
          style={styles.modal}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {isSignUp 
              ? 'Join our Islamic community' 
              : 'Sign in to continue your spiritual journey'
            }
          </Text>

          <View style={styles.form}>
            {isSignUp && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View style={styles.inputContainer}>
                  <User size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <View style={styles.inputContainer}>
                <Mail size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <View style={styles.inputContainer}>
                <Lock size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  ) : (
                    <Eye size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <TouchableOpacity style={styles.switchButton} onPress={switchMode}>
                <Text style={styles.switchButtonText}>
                  {isSignUp 
                    ? 'Already have an account? Sign In' 
                    : "Don't have an account? Sign Up"
                  }
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modal: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    closeButton: {
      padding: 4,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginBottom: 24,
    },
    form: {
      gap: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    submitButton: {
      backgroundColor: '#059669',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    disabledButton: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: 16,
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
      marginHorizontal: 16,
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    socialButton: {
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#4B5563' : '#E5E7EB',
    },
    socialButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    switchButton: {
      alignItems: 'center',
      marginTop: 16,
    },
    switchButtonText: {
      fontSize: 14,
      color: '#059669',
      fontWeight: '600',
    },
  });
}