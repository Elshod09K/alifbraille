/**
 * Phonetic transliteration helpers for Uzbek Latin text.
 * Converts Uzbek Latin orthography (o‘, g‘, sh, ch, ng, etc.) into phonetic approximations
 * suitable for text-to-speech synthesis engines when native uz-UZ voices are absent.
 */

import { normalizeUzbekText, UZBEK_APOSTROPHE_CHARS } from '../normalizer.js';

export type PhoneticTargetMode = 'latin' | 'turkish' | 'cyrillic';

/**
 * Regular expression matching any supported Uzbek apostrophe character.
 */
const APOSTROPHE_REGEX = new RegExp(`[${UZBEK_APOSTROPHE_CHARS}]`, 'g');
const SINGLE_APOSTROPHE_LOOKAHEAD = new RegExp(`^[${UZBEK_APOSTROPHE_CHARS}]`);

/**
 * Uzbek Latin to Cyrillic letter mapping table for fallback Russian TTS engines.
 */
const UZBEK_TO_CYRILLIC_MAP: Record<string, string> = {
  a: 'а', b: 'б', d: 'д', f: 'ф', g: 'г', h: 'ҳ',
  i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о',
  p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в',
  x: 'х', y: 'й', z: 'з',
  A: 'А', B: 'Б', D: 'Д', F: 'Ф', G: 'Г', H: 'Ҳ',
  I: 'И', J: 'Ж', K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О',
  P: 'П', Q: 'Қ', R: 'Р', S: 'С', T: 'Т', U: 'У', V: 'В',
  X: 'Х', Y: 'Й', Z: 'З',
};

/**
 * Converts Uzbek Latin text into Latin phonetic approximations
 * eliminating disruptive apostrophe pauses and mapping digraphs for TTS.
 *
 * - o‘ / O‘ -> o / O
 * - g‘ / G‘ -> gh / Gh
 * - sh / ch / ng -> preserved smooth Latin digraphs
 * - tutuq belgisi (standalone apostrophe) -> stripped so TTS does not say "apostrophe"
 */
