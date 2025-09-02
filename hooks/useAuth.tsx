// hooks/useAuth.ts - Updated to properly handle authentication state
import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile, 
  sendPasswordResetEmail,
} from 'firebase/auth'; 
import { auth } from '@/config/firebase'; 
import { dashboardService } from '@/services/dashboardService'; 
 
interface AuthContextType { 
  user: User | null; 
  loading: boolean; 
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null; 
  signIn: (email: string, password: string) => Promise<void>; 
  signUp: (email: string, password: string, displayName: string) => Promise<void>; 
  logout: () => Promise<void>; 
  resetPassword: (email: string) => Promise<void>; 
  clearError: () => void; 
} 
 
const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isLoading: true,
  isAuthenticated: false,
  error: null, 
  signIn: async () => {}, 
  signUp: async () => {}, 
  logout: async () => {}, 
  resetPassword: async () => {}, 
  clearError: () => {}, 
}); 
 
export const useAuth = () => { 
  const context = useContext(AuthContext); 
  if (!context) { 
    throw new Error('useAuth must be used within an AuthProvider'); 
  } 
  return context; 
}; 
 
interface AuthProviderProps { 
  children: ReactNode; 
} 
 
export const AuthProvider = ({ children }: AuthProviderProps) => { 
  const [user, setUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null); 
  const [authStateResolved, setAuthStateResolved] = useState(false);
 
  // Computed values for compatibility
  const isAuthenticated = !!user && authStateResolved;
  const isLoading = loading || !authStateResolved;
 
  useEffect(() => { 
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', {
        userId: firebaseUser?.uid,
        email: firebaseUser?.email,
        displayName: firebaseUser?.displayName
      });
      
      setUser(firebaseUser); 
      setLoading(false);
      setAuthStateResolved(true);
 
      // Initialize dashboard data for authenticated users 
      if (firebaseUser) { 
        try { 
          console.log('Initializing dashboard for user:', firebaseUser.uid);
          await dashboardService.initializeUserDashboard(firebaseUser.uid); 
        } catch (err) { 
          console.error('Error initializing user dashboard:', err); 
        } 
      }
    }, (error) => {
      console.error('Auth state change error:', error);
      setUser(null);
      setLoading(false);
      setAuthStateResolved(true);
      setError('Authentication error occurred');
    }); 

    // Set a timeout to ensure we don't wait indefinitely
    const timeout = setTimeout(() => {
      if (!authStateResolved) {
        console.log('Auth state resolution timeout, setting resolved to true');
        setLoading(false);
        setAuthStateResolved(true);
      }
    }, 5000); // 5 second timeout
 
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []); 
 
  const signIn = async (email: string, password: string) => { 
    try { 
      console.log('Attempting to sign in user:', email);
      setError(null); 
      setLoading(true); 
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password); 
      console.log('Sign in successful:', userCredential.user.uid);
       
      // Initialize dashboard data if not exists 
      if (userCredential.user) { 
        await dashboardService.initializeUserDashboard(userCredential.user.uid); 
      } 
    } catch (err: any) { 
      console.error('Sign in error:', err);
      setError(getAuthErrorMessage(err.code)); 
      throw err; 
    } finally { 
      setLoading(false); 
    } 
  }; 
 
  const signUp = async (email: string, password: string, displayName: string) => { 
    try { 
      console.log('Attempting to sign up user:', email);
      setError(null); 
      setLoading(true); 
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password); 
      console.log('Sign up successful:', userCredential.user.uid);
       
      // Update profile with display name 
      if (userCredential.user) { 
        await updateProfile(userCredential.user, { 
          displayName: displayName, 
        }); 
         
        // Initialize dashboard data for new user 
        await dashboardService.initializeUserDashboard(userCredential.user.uid); 
      } 
    } catch (err: any) { 
      console.error('Sign up error:', err);
      setError(getAuthErrorMessage(err.code)); 
      throw err; 
    } finally { 
      setLoading(false); 
    } 
  }; 
 
  const logout = async () => { 
    try { 
      console.log('Attempting to sign out user');
      setError(null); 
      await signOut(auth); 
      console.log('Sign out successful');
    } catch (err: any) { 
      console.error('Sign out error:', err);
      setError(getAuthErrorMessage(err.code)); 
      throw err; 
    } 
  }; 
 
  const resetPassword = async (email: string) => { 
    try {
      console.log('Attempting password reset for:', email);
      setError(null); 
      await sendPasswordResetEmail(auth, email); 
      console.log('Password reset email sent');
    } catch (err: any) { 
      console.error('Password reset error:', err);
      setError(getAuthErrorMessage(err.code)); 
      throw err; 
    } 
  }; 
 
  const clearError = () => { 
    setError(null); 
  }; 

  // Log current state for debugging
  useEffect(() => {
    console.log('Auth state update:', {
      user: user?.uid,
      loading,
      isLoading,
      isAuthenticated,
      authStateResolved,
      error
    });
  }, [user, loading, isLoading, isAuthenticated, authStateResolved, error]);
 
  const value: AuthContextType = { 
    user, 
    loading, 
    isLoading,
    isAuthenticated,
    error, 
    signIn, 
    signUp, 
    logout, 
    resetPassword, 
    clearError, 
  }; 
 
  return ( 
    <AuthContext.Provider value={value}> 
      {children} 
    </AuthContext.Provider> 
  ); 
}; 
 
// Helper function to convert Firebase auth error codes to user-friendly messages 
const getAuthErrorMessage = (errorCode: string): string => { 
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
    default: 
      return 'An error occurred. Please try again.'; 
  } 
};