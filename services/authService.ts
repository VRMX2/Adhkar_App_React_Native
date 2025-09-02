// services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  Auth,
  deleteUser,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  serverTimestamp,
  Firestore,
  Timestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAof6Gpi1kmMFKrZavseSxpOlFJ9j3EftA",
  authDomain: "dhikrappreactnative.firebaseapp.com",
  projectId: "dhikrappreactnative",
  storageBucket: "dhikrappreactnative.firebasestorage.app",
  messagingSenderId: "59294415347",
  appId: "1:59294415347:web:8affa9ef5be62145073a86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
  };
  profile: {
    bio?: string;
    location?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UserStats {
  prayersCompleted: number;
  dhikrCount: number;
  quranReadingTime: number; // in minutes
  streakDays: number;
  lastActiveDate: Date;
}

// Helper function to safely convert timestamps to Date objects
const safeToDate = (timestamp: any): Date => {
  if (!timestamp) {
    return new Date();
  }
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it's a Firestore Timestamp
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a timestamp object with seconds and nanoseconds
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  }
  
  // If it's a string or number, try to parse it
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  // Fallback to current date
  return new Date();
};

// Helper function to clean undefined values from objects
const cleanUndefinedValues = (obj: any): any => {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        const cleanedNested = cleanUndefinedValues(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};

class AuthService {
  private userKey = 'islamic_app_user';
  private tokensKey = 'islamic_app_tokens';
  private auth: Auth;
  private db: Firestore;

  constructor() {
    this.auth = auth;
    this.db = db;
  }

  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore or create if it doesn't exist
      let userData = await this.getUserFromFirestore(firebaseUser.uid);
      
      if (!userData) {
        // Create user data if it doesn't exist (for legacy users)
        userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || email,
          name: firebaseUser.displayName || 'User',
          isEmailVerified: firebaseUser.emailVerified,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          preferences: {
            notifications: true,
            darkMode: false,
            language: 'en',
          },
          profile: {
            bio: '',
            location: '',
          },
        };
        
        // Only add avatar if it exists
        if (firebaseUser.photoURL) {
          userData.avatar = firebaseUser.photoURL;
        }
        
        await this.createUserInFirestore(userData);
        await this.createUserStats(firebaseUser.uid);
      } else {
        // Update last login
        await this.updateLastLogin(firebaseUser.uid);
        
        // Refresh userData to get updated lastLoginAt
        userData = await this.getUserFromFirestore(firebaseUser.uid) || userData;
      }
      
      // Get tokens
      const accessToken = await firebaseUser.getIdToken();
      const tokens: AuthTokens = {
        accessToken,
        refreshToken: firebaseUser.refreshToken,
        expiresAt: Date.now() + 3600000,
      };

      await AsyncStorage.setItem(this.userKey, JSON.stringify(userData));
      await AsyncStorage.setItem(this.tokensKey, JSON.stringify(tokens));

      return userData;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign up with email, password, and name
  async signUpWithEmail(email: string, password: string, name: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: name,
      });

      // Send email verification
      try {
        await sendEmailVerification(firebaseUser);
      } catch (verificationError) {
        console.warn('Email verification failed:', verificationError);
        // Don't throw here, continue with user creation
      }

      // Create user document in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: name,
        isEmailVerified: firebaseUser.emailVerified,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'en',
        },
        profile: {
          bio: '',
          location: '',
        },
      };

      // Only add avatar if it exists
      if (firebaseUser.photoURL) {
        userData.avatar = firebaseUser.photoURL;
      }

      await this.createUserInFirestore(userData);
      await this.createUserStats(firebaseUser.uid);

      // Get tokens
      const accessToken = await firebaseUser.getIdToken();
      const tokens: AuthTokens = {
        accessToken,
        refreshToken: firebaseUser.refreshToken,
        expiresAt: Date.now() + 3600000,
      };

      await AsyncStorage.setItem(this.userKey, JSON.stringify(userData));
      await AsyncStorage.setItem(this.tokensKey, JSON.stringify(tokens));

      return userData;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const stored = await AsyncStorage.getItem(this.userKey);
      if (stored) {
        const userData = JSON.parse(stored);
        
        // Ensure dates are properly converted when reading from storage
        if (userData) {
          userData.createdAt = safeToDate(userData.createdAt);
          userData.lastLoginAt = safeToDate(userData.lastLoginAt);
          
          if (userData.profile?.dateOfBirth) {
            userData.profile.dateOfBirth = safeToDate(userData.profile.dateOfBirth);
          }
        }
        
        // Sync with Firebase if user is still authenticated
        const currentUser = this.auth.currentUser;
        if (currentUser) {
          try {
            const freshData = await this.getUserFromFirestore(currentUser.uid);
            if (freshData) {
              await AsyncStorage.setItem(this.userKey, JSON.stringify(freshData));
              return freshData;
            }
          } catch (syncError) {
            console.warn('Failed to sync user data:', syncError);
            // Return cached data if sync fails
            return userData;
          }
        }
        
        return userData;
      }

      // Check Firebase auth state
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        const userData = await this.getUserFromFirestore(currentUser.uid);
        if (userData) {
          await AsyncStorage.setItem(this.userKey, JSON.stringify(userData));
          return userData;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(updates: Partial<User>): Promise<User> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Update Firebase Auth profile if name or avatar changed
      if (updates.name || updates.avatar) {
        const authUpdates: any = {};
        if (updates.name) authUpdates.displayName = updates.name;
        if (updates.avatar) authUpdates.photoURL = updates.avatar;
        
        await updateProfile(currentUser, authUpdates);
      }

      // Clean undefined values before updating Firestore
      const cleanedUpdates = cleanUndefinedValues(updates);

      // Update Firestore document
      const userRef = doc(this.db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...cleanedUpdates,
        updatedAt: serverTimestamp(),
      });

      // Get updated user data
      const updatedUser = await this.getUserFromFirestore(currentUser.uid);
      if (updatedUser) {
        await AsyncStorage.setItem(this.userKey, JSON.stringify(updatedUser));
        return updatedUser;
      } else {
        throw new Error('Failed to retrieve updated user data');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Upload avatar image
  async uploadAvatar(uri: string): Promise<string> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      
      const avatarRef = ref(storage, `avatars/${currentUser.uid}/${Date.now()}.jpg`);
      await uploadBytes(avatarRef, blob);
      
      const downloadUrl = await getDownloadURL(avatarRef);
      return downloadUrl;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      throw new Error('Failed to upload avatar');
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user');
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);
    } catch (error: any) {
      console.error('Change password error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Delete account
  async deleteAccount(password: string): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user');
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      // Delete user data from Firestore
      await deleteDoc(doc(this.db, 'users', currentUser.uid));
      await deleteDoc(doc(this.db, 'userStats', currentUser.uid));

      // Delete avatar from storage if exists
      try {
        const avatarRef = ref(storage, `avatars/${currentUser.uid}`);
        await deleteObject(avatarRef);
      } catch (error) {
        // Avatar might not exist, ignore error
      }

      // Delete Firebase Auth user
      await deleteUser(currentUser);

      // Clear local storage
      await AsyncStorage.multiRemove([this.userKey, this.tokensKey]);
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
      await AsyncStorage.multiRemove([this.userKey, this.tokensKey]);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Sign out failed');
    }
  }

  // Check authentication status
  async isAuthenticated(): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(this.auth, (user) => {
          unsubscribe();
          resolve(!!user);
        });
      });
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  // Send email verification
  async sendEmailVerification(): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }
      await sendEmailVerification(currentUser);
    } catch (error: any) {
      console.error('Email verification error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Get user statistics
  async getUserStats(): Promise<UserStats | null> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        return null;
      }

      const statsDoc = await getDoc(doc(this.db, 'userStats', currentUser.uid));
      if (statsDoc.exists()) {
        const data = statsDoc.data();
        return {
          prayersCompleted: data.prayersCompleted || 0,
          dhikrCount: data.dhikrCount || 0,
          quranReadingTime: data.quranReadingTime || 0,
          streakDays: data.streakDays || 0,
          lastActiveDate: safeToDate(data.lastActiveDate),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  // Update user statistics
  async updateUserStats(stats: Partial<UserStats>): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const statsRef = doc(this.db, 'userStats', currentUser.uid);
      await updateDoc(statsRef, {
        ...stats,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Update stats error:', error);
      throw new Error('Failed to update statistics');
    }
  }

  // Auth state change listener
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userData = await this.getUserFromFirestore(firebaseUser.uid);
          if (userData) {
            await AsyncStorage.setItem(this.userKey, JSON.stringify(userData));
            callback(userData);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          callback(null);
        }
      } else {
        await AsyncStorage.multiRemove([this.userKey, this.tokensKey]);
        callback(null);
      }
    });
  }

  // Private helper methods
  private async createUserInFirestore(userData: User): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userData.id);
      
      // Clean the userData to remove undefined values
      const cleanedUserData = cleanUndefinedValues({
        ...userData,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(userRef, cleanedUserData);
    } catch (error) {
      console.error('Error creating user in Firestore:', error);
      throw new Error('Failed to create user profile');
    }
  }

  private async getUserFromFirestore(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const userData: User = {
          id: data.id || uid, // Fallback to uid if id is missing
          email: data.email,
          name: data.name,
          isEmailVerified: data.isEmailVerified,
          createdAt: safeToDate(data.createdAt),
          lastLoginAt: safeToDate(data.lastLoginAt),
          preferences: data.preferences || {
            notifications: true,
            darkMode: false,
            language: 'en',
          },
          profile: data.profile || {},
        };

        // Only add avatar if it exists
        if (data.avatar) {
          userData.avatar = data.avatar;
        }

        // Handle nested date objects
        if (userData.profile?.dateOfBirth) {
          userData.profile.dateOfBirth = safeToDate(userData.profile.dateOfBirth);
        }

        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user from Firestore:', error);
      return null;
    }
  }

  private async createUserStats(uid: string): Promise<void> {
    try {
      const statsRef = doc(this.db, 'userStats', uid);
      
      // Check if stats already exist
      const existingStats = await getDoc(statsRef);
      if (existingStats.exists()) {
        return; // Stats already exist, don't overwrite
      }
      
      await setDoc(statsRef, {
        prayersCompleted: 0,
        dhikrCount: 0,
        quranReadingTime: 0,
        streakDays: 0,
        lastActiveDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating user stats:', error);
    }
  }

  private async updateLastLogin(uid: string): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', uid);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/requires-recent-login':
        return 'Please sign in again to perform this action.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed.';
      case 'auth/invalid-credential':
        return 'Invalid credentials. Please check your email and password.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

export const authService = new AuthService();