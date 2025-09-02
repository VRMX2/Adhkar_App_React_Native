// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User } from '@/services/authService';
import { firebaseAdhkarService } from '@/services/adhkarService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  deleteAccount: (password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = async () => {
      try {
        // Set up auth state listener
        unsubscribe = authService.onAuthStateChanged(async (user) => {
          setUser(user);
          setIsAuthenticated(!!user);
          
          // Initialize adhkar service for new user
          if (user) {
            try {
              await firebaseAdhkarService.initializeUserAdhkar(user.id);
              // Sync offline data if any
              await firebaseAdhkarService.syncOfflineData();
            } catch (error) {
              console.error('Error initializing user adhkar:', error);
            }
          }
          
          setIsLoading(false);
        });

        // Check for existing user on app start
        await checkCurrentUser();
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        setIsLoading(false);
      }
    };

    setupAuthListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const checkCurrentUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      const isAuth = await authService.isAuthenticated();
      
      setUser(currentUser);
      setIsAuthenticated(isAuth && !!currentUser);

      // Initialize adhkar service if user exists
      if (currentUser && isAuth) {
        await firebaseAdhkarService.initializeUserAdhkar(currentUser.id);
      }
    } catch (error) {
      console.error('Error checking current user:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const user = await authService.signInWithEmail(email, password);
      setUser(user);
      setIsAuthenticated(true);
      
      // Initialize user adhkar data
      await firebaseAdhkarService.initializeUserAdhkar(user.id);
      await firebaseAdhkarService.syncOfflineData();
      
      return user;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<User> => {
    setIsLoading(true);
    try {
      const user = await authService.signUpWithEmail(email, password, name);
      setUser(user);
      setIsAuthenticated(true);
      
      // Initialize user adhkar data for new user
      await firebaseAdhkarService.initializeUserAdhkar(user.id);
      
      return user;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setIsAuthenticated(false);
      
      // Set adhkar service to offline mode
      await firebaseAdhkarService.setOfflineMode(true);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    try {
      await authService.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    try {
      const updatedUser = await authService.updateUserProfile(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const deleteAccount = async (password: string): Promise<void> => {
    try {
      await authService.deleteAccount(password);
      setUser(null);
      setIsAuthenticated(false);
      
      // Set adhkar service to offline mode
      await firebaseAdhkarService.setOfflineMode(true);
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updateProfile,
    deleteAccount,
	changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};