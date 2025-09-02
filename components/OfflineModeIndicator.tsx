import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WifiOff, Wifi } from 'lucide-react-native';
import { firebaseAdhkarService } from '@/services/adhkarService';

interface OfflineModeIndicatorProps {
  isDark: boolean;
}

export const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({ isDark }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    checkOfflineMode();
  }, []);

  const checkOfflineMode = async () => {
    // In a real app, you would check network connectivity here
    // For now, we'll check the offline mode setting
    const offlineMode = await firebaseAdhkarService.isOfflineMode();
    setIsOffline(offlineMode);
  };

  const toggleOfflineMode = async () => {
    try {
      await firebaseAdhkarService.setOfflineMode(!isOffline);
      setIsOffline(!isOffline);
      
      if (!isOffline) {
        // Going online - sync data
        await firebaseAdhkarService.syncOfflineData();
      }
    } catch (error) {
      console.error('Error toggling offline mode:', error);
    }
  };

  if (!isOffline) return null;

  const styles = createOfflineStyles(isDark);

  return (
    <TouchableOpacity style={styles.container} onPress={toggleOfflineMode}>
      <WifiOff size={16} color="#EF4444" />
      <Text style={styles.text}>Offline Mode</Text>
      <Text style={styles.subtext}>Tap to sync</Text>
    </TouchableOpacity>
  );
};

function createOfflineStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1F2937' : '#FEF2F2',
      borderColor: '#EF4444',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 16,
      gap: 8,
    },
    text: {
      fontSize: 14,
      fontWeight: '600',
      color: '#EF4444',
      flex: 1,
    },
    subtext: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
  });
}