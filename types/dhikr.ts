export type DhikrCategory = 'morning' | 'evening' | 'general' | 'sleeping';

export interface Dhikr {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;
  source?: string;
  category: DhikrCategory;
	isCustom? : boolean;
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