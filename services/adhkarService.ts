import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dhikr, DhikrCategory } from '@/types/dhikr';

class AdhkarService {
  private storageKey = 'islamic_app_adhkar';
  private favoritesKey = 'islamic_app_favorites';

  private defaultAdhkar: Record<DhikrCategory, Dhikr[]> = {
    morning: [
      {
        id: '1',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لا إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
        transliteration: 'Asbahnaa wa asbaha al-mulku lillaahi walhamdu lillaah, laa ilaaha illa Allaahu wahdahu laa shareeka lah, lahu al-mulku wa lahu al-hamdu wa huwa ala kulli shay-in qadeer. Rabbi as-aluka khayra maa fee haadha al-yawmi wa khayra maa ba\'dah, wa a\'oodhu bika min sharri maa fee haadha al-yawmi wa sharri maa ba\'dah. Rabbi a\'oodhu bika min al-kasali wa soo-i al-kibar. Rabbi a\'oodhu bika min \'adhabin fi an-naari wa \'adhabin fi al-qabr.',
        translation: 'We have reached the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this day and the good of what follows it and I take refuge in You from the evil of this day and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.',
        count: 1,
        source: 'Muslim',
        category: 'morning',
      },
      {
        id: '2',
        arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
        transliteration: 'Allaahumma bika asbahnaa wa bika amsaynaa wa bika nahyaa wa bika namootu wa ilayka an-nushoor',
        translation: 'O Allah, by Your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection.',
        count: 1,
        source: 'Abu Dawud, Tirmidhi',
        category: 'morning',
      },
      {
        id: '3',
        arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لا إِلَـهَ إِلاَّ أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لا يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ',
        transliteration: 'Allaahumma anta rabbee laa ilaaha illaa anta, khalaqtanee wa anaa \'abduka, wa anaa \'alaa \'ahdika wa wa\'dika ma astata\'tu, a\'oodhu bika min sharri maa sana\'tu, aboo-u laka bi ni\'matika \'alaiyya wa aboo-u laka bi dhanbee faghfir lee fa innahu laa yaghfir adh-dhunnooba illaa ant',
        translation: 'O Allah, You are my Lord, none has the right to be worshipped except You, You created me and I am Your servant and I abide to Your covenant and promise as best I can, I take refuge in You from the evil of which I have committed. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for verily none can forgive sin except You.',
        count: 1,
        source: 'Bukhari',
        category: 'morning',
      },
      {
        id: '4',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي اللَّهُمَّ احْفَظْنِي مِن بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَن شِمَالِي وَمِنْ فَوْقِي وَأَعُوذُ بِعَظَمَتِكَ أَن أُغْتَالَ مِن تَحْتِي',
        transliteration: 'Allaahumma innee as-aluka al-\'afwa wa al-\'aafiyata fi ad-dunyaa wa al-aakhirah. Allaahumma innee as-aluka al-\'afwa wa al-\'aafiyata fee deenee wa dunyaaya wa ahlee wa maalee. Allaahumma ustur \'awraatee wa aamin raw\'aatee. Allaahum mahfadhnee min bayni yadayya wa min khalfee wa \'an yameenee wa \'an shimaalee wa min fawqee wa a\'oodhu bi \'adhamatika an ughtaala min tahtee',
        translation: 'O Allah, I ask You for forgiveness and well-being in this world and the next. O Allah, I ask You for forgiveness and well-being in my religious and worldly affairs, and my family and my wealth. O Allah, veil my weaknesses and set at ease my dismay. O Allah, preserve me from the front and from behind and on my right and on my left and from above, and I take refuge with You lest I be swallowed up by the earth.',
        count: 1,
        source: 'Abu Dawud, Ibn Majah',
        category: 'morning',
      },
      {
        id: '5',
        arabic: 'حَسْبِيَ اللَّهُ لا إِلَـهَ إِلاَّ هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
        transliteration: 'Hasbi Allaahu laa ilaaha illaa huwa \'alayhi tawakkaltu wa huwa rabb ul-\'arsh il-\'adheem',
        translation: 'Allah is sufficient for me, none has the right to be worshipped except Him, upon Him I rely and He is Lord of the exalted throne.',
        count: 7,
        source: 'Abu Dawud',
        category: 'morning',
      },
      {
        id: '6',
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        transliteration: 'A\'oodhu bi kalimaati Allaahi at-taammaati min sharri maa khalaq',
        translation: 'I take refuge in Allah\'s perfect words from the evil He has created.',
        count: 3,
        source: 'Muslim',
        category: 'morning',
      },
      {
        id: '7',
        arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لا إِلَهَ إِلاَّ أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لا إِلَهَ إِلاَّ أَنْتَ',
        transliteration: 'Allaahumma \'aafinee fee badanee, Allaahumma \'aafinee fee sam\'ee, Allaahumma \'aafinee fee basaree, laa ilaaha illaa ant. Allaahumma innee a\'oodhu bika min al-kufri wa al-faqri, wa a\'oodhu bika min \'adhaab il-qabri, laa ilaaha illaa ant',
        translation: 'O Allah, grant my body health, O Allah, grant my hearing health, O Allah, grant my sight health. None has the right to be worshipped except You. O Allah, I take refuge with You from disbelief and poverty, and I take refuge with You from the punishment of the grave. None has the right to be worshipped except You.',
        count: 3,
        source: 'Abu Dawud',
        category: 'morning',
      },
      {
        id: '8',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'Subhaan Allaahi wa bihamdihi',
        translation: 'How perfect Allah is and I praise Him.',
        count: 100,
        source: 'Bukhari, Muslim',
        category: 'morning',
      },
      {
        id: '9',
        arabic: 'لا إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: 'Laa ilaaha illa Allaahu wahdahu laa shareeka lahu, lahu al-mulku wa lahu al-hamdu wa huwa \'alaa kulli shay-in qadeer',
        translation: 'None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise, and He is over all things omnipotent.',
        count: 100,
        source: 'Bukhari, Muslim',
        category: 'morning',
      },
      {
        id: '10',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        transliteration: 'Bismillaahi alladhee laa yadurru ma\'a ismihi shay-un fi al-ardi wa laa fi as-samaai wa huwa as-samee\' ul-\'aleem',
        translation: 'In the name of Allah with whose name nothing is harmed on earth nor in the heavens and He is The All-Seeing, The All-Knowing.',
        count: 3,
        source: 'Abu Dawud, Tirmidhi',
        category: 'morning',
      },
    ],
    evening: [
      {
        id: '11',
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لا إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
        transliteration: 'Amsaynaa wa amsa al-mulku lillaahi walhamdu lillaah, laa ilaaha illa Allaahu wahdahu laa shareeka lah, lahu al-mulku wa lahu al-hamdu wa huwa ala kulli shay-in qadeer. Rabbi as-aluka khayra maa fee hadhihi al-laylati wa khayra maa ba\'daha, wa a\'oodhu bika min sharri maa fee hadhihi al-laylati wa sharri maa ba\'daha. Rabbi a\'oodhu bika min al-kasali wa soo-i al-kibar. Rabbi a\'oodhu bika min \'adhabin fi an-naari wa \'adhabin fi al-qabr.',
        translation: 'We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah. None has the right to be worshipped except Allah, alone, without partner, to Him belongs all sovereignty and praise and He is over all things omnipotent. My Lord, I ask You for the good of this night and the good of what follows it and I take refuge in You from the evil of this night and the evil of what follows it. My Lord, I take refuge in You from laziness and senility. My Lord, I take refuge in You from torment in the Fire and punishment in the grave.',
        count: 1,
        source: 'Muslim',
        category: 'evening',
      },
      {
        id: '12',
        arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ',
        transliteration: 'Allaahumma bika amsaynaa wa bika asbahnaa wa bika nahyaa wa bika namootu wa ilayka al-maseer',
        translation: 'O Allah, by Your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is our return.',
        count: 1,
        source: 'Abu Dawud, Tirmidhi',
        category: 'evening',
      },
      {
        id: '13',
        arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لا إِلَـهَ إِلاَّ أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لا يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ',
        transliteration: 'Allaahumma anta rabbee laa ilaaha illaa anta, khalaqtanee wa anaa \'abduka, wa anaa \'alaa \'ahdika wa wa\'dika ma astata\'tu, a\'oodhu bika min sharri maa sana\'tu, aboo-u laka bi ni\'matika \'alaiyya wa aboo-u laka bi dhanbee faghfir lee fa innahu laa yaghfir adh-dhunnooba illaa ant',
        translation: 'O Allah, You are my Lord, none has the right to be worshipped except You, You created me and I am Your servant and I abide to Your covenant and promise as best I can, I take refuge in You from the evil of which I have committed. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for verily none can forgive sin except You.',
        count: 1,
        source: 'Bukhari',
        category: 'evening',
      },
      {
        id: '14',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي اللَّهُمَّ احْفَظْنِي مِن بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَن شِمَالِي وَمِنْ فَوْقِي وَأَعُوذُ بِعَظَمَتِكَ أَن أُغْتَالَ مِن تَحْتِي',
        transliteration: 'Allaahumma innee as-aluka al-\'afwa wa al-\'aafiyata fi ad-dunyaa wa al-aakhirah. Allaahumma innee as-aluka al-\'afwa wa al-\'aafiyata fee deenee wa dunyaaya wa ahlee wa maalee. Allaahumma ustur \'awraatee wa aamin raw\'aatee. Allaahum mahfadhnee min bayni yadayya wa min khalfee wa \'an yameenee wa \'an shimaalee wa min fawqee wa a\'oodhu bi \'adhamatika an ughtaala min tahtee',
        translation: 'O Allah, I ask You for forgiveness and well-being in this world and the next. O Allah, I ask You for forgiveness and well-being in my religious and worldly affairs, and my family and my wealth. O Allah, veil my weaknesses and set at ease my dismay. O Allah, preserve me from the front and from behind and on my right and on my left and from above, and I take refuge with You lest I be swallowed up by the earth.',
        count: 1,
        source: 'Abu Dawud, Ibn Majah',
        category: 'evening',
      },
      {
        id: '15',
        arabic: 'حَسْبِيَ اللَّهُ لا إِلَـهَ إِلاَّ هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
        transliteration: 'Hasbi Allaahu laa ilaaha illaa huwa \'alayhi tawakkaltu wa huwa rabb ul-\'arsh il-\'adheem',
        translation: 'Allah is sufficient for me, none has the right to be worshipped except Him, upon Him I rely and He is Lord of the exalted throne.',
        count: 7,
        source: 'Abu Dawud',
        category: 'evening',
      },
		{
        id: '16',
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        transliteration: 'A\'oodhu bi kalimaati Allaahi at-taammaati min sharri maa khalaq',
        translation: 'I take refuge in Allah\'s perfect words from the evil He has created.',
        count: 3,
        source: 'Muslim',
        category: 'evening',
      },
      {
        id: '17',
        arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لا إِلَهَ إِلاَّ أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ، وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لا إِلَهَ إِلاَّ أَنْتَ',
        transliteration: 'Allaahumma \'aafinee fee badanee, Allaahumma \'aafinee fee sam\'ee, Allaahumma \'aafinee fee basaree, laa ilaaha illaa ant. Allaahumma innee a\'oodhu bika min al-kufri wa al-faqri, wa a\'oodhu bika min \'adhaab il-qabri, laa ilaaha illaa ant',
        translation: 'O Allah, grant my body health, O Allah, grant my hearing health, O Allah, grant my sight health. None has the right to be worshipped except You. O Allah, I take refuge with You from disbelief and poverty, and I take refuge with You from the punishment of the grave. None has the right to be worshipped except You.',
        count: 3,
        source: 'Abu Dawud',
        category: 'evening',
      },
      {
        id: '18',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'Subhaan Allaahi wa bihamdihi',
        translation: 'How perfect Allah is and I praise Him.',
        count: 100,
        source: 'Bukhari, Muslim',
        category: 'evening',
      },
      {
        id: '19',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        transliteration: 'Bismillaahi alladhee laa yadurru ma\'a ismihi shay-un fi al-ardi wa laa fi as-samaai wa huwa as-samee\' ul-\'aleem',
        translation: 'In the name of Allah with whose name nothing is harmed on earth nor in the heavens and He is The All-Seeing, The All-Knowing.',
        count: 3,
        source: 'Abu Dawud, Tirmidhi',
        category: 'evening',
      },
    ],
    general: [
      {
        id: '20',
        arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: 'Laa ilaaha illa Allaahu wahdahu laa shareeka lah, lahu al-mulku wa lahu al-hamdu wa huwa \'alaa kulli shay-in qadeer',
        translation: 'There is no deity except Allah, alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.',
        count: 10,
        source: 'Tirmidhi, Ibn Majah',
        category: 'general',
      },
      {
        id: '21',
        arabic: 'أَسْتَغْفِرُ اللّٰهَ الْعَظِيمَ الَّذِي لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
        transliteration: 'Astaghfir Allah al-\'adheem alladhi laa ilaaha illa huwa al-hayy al-qayyoom wa atubu ilayh',
        translation: 'I seek forgiveness of Allah the Mighty, Whom there is none worthy of worship except Him, the Living, the Eternal, and I repent unto Him.',
        count: 3,
        source: 'Abu Dawud, Tirmidhi',
        category: 'general',
      },
      {
        id: '22',
        arabic: 'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلا إِلَهَ إِلاَّ اللَّهُ وَاللَّهُ أَكْبَرُ',
        transliteration: 'Subhaan Allaahi, wal hamdu lillaahi, wa laa ilaaha illa Allaahu wa Allaahu akbar',
        translation: 'How perfect Allah is, all praise is for Allah, none has the right to be worshipped except Allah, and Allah is the greatest.',
        count: 33,
        source: 'Tirmidhi',
        category: 'general',
      },
      {
        id: '23',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
        transliteration: 'Subhaan Allaahi wa bihamdihi, subhaan Allaah il-\'adheem',
        translation: 'How perfect Allah is and I praise Him, how perfect Allah is, The Supreme.',
        count: 10,
        source: 'Bukhari, Muslim',
        category: 'general',
      },
      {
        id: '24',
        arabic: 'لا حَوْلَ وَلا قُوَّةَ إِلاَّ بِاللَّهِ',
        transliteration: 'Laa hawla wa laa quwwata illaa billaah',
        translation: 'There is no might nor power except with Allah.',
        count: 10,
        source: 'Bukhari, Muslim',
        category: 'general',
      },
      {
        id: '25',
        arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
        transliteration: 'Allaahumma salli \'alaa Muhammadin wa \'alaa aali Muhammadin kamaa sallayta \'alaa Ibraaheema wa \'alaa aali Ibraaheema innaka hameedun majeed',
        translation: 'O Allah, send prayers upon Muhammad and upon the family of Muhammad, as You sent prayers upon Ibrahim and upon the family of Ibrahim, verily You are Praiseworthy and Glorious.',
        count: 10,
        source: 'Bukhari',
        category: 'general',
      },
      {
        id: '26',
        arabic: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالإِسْلامِ دِينًا وَبِمُحَمَّدٍ رَسُولاً',
        transliteration: 'Radeetu billaahi rabban wa bil-Islaami deenan wa bi Muhammadin rasoolan',
        translation: 'I am pleased with Allah as a Lord, and Islam as a religion, and Muhammad as a Messenger.',
        count: 3,
        source: 'Abu Dawud',
        category: 'general',
      },
      {
        id: '27',
        arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي دِينِي كُلَّهُ وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
        transliteration: 'Yaa hayyu yaa qayyoomu birahmatika astagheethu aslih lee deenee kullahu wa laa takilnee ilaa nafsee tarfata \'ayn',
        translation: 'O Ever Living, O Self-Subsisting and Supporter of all, by Your mercy I seek assistance, rectify for me all of my affairs and do not leave me to myself, even for the blink of an eye.',
        count: 3,
        source: 'Nasa\'i',
        category: 'general',
      },
      {
        id: '28',
        arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
        transliteration: 'Allaahumma a\'innee \'alaa dhikrika wa shukrika wa husni \'ibaadatik',
        translation: 'O Allah, help me remember You, to be grateful to You, and to worship You in an excellent manner.',
        count: 3,
        source: 'Abu Dawud, Nasa\'i',
        category: 'general',
      },
      {
        id: '29',
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        transliteration: 'Rabbanaa aatinaa fi ad-dunyaa hasanatan wa fi al-aakhirati hasanatan wa qinaa \'adhaab an-naar',
        translation: 'Our Lord, give us in this world that which is good and in the Hereafter that which is good, and save us from the punishment of the Fire.',
        count: 7,
        source: 'Bukhari, Muslim',
        category: 'general',
      },
      {
        id: '30',
        arabic: 'اللَّهُمَّ إِنَّكَ عُفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
        transliteration: 'Allaahumma innaka \'afuwwun kareemun tuhibb ul-\'afwa fa\'fu \'annee',
        translation: 'O Allah, You are Most Forgiving, and You love forgiveness; so forgive me.',
        count: 3,
        source: 'Tirmidhi, Ibn Majah',
        category: 'general',
      },
    ],
    sleeping: [
      {
        id: '31',
        arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
        transliteration: 'Bismika Allaahumma amootu wa ahyaa',
        translation: 'In Your name O Allah, I live and die.',
        count: 1,
        source: 'Bukhari',
        category: 'sleeping',
      },
      {
        id: '32',
        arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
        transliteration: 'Allaahumma qinee \'adhaabaka yawma tab\'athu \'ibaadak',
        translation: 'O Allah, protect me from Your punishment on the day You resurrect Your servants.',
        count: 3,
        source: 'Abu Dawud, Tirmidhi',
        category: 'sleeping',
      },
      {
        id: '33',
        arabic: 'اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا',
        transliteration: 'Allaahumma bismika amootu wa ahyaa',
        translation: 'O Allah, in Your name I die and I live.',
        count: 1,
        source: 'Bukhari, Muslim',
        category: 'sleeping',
      },
      {
        id: '34',
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'Subhaan Allaah',
        translation: 'How perfect Allah is.',
        count: 33,
        source: 'Bukhari, Muslim',
        category: 'sleeping',
      },
      {
        id: '35',
        arabic: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Al-hamdu lillaah',
        translation: 'All praise is for Allah.',
        count: 33,
        source: 'Bukhari, Muslim',
        category: 'sleeping',
      },
      {
        id: '36',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allaahu akbar',
        translation: 'Allah is the greatest.',
        count: 34,
        source: 'Bukhari, Muslim',
        category: 'sleeping',
      },
      {
        id: '37',
        arabic: 'اللَّهُمَّ رَبَّ السَّمَوَاتِ السَّبْعِ وَرَبَّ الْعَرْشِ الْعَظِيمِ، رَبَّنَا وَرَبَّ كُلِّ شَيْءٍ، فَالِقَ الْحَبِّ وَالنَّوَى، وَمُنْزِلَ التَّوْرَاةِ وَالإِنجِيلِ وَالْفُرْقَانِ، أَعُوذُ بِكَ مِنْ شَرِّ كُلِّ شَيْءٍ أَنْتَ آخِذٌ بِنَاصِيَتِهِ. اللَّهُمَّ أَنْتَ الأَوَّلُ فَلَيْسَ قَبْلَكَ شَيْءٌ، وَأَنْتَ الآخِرُ فَلَيْسَ بَعْدَكَ شَيْءٌ، وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَيْءٌ، وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَيْءٌ، اقْضِ عَنَّا الدَّيْنَ وَأَغْنِنَا مِنَ الْفَقْرِ',
        transliteration: 'Allaahumma rabb as-samaawaati as-sab\'i wa rabb al-\'arshi al-\'adheem, rabbanaa wa rabba kulli shay-in, faaliqa al-habbi wa an-nawaa, wa munzila at-tawraati wa al-injeeli wa al-furqaan, a\'oodhu bika min sharri kulli shay-in anta aakhidhun bi naasiyatih. Allaahumma anta al-awwalu fa laysa qablaka shay-un, wa anta al-aakhiru fa laysa ba\'daka shay-un, wa anta adh-dhaahiru fa laysa fawqaka shay-un, wa anta al-baatinu fa laysa doonaka shay-un, iqdi \'anna ad-dayna wa aghninaa min al-faqr',
        translation: 'O Allah, Lord of the seven heavens and the exalted throne, our Lord and Lord of all things, splitter of the seed and the date stone, revealer of the Tawrah, the Injeel and the Furqan, I take refuge in You from the evil of all things You shall seize by the forelock. O Allah, You are the First so there is nothing before You, and You are the Last so there is nothing after You, and You are the Most High so there is nothing above You, and You are the Most Near so there is nothing closer than You. Settle our debt for us and spare us from poverty.',
        count: 1,
        source: 'Muslim',
        category: 'sleeping',
      },
      {
        id: '38',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَكَفَانَا وَآوَانَا فَكَمْ مِمَّن لاَّ كَافِيَ لَهُ وَلاَ مُؤْوِيَ',
        transliteration: 'Al-hamdu lillaahi alladhee at\'amanaa wa saqaanaa wa kafaanaa wa aawaanaa, fa kam mimman laa kaafiya lahu wa laa mu\'wee',
        translation: 'All praise is for Allah, Who fed us and gave us drink, and Who is sufficient for us and has sheltered us, for how many have none to suffice them or shelter them.',
        count: 1,
        source: 'Muslim',
        category: 'sleeping',
      },
      {
        id: '39',
        arabic: 'اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَوَاتِ وَالأَرْضِ رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَن لاَّ إِلَهَ إِلاَّ أَنْتَ أَعُوذُ بِكَ مِن شَرِّ نَفْسِي وَمِن شَرِّ الشَّيْطَان وَشِرْكِهِ',
        transliteration: 'Allaahumma \'aalim al-ghaybi wa ash-shahaadati faatir as-samaawaati wa al-ardi rabba kulli shay-in wa maleekah, ashhadu an laa ilaaha illaa anta, a\'oodhu bika min sharri nafsee wa min sharr ish-shaytaani wa shirkah',
        translation: 'O Allah, Knower of the unseen and the seen, Creator of the heavens and the earth, Lord and Sovereign of all things, I bear witness that none has the right to be worshipped except You. I take refuge in You from the evil of my soul and from the evil and shirk of the devil.',
        count: 1,
        source: 'Abu Dawud, Tirmidhi',
        category: 'sleeping',
      },
      {
        id: '40',
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        transliteration: 'A\'oodhu bi kalimaati Allaahi at-taammaati min sharri maa khalaq',
        translation: 'I take refuge in Allah\'s perfect words from the evil He has created.',
        count: 3,
        source: 'Muslim',
        category: 'sleeping',
      },
    ],
  };

