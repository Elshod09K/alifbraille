import type { UzbekToken, UzbekTokenType } from './types.js';

export type { UzbekToken, UzbekTokenType };

/**
 * Unicode characters commonly used as apostrophes or quotation marks
 * after Uzbek letters 'o' and 'g' (e.g. in o‘ and g‘).
 *
 * Included:
 * - U+02BB: Modifier Letter Turned Comma (ʻ - official canonical Uzbek character)
 * - U+2018: Left Single Quotation Mark (‘ - standard Word/typography variant)
 * - U+2019: Right Single Quotation Mark (’ - typographic apostrophe)
 * - U+0027: Apostrophe (' - ASCII standard)
 * - U+0060: Grave Accent (` - backtick)
 * - U+02BC: Modifier Letter Apostrophe (ʼ - tutuq belgisi)
 * - U+00B4: Acute Accent (´)
 * - U+201B: Single High-Reversed-9 Quotation Mark (‛)
 * - U+2032: Prime (′)
 * - U+02BD: Modifier Letter Reversed Comma (ʽ)
 * - U+02BE: Modifier Letter Right Half Ring (ʾ)
 * - U+02BF: Modifier Letter Left Half Ring (ʿ)
 * - U+0312..U+0315: Combining comma/turned-comma accents
 */
export const UZBEK_APOSTROPHE_CHARS =
  '\u02BB\u02BC\u2018\u2019\u0027\u0060\u00B4\u201B\u2032\u02BD\u02BE\u02BF\u0312\u0313\u0314\u0315';

/**
 * Regular expression matching Latin 'o', 'O', 'g', 'G' (as well as Cyrillic equivalents)
 * followed immediately by an apostrophe variant.
 */
const O_G_APOSTROPHE_REGEX = new RegExp(`([oOgG\u041E\u043E\u0413\u0433])[${UZBEK_APOSTROPHE_CHARS}]`, 'g');

/**
 * Normalizes Uzbek Latin text standardizing Unicode apostrophe variants
 * (such as U+02BB, U+2018, U+2019, U+0027, U+0060) for o‘ and g‘ into the
 * standard modifier letter turned comma (ʻ / U+02BB).
 *
 * Preserves all surrounding letters and casing.
 */
export function normalizeUzbekText(text: string): string {
  if (!text) return '';

  return text.replace(O_G_APOSTROPHE_REGEX, (_match, letter: string) => {
    // Map Cyrillic homoglyphs to Latin if pasted inadvertently
    if (letter === '\u041E') return 'O\u02BB';
    if (letter === '\u043E') return 'o\u02BB';
    if (letter === '\u0413') return 'G\u02BB';
    if (letter === '\u0433') return 'g\u02BB';

    // Standard Latin o / O / g / G followed by standard modifier letter turned comma (ʻ)
    return `${letter}\u02BB`;
  });
}

/** Set of valid apostrophe character codes for fast lookup */
const APOSTROPHE_SET = new Set(Array.from(UZBEK_APOSTROPHE_CHARS));

/** Recognized 2-letter Uzbek Latin digraphs in lowercase */
const DIGRAPHS = new Set(['sh', 'ch', 'ng']);

/**
 * Checks if a character is punctuation or symbol.
 */
function isPunctuationChar(char: string): boolean {
  // Check apostrophe-like chars
  if (APOSTROPHE_SET.has(char)) return true;
  // Unicode punctuation or symbol category
  return /\p{P}|\p{S}/u.test(char);
}

/**
 * Checks if a character is whitespace.
 */
function isWhitespaceChar(char: string): boolean {
  return /\s/u.test(char);
}

/**
 * Checks if a character is a digit (0-9).
 */
function isNumberChar(char: string): boolean {
  return /[0-9]/.test(char);
}

/**
 * Checks if a character is a Unicode letter.
 */
function isLetterChar(char: string): boolean {
  return /\p{L}/u.test(char);
}

