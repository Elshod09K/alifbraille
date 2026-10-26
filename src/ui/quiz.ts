/**
 * Reverse Quiz & Two-Way Braille Verification Controller for AlifBraille.
 * Empowers sighted teachers to learn fundamental 6-dot Braille reading alongside their students
 * and test transcription accuracy in reverse (Braille -> Latin).
 */

import { BRAILLE_MAP, BRAILLE_NUMBER_PREFIX } from '../braille.js';
import type { ISpeechController } from '../audio/types.js';

export interface QuizCard {
  id: string;
  char: string;
  braille: string;
  activeDots: number[];
  category: 'special' | 'core' | 'digit' | 'all';
  options: string[];
  explanationUz: string;
  explanationEn: string;
}

export interface DotDecodeResult {
  char: string;
  braille: string;
  dotNumbers: number[];
  descriptionUz: string;
  descriptionEn: string;
  isRegistered: boolean;
}

/**
 * Inverted 6-dot Braille character map for Uzbek Latin transliteration.
 */
export const REVERSE_BRAILLE_MAP: Readonly<Record<string, { char: string; nameUz: string; nameEn: string }>> = Object.freeze({
  '⠁': { char: 'a', nameUz: 'A harfi (1-raqam bilan ham bir xil)', nameEn: 'Letter A (also numeral 1 with prefix)' },
  '⠃': { char: 'b', nameUz: 'B harfi', nameEn: 'Letter B (numeral 2)' },
  '⠉': { char: 'c', nameUz: 'C harfi (ch yoki o‘zlashma so‘zlarda)', nameEn: 'Letter C' },
  '⠙': { char: 'd', nameUz: 'D harfi', nameEn: 'Letter D (numeral 4)' },
  '⠑': { char: 'e', nameUz: 'E harfi', nameEn: 'Letter E (numeral 5)' },
  '⠋': { char: 'f', nameUz: 'F harfi', nameEn: 'Letter F (numeral 6)' },
  '⠛': { char: 'g', nameUz: 'G harfi', nameEn: 'Letter G (numeral 7)' },
  '⠓': { char: 'h', nameUz: 'H harfi', nameEn: 'Letter H (numeral 8)' },
  '⠊': { char: 'i', nameUz: 'I harfi', nameEn: 'Letter I (numeral 9)' },
  '⠚': { char: 'j', nameUz: 'J harfi', nameEn: 'Letter J (numeral 0)' },
  '⠅': { char: 'k', nameUz: 'K harfi', nameEn: 'Letter K' },
  '⠇': { char: 'l', nameUz: 'L harfi', nameEn: 'Letter L' },
  '⠍': { char: 'm', nameUz: 'M harfi', nameEn: 'Letter M' },
  '⠝': { char: 'n', nameUz: 'N harfi', nameEn: 'Letter N' },
  '⠕': { char: 'o', nameUz: 'O harfi (oddiy unli)', nameEn: 'Letter O (plain vowel)' },
  '⠏': { char: 'p', nameUz: 'P harfi', nameEn: 'Letter P' },
  '⠟': { char: 'ch', nameUz: 'CH digrafi (va Q harfi)', nameEn: 'Digraph CH (and Q)' },
  '⠗': { char: 'r', nameUz: 'R harfi', nameEn: 'Letter R' },
  '⠎': { char: 's', nameUz: 'S harfi', nameEn: 'Letter S' },
  '⠞': { char: 't', nameUz: 'T harfi', nameEn: 'Letter T' },
  '⠥': { char: 'u', nameUz: 'U harfi', nameEn: 'Letter U' },
  '⠧': { char: 'o‘', nameUz: 'O‘ maxsus unlisi (1-2-3-6 nuqtalar)', nameEn: 'Special vowel O‘ (dots 1-2-3-6)' },
  '⠻': { char: 'g‘', nameUz: 'G‘ maxsus undoshi (1-2-4-5-6 nuqtalar)', nameEn: 'Special consonant G‘ (dots 1-2-4-5-6)' },
  '⠱': { char: 'sh', nameUz: 'SH digrafi (1-5-6 nuqtalar)', nameEn: 'Digraph SH (dots 1-5-6)' },
  '⠺': { char: 'v', nameUz: 'V harfi', nameEn: 'Letter V' },
  '⠭': { char: 'x', nameUz: 'X harfi', nameEn: 'Letter X' },
  '⠽': { char: 'y', nameUz: 'Y harfi', nameEn: 'Letter Y' },
  '⠵': { char: 'z', nameUz: 'Z harfi', nameEn: 'Letter Z' },
  '⠄': { char: '’', nameUz: 'Tutuq belgisi (apostrof, 3-nuqta)', nameEn: 'Tutuq belgisi (apostrophe, dot 3)' },
  '⠼': { char: '#', nameUz: 'Raqam belgisi (3-4-5-6 nuqtalar)', nameEn: 'Numeral sign prefix (dots 3-4-5-6)' },
  '⠲': { char: '.', nameUz: 'Nuqta (2-5-6 nuqtalar)', nameEn: 'Period (dots 2-5-6)' },
  '⠂': { char: ',', nameUz: 'Vergul (2-nuqta)', nameEn: 'Comma (dot 2)' },
  '⠦': { char: '?', nameUz: 'So‘roq belgisi (2-3-6 nuqtalar)', nameEn: 'Question mark (dots 2-3-6)' },
  '⠖': { char: '!', nameUz: 'Undov belgisi (2-3-5 nuqtalar)', nameEn: 'Exclamation mark (dots 2-3-5)' },
});

