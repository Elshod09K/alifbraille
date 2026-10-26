import { normalizeUzbekText, UZBEK_APOSTROPHE_CHARS } from './normalizer.js';

/**
 * Standard Braille numeral sign prefix (dots 3-4-5-6: ⠼ / U+283C).
 */
export const BRAILLE_NUMBER_PREFIX: '⠼' = '⠼';

/**
 * Unicode regex pattern matching standard and variant apostrophes
 * commonly typed for Uzbek modified letters (oʻ, gʻ) and tutuq belgisi.
 */
const APOSTROPHE_REGEX = new RegExp(`[${UZBEK_APOSTROPHE_CHARS}]`);

/**
 * Uzbek Latin-to-Braille mapping table adhering strictly to the 6-dot
 * tactile Braille standard (Unicode range U+2800..U+283F).
 * Maps:
 * - 29 Uzbek Latin letters and digraphs
 * - Unicode apostrophe variants for oʻ and gʻ
 * - Digits (prefixed by ⠼ in Braille)
 * - Standard punctuation marks and whitespace
 */
export const BRAILLE_MAP: Readonly<Record<string, string>> = Object.freeze({
  // Latin alphabet
  a: '⠁', // dots 1
  b: '⠃', // dots 1-2
  c: '⠉', // dots 1-4 (used in digraph ch or loanwords)
  d: '⠙', // dots 1-4-5
  e: '⠑', // dots 1-5
  f: '⠋', // dots 1-2-4
  g: '⠛', // dots 1-2-4-5
  h: '⠓', // dots 1-2-5
  i: '⠊', // dots 2-4
  j: '⠚', // dots 2-4-5
  k: '⠅', // dots 1-3
  l: '⠇', // dots 1-2-3
  m: '⠍', // dots 1-3-4
  n: '⠝', // dots 1-3-4-5
  o: '⠕', // dots 1-3-5
  p: '⠏', // dots 1-2-3-4
  q: '⠟', // dots 1-2-3-4-5
  r: '⠗', // dots 1-2-3-5
  s: '⠎', // dots 2-3-4
  t: '⠞', // dots 2-3-4-5
  u: '⠥', // dots 1-3-6
  v: '⠺', // dots 2-4-5-6 (Uzbek tactile standard)
  w: '⠺', // dots 2-4-5-6 (loanwords)
  x: '⠭', // dots 1-3-4-6
  y: '⠽', // dots 1-3-4-5-6
  z: '⠵', // dots 1-3-5-6

  // Modified letters (oʻ, gʻ) across Unicode apostrophe variants
  // oʻ / o‘ corresponds to dots 1-2-3-6 (⠧ / U+2827)
  'oʻ': '⠧',
  'o‘': '⠧',
  'o’': '⠧',
  "o'": '⠧',
  'o`': '⠧',
  'o´': '⠧',
  'oʼ': '⠧',

  // gʻ / g‘ corresponds to dots 1-2-4-5-6 (⠻ / U+283B)
  'gʻ': '⠻',
  'g‘': '⠻',
  'g’': '⠻',
  "g'": '⠻',
  'g`': '⠻',
  'g´': '⠻',
  'gʼ': '⠻',

  // Digraphs (sh, ch, ng)
  sh: '⠱', // dots 1-5-6 (⠱ / U+2831)
  ch: '⠟', // dots 1-2-3-4-5 (⠟ / U+281F)
  ng: '⠝⠛', // dots 1-3-4-5 + dots 1-2-4-5 (⠝⠛)

  // Digits (prefixed by ⠼ in Braille numbers)
  '1': '⠁', // dots 1
  '2': '⠃', // dots 1-2
  '3': '⠉', // dots 1-4
  '4': '⠙', // dots 1-4-5
  '5': '⠑', // dots 1-5
  '6': '⠋', // dots 1-2-4
  '7': '⠛', // dots 1-2-4-5
  '8': '⠓', // dots 1-2-5
  '9': '⠊', // dots 2-4
  '0': '⠚', // dots 2-4-5

  // Whitespace
  ' ': '⠀', // U+2800 Braille pattern blank
  '\t': '⠀',

  // Punctuation marks
  '.': '⠲', // dots 2-5-6
  ',': '⠂', // dot 2
  ';': '⠆', // dots 2-3
  ':': '⠒', // dots 2-5
  '!': '⠖', // dots 2-3-5
  '?': '⠦', // dots 2-3-6
  '-': '⠤', // dots 3-6
  '—': '⠤', // em dash mapped to Braille hyphen
  '–': '⠤', // en dash mapped to Braille hyphen
  '(': '⠶', // dots 2-3-5-6
  ')': '⠶', // dots 2-3-5-6
  '[': '⠶',
  ']': '⠶',
  '{': '⠶',
  '}': '⠶',
  '«': '⠦', // open guillemet
  '»': '⠴', // close guillemet
  '"': '⠦', // neutral quote
  '“': '⠦', // left double quote
  '”': '⠴', // right double quote
  '/': '⠌', // dots 3-4

  // Tutuq belgisi (apostrophe when standing alone)
  "'": '⠄', // dot 3
  '‘': '⠄',
  '’': '⠄',
  'ʻ': '⠄',
  'ʼ': '⠄',
  '`': '⠄',
});

