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
    { id: 'morning' as DhikrCategory, name: 'Morning', icon: Sun, color: '#F59E0B' },
    { id: 'evening' as DhikrCategory, name: 'Evening', icon: Moon, color: '#8B5CF6' },
    { id: 'general' as DhikrCategory, name: 'General', icon: Star, color: '#059669' },
    { id: 'sleeping' as DhikrCategory, name: 'Sleep', icon: Moon, color: '#6366F1' },
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
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text style={styles.title}>Adhkar & Duas</Text>
          <Text style={styles.subtitle}>Daily remembrance of Allah</Text>
        </Animated.View>

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
                  activeOpacity={0.7}
                >
                  <category.icon
                    size={24}
                    color={selectedCategory === category.id ? '#FFFFFF' : category.color}
                    strokeWidth={2}
                  />
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

        <View style={styles.adhkarList}>
          {filteredAdhkar.map((dhikr, index) => (
            <Animated.View
              key={dhikr.id}
              entering={FadeInDown.delay(800 + index * 100).duration(600)}
            >
              <View style={styles.dhikrCard}>
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
                
                <Text style={styles.arabicText}>{dhikr.arabic}</Text>
                <Text style={styles.transliteration}>{dhikr.transliteration}</Text>
                <Text style={styles.translation}>{dhikr.translation}</Text>
                
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
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
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
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    searchContainer: {
      marginBottom: 20,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    categoriesContainer: {
      marginBottom: 30,
    },
    categoriesContent: {
      paddingRight: 20,
      gap: 12,
    },
    categoryCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 16,
      alignItems: 'center',
      gap: 8,
      minWidth: 100,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    selectedCategoryCard: {
      backgroundColor: '#059669',
      borderColor: '#047857',
    },
    categoryName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    selectedCategoryText: {
      color: '#FFFFFF',
    },
    adhkarList: {
      gap: 20,
      paddingBottom: 30,
    },
    dhikrCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    dhikrHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    dhikrCount: {
      fontSize: 14,
      fontWeight: '600',
      color: '#059669',
      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    favoriteButton: {
      padding: 4,
    },
    arabicText: {
      fontSize: 24,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      textAlign: 'right',
      lineHeight: 40,
      marginBottom: 12,
    },
    transliteration: {
      fontSize: 16,
      fontStyle: 'italic',
      color: isDark ? '#D1D5DB' : '#4B5563',
      marginBottom: 8,
    },
    translation: {
      fontSize: 16,
      color: isDark ? '#D1D5DB' : '#4B5563',
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
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontStyle: 'italic',
    },
  });
}