/**
 * Decodes a 6-boolean array of dot states [dot1..dot6] into an Uzbek character and description.
 */
export function decodeDotsToChar(dots: boolean[]): DotDecodeResult {
  const activeDotNumbers: number[] = [];
  let bitmask = 0;
  for (let i = 0; i < 6; i++) {
    if (dots[i]) {
      bitmask |= 1 << i;
      activeDotNumbers.push(i + 1);
    }
  }

  const brailleChar = String.fromCharCode(0x2800 + bitmask);
  const match = REVERSE_BRAILLE_MAP[brailleChar];

  if (match) {
    return {
      char: match.char,
      braille: brailleChar,
      dotNumbers: activeDotNumbers,
      descriptionUz: `${match.nameUz} (Nuqtalar: ${activeDotNumbers.join(', ') || 'yo‘q'})`,
      descriptionEn: `${match.nameEn} (Dots: ${activeDotNumbers.join(', ') || 'none'})`,
      isRegistered: true,
    };
  }

  return {
    char: brailleChar === '⠀' ? 'Bo‘shliq' : '?',
    braille: brailleChar,
    dotNumbers: activeDotNumbers,
    descriptionUz: activeDotNumbers.length > 0
      ? `Noma’lum kombinatsiya (${activeDotNumbers.join(', ')}-nuqtalar)`
      : 'Barcha nuqtalar o‘chiq',
    descriptionEn: activeDotNumbers.length > 0
      ? `Custom / unassigned combination (Dots ${activeDotNumbers.join(', ')})`
      : 'All dots inactive',
    isRegistered: false,
  };
}

/**
 * Educational flashcard pool designed for sighted teachers to learn Braille.
 */
