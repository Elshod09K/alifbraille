/**
 * Curated educational presets for AlifBraille.
 * Features authentic Uzbek Latin texts including the State Anthem,
 * national high school exam questions, and orthographic practice passages.
 */

import type { PresetItem } from './types.js';

export const PRESETS: PresetItem[] = [
  {
    id: 'anthem',
    title: 'O‘zbekiston Respublikasi Davlat Madhiyasi',
    titleEn: 'State Anthem of Uzbekistan',
    category: 'anthem',
    description: 'Uzbekistan National Anthem (lyrics by Abdulla Oripov) with official Latin orthography',
    text: `Serquyosh, hur o‘lkam, elga baxt, najot,
Sen o‘zing do‘stlarga yo‘ldosh, mehribon!
Yashnagay to abad ilmu fan, ijod,
Shuhrating porlasin toki bor jahon!

Oltin bu vodiylar — jon O‘zbekiston,
Ajdodlar mardona ruhi senga yor!
Ulug‘ xalq qudrati jo‘sh urgan zamon,
Olamni mahliyo aylagan diyor!`,
  },
  {
    id: 'history-exam',
    title: 'Davlat Imtihoni: Tarix va Konstitutsiya',
    titleEn: 'State Exam: History & Constitution',
    category: 'exam',
    description: 'High School History & Constitution State Exam Question featuring digraphs and modified letters',
    text: `O‘zbekiston Respublikasi Konstitutsiyasi 1992-yil 8-dekabrda qabul qilingan. Konstitutsiyaning bosh maqsadi — inson qadri, huquqlari va erkinliklarini kafolatlash, mustaqil demokratik davlat va fuqarolik jamiyatini rivojlantirishdan iboratdir.`,
  },
  {
    id: 'orthography-practice',
    title: 'Imlo Mashqi: Maxsus Harflar va Qo‘shma Tovushlar',
    titleEn: 'Orthography Drill: Special Letters & Digraphs',
    category: 'practice',
    description: 'Targeted orthography drill exercising modified letters (o‘, g‘) and digraphs (sh, ch, ng)',
    text: `G‘afur va O‘tkir shahar bog‘ida sho‘rva va go‘shtli manti tanovul qilishdi. Yangi o‘quv yilida yoshlar chuqur bilim olishga intilmoqdalar.`,
  },
  {
    id: 'math-formula',
    title: 'Matematika: Raqamlar va Misollar',
    titleEn: 'Mathematics: Numbers & Equations',
    category: 'practice',
    description: 'Numerical practice testing Braille number prefix (dots 3-4-5-6)',
    text: `2024 va 2025-yillar oralig‘ida 15 ta maktabda 360 nafar o‘quvchi ta’lim oldi. 12 + 34 = 46.`,
  },
  {
    id: 'literature-sample',
    title: 'Adabiyot: Abdulla Qodiriy — O‘tkan Kunlar',
    titleEn: 'Literature: Abdulla Qodiriy — O‘tkan Kunlar',
    category: 'literature',
    description: 'Classic high school Uzbek Latin literature excerpt with authentic orthography',
    text: `1264-yil qamariy, dalv oyining o‘n yettisida Toshkentning O‘ratepa darvozasidan bir otliq kirdi. U qosh-ko‘zlari qora, kiyinishi xushbichim yigit edi.`,
  },
  {
    id: 'state-entrance-exam-10q',
    title: 'Davlat Imtihoni: 10 ta Test Savoli (Standart Format)',
    titleEn: 'State Entrance Exam: 10-Question Standardized Format',
    category: 'exam',
    description: '10-question standardized state university entrance examination template with tactile question dividers and multiple-choice options',
    text: `DAVLAT TEST MARKAZI (DTM) — ONA TILI VA ADABIYOT
=== 1-SAVOL ===
O‘zbek adabiy tilining asoschisi kim?
A) Abdulla Qodiriy
B) Alisher Navoiy
C) Zahiriddin Muhammad Bobur
D) Cho‘lpon

=== 2-SAVOL ===
Qaysi so‘zda "g‘" maxsus harfi to‘g‘ri qo‘llangan?
A) bog‘bon
B) bagbon
C) bogbon
D) boxbon

=== 3-SAVOL ===
Quyidagi so‘zlardan qaysi biri qo‘shma so‘z hisoblanadi?
A) o‘qituvchi
B) gulzor
C) ko‘zoynak
D) bolalar

=== 4-SAVOL ===
"Serquyosh, hur o‘lkam..." misrasi qaysi asardan olingan?
A) O‘tkan kunlar
B) Davlat Madhiyasi
C) Boburnoma
D) Xamsa

=== 5-SAVOL ===
Qaysi javobda "sh" va "ch" tovushlari qatnashgan so‘z berilgan?
A) shoshilinch
B) shahar
C) chiroq
D) shodlik

--- SAHIFA 2: 6-10 SAVOLLAR ---
=== 6-SAVOL ===
"O‘quvchilar chuqur bilim olishmoqda." Ushbu gapda nechta so‘z bor?
A) 3 ta
B) 4 ta
C) 5 ta
D) 6 ta

=== 7-SAVOL ===
O‘zbekiston Respublikasi Konstitutsiyasi nechanchi yilda qabul qilingan?
A) 1991-yil
B) 1992-yil
C) 1993-yil
D) 1994-yil

=== 8-SAVOL ===
Quyidagilardan qaysi biri undosh tovush hisoblanadi?
A) o‘
B) a
C) g‘
D) i

=== 9-SAVOL ===
"Kitob — bilim manbai." Ushbu gapning egasi qaysi so‘z?
A) manbai
B) bilim
C) kitob
D) manba

=== 10-SAVOL ===
Matematik ifoda natijasini toping: 25 + 15 = ?
A) 30
B) 35
C) 40
D) 45`,
  },
];
