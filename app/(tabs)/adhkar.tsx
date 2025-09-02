import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Alert,
  Modal,
  Vibration,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Reanimated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import {
  Search,
  Heart,
  Sun,
  Moon,
  Star,
  Bookmark,
  Play,
  RotateCcw,
  TrendingUp,
  Target,
  Award,
  Clock,
  Zap,
} from 'lucide-react-native';
import { firebaseAdhkarService, UserDhikrStats } from '@/services/adhkarService';
import { useAuth } from '@/contexts/AuthContext';
import { Dhikr, DhikrCategory } from '@/types/dhikr';

// Create a simple view component if Reanimated.View isn't working
const AnimatedView = Reanimated?.View || View;

interface DhikrCounterProps {
  dhikr: Dhikr;
  onComplete: (count: number, duration: number) => void;
  onClose: () => void;
  visible: boolean;
}

const DhikrCounter: React.FC<DhikrCounterProps> = ({
  dhikr,
  onComplete,
  onClose,
  visible,
}) => {
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const startSession = async () => {
    try {
      const id = await firebaseAdhkarService.startDhikrSession(dhikr.id, dhikr.category);
      setSessionId(id);
      setStartTime(new Date());
      setIsActive(true);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const incrementCount = async () => {
    const newCount = count + 1;
    setCount(newCount);

    // Animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Vibration feedback
    Vibration.vibrate(50);

    // Update session progress
    if (sessionId) {
      await firebaseAdhkarService.updateDhikrProgress(sessionId, newCount);
    }

    // Check if target reached
    if (newCount >= dhikr.count) {
      completeSession();
    }
  };

  const completeSession = async () => {
    if (!startTime || !sessionId) return;

    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    try {
      await firebaseAdhkarService.completeDhikrSession(sessionId, count, duration);
      onComplete(count, duration);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const resetCounter = () => {
    setCount(0);
    setIsActive(false);
    setStartTime(null);
    setSessionId(null);
  };

  const styles = createCounterStyles(isDark);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.counterContainer}>
        <View style={styles.counterHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.counterTitle}>
            {count}/{dhikr.count}
          </Text>
          <TouchableOpacity onPress={resetCounter} style={styles.resetButton}>
            <RotateCcw size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.counterContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.counterArabic}>{dhikr.arabic}</Text>
          <Text style={styles.counterTransliteration}>{dhikr.transliteration}</Text>
          <Text style={styles.counterTranslation}>{dhikr.translation}</Text>
        </ScrollView>

        <View style={styles.counterActions}>
          {!isActive ? (
            <TouchableOpacity style={styles.startButton} onPress={startSession}>
              <Play size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity style={styles.countButton} onPress={incrementCount}>
                <Text style={styles.countButtonText}>{count}</Text>
                <Text style={styles.countButtonSubtext}>Tap to count</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function AdhkarScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DhikrCategory>('morning');
  const [adhkar, setAdhkar] = useState<Dhikr[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<UserDhikrStats | null>(null);
  const [selectedDhikr, setSelectedDhikr] = useState<Dhikr | null>(null);
  const [isCounterVisible, setIsCounterVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const categories = [
    { id: 'morning' as DhikrCategory, name: 'Morning', icon: Sun, gradient: ['#F59E0B', '#FBBF24'] },
    { id: 'evening' as DhikrCategory, name: 'Evening', icon: Moon, gradient: ['#8B5CF6', '#A78BFA'] },
    { id: 'general' as DhikrCategory, name: 'General', icon: Star, gradient: ['#059669', '#10B981'] },
    { id: 'sleeping' as DhikrCategory, name: 'Sleep', icon: Moon, gradient: ['#6366F1', '#818CF8'] },
  ];

  useEffect(() => {
    initializeData();
  }, [user]);

  useEffect(() => {
    loadAdhkar();
  }, [selectedCategory]);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      if (user) {
        await firebaseAdhkarService.initializeUserAdhkar(user.id);
        const stats = await firebaseAdhkarService.getUserDhikrStats();
        setUserStats(stats);
        const unsubscribe = firebaseAdhkarService.onDhikrStatsChange((stats) => {
          setUserStats(stats);
        });
        return () => unsubscribe();
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdhkar = async () => {
    try {
      const data = await firebaseAdhkarService.getAdhkarByCategory(selectedCategory);
      setAdhkar(data);
      await loadFavorites();
    } catch (error) {
      console.error('Error loading adhkar:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const favs = await firebaseAdhkarService.getFavorites();
      setFavorites(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (dhikrId: string) => {
    try {
      if (favorites.includes(dhikrId)) {
        await firebaseAdhkarService.removeFavorite(dhikrId);
        setFavorites(favorites.filter((id) => id !== dhikrId));
      } else {
        await firebaseAdhkarService.addFavorite(dhikrId);
        setFavorites([...favorites, dhikrId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    }
  };

  const startDhikrCounter = (dhikr: Dhikr) => {
    setSelectedDhikr(dhikr);
    setIsCounterVisible(true);
  };

  const handleCounterComplete = (count: number, duration: number) => {
    setIsCounterVisible(false);
    setSelectedDhikr(null);

    Alert.alert(
      'Dhikr Complete!',
      `You completed ${count} repetitions in ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`,
      [{ text: 'Alhamdulillah', style: 'default' }]
    );

    initializeData();
  };

  const filteredAdhkar = adhkar.filter(
    (dhikr) =>
      dhikr.arabic.includes(searchQuery) ||
      dhikr.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dhikr.transliteration.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading Adhkar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Stats Toggle */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Adhkar & Duas</Text>
              <Text style={styles.subtitle}>Daily remembrance of Allah</Text>
            </View>
            {user && (
              <TouchableOpacity onPress={() => setShowStats(!showStats)} style={styles.statsToggle}>
                <TrendingUp size={24} color="#059669" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* User Stats */}
        {user && showStats && userStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Zap size={20} color="#F59E0B" />
                <Text style={styles.statNumber}>{userStats.streakDays}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Target size={20} color="#059669" />
                <Text style={styles.statNumber}>{userStats.totalDhikrCount}</Text>
                <Text style={styles.statLabel}>Total Dhikr</Text>
              </View>
              <View style={styles.statCard}>
                <Clock size={20} color="#8B5CF6" />
                <Text style={styles.statNumber}>{userStats.totalTimeSpent}m</Text>
                <Text style={styles.statLabel}>Time Spent</Text>
              </View>
              <View style={styles.statCard}>
                <Award size={20} color="#EF4444" />
                <Text style={styles.statNumber}>{userStats.totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </View>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search adhkar..."
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Categories */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category, index) => (
              <View key={category.id}>
                <TouchableOpacity
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.selectedCategoryCard,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.categoryIconWrapper,
                      {
                        backgroundColor:
                          selectedCategory === category.id
                            ? category.gradient[0]
                            : isDark
                            ? '#1F2937'
                            : '#F3F4F6',
                      },
                    ]}
                  >
                    <category.icon
                      size={22}
                      color={selectedCategory === category.id ? '#FFFFFF' : category.gradient[0]}
                      strokeWidth={2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      selectedCategory === category.id && styles.selectedCategoryText,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Adhkar List */}
        <View style={styles.adhkarList}>
          {filteredAdhkar.map((dhikr, index) => (
            <View key={dhikr.id}>
              <View style={styles.dhikrCard}>
                {/* Header */}
                <View style={styles.dhikrHeader}>
                  <Text style={styles.dhikrCount}>
                    {dhikr.count} {dhikr.count === 1 ? 'time' : 'times'}
                  </Text>
                  <View style={styles.dhikrActions}>
                    {user && (
                      <TouchableOpacity onPress={() => startDhikrCounter(dhikr)} style={styles.actionButton}>
                        <Play size={18} color="#059669" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => toggleFavorite(dhikr.id)}
                      style={styles.actionButton}
                    >
                      <Heart
                        size={18}
                        color={favorites.includes(dhikr.id) ? '#EF4444' : isDark ? '#6B7280' : '#9CA3AF'}
                        fill={favorites.includes(dhikr.id) ? '#EF4444' : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Arabic */}
                <Text style={styles.arabicText}>{dhikr.arabic}</Text>

                {/* Transliteration */}
                <Text style={styles.transliteration}>{dhikr.transliteration}</Text>

                {/* Translation */}
                <Text style={styles.translation}>{dhikr.translation}</Text>

                {/* Source */}
                {dhikr.source && (
                  <View style={styles.sourceContainer}>
                    <Bookmark size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    <Text style={styles.source}>{dhikr.source}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Dhikr Counter Modal */}
      {selectedDhikr && (
        <DhikrCounter
          dhikr={selectedDhikr}
          onComplete={handleCounterComplete}
          onClose={() => {
            setIsCounterVisible(false);
            setSelectedDhikr(null);
          }}
          visible={isCounterVisible}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      paddingTop: 20,
      paddingBottom: 20,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#94A3B8' : '#6B7280',
    },
    statsToggle: {
      padding: 12,
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    statsContainer: {
      marginBottom: 20,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: '800',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#6B7280',
      fontWeight: '600',
    },
    searchContainer: {
      marginBottom: 20,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 50,
      paddingHorizontal: 18,
      paddingVertical: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    categoriesContainer: {
      marginBottom: 30,
    },
    categoriesContent: {
      paddingRight: 20,
      gap: 14,
    },
    categoryCard: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 14,
      alignItems: 'center',
      gap: 8,
      minWidth: 100,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    selectedCategoryCard: {
      backgroundColor: '#059669',
      borderColor: '#047857',
    },
    categoryIconWrapper: {
      padding: 10,
      borderRadius: 50,
      marginBottom: 4,
    },
    categoryName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    selectedCategoryText: {
      color: '#FFFFFF',
    },
    adhkarList: {
      gap: 22,
      paddingBottom: 30,
    },
    dhikrCard: {
      backgroundColor: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.9)',
      borderRadius: 20,
      padding: 22,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    dhikrHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    dhikrCount: {
      fontSize: 14,
      fontWeight: '700',
      color: '#059669',
      backgroundColor: isDark ? '#064E3B' : '#D1FAE5',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    dhikrActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
    },
    arabicText: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      textAlign: 'right',
      lineHeight: 42,
      marginBottom: 14,
    },
    transliteration: {
      fontSize: 16,
      fontStyle: 'italic',
      color: isDark ? '#CBD5E1' : '#4B5563',
      marginBottom: 8,
    },
    translation: {
      fontSize: 16,
      color: isDark ? '#E2E8F0' : '#374151',
      lineHeight: 24,
      marginBottom: 12,
    },
    sourceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    source: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#6B7280',
      fontStyle: 'italic',
    },
  });
}

function createCounterStyles(isDark: boolean) {
  return StyleSheet.create({
    counterContainer: {
      flex: 1,
      padding: 20,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    },
    counterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 30,
    },
    closeButton: {
      padding: 8,
    },
    closeText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    counterTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    resetButton: {
      padding: 8,
    },
    counterContent: {
      flex: 1,
      marginBottom: 30,
    },
    counterArabic: {
      fontSize: 32,
      fontWeight: '700',
      textAlign: 'center',
      lineHeight: 48,
      marginBottom: 20,
      color: isDark ? '#F9FAFB' : '#111827',
    },
    counterTransliteration: {
      fontSize: 18,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 16,
      color: isDark ? '#CBD5E1' : '#4B5563',
    },
    counterTranslation: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
      color: isDark ? '#E2E8F0' : '#374151',
    },
    counterActions: {
      alignItems: 'center',
    },
    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 50,
      gap: 12,
      backgroundColor: '#059669',
    },
    startButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700',
    },
    countButton: {
      width: 200,
      height: 200,
      borderRadius: 100,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#059669',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
    countButtonText: {
      color: '#FFFFFF',
      fontSize: 48,
      fontWeight: '800',
    },
    countButtonSubtext: {
      color: '#FFFFFF',
      fontSize: 14,
      opacity: 0.8,
      marginTop: 4,
    },
  });
}