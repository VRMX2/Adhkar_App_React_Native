// services/prayerTimesService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrayerTimesResponse {
  data: {
    timings: {
      Fajr: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
      Sunrise: string;
      Sunset: string;
      Midnight: string;
      Imsak: string;
    };
    date: {
      hijri: {
        date: string;
        month: {
          en: string;
          ar: string;
        };
        year: string;
        weekday: {
          en: string;
          ar: string;
        };
      };
      gregorian: {
        date: string;
        month: {
          en: string;
          number: number;
        };
        year: string;
        weekday: {
          en: string;
        };
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: {
        id: number;
        name: string;
        params: any;
      };
    };
  };
  code: number;
  status: string;
}

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  sunrise: string;
  sunset: string;
  date: string;
  hijriDate?: string;
  hijriDateArabic?: string;
  gregorianDate?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  method?: string;
}

export interface NextPrayerInfo {
  nextPrayer: string;
  timeUntilNext: string;
  nextPrayerTime: string;
  timeUntilNextMs: number;
}

interface LocationInfo {
  city?: string;
  country?: string;
  timezone?: string;
}

class PrayerTimesService {
  private readonly API_BASE_URL = 'https://api.aladhan.com/v1';
  private readonly CACHE_KEY = 'cached_prayer_times';
  private readonly CACHE_EXPIRY_KEY = 'prayer_times_cache_expiry';
  private readonly LOCATION_CACHE_KEY = 'cached_location_info';
  
  // Prayer time calculation methods
  // 1: University of Islamic Sciences, Karachi
  // 2: Islamic Society of North America (ISNA)
  // 3: Muslim World League (MWL)
  // 4: Umm al-Qura, Makkah
  // 5: Egyptian General Authority of Survey
  private readonly DEFAULT_METHOD = 2; // ISNA

  /**
   * Get prayer times for specific coordinates and date
   */
  async getPrayerTimes(
    latitude: number, 
    longitude: number, 
    date?: string,
    method: number = this.DEFAULT_METHOD
  ): Promise<PrayerTimes> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Check cache first
      const cachedData = await this.getCachedPrayerTimes(latitude, longitude, targetDate);
      if (cachedData) {
        return cachedData;
      }

      const [year, month, day] = targetDate.split('-');
      
