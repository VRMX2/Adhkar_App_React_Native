export type DhikrCategory = 'morning' | 'evening' | 'general' | 'sleeping';

export interface Dhikr {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;
  source?: string;
  category: DhikrCategory;
}