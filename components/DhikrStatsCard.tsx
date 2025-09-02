// components/DhikrStatsCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Target, Clock, Award, Zap, Calendar } from 'lucide-react-native';
import { UserDhikrStats } from '@/services/adhkarService';

interface DhikrStatsCardProps {
  stats: UserDhikrStats;
  isDark: boolean;
}

export const DhikrStatsCard: React.FC<DhikrStatsCardProps> = ({ stats, isDark }) => {
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStreakColor = (days: number): string => {
    if (days >= 30) return '#EF4444'; // Red for 30+ days
    if (days >= 7) return '#F59E0B';  // Amber for 7+ days
    if (days >= 3) return '#059669';  // Green for 3+ days
    return '#6B7280'; // Gray for less than 3 days
  };

  const styles = createStatsStyles(isDark);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
      
      <View style={styles.statsGrid}>
        {/* Streak */}
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: getStreakColor(stats.streakDays) + '20' }]}>
            <Zap size={20} color={getStreakColor(stats.streakDays)} />
          </View>
          <Text style={styles.statNumber}>{stats.streakDays}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        {/* Total Dhikr */}
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#05966920' }]}>
            <Target size={20} color="#059669" />
          </View>
          <Text style={styles.statNumber}>{stats.totalDhikrCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Dhikr</Text>
        </View>

        {/* Time Spent */}
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#8B5CF620' }]}>
            <Clock size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.statNumber}>{formatTime(stats.totalTimeSpent)}</Text>
          <Text style={styles.statLabel}>Time Spent</Text>
        </View>

        {/* Sessions */}
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
            <Award size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statNumber}>{stats.totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
      </View>

      {/* Weekly/Monthly Goals */}
      <View style={styles.goalsSection}>
        <Text style={styles.goalsTitle}>Goals Progress</Text>
        
        {/* Weekly Goal */}
        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalLabel}>Weekly Goal</Text>
            <Text style={styles.goalProgress}>
              {Math.min(stats.totalDhikrCount % 7, stats.weeklyGoal)}/{stats.weeklyGoal}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((stats.totalDhikrCount % 7) / stats.weeklyGoal * 100, 100)}%`,
                  backgroundColor: '#059669'
                }
              ]} 
            />
          </View>
        </View>

        {/* Monthly Goal */}
        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalLabel}>Monthly Goal</Text>
            <Text style={styles.goalProgress}>
              {Math.min(stats.totalDhikrCount % 30, stats.monthlyGoal)}/{stats.monthlyGoal}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((stats.totalDhikrCount % 30) / stats.monthlyGoal * 100, 100)}%`,
                  backgroundColor: '#8B5CF6'
                }
              ]} 
            />
          </View>
        </View>
      </View>
    </View>
  );
};

function createStatsStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E5E7EB',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      alignItems: 'center',
      padding: 16,
      backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
      borderRadius: 12,
    },
    iconContainer: {
      padding: 8,
      borderRadius: 50,
      marginBottom: 8,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '800',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : '#6B7280',
      fontWeight: '600',
      textAlign: 'center',
    },
    goalsSection: {
      gap: 12,
    },
    goalsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#111827',
      marginBottom: 8,
    },
    goalItem: {
      gap: 8,
    },
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    goalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#CBD5E1' : '#4B5563',
    },
    goalProgress: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? '#F9FAFB' : '#111827',
    },
    progressBar: {
      height: 8,
      backgroundColor: isDark ? '#374151' : '#E5E7EB',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
	});
}