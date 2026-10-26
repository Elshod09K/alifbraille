import { describe, it, expect } from 'vitest';
import {
  transliterateToBraille,
  charToBraille,
  BRAILLE_MAP,
  BRAILLE_NUMBER_PREFIX,
} from '../src/braille.js';

export const UZBEK_25_VOCABULARY_WORDS = [
  'kitob',
  'maktab',
  'o‘qituvchi',
  'o‘quvchi',
  'g‘alaba',
  'g‘isht',
  'shahar',
  'quyosh',
  'choy',
  'ruchka',
  'yomg‘ir',
  'tong',
  'singil',
  'ko‘z',
  'qo‘l',
  'yulduz',
  'vatan',
  'inson',
  'ilm',
  'dunyo',
  'bahor',
  'daryo',
  'tog‘',
  'qalam',
  'O‘zbekiston',
] as const;

export const EXPECTED_25_VOCABULARY_BRAILLE: Record<
  (typeof UZBEK_25_VOCABULARY_WORDS)[number],
  string
> = {
  kitob: '⠅⠊⠞⠕⠃',
  maktab: '⠍⠁⠅⠞⠁⠃',
  'o‘qituvchi': '⠧⠟⠊⠞⠥⠺⠟⠊',
  'o‘quvchi': '⠧⠟⠥⠺⠟⠊',
  'g‘alaba': '⠻⠁⠇⠁⠃⠁',
  'g‘isht': '⠻⠊⠱⠞',
  shahar: '⠱⠁⠓⠁⠗',
  quyosh: '⠟⠥⠽⠕⠱',
  choy: '⠟⠕⠽',
  ruchka: '⠗⠥⠟⠅⠁',
  'yomg‘ir': '⠽⠕⠍⠻⠊⠗',
  tong: '⠞⠕⠝⠛',
  singil: '⠎⠊⠝⠛⠊⠇',
  'ko‘z': '⠅⠧⠵',
  'qo‘l': '⠟⠧⠇',
  yulduz: '⠽⠥⠇⠙⠥⠵',
  vatan: '⠺⠁⠞⠁⠝',
  inson: '⠊⠝⠎⠕⠝',
  ilm: '⠊⠇⠍',
  dunyo: '⠙⠥⠝⠽⠕',
  bahor: '⠃⠁⠓⠕⠗',
  daryo: '⠙⠁⠗⠽⠕',
  'tog‘': '⠞⠕⠻',
  qalam: '⠟⠁⠇⠁⠍',
  'O‘zbekiston': '⠧⠵⠃⠑⠅⠊⠎⠞⠕⠝',
};

