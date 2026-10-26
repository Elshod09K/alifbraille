import { describe, it, expect } from 'vitest';
import { PRESETS } from '../src/ui/presets.js';
import { transliterateToBraille } from '../src/braille.js';

describe('Curated Uzbek Educational Presets', () => {
  it('exports a non-empty array of educational presets', () => {
    expect(Array.isArray(PRESETS)).toBe(true);
    expect(PRESETS.length).toBeGreaterThanOrEqual(4);
  });

  it('contains valid preset for the Uzbek National Anthem', () => {
    const anthem = PRESETS.find(
      (p) =>
        p.id === 'anthem' ||
        p.title.toLowerCase().includes('madhiya') ||
        p.title.toLowerCase().includes('anthem')
    );

    expect(anthem).toBeDefined();
    expect(anthem!.id).toBe('anthem');
    expect(anthem!.title).toContain('Madhiya');
    expect(anthem!.category).toBe('anthem');
    expect(anthem!.text).toContain('Serquyosh');
    expect(anthem!.text).toContain('O‘zbekiston');
    expect(anthem!.text).toContain('hur o‘lkam');
    expect(anthem!.text).toContain('Ulug‘ xalq');
    expect(anthem!.text.length).toBeGreaterThan(50);
  });

  it('contains valid preset for the High School History / Constitution Exam Question', () => {
    const exam = PRESETS.find(
      (p) =>
        p.id === 'history-exam' ||
        p.title.toLowerCase().includes('tarix') ||
        p.title.toLowerCase().includes('imtihon')
    );

    expect(exam).toBeDefined();
    expect(exam!.id).toBe('history-exam');
    expect(exam!.title).toContain('Imtihon');
    expect(exam!.category).toBe('exam');
    expect(exam!.text).toContain('Konstitutsiyasi');
    expect(exam!.text).toContain('1992');
    expect(exam!.text).toContain('inson qadri');
    expect(exam!.text.length).toBeGreaterThan(50);
  });

  it('contains valid preset for orthography practice exercising modified letters and digraphs', () => {
    const orthography = PRESETS.find((p) => p.id === 'orthography-practice');
    expect(orthography).toBeDefined();
    expect(orthography!.text).toContain('G‘afur');
    expect(orthography!.text).toContain('O‘tkir');
    expect(orthography!.text).toContain('shahar');
    expect(orthography!.text).toContain('chuqur');
  });

  it('contains valid preset for mathematics and numerals testing Braille number prefixing', () => {
    const math = PRESETS.find((p) => p.id === 'math-formula');
    expect(math).toBeDefined();
    expect(math!.text).toContain('2024');
    expect(math!.text).toContain('12 + 34 = 46');
  });

  it('contains valid preset for classic Uzbek literature (Abdulla Qodiriy)', () => {
    const lit = PRESETS.find((p) => p.id === 'literature-sample');
    expect(lit).toBeDefined();
    expect(lit!.title).toContain('Abdulla Qodiriy');
    expect(lit!.text).toContain('Toshkent');
  });

  it('verifies every preset has required fields with valid non-empty string content', () => {
    PRESETS.forEach((preset) => {
      expect(typeof preset.id).toBe('string');
      expect(preset.id.trim().length).toBeGreaterThan(0);

      expect(typeof preset.title).toBe('string');
      expect(preset.title.trim().length).toBeGreaterThan(0);

      expect(typeof preset.text).toBe('string');
      expect(preset.text.trim().length).toBeGreaterThan(0);
    });
  });

  it('guarantees unique IDs across all educational presets', () => {
    const ids = PRESETS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('transliterates each preset into valid Unicode Braille range U+2800..U+283F', () => {
    PRESETS.forEach((preset) => {
      const braille = transliterateToBraille(preset.text);
      expect(braille.length).toBeGreaterThan(0);

      // Verify all characters in braille output are within valid Braille range U+2800..U+283F or newline
      for (const char of braille) {
        if (char === '\n') continue;
        const code = char.charCodeAt(0);
        expect(code).toBeGreaterThanOrEqual(0x2800);
        expect(code).toBeLessThanOrEqual(0x283f);
      }
    });
  });
});