export function convertToPhoneticLatin(text: string): string {
  if (!text) return '';
  const normalized = normalizeUzbekText(text);

  let result = '';
  let i = 0;
  const len = normalized.length;

  while (i < len) {
    const char = normalized[i];
    const nextChar = i + 1 < len ? normalized[i + 1] : '';

    // Check for modified letters: o‘ / g‘
    const isO = char === 'o' || char === 'O';
    const isG = char === 'g' || char === 'G';

    if ((isO || isG) && SINGLE_APOSTROPHE_LOOKAHEAD.test(nextChar)) {
      if (isO) {
        result += char; // 'o' or 'O' without disruptive apostrophe
      } else {
        // g‘ -> gh / Gh / GH
        const isUpper = char === 'G';
        const nextNext = i + 2 < len ? normalized[i + 2] : '';
        const isAllUpper = isUpper && nextNext === nextNext.toUpperCase() && /[A-Z]/.test(nextNext);
        result += isUpper ? (isAllUpper ? 'GH' : 'Gh') : 'gh';
      }
      i += 2;
      continue;
    }

    // Check for tutuq belgisi (apostrophe in middle of word, e.g. ta'lim, a'lo)
    if (SINGLE_APOSTROPHE_LOOKAHEAD.test(char)) {
      // Omit apostrophe to prevent TTS stutter / "apostrophe" announcement
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Converts Uzbek Latin text into Turkish phonetic equivalents for Turkic TTS engines.
 * Turkish TTS engines (tr-TR) provide high-accuracy phonetics for Turkic vowels and consonants:
 * - o‘ -> ö
 * - g‘ -> ğ
 * - sh -> ş
 * - ch -> ç
 * - ng -> ñ / ng
 */
export function convertToPhoneticTurkish(text: string): string {
  if (!text) return '';
  const normalized = normalizeUzbekText(text);

  let result = '';
  let i = 0;
  const len = normalized.length;

  while (i < len) {
    const char = normalized[i];
    const nextChar = i + 1 < len ? normalized[i + 1] : '';

    // Modified letters: o‘, g‘
    const isO = char === 'o' || char === 'O';
    const isG = char === 'g' || char === 'G';

    if ((isO || isG) && SINGLE_APOSTROPHE_LOOKAHEAD.test(nextChar)) {
      if (isO) {
        result += char === 'O' ? 'Ö' : 'ö';
      } else {
        result += char === 'G' ? 'Ğ' : 'ğ';
      }
      i += 2;
      continue;
    }

    // Digraphs: sh, ch
    const charLower = char.toLowerCase();
    if (charLower === 's' && nextChar.toLowerCase() === 'h') {
      result += char === 'S' ? 'Ş' : 'ş';
      i += 2;
      continue;
    }

    if (charLower === 'c' && nextChar.toLowerCase() === 'h') {
      result += char === 'C' ? 'Ç' : 'ç';
      i += 2;
      continue;
    }

    // Digraph: ng
    if (charLower === 'n' && nextChar.toLowerCase() === 'g') {
      result += char === 'N' ? 'Ñ' : 'ñ';
      i += 2;
      continue;
    }

    // Tutuq belgisi
    if (SINGLE_APOSTROPHE_LOOKAHEAD.test(char)) {
      i++;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Converts Uzbek Latin text into Cyrillic phonetic equivalents for Russian TTS engines (ru-RU).
 * Common in Central Asian boarding schools where Russian voices (Irina, Milena) are standard:
 * - o‘ -> ў
 * - g‘ -> ғ
 * - sh -> ш
 * - ch -> ч
 * - ng -> нг
 * - tutuq -> ъ
 */
export function convertToPhoneticCyrillic(text: string): string {
  if (!text) return '';
  const normalized = normalizeUzbekText(text);

  let result = '';
  let i = 0;
  const len = normalized.length;

  while (i < len) {
    const char = normalized[i];
    const nextChar = i + 1 < len ? normalized[i + 1] : '';

    // Digraphs starting with y (ya, yu, yo, ye)
    const isY = char === 'y' || char === 'Y';
    if (isY && nextChar) {
      const nextLower = nextChar.toLowerCase();
      let mappedY: string | null = null;
      if (nextLower === 'a') mappedY = char === 'Y' ? 'Я' : 'я';
      else if (nextLower === 'u') mappedY = char === 'Y' ? 'Ю' : 'ю';
      else if (nextLower === 'o') mappedY = char === 'Y' ? 'Ё' : 'ё';
      else if (nextLower === 'e') mappedY = char === 'Y' ? 'Е' : 'е';

      if (mappedY) {
        result += mappedY;
        i += 2;
        continue;
      }
    }

    // Modified letters: o‘, g‘
    const isO = char === 'o' || char === 'O';
    const isG = char === 'g' || char === 'G';

    if ((isO || isG) && SINGLE_APOSTROPHE_LOOKAHEAD.test(nextChar)) {
      if (isO) {
        result += char === 'O' ? 'Ў' : 'ў';
      } else {
        result += char === 'G' ? 'Ғ' : 'ғ';
      }
      i += 2;
      continue;
    }

    // Digraphs: sh, ch, ng
    const charLower = char.toLowerCase();
    if (charLower === 's' && nextChar.toLowerCase() === 'h') {
      result += char === 'S' ? 'Ш' : 'ш';
      i += 2;
      continue;
    }

    if (charLower === 'c' && nextChar.toLowerCase() === 'h') {
      result += char === 'C' ? 'Ч' : 'ч';
      i += 2;
      continue;
    }

    // Digraph: ts -> ц
    if (charLower === 't' && nextChar.toLowerCase() === 's') {
      result += char === 'T' ? 'Ц' : 'ц';
      i += 2;
      continue;
    }

    if (charLower === 'n' && nextChar.toLowerCase() === 'g') {
      const isUpperN = char === 'N';
      const isUpperG = nextChar === 'G';
      result += isUpperN ? (isUpperG ? 'НГ' : 'Нг') : 'нг';
      i += 2;
      continue;
    }

    // Tutuq belgisi
    if (SINGLE_APOSTROPHE_LOOKAHEAD.test(char)) {
      result += 'ъ';
      i++;
      continue;
    }

    // Special handling for Uzbek 'e' / 'E':
    // At word boundary or after vowel / apostrophe -> 'э' / 'Э'
    // After consonant -> 'е' / 'Е'
    if (charLower === 'e') {
      const prevChar = i > 0 ? normalized[i - 1].toLowerCase() : '';
      const isWordStart = i === 0 || !/[a-z0-9]/i.test(prevChar);
      const isAfterVowel = /[aeiou]/.test(prevChar);
      const useEOborotnoye = isWordStart || isAfterVowel;

      if (char === 'E') {
        result += useEOborotnoye ? 'Э' : 'Е';
      } else {
        result += useEOborotnoye ? 'э' : 'е';
      }
      i++;
      continue;
    }

    // Standalone Latin letters
    if (UZBEK_TO_CYRILLIC_MAP[char] !== undefined) {
      result += UZBEK_TO_CYRILLIC_MAP[char];
    } else {
      result += char;
    }
    i++;
  }

  return result;
}

/**
 * Resolves target phonetic mode from voice language or target identifier.
 */
export function resolvePhoneticMode(targetOrLang?: string): PhoneticTargetMode {
  if (!targetOrLang) return 'latin';
  const lower = targetOrLang.toLowerCase();

  if (lower.startsWith('ru') || lower === 'cyrillic' || lower.includes('russian')) {
    return 'cyrillic';
  }
  if (lower.startsWith('tr') || lower === 'turkish') {
    return 'turkish';
  }
  return 'latin';
}

/**
 * Normalizes Uzbek Latin text and converts orthographic digraphs and modified letters
 * (o‘, g‘, sh, ch, ng) into phonetic equivalents for fallback speech synthesizers.
 *
 * @param text - Source Uzbek Latin text
 * @param targetOrLang - Optional target voice lang (e.g. 'ru-RU', 'tr-TR', 'en-US') or mode ('latin' | 'turkish' | 'cyrillic')
 * @returns Phonetically transliterated text suitable for speech synthesis
 */
export function getPhoneticFallbackText(text: string, targetOrLang?: string): string {
  if (!text) return '';
  const mode = resolvePhoneticMode(targetOrLang);

  switch (mode) {
    case 'cyrillic':
      return convertToPhoneticCyrillic(text);
    case 'turkish':
      return convertToPhoneticTurkish(text);
    case 'latin':
    default:
      return convertToPhoneticLatin(text);
  }
}