export const QUIZ_FLASHCARDS: QuizCard[] = [
  // Special Uzbek letters & digraphs
  {
    id: 'spec-sh',
    char: 'sh',
    braille: '⠱',
    activeDots: [1, 5, 6],
    category: 'special',
    options: ['sh', 'ch', 's', 'h'],
    explanationUz: '⠱ belgisi Uzbek lotin alifbosidagi "sh" digrafi (1, 5, 6-nuqtalar).',
    explanationEn: '⠱ represents the Uzbek Latin digraph "sh" (dots 1, 5, 6).',
  },
  {
    id: 'spec-ch',
    char: 'ch',
    braille: '⠟',
    activeDots: [1, 2, 3, 4, 5],
    category: 'special',
    options: ['ch', 'sh', 'o‘', 'q'],
    explanationUz: '⠟ belgisi Uzbek lotin alifbosidagi "ch" digrafi (1, 2, 3, 4, 5-nuqtalar).',
    explanationEn: '⠟ represents the Uzbek Latin digraph "ch" (dots 1, 2, 3, 4, 5).',
  },
  {
    id: 'spec-oo',
    char: 'o‘',
    braille: '⠧',
    activeDots: [1, 2, 3, 6],
    category: 'special',
    options: ['o‘', 'o', 'g‘', 'u'],
    explanationUz: '⠧ belgisi Uzbek tilidagi maxsus "o‘" unlisini bildiradi (1, 2, 3, 6-nuqtalar).',
    explanationEn: '⠧ represents the unique Uzbek vowel "o‘" (dots 1, 2, 3, 6).',
  },
  {
    id: 'spec-gg',
    char: 'g‘',
    braille: '⠻',
    activeDots: [1, 2, 4, 5, 6],
    category: 'special',
    options: ['g‘', 'g', 'o‘', 'sh'],
    explanationUz: '⠻ belgisi Uzbek tilidagi maxsus "g‘" undoshini bildiradi (1, 2, 4, 5, 6-nuqtalar).',
    explanationEn: '⠻ represents the unique Uzbek velar consonant "g‘" (dots 1, 2, 4, 5, 6).',
  },
  {
    id: 'spec-tutuq',
    char: '’',
    braille: '⠄',
    activeDots: [3],
    category: 'special',
    options: ['’', '.', ',', 'i'],
    explanationUz: '⠄ belgisi Uzbek imlosidagi tutuq belgisi (apostrof, faqat 3-nuqta).',
    explanationEn: '⠄ represents the Uzbek tutuq belgisi / glottal stop (dot 3 only).',
  },
  {
    id: 'core-a',
    char: 'a',
    braille: '⠁',
    activeDots: [1],
    category: 'core',
    options: ['a', 'b', 'c', 'e'],
    explanationUz: '⠁ — Brayl alifbosining birinchi harfi "a" (faqat 1-nuqta).',
    explanationEn: '⠁ is letter "a" in Braille (dot 1 only).',
  },
  {
    id: 'core-b',
    char: 'b',
    braille: '⠃',
    activeDots: [1, 2],
    category: 'core',
    options: ['b', 'l', 'k', 'a'],
    explanationUz: '⠃ — "b" harfi (1 va 2-nuqtalar).',
    explanationEn: '⠃ is letter "b" (dots 1 and 2).',
  },
  {
    id: 'core-m',
    char: 'm',
    braille: '⠍',
    activeDots: [1, 3, 4],
    category: 'core',
    options: ['m', 'n', 'p', 'l'],
    explanationUz: '⠍ — "m" harfi (1, 3, 4-nuqtalar).',
    explanationEn: '⠍ is letter "m" (dots 1, 3, 4).',
  },
  {
    id: 'core-t',
    char: 't',
    braille: '⠞',
    activeDots: [2, 3, 4, 5],
    category: 'core',
    options: ['t', 's', 'r', 'd'],
    explanationUz: '⠞ — "t" harfi (2, 3, 4, 5-nuqtalar).',
    explanationEn: '⠞ is letter "t" (dots 2, 3, 4, 5).',
  },
  {
    id: 'core-num',
    char: '#',
    braille: '⠼',
    activeDots: [3, 4, 5, 6],
    category: 'digit',
    options: ['#', 'z', 'y', 'u'],
    explanationUz: '⠼ — Braylda keyingi belgilar raqam ekanligini bildiruvchi prefiks (3, 4, 5, 6-nuqtalar).',
    explanationEn: '⠼ is the Braille numeral prefix indicating digits follow (dots 3, 4, 5, 6).',
  },
];

export interface QuizModalHandle {
  open: () => void;
  close: () => void;
  destroy: () => void;
  setLang: (lang: 'uz' | 'en') => void;
}

/**
 * Initializes and binds the interactive Braille Quiz and Two-Way Verification Modal.
 */
