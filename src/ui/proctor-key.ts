/**
 * Downloadable Sighted Proctor Answer Key Overlay & Generator.
 * Enables non-Braille-reading examination supervisors and proctors
 * to verify blind student answer sheets during standardized university entrance exams
 * by cross-referencing Latin text, Braille cell numbers, and 6-dot matrix patterns.
 */

export interface ProctorQuestion {
  number: number;
  subjectUz: string;
  subjectEn: string;
  questionUz: string;
  questionEn: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  answerTextUz: string;
  answerTextEn: string;
  optionBrailleChar: string;
  optionBrailleDots: string;
  cellPositionUz: string;
  cellPositionEn: string;
  charBreakdown: Array<{
    char: string;
    braille: string;
    dots: string;
  }>;
  proctorTipUz: string;
  proctorTipEn: string;
}

export const STATE_EXAM_PROCTOR_DATA: ProctorQuestion[] = [
  {
    number: 1,
    subjectUz: 'Ona tili va Adabiyot',
    subjectEn: 'Native Language & Literature',
    questionUz: 'O‘zbek adabiy tilining asoschisi kim?',
    questionEn: 'Who is the founder of the Uzbek literary language?',
    correctOption: 'B',
    answerTextUz: 'Alisher Navoiy',
    answerTextEn: 'Alisher Navoiy',
    optionBrailleChar: '⠃',
    optionBrailleDots: '1, 2-nuqtalar',
    cellPositionUz: '4-qator, 1–2 kataklar (⠠⠃⠐)',
    cellPositionEn: 'Line 4, Cells 1–2 (⠠⠃⠐)',
    charBreakdown: [
      { char: 'A', braille: '⠁', dots: '1' },
      { char: 'l', braille: '⠇', dots: '1-2-3' },
      { char: 'i', braille: '⠊', dots: '2-4' },
      { char: 'sh', braille: '⠱', dots: '1-4-6 (digraf sh)' },
      { char: 'e', braille: '⠑', dots: '1-5' },
      { char: 'r', braille: '⠗', dots: '1-2-3-5' },
      { char: 'N', braille: '⠝', dots: '1-3-4-5' },
      { char: 'a', braille: '⠁', dots: '1' },
      { char: 'v', braille: '⠺', dots: '2-4-5-6' },
      { char: 'o', braille: '⠕', dots: '1-3-5' },
      { char: 'i', braille: '⠊', dots: '2-4' },
      { char: 'y', braille: '⠽', dots: '1-3-4-5-6' },
    ],
    proctorTipUz: 'Katakcha 1-2 nuqtalari (⠃) bilan boshlanadi. "sh" harfi 1-4-6 (⠱) bitta katakda joylashgan.',
    proctorTipEn: 'Cell begins with dots 1-2 (⠃). Note the digraph "sh" is a single tactile cell with dots 1-4-6 (⠱).',
  },
  {
    number: 2,
    subjectUz: 'Imlo va Grafika',
    subjectEn: 'Orthography & Phonetics',
    questionUz: 'Qaysi so‘zda "g‘" maxsus harfi to‘g‘ri qo‘llangan?',
    questionEn: 'In which word is the special letter "g‘" correctly applied?',
    correctOption: 'A',
    answerTextUz: 'bog‘bon',
    answerTextEn: 'bog‘bon',
    optionBrailleChar: '⠁',
    optionBrailleDots: '1-nuqta',
    cellPositionUz: '8-qator, 1–2 kataklar (⠠⠁⠐)',
    cellPositionEn: 'Line 8, Cells 1–2 (⠠⠁⠐)',
    charBreakdown: [
      { char: 'b', braille: '⠃', dots: '1-2' },
      { char: 'o', braille: '⠕', dots: '1-3-5' },
      { char: 'g‘', braille: '⠹', dots: '1-2-5-6 (maxsus g‘)' },
      { char: 'b', braille: '⠃', dots: '1-2' },
      { char: 'o', braille: '⠕', dots: '1-3-5' },
      { char: 'n', braille: '⠝', dots: '1-3-4-5' },
    ],
    proctorTipUz: 'To‘g‘ri javob A (1-nuqta). "g‘" harfi 1-2-5-6 (⠹) bitta katakda ifodalangan.',
    proctorTipEn: 'Correct answer A (dot 1). The special Uzbek letter "g‘" is encoded as single cell dots 1-2-5-6 (⠹).',
  },
  {
    number: 3,
    subjectUz: 'Morfologiya',
    subjectEn: 'Morphology',
    questionUz: 'Quyidagi so‘zlardan qaysi biri qo‘shma so‘z hisoblanadi?',
    questionEn: 'Which of the following words is a compound word?',
    correctOption: 'C',
    answerTextUz: 'ko‘zoynak',
    answerTextEn: 'ko‘zoynak',
    optionBrailleChar: '⠉',
    optionBrailleDots: '1, 4-nuqtalar',
    cellPositionUz: '13-qator, 1–2 kataklar (⠠⠉⠐)',
    cellPositionEn: 'Line 13, Cells 1–2 (⠠⠉⠐)',
    charBreakdown: [
      { char: 'k', braille: '⠅', dots: '1-3' },
      { char: 'o‘', braille: '⠪', dots: '2-4-6 (maxsus o‘)' },
      { char: 'z', braille: '⠵', dots: '1-3-5-6' },
      { char: 'o', braille: '⠕', dots: '1-3-5' },
      { char: 'y', braille: '⠽', dots: '1-3-4-5-6' },
      { char: 'n', braille: '⠝', dots: '1-3-4-5' },
      { char: 'a', braille: '⠁', dots: '1' },
      { char: 'k', braille: '⠅', dots: '1-3' },
    ],
    proctorTipUz: 'To‘g‘ri javob C (1-4 nuqtalar). "o‘" harfi 2-4-6 (⠪) katakchasiga ega.',
    proctorTipEn: 'Correct answer C (dots 1-4). "o‘" is encoded as cell dots 2-4-6 (⠪).',
  },
  {
    number: 4,
    subjectUz: 'Davlat Ramzlari',
    subjectEn: 'National Symbols',
    questionUz: '"Serquyosh, hur o‘lkam..." misrasi qaysi asardan olingan?',
    questionEn: 'From which work is the line "Serquyosh, hur o‘lkam..." taken?',
    correctOption: 'B',
    answerTextUz: 'Davlat Madhiyasi',
    answerTextEn: 'Davlat Madhiyasi',
    optionBrailleChar: '⠃',
    optionBrailleDots: '1, 2-nuqtalar',
    cellPositionUz: '17-qator, 1–2 kataklar (⠠⠃⠐)',
    cellPositionEn: 'Line 17, Cells 1–2 (⠠⠃⠐)',
    charBreakdown: [
      { char: 'D', braille: '⠙', dots: '1-4-5' },
      { char: 'a', braille: '⠁', dots: '1' },
      { char: 'v', braille: '⠺', dots: '2-4-5-6' },
      { char: 'l', braille: '⠇', dots: '1-2-3' },
      { char: 'a', braille: '⠁', dots: '1' },
      { char: 't', braille: '⠞', dots: '2-3-4-5' },
    ],
    proctorTipUz: 'To‘g‘ri javob B (1-2 nuqtalar). Matn boshida bosh harf belgisi (⠠) mavjud.',
    proctorTipEn: 'Correct answer B (dots 1-2). Capital indicator (⠠) precedes the first word.',
  },
  {
    number: 5,
    subjectUz: 'Fonetika va Digraflar',
    subjectEn: 'Phonetics & Digraphs',
    questionUz: 'Qaysi javobda "sh" va "ch" tovushlari qatnashgan so‘z berilgan?',
    questionEn: 'Which answer contains a word with both "sh" and "ch" sounds?',
    correctOption: 'A',
    answerTextUz: 'shoshilinch',
    answerTextEn: 'shoshilinch',
    optionBrailleChar: '⠁',
    optionBrailleDots: '1-nuqta',
    cellPositionUz: '21-qator, 1–2 kataklar (⠠⠁⠐)',
    cellPositionEn: 'Line 21, Cells 1–2 (⠠⠁⠐)',
    charBreakdown: [
      { char: 'sh', braille: '⠱', dots: '1-4-6 (sh)' },
      { char: 'o', braille: '⠕', dots: '1-3-5' },
      { char: 'sh', braille: '⠱', dots: '1-4-6 (sh)' },
      { char: 'i', braille: '⠊', dots: '2-4' },
      { char: 'l', braille: '⠇', dots: '1-2-3' },
      { char: 'i', braille: '⠊', dots: '2-4' },
      { char: 'n', braille: '⠝', dots: '1-3-4-5' },
      { char: 'ch', braille: '⠟', dots: '1-2-3-4-6 (ch)' },
    ],
    proctorTipUz: 'To‘g‘ri javob A (1-nuqta). "sh" (⠱) va so‘nggi "ch" (⠟) alohida 6-nuqtali katakchalardir.',
    proctorTipEn: 'Correct answer A (dot 1). "sh" (⠱) and trailing "ch" (⠟) are single 6-dot digraph cells.',
  },
  {
    number: 6,
    subjectUz: 'Sintaksis & Gap Bo‘laklari',
    subjectEn: 'Syntax & Sentence Structure',
    questionUz: '"O‘quvchilar chuqur bilim olishmoqda." Ushbu gapda nechta so‘z bor?',
    questionEn: '"O‘quvchilar chuqur bilim olishmoqda." How many words are in this sentence?',
    correctOption: 'B',
    answerTextUz: '4 ta',
    answerTextEn: '4 ta',
    optionBrailleChar: '⠃',
    optionBrailleDots: '1, 2-nuqtalar',
    cellPositionUz: '26-qator, 1–2 kataklar (⠠⠃⠐)',
    cellPositionEn: 'Line 26, Cells 1–2 (⠠⠃⠐)',
    charBreakdown: [
      { char: '#', braille: '⠼', dots: '3-4-5-6 (raqam belgisi)' },
      { char: '4', braille: '⠙', dots: '1-4-5' },
      { char: 't', braille: '⠞', dots: '2-3-4-5' },
      { char: 'a', braille: '⠁', dots: '1' },
    ],
    proctorTipUz: 'To‘g‘ri javob B (1-2 nuqtalar). Raqam oldidan doimo ⠼ prefiksi keladi.',
    proctorTipEn: 'Correct answer B (dots 1-2). Digits are always prefixed by Braille numeral sign ⠼.',
  },
  {
    number: 7,
    subjectUz: 'O‘zbekiston Tarixi',
    subjectEn: 'History of Uzbekistan',
    questionUz: 'O‘zbekiston Respublikasi Konstitutsiyasi nechanchi yilda qabul qilingan?',
    questionEn: 'In what year was the Constitution of Uzbekistan adopted?',
    correctOption: 'B',
    answerTextUz: '1992-yil',
    answerTextEn: '1992-yil',
    optionBrailleChar: '⠃',
    optionBrailleDots: '1, 2-nuqtalar',
    cellPositionUz: '30-qator, 1–2 kataklar (⠠⠃⠐)',
    cellPositionEn: 'Line 30, Cells 1–2 (⠠⠃⠐)',
    charBreakdown: [
      { char: '#', braille: '⠼', dots: '3-4-5-6' },
      { char: '1', braille: '⠁', dots: '1' },
      { char: '9', braille: '⠊', dots: '2-4' },
      { char: '9', braille: '⠊', dots: '2-4' },
      { char: '2', braille: '⠃', dots: '1-2' },
      { char: '-', braille: '⠤', dots: '3-6' },
      { char: 'y', braille: '⠽', dots: '1-3-4-5-6' },
      { char: 'i', braille: '⠊', dots: '2-4' },
      { char: 'l', braille: '⠇', dots: '1-2-3' },
    ],
    proctorTipUz: 'To‘g‘ri javob B (1-2 nuqtalar). 1992 soni ⠼⠁⠊⠊⠃ katakchalari bilan berilgan.',
    proctorTipEn: 'Correct answer B (dots 1-2). The year 1992 is written as ⠼⠁⠊⠊⠃.',
  },
  {
    number: 8,
    subjectUz: 'Fonetika: Undoshlar',
    subjectEn: 'Phonetics: Consonants',
    questionUz: 'Quyidagilardan qaysi biri undosh tovush hisoblanadi?',
    questionEn: 'Which of the following sounds is a consonant?',
    correctOption: 'C',
    answerTextUz: 'g‘',
    answerTextEn: 'g‘',
    optionBrailleChar: '⠉',
    optionBrailleDots: '1, 4-nuqtalar',
    cellPositionUz: '35-qator, 1–2 kataklar (⠠⠉⠐)',
    cellPositionEn: 'Line 35, Cells 1–2 (⠠⠉⠐)',
    charBreakdown: [{ char: 'g‘', braille: '⠹', dots: '1-2-5-6' }],
    proctorTipUz: 'To‘g‘ri javob C (1-4 nuqtalar). Undosh g‘ tovushi 1-2-5-6 (⠹) katakchasidir.',
    proctorTipEn: 'Correct answer C (dots 1-4). Consonant g‘ is single tactile cell 1-2-5-6 (⠹).',
  },
  {
    number: 9,
    subjectUz: 'Sintaksis: Gap Egasi',
    subjectEn: 'Syntax: Sentence Subject',
    questionUz: '"Kitob — bilim manbai." Ushbu gapning egasi qaysi so‘z?',
    questionEn: '"Kitob — bilim manbai." What is the subject of this sentence?',
    correctOption: 'C',
    answerTextUz: 'kitob',
    answerTextEn: 'kitob',
    optionBrailleChar: '⠉',
    optionBrailleDots: '1, 4-nuqtalar',
    cellPositionUz: '39-qator, 1–2 kataklar (⠠⠉⠐)',
    cellPositionEn: 'Line 39, Cells 1–2 (⠠⠉⠐)',
    charBreakdown: [
      { char: 'k', braille: '⠅', dots: '1-3' },
      { char: 'i', braille: '⠊', dots: '2-4' },
      { char: 't', braille: '⠞', dots: '2-3-4-5' },
      { char: 'o', braille: '⠕', dots: '1-3-5' },
      { char: 'b', braille: '⠃', dots: '1-2' },
    ],
    proctorTipUz: 'To‘g‘ri javob C (1-4 nuqtalar). "kitob" so‘zi ⠅⠊⠞⠕⠃ katakchalaridan iborat.',
    proctorTipEn: 'Correct answer C (dots 1-4). Word "kitob" is formed of cells ⠅⠊⠞⠕⠃.',
  },
  {
    number: 10,
    subjectUz: 'Matematika & Hisob',
    subjectEn: 'Mathematics & Calculation',
    questionUz: 'Matematik ifoda natijasini toping: 25 + 15 = ?',
    questionEn: 'Find the result of the mathematical expression: 25 + 15 = ?',
    correctOption: 'C',
    answerTextUz: '40',
    answerTextEn: '40',
    optionBrailleChar: '⠉',
    optionBrailleDots: '1, 4-nuqtalar',
    cellPositionUz: '43-qator, 1–2 kataklar (⠠⠉⠐)',
    cellPositionEn: 'Line 43, Cells 1–2 (⠠⠉⠐)',
    charBreakdown: [
      { char: '#', braille: '⠼', dots: '3-4-5-6' },
      { char: '4', braille: '⠙', dots: '1-4-5' },
      { char: '0', braille: '⠚', dots: '2-4-5' },
    ],
    proctorTipUz: 'To‘g‘ri javob C (1-4 nuqtalar). 40 soni ⠼⠙⠚ (prefiks + 4 + 0) ko‘rinishida berilgan.',
    proctorTipEn: 'Correct answer C (dots 1-4). Number 40 is written as ⠼⠙⠚ (prefix + 4 + 0).',
  },
];

