import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { Dhikr, DhikrCategory } from '@/types/dhikr';

export interface UserDhikrProgress {
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
  completedAt: Date;
  isCompleted: boolean;
}

export interface UserDhikrStats {
  totalSessions: number;
  totalDhikrCount: number;
  totalTimeSpent: number; // in minutes
  streakDays: number;
  lastActiveDate: Date;
  favoriteCategories: DhikrCategory[];
  weeklyGoal: number;
  monthlyGoal: number;
  categoriesCompleted: {
    [key in DhikrCategory]: number;
  };
}

class FirebaseAdhkarService {
  private storageKey = 'islamic_app_adhkar';
  private favoritesKey = 'islamic_app_favorites';
  private offlineModeKey = 'islamic_app_offline_mode';

  private defaultAdhkar: Record<DhikrCategory, Dhikr[]> = {
    morning: [
      {
        id: 'morning_1',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لا إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
        transliteration: 'Asbahnaa wa asbaha al-mulku lillaahi walhamdu lillaah, laa ilaaha illa Allaahu wahdahu laa shareeka lah, lahu al-mulku wa lahu al-hamdu wa huwa ala kulli shay-in qadeer. Rabbi as-aluka khayra maa fee haadha al-yawmi wa khayra maa ba\'dah, wa a\'oodhu bika min sharri maa fee haadha al-yawmi wa sharri maa ba\'dah. Rabbi a\'oodhu bika min al-kasali wa soo-i al-kibar. Rabbi a\'oodhu bika min \'adhabin fi an-naari wa \'adhabin fi al-qabr.',
        translation: 'We have reached the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this day and the good of what follows it and I take refuge in You from the evil of this day and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.',
        count: 1,
        source: 'Muslim',
        category: 'morning',
      },
      {
        id: 'morning_2',
        arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
        transliteration: 'Allaahumma bika asbahnaa wa bika amsaynaa wa bika nahyaa wa bika namootu wa ilayka an-nushoor',
        translation: 'O Allah, by Your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection.',
        count: 1,
        source: 'Abu Dawud, Tirmidhi',
        category: 'morning',
      },
      {
        id: 'morning_3',
        arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ',
        transliteration: 'Allaahumma anta rabbee laa ilaaha illa anta, khalaqtanee wa ana \'abduka, wa ana \'ala \'ahdika wa wa\'dika mastata\'tu, aboo-u laka bini\'matika, wa aboo-u laka bidhanbee, faghfir lee, fa-innahu laa yaghfir adh-dhunooba illa anta, a\'oodhu bika min sharri maa sana\'tu',
        translation: 'O Allah, You are my Lord! None has the right to be worshipped but You. You created me and I am Your slave, and I am faithful to my covenant and my promise as much as I can. I seek refuge with You from all the evil I have done. I acknowledge before You all the blessings You have bestowed upon me, and I confess to You all my sins. So I entreat You to forgive my sins, for nobody can forgive sins except You. I seek refuge with You from the evil of what I have done.',
        count: 1,
        source: 'Bukhari 6323',
        category: 'morning',
      },
      {
        id: 'morning_4',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ وَرِضَا نَفْسِهِ وَزِنَةَ عَرْشِهِ وَمِدَادَ كَلِمَاتِهِ',
        transliteration: 'Subhaan-Allaahi wa bihamdihi \'adada khalqihi wa ridaa nafsihi wa zinata \'arshihi wa midaada kalimaatihi',
        translation: 'How perfect Allah is and I praise Him by the number of His creation and His pleasure, and by the weight of His throne, and the ink of His words.',
        count: 3,
        source: 'Muslim 2726',
        category: 'morning',
      },
      {
        id: 'morning_5',
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        transliteration: 'A\'oodhu bikalimaati-llahi at-taammaati min sharri maa khalaq',
        translation: 'I take refuge in Allah\'s perfect words from the evil He has created.',
        count: 3,
        source: 'Muslim 2708',
        category: 'morning',
      },
      {
        id: 'morning_6',
        arabic: 'لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ',
        transliteration: 'Laa ilaaha illa-llaahu wahdahu laa shareeka lahu, lahu al-mulku wa lahu al-hamdu, wa huwa \'ala kulli shay-in qadeer',
        translation: 'None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise and He is over all things omnipotent.',
        count: 10,
        source: 'Muslim 2693',
        category: 'morning',
      },
      {
        id: 'morning_7',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'Subhaan-Allaahi wa bihamdihi',
        translation: 'How perfect Allah is and I praise Him.',
        count: 100,
        source: 'Bukhari 6405',
        category: 'morning',
      },
      {
        id: 'morning_8',
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
        transliteration: 'Qul huwa Allaahu ahad, Allaahu as-samad, lam yalid wa lam yoolad, wa lam yakun lahu kufuwan ahad',
        translation: 'Say: He is Allah, [who is] One, Allah, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent.',
        count: 3,
        source: 'Surah Al-Ikhlas (112)',
        category: 'morning',
      },
      {
        id: 'morning_9',
        arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِن شَرِّ مَا خَلَقَ، وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
        transliteration: 'Qul a\'oodhu birabbi al-falaq, min sharri maa khalaq, wa min sharri ghaasiqin idhaa waqab, wa min sharri an-naffaathaati fi al-\'uqad, wa min sharri haasidin idhaa hasad',
        translation: 'Say: I seek refuge in the Lord of daybreak, From the evil of that which He created, And from the evil of darkness when it settles, And from the evil of the blowers in knots, And from the evil of an envier when he envies.',
        count: 3,
        source: 'Surah Al-Falaq (113)',
        category: 'morning',
      },
      {
        id: 'morning_10',
        arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَهِ النَّاسِ، مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَ النَّاسِ',
        transliteration: 'Qul a\'oodhu birabbi an-naas, maliki an-naas, ilahi an-naas, min sharri al-waswaasi al-khannaas, alladhee yuwaswisu fee sudoori an-naas, min al-jinnati wa an-naas',
        translation: 'Say: I seek refuge in the Lord of mankind, The Sovereign of mankind, The God of mankind, From the evil of the retreating whisperer, Who whispers [evil] into the breasts of mankind, From among the jinn and mankind.',
        count: 3,
        source: 'Surah An-Nas (114)',
        category: 'morning',
      },
      {
        id: 'morning_11',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        transliteration: 'Bismillaahil-lathee laa yadhurru ma\'as-mihi shay-un fil-ardi wa laa fis-samaa-i wa Huwas-Samee\'ul-\'Aleem',
        translation: 'In the name of Allah with whose name nothing is harmed on earth nor in the heavens and He is the All-Hearing, the All-Knowing.',
        count: 3,
        source: 'Abu Dawud, Tirmidhi',
        category: 'morning',
      },
      {
        id: 'morning_12',
        arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلاَمِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
        transliteration: 'Radeetu billaahi Rabban, wa bil-Islaami deenan, wa bi-Muhammadin sallallaahu \'alayhi wa sallama Nabiyyan',
        translation: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace and blessings of Allah be upon him) as my Prophet.',
        count: 3,
        source: 'Abu Dawud, Tirmidhi',
        category: 'morning',
      },
      {
        id: 'morning_13',
        arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
        transliteration: 'Yaa Hayyu yaa Qayyoomu birahmatika astagheeth, aslih lee sha\'nee kullahoo wa laa takilnee ilaa nafsee tarfata \'ayn',
        translation: 'O Ever Living, O Self-Subsisting and Supporter of all, by Your mercy I seek assistance, rectify for me all of my affairs and do not leave me to myself, even for the blink of an eye.',
        count: 1,
        source: 'Al-Hakim',
        category: 'morning',
      },
      {
        id: 'morning_14',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ: فَتْحَهُ، وَنَصْرَهُ، وَنُورَهُ، وَبَرَكَتَهُ، وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ',
        transliteration: 'Asbahnaa wa asbahal-mulku lillaahi Rabbil-\'aalameen. Allaahumma innee as\'aluka khayra haathal-yawm: fat-hahu, wa nas-rahu, wa noorahu, wa barakatahu, wa hudaahu, wa a\'oodhu bika min sharri maa feehi wa sharri maa ba\'dah',
        translation: 'We have reached the morning and at this very time all sovereignty belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of this day, its triumphs, its victories, its light, its blessings, and its guidance, and I take refuge in You from the evil of this day and the evil that follows it.',
        count: 1,
        source: 'Abu Dawud',
        category: 'morning',
      },
      {
        id: 'morning_15',
        arabic: 'أَصْبَحْنَا عَلَى فِطْرَةِ الإِسْلاَمِ، وَعَلَى كَلِمَةِ الإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ',
        transliteration: 'Asbahnaa \'ala fitratil-Islaam, wa \'ala kalimatil-ikhlaas, wa \'ala deeni Nabiyyinaa Muhammadin sallallaahu \'alayhi wa sallam, wa \'ala millati abeenaa Ibraaheema haneefan musliman wa maa kaana minal-mushrikeen',
        translation: 'We have awakened upon the natural religion of Islam, and upon the word of sincerity, and upon the religion of our Prophet Muhammad (peace and blessings of Allah be upon him), and upon the religion of our father Ibrahim, who was a Muslim and was not of the polytheists.',
        count: 1,
        source: 'Ahmad',
        category: 'morning',
      },
      {
        id: 'morning_16',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'Subhaan-Allaahi wa bihamdihi',
        translation: 'How perfect Allah is and I praise Him.',
        count: 100,
        source: 'Muslim',
        category: 'morning',
      },
      {
        id: 'morning_17',
        arabic: 'لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: 'Laa ilaaha illallaahu wahdahu laa shareeka lah, lahu al-mulku wa lahu al-hamdu wa huwa \'ala kulli shay-in qadeer',
        translation: 'None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise and He is over all things omnipotent.',
        count: 100,
        source: 'Bukhari, Muslim',
        category: 'morning',
      },
      {
        id: 'morning_18',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلاً مُتَقَبَّلاً',
        transliteration: 'Allaahumma innee as\'aluka \'ilman naafi\'an, wa rizqan tayyiban, wa \'amalan mutaqabbalan',
        translation: 'O Allah, I ask You for knowledge that is of benefit, a good provision, and deeds that will be accepted.',
        count: 1,
        source: 'Ibn Majah',
        category: 'morning',
      },
      {
        id: 'morning_19',
        arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لاَ إِلَهَ إِلاَّ أَنْتَ',
        transliteration: 'Allaahumma \'aafinee fee badanee, Allaahumma \'aafinee fee sam\'ee, Allaahumma \'aafinee fee basaree, laa ilaaha illa anta',
        translation: 'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. There is no god but You.',
        count: 3,
        source: 'Abu Dawud',
        category: 'morning',
      },
      {
        id: 'morning_20',
        arabic: 'حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
        transliteration: 'Hasbiyallaahu laa ilaaha illa Huwa, \'alayhi tawakkaltu wa Huwa Rabbul-\'Arshil-\'Azeem',
        translation: 'Allah is sufficient for me. There is no god but Him. I have placed my trust in Him, and He is the Lord of the Mighty Throne.',
        count: 7,
        source: 'Abu Dawud',
        category: 'morning',
      },
    ],

