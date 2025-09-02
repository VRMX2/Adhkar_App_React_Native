// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { authService, User, UserStats } from '@/services/authService';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    location: '',
  });

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
        
        // Load user statistics
        const stats = await authService.getUserStats();
        setUserStats(stats);
        
        // Initialize edit data
        setEditData({
          name: currentUser.name,
          bio: currentUser.profile.bio || '',
          location: currentUser.profile.location || '',
        });
      } else {
        setIsGuest(true);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsGuest(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || isGuest) return;
    
    try {
      setIsUpdating(true);
      
      const updates: Partial<User> = {
        name: editData.name.trim(),
        profile: {
          ...user.profile,
          bio: editData.bio.trim(),
          location: editData.location.trim(),
        },
      };
      
      const updatedUser = await authService.updateUserProfile(updates);
      setUser(updatedUser);
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePickImage = async () => {
    if (!user || isGuest) return;
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera roll permissions to update your profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUpdating(true);
        
        const avatarUrl = await authService.uploadAvatar(result.assets[0].uri);
        const updatedUser = await authService.updateUserProfile({ avatar: avatarUrl });
        setUser(updatedUser);
        
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!user || isGuest) return;
    
    try {
      const updates: Partial<User> = {
        preferences: {
          ...user.preferences,
          notifications: enabled,
        },
      };
      
      const updatedUser = await authService.updateUserProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleToggleDarkMode = async (enabled: boolean) => {
    if (!user || isGuest) return;
    
    try {
      const updates: Partial<User> = {
        preferences: {
          ...user.preferences,
          darkMode: enabled,
        },
      };
      
      const updatedUser = await authService.updateUserProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      Alert.alert('Error', 'Failed to update theme settings');
    }
  };

  const handleChangePassword = () => {
    Alert.prompt(
      'Change Password',
      'Enter your current password:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Next', 
          onPress: (currentPassword) => {
            if (currentPassword) {
              Alert.prompt(
                'New Password',
                'Enter your new password:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Update', 
                    onPress: async (newPassword) => {
                      if (newPassword && newPassword.length >= 6) {
                        try {
                          await authService.changePassword(currentPassword, newPassword);
                          Alert.alert('Success', 'Password updated successfully!');
                        } catch (error: any) {
                          Alert.alert('Error', error.message);
                        }
                      } else {
                        Alert.alert('Error', 'Password must be at least 6 characters');
                      }
                    }
                  }
                ],
                'secure-text'
              );
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const handleSendVerification = async () => {
    try {
      await authService.sendEmailVerification();
      Alert.alert('Success', 'Verification email sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              router.replace('/(auth)');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirm Deletion',
              'Enter your password to confirm:',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete Account', 
                  style: 'destructive',
                  onPress: async (password) => {
                    if (password) {
                      try {
                        await authService.deleteAccount(password);
                        router.replace('/(auth)');
                      } catch (error: any) {
                        Alert.alert('Error', error.message);
                      }
                    }
                  }
                }
              ],
              'secure-text'
            );
          }
        }
      ]
    );
  };

  const gradientColors = isDark
    ? ['#0F172A', '#1E293B', '#334155']
    : ['#F0FDF4', '#DCFCE7', '#BBF7D0'];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Guest State */}
        {isGuest ? (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.guestContainer}>
            <View style={styles.guestIcon}>
              <Text style={styles.guestIconText}>👤</Text>
            </View>
            <Text style={styles.guestTitle}>Guest Mode</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to save your progress and unlock all features
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.createAccountButtonText}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            {/* Profile Header */}
            <Animated.View entering={FadeInDown.duration(600)} style={styles.profileHeader}>
              <TouchableOpacity onPress={handlePickImage} disabled={isUpdating}>
                <View style={styles.avatarContainer}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {user?.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {isUpdating && (
                    <View style={styles.avatarLoading}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                  <View style={styles.avatarEdit}>
                    <Text style={styles.avatarEditText}>📷</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {!user?.isEmailVerified && (
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleSendVerification}
                >
                  <Text style={styles.verifyButtonText}>Verify Email</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Profile Info */}
            <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.profileInfo}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Profile Information</Text>
                <TouchableOpacity 
                  onPress={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                  disabled={isUpdating}
                >
                  <Text style={styles.editButton}>
                    {isEditing ? 'Save' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoContainer}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.infoInput}
                      value={editData.name}
                      onChangeText={(text) => setEditData(prev => ({ ...prev, name: text }))}
                      placeholder="Enter your name"
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{user?.name}</Text>
                  )}
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                  {!user?.isEmailVerified && (
                    <Text style={styles.unverifiedText}>Unverified</Text>
                  )}
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Bio</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.infoInput, styles.bioInput]}
                      value={editData.bio}
                      onChangeText={(text) => setEditData(prev => ({ ...prev, bio: text }))}
                      placeholder="Tell us about yourself"
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {user?.profile.bio || 'No bio added yet'}
                    </Text>
                  )}
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Location</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.infoInput}
                      value={editData.location}
                      onChangeText={(text) => setEditData(prev => ({ ...prev, location: text }))}
                      placeholder="Enter your location"
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    />
                  ) : (
                    <Text style={styles.infoValue}>
                      {user?.profile.location || 'Location not set'}
                    </Text>
                  )}
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue}>
                    {user?.createdAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>

              {isEditing && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    setEditData({
                      name: user?.name || '',
                      bio: user?.profile.bio || '',
                      location: user?.profile.location || '',
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Statistics */}
            {userStats && (
              <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.statsContainer}>
                <Text style={styles.sectionTitle}>Your Progress</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{userStats.prayersCompleted}</Text>
                    <Text style={styles.statLabel}>Prayers</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{userStats.dhikrCount}</Text>
                    <Text style={styles.statLabel}>Dhikr</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{Math.floor(userStats.quranReadingTime / 60)}h</Text>
                    <Text style={styles.statLabel}>Quran</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{userStats.streakDays}</Text>
                    <Text style={styles.statLabel}>Streak</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* Settings */}
            <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.settingsContainer}>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Switch
                  value={user?.preferences.notifications}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: '#767577', true: '#059669' }}
                  thumbColor={user?.preferences.notifications ? '#10B981' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Switch
                  value={user?.preferences.darkMode}
                  onValueChange={handleToggleDarkMode}
                  trackColor={{ false: '#767577', true: '#059669' }}
                  thumbColor={user?.preferences.darkMode ? '#10B981' : '#f4f3f4'}
                />
              </View>

              <TouchableOpacity style={styles.settingButton} onPress={handleChangePassword}>
                <Text style={styles.settingButtonText}>Change Password</Text>
                <Text style={styles.settingArrow}>›</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Account Actions */}
            <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.actionsContainer}>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      marginTop: 12,
    },
    
    // Guest State Styles
    guestContainer: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    guestIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    guestIconText: {
      fontSize: 40,
    },
    guestTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 8,
    },
    guestSubtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
      textAlign: 'center',
      marginBottom: 30,
      paddingHorizontal: 40,
    },
    signInButton: {
      backgroundColor: '#059669',
      borderRadius: 12,
      paddingHorizontal: 32,
      paddingVertical: 16,
      marginBottom: 12,
      minWidth: 200,
    },
    signInButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    createAccountButton: {
      borderColor: '#059669',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 32,
      paddingVertical: 16,
      minWidth: 200,
    },
    createAccountButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#059669',
      textAlign: 'center',
    },

    // Profile Header Styles
    profileHeader: {
      alignItems: 'center',
      marginBottom: 30,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#059669',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 40,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    avatarLoading: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarEdit: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#059669',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: isDark ? '#1F2937' : '#FFFFFF',
    },
    avatarEditText: {
      fontSize: 14,
    },
    verifyButton: {
      backgroundColor: '#F59E0B',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    verifyButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },

    // Profile Info Styles
    profileInfo: {
      backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      backdropFilter: 'blur(10px)',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    editButton: {
      fontSize: 16,
      fontWeight: '600',
      color: '#059669',
    },
    infoContainer: {
      gap: 16,
    },
    infoItem: {
      gap: 4,
    },
    infoLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    infoValue: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    infoInput: {
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#D1D5DB',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#1F2937',
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    bioInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    unverifiedText: {
      fontSize: 12,
      color: '#F59E0B',
      fontWeight: '500',
    },
    cancelButton: {
      marginTop: 16,
      alignSelf: 'flex-start',
    },
    cancelButtonText: {
      fontSize: 16,
      color: '#EF4444',
      fontWeight: '500',
    },

    // Statistics Styles
    statsContainer: {
      backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: '#059669',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },

    // Settings Styles
    settingsContainer: {
      backgroundColor: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    settingLabel: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    settingButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#E5E7EB',
    },
    settingButtonText: {
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    settingArrow: {
      fontSize: 20,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },

    // Actions Styles
    actionsContainer: {
      gap: 12,
      marginBottom: 40,
    },
    signOutButton: {
      backgroundColor: '#EF4444',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    signOutButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    deleteButton: {
      backgroundColor: 'transparent',
      borderColor: '#EF4444',
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#EF4444',
    },
  });
}