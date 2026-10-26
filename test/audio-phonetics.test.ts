import { describe, it, expect } from 'vitest';
import {
  getPhoneticFallbackText,
  convertToPhoneticLatin,
  convertToPhoneticTurkish,
  convertToPhoneticCyrillic,
  resolvePhoneticMode,
} from '../src/audio/phonetics.js';

describe('Audio Phonetics & Fallback Transliteration', () => {
  it('exports getPhoneticFallbackText and conversion helpers', () => {
    expect(typeof getPhoneticFallbackText).toBe('function');
    expect(typeof convertToPhoneticLatin).toBe('function');
    expect(typeof convertToPhoneticTurkish).toBe('function');
    expect(typeof convertToPhoneticCyrillic).toBe('function');
    expect(typeof resolvePhoneticMode).toBe('function');
  });

  it('handles empty and null inputs gracefully', () => {
    expect(getPhoneticFallbackText('')).toBe('');
    expect(convertToPhoneticLatin('')).toBe('');
    expect(convertToPhoneticTurkish('')).toBe('');
    expect(convertToPhoneticCyrillic('')).toBe('');
  });

  describe('resolvePhoneticMode', () => {
    it('defaults to latin when lang is undefined or empty', () => {
      expect(resolvePhoneticMode()).toBe('latin');
      expect(resolvePhoneticMode('')).toBe('latin');
    });

    it('resolves Russian / Cyrillic modes', () => {
      expect(resolvePhoneticMode('ru-RU')).toBe('cyrillic');
      expect(resolvePhoneticMode('ru')).toBe('cyrillic');
      expect(resolvePhoneticMode('cyrillic')).toBe('cyrillic');
      expect(resolvePhoneticMode('Russian Voice')).toBe('cyrillic');
    });

    it('resolves Turkish modes', () => {
      expect(resolvePhoneticMode('tr-TR')).toBe('turkish');
      expect(resolvePhoneticMode('tr')).toBe('turkish');
      expect(resolvePhoneticMode('turkish')).toBe('turkish');
    });

    it('resolves English / others to latin mode', () => {
      expect(resolvePhoneticMode('en-US')).toBe('latin');
      expect(resolvePhoneticMode('en-GB')).toBe('latin');
      expect(resolvePhoneticMode('fr-FR')).toBe('latin');
    });
  });

  describe('Latin Phonetic Conversion (Default)', () => {
    it('converts o‘ and O‘ without disruptive apostrophes', () => {
      expect(getPhoneticFallbackText('o‘quvchi')).toBe('oquvchi');
      expect(getPhoneticFallbackText('O‘zbekiston')).toBe('Ozbekiston');
      expect(getPhoneticFallbackText('ko‘l')).toBe('kol');
    });

    it('normalizes diverse unicode apostrophes for o‘ (U+02BB, U+2018, U+2019, U+0027, etc.)', () => {
      expect(getPhoneticFallbackText('oʻrdak')).toBe('ordak');
      expect(getPhoneticFallbackText('o’rdak')).toBe('ordak');
      expect(getPhoneticFallbackText("o'rdak")).toBe('ordak');
      expect(getPhoneticFallbackText('o`rdak')).toBe('ordak');
    });

    it('converts g‘ and G‘ to phonetic gh / Gh', () => {
      expect(getPhoneticFallbackText('g‘alaba')).toBe('ghalaba');
      expect(getPhoneticFallbackText('G‘alaba')).toBe('Ghalaba');
      expect(getPhoneticFallbackText('bog‘')).toBe('bogh');
      expect(getPhoneticFallbackText('tog‘')).toBe('togh');
      expect(getPhoneticFallbackText('to‘g‘ri')).toBe('toghri');
    });

    it('normalizes diverse unicode apostrophes for g‘', () => {
      expect(getPhoneticFallbackText('gʻildirak')).toBe('ghildirak');
      expect(getPhoneticFallbackText('g’ildirak')).toBe('ghildirak');
      expect(getPhoneticFallbackText("g'ildirak")).toBe('ghildirak');
      expect(getPhoneticFallbackText('g`ildirak')).toBe('ghildirak');
    });

    it('handles uppercase digraph context (G‘ALABA -> GHALABA)', () => {
      expect(getPhoneticFallbackText('G‘ALABA')).toBe('GHALABA');
    });

    it('preserves digraphs sh, ch, ng in Latin phonetic mode', () => {
      expect(getPhoneticFallbackText('shahar')).toBe('shahar');
      expect(getPhoneticFallbackText('choyxona')).toBe('choyxona');
      expect(getPhoneticFallbackText('tong')).toBe('tong');
      expect(getPhoneticFallbackText('Shavkat')).toBe('Shavkat');
      expect(getPhoneticFallbackText('Chirchiq')).toBe('Chirchiq');
    });

    it('strips standalone tutuq belgisi apostrophes to prevent TTS stutters', () => {
      expect(getPhoneticFallbackText("ta'lim")).toBe('talim');
      expect(getPhoneticFallbackText('a‘lo')).toBe('alo');
      expect(getPhoneticFallbackText('mo‘jiza')).toBe('mojiza');
      expect(getPhoneticFallbackText("ma'lumot")).toBe('malumot');
    });
  });

  describe('Turkish Phonetic Conversion (tr-TR Fallback)', () => {
    it('converts o‘ to Turkish ö', () => {
      expect(getPhoneticFallbackText('o‘quvchi', 'tr-TR')).toBe('öquvçi');
      expect(getPhoneticFallbackText('O‘zbekiston', 'tr-TR')).toBe('Özbekiston');
    });

    it('converts g‘ to Turkish ğ', () => {
      expect(getPhoneticFallbackText('g‘alaba', 'tr-TR')).toBe('ğalaba');
      expect(getPhoneticFallbackText('G‘alaba', 'tr-TR')).toBe('Ğalaba');
      expect(getPhoneticFallbackText('bog‘', 'tr-TR')).toBe('boğ');
    });

    it('converts digraph sh to Turkish ş', () => {
      expect(getPhoneticFallbackText('shahar', 'tr-TR')).toBe('şahar');
      expect(getPhoneticFallbackText('Shavkat', 'tr-TR')).toBe('Şavkat');
    });

    it('converts digraph ch to Turkish ç', () => {
      expect(getPhoneticFallbackText('choyxona', 'tr-TR')).toBe('çoyxona');
      expect(getPhoneticFallbackText('Chirchiq', 'tr-TR')).toBe('Çirçiq');
    });

    it('converts digraph ng to ñ', () => {
      expect(getPhoneticFallbackText('tong', 'tr-TR')).toBe('toñ');
      expect(getPhoneticFallbackText('yangi', 'tr-TR')).toBe('yañi');
    });

    it('combines modified letters and digraphs smoothly', () => {
      expect(getPhoneticFallbackText('to‘g‘ri va chiroyli shahar', 'tr-TR')).toBe(
        'töğri va çiroyli şahar'
      );
    });
  });

  describe('Cyrillic Phonetic Conversion (ru-RU Fallback)', () => {
    it('converts o‘ and O‘ to Cyrillic ў and Ў', () => {
      expect(getPhoneticFallbackText('o‘quvchi', 'ru-RU')).toBe('ўқувчи');
      expect(getPhoneticFallbackText('O‘zbekiston', 'ru-RU')).toBe('Ўзбекистон');
    });

    it('converts g‘ and G‘ to Cyrillic ғ and Ғ', () => {
      expect(getPhoneticFallbackText('g‘alaba', 'ru-RU')).toBe('ғалаба');
      expect(getPhoneticFallbackText('G‘alaba', 'ru-RU')).toBe('Ғалаба');
      expect(getPhoneticFallbackText('bog‘', 'ru-RU')).toBe('боғ');
    });

    it('converts digraph sh to Cyrillic ш / Ш', () => {
      expect(getPhoneticFallbackText('shahar', 'ru-RU')).toBe('шаҳар');
      expect(getPhoneticFallbackText('Shavkat', 'ru-RU')).toBe('Шавкат');
    });

    it('converts digraph ch to Cyrillic ч / Ч', () => {
      expect(getPhoneticFallbackText('choyxona', 'ru-RU')).toBe('чойхона');
      expect(getPhoneticFallbackText('Chirchiq', 'ru-RU')).toBe('Чирчиқ');
    });

    it('converts digraph ng to Cyrillic нг / Нг', () => {
      expect(getPhoneticFallbackText('tong', 'ru-RU')).toBe('тонг');
      expect(getPhoneticFallbackText('yangi', 'ru-RU')).toBe('янги');
    });

    it('converts tutuq belgisi to Cyrillic hard sign ъ', () => {
      expect(getPhoneticFallbackText("ta'lim", 'ru-RU')).toBe('таълим');
      expect(getPhoneticFallbackText('a‘lo', 'ru-RU')).toBe('аъло');
    });

    it('transliterates full Uzbek exam sentences to Cyrillic for Russian TTS', () => {
      const sentence = 'O‘zbekiston Respublikasi Konstitutsiyasi';
      expect(getPhoneticFallbackText(sentence, 'ru-RU')).toBe(
        'Ўзбекистон Республикаси Конституцияси'
      );
    });
  });

  describe('Official Uzbek Benchmark Vocabulary', () => {
    const benchmarks = [
      { text: 'maktab', expectedLatin: 'maktab' },
      { text: 'kitob', expectedLatin: 'kitob' },
      { text: 'qalam', expectedLatin: 'qalam' },
      { text: 'ona', expectedLatin: 'ona' },
      { text: 'vatan', expectedLatin: 'vatan' },
      { text: 'o‘qituvchi', expectedLatin: 'oqituvchi' },
      { text: 'do‘st', expectedLatin: 'dost' },
      { text: 'shahar', expectedLatin: 'shahar' },
      { text: 'quyosh', expectedLatin: 'quyosh' },
      { text: 'choy', expectedLatin: 'choy' },
      { text: 'gul', expectedLatin: 'gul' },
      { text: 'bog‘', expectedLatin: 'bogh' },
      { text: 'daryo', expectedLatin: 'daryo' },
      { text: 'tog‘', expectedLatin: 'togh' },
      { text: 'ko‘z', expectedLatin: 'koz' },
      { text: 'yulduz', expectedLatin: 'yulduz' },
      { text: 'non', expectedLatin: 'non' },
      { text: 'suv', expectedLatin: 'suv' },
      { text: 'yoz', expectedLatin: 'yoz' },
      { text: 'qish', expectedLatin: 'qish' },
      { text: 'bahor', expectedLatin: 'bahor' },
      { text: 'kuz', expectedLatin: 'kuz' },
      { text: 'bola', expectedLatin: 'bola' },
      { text: 'ilm', expectedLatin: 'ilm' },
      { text: 'tinchlik', expectedLatin: 'tinchlik' },
    ];

    for (const b of benchmarks) {
      it(`correctly fallback-transliterates "${b.text}" -> "${b.expectedLatin}"`, () => {
        expect(getPhoneticFallbackText(b.text)).toBe(b.expectedLatin);
      });
    }
  });
});