    evening: [
      {
        id: 'evening_1',
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
        transliteration: 'Amsaynaa wa amsaa al-mulku lillaah, walhamdu lillaah, laa ilaaha illa Allaahu wahdahu laa shareeka lah, lahu al-mulku wa lahu al-hamdu wa huwa \'ala kulli shay-in qadeer. Rabbi as-aluka khayra maa fee hadhihi al-laylati wa khayra maa ba\'dahaa, wa a\'oodhu bika min sharri maa fee hadhihi al-laylati wa sharri maa ba\'dahaa. Rabbi a\'oodhu bika min al-kasali wa soo-i al-kibar. Rabbi a\'oodhu bika min \'adhabin fi an-naari wa \'adhabin fi al-qabr.',
        translation: 'We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this night and the good of what follows it and I take refuge in You from the evil of this night and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.',
        count: 1,
        source: 'Muslim 2723',
        category: 'evening',
      },
      {
        id: 'evening_2',
        arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ',
        transliteration: 'Allaahumma bika amsaynaa wa bika asbahnaa wa bika nahyaa wa bika namootu wa ilayka al-maseer',
        translation: 'O Allah, by Your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is the final return.',
        count: 1,
        source: 'Abu Dawud, Tirmidhi',
        category: 'evening',
      },
      {
        id: 'evening_3',
        arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ، وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ',
        transliteration: 'Allaahumma anta rabbee laa ilaaha illa anta, khalaqtanee wa ana \'abduka, wa ana \'ala \'ahdika wa wa\'dika mastata\'tu, aboo-u laka bini\'matika, wa aboo-u laka bidhanbee, faghfir lee, fa-innahu laa yaghfir adh-dhunooba illa anta, a\'oodhu bika min sharri maa sana\'tu',
        translation: 'O Allah, You are my Lord! None has the right to be worshipped but You. You created me and I am Your slave, and I am faithful to my covenant and my promise as much as I can. I seek refuge with You from all the evil I have done. I acknowledge before You all the blessings You have bestowed upon me, and I confess to You all my sins. So I entreat You to forgive my sins, for nobody can forgive sins except You. I seek refuge with You from the evil of what I have done.',
        count: 1,
        source: 'Bukhari 6323',
        category: 'evening',
      },
      {
        id: 'evening_4',
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        transliteration: 'A\'oodhu bikalimaati-llahi at-taammaati min sharri maa khalaq',
        translation: 'I take refuge in Allah\'s perfect words from the evil He has created.',
        count: 3,
        source: 'Muslim 2708',
        category: 'evening',
      },
      {
        id: 'evening_5',
        arabic: 'لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ',
        transliteration: 'Laa ilaaha illa-llaahu wahdahu laa shareeka lahu, lahu al-mulku wa lahu al-hamdu, wa huwa \'ala kulli shay-in qadeer',
        translation: 'None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise and He is over all things omnipotent.',
        count: 10,
        source: 'Muslim 2693',
        category: 'evening',
      },
      {
        id: 'evening_6',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْdِهِ',
        transliteration: 'Subhaan-Allaahi wa bihamdihi',
        translation: 'How perfect Allah is and I praise Him.',
        count: 100,
        source: 'Bukhari 6405',
        category: 'evening',
      },
      {
        id: 'evening_7',
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
        transliteration: 'Qul huwa Allaahu ahad, Allaahu as-samad, lam yalid wa lam yoolad, wa lam yakun lahu kufuwan ahad',
        translation: 'Say: He is Allah, [who is] One, Allah, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent.',
        count: 3,
        source: 'Surah Al-Ikhlas (112)',
        category: 'evening',
      },
      {
        id: 'evening_8',
        arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِن شَرِّ مَا خَلَقَ، وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
        transliteration: 'Qul a\'oodhu birabbi al-falaq, min sharri maa khalaq, wa min sharri ghaasiqin idhaa waqab, wa min sharri an-naffaathaati fi al-\'uqad, wa min sharri haasidin idhaa hasad',
        translation: 'Say: I seek refuge in the Lord of daybreak, From the evil of that which He created, And from the evil of darkness when it settles, And from the evil of the blowers in knots, And from the evil of an envier when he envies.',
        count: 3,
        source: 'Surah Al-Falaq (113)',
        category: 'evening',
      },
      {
        id: 'evening_9',
        arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ، mَلِكِ النَّاسِ، إِلَهِ النَّاسِ، مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُdُورِ النَّاسِ، مِنَ الْجِنَّةِ وَ النَّاسِ',
        transliteration: 'Qul a\'oodhu birabbi an-naas, maliki an-naas, ilahi an-naas, min sharri al-waswaasi al-khannaas, alladhee yuwaswisu fee sudoori an-naas, min al-jinnati wa an-naas',
        translation: 'Say: I seek refuge in the Lord of mankind, The Sovereign of mankind, The God of mankind, From the evil of the retreating whisperer, Who whispers [evil] into the breasts of mankind, From among the jinn and mankind.',
        count: 3,
        source: 'Surah An-Nas (114)',
        category: 'evening',
      },
      {
        id: 'evening_10',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّmِيعُ الْعَلِيمُ',
        transliteration: 'Bismillaahil-lathee laa yadhurru ma\'as-mihi shay-un fil-ardi wa laa fis-samaa-i wa Huwas-Samee\'ul-\'Aleem',
        translation: 'In the name of Allah with whose name nothing is harmed on earth nor in the heavens and He is the All-Hearing, the All-Knowing.',
        count: 3,
        source: 'Abu Dawud, Tirmidhi',
        category: 'evening',
      },
      {
        id: 'evening_11',
        arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلاَمِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
        transliteration: 'Radeetu billaahi Rabban, wa bil-Islaami deenan, wa bi-Muhammadin sallallaahu \'alayhi wa sallama Nabiyyan',
        translation: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace and blessings of Allah be upon him) as my Prophet.',
        count: 3,
        source: 'Abu Dawud, Tirmidhi',
        category: 'evening',
      },
      {
        id: 'evening_12',
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذِهِ اللَّيْلَةِ: فَتْحَهَا، وَنَصْرَهَا، وَنُورَهَا، وَبَرَكَتَهَا، وَهُدَاهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهَا وَشَرِّ مَا بَعْدَهَا',
        transliteration: 'Amsaynaa wa amsal-mulku lillaahi Rabbil-\'aalameen. Allaahumma innee as\'aluka khayra haathihil-laylah: fat-hahaa, wa nas-rahaa, wa noorahaa, wa barakatahaa, wa hudaahaa, wa a\'oodhu bika min sharri maa feehaa wa sharri maa ba\'dahaa',
        translation: 'We have reached the evening and at this very time all sovereignty belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of this night, its triumphs, its victories, its light, its blessings, and its guidance, and I take refuge in You from the evil of this night and the evil that follows it.',
        count: 1,
        source: 'Abu Dawud',
        category: 'evening',
      },
      {
        id: 'evening_13',
        arabic: 'أَمْسَيْنَا عَلَى فِطْرَةِ الإِسْلاَمِ، وَعَلَى كَلِمَةِ الإِخْلاَصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ',
        transliteration: 'Amsaynaa \'ala fitratil-Islaam, wa \'ala kalimatil-ikhlaas, wa \'ala deeni Nabiyyinaa Muhammadin sallallaahu \'alayhi wa sallam, wa \'ala millati abeenaa Ibraaheema haneefan musliman wa maa kaana minal-mushrikeen',
        translation: 'We have reached the evening upon the natural religion of Islam, and upon the word of sincerity, and upon the religion of our Prophet Muhammad (peace and blessings of Allah be upon him), and upon the religion of our father Ibrahim, who was a Muslim and was not of the polytheists.',
        count: 1,
        source: 'Ahmad',
        category: 'evening',
      },
      {
        id: 'evening_14',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلاً مُتَقَبَّلاً',
        transliteration: 'Allaahumma innee as\'aluka \'ilman naafi\'an, wa rizqan tayyiban, wa \'amalan mutaqabbalan',
        translation: 'O Allah, I ask You for knowledge that is of benefit, a good provision, and deeds that will be accepted.',
        count: 1,
        source: 'Ibn Majah',
        category: 'evening',
      },
      {
        id: 'evening_15',
        arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لاَ إِلَهَ إِلاَّ أَنْتَ',
        transliteration: 'Allaahumma \'aafinee fee badanee, Allaahumma \'aafinee fee sam\'ee, Allaahumma \'aafinee fee basaree, laa ilaaha illa anta',
        translation: 'O Allah, grant me health in my body. O Allah, grant me health in my hearing. O Allah, grant me health in my sight. There is no god but You.',
        count: 3,
        source: 'Abu Dawud',
        category: 'evening',
      },
      {
        id: 'evening_16',
        arabic: 'حَسْبِيَ اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
        transliteration: 'Hasbiyallaahu laa ilaaha illa Huwa, \'alayhi tawakkaltu wa Huwa Rabbul-\'Arshil-\'Azeem',
        translation: 'Allah is sufficient for me. There is no god but Him. I have placed my trust in Him, and He is the Lord of the Mighty Throne.',
        count: 7,
        source: 'Abu Dawud',
        category: 'evening',
      },
      {
        id: 'evening_17',
        arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
        transliteration: 'Allaahumma innee a\'oodhu bika minal-hammi wal-hazan, wa a\'oodhu bika minal-\'ajzi wal-kasal, wa a\'oodhu bika minal-jubni wal-bukhl, wa a\'oodhu bika min ghalabatid-dayni wa qahrir-rijaal',
        translation: 'O Allah, I take refuge in You from anxiety and grief, and I take refuge in You from weakness and laziness, and I take refuge in You from cowardice and miserliness, and I take refuge in You from being overcome by debt and overpowered by men.',
        count: 1,
        source: 'Abu Dawud',
        category: 'evening',
      },
      {
        id: 'evening_18',
        arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
        transliteration: 'Allaahumma bika amsaynaa, wa bika asbahnaa, wa bika nahyaa, wa bika namootu, wa ilaykan-nushoor',
        translation: 'O Allah, by Your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is our resurrection.',
        count: 1,
        source: 'Tirmidhi',
        category: 'evening',
      },
      {
        id: 'evening_19',
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'Subhaan-Allaah',
        translation: 'How perfect Allah is.',
        count: 33,
        source: 'Muslim',
        category: 'evening',
      },
      {
        id: 'evening_20',
        arabic: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Al-hamdu lillaah',
        translation: 'All praise is for Allah.',
        count: 33,
        source: 'Muslim',
        category: 'evening',
      },
      {
        id: 'evening_21',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allaahu Akbar',
        translation: 'Allah is the greatest.',
        count: 34,
        source: 'Muslim',
        category: 'evening',
      },
    ],

    sleeping: [
      {
        id: 'sleeping_1',
        arabic: 'اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَّهُ mَا فِي السَّمَاوَاتِ وَمَا فِي الأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاء وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالأَرْضَ وَلاَ يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
        transliteration: 'Allaahu laa ilaaha illa huwa al-hayyu al-qayyoom, laa ta-khuzuhu sinatun wa laa nawm, lahu maa fi as-samaawaati wa maa fi al-ard, man dhaa alladhee yashfa\'u \'indahu illa bi-idhnih, ya\'lamu maa bayna aydeehim wa maa khalfahum, wa laa yuheetoona bi-shay-in min \'ilmihi illa bimaa shaa-a, wasi\'a kursiyyuhu as-samaawaati wa al-ard, wa laa ya-ooduhu hifzuhumaa wa huwa al-\'aliyyu al-\'azeem',
        translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.',
        count: 1,
        source: 'Ayat al-Kursi - Bukhari 3275',
        category: 'sleeping',
      },
      {
        id: 'sleeping_2',
        arabic: 'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّbِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللّهِ وَمَلآئِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لاَ نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ وَقَالُواْ سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ. لاَ يُكَلِّفُ اللّهُ نَفْسًا إِلاَّ وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا mَا اكْتَسَبَتْ رَبَّنَا لاَ تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلاَ تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلاَ تُحَمِّلْنَا mَا لاَ طَاقَةَ لَنَا بِهِ وَاعْfُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنتَ مَوْلاَنَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
        transliteration: 'Aamana ar-rasoolu bimaa unzila ilayhi min rabbihi wal-mu\'minoona kullun aamana billaahi wa malaa\'ikatihi wa kutubihi wa rusulihi laa nufarriqu bayna ahadin min rusulihi wa qaaloo sami\'naa wa ata\'naa ghufraanaka rabbanaa wa ilayka al-maseer. Laa yukallifu Allaahu nafsan illaa wus\'ahaa lahaa maa kasabat wa \'alayhaa mak-tasabat rabbanaa laa tu\'aakhidhnaa in naseenaa aw akhta\'naa rabbanaa wa laa tahmil \'alaynaa isran kamaa hamaltahu \'alal-ladheena min qablinaa rabbanaa wa laa tuhammilnaa maa laa taaqata lanaa bihi wa\'fu \'annaa waghfir lanaa warhamnaa anta mawlaanaa fansurnaa \'alal-qawmil-kaafireen',
        translation: 'The Messenger has believed in what was revealed to him from his Lord, and [so have] the believers. All of them have believed in Allah and His angels and His books and His messengers, [saying], "We make no distinction between any of His messengers." And they say, "We hear and we obey. [We seek] Your forgiveness, our Lord, and to You is the [final] destination." Allah does not charge a soul except [with that within] its capacity. It will have [the consequence of] what [good] it has gained, and it will bear [the consequence of] what [evil] it has earned. "Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people."',
        count: 1,
        source: 'Last two verses of Al-Baqarah - Bukhari 4008',
        category: 'sleeping',
      },
      {
        id: 'sleeping_3',
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِdْ وَلَمْ يُولَدْ، وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
        transliteration: 'Qul huwa Allaahu ahad, Allaahu as-samad, lam yalid wa lam yoolad, wa lam yakun lahu kufuwan ahad',
        translation: 'Say: He is Allah, [who is] One, Allah, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent.',
        count: 3,
        source: 'Surah Al-Ikhlas (112) - Bukhari 5017',
        category: 'sleeping',
      },
      {
        id: 'sleeping_4',
        arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِن شَرِّ مَا خَلَقَ، وَmِن شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
        transliteration: 'Qul a\'oodhu birabbi al-falaq, min sharri maa khalaq, wa min sharri ghaasiqin idhaa waqab, wa min sharri an-naffaathaati fi al-\'uqad, wa min sharri haasidin idhaa hasad',
        translation: 'Say: I seek refuge in the Lord of daybreak, From the evil of that which He created, And from the evil of darkness when it settles, And from the evil of the blowers in knots, And from the evil of an envier when he envies.',
        count: 3,
        source: 'Surah Al-Falaq (113) - Bukhari 5017',
        category: 'sleeping',
      },
      {
        id: 'sleeping_5',
        arabic: 'قُلْ أَعُOذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَهِ النَّاسِ، مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَ النَّاسِ',
        transliteration: 'Qul a\'oodhu birabbi an-naas, maliki an-naas, ilahi an-naas, min sharri al-waswaasi al-khannaas, alladhee yuwaswisu fee sudoori an-naas, min al-jinnati wa an-naas',
        translation: 'Say: I seek refuge in the Lord of mankind, The Sovereign of mankind, The God of mankind, From the evil of the retreating whisperer, Who whispers [evil] into the breasts of mankind, From among the jinn and mankind.',
        count: 3,
        source: 'Surah An-Nas (114) - Bukhari 5017',
        category: 'sleeping',
      },
      {
        id: 'sleeping_6',
        arabic: 'اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا',
        transliteration: 'Allaahumma bismika amootu wa ahyaa',
        translation: 'O Allah, with Your name I die and I live.',
        count: 1,
        source: 'Bukhari 6314',
        category: 'sleeping',
      },
      {
        id: 'sleeping_7',
        arabic: 'بِاسْمِكَ رَبِّ وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
        transliteration: 'Bismika rabbi wada\'tu janbee, wa bika arfa\'uh, in amsakta nafsee farhamnaa, wa in arsaltahaa fahfazhaa bimaa tahfazu bihi \'ibaadaka as-saaliheen',
        translation: 'In Your name my Lord, I lie down on my side, and by Your leave I raise it up. If You should take my soul then have mercy upon it, and if You should return my soul then protect it in the manner You do so with Your righteous servants.',
        count: 1,
        source: 'Bukhari 6320',
        category: 'sleeping',
      },
      {
        id: 'sleeping_8',
        arabic: 'اللَّهُمَّ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا لَكَ مَمَاتُهَا وَمَحْيَاهَا إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ',
        transliteration: 'Allaahumma khalaqta nafsee wa anta tawaffaahaa laka mamaatuhaa wa mahyaahaa in ahyaytahaa fahfazhaa wa in amattahaa faghfir lahaa. Allaahumma innee as\'aluka al-\'aafiyah',
        translation: 'O Allah, You created my soul and You shall take its life, to You belongs its life and death. If You should keep my soul alive then protect it, and if You should take its life then forgive it. O Allah, I ask You to grant me good health.',
        count: 1,
        source: 'Muslim 2712',
        category: 'sleeping',
      },
      {
        id: 'sleeping_9',
        arabic: 'اللَّهُمَّ أَسْلَمْتُ وَجْهِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لاَ مَلْجَأَ وَلاَ مَنْجَا مِنْكَ إِلاَّ إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ',
        transliteration: 'Allaahumma aslamtu wajhee ilayka, wa fawwadtu amree ilayk, wa alja\'tu zahree ilayk, raghbatan wa rahbatan ilayk, laa maljaa wa laa manjaa minka illa ilayk, aamantu bi kitaabika alladhee anzalt, wa bi nabiyyika alladhee arsalt',
        translation: 'O Allah, I submit my face unto You, and I entrust my affairs unto You, and I turn my back for protection unto You, in hope and fear of You. Verily there is no refuge, and there is no place of safety from You except with You. I believe in the Book You have revealed, and in the Prophet You have sent.',
        count: 1,
        source: 'Bukhari 6311',
        category: 'sleeping',
      },
      {
        id: 'sleeping_10',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَكَفَانَا وَآوَانَا فَكَمْ مِمَّنْ لاَ كَافِيَ لَهُ وَلاَ مُئْوِيَ',
        transliteration: 'Al-hamdu lillaahi alladhee at\'amanaa wa saqaanaa wa kafaanaa wa aawaanaa fa kam mimman laa kaafiya lahu wa laa mu\'wiy',
        translation: 'All praise is for Allah, Who fed us and gave us drink, and Who is sufficient for us and has sheltered us, for how many have none to suffice them or shelter them.',
        count: 1,
        source: 'Muslim 2715',
        category: 'sleeping',
      },
      {
        id: 'sleeping_11',
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'Subhaan Allah',
        translation: 'How perfect Allah is.',
        count: 33,
        source: 'Muslim 2728',
        category: 'sleeping',
      },
      {
        id: 'sleeping_12',
        arabic: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Al-hamdu lillah',
        translation: 'All praise is for Allah.',
        count: 33,
        source: 'Muslim 2728',
        category: 'sleeping',
      },
      {
        id: 'sleeping_13',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allaahu Akbar',
        translation: 'Allah is the greatest.',
        count: 34,
        source: 'Muslim 2728',
        category: 'sleeping',
      },
      {
        id: 'sleeping_14',
        arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
        transliteration: 'Allaahumma qinee \'adhaabaka yawma tab\'athu \'ibaadak',
        translation: 'O Allah, save me from Your punishment on the day You resurrect Your servants.',
        count: 3,
        source: 'Abu Dawud, Tirmidhi',
        category: 'sleeping',
      },
      {
        id: 'sleeping_15',
        arabic: 'اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا لَكَ مَمَاتُهَا وَمَحْيَاهَا إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ',
        transliteration: 'Allaahumma innaka khalaqta nafsee wa anta tawaffaahaa laka mamaatuhaa wa mahyaahaa in ahyaytahaa fahfazhaa wa in amattahaa faghfir lahaa. Allaahumma innee as\'aluka al-\'aafiyah',
        translation: 'O Allah, verily You have created my soul and You shall take its life, to You belongs its life and death. If You should keep my soul alive then protect it, and if You should take its life then forgive it. O Allah, I ask You to grant me good health.',
        count: 1,
        source: 'Muslim',
        category: 'sleeping',
      },
      {
        id: 'sleeping_16',
        arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
        transliteration: 'Bismika Allaahumma amootu wa ahyaa',
        translation: 'In Your name, O Allah, I die and I live.',
        count: 1,
        source: 'Bukhari',
        category: 'sleeping',
      },
      {
        id: 'sleeping_17',
        arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِوَجْهِكَ الْكَرِيمِ وَكَلِمَاتِكَ التَّامَّاتِ مِنْ شَرِّ مَا أَنْتَ آخِذٌ بِنَاصِيَتِهِ',
        transliteration: 'Allaahumma innee a\'oodhu biwajhikal-kareemi wa kalimaatikat-taammaati min sharri maa anta aakhithun binaasiyatih',
        translation: 'O Allah, I seek refuge in Your Noble Face and Your perfect words from the evil of that which You take by its forelock.',
        count: 1,
        source: 'An-Nasa\'i',
        category: 'sleeping',
      },
      {
        id: 'sleeping_18',
        arabic: 'اللَّهُمَّ رَبَّ السَّمَاوَاتِ وَرَبَّ الأَرْضِ وَرَبَّ الْعَرْشِ الْعَظِيمِ رَبَّنَا وَرَبَّ كُلِّ شَيْءٍ فَالِقَ الْحَبِّ وَالنَّوَى وَمُنْزِلَ التَّوْرَاةِ وَالإِنْجِيلِ وَالْفُرْقَانِ أَعُوذُ بِكَ مِنْ شَرِّ كُلِّ شَيْءٍ أَنْتَ آخِذٌ بِنَاصِيَتِهِ اللَّهُمَّ أَنْتَ الأَوَّلُ فَلَيْسَ قَبْلَكَ شَيْءٌ وَأَنْتَ الآخِرُ فَلَيْسَ بَعْدَكَ شَيْءٌ وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَيْءٌ وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَيْءٌ اقْضِ عَنَّا الدَّيْنَ وَأَغْنِنَا مِنَ الْفَقْرِ',
        transliteration: 'Allaahumma Rabbas-samaawaati wa Rabb-al-ardi wa Rabbal-\'Arshil-\'Azeem, Rabbanaa wa Rabba kulli shay-in, faaliqal-habbi wan-nawaa, wa munzilat-Tawraati wal-Injeeli wal-Furqaan, a\'oodhu bika min sharri kulli shay-in anta aakhithun binaasiyatih. Allaahumma antal-awwalu falaysa qablaka shay-un, wa antal-aakhiru falaysa ba\'daka shay-un, wa antaz-zaahiru falaysa fawqaka shay-un, wa antal-baatinu falaysa doonaka shay-un, iqdi \'annad-dayna wa aghninaa minal-faqr',
        translation: 'O Allah, Lord of the heavens, Lord of the earth, and Lord of the Mighty Throne, our Lord and Lord of everything, Splitter of the seed and the date-stone, Revealer of the Tawrah, the Injil, and the Furqan, I seek refuge in You from the evil of everything You shall seize by the forelock. O Allah, You are the First, so there is nothing before You; and You are the Last, so there is nothing after You; and You are the Apparent, so there is nothing above You; and You are the Hidden, so there is nothing beyond You. Settle our debt for us and spare us from poverty.',
        count: 1,
        source: 'Muslim',
        category: 'sleeping',
      },
      {
        id: 'sleeping_19',
        arabic: 'اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالأَرْضِ رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ أَنْتَ أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءًا أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ',
        transliteration: 'Allaahumma \'aalimal-ghaybi wash-shahaadati faatiras-samaawaati wal-ard, Rabba kulli shay-in wa maleekah, ashhadu an laa ilaaha illa anta, a\'oodhu bika min sharri nafsee wa min sharrish-shaytaani wa shirkih, wa an aqtarifa \'alaa nafsee soo-an aw ajurrahu ilaa muslim',
        translation: 'O Allah, Knower of the unseen and the seen, Creator of the heavens and the earth, Lord and Sovereign of all things, I bear witness that there is none worthy of worship but You. I seek refuge in You from the evil of my soul and from the evil of Shaytan and his helpers. (I also seek refuge in You) from bringing evil upon my soul and from harming any Muslim.',
        count: 1,
        source: 'Abu Dawud, Tirmidhi',
        category: 'sleeping',
      },
      {
        id: 'sleeping_20',
        arabic: 'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ رَغْبَةً وَرَهْبَةً إِلَيْكَ، لاَ مَلْجَأَ وَلاَ مَنْجَا مِنْكَ إِلاَّ إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَنَبِيِّكَ الَّذِي أَرْسَلْتَ',
        transliteration: 'Allaahumma aslamtu nafsee ilayka, wa wajjahtu wajhee ilayka, wa fawwadtu amree ilayka, wa alja\'tu zahree ilayka raghbatan wa rahbatan ilayk, laa maljaa wa laa manjaa minka illa ilayk, aamantu bi kitaabika alladhee anzalt, wa nabiyyika alladhee arsalt',
        translation: 'O Allah, I have submitted myself to You, and have turned my face to You, and have entrusted my affairs to You, and have committed my back to You, out of desire for You and fear of You (expecting Your reward and fearing Your punishment). There is no refuge and no escape from You except to You. I believe in Your Book which You have revealed and in Your Prophet whom You have sent.',
        count: 1,
        source: 'Bukhari',
        category: 'sleeping',
      },
    ],

    general: [
      {
        id: 'general_1',
        arabic: 'لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ',
        transliteration: 'Laa ilaaha illa-llaahu wahdahu laa shareeka lahu, lahu al-mulku wa lahu al-hamdu, wa huwa \'ala kulli shay-in qadeer',
        translation: 'None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise and He is over all things omnipotent.',
        count: 100,
        source: 'Bukhari 6403',
        category: 'general',
      },
      {
        id: 'general_2',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'Subhaan-Allaahi wa bihamdihi',
        translation: 'How perfect Allah is and I praise Him.',
        count: 100,
        source: 'Bukhari 6405',
        category: 'general',
      },
      {
        id: 'general_3',
        arabic: 'لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ',
        transliteration: 'Laa hawla wa laa quwwata illa billaah',
        translation: 'There is no power and no strength except with Allah.',
        count: 10,
        source: 'Various hadith',
        category: 'general',
      },
      {
        id: 'general_4',
        arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّdٍ',
        transliteration: 'Allaahumma salli \'ala Muhammadin wa \'ala aali Muhammad',
        translation: 'O Allah, send prayers upon Muhammad and the followers of Muhammad.',
        count: 10,
        source: 'Various hadith',
        category: 'general',
      },
      {
        id: 'general_5',
        arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
        transliteration: 'Astaghfir ullaahal-\'Azeem alladhee laa ilaaha illa huwal-Hayyul-Qayyoomu wa atoobu ilayh',
        translation: 'I seek forgiveness from Allah the Mighty, whom there is none worthy of worship except Him, The Living, The Eternal, and I repent unto Him.',
        count: 3,
        source: 'Abu Dawud, Tirmidhi',
        category: 'general',
		},
    {
      id: 'general_6',
      arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
      transliteration: 'Rabbanaa aatinaa fi\'d-dunyaa hasanatan wa fi\'l-aakhirati hasanatan wa qinaa \'adhaab an-naar',
      translation: 'Our Lord! Give us in this world that which is good and in the Hereafter that which is good, and save us from the torment of the Fire!',
      count: 7,
      source: 'Quran 2:201',
      category: 'general',
    },
    {
      id: 'general_7',
      arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
      transliteration: 'Yaa Hayyu yaa Qayyoomu bi-rahmatika astagheeths',
      translation: 'O Ever Living, O Self-Subsisting and Supporter of all, by Your mercy I seek assistance.',
      count: 3,
      source: 'Tirmidhi',
      category: 'general',
    },
    {
      id: 'general_8',
      arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
      transliteration: 'Allaahumma a\'innee \'alaa dhikrika wa shukrika wa husni \'ibaadatik',
      translation: 'O Allah, help me remember You, to be grateful to You, and to worship You in an excellent manner.',
      count: 3,
      source: 'Abu Dawud, Nasa\'i',
      category: 'general',
    },
    {
      id: 'general_9',
      arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
      transliteration: 'Rabbish-rah lee sadree wa yassir lee amree',
      translation: 'My Lord, expand for me my breast and ease for me my task.',
      count: 3,
      source: 'Quran 20:25-26',
      category: 'general',
    },
    {
      id: 'general_10',
      arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
      transliteration: 'Hasbunaa Allaahu wa ni\'mal-wakeel',
      translation: 'Allah (Alone) is sufficient for us, and He is the Best Disposer of affairs (for us).',
      count: 7,
      source: 'Quran 3:173',
      category: 'general',
    },
    {
      id: 'general_11',
      arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنَ الْخَيْرِ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ وَأَعُوذُ بِكَ مِنَ الشَّرِّ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ',
      transliteration: 'Allaahumma innee as\'aluka min al-khayri kullihi \'aajilihi wa aajilihi maa \'alimtu minhu wa maa lam a\'lam, wa a\'oodhu bika min ash-sharri kullihi \'aajilihi wa aajilihi maa \'alimtu minhu wa maa lam a\'lam',
      translation: 'O Allah, I ask You for all that is good, in this world and in the Hereafter, what I know and what I do not know. O Allah, I seek refuge with You from all evil, in this world and in the Hereafter, what I know and what I do not know.',
      count: 1,
      source: 'Ibn Majah',
      category: 'general',
    },
    {
      id: 'general_12',
      arabic: 'اللَّهُ أَكْبَرُ',
      transliteration: 'Allaahu Akbar',
      translation: 'Allah is the greatest.',
      count: 10,
      source: 'Various hadith',
      category: 'general',
    },
    {
      id: 'general_13',
      arabic: 'سُبْحَانَ اللَّهِ',
      transliteration: 'Subhaan Allah',
      translation: 'How perfect Allah is.',
      count: 10,
      source: 'Various hadith',
      category: 'general',
    },
    {
      id: 'general_14',
      arabic: 'الْحَمْدُ لِلَّهِ',
      transliteration: 'Al-hamdu lillah',
      translation: 'All praise is for Allah.',
      count: 10,
      source: 'Various hadith',
      category: 'general',
    },
    {
      id: 'general_15',
      arabic: 'لاَ إِلَهَ إِلاَّ اللَّهُ',
      transliteration: 'Laa ilaaha illa Allah',
      translation: 'There is no god except Allah.',
      count: 10,
      source: 'Various hadith',
      category: 'general',
    },
	],
  };

  // Check if user is authenticated
  private getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  // Check if app is in offline mode
  private async isOfflineMode(): Promise<boolean> {
    try {
      const offline = await AsyncStorage.getItem(this.offlineModeKey);
      return offline === 'true';
    } catch {
      return false;
    }
  }

  // Set offline mode
  async setOfflineMode(offline: boolean): Promise<void> {
    await AsyncStorage.setItem(this.offlineModeKey, offline.toString());
  }

  // Initialize default adhkar in Firebase for new users
  async initializeUserAdhkar(userId: string): Promise<void> {
    try {
      const userAdhkarRef = doc(db, 'userAdhkar', userId);
      const userAdhkarDoc = await getDoc(userAdhkarRef);
      
      if (!userAdhkarDoc.exists()) {
        await setDoc(userAdhkarRef, {
          adhkar: this.defaultAdhkar,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Initialize user stats
      const userStatsRef = doc(db, 'userDhikrStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (!userStatsDoc.exists()) {
        const initialStats: UserDhikrStats = {
          totalSessions: 0,
          totalDhikrCount: 0,
          totalTimeSpent: 0,
          streakDays: 0,
          lastActiveDate: new Date(),
          favoriteCategories: [],
          weeklyGoal: 50,
          monthlyGoal: 200,
          categoriesCompleted: {
            morning: 0,
            evening: 0,
            general: 0,
            sleeping: 0,
          },
        };

        await setDoc(userStatsRef, {
          ...initialStats,
          lastActiveDate: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error initializing user adhkar:', error);
    }
  }

  // Get adhkar by category
  async getAdhkarByCategory(category: DhikrCategory): Promise<Dhikr[]> {
    try {
      const userId = this.getCurrentUserId();
      const isOffline = await this.isOfflineMode();

      if (!userId || isOffline) {
        // Use local storage for offline or unauthenticated users
        const stored = await AsyncStorage.getItem(this.storageKey);
        if (stored) {
          const allAdhkar = JSON.parse(stored);
          return allAdhkar[category] || this.defaultAdhkar[category];
        }
        return this.defaultAdhkar[category];
      }

      // Get from Firebase for authenticated users
      const userAdhkarRef = doc(db, 'userAdhkar', userId);
      const userAdhkarDoc = await getDoc(userAdhkarRef);
      
      if (userAdhkarDoc.exists()) {
        const data = userAdhkarDoc.data();
        return data.adhkar[category] || this.defaultAdhkar[category];
      }

      // Initialize if doesn't exist
      await this.initializeUserAdhkar(userId);
      return this.defaultAdhkar[category];
    } catch (error) {
      console.error('Error getting adhkar:', error);
      return this.defaultAdhkar[category];
    }
  }

  // Get all adhkar
  async getAllAdhkar(): Promise<Record<DhikrCategory, Dhikr[]>> {
    try {
      const userId = this.getCurrentUserId();
      const isOffline = await this.isOfflineMode();

      if (!userId || isOffline) {
        const stored = await AsyncStorage.getItem(this.storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
        return this.defaultAdhkar;
      }

      const userAdhkarRef = doc(db, 'userAdhkar', userId);
      const userAdhkarDoc = await getDoc(userAdhkarRef);
      
      if (userAdhkarDoc.exists()) {
        return userAdhkarDoc.data().adhkar || this.defaultAdhkar;
      }

      await this.initializeUserAdhkar(userId);
      return this.defaultAdhkar;
    } catch (error) {
      console.error('Error getting all adhkar:', error);
      return this.defaultAdhkar;
    }
  }

  // Save custom adhkar
  async saveCustomDhikr(dhikr: Dhikr): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to save custom dhikr');
      }

      const customDhikrRef = collection(db, 'customDhikr');
      await addDoc(customDhikrRef, {
        ...dhikr,
        userId,
        isCustom: true,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving custom dhikr:', error);
      throw error;
    }
  }

  // Get user's custom adhkar
  async getCustomAdhkar(): Promise<Dhikr[]> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return [];

      const customDhikrQuery = query(
        collection(db, 'customDhikr'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(customDhikrQuery);
      const customAdhkar: Dhikr[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        customAdhkar.push({
          id: doc.id,
          arabic: data.arabic,
          transliteration: data.transliteration,
          translation: data.translation,
          count: data.count,
          source: data.source,
          category: data.category,
        });
      });

      return customAdhkar;
    } catch (error) {
      console.error('Error getting custom adhkar:', error);
      return [];
    }
  }

  // Get favorites
  async getFavorites(): Promise<string[]> {
    try {
      const userId = this.getCurrentUserId();
      const isOffline = await this.isOfflineMode();

      if (!userId || isOffline) {
        const stored = await AsyncStorage.getItem(this.favoritesKey);
        return stored ? JSON.parse(stored) : [];
      }

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data().favorites || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  // Add to favorites
  async addFavorite(dhikrId: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const isOffline = await this.isOfflineMode();

      if (!userId || isOffline) {
        const favorites = await this.getFavorites();
        if (!favorites.includes(dhikrId)) {
          favorites.push(dhikrId);
          await AsyncStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
        }
        return;
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayUnion(dhikrId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  }

  // Remove from favorites
  async removeFavorite(dhikrId: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const isOffline = await this.isOfflineMode();

      if (!userId || isOffline) {
        const favorites = await this.getFavorites();
        const updated = favorites.filter(id => id !== dhikrId);
        await AsyncStorage.setItem(this.favoritesKey, JSON.stringify(updated));
        return;
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        favorites: arrayRemove(dhikrId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  // Start dhikr session
  async startDhikrSession(dhikrId: string, category: DhikrCategory): Promise<string> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        throw new Error('User must be authenticated to start dhikr session');
      }

      const sessionRef = collection(db, 'dhikrSessions');
      const sessionDoc = await addDoc(sessionRef, {
        userId,
        dhikrId,
        category,
        count: 0,
        duration: 0,
        startedAt: serverTimestamp(),
        isCompleted: false,
        createdAt: serverTimestamp(),
      });

      return sessionDoc.id;
    } catch (error) {
      console.error('Error starting dhikr session:', error);
      throw error;
    }
  }

  // Update dhikr session progress
  async updateDhikrProgress(sessionId: string, count: number): Promise<void> {
    try {
      const sessionRef = doc(db, 'dhikrSessions', sessionId);
      await updateDoc(sessionRef, {
        count,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating dhikr progress:', error);
    }
  }

  // Complete dhikr session
  async completeDhikrSession(sessionId: string, finalCount: number, duration: number): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const sessionRef = doc(db, 'dhikrSessions', sessionId);
      
      // Update session
      await updateDoc(sessionRef, {
        count: finalCount,
        duration,
        isCompleted: true,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update user stats
      const userStatsRef = doc(db, 'userDhikrStats', userId);
      await updateDoc(userStatsRef, {
        totalSessions: increment(1),
        totalDhikrCount: increment(finalCount),
        totalTimeSpent: increment(Math.floor(duration / 60)), // convert to minutes
        lastActiveDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update daily streak
      await this.updateDailyStreak(userId);
    } catch (error) {
      console.error('Error completing dhikr session:', error);
    }
  }

  // Update daily streak
  private async updateDailyStreak(userId: string): Promise<void> {
    try {
      const userStatsRef = doc(db, 'userDhikrStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (userStatsDoc.exists()) {
        const data = userStatsDoc.data();
        const lastActiveDate = data.lastActiveDate?.toDate();
        const today = new Date();
        
        let newStreak = data.streakDays || 0;
        
        if (lastActiveDate) {
          const daysDiff = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            // Consecutive day - increment streak
            newStreak += 1;
          } else if (daysDiff > 1) {
            // Streak broken - reset to 1
            newStreak = 1;
          }
          // Same day - keep current streak
        } else {
          // First time - start streak
          newStreak = 1;
        }
        
        await updateDoc(userStatsRef, {
          streakDays: newStreak,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating daily streak:', error);
    }
  }

  // Get user dhikr statistics
  async getUserDhikrStats(): Promise<UserDhikrStats | null> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return null;

      const userStatsRef = doc(db, 'userDhikrStats', userId);
      const userStatsDoc = await getDoc(userStatsRef);
      
      if (userStatsDoc.exists()) {
        const data = userStatsDoc.data();
        return {
          totalSessions: data.totalSessions || 0,
          totalDhikrCount: data.totalDhikrCount || 0,
          totalTimeSpent: data.totalTimeSpent || 0,
          streakDays: data.streakDays || 0,
          lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
          favoriteCategories: data.favoriteCategories || [],
          weeklyGoal: data.weeklyGoal || 50,
          monthlyGoal: data.monthlyGoal || 200,
          categoriesCompleted: data.categoriesCompleted || {
            morning: 0,
            evening: 0,
            general: 0,
            sleeping: 0,
          },
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user dhikr stats:', error);
		return null;
    }
  }

  // Get recent dhikr sessions
  async getRecentSessions(limitCount: number = 10): Promise<DhikrSession[]> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return [];

      const sessionsQuery = query(
        collection(db, 'dhikrSessions'),
        where('userId', '==', userId),
        where('isCompleted', '==', true),
        orderBy('completedAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(sessionsQuery);
      const sessions: DhikrSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          userId: data.userId,
          dhikrId: data.dhikrId,
          category: data.category,
          count: data.count,
          duration: data.duration,
          startedAt: data.startedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate() || new Date(),
          isCompleted: data.isCompleted,
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  }

  // Search adhkar
  async searchAdhkar(query: string): Promise<Dhikr[]> {
    try {
      const allAdhkar = await this.getAllAdhkar();
      const searchResults: Dhikr[] = [];
      const lowercaseQuery = query.toLowerCase();

      Object.values(allAdhkar).flat().forEach(dhikr => {
        if (
          dhikr.arabic.toLowerCase().includes(lowercaseQuery) ||
          dhikr.transliteration.toLowerCase().includes(lowercaseQuery) ||
          dhikr.translation.toLowerCase().includes(lowercaseQuery) ||
          dhikr.source?.toLowerCase().includes(lowercaseQuery)
        ) {
          searchResults.push(dhikr);
        }
      });

      // Also search custom adhkar
      const customAdhkar = await this.getCustomAdhkar();
      customAdhkar.forEach(dhikr => {
        if (
          dhikr.arabic.toLowerCase().includes(lowercaseQuery) ||
          dhikr.transliteration.toLowerCase().includes(lowercaseQuery) ||
          dhikr.translation.toLowerCase().includes(lowercaseQuery) ||
          dhikr.source?.toLowerCase().includes(lowercaseQuery)
        ) {
          searchResults.push(dhikr);
        }
      });

      return searchResults;
    } catch (error) {
      console.error('Error searching adhkar:', error);
      return [];
    }
  }

  // Set weekly/monthly goals
  async setUserGoals(weeklyGoal: number, monthlyGoal: number): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const userStatsRef = doc(db, 'userDhikrStats', userId);
      await updateDoc(userStatsRef, {
        weeklyGoal,
        monthlyGoal,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting user goals:', error);
    }
  }

  // Sync offline data when coming back online
  async syncOfflineData(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      // Sync favorites
      const localFavorites = await AsyncStorage.getItem(this.favoritesKey);
      if (localFavorites) {
        const favorites = JSON.parse(localFavorites);
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          favorites,
          updatedAt: serverTimestamp(),
        });
      }

      // Clear offline mode
      await this.setOfflineMode(false);
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }

  // Listen to real-time updates
  onDhikrStatsChange(callback: (stats: UserDhikrStats | null) => void): () => void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      callback(null);
      return () => {};
    }

    const userStatsRef = doc(db, 'userDhikrStats', userId);
    return onSnapshot(userStatsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const stats: UserDhikrStats = {
          totalSessions: data.totalSessions || 0,
          totalDhikrCount: data.totalDhikrCount || 0,
          totalTimeSpent: data.totalTimeSpent || 0,
          streakDays: data.streakDays || 0,
          lastActiveDate: data.lastActiveDate?.toDate() || new Date(),
          favoriteCategories: data.favoriteCategories || [],
          weeklyGoal: data.weeklyGoal || 50,
          monthlyGoal: data.monthlyGoal || 200,
          categoriesCompleted: data.categoriesCompleted || {
            morning: 0,
            evening: 0,
            general: 0,
            sleeping: 0,
          },
        };
        callback(stats);
      } else {
        callback(null);
      }
    });
  }

  // Get default adhkar
  getDefaultAdhkar(): Record<DhikrCategory, Dhikr[]> {
    return this.defaultAdhkar;
  }

  // Reset to default (clears all user data)
  async resetToDefault(): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      
      // Clear local storage
      await AsyncStorage.multiRemove([this.storageKey, this.favoritesKey]);
      
      if (userId) {
        // Reset Firebase data
        const batch = writeBatch(db);
        
        // Reset user adhkar
        const userAdhkarRef = doc(db, 'userAdhkar', userId);
        batch.set(userAdhkarRef, {
          adhkar: this.defaultAdhkar,
          updatedAt: serverTimestamp(),
        });
        
        // Reset user stats
        const userStatsRef = doc(db, 'userDhikrStats', userId);
        batch.set(userStatsRef, {
          totalSessions: 0,
          totalDhikrCount: 0,
          totalTimeSpent: 0,
          streakDays: 0,
          lastActiveDate: serverTimestamp(),
          favoriteCategories: [],
          weeklyGoal: 50,
          monthlyGoal: 200,
          categoriesCompleted: {
            morning: 0,
            evening: 0,
            general: 0,
            sleeping: 0,
          },
          updatedAt: serverTimestamp(),
        });
        
        // Reset user favorites
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          favorites: [],
          updatedAt: serverTimestamp(),
        });
        
        await batch.commit();
      }
    } catch (error) {
      console.error('Error resetting to default:', error);
    }
  }
}

export const firebaseAdhkarService = new FirebaseAdhkarService();