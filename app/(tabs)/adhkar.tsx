import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { Search, Heart, Sun, Moon, Star, Bookmark } from 'lucide-react-native';
import { adhkarService } from '@/services/adhkarService';
import { Dhikr, DhikrCategory } from '@/types/dhikr';

export default function AdhkarScreen() {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DhikrCategory>('morning');
  const [adhkar, setAdhkar] = useState<Dhikr[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  const categories = [
    { id: 'morning' as DhikrCategory, name: 'Morning', icon: Sun, gradient: ['#F59E0B', '#FBBF24'] },
    { id: 'evening' as DhikrCategory, name: 'Evening', icon: Moon, gradient: ['#8B5CF6', '#A78BFA'] },
    { id: 'general' as DhikrCategory, name: 'General', icon: Star, gradient: ['#059669', '#10B981'] },
    { id: 'sleeping' as DhikrCategory, name: 'Sleep', icon: Moon, gradient: ['#6366F1', '#818CF8'] },
  ];

  useEffect(() => {
    loadAdhkar();
    loadFavorites();
  }, [selectedCategory]);

  const loadAdhkar = async () => {
    try {
      const data = await adhkarService.getAdhkarByCategory(selectedCategory);
      setAdhkar(data);
    } catch (error) {
      console.error('Error loading adhkar:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const favs = await adhkarService.getFavorites();
      setFavorites(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (dhikrId: string) => {
    try {
      if (favorites.includes(dhikrId)) {
        await adhkarService.removeFavorite(dhikrId);
        setFavorites(favorites.filter(id => id !== dhikrId));
      } else {
        await adhkarService.addFavorite(dhikrId);
        setFavorites([...favorites, dhikrId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredAdhkar = adhkar.filter(dhikr =>
    dhikr.arabic.includes(searchQuery) ||
    dhikr.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dhikr.transliteration.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.title}>✨ Adhkar & Duas</Text>
          <Text style={styles.subtitle}>Daily remembrance of Allah</Text>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.searchContainer}>
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
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category, index) => (
              <Animated.View
                key={category.id}
                entering={SlideInRight.delay(600 + index * 100).duration(600)}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.selectedCategoryCard,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                  activeOpacity={0.85}
                >
                  <View style={[
                    styles.categoryIconWrapper,
                    { backgroundColor: selectedCategory === category.id ? category.gradient[0] : isDark ? '#1F2937' : '#F3F4F6' }
                  ]}>
                    <category.icon
                      size={22}
                      color={selectedCategory === category.id ? '#FFFFFF' : category.gradient[0]}
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={[
                    styles.categoryName,
                    selectedCategory === category.id && styles.selectedCategoryText,
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Adhkar List */}
        <View style={styles.adhkarList}>
          {filteredAdhkar.map((dhikr, index) => (
            <Animated.View
              key={dhikr.id}
              entering={FadeInDown.delay(800 + index * 100).duration(600)}
            >
              <View style={styles.dhikrCard}>
                {/* Header */}
                <View style={styles.dhikrHeader}>
                  <Text style={styles.dhikrCount}>
                    {dhikr.count} {dhikr.count === 1 ? 'time' : 'times'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(dhikr.id)}
                    style={styles.favoriteButton}
                  >
                    <Heart
                      size={20}
                      color={favorites.includes(dhikr.id) ? '#EF4444' : (isDark ? '#6B7280' : '#9CA3AF')}
                      fill={favorites.includes(dhikr.id) ? '#EF4444' : 'transparent'}
                    />
                  </TouchableOpacity>
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
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
	container: {
      fontFamily: 'PlusJakartaSans-SemiBold',
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      paddingTop: 20,
      paddingBottom: 20,
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
    favoriteButton: {
      padding: 6,
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
