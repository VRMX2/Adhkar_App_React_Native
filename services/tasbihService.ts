import AsyncStorage from '@react-native-async-storage/async-storage';

interface TasbihSession {
  dhikr: string;
  count: number;
  target: number;
  date: string;
}

class TasbihService {
  private sessionsKey = 'islamic_app_tasbih_sessions';
  private dailyCountKey = 'islamic_app_daily_count';

  async saveSession(session: TasbihSession): Promise<void> {
    try {
      const existing = await this.getSessions();
      existing.push(session);
      await AsyncStorage.setItem(this.sessionsKey, JSON.stringify(existing));
    } catch (error) {
      console.error('Error saving tasbih session:', error);
    }
  }

  async getSessions(): Promise<TasbihSession[]> {
    try {
      const stored = await AsyncStorage.getItem(this.sessionsKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting tasbih sessions:', error);
      return [];
    }
  }

  async getDailyCount(): Promise<number> {
    try {
      const today = new Date().toDateString();
      const stored = await AsyncStorage.getItem(`${this.dailyCountKey}_${today}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.error('Error getting daily count:', error);
      return 0;
    }
  }

  async incrementDailyCount(): Promise<void> {
    try {
      const today = new Date().toDateString();
      const key = `${this.dailyCountKey}_${today}`;
      const current = await this.getDailyCount();
      await AsyncStorage.setItem(key, (current + 1).toString());
    } catch (error) {
      console.error('Error incrementing daily count:', error);
    }
  }

  async getWeeklyStats(): Promise<{ date: string; count: number }[]> {
    try {
      const stats = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        const key = `${this.dailyCountKey}_${dateString}`;
        const stored = await AsyncStorage.getItem(key);
        const count = stored ? parseInt(stored, 10) : 0;
        stats.push({
          date: dateString,
          count,
        });
      }
      return stats;
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return [];
    }
  }
}

export const tasbihService = new TasbihService();