describe('Uzbek Latin-to-Braille Engine Core Specification', () => {
  describe('Module Exports & Constants', () => {
    it('exports transliterateToBraille and charToBraille functions', () => {
      expect(typeof transliterateToBraille).toBe('function');
      expect(typeof charToBraille).toBe('function');
    });

    it('exports official Braille numeral prefix (⠼ / U+283C)', () => {
      expect(BRAILLE_NUMBER_PREFIX).toBe('⠼');
      expect(BRAILLE_NUMBER_PREFIX.charCodeAt(0)).toBe(0x283c);
    });

    it('exports BRAILLE_MAP with Latin alphabet and digits', () => {
      expect(BRAILLE_MAP).toBeDefined();
      expect(BRAILLE_MAP['a']).toBe('⠁');
      expect(BRAILLE_MAP['1']).toBe('⠁');
      expect(BRAILLE_MAP['v']).toBe('⠺');
      expect(BRAILLE_MAP['sh']).toBe('⠱');
      expect(BRAILLE_MAP['ch']).toBe('⠟');
      expect(BRAILLE_MAP['oʻ']).toBe('⠧');
      expect(BRAILLE_MAP['gʻ']).toBe('⠻');
    });

    it('provides reference suite of exactly 25 official Uzbek vocabulary words', () => {
      expect(UZBEK_25_VOCABULARY_WORDS).toHaveLength(25);
    });
  });

  describe('Unicode Braille Range Integrity (U+2800..U+283F)', () => {
    it('ensures all entries in BRAILLE_MAP contain characters strictly within U+2800..U+283F (or newline)', () => {
      for (const [key, value] of Object.entries(BRAILLE_MAP)) {
        if (value === '\n' || value === '') continue;
        for (let i = 0; i < value.length; i++) {
          const code = value.charCodeAt(i);
          expect(
            code >= 0x2800 && code <= 0x283f,
            `Char "${value[i]}" (0x${code.toString(16)}) in BRAILLE_MAP['${key}'] must be in U+2800..U+283F`
          ).toBe(true);
        }
      }
    });

    it('ensures charToBraille outputs strictly within range U+2800..U+283F for valid characters', () => {
      const sampleInputs = ['a', 'b', 'v', 'o‘', 'g‘', 'sh', 'ch', '1', '9', ' ', '.', '!'];
      for (const input of sampleInputs) {
        const result = charToBraille(input);
        expect(result.length).toBeGreaterThan(0);
        for (let i = 0; i < result.length; i++) {
          const code = result.charCodeAt(i);
          expect(code).toBeGreaterThanOrEqual(0x2800);
          expect(code).toBeLessThanOrEqual(0x283f);
        }
      }
    });

    it('ensures transliterated output of all 25 official vocabulary words strictly adheres to U+2800..U+283F', () => {
      for (const word of UZBEK_25_VOCABULARY_WORDS) {
        const braille = transliterateToBraille(word);
        expect(braille.length).toBeGreaterThan(0);
        for (let i = 0; i < braille.length; i++) {
          const code = braille.charCodeAt(i);
          expect(
            code >= 0x2800 && code <= 0x283f,
            `Word "${word}" produced out-of-range character at index ${i}: 0x${code.toString(16)}`
          ).toBe(true);
        }
      }
    });
  });

  describe('25 Official Uzbek Latin Vocabulary Words (100% Pass)', () => {
    it.each(UZBEK_25_VOCABULARY_WORDS)(
      'accurately transliterates "%s" into correct tactile Braille',
      (word) => {
        const expected = EXPECTED_25_VOCABULARY_BRAILLE[word];
        const actual = transliterateToBraille(word);
        expect(actual).toBe(expected);
      }
    );
  });

  describe('Apostrophe Variant Disambiguation for o‘ and g‘', () => {
    it('transliterates o‘ uniformly across 5 distinct quotation/apostrophe unicode variants', () => {
      const variants = [
        'o‘qituvchi', // U+2018 left single quotation mark
        'o’qituvchi', // U+2019 right single quotation mark
        "o'qituvchi", // U+0027 ascii single quote
        'oʻqituvchi', // U+02BB modifier letter turned comma
        'o`qituvchi', // U+0060 grave accent
      ];
      const expected = '⠧⠟⠊⠞⠥⠺⠟⠊';
      for (const variant of variants) {
        expect(transliterateToBraille(variant)).toBe(expected);
      }
    });

    it('transliterates g‘ uniformly across 5 distinct quotation/apostrophe unicode variants', () => {
      const variants = [
        'g‘alaba', // U+2018
        'g’alaba', // U+2019
        "g'alaba", // U+0027
        'gʻalaba', // U+02BB
        'g`alaba', // U+0060
      ];
      const expected = '⠻⠁⠇⠁⠃⠁';
      for (const variant of variants) {
        expect(transliterateToBraille(variant)).toBe(expected);
      }
    });

    it('transliterates uppercase O‘ and G‘ variants correctly', () => {
      expect(transliterateToBraille('O‘zbekiston')).toBe('⠧⠵⠃⠑⠅⠊⠎⠞⠕⠝');
      expect(transliterateToBraille('Oʻzbekiston')).toBe('⠧⠵⠃⠑⠅⠊⠎⠞⠕⠝');
      expect(transliterateToBraille("O'zbekiston")).toBe('⠧⠵⠃⠑⠅⠊⠎⠞⠕⠝');
      expect(transliterateToBraille('G‘isht')).toBe('⠻⠊⠱⠞');
      expect(transliterateToBraille('Gʻisht')).toBe('⠻⠊⠱⠞');
    });

    it('correctly maps standalone apostrophe (tutuq belgisi) without consuming subsequent letters', () => {
      // In Uzbek words like ma'no, the apostrophe represents a glottal stop / separation
      const result = transliterateToBraille("ma'no");
      // m: ⠍, a: ⠁, ': ⠄, n: ⠝, o: ⠕
      expect(result).toBe('⠍⠁⠄⠝⠕');
    });
  });

  describe('Braille Numeral Sign Prefixing & Letter Context Resumption', () => {
    it('prepends Braille numeral sign (⠼) to single digit numbers', () => {
      expect(transliterateToBraille('7')).toBe('⠼⠛');
      expect(transliterateToBraille('0')).toBe('⠼⠚');
    });

    it('prepends exactly one Braille numeral sign (⠼) to multi-digit numbers (1991 -> ⠼⠁⠊⠊⠁)', () => {
      expect(transliterateToBraille('1991')).toBe('⠼⠁⠊⠊⠁');
      expect(transliterateToBraille('2024')).toBe('⠼⠃⠚⠃⠙');
    });

    it('restores letter context after numbers without unwanted numeral prefixes on subsequent letters', () => {
      // 1991-yil: 1991 -> ⠼⠁⠊⠊⠁, '-' -> ⠤, 'yil' -> ⠽⠊⠇ (no ⠼ on letters)
      expect(transliterateToBraille('1991-yil')).toBe('⠼⠁⠊⠊⠁⠤⠽⠊⠇');

      // 25 kitob: 25 -> ⠼⠃⠑, ' ' -> ⠀, 'kitob' -> ⠅⠊⠞⠕⠃
      expect(transliterateToBraille('25 kitob')).toBe('⠼⠃⠑⠀⠅⠊⠞⠕⠃');

      // 1-sinf: 1 -> ⠼⠁, '-' -> ⠤, 'sinf' -> ⠎⠊⠝⠋
      expect(transliterateToBraille('1-sinf')).toBe('⠼⠁⠤⠎⠊⠝⠋');
    });

    it('correctly handles multiple numbers within a sentence with independent prefixing', () => {
      // "1991 va 2024"
      const result = transliterateToBraille('1991 va 2024');
      expect(result).toBe('⠼⠁⠊⠊⠁⠀⠺⠁⠀⠼⠃⠚⠃⠙');
    });

    it('handles direct digit-letter transition without intervening space or hyphen', () => {
      // "10a" -> ⠼⠁⠚⠁ (10 prefixed with ⠼, letter a without ⠼)
      expect(transliterateToBraille('10a')).toBe('⠼⠁⠚⠁');
    });
  });

  describe('charToBraille Direct Mapping Utility', () => {
    it('maps individual standard letters to corresponding 6-dot Braille cells', () => {
      expect(charToBraille('a')).toBe('⠁');
      expect(charToBraille('b')).toBe('⠃');
      expect(charToBraille('d')).toBe('⠙');
      expect(charToBraille('k')).toBe('⠅');
      expect(charToBraille('m')).toBe('⠍');
      expect(charToBraille('t')).toBe('⠞');
      expect(charToBraille('z')).toBe('⠵');
    });

    it('maps digraphs and modified letters correctly', () => {
      expect(charToBraille('sh')).toBe('⠱');
      expect(charToBraille('ch')).toBe('⠟');
      expect(charToBraille('ng')).toBe('⠝⠛');
      expect(charToBraille('oʻ')).toBe('⠧');
      expect(charToBraille('o‘')).toBe('⠧');
      expect(charToBraille("o'")).toBe('⠧');
      expect(charToBraille('gʻ')).toBe('⠻');
      expect(charToBraille('g‘')).toBe('⠻');
      expect(charToBraille("g'")).toBe('⠻');
    });

    it('is case-insensitive for all letters and digraphs', () => {
      expect(charToBraille('A')).toBe('⠁');
      expect(charToBraille('SH')).toBe('⠱');
      expect(charToBraille('Sh')).toBe('⠱');
      expect(charToBraille('CH')).toBe('⠟');
      expect(charToBraille('Ch')).toBe('⠟');
      expect(charToBraille('O‘')).toBe('⠧');
      expect(charToBraille('G‘')).toBe('⠻');
    });

    it('returns empty string for empty input or unrecognized symbols', () => {
      expect(charToBraille('')).toBe('');
      expect(charToBraille('§')).toBe('');
    });
  });

  describe('Punctuation, Whitespace, and Multi-line Text', () => {
    it('transliterates full sentences with punctuation', () => {
      const sentence = 'Kitob va qalam.';
      // K: ⠅, i: ⠊, t: ⠞, o: ⠕, b: ⠃
      // space: ⠀
      // v: ⠺, a: ⠁
      // space: ⠀
      // q: ⠟, a: ⠁, l: ⠇, a: ⠁, m: ⠍
      // .: ⠲
      expect(transliterateToBraille(sentence)).toBe('⠅⠊⠞⠕⠃⠀⠺⠁⠀⠟⠁⠇⠁⠍⠲');
    });

    it('preserves newline formatting across multi-line passages', () => {
      const multiline = 'kitob\nmaktab';
      expect(transliterateToBraille(multiline)).toBe('⠅⠊⠞⠕⠃\n⠍⠁⠅⠞⠁⠃');
    });

    it('returns empty string for empty input', () => {
      expect(transliterateToBraille('')).toBe('');
    });
  });
});