  async getAdhkarByCategory(category: DhikrCategory): Promise<Dhikr[]> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const allAdhkar = JSON.parse(stored);
        return allAdhkar[category] || this.defaultAdhkar[category];
      }
      return this.defaultAdhkar[category];
    } catch (error) {
      console.error('Error getting adhkar:', error);
      return this.defaultAdhkar[category];
    }
  }

  async getAllAdhkar(): Promise<Record<DhikrCategory, Dhikr[]>> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      return this.defaultAdhkar;
    } catch (error) {
      console.error('Error getting all adhkar:', error);
      return this.defaultAdhkar;
    }
  }

  async saveAdhkar(adhkar: Record<DhikrCategory, Dhikr[]>): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(adhkar));
    } catch (error) {
      console.error('Error saving adhkar:', error);
    }
  }

  async getFavorites(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(this.favoritesKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async addFavorite(dhikrId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      if (!favorites.includes(dhikrId)) {
        favorites.push(dhikrId);
        await AsyncStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  }

  async removeFavorite(dhikrId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updated = favorites.filter(id => id !== dhikrId);
      await AsyncStorage.setItem(this.favoritesKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  async getFavoriteAdhkar(): Promise<Dhikr[]> {
    try {
      const favorites = await this.getFavorites();
      const allAdhkar = await this.getAllAdhkar();
      const favoriteAdhkar: Dhikr[] = [];

      Object.values(allAdhkar).flat().forEach(dhikr => {
        if (favorites.includes(dhikr.id)) {
          favoriteAdhkar.push(dhikr);
        }
      });

      return favoriteAdhkar;
    } catch (error) {
      console.error('Error getting favorite adhkar:', error);
      return [];
    }
  }

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
          dhikr.source?.toLocaleLowerCase().includes(lowercaseQuery)
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

  getDefaultAdhkar(): Record<DhikrCategory, Dhikr[]> {
    return this.defaultAdhkar;
  }

  async resetToDefault(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
      await AsyncStorage.removeItem(this.favoritesKey);
    } catch (error) {
      console.error('Error resetting to default:', error);
    }
  }
}

export const adhkarService = new AdhkarService();