export function initBrailleQuizModal(options: {
  root: HTMLElement;
  getSpeechController?: () => ISpeechController | null;
  getLang?: () => 'uz' | 'en';
}): QuizModalHandle {
  const { root, getSpeechController, getLang = () => 'uz' } = options;

  let currentLang = getLang();
  let currentCardIndex = 0;
  let correctCount = 0;
  let totalAnswered = 0;
  let answeredCurrent = false;

  // Inspector dot states: dots 1 through 6
  const inspectorDots: boolean[] = [false, false, false, false, false, false];

  // Strings dictionary
  const STRINGS = {
    uz: {
      modalTitle: '🎓 Brayl Viktorinasi va Ikki Tomonlama Tekshiruv',
      subtitle: 'Ko‘zi ojiz bo‘lmagan o‘qituvchilar uchun 6 nuqtali Braylni o‘rganish va tekshirish laboratoriyasi',
      tabQuiz: '📚 Brayl-Lotin Flashkardlar',
      tabInspector: '🔍 Interaktiv Nuqta Tekshiruvi',
      categoryLabel: 'Mavzu:',
      catAll: 'Barcha namunalar',
      catSpecial: 'Maxsus unlilar va digraflar (o‘, g‘, sh, ch)',
      catCore: 'Asosiy harflar',
      scoreText: (c: number, t: number, pct: number) => `Natija: ${c} / ${t} (${pct}%)`,
      questionText: 'Ushbu Brayl katakchasi qaysi harf yoki belgini bildiradi?',
      nextCardBtn: 'Keyingi savol ➔',
      correctFeedback: (exp: string) => `🎉 To‘g‘ri! ${exp}`,
      wrongFeedback: (ans: string, exp: string) => `❌ Noto‘g‘ri. To‘g‘ri javob: "${ans}". ${exp}`,
      inspectorHeading: '6 nuqtani bosing yoki 1-6 klavishlarini tering:',
      inspectorDotLabel: (n: number) => `${n}-nuqta`,
      inspectorResultLabel: 'Mos keluvchi lotin harfi:',
      pronounceBtn: '🔊 Ovozli eshitish',
      clearDotsBtn: 'Tozalash',
      closeBtn: 'Yopish (Esc)',
    },
    en: {
      modalTitle: '🎓 Braille Quiz & Two-Way Verification',
      subtitle: 'Reverse reading and interactive dot inspection tool for sighted teachers',
      tabQuiz: '📚 Braille-to-Latin Flashcards',
      tabInspector: '🔍 Interactive Dot Inspector',
      categoryLabel: 'Category:',
      catAll: 'All cards',
      catSpecial: 'Uzbek Special & Digraphs (o‘, g‘, sh, ch)',
      catCore: 'Core alphabet',
      scoreText: (c: number, t: number, pct: number) => `Score: ${c} / ${t} (${pct}%)`,
      questionText: 'Which Uzbek Latin character does this Braille cell represent?',
      nextCardBtn: 'Next Question ➔',
      correctFeedback: (exp: string) => `🎉 Correct! ${exp}`,
      wrongFeedback: (ans: string, exp: string) => `❌ Incorrect. Correct answer: "${ans}". ${exp}`,
      inspectorHeading: 'Click dots below or press number keys 1–6:',
      inspectorDotLabel: (n: number) => `Dot ${n}`,
      inspectorResultLabel: 'Corresponding Latin character:',
      pronounceBtn: '🔊 Pronounce',
      clearDotsBtn: 'Clear Dots',
      closeBtn: 'Close (Esc)',
    },
  };

  let modalEl = root.querySelector<HTMLDialogElement>('#braille-quiz-modal');
  if (!modalEl) {
    modalEl = document.createElement('dialog');
    modalEl.id = 'braille-quiz-modal';
    modalEl.className = 'quiz-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-labelledby', 'quiz-modal-title');
    root.appendChild(modalEl);
  }

  const renderModalDom = () => {
    const s = STRINGS[currentLang];
    modalEl!.innerHTML = `
      <div class="modal-dialog-content quiz-dialog-content">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <h2 id="quiz-modal-title" class="modal-title">${s.modalTitle}</h2>
            <span class="modal-badge">Teacher Learning & Verification</span>
          </div>
          <button id="quiz-modal-close-btn" class="modal-close-btn" type="button" aria-label="${s.closeBtn}">✕</button>
        </div>

        <p class="quiz-subtitle">${s.subtitle}</p>

        <div class="quiz-nav-tabs" role="tablist">
          <button id="quiz-tab-flashcards" class="quiz-tab active" role="tab" aria-selected="true" type="button">${s.tabQuiz}</button>
          <button id="quiz-tab-inspector" class="quiz-tab" role="tab" aria-selected="false" type="button">${s.tabInspector}</button>
        </div>

        <div class="quiz-tab-panels">
          <!-- PANEL 1: FLASHCARDS QUIZ -->
          <div id="quiz-panel-flashcards" class="quiz-panel active" role="tabpanel" aria-labelledby="quiz-tab-flashcards">
            <div class="quiz-toolbar">
              <div class="category-select-wrap">
                <label for="quiz-category-select"><strong>${s.categoryLabel}</strong></label>
                <select id="quiz-category-select" class="select-control">
                  <option value="all">${s.catAll}</option>
                  <option value="special">${s.catSpecial}</option>
                  <option value="core">${s.catCore}</option>
                </select>
              </div>
              <div id="quiz-score-badge" class="quiz-score-badge" aria-live="polite">
                ${s.scoreText(0, 0, 100)}
              </div>
            </div>

            <div class="flashcard-container">
              <div class="flashcard-braille-box" aria-hidden="true">
                <div id="flashcard-tactile-cell" class="quiz-tactile-cell"></div>
                <div id="flashcard-unicode-char" class="quiz-unicode-char">⠱</div>
              </div>

              <div class="flashcard-question-box">
                <p id="quiz-question-prompt" class="question-prompt"><strong>${s.questionText}</strong></p>
                <div id="quiz-options-grid" class="quiz-options-grid" role="group" aria-label="Javob variantlari"></div>
                <div id="quiz-feedback-box" class="quiz-feedback-box" aria-live="assertive"></div>
              </div>
            </div>

            <div class="quiz-action-bar">
              <button id="quiz-next-btn" class="toggle-button action-btn-next" type="button">${s.nextCardBtn}</button>
            </div>
          </div>

          <!-- PANEL 2: TWO-WAY INTERACTIVE DOT INSPECTOR -->
          <div id="quiz-panel-inspector" class="quiz-panel" role="tabpanel" aria-labelledby="quiz-tab-inspector" hidden>
            <p class="inspector-lead"><strong>${s.inspectorHeading}</strong></p>

            <div class="inspector-workspace">
              <!-- Interactive 6-dot matrix -->
              <div class="inspector-dot-matrix" role="group" aria-label="6 nuqtali Brayl matritsasi">
                <div class="dot-col">
                  <button type="button" class="matrix-dot-btn" data-dot="1" aria-label="1-nuqta (yuqori chap)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">1</span>
                  </button>
                  <button type="button" class="matrix-dot-btn" data-dot="2" aria-label="2-nuqta (o‘rta chap)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">2</span>
                  </button>
                  <button type="button" class="matrix-dot-btn" data-dot="3" aria-label="3-nuqta (pastki chap)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">3</span>
                  </button>
                </div>
                <div class="dot-col">
                  <button type="button" class="matrix-dot-btn" data-dot="4" aria-label="4-nuqta (yuqori o‘ng)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">4</span>
                  </button>
                  <button type="button" class="matrix-dot-btn" data-dot="5" aria-label="5-nuqta (o‘rta o‘ng)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">5</span>
                  </button>
                  <button type="button" class="matrix-dot-btn" data-dot="6" aria-label="6-nuqta (pastki o‘ng)" aria-pressed="false">
                    <span class="dot-circle"></span>
                    <span class="dot-num">6</span>
                  </button>
                </div>
              </div>

              <!-- Inspector Result Output -->
              <div class="inspector-output-card">
                <div class="output-row">
                  <span class="output-label">${s.inspectorResultLabel}</span>
                  <span id="inspector-latin-result" class="output-latin-char">Bo‘sh</span>
                </div>
                <div class="output-row">
                  <span class="output-label">Unicode Brayl:</span>
                  <span id="inspector-unicode-result" class="output-braille-char">⠀</span>
                </div>
                <p id="inspector-desc-result" class="output-description">Barcha nuqtalar o‘chiq</p>

                <div class="inspector-btn-row">
                  <button id="inspector-speak-btn" class="toggle-button" type="button">${s.pronounceBtn}</button>
                  <button id="inspector-clear-btn" class="toggle-button" type="button">${s.clearDotsBtn}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button id="quiz-modal-footer-close" class="toggle-button" type="button">${s.closeBtn}</button>
        </div>
      </div>
    `;

    bindEvents();
    renderCurrentCard();
    updateInspectorDisplay();
  };

  const getFilteredCards = (): QuizCard[] => {
    const select = modalEl!.querySelector<HTMLSelectElement>('#quiz-category-select');
    const cat = select?.value || 'all';
    if (cat === 'all') return QUIZ_FLASHCARDS;
    return QUIZ_FLASHCARDS.filter((c) => c.category === cat);
  };

  const renderCurrentCard = () => {
    const cards = getFilteredCards();
    if (cards.length === 0) return;
    const card = cards[currentCardIndex % cards.length];
    answeredCurrent = false;

    // Render tactile dots preview
    const cellEl = modalEl!.querySelector<HTMLElement>('#flashcard-tactile-cell');
    const unicodeEl = modalEl!.querySelector<HTMLElement>('#flashcard-unicode-char');
    const optionsGrid = modalEl!.querySelector<HTMLElement>('#quiz-options-grid');
    const feedbackBox = modalEl!.querySelector<HTMLElement>('#quiz-feedback-box');
    const scoreBadge = modalEl!.querySelector<HTMLElement>('#quiz-score-badge');

    if (unicodeEl) unicodeEl.textContent = card.braille;
    if (feedbackBox) {
      feedbackBox.textContent = '';
      feedbackBox.className = 'quiz-feedback-box';
    }

    if (cellEl) {
      cellEl.innerHTML = `
        <div class="cell-dots-matrix" aria-label="Braille pattern for ${card.char}">
          <span class="cell-dot dot-1 ${card.activeDots.includes(1) ? 'active' : ''}"></span>
          <span class="cell-dot dot-2 ${card.activeDots.includes(2) ? 'active' : ''}"></span>
          <span class="cell-dot dot-3 ${card.activeDots.includes(3) ? 'active' : ''}"></span>
          <span class="cell-dot dot-4 ${card.activeDots.includes(4) ? 'active' : ''}"></span>
          <span class="cell-dot dot-5 ${card.activeDots.includes(5) ? 'active' : ''}"></span>
          <span class="cell-dot dot-6 ${card.activeDots.includes(6) ? 'active' : ''}"></span>
        </div>
      `;
    }

    if (optionsGrid) {
      optionsGrid.innerHTML = '';
      card.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-option-btn';
        btn.dataset.option = opt;
        btn.textContent = `${String.fromCharCode(65 + idx)}) ${opt}`;
        btn.setAttribute('aria-label', `Javob ${String.fromCharCode(65 + idx)}: ${opt}`);
        btn.addEventListener('click', () => handleOptionSelected(opt, btn, card));
        optionsGrid.appendChild(btn);
      });
    }

    if (scoreBadge) {
      const pct = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 100;
      scoreBadge.textContent = STRINGS[currentLang].scoreText(correctCount, totalAnswered, pct);
    }
  };

  const handleOptionSelected = (selected: string, btn: HTMLButtonElement, card: QuizCard) => {
    if (answeredCurrent) return;
    answeredCurrent = true;
    totalAnswered++;

    const isCorrect = selected === card.char;
    if (isCorrect) correctCount++;

    const feedbackBox = modalEl!.querySelector<HTMLElement>('#quiz-feedback-box');
    const scoreBadge = modalEl!.querySelector<HTMLElement>('#quiz-score-badge');
    const optionsGrid = modalEl!.querySelector<HTMLElement>('#quiz-options-grid');

    if (optionsGrid) {
      const buttons = optionsGrid.querySelectorAll<HTMLButtonElement>('.quiz-option-btn');
      buttons.forEach((b) => {
        b.disabled = true;
        if (b.dataset.option === card.char) {
          b.classList.add('correct');
        } else if (b === btn && !isCorrect) {
          b.classList.add('wrong');
        }
      });
    }

    if (feedbackBox) {
      const exp = currentLang === 'en' ? card.explanationEn : card.explanationUz;
      if (isCorrect) {
        feedbackBox.textContent = STRINGS[currentLang].correctFeedback(exp);
        feedbackBox.className = 'quiz-feedback-box success';
      } else {
        feedbackBox.textContent = STRINGS[currentLang].wrongFeedback(card.char, exp);
        feedbackBox.className = 'quiz-feedback-box failure';
      }
    }

    if (scoreBadge) {
      const pct = Math.round((correctCount / totalAnswered) * 100);
      scoreBadge.textContent = STRINGS[currentLang].scoreText(correctCount, totalAnswered, pct);
    }
  };

  const updateInspectorDisplay = () => {
    const decodeResult = decodeDotsToChar(inspectorDots);
    const latinEl = modalEl!.querySelector<HTMLElement>('#inspector-latin-result');
    const unicodeEl = modalEl!.querySelector<HTMLElement>('#inspector-unicode-result');
    const descEl = modalEl!.querySelector<HTMLElement>('#inspector-desc-result');

    if (latinEl) latinEl.textContent = decodeResult.char;
    if (unicodeEl) unicodeEl.textContent = decodeResult.braille;
    if (descEl) {
      descEl.textContent = currentLang === 'en' ? decodeResult.descriptionEn : decodeResult.descriptionUz;
    }

    // Update matrix buttons aria-pressed and classes
    const dotBtns = modalEl!.querySelectorAll<HTMLButtonElement>('.matrix-dot-btn');
    dotBtns.forEach((btn) => {
      const dotNum = parseInt(btn.dataset.dot || '0', 10);
      const isActive = Boolean(inspectorDots[dotNum - 1]);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.classList.toggle('active', isActive);
    });
  };

  const bindEvents = () => {
    const closeBtn = modalEl!.querySelector<HTMLButtonElement>('#quiz-modal-close-btn');
    const footerCloseBtn = modalEl!.querySelector<HTMLButtonElement>('#quiz-modal-footer-close');
    const nextBtn = modalEl!.querySelector<HTMLButtonElement>('#quiz-next-btn');
    const catSelect = modalEl!.querySelector<HTMLSelectElement>('#quiz-category-select');
    const tabFlash = modalEl!.querySelector<HTMLButtonElement>('#quiz-tab-flashcards');
    const tabInsp = modalEl!.querySelector<HTMLButtonElement>('#quiz-tab-inspector');
    const panelFlash = modalEl!.querySelector<HTMLElement>('#quiz-panel-flashcards');
    const panelInsp = modalEl!.querySelector<HTMLElement>('#quiz-panel-inspector');
    const speakBtn = modalEl!.querySelector<HTMLButtonElement>('#inspector-speak-btn');
    const clearBtn = modalEl!.querySelector<HTMLButtonElement>('#inspector-clear-btn');

    const closeModalSafely = () => {
      if (typeof modalEl!.close === 'function') {
        try {
          modalEl!.close();
        } catch {}
      }
      modalEl!.removeAttribute('open');
      modalEl!.classList.remove('is-open');
      if (typeof document !== 'undefined') {
        const aboutModal = document.querySelector<HTMLDialogElement>('#about-creator-modal');
        const isAboutOpen =
          aboutModal &&
          (aboutModal.hasAttribute('open') ||
            (aboutModal as any).open ||
            aboutModal.classList.contains('is-open'));
        if (!isAboutOpen) {
          document.body.classList.remove('modal-open');
          document.documentElement.classList.remove('modal-open');
        }
      }
    };

    closeBtn?.addEventListener('click', closeModalSafely);
    footerCloseBtn?.addEventListener('click', closeModalSafely);

    nextBtn?.addEventListener('click', () => {
      currentCardIndex++;
      renderCurrentCard();
    });

    catSelect?.addEventListener('change', () => {
      currentCardIndex = 0;
      renderCurrentCard();
    });

    tabFlash?.addEventListener('click', () => {
      tabFlash.classList.add('active');
      tabFlash.setAttribute('aria-selected', 'true');
      tabInsp?.classList.remove('active');
      tabInsp?.setAttribute('aria-selected', 'false');
      panelFlash?.classList.add('active');
      if (panelFlash) panelFlash.hidden = false;
      panelInsp?.classList.remove('active');
      if (panelInsp) panelInsp.hidden = true;
    });

    tabInsp?.addEventListener('click', () => {
      tabInsp.classList.add('active');
      tabInsp.setAttribute('aria-selected', 'true');
      tabFlash?.classList.remove('active');
      tabFlash?.setAttribute('aria-selected', 'false');
      panelInsp?.classList.add('active');
      if (panelInsp) panelInsp.hidden = false;
      panelFlash?.classList.remove('active');
      if (panelFlash) panelFlash.hidden = true;
    });

    // Inspector dot matrix toggles
    const dotBtns = modalEl!.querySelectorAll<HTMLButtonElement>('.matrix-dot-btn');
    dotBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const dotNum = parseInt(btn.dataset.dot || '0', 10);
        if (dotNum >= 1 && dotNum <= 6) {
          inspectorDots[dotNum - 1] = !inspectorDots[dotNum - 1];
          updateInspectorDisplay();
        }
      });
    });

    clearBtn?.addEventListener('click', () => {
      for (let i = 0; i < 6; i++) inspectorDots[i] = false;
      updateInspectorDisplay();
    });

    speakBtn?.addEventListener('click', () => {
      const decodeResult = decodeDotsToChar(inspectorDots);
      if (decodeResult.isRegistered && decodeResult.char && decodeResult.char !== '?') {
        const controller = getSpeechController ? getSpeechController() : null;
        if (controller) {
          controller.speak(decodeResult.char);
        }
      }
    });

    // Global keyboard listener inside modal
    modalEl!.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modalEl!.close();
        return;
      }

      // Explicit Tab-key focus trap within modal container
      if (e.key === 'Tab') {
        const focusableSelector = [
          'button:not([disabled]):not([aria-hidden="true"])',
          'select:not([disabled]):not([aria-hidden="true"])',
          'input:not([disabled]):not([aria-hidden="true"])',
          'a[href]',
          '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        const focusables = Array.from(modalEl!.querySelectorAll<HTMLElement>(focusableSelector))
          .filter((el) => {
            const panel = el.closest('.quiz-tab-panel');
            if (panel && !panel.classList.contains('active')) return false;
            return el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0 || el.tabIndex >= 0;
          });

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (active === first || !modalEl!.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !modalEl!.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
        return;
      }

      // Check if Inspector tab is active: 1-6 keys toggle dots
      if (tabInsp?.classList.contains('active')) {
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= 6) {
          e.preventDefault();
          inspectorDots[keyNum - 1] = !inspectorDots[keyNum - 1];
          updateInspectorDisplay();
        }
      }

      // If Flashcards tab is active: A, B, C, D select corresponding options
      if (tabFlash?.classList.contains('active') && !answeredCurrent) {
        const keyUpper = e.key.toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(keyUpper)) {
          const index = keyUpper.charCodeAt(0) - 65;
          const options = modalEl!.querySelectorAll<HTMLButtonElement>('.quiz-option-btn');
          if (options[index]) {
            e.preventDefault();
            options[index].click();
          }
        }
      }
    });
  };

  renderModalDom();

  return {
    open: () => {
      if (modalEl) {
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
        modalEl.setAttribute('open', 'true');
        modalEl.classList.add('is-open');
        const tabFlash = modalEl.querySelector<HTMLButtonElement>('#quiz-tab-flashcards');
        tabFlash?.focus();
      }
    },
    close: () => {
      if (modalEl) {
        if (typeof document !== 'undefined') {
          const aboutModal = document.querySelector<HTMLDialogElement>('#about-creator-modal');
          const isAboutOpen =
            aboutModal &&
            (aboutModal.hasAttribute('open') ||
              (aboutModal as any).open ||
              aboutModal.classList.contains('is-open'));
          if (!isAboutOpen) {
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
        modalEl.removeAttribute('open');
        modalEl.classList.remove('is-open');
      }
    },
    destroy: () => {
      modalEl?.remove();
    },
    setLang: (lang: 'uz' | 'en') => {
      currentLang = lang;
      renderModalDom();
    },
  };
}