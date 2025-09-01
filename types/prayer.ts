export interface PrayerTimes {
	fajr: string;
	sunrise: string;
	dhuhr: string;
	asr: string;
    maghrib: string;
    isha: string;
}

export interface PrayerNotification {
	id: string;
	prayer: string;
	time: string;
    enabled:boolean;
}
