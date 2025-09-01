import * as Location from 'expo-location';
import { PrayerTimes } from '@/types/prayer';

class PrayerService {
  private baseUrl = 'https://api.aladhan.com/v1';

  async getCurrentLocation(): Promise<string> {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return 'Location permission denied';
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Reverse geocoding to get city name
      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const { city, region, country } = geocode[0];
        return `${city}, ${region || country}`;
      }
      
      return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    } catch (error) {
      console.error('Error getting location:', error);
      return 'Mecca, Saudi Arabia'; // Default location
    }
  }

  async getTodaysPrayerTimes(): Promise<PrayerTimes> {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return this.getDefaultPrayerTimes();
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      const today = new Date();
      const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      
      const response = await fetch(
        `${this.baseUrl}/timings/${dateString}?latitude=${latitude}&longitude=${longitude}&method=2`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch prayer times');
      }
      
      const data = await response.json();
      const timings = data.data.timings;
      
      return {
        fajr: timings.Fajr,
        sunrise: timings.Sunrise,
        dhuhr: timings.Dhuhr,
        asr: timings.Asr,
        maghrib: timings.Maghrib,
        isha: timings.Isha,
      };
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      return this.getDefaultPrayerTimes();
    }
  }

  private getDefaultPrayerTimes(): PrayerTimes {
    return {
      fajr: '05:30',
      sunrise: '06:45',
      dhuhr: '12:15',
      asr: '15:30',
      maghrib: '18:00',
      isha: '19:30',
    };
  }

  async scheduleAdhanNotifications(prayerTimes: PrayerTimes): Promise<void> {
    // Implementation for scheduling prayer notifications
    // This would use expo-notifications to schedule local notifications
    console.log('Scheduling adhan notifications for:', prayerTimes);
  }
}

export const prayerService = new PrayerService();