import { describe, it, expect } from 'vitest';
import {
  normalizeUzbekText,
  tokenizeUzbekText,
  transliterateToBraille,
  charToBraille,
  BRAILLE_MAP,
  BRAILLE_NUMBER_PREFIX,
  UZBEK_APOSTROPHE_CHARS,
  generateTactileSvg,
  SpeechController,
  getPhoneticFallbackText,
  highlightBrailleCell,
  clearSpeechHighlights,
  initAudioControls,
  initApp,
  type UzbekToken,
} from '../src/index.js';
import {
  UZBEK_25_VOCABULARY_WORDS,
  EXPECTED_25_VOCABULARY_BRAILLE,
} from './transliteration.test.js';

describe('Milestone 1 Full Integration Suite', () => {
  describe('Index Module Exports', () => {
    it('re-exports all core functions and constants from src/index.ts', () => {
      expect(typeof normalizeUzbekText).toBe('function');
      expect(typeof tokenizeUzbekText).toBe('function');
      expect(typeof transliterateToBraille).toBe('function');
      expect(typeof charToBraille).toBe('function');
      expect(typeof BRAILLE_MAP).toBe('object');
      expect(BRAILLE_NUMBER_PREFIX).toBe('⠼');
      expect(typeof UZBEK_APOSTROPHE_CHARS).toBe('string');
    });
  });

  describe('Apostrophe Variations for o‘ and g‘ (4 Key Unicode Variants)', () => {
    const oVariants = [
      "o'zbek", // U+0027 ASCII single quote
      'oʻzbek', // U+02BB modifier letter turned comma
      'o‘zbek', // U+2018 left single quotation mark
      'o’zbek', // U+2019 right single quotation mark
    ];

    const gVariants = [
      "g'alaba", // U+0027 ASCII single quote
      'gʻalaba', // U+02BB modifier letter turned comma
      'g‘alaba', // U+2018 left single quotation mark
      'g’alaba', // U+2019 right single quotation mark
    ];

    it('transliterates all 4 apostrophe variants of "o\'zbek" to identical Braille', () => {
      const expected = '⠧⠵⠃⠑⠅';
      for (const variant of oVariants) {
        expect(transliterateToBraille(variant)).toBe(expected);
      }
    });

    it('transliterates all 4 apostrophe variants of "g\'alaba" to identical Braille', () => {
      const expected = '⠻⠁⠇⠁⠃⠁';
      for (const variant of gVariants) {
        expect(transliterateToBraille(variant)).toBe(expected);
      }
    });

    it('normalizes all 4 apostrophe variants of o and g into canonical turned comma (ʻ / U+02BB)', () => {
      for (const variant of oVariants) {
        expect(normalizeUzbekText(variant)).toBe('o\u02BBzbek');
      }
      for (const variant of gVariants) {
        expect(normalizeUzbekText(variant)).toBe('g\u02BBalaba');
      }
    });
  });

  describe('25 Official Uzbek Latin Vocabulary Words', () => {
    it.each(UZBEK_25_VOCABULARY_WORDS)(
      'integrates full pipeline correctly for "%s"',
      (word) => {
        const normalized = normalizeUzbekText(word);
        const braille = transliterateToBraille(word);
        expect(braille).toBe(EXPECTED_25_VOCABULARY_BRAILLE[word]);

        // Transliterating normalized or raw produces identical output
        expect(transliterateToBraille(normalized)).toBe(EXPECTED_25_VOCABULARY_BRAILLE[word]);

        // Validate strictly within Unicode Braille range U+2800..U+283F
        for (let i = 0; i < braille.length; i++) {
          const code = braille.charCodeAt(i);
          expect(code).toBeGreaterThanOrEqual(0x2800);
          expect(code).toBeLessThanOrEqual(0x283f);
        }
      }
    );
  });

  describe('Numeral Sign Prefixing and Letter Context Resumption', () => {
    it('handles single digits with ⠼ prefix', () => {
      expect(transliterateToBraille('1')).toBe('⠼⠁');
      expect(transliterateToBraille('9')).toBe('⠼⠊');
    });

    it('prepends exactly one ⠼ prefix across multi-digit numbers', () => {
      expect(transliterateToBraille('1991')).toBe('⠼⠁⠊⠊⠁');
      expect(transliterateToBraille('2027')).toBe('⠼⠃⠚⠃⠛');
      expect(transliterateToBraille('100')).toBe('⠼⠁⠚⠚');
    });

    it('immediately restores letter context after numbers with hyphen or space', () => {
      expect(transliterateToBraille('1991-yil')).toBe('⠼⠁⠊⠊⠁⠤⠽⠊⠇');
      expect(transliterateToBraille('25 kitob')).toBe('⠼⠃⠑⠀⠅⠊⠞⠕⠃');
      expect(transliterateToBraille('1-sinf')).toBe('⠼⠁⠤⠎⠊⠝⠋');
    });
  });

  describe('Digraphs and Escaped Digraph Disambiguation', () => {
    it('transliterates digraphs sh, ch, and ng properly', () => {
      expect(transliterateToBraille('shahar')).toBe('⠱⠁⠓⠁⠗');
      expect(transliterateToBraille('choy')).toBe('⠟⠕⠽');
      expect(transliterateToBraille('tong')).toBe('⠞⠕⠝⠛');
    });

    it('disambiguates escaped digraphs (\\sh, \\ch, \\ng) as independent letters', () => {
      // In \sh: s is ⠎, h is ⠓ (instead of digraph sh ⠱)
      expect(transliterateToBraille('\\sh')).toBe('⠎⠓');
      expect(transliterateToBraille('\\ch')).toBe('⠉⠓');
      expect(transliterateToBraille('\\ng')).toBe('⠝⠛');
    });

    it('disambiguates words separated by tutuq belgisi like Is\'hoq', () => {
      expect(transliterateToBraille("Is'hoq")).toBe('⠊⠎⠄⠓⠕⠟');
    });
  });

  describe('Mixed Alphanumeric Exam Strings', () => {
    it('accurately transliterates an authentic Uzbek school exam prompt', () => {
      const examPrompt = "1-savol: 1991-yil 1-sentyabrda O'zbekiston mustaqillikka erishdi.";
      const braille = transliterateToBraille(examPrompt);

      // Verify prefixing on 1-savol: ⠼⠁⠤⠎⠁⠺⠕⠇⠒
      expect(braille).toContain('⠼⠁⠤⠎⠁⠺⠕⠇⠒');

      // Verify prefixing on 1991-yil: ⠼⠁⠊⠊⠁⠤⠽⠊⠇
      expect(braille).toContain('⠼⠁⠊⠊⠁⠤⠽⠊⠇');

      // Verify prefixing on 1-sentyabrda: ⠼⠁⠤⠎⠑⠝⠞⠽⠁⠃⠗⠙⠁
      expect(braille).toContain('⠼⠁⠤⠎⠑⠝⠞⠽⠁⠃⠗⠙⠁');

      // Verify O'zbekiston: ⠧⠵⠃⠑⠅⠊⠎⠞⠕⠝
      expect(braille).toContain('⠧⠵⠃⠑⠅⠊⠎⠞⠕⠝');

      // Verify all characters are in Braille range U+2800..U+283F or whitespace
      for (const ch of braille) {
        if (ch === '\n' || ch === '\r') continue;
        const code = ch.charCodeAt(0);
        expect(code).toBeGreaterThanOrEqual(0x2800);
        expect(code).toBeLessThanOrEqual(0x283f);
      }
    });

    it('transliterates mixed classroom sentences with punctuation and vocabulary', () => {
      const sentence = "25-mashq: Quyosh, shahar, va tog' manzaralari.";
      const braille = transliterateToBraille(sentence);

      // 25-mashq: ⠼⠃⠑⠤⠍⠁⠱⠟⠒
      // Quyosh: ⠟⠥⠽⠕⠱
      // tog': ⠞⠕⠻
      expect(braille).toContain('⠼⠃⠑⠤⠍⠁⠱⠟⠒');
      expect(braille).toContain('⠟⠥⠽⠕⠱');
      expect(braille).toContain('⠞⠕⠻');
    });

    it('transliterates multi-line mixed texts maintaining newline separation', () => {
      const multiline = "1. Kitob o'qing\n2. G'alabaga erishing";
      const braille = transliterateToBraille(multiline);
      const lines = braille.split('\n');
      expect(lines).toHaveLength(2);

      // Line 1: 1. Kitob o'qing -> ⠼⠁⠲⠀⠅⠊⠞⠕⠃⠀⠧⠟⠊⠝⠛
      expect(lines[0]).toBe('⠼⠁⠲⠀⠅⠊⠞⠕⠃⠀⠧⠟⠊⠝⠛');
      // Line 2: 2. G'alabaga erishing -> ⠼⠃⠲⠀⠻⠁⠇⠁⠃⠁⠛⠁⠀⠑⠗⠊⠱⠊⠝⠛
      expect(lines[1]).toBe('⠼⠃⠲⠀⠻⠁⠇⠁⠃⠁⠛⠁⠀⠑⠗⠊⠱⠊⠝⠛');
    });
  });

  describe('Milestone 4 Auditory Verification & Speech Sync Integration', () => {
    it('re-exports M4 audio controller, phonetic fallback, and UI synchronization functions', () => {
      expect(typeof SpeechController).toBe('function');
      expect(typeof getPhoneticFallbackText).toBe('function');
      expect(typeof highlightBrailleCell).toBe('function');
      expect(typeof clearSpeechHighlights).toBe('function');
      expect(typeof initAudioControls).toBe('function');
      expect(typeof generateTactileSvg).toBe('function');
      expect(typeof initApp).toBe('function');
    });

    it('generates phonetic fallback text for Turkish and Cyrillic TTS engines seamlessly', () => {
      const sample = "O'zbekiston Respublikasi g'alabaga erishdi";
      const phoneticLatin = getPhoneticFallbackText(sample, 'en-US');
      expect(phoneticLatin).toContain('Ozbekiston');
      expect(phoneticLatin).toContain('ghalabaga');

      const phoneticTurkish = getPhoneticFallbackText(sample, 'tr-TR');
      expect(phoneticTurkish).toContain('Özbekiston');
      expect(phoneticTurkish).toContain('ğalabaga');

      const phoneticCyrillic = getPhoneticFallbackText(sample, 'ru-RU');
      expect(phoneticCyrillic).toContain('Ўзбекистон');
      expect(phoneticCyrillic).toContain('ғалабага');
    });

    it('connects full end-to-end pipeline: Latin input -> Braille -> SVG -> Speech Fallback -> DOM Sync', () => {
      const input = "1-savol: O'zbekiston";
      // 1. Normalize
      const normalized = normalizeUzbekText(input);
      expect(normalized).toBe("1-savol: Oʻzbekiston");

      // 2. Transliterate to Braille
      const braille = transliterateToBraille(input);
      expect(braille).toBe('⠼⠁⠤⠎⠁⠺⠕⠇⠒⠀⠧⠵⠃⠑⠅⠊⠎⠞⠕⠝');

      // 3. Tactile SVG Generation
      const svg = generateTactileSvg(braille);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('width="210mm"');
      expect(svg).toContain('height="297mm"');

      // 4. Phonetic Speech Fallback
      const phonetic = getPhoneticFallbackText(input);
      expect(phonetic).toBe('1-savol: Ozbekiston');

      // 5. Speech Controller Instance
      const controller = new SpeechController();
      expect(controller.getState()).toBe('idle');
      expect(controller.getPhoneticFallbackText(input)).toBe('1-savol: Ozbekiston');

      // 6. DOM speech highlighter
      document.body.innerHTML = `
        <div id="braille-output">
          <div class="tactile-cell" data-index="0"></div>
          <div class="tactile-cell" data-index="1"></div>
        </div>
      `;
      highlightBrailleCell(1);
      const cell1 = document.querySelector('.tactile-cell[data-index="1"]');
      expect(cell1?.classList.contains('cell-speaking')).toBe(true);
      expect(cell1?.getAttribute('data-active-speech')).toBe('true');

      clearSpeechHighlights();
      expect(cell1?.classList.contains('cell-speaking')).toBe(false);
      expect(cell1?.hasAttribute('data-active-speech')).toBe(false);
    });
  });
});
