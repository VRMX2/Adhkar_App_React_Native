import { Surah } from '@/types/quran';

class QuranService {
  private surahs: Surah[] = [
    { number: 1, name: 'Al-Fatihah', arabicName: 'الفاتحة', translation: 'The Opening', verses: 7, revelation: 'Meccan' },
    { number: 2, name: 'Al-Baqarah', arabicName: 'البقرة', translation: 'The Cow', verses: 286, revelation: 'Medinan' },
    { number: 3, name: 'Ali Imran', arabicName: 'آل عمران', translation: 'The Family of Imran', verses: 200, revelation: 'Medinan' },
    { number: 4, name: 'An-Nisa', arabicName: 'النساء', translation: 'The Women', verses: 176, revelation: 'Medinan' },
    { number: 5, name: 'Al-Maidah', arabicName: 'المائدة', translation: 'The Table', verses: 120, revelation: 'Medinan' },
    { number: 6, name: 'Al-Anam', arabicName: 'الأنعام', translation: 'The Cattle', verses: 165, revelation: 'Meccan' },
    { number: 7, name: 'Al-Araf', arabicName: 'الأعراف', translation: 'The Heights', verses: 206, revelation: 'Meccan' },
    { number: 8, name: 'Al-Anfal', arabicName: 'الأنفال', translation: 'The Spoils of War', verses: 75, revelation: 'Medinan' },
    { number: 9, name: 'At-Tawbah', arabicName: 'التوبة', translation: 'The Repentance', verses: 129, revelation: 'Medinan' },
    { number: 10, name: 'Yunus', arabicName: 'يونس', translation: 'Jonah', verses: 109, revelation: 'Meccan' },
  ];

  async getAllSurahs(): Promise<Surah[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve(this.surahs);
      }, 500);
    });
  }

  async getSurahByNumber(number: number): Promise<Surah | null> {
    return this.surahs.find(surah => surah.number === number) || null;
  }

  async searchSurahs(query: string): Promise<Surah[]> {
    return this.surahs.filter(surah =>
      surah.name.toLowerCase().includes(query.toLowerCase()) ||
      surah.arabicName.includes(query) ||
      surah.translation.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const quranService = new QuranService();