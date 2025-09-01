import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class AuthService {
  private userKey = 'islamic_app_user';
  private tokensKey = 'islamic_app_tokens';

  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful authentication
      const user: User = {
        id: '1',
        email,
        name: email.split('@')[0],
      };

      const tokens: AuthTokens = {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: Date.now() + 3600000, // 1 hour
      };

      await AsyncStorage.setItem(this.userKey, JSON.stringify(user));
      await AsyncStorage.setItem(this.tokensKey, JSON.stringify(tokens));

      return user;
    } catch (error) {
      throw new Error('Authentication failed');
    }
  }

  async signUpWithEmail(email: string, password: string, name: string): Promise<User> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user: User = {
        id: '1',
        email,
        name,
      };

      const tokens: AuthTokens = {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: Date.now() + 3600000,
      };

      await AsyncStorage.setItem(this.userKey, JSON.stringify(user));
      await AsyncStorage.setItem(this.tokensKey, JSON.stringify(tokens));

      return user;
    } catch (error) {
      throw new Error('Registration failed');
    }
  }

  async signInWithGoogle(): Promise<User> {
    // Implementation for Google Sign-In
    throw new Error('Google Sign-In not implemented in demo');
  }

  async signInWithApple(): Promise<User> {
    // Implementation for Apple Sign-In
    throw new Error('Apple Sign-In not implemented in demo');
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const stored = await AsyncStorage.getItem(this.userKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.userKey, this.tokensKey]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const tokensStored = await AsyncStorage.getItem(this.tokensKey);
      if (!tokensStored) return false;

      const tokens: AuthTokens = JSON.parse(tokensStored);
      return Date.now() < tokens.expiresAt;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
}

export const authService = new AuthService();