/**
 * Maps a single Uzbek character or recognized digraph to its Unicode Braille representation.
 * Case-insensitive lookup.
 */
export function charToBraille(charOrDigraph: string): string {
  if (!charOrDigraph) return '';
  const key = charOrDigraph.toLowerCase();

  // Direct lookup
  if (BRAILLE_MAP[key] !== undefined) {
    return BRAILLE_MAP[key];
  }

  // Handle o / g with apostrophe variants if passed as digraph
  if (key.length >= 2) {
    const first = key[0];
    const second = key.slice(1);
    if ((first === 'o' || first === 'g') && APOSTROPHE_REGEX.test(second)) {
      const canonicalKey = first === 'o' ? 'oʻ' : 'gʻ';
      return BRAILLE_MAP[canonicalKey] ?? '';
    }
  }

  return '';
}

/**
 * Transliterates Uzbek Latin text to 6-dot Unicode Braille string (U+2800..U+283F).
 *
 * Key behaviors:
 * 1. Handles modified letters (oʻ, gʻ) across Unicode apostrophe variants (U+02BB, U+2018, U+2019, U+0027, etc.)
 * 2. Transliterates digraphs (sh, ch, ng) into standard tactile equivalents
 * 3. Correctly prepends Braille numeral signs (⠼ / U+283C) to multi-digit numbers (e.g., '1991' -> '⠼⠁⠊⠊⠁')
 * 4. Resumes letter context immediately after numbers without unwanted numeral prefixes on subsequent letters
 * 5. Guarantees all tactile characters reside strictly within Unicode Braille range U+2800..U+283F
 */
export function transliterateToBraille(text: string): string {
  if (!text) return '';

  const normalized = normalizeUzbekText(text);
  let result = '';
  let inNumberMode = false;
  let i = 0;
  const len = normalized.length;

  while (i < len) {
    const char = normalized[i];
    const nextChar = i + 1 < len ? normalized[i + 1] : '';

    // Handle escaped digraphs (e.g. \sh, \ch, \ng) by skipping escape prefix
    // and mapping first letter individually
    if (char === '\\' && i + 1 < len) {
      const nextTwo = normalized.slice(i + 1, i + 3).toLowerCase();
      if (nextTwo === 'sh' || nextTwo === 'ch' || nextTwo === 'ng') {
        i++; // skip backslash
        const escapedChar = normalized[i];
        const mapped = BRAILLE_MAP[escapedChar.toLowerCase()];
        if (mapped !== undefined) {
          result += mapped;
        }
        i++;
        continue;
      }
    }

    // 1. Digits: handle numeral prefixing (⠼) and number mode
    if (char >= '0' && char <= '9') {
      if (!inNumberMode) {
        result += BRAILLE_NUMBER_PREFIX;
        inNumberMode = true;
      }
      result += BRAILLE_MAP[char] ?? '';
      i++;
      continue;
    }

    // Encountered non-digit: restore letter/text context
    inNumberMode = false;

    // 2. Check for modified letters: oʻ and gʻ with any apostrophe variant
    const charLower = char.toLowerCase();
    const nextLower = nextChar.toLowerCase();

    if ((charLower === 'o' || charLower === 'g') && APOSTROPHE_REGEX.test(nextChar)) {
      const key = charLower === 'o' ? 'oʻ' : 'gʻ';
      result += BRAILLE_MAP[key] ?? '';
      i += 2;
      continue;
    }

    // 3. Check for standard digraphs: sh, ch, ng
    if (charLower === 's' && nextLower === 'h') {
      result += BRAILLE_MAP['sh'] ?? '';
      i += 2;
      continue;
    }

    if (charLower === 'c' && nextLower === 'h') {
      result += BRAILLE_MAP['ch'] ?? '';
      i += 2;
      continue;
    }

    if (charLower === 'n' && nextLower === 'g') {
      result += BRAILLE_MAP['ng'] ?? '';
      i += 2;
      continue;
    }

    // 4. Line breaks: preserve formatting
    if (char === '\n') {
      result += '\n';
      i++;
      continue;
    }

    if (char === '\r') {
      i++;
      continue;
    }

    // 5. Single character mapping (letters, punctuation, whitespace, tutuq belgisi)
    const mapped = BRAILLE_MAP[charLower] ?? BRAILLE_MAP[char];
    if (mapped !== undefined) {
      result += mapped;
    } else {
      // If character is already a Unicode Braille code point (U+2800..U+283F), preserve it
      const code = char.charCodeAt(0);
      if (code >= 0x2800 && code <= 0x283f) {
        result += char;
      }
      // Otherwise skip unmapped characters gracefully
    }
    i++;
  }

  return result;
}