export interface ProctorKeyInstance {
  open(): void;
  close(): void;
  setLang(lang: 'uz' | 'en'): void;
  downloadKey(): void;
  printKey(): void;
  destroy(): void;
}

/**
 * Generates standalone printable HTML for the Sighted Proctor Answer Key.
 */
export function generateProctorKeyHtml(lang: 'uz' | 'en' = 'uz'): string {
  const isEn = lang === 'en';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${isEn ? 'AlifBraille - Sighted Proctor Answer Key (10-Question State Exam)' : 'AlifBraille - Nazoratchi Javoblar Kaliti (Davlat Imtihoni 10-Savol)'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 24px; color: #0f172a; line-height: 1.5; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
    h1 { font-size: 20px; margin: 0 0 6px 0; color: #0f172a; }
    .meta { font-size: 13px; color: #475569; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #1e293b; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top; }
    tr:nth-child(even) { background: #f8fafc; }
    .cell-opt { font-weight: bold; font-size: 15px; color: #0284c7; }
    .braille-char { font-size: 20px; font-family: monospace; display: inline-block; margin-right: 4px; }
    .tip { font-size: 12px; color: #475569; margin-top: 4px; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
    @media print {
      body { margin: 10mm; font-size: 11px; }
      th, td { padding: 5px 6px; }
      .braille-char { font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">${isEn ? 'SXSW EDU Impact Challenge • Sighted Proctor Sheet' : 'Davlat Imtihoni • Ko‘zi Ochiq Nazoratchi Shiti'}</span>
    <h1>${isEn ? '📋 Sighted Proctor Answer Key: 10-Question State Entrance Exam' : '📋 Nazoratchi Javoblar Kaliti: 10 ta Savolli Davlat Kirish Imtihoni'}</h1>
    <div class="meta">${isEn ? 'Universal Marburg standard cross-reference for non-Braille-reading test supervisors. Matches official DTM exam format.' : 'Ko‘rishida nuqsoni bo‘lmagan imtihon nazoratchilari uchun lotin matni va Brayl katakchalari mosligi jadvali.'}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 6%;">#</th>
        <th style="width: 28%;">${isEn ? 'Question & Subject' : 'Savol va Fan'}</th>
        <th style="width: 22%;">${isEn ? 'Correct Answer (Latin)' : 'To‘g‘ri Javob (Lotin)'}</th>
        <th style="width: 18%;">${isEn ? 'Braille Option & Cell' : 'Brayl Javob Katakchasi'}</th>
        <th style="width: 26%;">${isEn ? 'Proctor Verification Guide' : 'Nazoratchi uchun Yo‘riqnoma'}</th>
      </tr>
    </thead>
    <tbody>
      ${STATE_EXAM_PROCTOR_DATA.map((q) => {
        const qTitle = isEn ? q.questionEn : q.questionUz;
        const subj = isEn ? q.subjectEn : q.subjectUz;
        const ans = isEn ? q.answerTextEn : q.answerTextUz;
        const tip = isEn ? q.proctorTipEn : q.proctorTipUz;
        const pos = isEn ? q.cellPositionEn : q.cellPositionUz;
        return `
        <tr>
          <td><strong>${q.number}</strong></td>
          <td>
            <strong>${subj}</strong><br>
            ${qTitle}
          </td>
          <td>
            <span class="cell-opt">${q.correctOption})</span> <strong>${ans}</strong>
          </td>
          <td>
            <span class="braille-char">${q.optionBrailleChar}</span> (${q.optionBrailleDots})<br>
            <small style="color: #64748b;">${pos}</small>
          </td>
          <td>
            <div class="tip">${tip}</div>
          </td>
        </tr>
      `;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <strong>AlifBraille Tactile Bridge</strong> • Tashkent, Uzbekistan • Free &amp; open source (MIT) • Creator: Elshod Kenjayev (@Elshod09K)
  </div>
</body>
</html>`;
}

/**
 * Initializes the accessible Sighted Proctor Answer Key modal and overlay controller.
 */
export function initProctorKeyModal(root: HTMLElement): ProctorKeyInstance {
  let currentLang: 'uz' | 'en' = 'uz';

  let modalEl = root.querySelector<HTMLDialogElement>('#proctor-key-modal');
  if (!modalEl) {
    modalEl = document.createElement('dialog');
    modalEl.id = 'proctor-key-modal';
    modalEl.className = 'impact-modal proctor-key-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'proctor-key-modal-title');
    root.appendChild(modalEl);
  }

  function renderModalContent(): void {
    if (!modalEl) return;
    const isEn = currentLang === 'en';

    modalEl.innerHTML = `
      <div class="modal-dialog-content">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h2 id="proctor-key-modal-title" class="modal-title">
              📋 ${isEn ? 'Sighted Proctor Answer Key (10-Question State Exam)' : 'Nazoratchi Javoblar Kaliti (Davlat Imtihoni 10 ta Savol)'}
            </h2>
            <span class="modal-badge">${isEn ? 'Non-Braille-Reading Proctor Cross-Reference' : 'Ko‘zi ochiq imtihon nazoratchilari uchun qo‘llanma'}</span>
          </div>
          <button id="proctor-modal-close-btn" class="modal-close-btn" type="button" aria-label="${isEn ? 'Close proctor key (Esc)' : 'Kalitni yopish (Esc)'}">✕</button>
        </div>

        <div class="modal-body" style="padding: 1.25rem 1.5rem; overflow-y: auto; max-height: calc(88vh - 140px);">
          <div class="proctor-intro-banner" style="background: rgba(2, 132, 199, 0.12); border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 6px; margin-bottom: 1.25rem;">
            <p style="margin: 0; font-size: 0.95rem; line-height: 1.5;">
              ${
                isEn
                  ? '<strong>For Sighted Test Proctors:</strong> Blind students read tactile swell-paper test sheets during university entrance examinations. This key prints standard Uzbek Latin text side-by-side with Braille cell numbers, line positions, and dot configurations so non-Braille-reading proctors can verify student answers with 100% certainty.'
                  : '<strong>Ko‘zi ochiq nazoratchilar uchun:</strong> Ko‘rishida nuqsoni bo‘lgan o‘quvchilar oliygoh kirish imtihonlarida taktil Brayl varaqlaridan foydalanishadi. Ushbu kalit lotin yozuvidagi savollarni Brayl katakchalari raqamlari va nuqtalar tartibi bilan yonma-yon ko‘rsatib, Brayl o‘qiy olmaydigan nazoratchilarga ham tekshirish imkonini beradi.'
              }
            </p>
          </div>

          <div class="proctor-actions-bar" style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
            <button id="download-proctor-doc-btn" class="toggle-button" type="button" style="background: #0284c7; color: #ffffff; border-color: #0284c7; font-weight: bold;">
              ⬇️ ${isEn ? 'Download Printable Key (.HTML)' : 'Javoblar Kalitini Yuklab Olish (.HTML)'}
            </button>
            <button id="print-proctor-doc-btn" class="toggle-button" type="button">
              🖨️ ${isEn ? 'Print Proctor Key' : 'Kalitni Chop Etish'}
            </button>
          </div>

          <div class="proctor-table-wrap" style="overflow-x: auto;">
            <table class="proctor-key-table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
              <thead>
                <tr style="background: var(--color-bg-elevated); border-bottom: 2px solid var(--color-border);">
                  <th style="padding: 10px; text-align: left; width: 6%;">#</th>
                  <th style="padding: 10px; text-align: left; width: 30%;">${isEn ? 'Latin Prompt & Subject' : 'Lotin Savoli va Fani'}</th>
                  <th style="padding: 10px; text-align: left; width: 22%;">${isEn ? 'Correct Latin Answer' : 'To‘g‘ri Javob (Lotin)'}</th>
                  <th style="padding: 10px; text-align: left; width: 18%;">${isEn ? 'Braille Cell (Dots)' : 'Brayl Katakchasi (Nuqtalar)'}</th>
                  <th style="padding: 10px; text-align: left; width: 24%;">${isEn ? 'Proctor Inspection Guide' : 'Nazorat Ko‘rsatmasi'}</th>
                </tr>
              </thead>
              <tbody>
                ${STATE_EXAM_PROCTOR_DATA.map((q) => {
                  const qText = isEn ? q.questionEn : q.questionUz;
                  const subj = isEn ? q.subjectEn : q.subjectUz;
                  const ans = isEn ? q.answerTextEn : q.answerTextUz;
                  const tip = isEn ? q.proctorTipEn : q.proctorTipUz;
                  const pos = isEn ? q.cellPositionEn : q.cellPositionUz;
                  return `
                    <tr style="border-bottom: 1px solid var(--color-border);">
                      <td style="padding: 10px; font-weight: bold;">${q.number}</td>
                      <td style="padding: 10px;">
                        <span style="font-size: 0.8rem; color: var(--color-accent); font-weight: bold; text-transform: uppercase;">${subj}</span><br>
                        <strong>${qText}</strong>
                      </td>
                      <td style="padding: 10px;">
                        <span style="font-weight: 800; font-size: 1.1rem; color: #0284c7;">${q.correctOption})</span> <strong>${ans}</strong>
                      </td>
                      <td style="padding: 10px;">
                        <div style="font-size: 1.5rem; font-family: monospace; line-height: 1;">${q.optionBrailleChar}</div>
                        <div style="font-size: 0.82rem; color: var(--color-text-muted);">${q.optionBrailleDots}</div>
                        <div style="font-size: 0.78rem; color: #059669; font-weight: bold;">${pos}</div>
                      </td>
                      <td style="padding: 10px; font-size: 0.85rem; line-height: 1.4;">
                        ${tip}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 2px solid var(--color-border); display: flex; justify-content: flex-end;">
          <button id="proctor-footer-close-btn" class="toggle-button" type="button">
            ${isEn ? 'Close' : 'Yopish'}
          </button>
        </div>
      </div>
    `;

    // Wire listeners
    modalEl.querySelector('#proctor-modal-close-btn')?.addEventListener('click', () => close());
    modalEl.querySelector('#proctor-footer-close-btn')?.addEventListener('click', () => close());
    modalEl.querySelector('#download-proctor-doc-btn')?.addEventListener('click', () => downloadKey());
    modalEl.querySelector('#print-proctor-doc-btn')?.addEventListener('click', () => printKey());
  }

  function open(): void {
    if (!modalEl) return;
    renderModalContent();

    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    }

    if (typeof modalEl.showModal === 'function') {
      try {
        modalEl.showModal();
      } catch {
        modalEl.setAttribute('open', 'true');
      }
    } else {
      modalEl.setAttribute('open', 'true');
    }
    modalEl.classList.add('is-open');

    const closeBtn = modalEl.querySelector<HTMLButtonElement>('#proctor-modal-close-btn');
    closeBtn?.focus();
  }

  function close(): void {
    if (!modalEl) return;

    if (typeof document !== 'undefined') {
      const otherModalsOpen =
        document.querySelector('#braille-quiz-modal[open], #about-creator-modal[open], #swell-tour-modal[open]');
      if (!otherModalsOpen) {
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
      }
    }

    if (typeof modalEl.close === 'function') {
      try {
        modalEl.close();
      } catch {
        modalEl.removeAttribute('open');
      }
    } else {
      modalEl.removeAttribute('open');
    }
    modalEl.classList.remove('is-open');

    // Return focus to proctor key trigger button if present
    const triggerBtn = root.querySelector<HTMLButtonElement>('#proctor-key-btn');
    triggerBtn?.focus();
  }

  function setLang(lang: 'uz' | 'en'): void {
    currentLang = lang;
    if (modalEl && (modalEl.hasAttribute('open') || modalEl.classList.contains('is-open'))) {
      renderModalContent();
    }
  }

  function downloadKey(): void {
    const htmlContent = generateProctorKeyHtml(currentLang);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alifbraille-proctor-answer-key-10q-${currentLang}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printKey(): void {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      try {
        window.print();
      } catch {}
    }
  }

  function destroy(): void {
    if (modalEl && modalEl.parentNode) {
      modalEl.parentNode.removeChild(modalEl);
    }
  }

  return {
    open,
    close,
    setLang,
    downloadKey,
    printKey,
    destroy,
  };
}