      const response = await fetch(
        `${this.API_BASE_URL}/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=${method}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: PrayerTimesResponse = await response.json();
      
      if (data.code !== 200) {
        throw new Error(`API Error: ${data.status}`);
      }

      const prayerTimes: PrayerTimes = {
        fajr: this.formatTime(data.data.timings.Fajr),
        dhuhr: this.formatTime(data.data.timings.Dhuhr),
        asr: this.formatTime(data.data.timings.Asr),
        maghrib: this.formatTime(data.data.timings.Maghrib),
        isha: this.formatTime(data.data.timings.Isha),
        sunrise: this.formatTime(data.data.timings.Sunrise),
        sunset: this.formatTime(data.data.timings.Sunset),
        date: targetDate,
        hijriDate: `${data.data.date.hijri.date} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year} AH`,
        hijriDateArabic: `${data.data.date.hijri.date} ${data.data.date.hijri.month.ar} ${data.data.date.hijri.year} هـ`,
        gregorianDate: `${data.data.date.gregorian.date} ${data.data.date.gregorian.month.en} ${data.data.date.gregorian.year}`,
        location: {
          latitude: data.data.meta.latitude,
          longitude: data.data.meta.longitude,
        },
        method: data.data.meta.method.name,
      };

      // Cache the result
      await this.cachePrayerTimes(latitude, longitude, targetDate, prayerTimes);
      
      return prayerTimes;
      
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      
      // Return fallback prayer times if API fails
      return this.getFallbackPrayerTimes(date || new Date().toISOString().split('T')[0], latitude, longitude);
    }
  }

  /**
   * Get prayer times for a range of dates (useful for monthly view)
   */
  async getPrayerTimesRange(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    method: number = this.DEFAULT_METHOD
  ): Promise<PrayerTimes[]> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const prayerTimesArray: PrayerTimes[] = [];

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0];
        const prayerTimes = await this.getPrayerTimes(latitude, longitude, dateString, method);
        prayerTimesArray.push(prayerTimes);
      }

      return prayerTimesArray;
    } catch (error) {
      console.error('Error fetching prayer times range:', error);
      throw error;
    }
  }

  /**
   * Get current and next prayer information
   */
  getNextPrayerInfo(prayerTimes: PrayerTimes): NextPrayerInfo {
    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);

      if (prayerTime > now) {
        const diffMs = prayerTime.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        
        let timeUntilNext: string;
        if (diffHours > 0) {
          timeUntilNext = `${diffHours}h ${remainingMins}m`;
        } else if (diffMins > 0) {
          timeUntilNext = `${remainingMins}m`;
        } else {
          timeUntilNext = 'Now';
        }
        
        return {
          nextPrayer: prayer.name,
          timeUntilNext,
          nextPrayerTime: prayer.time,
          timeUntilNextMs: diffMs,
        };
      }
    }
    
    // If no prayer is left today, next prayer is Fajr tomorrow
    const fajrTomorrow = new Date();
    fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
    const [fajrHours, fajrMinutes] = prayerTimes.fajr.split(':').map(Number);
    fajrTomorrow.setHours(fajrHours, fajrMinutes, 0, 0);
    
    const diffMs = fajrTomorrow.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const remainingMs = diffMs % (60 * 60 * 1000);
    const diffMins = Math.floor(remainingMs / (60 * 1000));
    
    return {
      nextPrayer: 'Fajr',
      timeUntilNext: `${diffHours}h ${diffMins}m`,
      nextPrayerTime: prayerTimes.fajr,
      timeUntilNextMs: diffMs,
    };
  }

  /**
   * Get current prayer name (the prayer time that has passed but next hasn't started)
   */
  getCurrentPrayer(prayerTimes: PrayerTimes): string {
    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];

    let currentPrayer = 'Isha'; // Default to Isha (night time)

    for (let i = 0; i < prayers.length; i++) {
      const [hours, minutes] = prayers[i].time.split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);

      if (now >= prayerTime) {
        currentPrayer = prayers[i].name;
      } else {
        break;
      }
    }

    return currentPrayer;
  }

  /**
   * Check if it's currently prayer time (within 15 minutes of prayer start)
   */
  isCurrentlyPrayerTime(prayerTimes: PrayerTimes): { isPrayerTime: boolean; prayerName?: string } {
    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);
      
      const prayerEndTime = new Date(prayerTime);
      prayerEndTime.setMinutes(prayerEndTime.getMinutes() + 15); // 15 minute window

      if (now >= prayerTime && now <= prayerEndTime) {
        return { isPrayerTime: true, prayerName: prayer.name };
      }
    }

    return { isPrayerTime: false };
  }

  /**
   * Get Qibla direction from given coordinates
   */
  getQiblaDirection(latitude: number, longitude: number): number {
    // Kaaba coordinates
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    
    const lat1 = this.toRadians(latitude);
    const lat2 = this.toRadians(kaabaLat);
    const deltaLng = this.toRadians(kaabaLng - longitude);
    
    const x = Math.sin(deltaLng) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
    
    let qibla = this.toDegrees(Math.atan2(x, y));
    
    // Normalize to 0-360 degrees
    qibla = (qibla + 360) % 360;
    
    return Math.round(qibla);
  }

  /**
   * Get location information from coordinates (reverse geocoding)
   */
  async getLocationInfo(latitude: number, longitude: number): Promise<LocationInfo> {
    try {
      // Check cache first
      const cacheKey = `${this.LOCATION_CACHE_KEY}_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Use a free geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location info');
      }
      
      const data = await response.json();
      
      const locationInfo: LocationInfo = {
        city: data.city || data.locality || 'Unknown City',
        country: data.countryName || 'Unknown Country',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // Cache for 24 hours
      await AsyncStorage.setItem(cacheKey, JSON.stringify(locationInfo));
      
      return locationInfo;
    } catch (error) {
      console.error('Error getting location info:', error);
      return {
        city: 'Unknown City',
        country: 'Unknown Country',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
  }

  /**
   * Private helper methods
   */
  private formatTime(timeString: string): string {
    // Remove timezone info and return HH:MM format
    return timeString.split(' ')[0];
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  private async getCachedPrayerTimes(
    latitude: number, 
    longitude: number, 
    date: string
  ): Promise<PrayerTimes | null> {
    try {
      const cacheKey = `${this.CACHE_KEY}_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${date}`;
      const expiryKey = `${this.CACHE_EXPIRY_KEY}_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${date}`;
      
      const [cachedData, expiry] = await Promise.all([
        AsyncStorage.getItem(cacheKey),
        AsyncStorage.getItem(expiryKey),
      ]);

      if (cachedData && expiry) {
        const expiryTime = parseInt(expiry);
        if (Date.now() < expiryTime) {
          return JSON.parse(cachedData);
        }
      }

      return null;
    } catch (error) {
      console.error('Error reading cached prayer times:', error);
      return null;
    }
  }

  private async cachePrayerTimes(
    latitude: number,
    longitude: number,
    date: string,
    prayerTimes: PrayerTimes
  ): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY}_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${date}`;
      const expiryKey = `${this.CACHE_EXPIRY_KEY}_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${date}`;
      
      // Cache for 24 hours
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      
      await Promise.all([
        AsyncStorage.setItem(cacheKey, JSON.stringify(prayerTimes)),
        AsyncStorage.setItem(expiryKey, expiryTime.toString()),
      ]);
    } catch (error) {
      console.error('Error caching prayer times:', error);
    }
  }

  private getFallbackPrayerTimes(date: string, latitude?: number, longitude?: number): PrayerTimes {
    // Basic fallback prayer times (approximate for most locations)
    // In a real app, you might want to calculate these based on location
    const fallbackTimes = {
      fajr: '05:30',
      dhuhr: '12:15',
      asr: '15:45',
      maghrib: '18:20',
      isha: '19:45',
      sunrise: '06:45',
      sunset: '18:15',
    };

    return {
      ...fallbackTimes,
      date,
      hijriDate: '15 Sha\'ban 1445 AH',
      hijriDateArabic: '15 شعبان 1445 هـ',
      gregorianDate: new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      location: latitude && longitude ? { latitude, longitude } : undefined,
      method: 'Fallback Times',
    };
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith(this.CACHE_KEY) || 
        key.startsWith(this.CACHE_EXPIRY_KEY) ||
        key.startsWith(this.LOCATION_CACHE_KEY)
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get available calculation methods
   */
  getCalculationMethods(): Array<{ id: number; name: string; description: string }> {
    return [
      { id: 1, name: 'University of Islamic Sciences, Karachi', description: 'Used in Pakistan, Bangladesh, India, Afghanistan, parts of Europe' },
      { id: 2, name: 'Islamic Society of North America (ISNA)', description: 'Used in North America (US and Canada)' },
      { id: 3, name: 'Muslim World League (MWL)', description: 'Used in Europe, Far East, parts of America' },
      { id: 4, name: 'Umm al-Qura, Makkah', description: 'Used in Saudi Arabia' },
      { id: 5, name: 'Egyptian General Authority of Survey', description: 'Used in Africa, Syria, Lebanon, Malaysia' },
      { id: 7, name: 'Institute of Geophysics, University of Tehran', description: 'Used in Iran, some parts of Afghanistan' },
      { id: 8, name: 'Gulf Region', description: 'Used in Kuwait, Qatar, Bahrain, Oman, UAE' },
      { id: 9, name: 'Kuwait', description: 'Used in Kuwait' },
      { id: 10, name: 'Qatar', description: 'Used in Qatar' },
      { id: 11, name: 'Majlis Ugama Islam Singapura, Singapore', description: 'Used in Singapore' },
      { id: 12, name: 'Union Organization islamic de France', description: 'Used in France' },
      { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey', description: 'Used in Turkey' },
    ];
  }
}

export const prayerTimesService = new PrayerTimesService();