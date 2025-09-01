import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { Search, Play, Pause, BookOpen, Heart } from 'lucide-react-native';
import { quranService } from '@/services/quranService';
import { Surah } from '@/types/quran';

export default function QuranScreen() {
  const colorScheme = useColorScheme();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSurah, setCurrentSurah] = useState<number | null>(null);

  const isDark = colorScheme === 'dark';
  const styles = createStyles(isDark);

  useEffect(() => {
    loadSurahs();
  }, []);

  const loadSurahs = async () => {
    try {
      const data = await quranService.getAllSurahs();
      setSurahs(data);
    } catch (error) {
      console.error('Error loading surahs:', error);
    }
  };

  const filteredSurahs = surahs.filter(surah =>
    surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.arabicName.includes(searchQuery) ||
    surah.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePlayback = (surahNumber: number) => {
    if (currentSurah === surahNumber && isPlaying) {
      setIsPlaying(false);
      setCurrentSurah(null);
    } else {
      setIsPlaying(true);
      setCurrentSurah(surahNumber);
    }
  };

  const renderSurah = ({ item, index }: { item: Surah; index: number }) => (
    <Animated.View entering={SlideInRight.delay(index * 50).duration(600)}>
      <TouchableOpacity style={styles.surahCard} activeOpacity={0.7}>
        <View style={styles.surahNumber}>
          <Text style={styles.surahNumberText}>{item.number}</Text>
        </View>
        
        <View style={styles.surahInfo}>
          <Text style={styles.surahName}>{item.name}</Text>
          <Text style={styles.surahArabic}>{item.arabicName}</Text>
          <Text style={styles.surahTranslation}>{item.translation}</Text>
          <Text style={styles.surahDetails}>
            {item.verses} verses • {item.revelation}
          </Text>
        </View>

        <View style={styles.surahActions}>
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={() => togglePlayback(item.number)}
          >
            {currentSurah === item.number && isPlaying ? (
              <Pause size={20} color="#059669" />
            ) : (
              <Play size={20} color="#059669" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionIcon}>
            <Heart size={20} color={isDark ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <Text style={styles.title}>Holy Quran</Text>
        <Text style={styles.subtitle}>Read, listen, and reflect</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text style={styles.searchPlaceholder}>Search surahs...</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.statsContainer}>
        <View style={styles.statItem}>
          <BookOpen size={24} color="#059669" />
          <Text style={styles.statNumber}>114</Text>
          <Text style={styles.statLabel}>Surahs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Heart size={24} color="#EF4444" />
          <Text style={styles.statNumber}>7</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </Animated.View>

      <FlatList
        data={filteredSurahs}
        renderItem={renderSurah}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={styles.surahsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#111827' : '#F9FAFB',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
      alignItems: 'center',
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
      paddingHorizontal: 20,
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
    searchPlaceholder: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      marginHorizontal: 20,
      padding: 20,
      marginBottom: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      gap: 8,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
    },
    surahsList: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    surahCard: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    },
    surahNumber: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#059669',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    surahNumberText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    surahInfo: {
      flex: 1,
    },
    surahName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 2,
    },
    surahArabic: {
      fontSize: 16,
      color: isDark ? '#D1D5DB' : '#4B5563',
      marginBottom: 4,
    },
    surahTranslation: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontStyle: 'italic',
      marginBottom: 2,
    },
    surahDetails: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    surahActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionIcon: {
      padding: 8,
    },
  });
}