export interface Surah {
	number: number;
	name: string;
    arabicName: string;
    translation: string;
    verses: number;
    revelation: 'Meccan' | 'Medinan';
}

export interface Verse {
	number: number;
    arabic: string;
    translation: string;
}