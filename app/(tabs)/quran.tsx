import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { Search, Play, Pause, BookOpen, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const filteredSurahs = surahs.filter(
    (surah) =>
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
    <Animated.View
      entering={SlideInRight.delay(index * 60).duration(500)}
      style={{ marginBottom: 14 }}
    >
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : ['#FFFFFF', '#F3F4F6']}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.surahCard}
      >
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
              <Pause size={22} color="#10B981" />
            ) : (
              <Play size={22} color="#10B981" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionIcon}>
            <Heart size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(600)}
        style={styles.header}
      >
        <Text style={styles.title}>📖 Holy Quran</Text>
        <Text style={styles.subtitle}>Read, listen, and reflect</Text>
      </Animated.View>

      {/* Search Input */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(600)}
        style={styles.searchContainer}
      >
        <View style={styles.searchInputContainer}>
          <Search size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search surahs..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(600)}
        style={styles.statsContainer}
      >
        <View style={styles.statItem}>
          <BookOpen size={26} color="#10B981" />
          <Text style={styles.statNumber}>114</Text>
          <Text style={styles.statLabel}>Surahs</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Heart size={26} color="#EF4444" />
          <Text style={styles.statNumber}>7</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </Animated.View>

      {/* Surah List */}
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
		backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 15,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    searchContainer: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 18,
      marginHorizontal: 20,
      padding: 18,
      marginBottom: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
    },
    statLabel: {
      fontSize: 13,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: isDark ? '#334155' : '#E5E7EB',
    },
    surahsList: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    surahCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 5,
      elevation: 3,
    },
    surahNumber: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
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
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 2,
    },
    surahArabic: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#E5E7EB' : '#374151',
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
      borderRadius: 8,
    },
  });
}