/**
 * Tokenizes normalized or unnormalized Uzbek Latin text into structural tokens
 * for Braille conversion, identifying letters, modified letters (oʻ, gʻ),
 * digraphs (sh, ch, ng), numbers, punctuation, and whitespace.
 *
 * Supports escaping digraphs via backslash (e.g. '\sh') or separators
 * (e.g. ZWNJ U+200C, apostrophe as in "Is'hoq", or hyphen).
 *
 * Preserves original whitespace, line breaks, and raw characters verbatim.
 */
export function tokenizeUzbekText(text: string): UzbekToken[] {
  if (!text) return [];

  const tokens: UzbekToken[] = [];
  const len = text.length;
  let i = 0;
  let escapeNextDigraph = false;

  while (i < len) {
    const char = text[i];
    const nextChar = i + 1 < len ? text[i + 1] : '';

    // 1. Check for backslash escape immediately preceding a digraph (\sh, \ch, \ng)
    if (char === '\\' && !escapeNextDigraph) {
      const nextTwo = text.slice(i + 1, i + 3).toLowerCase();
      if (DIGRAPHS.has(nextTwo)) {
        tokens.push({
          type: 'punctuation',
          raw: char,
          normalized: char,
          isUppercase: false,
        });
        escapeNextDigraph = true;
        i++;
        continue;
      }
    }

    // 2. Check for modified letters: oʻ or gʻ (o/O/g/G followed by any apostrophe variant)
    const lowerChar = char.toLowerCase();
    if ((lowerChar === 'o' || lowerChar === 'g') && nextChar && APOSTROPHE_SET.has(nextChar)) {
      const raw = text.slice(i, i + 2);
      const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
      const normLetter = lowerChar === 'o' ? 'o\u02BB' : 'g\u02BB';

      tokens.push({
        type: 'letter',
        raw,
        normalized: normLetter,
        isUppercase: isUpper,
      });

      i += 2;
      escapeNextDigraph = false;
      continue;
    }

    // 3. Check for digraphs: sh, ch, ng (case-insensitive) unless escaped
    const twoChars = text.slice(i, i + 2);
    const twoCharsLower = twoChars.toLowerCase();
    if (DIGRAPHS.has(twoCharsLower)) {
      if (escapeNextDigraph) {
        // Escaped: emit first letter individually as 'letter', reset escape flag
        const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
        tokens.push({
          type: 'letter',
          raw: char,
          normalized: char.toLowerCase(),
          isUppercase: isUpper,
        });
        escapeNextDigraph = false;
        i++;
        continue;
      }

      // Valid unescaped digraph
      const isUpper = twoChars[0] === twoChars[0].toUpperCase() && twoChars[0] !== twoChars[0].toLowerCase();
      tokens.push({
        type: 'digraph',
        raw: twoChars,
        normalized: twoCharsLower,
        isUppercase: isUpper,
      });

      i += 2;
      continue;
    }

    // Reset escape flag if any other character is processed
    escapeNextDigraph = false;

    // 4. Whitespace (preserve verbatim, including \n, \r, \t, etc.)
    if (isWhitespaceChar(char)) {
      tokens.push({
        type: 'whitespace',
        raw: char,
        normalized: char,
        isUppercase: false,
      });
      i++;
      continue;
    }

    // 5. Digits (0-9)
    if (isNumberChar(char)) {
      tokens.push({
        type: 'number',
        raw: char,
        normalized: char,
        isUppercase: false,
      });
      i++;
      continue;
    }

    // 6. Regular single letter
    if (isLetterChar(char)) {
      const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
      tokens.push({
        type: 'letter',
        raw: char,
        normalized: char.toLowerCase(),
        isUppercase: isUpper,
      });
      i++;
      continue;
    }

    // 7. Punctuation
    if (isPunctuationChar(char)) {
      tokens.push({
        type: 'punctuation',
        raw: char,
        normalized: char,
        isUppercase: false,
      });
      i++;
      continue;
    }

    // 8. Unknown / unclassified character (e.g. ZWNJ \u200C, control chars)
    tokens.push({
      type: 'unknown',
      raw: char,
      normalized: char,
      isUppercase: false,
    });
    i++;
  }

  return tokens;
}
