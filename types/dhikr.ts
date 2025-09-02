// types/dhikr.ts
export type DhikrCategory = 'morning' | 'evening' | 'general' | 'sleeping';

export interface Dhikr {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;
  source?: string;
  category: DhikrCategory;
  isCustom?: boolean;
  userId?: string;
  createdAt?: Date;
}

export interface DhikrProgress {
  dhikrId: string;
  currentCount: number;
  targetCount: number;
  completedAt?: Date;
  startedAt: Date;
  isCompleted: boolean;
	category: DhikrCategory;
}

export interface DhikrSession {
  id: string;
  userId: string;
  dhikrId: string;
  category: DhikrCategory;
  count: number;
  duration: number; // in seconds
  startedAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
}

export interface UserDhikrPreferences {
  favoriteCategories: DhikrCategory[];
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  enableNotifications: boolean;
  notificationTimes: {
    morning: string;
    evening: string;
  };
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

export interface DhikrStats {
  totalCount: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  streakDays: number;
  averageSessionTime: number;
  favoriteCategory: DhikrCategory;
  completionRate: number;
}